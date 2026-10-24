import { SIMULATION_CONFIG, SCALING_MODES } from '../engine/simulationConfig.js';
import { clamp, clampPods, clampWorkload } from './simulationMath.js';

export function normalizeSimulationParams(raw) {
  let minPods = clampPods(raw.minPods ?? SIMULATION_CONFIG.MIN_PODS);
  let maxPods = clampPods(raw.maxPods ?? SIMULATION_CONFIG.MAX_PODS);
  if (minPods > maxPods) {
    minPods = maxPods;
  }

  const targetWorkload = clampWorkload(
    raw.targetWorkload ?? SIMULATION_CONFIG.MIN_WORKLOAD,
  );

  const initialPods = clampPods(
    Math.min(raw.initialPods ?? minPods, maxPods),
  );

  let manualPodCount = clampPods(raw.manualPodCount ?? initialPods);
  manualPodCount = Math.min(Math.max(manualPodCount, minPods), maxPods);

  const actorCount = clamp(
    Math.round(raw.actorCount ?? SIMULATION_CONFIG.MIN_ACTORS),
    SIMULATION_CONFIG.MIN_ACTORS,
    SIMULATION_CONFIG.MAX_ACTORS,
  );

  const cpuThreshold = clamp(
    raw.cpuThreshold ?? SIMULATION_CONFIG.DEFAULT_CPU_THRESHOLD,
    10,
    95,
  );

  const failureRate = clamp(
    raw.failureRate ?? 0,
    0,
    SIMULATION_CONFIG.MAX_FAILURE_RATE,
  );

  const simulationSpeed = [1, 2, 5].includes(raw.simulationSpeed)
    ? raw.simulationSpeed
    : 1;

  return {
    targetWorkload: Math.max(SIMULATION_CONFIG.MIN_WORKLOAD, targetWorkload),
    actorCount,
    initialPods,
    minPods,
    maxPods,
    scalingMode: raw.scalingMode === SCALING_MODES.MANUAL
      ? SCALING_MODES.MANUAL
      : SCALING_MODES.AUTOMATIC,
    cpuThreshold,
    workloadPattern: raw.workloadPattern ?? 'steady',
    simulationSpeed,
    failureRate,
    manualPodCount,
  };
}
