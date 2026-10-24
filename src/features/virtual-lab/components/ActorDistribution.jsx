import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { useEffect } from 'react';
import '@xyflow/react/dist/style.css';
import { canvasNodeTypes } from './canvas/CanvasNodes.jsx';
import CanvasPalette from './canvas/CanvasPalette.jsx';
import { useCanvasGraph } from '../hooks/useCanvasGraph.js';

function FitViewBridge({ fitViewRef }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    fitViewRef.current = fitView;
  }, [fitView, fitViewRef]);
  return null;
}

function ActorDistributionCanvas({
  pods,
  actorCount,
  incomingRate,
  queue,
  targetWorkload,
  params,
  onParamsChange,
}) {
  const {
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
  } = useCanvasGraph({
    pods,
    incomingRate,
    queue,
    targetWorkload,
    actorCount,
    params,
    onParamsChange,
  });

  return (
    <div className="flex h-[480px] flex-col gap-2">
      <CanvasPalette
        onAddNode={addNodeAtCenter}
        onAutoLayout={autoLayout}
        onClearUserNodes={clearUserNodes}
        userNodeCount={userNodeCount}
      />
      <div className="min-h-0 flex-1 rounded-lg border border-[#27272A] bg-[#09090B]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={onNodesDelete}
          nodeTypes={canvasNodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={['Backspace', 'Delete']}
          panOnScroll
          selectionOnDrag
          className="simulation-canvas"
        >
          <FitViewBridge fitViewRef={fitViewRef} />
          <Background color="#27272A" gap={16} />
          <Controls className="!border-[#27272A] !bg-[#18181B] !shadow-none [&>button]:!border-[#27272A] [&>button]:!bg-[#18181B] [&>button]:!fill-[#FAFAFA]" />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'simPod' || n.type === 'ingressSim') return '#3B82F6';
              if (n.type === 'actor') return '#2563EB';
              if (n.type === 'queue') return '#F59E0B';
              return '#52525B';
            }}
            maskColor="rgb(9 9 11 / 0.85)"
            className="!border !border-[#27272A] !bg-[#111114]"
          />
        </ReactFlow>
      </div>
      <p className="text-[11px] text-[#71717A]">
        Drag nodes, connect handles, select and press Delete to remove. Adding Actor or Pod updates simulation
        parameters; live sim pods and ingress sync from the engine.
      </p>
    </div>
  );
}

export default function ActorDistribution(props) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-[#FAFAFA]">Topology Canvas (Simulated)</h2>
        <p className="text-xs text-[#A1A1AA]">
          {props.actorCount} logical actors — build the flow with actors, routers, queues, and live sim pods.
        </p>
      </div>
      <ReactFlowProvider>
        <ActorDistributionCanvas {...props} />
      </ReactFlowProvider>
    </section>
  );
}
