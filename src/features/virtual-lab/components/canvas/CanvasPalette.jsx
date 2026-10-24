const PALETTE_ITEMS = [
  { type: 'actor', label: 'Actor', hint: '+1 logical actor', color: '#3B82F6' },
  { type: 'userPod', label: 'Pod', hint: 'Manual scale +1', color: '#FAFAFA' },
  { type: 'queue', label: 'Queue', hint: 'Buffer node', color: '#F59E0B' },
  { type: 'workload', label: 'Workload', hint: 'Traffic source', color: '#3B82F6' },
  { type: 'supervisor', label: 'Supervisor', hint: 'Coordinator', color: '#22C55E' },
  { type: 'router', label: 'Router', hint: 'Split traffic', color: '#A1A1AA' },
];

export default function CanvasPalette({ onAddNode, onAutoLayout, onClearUserNodes, userNodeCount }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#27272A] bg-[#18181B] p-2">
      <span className="text-[10px] font-medium uppercase tracking-wide text-[#71717A]">Add node</span>
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => onAddNode(item.type)}
          className="nodrag nopan rounded-md border border-[#27272A] bg-[#111114] px-2.5 py-1.5 text-left transition hover:border-[#3B82F6]"
          title={item.hint}
        >
          <span className="block text-xs font-medium text-[#FAFAFA]">{item.label}</span>
          <span className="block text-[10px] text-[#71717A]">{item.hint}</span>
        </button>
      ))}
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={onAutoLayout}
          className="rounded-md border border-[#27272A] px-2 py-1 text-[11px] text-[#A1A1AA] hover:text-[#FAFAFA]"
        >
          Auto layout
        </button>
        <button
          type="button"
          onClick={onClearUserNodes}
          disabled={userNodeCount === 0}
          className="rounded-md border border-[#EF4444]/40 px-2 py-1 text-[11px] text-[#EF4444] disabled:opacity-40"
        >
          Clear custom ({userNodeCount})
        </button>
      </div>
    </div>
  );
}
