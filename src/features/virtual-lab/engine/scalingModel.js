import { SIMULATION_CONFIG, SCALING_MODES } from './simulationConfig.js';
import { clampPods } from '../utils/simulationMath.js';

/**
 * P_required = ceil(λ / (μ_p * U_target))
 * Clamped to [P_min, P_max].
 */
export function computeRequiredPods(lambda, cpuThresholdPercent, minPods, maxPods) {
  const utilizationTarget = cpuThresholdPercent / 100;
  const effectiveTarget = Math.max(utilizationTarget, 0.01);
  const required = Math.ceil(lambda / (SIMULATION_CONFIG.MU_P * effectiveTarget));
  return clampPods(Math.min(maxPods, Math.max(minPods, required)));
}

export function resolveDesiredPodCount(params, lambda, currentActiveCount) {
  if (params.scalingMode === SCALING_MODES.MANUAL) {
    return clampPods(params.manualPodCount);
  }
  return computeRequiredPods(
    lambda,
    params.cpuThreshold,
    params.minPods,
    params.maxPods,
  );
}

export function canScaleNow(simTime, lastScaleTime, cooldown = SIMULATION_CONFIG.SCALING_COOLDOWN) {
  return simTime - lastScaleTime >= cooldown;
}

export function countRunningPods(pods) {
  return pods.filter((p) => p.status === 'Running').length;
}

export function countActivePods(pods) {
  return pods.filter(
    (p) => p.status === 'Running' || p.status === 'Starting' || p.status === 'Pending',
  ).length;
}
