import { useCallback, useEffect, useRef } from 'react';
import { addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import { SIMULATION_CONFIG, SCALING_MODES } from '../engine/simulationConfig.js';

const SIM_INGRESS_ID = 'sim-ingress';

function isSimNode(id) {
  return id === SIM_INGRESS_ID || id.startsWith('sim-pod-');
}

function isUserNode(id) {
  return id.startsWith('user-');
}

function defaultPosition(index, axis = 'y') {
  return axis === 'y' ? { x: 320, y: 40 + index * 100 } : { x: 40 + index * 180, y: 200 };
}

function buildSimNodes(pods, incomingRate, queue, layoutRef) {
  const activePods = pods.filter(
    (p) => p.status === 'Running' || p.status === 'Starting' || p.status === 'Pending',
  );

  const ingressPos = layoutRef.current.get(SIM_INGRESS_ID) ?? { x: 0, y: 140 };
  const ingress = {
    id: SIM_INGRESS_ID,
    type: 'ingressSim',
    position: ingressPos,
    data: { rate: Math.round(incomingRate), queue: Math.round(queue) },
    draggable: true,
  };

  const podNodes = activePods.map((pod, index) => {
    const id = `sim-pod-${pod.id}`;
    const position = layoutRef.current.get(id) ?? defaultPosition(index);
    return {
      id,
      type: 'simPod',
      position,
      data: {
        label: pod.id,
        status: pod.status,
        actors: pod.actorCount,
      },
      draggable: true,
    };
  });

  return [ingress, ...podNodes];
}

function buildSimEdges(pods) {
  const activePods = pods.filter(
    (p) => p.status === 'Running' || p.status === 'Starting' || p.status === 'Pending',
  );
  return activePods.map((pod) => ({
    id: `sim-e-${pod.id}`,
    source: SIM_INGRESS_ID,
    target: `sim-pod-${pod.id}`,
    animated: pod.status === 'Running',
    style: { stroke: '#3B82F6', strokeWidth: 1.5 },
  }));
}

export function useCanvasGraph({
  pods,
  incomingRate,
  queue,
  targetWorkload,
  actorCount,
  params,
  onParamsChange,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const layoutRef = useRef(new Map());
  const countersRef = useRef({ actor: 0, pod: 0, queue: 0, workload: 0, supervisor: 0, router: 0 });
  const fitViewRef = useRef(null);

  const syncSimulationNodes = useCallback(() => {
    const simNodes = buildSimNodes(pods, incomingRate, queue, layoutRef);
    const simEdges = buildSimEdges(pods);

    setNodes((current) => {
      const userNodes = current.filter((n) => isUserNode(n.id));
      return [...simNodes, ...userNodes];
    });

    setEdges((current) => {
      const userEdges = current.filter((e) => !e.id.startsWith('sim-e-'));
      return [...simEdges, ...userEdges];
    });
  }, [pods, incomingRate, queue, setNodes, setEdges]);

  useEffect(() => {
    syncSimulationNodes();
  }, [syncSimulationNodes]);

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, style: { stroke: '#52525B' } }, eds)),
    [setEdges],
  );

  const onNodeDragStop = useCallback((_, node) => {
    layoutRef.current.set(node.id, node.position);
  }, []);

  const addNodeAtCenter = useCallback(
    (type) => {
      countersRef.current[type] = (countersRef.current[type] ?? 0) + 1;
      const n = countersRef.current[type];
      const id = `user-${type}-${Date.now()}`;

      let data = { label: `${type}-${n}` };
      if (type === 'queue') {
        data = { depth: Math.round(queue) };
      }
      if (type === 'workload') {
        data = { rate: Math.round(targetWorkload) };
      }

      const userCount = countersRef.current.actor + countersRef.current.pod + n;
      const newNode = {
        id,
        type,
        position: { x: 520 + (n % 4) * 36, y: 30 + userCount * 72 },
        data,
        draggable: true,
      };

      setNodes((nds) => [...nds, newNode]);

      if (type === 'actor') {
        const next = Math.min(SIMULATION_CONFIG.MAX_ACTORS, actorCount + 1);
        onParamsChange({ actorCount: next });
      }

      if (type === 'userPod') {
        const nextPods = Math.min(params.maxPods, (params.manualPodCount ?? params.initialPods) + 1);
        onParamsChange({
          scalingMode: SCALING_MODES.MANUAL,
          manualPodCount: nextPods,
        });
      }
    },
    [
      actorCount,
      onParamsChange,
      params.initialPods,
      params.manualPodCount,
      params.maxPods,
      queue,
      setNodes,
      targetWorkload,
    ],
  );

  const onNodesDelete = useCallback(
    (deleted) => {
      const actorDeletes = deleted.filter((n) => n.type === 'actor').length;
      const podDeletes = deleted.filter((n) => n.type === 'userPod').length;

      if (actorDeletes > 0) {
        onParamsChange({
          actorCount: Math.max(
            SIMULATION_CONFIG.MIN_ACTORS,
            actorCount - actorDeletes,
          ),
        });
      }

      if (podDeletes > 0) {
        const current = params.manualPodCount ?? params.initialPods;
        onParamsChange({
          scalingMode: SCALING_MODES.MANUAL,
          manualPodCount: Math.max(params.minPods, current - podDeletes),
        });
      }
    },
    [actorCount, onParamsChange, params.initialPods, params.manualPodCount, params.minPods],
  );

  const clearUserNodes = useCallback(() => {
    setNodes((nds) => nds.filter((n) => isSimNode(n.id)));
    setEdges((eds) => eds.filter((e) => e.id.startsWith('sim-e-')));
  }, [setEdges, setNodes]);

  const autoLayout = useCallback(() => {
    setNodes((nds) => {
      const simIngress = nds.find((n) => n.id === SIM_INGRESS_ID);
      const simPods = nds.filter((n) => n.id.startsWith('sim-pod-'));
      const user = nds.filter((n) => isUserNode(n.id));

      const laidOutSim = [
        simIngress && { ...simIngress, position: { x: 0, y: 160 } },
        ...simPods.map((node, i) => {
          const pos = { x: 280, y: 20 + i * 95 };
          layoutRef.current.set(node.id, pos);
          return { ...node, position: pos };
        }),
      ].filter(Boolean);

      const laidOutUser = user.map((node, i) => ({
        ...node,
        position: { x: 560, y: 20 + i * 85 },
      }));

      return [...laidOutSim, ...laidOutUser];
    });
    requestAnimationFrame(() => fitViewRef.current?.({ padding: 0.15, duration: 300 }));
  }, [setNodes]);

  const userNodeCount = nodes.filter((n) => isUserNode(n.id)).length;

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
    onNodesDelete,
    addNodeAtCenter,
    clearUserNodes,
    autoLayout,
    userNodeCount,
    fitViewRef,
  };
}
