import { latencyLabel } from '../engine/latencyModel.js';
import { formatSimTime } from '../utils/simulationMath.js';

function MetricCard({ label, value, hint, tone = 'default' }) {
  const toneClass =
    tone === 'warning'
      ? 'border-[#F59E0B]/40'
      : tone === 'error'
        ? 'border-[#EF4444]/40'
        : 'border-[#27272A]';

  return (
    <div className={`rounded-lg border bg-[#111114] p-3 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-wide text-[#A1A1AA]">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-[#FAFAFA]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[#71717A]">{hint}</p> : null}
    </div>
  );
}

export default function MetricsGrid({ metrics, simTime, capacityWarning }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#FAFAFA]">Live Metrics (Simulated)</h2>
        <span className="text-xs tabular-nums text-[#A1A1AA]">t = {formatSimTime(simTime)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard label="Target rate" value={`${Math.round(metrics.targetRate)} msg/s`} />
        <MetricCard label="Incoming rate" value={`${Math.round(metrics.incomingRate)} msg/s`} />
        <MetricCard label="Throughput" value={`${metrics.throughput.toFixed(1)} msg/s`} />
        <MetricCard label="Queue depth" value={Math.round(metrics.queue)} tone={metrics.queue > 500 ? 'warning' : 'default'} />
        <MetricCard
          label="Est. latency (avg)"
          value={latencyLabel(metrics.latency)}
          hint="Queue-based teaching metric"
        />
        <MetricCard label="Est. latency (p95)" value={latencyLabel(metrics.latencyP95)} />
        <MetricCard label="CPU (aggregate)" value={`${metrics.cpuUtilSmoothed.toFixed(1)}%`} />
        <MetricCard label="Memory (simulated)" value={`${metrics.memoryUtil.toFixed(1)}%`} hint="Simplified display model" />
        <MetricCard label="Total received" value={Math.round(metrics.totalReceived).toLocaleString()} />
        <MetricCard label="Total processed" value={Math.round(metrics.totalProcessed).toLocaleString()} />
        <MetricCard label="Failed (simulated)" value={Math.round(metrics.totalFailed).toLocaleString()} />
        <MetricCard label="Active / desired pods" value={`${metrics.activePods} / ${metrics.desiredPods}`} />
        <MetricCard label="Starting pods" value={metrics.startingPods} />
        <MetricCard label="Capacity util." value={`${metrics.capacityUtilization.toFixed(1)}%`} />
        <MetricCard label="Nominal capacity" value={`${Math.round(metrics.capacity)} msg/s`} />
        <MetricCard label="Actors" value={metrics.actorCount} hint="Even distribution across pods" />
        {capacityWarning ? (
          <MetricCard
            label="Capacity"
            value="Overload"
            tone="error"
            hint="Max pods reached; queue may grow"
          />
        ) : null}
      </div>
    </section>
  );
}
