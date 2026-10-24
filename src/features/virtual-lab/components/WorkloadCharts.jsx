import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const chartProps = {
  margin: { top: 8, right: 8, left: 0, bottom: 0 },
};

function buildChartData(history) {
  const len = history.timestamps?.length ?? 0;
  return Array.from({ length: len }, (_, i) => ({
    t: history.timestamps[i],
    incoming: history.incoming[i],
    throughput: history.throughput[i],
    cpu: history.cpu[i],
    queue: history.queue[i],
    latency: history.latency[i],
    pods: history.pods[i],
  }));
}

function ChartPanel({ title, children }) {
  return (
    <div className="rounded-lg border border-[#27272A] bg-[#111114] p-3">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[#A1A1AA]">{title}</h3>
      <div className="h-44">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: '#18181B',
    border: '1px solid #27272A',
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: '#A1A1AA' },
};

export default function WorkloadCharts({ history }) {
  const data = buildChartData(history);

  if (!data.length) {
    return (
      <div className="rounded-lg border border-[#27272A] bg-[#111114] p-6 text-center text-sm text-[#A1A1AA]">
        Charts populate after the simulation advances.
      </div>
    );
  }

  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <ChartPanel title="Incoming vs throughput (simulated)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} {...chartProps}>
            <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fill: '#71717A', fontSize: 10 }} tickFormatter={(v) => `${v}s`} />
            <YAxis tick={{ fill: '#71717A', fontSize: 10 }} width={42} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="incoming" stroke="#3B82F6" dot={false} strokeWidth={2} name="Incoming" />
            <Line type="monotone" dataKey="throughput" stroke="#22C55E" dot={false} strokeWidth={2} name="Throughput" />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="CPU utilization (smoothed)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} {...chartProps}>
            <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fill: '#71717A', fontSize: 10 }} tickFormatter={(v) => `${v}s`} />
            <YAxis domain={[0, 100]} tick={{ fill: '#71717A', fontSize: 10 }} width={42} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="cpu" stroke="#F59E0B" dot={false} strokeWidth={2} name="CPU %" />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Queue depth">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} {...chartProps}>
            <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fill: '#71717A', fontSize: 10 }} tickFormatter={(v) => `${v}s`} />
            <YAxis tick={{ fill: '#71717A', fontSize: 10 }} width={42} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="queue" stroke="#EF4444" dot={false} strokeWidth={2} name="Queue" />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Estimated latency">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} {...chartProps}>
            <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fill: '#71717A', fontSize: 10 }} tickFormatter={(v) => `${v}s`} />
            <YAxis tick={{ fill: '#71717A', fontSize: 10 }} width={42} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="latency" stroke="#3B82F6" dot={false} strokeWidth={2} name="Latency (s)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Active pod count">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} {...chartProps}>
            <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fill: '#71717A', fontSize: 10 }} tickFormatter={(v) => `${v}s`} />
            <YAxis allowDecimals={false} tick={{ fill: '#71717A', fontSize: 10 }} width={42} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="pods" stroke="#22C55E" dot={false} strokeWidth={2} name="Pods" />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
    </section>
  );
}
