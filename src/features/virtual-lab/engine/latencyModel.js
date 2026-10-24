import { SIMULATION_CONFIG } from './simulationConfig.js';
import { clamp, safeDivide } from '../utils/simulationMath.js';

/**
 * W_q ≈ Q / max(C - λ, ε),  W = W_q + W_s
 * Display value is capped — teaching metric only.
 */
export function estimateLatency(queue, capacity, lambda) {
  const denominator = Math.max(capacity - lambda, SIMULATION_CONFIG.LATENCY_EPSILON);
  const waitQueue = safeDivide(queue, denominator, 0);
  const total = waitQueue + SIMULATION_CONFIG.SERVICE_TIME;
  return clamp(total, 0, SIMULATION_CONFIG.LATENCY_MAX_DISPLAY);
}

export function latencyLabel(value) {
  if (value >= SIMULATION_CONFIG.LATENCY_MAX_DISPLAY - 0.001) {
    return `≥${SIMULATION_CONFIG.LATENCY_MAX_DISPLAY}s (estimated)`;
  }
  return `${value.toFixed(3)}s (estimated)`;
}
