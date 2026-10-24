import { POD_STATUS, SIMULATION_CONFIG } from './simulationConfig.js';
import { distributeActors } from '../utils/simulationMath.js';

let podIdCounter = 0;

export function resetPodIdCounter() {
  podIdCounter = 0;
}

export function createPod(status = POD_STATUS.RUNNING) {
  podIdCounter += 1;
  return {
    id: `sim-pod-${podIdCounter}`,
    status,
    statusSince: 0,
    actorCount: 0,
    processedMessages: 0,
    cpuUtil: 0,
    cpuUtilRaw: 0,
    memoryUtil: 0,
    assignedQueueShare: 0,
  };
}

export function createInitialPods(count) {
  return Array.from({ length: count }, () => createPod(POD_STATUS.RUNNING));
}

export function applyActorDistribution(pods, totalActors) {
  const activePods = pods.filter(
    (p) => p.status === POD_STATUS.RUNNING || p.status === POD_STATUS.STARTING,
  );
  const distribution = distributeActors(totalActors, activePods.length);
  let idx = 0;
  return pods.map((pod) => {
    if (pod.status === POD_STATUS.RUNNING || pod.status === POD_STATUS.STARTING) {
      const actorCount = distribution[idx] ?? 0;
      idx += 1;
      return { ...pod, actorCount };
    }
    return { ...pod, actorCount: 0 };
  });
}

export function updatePodLifecycles(pods, simTime, dt) {
  const events = [];
  const nextPods = [];

  for (const pod of pods) {
    const elapsed = simTime - pod.statusSince;

    if (pod.status === POD_STATUS.STARTING && elapsed >= SIMULATION_CONFIG.POD_STARTUP_DELAY) {
      events.push({
        type: 'pod_running',
        message: `Simulated pod ${pod.id} became Running.`,
        podId: pod.id,
      });
      nextPods.push({ ...pod, status: POD_STATUS.RUNNING, statusSince: simTime });
      continue;
    }

    if (pod.status === POD_STATUS.TERMINATING && elapsed >= SIMULATION_CONFIG.POD_TERMINATION_DELAY) {
      events.push({
        type: 'pod_removed',
        message: `Simulated pod ${pod.id} removed after termination.`,
        podId: pod.id,
      });
      continue;
    }

    nextPods.push(pod);
  }

  return { pods: nextPods, events };
}

export function scalePodsTowardTarget(pods, targetCount, simTime) {
  const events = [];
  let next = [...pods];
  const activeCount = next.filter(
    (p) => p.status !== POD_STATUS.TERMINATING,
  ).length;

  if (targetCount > activeCount) {
    const toAdd = targetCount - activeCount;
    for (let i = 0; i < toAdd; i += 1) {
      const pod = createPod(POD_STATUS.STARTING);
      pod.statusSince = simTime;
      next.push(pod);
      events.push({
        type: 'pod_starting',
        message: `Simulated pod ${pod.id} entered Starting state.`,
        podId: pod.id,
      });
    }
  } else if (targetCount < activeCount) {
    let toRemove = activeCount - targetCount;
    const removable = next
      .filter((p) => p.status === POD_STATUS.RUNNING)
      .slice()
      .reverse();

    for (const pod of removable) {
      if (toRemove <= 0) break;
      next = next.map((p) =>
        p.id === pod.id
          ? { ...p, status: POD_STATUS.TERMINATING, statusSince: simTime }
          : p,
      );
      events.push({
        type: 'pod_terminating',
        message: `Simulated pod ${pod.id} marked Terminating; actors will rebalance (simulated).`,
        podId: pod.id,
      });
      toRemove -= 1;
    }
  }

  return { pods: next, events };
}

/**
 * Simplified memory utilization per pod (display model).
 */
export function computePodMemoryUtil(actorCount, cpuUtil) {
  const raw =
    SIMULATION_CONFIG.MEMORY_BASE_PERCENT +
    actorCount * SIMULATION_CONFIG.MEMORY_PER_ACTOR_PERCENT +
    cpuUtil * SIMULATION_CONFIG.MEMORY_CPU_FACTOR;
  return Math.min(100, Math.max(0, raw));
}

export function assignPodMetrics(pods, lambda, runningCount) {
  if (runningCount <= 0) {
    return pods.map((p) => ({
      ...p,
      cpuUtilRaw: 0,
      cpuUtil: 0,
      memoryUtil: computePodMemoryUtil(p.actorCount, 0),
      assignedQueueShare: 0,
    }));
  }

  const perPodLambda = lambda / runningCount;
  return pods.map((pod) => {
    if (pod.status !== POD_STATUS.RUNNING) {
      return {
        ...pod,
        cpuUtilRaw: 0,
        cpuUtil: 0,
        memoryUtil: computePodMemoryUtil(pod.actorCount, 0),
        assignedQueueShare: 0,
      };
    }
    const cpuUtilRaw = Math.min(100, (perPodLambda / SIMULATION_CONFIG.MU_P) * 100);
    return {
      ...pod,
      cpuUtilRaw,
      cpuUtil: cpuUtilRaw,
      memoryUtil: computePodMemoryUtil(pod.actorCount, cpuUtilRaw),
      assignedQueueShare: perPodLambda,
    };
  });
}
