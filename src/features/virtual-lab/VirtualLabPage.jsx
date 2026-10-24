import ActorDistribution from './components/ActorDistribution.jsx';
import EventTimeline from './components/EventTimeline.jsx';
import MetricsGrid from './components/MetricsGrid.jsx';
import PodGrid from './components/PodGrid.jsx';
import SimulationControls from './components/SimulationControls.jsx';
import WorkloadCharts from './components/WorkloadCharts.jsx';
import { useSimulation } from './hooks/useSimulation.js';
import { SIMULATION_STATUS } from './engine/simulationConfig.js';

export default function VirtualLabPage() {
  const { state, start, pause, resume, stop, reset, updateParams } = useSimulation();

  const handleReset = () => reset(state.params);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
      <header className="sticky top-0 z-10 border-b border-[#27272A] bg-[#09090B]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#3B82F6]">ActorLab</p>
            <h1 className="text-xl font-semibold">Virtual Lab</h1>
            <p className="text-sm text-[#A1A1AA]">
              Mathematical simulation of actor workload, queues, and scaling behavior.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#F59E0B]/50 bg-[#F59E0B]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#F59E0B]">
              Simulation Mode
            </span>
            <span className="rounded-full border border-[#27272A] bg-[#111114] px-3 py-1 text-xs text-[#A1A1AA]">
              Status: {state.status}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-4 px-4 py-4 lg:grid-cols-[320px_1fr]">
        <SimulationControls
          params={state.params}
          status={state.status}
          onParamsChange={updateParams}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onReset={handleReset}
        />

        <div className="space-y-4">
          {state.status === SIMULATION_STATUS.IDLE && (
            <div className="rounded-lg border border-[#27272A] bg-[#111114] px-4 py-3 text-sm text-[#A1A1AA]">
              Configure workload and scaling, then press Start. All pods and metrics are simulated.
            </div>
          )}

          <MetricsGrid
            metrics={state.metrics}
            simTime={state.simTime}
            capacityWarning={state.metrics.capacityWarning}
          />

          <WorkloadCharts history={state.history} />

          <div className="grid gap-4 xl:grid-cols-2">
            <ActorDistribution
              pods={state.pods}
              actorCount={state.params.actorCount}
              incomingRate={state.metrics.incomingRate}
              queue={state.metrics.queue}
            />
            <EventTimeline events={state.events} />
          </div>

          <PodGrid pods={state.pods} />
        </div>
      </main>
    </div>
  );
}
