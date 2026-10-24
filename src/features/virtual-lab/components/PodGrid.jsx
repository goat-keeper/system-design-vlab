import { POD_STATUS } from '../engine/simulationConfig.js';

const statusStyles = {
  [POD_STATUS.PENDING]: 'text-[#A1A1AA] border-[#27272A]',
  [POD_STATUS.STARTING]: 'text-[#F59E0B] border-[#F59E0B]/50 animate-pulse',
  [POD_STATUS.RUNNING]: 'text-[#22C55E] border-[#22C55E]/40',
  [POD_STATUS.TERMINATING]: 'text-[#EF4444] border-[#EF4444]/40 opacity-80',
};

function UtilBar({ label, value, color }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-[#A1A1AA]">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#27272A]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function PodGrid({ pods }) {
  if (!pods.length) {
    return (
      <div className="rounded-lg border border-dashed border-[#27272A] bg-[#111114] p-6 text-center text-sm text-[#A1A1AA]">
        No simulated pods. Start the simulation to provision runtime pods.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-[#FAFAFA]">Simulated Runtime Pods</h2>
        <p className="text-xs text-[#A1A1AA]">Lifecycle states affect nominal processing capacity.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pods.map((pod) => (
          <article
            key={pod.id}
            className={`rounded-lg border bg-[#111114] p-4 ${statusStyles[pod.status] ?? statusStyles[POD_STATUS.PENDING]}`}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-[#FAFAFA]">{pod.id}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide">{pod.status}</p>
              </div>
              <span className="rounded bg-[#18181B] px-2 py-0.5 text-[10px] text-[#A1A1AA]">
                SIM
              </span>
            </div>
            <div className="space-y-2">
              <UtilBar label="CPU (simulated)" value={pod.cpuUtil} color="#3B82F6" />
              <UtilBar label="Memory (simulated)" value={pod.memoryUtil} color="#22C55E" />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <dt className="text-[#71717A]">Actors</dt>
                <dd className="tabular-nums text-[#FAFAFA]">{pod.actorCount}</dd>
              </div>
              <div>
                <dt className="text-[#71717A]">Processed</dt>
                <dd className="tabular-nums text-[#FAFAFA]">{Math.round(pod.processedMessages)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[#71717A]">Assigned load (msg/s)</dt>
                <dd className="tabular-nums text-[#FAFAFA]">{pod.assignedQueueShare.toFixed(1)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
