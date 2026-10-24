import { SIMULATION_CONFIG, WORKLOAD_PATTERNS } from './simulationConfig.js';
import { clampWorkload } from '../utils/simulationMath.js';

/**
 * Incoming rate λ_t (messages/sec) for the current simulated time.
 */
export function computeIncomingRate(params, simTime) {
  const target = clampWorkload(params.targetWorkload);

  if (params.workloadPattern === WORKLOAD_PATTERNS.STEADY) {
    return target;
  }

  if (params.workloadPattern === WORKLOAD_PATTERNS.RAMP_UP) {
    const lambda0 = clampWorkload(
      target * SIMULATION_CONFIG.RAMP_INITIAL_FRACTION,
    );
    const progress = Math.min(1, simTime / SIMULATION_CONFIG.RAMP_DURATION);
    return clampWorkload(lambda0 + (target - lambda0) * progress);
  }

  if (params.workloadPattern === WORKLOAD_PATTERNS.BURST) {
    const baseline = clampWorkload(target * SIMULATION_CONFIG.BURST_BASELINE_FRACTION);
    const phase = simTime % SIMULATION_CONFIG.BURST_PERIOD;
    if (phase < SIMULATION_CONFIG.BURST_DURATION) {
      return clampWorkload(Math.max(baseline, target * SIMULATION_CONFIG.BURST_MULTIPLIER));
    }
    return baseline;
  }

  return target;
}

/**
 * Fractional arrival accumulator: returns whole arrivals and new remainder.
 */
export function computeArrivals(lambda, dt, remainder) {
  const raw = lambda * dt + remainder;
  const arrivals = Math.floor(raw);
  const newRemainder = raw - arrivals;
  return { arrivals, newRemainder };
}
