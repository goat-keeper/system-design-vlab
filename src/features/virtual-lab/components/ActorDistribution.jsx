import { useMemo } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

function IngressNode({ data }) {
  return (
    <div className="min-w-[140px] rounded-lg border border-[#3B82F6]/50 bg-[#18181B] px-3 py-2 shadow-lg">
      <Handle type="source" position={Position.Right} className="!bg-[#3B82F6]" />
      <p className="text-[10px] uppercase tracking-wide text-[#A1A1AA]">Ingress (simulated)</p>
      <p className="text-sm font-semibold text-[#FAFAFA]">{data.rate} msg/s</p>
      <p className="text-[10px] text-[#71717A]">Queue: {data.queue}</p>
    </div>
  );
}

function SimPodNode({ data }) {
  const statusColor =
    data.status === 'Running'
      ? '#22C55E'
      : data.status === 'Starting'
        ? '#F59E0B'
        : data.status === 'Terminating'
          ? '#EF4444'
          : '#71717A';

  return (
    <div
      className="min-w-[160px] rounded-lg border bg-[#111114] px-3 py-2 shadow-lg"
      style={{ borderColor: statusColor }}
    >
      <Handle type="target" position={Position.Left} className="!bg-[#3B82F6]" />
      <p className="font-mono text-[10px] text-[#FAFAFA]">{data.label}</p>
      <p className="text-[10px]" style={{ color: statusColor }}>
        {data.status}
      </p>
      <p className="mt-1 text-xs text-[#A1A1AA]">
        Actors: <span className="text-[#FAFAFA]">{data.actors}</span>
      </p>
      <p className="text-[10px] text-[#71717A]">Simulated rebalance</p>
    </div>
  );
}

const nodeTypes = {
  ingress: IngressNode,
  simPod: SimPodNode,
};

function ActorDistributionFlow({ pods, actorCount, incomingRate, queue }) {
  const { nodes, edges } = useMemo(() => {
    const activePods = pods.filter(
      (p) => p.status === 'Running' || p.status === 'Starting',
    );

    const ingress = {
      id: 'ingress',
      type: 'ingress',
      position: { x: 0, y: 120 },
      data: { rate: Math.round(incomingRate), queue: Math.round(queue) },
      draggable: false,
    };

    const podNodes = activePods.map((pod, index) => ({
      id: pod.id,
      type: 'simPod',
      position: { x: 260, y: index * 90 },
      data: {
        label: pod.id,
        status: pod.status,
        actors: pod.actorCount,
      },
      draggable: false,
    }));

    const podEdges = activePods.map((pod) => ({
      id: `e-ingress-${pod.id}`,
      source: 'ingress',
      target: pod.id,
      animated: pod.status === 'Running',
      style: { stroke: '#3B82F6', strokeWidth: 1.5 },
    }));

    return {
      nodes: [ingress, ...podNodes],
      edges: podEdges,
    };
  }, [pods, incomingRate, queue]);

  return (
    <div className="h-72 w-full rounded-lg border border-[#27272A] bg-[#09090B]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll={false}
      >
        <Background color="#27272A" gap={16} />
        <Controls className="!border-[#27272A] !bg-[#18181B] !shadow-none [&>button]:!border-[#27272A] [&>button]:!bg-[#18181B] [&>button]:!fill-[#FAFAFA]" />
      </ReactFlow>
    </div>
  );
}

export default function ActorDistribution(props) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-[#FAFAFA]">Actor Distribution (Simulated)</h2>
        <p className="text-xs text-[#A1A1AA]">
          {props.actorCount} logical actors — reassignment on scale events is simulated rebalancing.
        </p>
      </div>
      <ReactFlowProvider>
        <ActorDistributionFlow {...props} />
      </ReactFlowProvider>
    </section>
  );
}
