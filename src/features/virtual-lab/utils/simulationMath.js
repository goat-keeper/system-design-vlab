import { SIMULATION_CONFIG } from '../engine/simulationConfig.js';

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clampWorkload(rate) {
  return clamp(rate, 0, SIMULATION_CONFIG.MAX_WORKLOAD);
}

export function clampPods(count) {
  return clamp(Math.round(count), SIMULATION_CONFIG.MIN_PODS, SIMULATION_CONFIG.MAX_PODS);
}

export function safeDivide(numerator, denominator, fallback = 0) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  return numerator / denominator;
}

export function computeCpuUtilization(lambda, capacity) {
  if (capacity <= 0) {
    return lambda > 0 ? 100 : 0;
  }
  return clamp((lambda / capacity) * 100, 0, 100);
}

export function computeCapacity(runningPodCount) {
  return runningPodCount * SIMULATION_CONFIG.MU_P;
}

export function distributeActors(totalActors, podCount) {
  if (podCount <= 0) return [];
  const base = Math.floor(totalActors / podCount);
  const remainder = totalActors % podCount;
  return Array.from({ length: podCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function rollingAverage(values, windowSize) {
  if (!values.length) return 0;
  const slice = values.slice(-windowSize);
  const sum = slice.reduce((acc, v) => acc + v, 0);
  return sum / slice.length;
}

export function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function formatSimTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${s}s`;
}
