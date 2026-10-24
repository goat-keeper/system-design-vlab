import { Handle, Position } from '@xyflow/react';

function NodeShell({ title, subtitle, children, borderColor = '#27272A', badge }) {
  return (
    <div
      className="min-w-[150px] max-w-[200px] rounded-lg border bg-[#111114] px-3 py-2 shadow-lg"
      style={{ borderColor }}
    >
      {badge ? (
        <span className="mb-1 inline-block rounded bg-[#18181B] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[#71717A]">
          {badge}
        </span>
      ) : null}
      <p className="text-[10px] uppercase tracking-wide text-[#A1A1AA]">{title}</p>
      {subtitle ? <p className="text-xs font-medium text-[#FAFAFA]">{subtitle}</p> : null}
      {children}
    </div>
  );
}

export function IngressSimNode({ data }) {
  return (
    <NodeShell title="Ingress" subtitle={`${data.rate} msg/s`} borderColor="#3B82F6" badge="sim">
      <Handle type="source" position={Position.Right} className="!bg-[#3B82F6]" />
      <p className="text-[10px] text-[#71717A]">Queue: {data.queue}</p>
    </NodeShell>
  );
}

export function SimPodNode({ data }) {
  const statusColor =
    data.status === 'Running'
      ? '#22C55E'
      : data.status === 'Starting'
        ? '#F59E0B'
        : data.status === 'Terminating'
          ? '#EF4444'
          : '#71717A';

  return (
    <NodeShell title={data.label} subtitle={data.status} borderColor={statusColor} badge="sim pod">
      <Handle type="target" position={Position.Left} className="!bg-[#3B82F6]" />
      <Handle type="source" position={Position.Right} className="!bg-[#22C55E]" />
      <p className="mt-1 text-[11px] text-[#A1A1AA]">
        Actors: <span className="text-[#FAFAFA]">{data.actors}</span>
      </p>
    </NodeShell>
  );
}

export function ActorNode({ data }) {
  return (
    <NodeShell title="Actor" subtitle={data.label} borderColor="#3B82F6" badge="logical">
      <Handle type="target" position={Position.Left} className="!bg-[#3B82F6]" />
      <Handle type="source" position={Position.Right} className="!bg-[#3B82F6]" />
      <p className="text-[10px] text-[#71717A]">Simulated worker</p>
    </NodeShell>
  );
}

export function QueueNode({ data }) {
  return (
    <NodeShell title="Message queue" subtitle={`Depth ~${data.depth}`} borderColor="#F59E0B" badge="buffer">
      <Handle type="target" position={Position.Left} className="!bg-[#F59E0B]" />
      <Handle type="source" position={Position.Right} className="!bg-[#F59E0B]" />
    </NodeShell>
  );
}

export function WorkloadNode({ data }) {
  return (
    <NodeShell title="Workload source" subtitle={`${data.rate} msg/s target`} borderColor="#3B82F6" badge="input">
      <Handle type="source" position={Position.Right} className="!bg-[#3B82F6]" />
    </NodeShell>
  );
}

export function SupervisorNode({ data }) {
  return (
    <NodeShell title="Supervisor" subtitle={data.label} borderColor="#22C55E" badge="coord">
      <Handle type="target" position={Position.Top} className="!bg-[#22C55E]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#22C55E]" />
      <Handle type="source" position={Position.Right} id="route" className="!bg-[#22C55E]" />
    </NodeShell>
  );
}

export function RouterNode({ data }) {
  return (
    <NodeShell title="Router" subtitle={data.label} borderColor="#A1A1AA" badge="route">
      <Handle type="target" position={Position.Left} className="!bg-[#A1A1AA]" />
      <Handle type="source" position={Position.Right} id="a" style={{ top: '35%' }} className="!bg-[#A1A1AA]" />
      <Handle type="source" position={Position.Right} id="b" style={{ top: '65%' }} className="!bg-[#A1A1AA]" />
    </NodeShell>
  );
}

export function UserPodNode({ data }) {
  return (
    <NodeShell title="Pod (planned)" subtitle={data.label} borderColor="#27272A" badge="manual">
      <Handle type="target" position={Position.Left} className="!bg-[#3B82F6]" />
      <Handle type="source" position={Position.Right} className="!bg-[#3B82F6]" />
      <p className="text-[10px] text-[#71717A]">Link to sim pod when scaled</p>
    </NodeShell>
  );
}

export const canvasNodeTypes = {
  ingressSim: IngressSimNode,
  simPod: SimPodNode,
  actor: ActorNode,
  queue: QueueNode,
  workload: WorkloadNode,
  supervisor: SupervisorNode,
  router: RouterNode,
  userPod: UserPodNode,
};
