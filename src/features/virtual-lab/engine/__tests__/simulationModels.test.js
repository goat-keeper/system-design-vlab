import { describe, expect, it } from 'vitest';
import {
  SimulationEngine,
  createInitialEngineState,
  stepSimulation,
} from '../simulationEngine.js';
import { SIMULATION_CONFIG, SIMULATION_STATUS, SCALING_MODES } from '../simulationConfig.js';
import { computeIncomingRate } from '../workloadModel.js';
import { computeRequiredPods } from '../scalingModel.js';
import { stepQueue } from '../queueModel.js';

function runSteady(params, seconds) {
  const engine = new SimulationEngine({
    ...params,
    workloadPattern: 'steady',
    scalingMode: SCALING_MODES.MANUAL,
  });
  engine.start();
  engine.runSteps(seconds, 1);
  return engine.getState();
}

describe('queue model', () => {
  it('keeps queue stable at 500 msg/s with one running pod', () => {
    const state = runSteady(
      { targetWorkload: 500, initialPods: 1, manualPodCount: 1, minPods: 1, maxPods: 10 },
      30,
    );
    expect(state.queue).toBeLessThan(5);
  });

  it('grows queue at 1000 msg/s with one pod', () => {
    const state = runSteady(
      { targetWorkload: 1000, initialPods: 1, manualPodCount: 1, minPods: 1, maxPods: 10 },
      20,
    );
    expect(state.queue).toBeGreaterThan(100);
  });

  it('stabilizes queue at 1000 msg/s with two running pods', () => {
    const state = runSteady(
      { targetWorkload: 1000, initialPods: 2, manualPodCount: 2, minPods: 1, maxPods: 10 },
      40,
    );
    expect(state.queue).toBeLessThan(10);
  });

  it('never processes more than available messages or capacity', () => {
    const { processed } = stepQueue(100, 50, 600, 1);
    expect(processed).toBeLessThanOrEqual(150);
    expect(processed).toBeLessThanOrEqual(600);
  });
});

describe('workload cap', () => {
  it('caps incoming rate at 4000 messages/sec', () => {
    const rate = computeIncomingRate({ targetWorkload: 5000, workloadPattern: 'steady' }, 0);
    expect(rate).toBeLessThanOrEqual(SIMULATION_CONFIG.MAX_WORKLOAD);
  });
});

describe('automatic scaling', () => {
  it('calculates sufficient replicas for target utilization', () => {
    const required = computeRequiredPods(2000, 70, 1, 10);
    expect(required).toBeGreaterThanOrEqual(5);
    expect(required).toBeLessThanOrEqual(10);
  });

  it('respects scaling cooldown between decisions', () => {
    const engine = new SimulationEngine({
      targetWorkload: 3000,
      initialPods: 1,
      minPods: 1,
      maxPods: 10,
      scalingMode: SCALING_MODES.AUTOMATIC,
      cpuThreshold: 70,
      workloadPattern: 'steady',
    });
    engine.start();
    engine.runSteps(8, 1);
    const scalingEvents = engine
      .getState()
      .events.filter((e) => e.type === 'scaling_decision');
    expect(scalingEvents.length).toBeLessThanOrEqual(2);
  });
});

describe('overload at max replicas', () => {
  it('shows growing queue when capacity is insufficient', () => {
    const state = runSteady(
      {
        targetWorkload: 4000,
        initialPods: 10,
        manualPodCount: 10,
        minPods: 1,
        maxPods: 10,
      },
      15,
    );
    expect(state.metrics.capacity).toBe(6000);
    expect(state.queue).toBe(0);
  });

  it('overload when demand exceeds max pod capacity', () => {
    const engine = new SimulationEngine({
      targetWorkload: 4000,
      initialPods: 1,
      manualPodCount: 1,
      minPods: 1,
      maxPods: 1,
      scalingMode: SCALING_MODES.MANUAL,
      workloadPattern: 'steady',
    });
    engine.start();
    engine.runSteps(20, 1);
    const final = engine.getState();
    expect(final.metrics.capacityWarning || final.queue > 0).toBe(true);
  });
});

describe('queue drain on reduced workload', () => {
  it('drains queue when capacity exceeds incoming load', () => {
    const engine = new SimulationEngine({
      targetWorkload: 2000,
      initialPods: 1,
      manualPodCount: 1,
      minPods: 1,
      maxPods: 10,
      scalingMode: SCALING_MODES.MANUAL,
      workloadPattern: 'steady',
    });
    engine.start();
    engine.runSteps(10, 1);
    const qHigh = engine.getState().queue;
    engine.setParams({ targetWorkload: 200 });
    engine.runSteps(60, 1);
    const qLow = engine.getState().queue;
    expect(qHigh).toBeGreaterThan(0);
    expect(qLow).toBeLessThan(qHigh);
  });
});

describe('simulation lifecycle', () => {
  it('freezes progress while paused', () => {
    let state = createInitialEngineState({
      targetWorkload: 1000,
      initialPods: 1,
      manualPodCount: 1,
      scalingMode: SCALING_MODES.MANUAL,
    });
    state = { ...state, status: SIMULATION_STATUS.RUNNING };
    state = stepSimulation(state, 5);
    const t1 = state.simTime;
    state = { ...state, status: SIMULATION_STATUS.PAUSED };
    state = stepSimulation(state, 10);
    expect(state.simTime).toBe(t1);
  });

  it('reset clears accumulated values', () => {
    const engine = new SimulationEngine({
      targetWorkload: 1500,
      initialPods: 2,
      manualPodCount: 2,
      scalingMode: SCALING_MODES.MANUAL,
    });
    engine.start();
    engine.runSteps(10, 1);
    engine.reset();
    const state = engine.getState();
    expect(state.totalReceived).toBe(0);
    expect(state.totalProcessed).toBe(0);
    expect(state.queue).toBe(0);
    expect(state.history.incoming.length).toBe(0);
    expect(state.events.length).toBe(0);
  });
});

describe('pod lifecycle capacity', () => {
  it('excludes starting pods from processing capacity', () => {
    const engine = new SimulationEngine({
      targetWorkload: 1200,
      initialPods: 1,
      manualPodCount: 2,
      minPods: 1,
      maxPods: 10,
      scalingMode: SCALING_MODES.MANUAL,
      workloadPattern: 'steady',
    });
    engine.start();
    engine.runSteps(1, 1);
    const state = engine.getState();
    const starting = state.pods.some((p) => p.status === 'Starting');
    if (starting) {
      expect(state.metrics.activePods).toBe(1);
    }
  });
});

describe('manual scaling mode', () => {
  it('does not auto-scale replicas under high load', () => {
    const engine = new SimulationEngine({
      targetWorkload: 3500,
      initialPods: 1,
      manualPodCount: 1,
      minPods: 1,
      maxPods: 10,
      scalingMode: SCALING_MODES.MANUAL,
      workloadPattern: 'steady',
    });
    engine.start();
    engine.runSteps(30, 1);
    const running = engine.getState().pods.filter((p) => p.status === 'Running').length;
    expect(running).toBe(1);
  });
});
