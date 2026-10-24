import {
  DEFAULT_SIMULATION_PARAMS,
  SIMULATION_CONFIG,
  SIMULATION_STATUS,
  SCALING_MODES,
} from './simulationConfig.js';
import { computeIncomingRate, computeArrivals } from './workloadModel.js';
import { stepQueue, applyFailureSplit, isQueueWarning } from './queueModel.js';
import { estimateLatency } from './latencyModel.js';
import {
  resolveDesiredPodCount,
  canScaleNow,
  countRunningPods,
} from './scalingModel.js';
import {
  createInitialPods,
  resetPodIdCounter,
  applyActorDistribution,
  updatePodLifecycles,
  scalePodsTowardTarget,
  assignPodMetrics,
} from './podLifecycleModel.js';
import {
  clampWorkload,
  computeCapacity,
  computeCpuUtilization,
  rollingAverage,
  percentile,
} from '../utils/simulationMath.js';

function createEmptyHistory() {
  return {
    timestamps: [],
    incoming: [],
    throughput: [],
    cpu: [],
    queue: [],
    latency: [],
    pods: [],
  };
}

function createMetricsSnapshot() {
  return {
    targetRate: 0,
    incomingRate: 0,
    throughput: 0,
    totalReceived: 0,
    totalProcessed: 0,
    totalFailed: 0,
    queue: 0,
    latency: 0,
    latencyP95: 0,
    cpuUtil: 0,
    cpuUtilSmoothed: 0,
    memoryUtil: 0,
    activePods: 0,
    desiredPods: 0,
    startingPods: 0,
    capacity: 0,
    capacityUtilization: 0,
    actorCount: 0,
    capacityWarning: false,
  };
}

export function createInitialEngineState(params = DEFAULT_SIMULATION_PARAMS) {
  resetPodIdCounter();
  const pods = createInitialPods(params.initialPods);
  return {
    status: SIMULATION_STATUS.IDLE,
    simTime: 0,
    params: { ...DEFAULT_SIMULATION_PARAMS, ...params },
    queue: 0,
    arrivalRemainder: 0,
    totalReceived: 0,
    totalProcessed: 0,
    totalFailed: 0,
    pods,
    desiredPods: params.initialPods,
    lastScaleTime: -Infinity,
    pendingDesiredPods: params.initialPods,
    stabilizationSince: 0,
    lastIncomingRate: 0,
    cpuHistory: [],
    latencySamples: [],
    metrics: createMetricsSnapshot(),
    history: createEmptyHistory(),
    events: [],
    intervalProcessed: 0,
    intervalArrivals: 0,
    intervalDuration: 0,
    previousQueueWarning: false,
    previousCpuThresholdCrossed: false,
    previousCapacityWarning: false,
  };
}

function pushHistory(history, point) {
  const max = SIMULATION_CONFIG.METRIC_HISTORY_MAX;
  const next = { ...history };
  for (const key of Object.keys(next)) {
    const value = key === 'timestamps' ? point.time ?? 0 : point[key] ?? 0;
    next[key] = [...next[key], value];
    if (next[key].length > max) {
      next[key] = next[key].slice(-max);
    }
  }
  return next;
}

function appendEvents(events, newEvents, simTime) {
  const stamped = newEvents.map((e) => ({
    id: `${simTime}-${e.type}-${e.podId ?? Math.random()}`,
    simTime,
    ...e,
  }));
  const combined = [...stamped, ...events];
  return combined.slice(0, SIMULATION_CONFIG.EVENT_HISTORY_MAX);
}

function aggregateMemoryUtil(pods) {
  const running = pods.filter((p) => p.status === 'Running');
  if (!running.length) return 0;
  return running.reduce((sum, p) => sum + p.memoryUtil, 0) / running.length;
}

/**
 * Advance simulation by dt simulated seconds (pure step).
 */
export function stepSimulation(state, dt = SIMULATION_CONFIG.DEFAULT_TIMESTEP) {
  if (state.status !== SIMULATION_STATUS.RUNNING) {
    return state;
  }

  const params = state.params;
  let events = [];
  let pods = [...state.pods];
  let simTime = state.simTime + dt;

  const lambda = computeIncomingRate(params, simTime);
  const { arrivals, newRemainder } = computeArrivals(
    lambda,
    dt,
    state.arrivalRemainder,
  );

  const lifecycle = updatePodLifecycles(pods, simTime, dt);
  pods = lifecycle.pods;
  events = events.concat(lifecycle.events);

  const desired = resolveDesiredPodCount(
    params,
    lambda,
    countRunningPods(pods),
  );

  let pendingDesired = state.pendingDesiredPods;
  let lastScaleTime = state.lastScaleTime;
  let stabilizationSince = state.stabilizationSince;

  if (desired !== pendingDesired) {
    if (stabilizationSince === 0) {
      stabilizationSince = simTime;
    }
  } else {
    stabilizationSince = 0;
  }

  const stabilized =
    stabilizationSince > 0 &&
    simTime - stabilizationSince >= SIMULATION_CONFIG.SCALING_STABILIZATION;

  if (
    params.scalingMode === SCALING_MODES.AUTOMATIC &&
    desired !== countActiveNonTerminating(pods) &&
    stabilized &&
    canScaleNow(simTime, lastScaleTime)
  ) {
    const from = countActiveNonTerminating(pods);
    events.push({
      type: 'scaling_decision',
      message: `Scaling decision (simulated): ${from} → ${desired} pods.`,
      from,
      to: desired,
    });
    const scaled = scalePodsTowardTarget(pods, desired, simTime);
    pods = scaled.pods;
    events = events.concat(scaled.events);
    lastScaleTime = simTime;
    pendingDesired = desired;
    stabilizationSince = 0;
    events.push({
      type: 'actor_rebalance',
      message: 'Simulated actor redistribution completed.',
    });
  } else if (params.scalingMode === SCALING_MODES.MANUAL) {
    const manualTarget = desired;
    if (manualTarget !== countActiveNonTerminating(pods)) {
      const scaled = scalePodsTowardTarget(pods, manualTarget, simTime);
      if (scaled.events.length) {
        pods = scaled.pods;
        events = events.concat(scaled.events);
        events.push({
          type: 'actor_rebalance',
          message: 'Simulated actor redistribution completed (manual).',
        });
      }
    }
    pendingDesired = manualTarget;
  } else {
    pendingDesired = desired;
  }

  pods = applyActorDistribution(pods, params.actorCount);

  const runningCount = countRunningPods(pods);
  const capacity = computeCapacity(runningCount);

  const { processed, nextQueue } = stepQueue(state.queue, arrivals, capacity, dt);
  const { successful, failed } = applyFailureSplit(processed, params.failureRate);

  pods = pods.map((pod) => {
    if (pod.status !== 'Running' || runningCount === 0) return pod;
    const share = successful / runningCount;
    return { ...pod, processedMessages: pod.processedMessages + share };
  });

  pods = assignPodMetrics(pods, lambda, runningCount);

  const cpuRaw = computeCpuUtilization(lambda, capacity);
  const cpuHistory = [...state.cpuHistory, cpuRaw].slice(
    -SIMULATION_CONFIG.CPU_SMOOTHING_WINDOW,
  );
  const cpuSmoothed = rollingAverage(cpuHistory, SIMULATION_CONFIG.CPU_SMOOTHING_WINDOW);

  const latency = estimateLatency(nextQueue, capacity, lambda);
  const latencySamples = [...state.latencySamples, latency].slice(
    -SIMULATION_CONFIG.LATENCY_SAMPLE_MAX,
  );

  const intervalProcessed = state.intervalProcessed + successful;
  const intervalArrivals = state.intervalArrivals + arrivals;
  const intervalDuration = state.intervalDuration + dt;

  let throughput = state.metrics.throughput;
  if (intervalDuration >= 1) {
    throughput = intervalProcessed / intervalDuration;
  }

  const totalReceived = state.totalReceived + arrivals;
  const totalProcessed = state.totalProcessed + successful;
  const totalFailed = state.totalFailed + failed;

  const capacityWarning =
    runningCount >= params.maxPods &&
    lambda > capacity &&
    nextQueue > state.queue;

  const metrics = {
    targetRate: clampWorkload(params.targetWorkload),
    incomingRate: lambda,
    throughput,
    totalReceived,
    totalProcessed,
    totalFailed,
    queue: nextQueue,
    latency,
    latencyP95: percentile(latencySamples, 95),
    cpuUtil: cpuRaw,
    cpuUtilSmoothed: cpuSmoothed,
    memoryUtil: aggregateMemoryUtil(pods),
    activePods: runningCount,
    desiredPods: pendingDesired,
    startingPods: pods.filter((p) => p.status === 'Starting').length,
    capacity,
    capacityUtilization: capacity > 0 ? Math.min(100, (lambda / capacity) * 100) : 100,
    actorCount: params.actorCount,
    capacityWarning,
  };

  if (
    Math.abs(lambda - state.lastIncomingRate) > 50 &&
    state.lastIncomingRate > 0
  ) {
    events.push({
      type: 'workload_change',
      message: `Workload changed from ${Math.round(state.lastIncomingRate)} to ${Math.round(lambda)} messages/sec (simulated).`,
    });
  }

  if (cpuSmoothed >= params.cpuThreshold && !state.previousCpuThresholdCrossed) {
    events.push({
      type: 'cpu_threshold',
      message: `CPU utilization crossed scaling threshold (${params.cpuThreshold}%).`,
    });
  }

  if (isQueueWarning(nextQueue) && !state.previousQueueWarning) {
    events.push({
      type: 'queue_warning',
      message: `Queue depth exceeded warning threshold (${SIMULATION_CONFIG.QUEUE_WARNING_THRESHOLD} messages).`,
    });
  }

  if (capacityWarning && !state.previousCapacityWarning) {
    events.push({
      type: 'capacity_max',
      message: 'Maximum pod capacity reached; queue may grow (simulated overload).',
    });
  }

  if (lambda < state.lastIncomingRate - 50 && nextQueue > 0) {
    events.push({
      type: 'scale_down_signal',
      message: 'Workload reduced; scale-down stabilization window active (simulated).',
    });
  }

  const historyPoint = {
    incoming: lambda,
    throughput,
    cpu: cpuSmoothed,
    queue: nextQueue,
    latency,
    pods: runningCount,
    time: simTime,
  };

  let resetInterval = {};
  if (intervalDuration >= 1) {
    resetInterval = {
      intervalProcessed: 0,
      intervalArrivals: 0,
      intervalDuration: 0,
    };
  }

  return {
    ...state,
    simTime,
    queue: nextQueue,
    arrivalRemainder: newRemainder,
    totalReceived,
    totalProcessed,
    totalFailed,
    pods,
    desiredPods: pendingDesired,
    pendingDesiredPods: pendingDesired,
    lastScaleTime,
    stabilizationSince,
    lastIncomingRate: lambda,
    cpuHistory,
    latencySamples,
    metrics,
    history: pushHistory(state.history, historyPoint),
    events: appendEvents(state.events, events, simTime),
    intervalProcessed: resetInterval.intervalProcessed ?? intervalProcessed,
    intervalArrivals: resetInterval.intervalArrivals ?? intervalArrivals,
    intervalDuration: resetInterval.intervalDuration ?? intervalDuration,
    previousQueueWarning: isQueueWarning(nextQueue),
    previousCpuThresholdCrossed: cpuSmoothed >= params.cpuThreshold,
    previousCapacityWarning: capacityWarning,
  };
}

function countActiveNonTerminating(pods) {
  return pods.filter((p) => p.status !== 'Terminating').length;
}

export class SimulationEngine {
  constructor(initialParams) {
    this.state = createInitialEngineState(initialParams);
  }

  getState() {
    return this.state;
  }

  setParams(partial) {
    this.state = {
      ...this.state,
      params: { ...this.state.params, ...partial },
    };
  }

  start() {
    if (this.state.status === SIMULATION_STATUS.RUNNING) return;
    const events =
      this.state.status === SIMULATION_STATUS.IDLE
        ? [
            {
              id: `start-${Date.now()}`,
              simTime: this.state.simTime,
              type: 'simulation_start',
              message: 'Simulation started (SIMULATION MODE).',
            },
          ]
        : [];
    this.state = {
      ...this.state,
      status: SIMULATION_STATUS.RUNNING,
      events: appendEvents(this.state.events, events, this.state.simTime),
    };
  }

  pause() {
    if (this.state.status !== SIMULATION_STATUS.RUNNING) return;
    this.state = {
      ...this.state,
      status: SIMULATION_STATUS.PAUSED,
      events: appendEvents(
        this.state.events,
        [{ type: 'simulation_pause', message: 'Simulation paused.' }],
        this.state.simTime,
      ),
    };
  }

  resume() {
    if (this.state.status !== SIMULATION_STATUS.PAUSED) return;
    this.state = {
      ...this.state,
      status: SIMULATION_STATUS.RUNNING,
      events: appendEvents(
        this.state.events,
        [{ type: 'simulation_resume', message: 'Simulation resumed.' }],
        this.state.simTime,
      ),
    };
  }

  stop() {
    this.state = {
      ...this.state,
      status: SIMULATION_STATUS.STOPPED,
      events: appendEvents(
        this.state.events,
        [{ type: 'simulation_stop', message: 'Simulation stopped.' }],
        this.state.simTime,
      ),
    };
  }

  reset(params) {
    this.state = createInitialEngineState(params ?? this.state.params);
  }

  step(dt) {
    this.state = stepSimulation(this.state, dt);
    return this.state;
  }

  /** Run N timesteps synchronously (for tests). */
  runSteps(count, dt = SIMULATION_CONFIG.DEFAULT_TIMESTEP) {
    this.start();
    for (let i = 0; i < count; i += 1) {
      this.step(dt);
    }
    return this.state;
  }
}
