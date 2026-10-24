import {
  SCALING_MODES,
  SIMULATION_CONFIG,
  SIMULATION_STATUS,
  WORKLOAD_PATTERNS,
} from '../engine/simulationConfig.js';

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#A1A1AA]">
      {children}
    </label>
  );
}

function RangeRow({ label, value, min, max, step = 1, onChange, suffix }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-sm tabular-nums text-[#FAFAFA]">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-[#3B82F6]"
      />
    </div>
  );
}

export default function SimulationControls({
  params,
  status,
  onParamsChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}) {
  const isRunning = status === SIMULATION_STATUS.RUNNING;
  const isPaused = status === SIMULATION_STATUS.PAUSED;

  const set = (key, value) => onParamsChange({ [key]: value });

  return (
    <aside className="flex h-full flex-col gap-4 rounded-lg border border-[#27272A] bg-[#111114] p-4">
      <div>
        <h2 className="text-sm font-semibold text-[#FAFAFA]">Simulation Controls</h2>
        <p className="mt-1 text-xs text-[#A1A1AA]">
          Mathematical model only — no real infrastructure.
        </p>
      </div>

      <RangeRow
        label="Workload (msg/s)"
        value={params.targetWorkload}
        min={SIMULATION_CONFIG.MIN_WORKLOAD}
        max={SIMULATION_CONFIG.MAX_WORKLOAD}
        step={50}
        suffix=" msg/s"
        onChange={(v) => set('targetWorkload', v)}
      />
      <input
        type="number"
        min={SIMULATION_CONFIG.MIN_WORKLOAD}
        max={SIMULATION_CONFIG.MAX_WORKLOAD}
        value={params.targetWorkload}
        onChange={(e) => set('targetWorkload', Number(e.target.value))}
        className="nodrag w-full rounded-md border border-[#27272A] bg-[#18181B] px-3 py-2 text-sm text-[#FAFAFA] outline-none focus:border-[#3B82F6]"
      />

      <RangeRow
        label="Logical actors"
        value={params.actorCount}
        min={SIMULATION_CONFIG.MIN_ACTORS}
        max={SIMULATION_CONFIG.MAX_ACTORS}
        step={10}
        onChange={(v) => set('actorCount', v)}
      />

      <RangeRow
        label="Initial pods"
        value={params.initialPods}
        min={SIMULATION_CONFIG.MIN_PODS}
        max={params.maxPods}
        onChange={(v) => set('initialPods', v)}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Min pods</FieldLabel>
          <input
            type="number"
            min={1}
            max={10}
            value={params.minPods}
            onChange={(e) => set('minPods', Number(e.target.value))}
            className="w-full rounded-md border border-[#27272A] bg-[#18181B] px-2 py-1.5 text-sm text-[#FAFAFA]"
          />
        </div>
        <div>
          <FieldLabel>Max pods</FieldLabel>
          <input
            type="number"
            min={1}
            max={SIMULATION_CONFIG.MAX_PODS}
            value={params.maxPods}
            onChange={(e) => set('maxPods', Number(e.target.value))}
            className="w-full rounded-md border border-[#27272A] bg-[#18181B] px-2 py-1.5 text-sm text-[#FAFAFA]"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Scaling mode</FieldLabel>
        <select
          value={params.scalingMode}
          onChange={(e) => set('scalingMode', e.target.value)}
          className="w-full rounded-md border border-[#27272A] bg-[#18181B] px-2 py-2 text-sm text-[#FAFAFA]"
        >
          <option value={SCALING_MODES.AUTOMATIC}>Automatic</option>
          <option value={SCALING_MODES.MANUAL}>Manual</option>
        </select>
      </div>

      {params.scalingMode === SCALING_MODES.MANUAL && (
        <RangeRow
          label="Manual pod count"
          value={params.manualPodCount}
          min={params.minPods}
          max={params.maxPods}
          onChange={(v) => set('manualPodCount', v)}
        />
      )}

      <RangeRow
        label="CPU scaling threshold"
        value={params.cpuThreshold}
        min={30}
        max={90}
        suffix="%"
        onChange={(v) => set('cpuThreshold', v)}
      />

      <div>
        <FieldLabel>Workload pattern</FieldLabel>
        <select
          value={params.workloadPattern}
          onChange={(e) => set('workloadPattern', e.target.value)}
          className="w-full rounded-md border border-[#27272A] bg-[#18181B] px-2 py-2 text-sm text-[#FAFAFA]"
        >
          <option value={WORKLOAD_PATTERNS.STEADY}>Steady</option>
          <option value={WORKLOAD_PATTERNS.RAMP_UP}>Ramp-up</option>
          <option value={WORKLOAD_PATTERNS.BURST}>Burst</option>
        </select>
      </div>

      <div>
        <FieldLabel>Simulation speed</FieldLabel>
        <div className="flex gap-2">
          {[1, 2, 5].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => set('simulationSpeed', speed)}
              className={`flex-1 rounded-md border px-2 py-1.5 text-sm ${
                params.simulationSpeed === speed
                  ? 'border-[#3B82F6] bg-[#3B82F6]/20 text-[#FAFAFA]'
                  : 'border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <details className="rounded-md border border-[#27272A] bg-[#18181B] p-3">
        <summary className="cursor-pointer text-xs font-medium text-[#A1A1AA]">
          Advanced — failure rate (demo)
        </summary>
        <div className="mt-3">
          <RangeRow
            label="Failure rate"
            value={Math.round(params.failureRate * 100)}
            min={0}
            max={50}
            suffix="%"
            onChange={(v) => set('failureRate', v / 100)}
          />
        </div>
      </details>

      <div className="mt-auto grid grid-cols-2 gap-2">
        {!isRunning && !isPaused && (
          <button
            type="button"
            onClick={onStart}
            className="col-span-2 rounded-md bg-[#3B82F6] px-3 py-2 text-sm font-medium text-white hover:bg-[#2563EB]"
          >
            Start
          </button>
        )}
        {isRunning && (
          <button
            type="button"
            onClick={onPause}
            className="rounded-md border border-[#27272A] bg-[#18181B] px-3 py-2 text-sm text-[#FAFAFA] hover:border-[#3B82F6]"
          >
            Pause
          </button>
        )}
        {isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="rounded-md bg-[#22C55E] px-3 py-2 text-sm font-medium text-[#09090B]"
          >
            Resume
          </button>
        )}
        {(isRunning || isPaused) && (
          <button
            type="button"
            onClick={onStop}
            className="rounded-md border border-[#EF4444]/50 bg-[#18181B] px-3 py-2 text-sm text-[#EF4444]"
          >
            Stop
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="col-span-2 rounded-md border border-[#27272A] bg-[#18181B] px-3 py-2 text-sm text-[#A1A1AA] hover:text-[#FAFAFA]"
        >
          Reset
        </button>
      </div>
    </aside>
  );
}
