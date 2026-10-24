import { SIMULATION_CONFIG } from './simulationConfig.js';

/**
 * Queue update for one timestep.
 * S_t = min(Q_t + A_t, C * dt)
 * Q_{t+1} = max(0, Q_t + A_t - S_t)
 */
export function stepQueue(queue, arrivals, capacity, dt) {
  const available = queue + arrivals;
  const maxService = capacity * dt;
  const processed = Math.min(available, maxService);
  const nextQueue = Math.max(0, available - processed);
  return { processed, nextQueue };
}

export function applyFailureSplit(processedCount, failureRate) {
  const rate = Math.min(
    SIMULATION_CONFIG.MAX_FAILURE_RATE,
    Math.max(0, failureRate),
  );
  if (processedCount <= 0 || rate <= 0) {
    return { successful: processedCount, failed: 0 };
  }
  const failed = Math.min(processedCount, Math.floor(processedCount * rate));
  return { successful: processedCount - failed, failed };
}

export function isQueueWarning(queueDepth) {
  return queueDepth >= SIMULATION_CONFIG.QUEUE_WARNING_THRESHOLD;
}
