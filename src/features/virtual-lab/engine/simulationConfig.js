/** Central tunable constants for the mathematical simulation model. */
export const SIMULATION_CONFIG = {
  MAX_WORKLOAD: 4000,
  MIN_WORKLOAD: 100,
  MIN_ACTORS: 10,
  MAX_ACTORS: 1000,
  MIN_PODS: 1,
  MAX_PODS: 10,

  /** Nominal processing capacity per running pod (messages/sec). */
  MU_P: 600,

  /** Fixed simulation timestep in simulated seconds. */
  DEFAULT_TIMESTEP: 1,

  POD_STARTUP_DELAY: 3,
  POD_TERMINATION_DELAY: 2,
  SCALING_COOLDOWN: 5,
  SCALING_STABILIZATION: 3,

  RAMP_DURATION: 30,
  RAMP_INITIAL_FRACTION: 0.25,

  BURST_PERIOD: 20,
  BURST_DURATION: 5,
  BURST_MULTIPLIER: 1.4,
  BURST_BASELINE_FRACTION: 0.65,

  QUEUE_WARNING_THRESHOLD: 500,

  /** Prevents division by zero in latency approximation. */
  LATENCY_EPSILON: 0.001,
  LATENCY_MAX_DISPLAY: 30,

  /** Average service time W_s (seconds per message) = 1 / MU_P. */
  SERVICE_TIME: 1 / 600,

  CPU_SMOOTHING_WINDOW: 5,
  METRIC_HISTORY_MAX: 120,
  EVENT_HISTORY_MAX: 100,
  LATENCY_SAMPLE_MAX: 200,

  /**
   * Simplified memory model (display only):
   * mem% = base + actorsFactor + cpuFactor, capped at 100.
   */
  MEMORY_BASE_PERCENT: 22,
  MEMORY_PER_ACTOR_PERCENT: 0.04,
  MEMORY_CPU_FACTOR: 0.35,

  DEFAULT_CPU_THRESHOLD: 70,
  DEFAULT_FAILURE_RATE: 0,
  MAX_FAILURE_RATE: 0.5,
};

export const POD_STATUS = {
  PENDING: 'Pending',
  STARTING: 'Starting',
  RUNNING: 'Running',
  TERMINATING: 'Terminating',
};

export const SIMULATION_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
};

export const SCALING_MODES = {
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
};

export const WORKLOAD_PATTERNS = {
  STEADY: 'steady',
  RAMP_UP: 'ramp-up',
  BURST: 'burst',
};

export const DEFAULT_SIMULATION_PARAMS = {
  targetWorkload: 500,
  actorCount: 100,
  initialPods: 2,
  minPods: 1,
  maxPods: 10,
  scalingMode: SCALING_MODES.AUTOMATIC,
  cpuThreshold: SIMULATION_CONFIG.DEFAULT_CPU_THRESHOLD,
  workloadPattern: WORKLOAD_PATTERNS.STEADY,
  simulationSpeed: 1,
  failureRate: SIMULATION_CONFIG.DEFAULT_FAILURE_RATE,
  manualPodCount: 2,
};
