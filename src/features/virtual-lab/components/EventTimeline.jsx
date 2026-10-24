import { formatSimTime } from '../utils/simulationMath.js';

const typeColors = {
  scaling_decision: 'border-l-[#3B82F6]',
  pod_starting: 'border-l-[#F59E0B]',
  pod_running: 'border-l-[#22C55E]',
  pod_terminating: 'border-l-[#EF4444]',
  queue_warning: 'border-l-[#F59E0B]',
  capacity_max: 'border-l-[#EF4444]',
  default: 'border-l-[#27272A]',
};

export default function EventTimeline({ events }) {
  return (
    <section className="rounded-lg border border-[#27272A] bg-[#111114]">
      <div className="border-b border-[#27272A] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#FAFAFA]">Simulation Event Timeline</h2>
        <p className="text-xs text-[#A1A1AA]">Derived from simulated state transitions only.</p>
      </div>
      <ul className="max-h-64 space-y-0 overflow-y-auto p-2">
        {events.length === 0 ? (
          <li className="px-2 py-4 text-center text-sm text-[#71717A]">No events yet.</li>
        ) : (
          events.map((event) => (
            <li
              key={event.id}
              className={`mb-2 rounded-md border border-[#27272A] border-l-4 bg-[#18181B] px-3 py-2 ${typeColors[event.type] ?? typeColors.default}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-[#71717A]">{event.type}</span>
                <span className="text-[10px] tabular-nums text-[#A1A1AA]">{formatSimTime(event.simTime)}</span>
              </div>
              <p className="mt-1 text-xs text-[#FAFAFA]">{event.message}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
