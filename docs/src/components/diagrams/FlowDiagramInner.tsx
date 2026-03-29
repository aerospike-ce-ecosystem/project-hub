import React, { useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FlowDiagramProps, SimpleNode, SimpleEdge } from './types';
import { getColors } from './themes/colors';
import { DefaultNode } from './nodes/DefaultNode';
import { StateNode } from './nodes/StateNode';
import { Legend } from './Legend';
import { applyDagreLayout } from './layout/dagre';

const nodeTypes = { default: DefaultNode, state: StateNode };

export default function FlowDiagramInner(props: FlowDiagramProps) {
  const {
    nodes: simpleNodes,
    edges: simpleEdges,
    height = 600,
    layout = 'dagre-TB',
    legend,
    showMiniMap = true,
    showControls = true,
  } = props;

  const { rfNodes, rfEdges } = useMemo(() => {
    const hasStateNodes = simpleNodes.some(
      (n) => n.group === 'state' || n.group === 'state-start' || n.group === 'state-end',
    );

    const mapped: Node[] = simpleNodes.map((n: SimpleNode) => {
      const isState =
        n.group === 'state' || n.group === 'state-start' || n.group === 'state-end';
      const colors = isState ? getColors('indigo') : getColors(n.group);

      return {
        id: n.id,
        type: isState ? 'state' : 'default',
        position: n.position ?? { x: 0, y: 0 },
        width: n.width,
        height: n.height,
        data: {
          label: n.label,
          description: n.description,
          items: n.items,
          icon: n.icon,
          color: colors.bg,
          borderColor: colors.border,
          url: n.url,
          isStart: n.group === 'state-start',
          isEnd: n.group === 'state-end',
        },
      } as Node;
    });

    const edges: Edge[] = simpleEdges.map((e: SimpleEdge, i: number) => {
      const sourceNode = simpleNodes.find((n) => n.id === e.from);
      const edgeColor =
        e.color ?? (sourceNode ? getColors(sourceNode.group).border : '#666');
      return {
        id: `e-${e.from}-${e.to}-${i}`,
        source: e.from,
        target: e.to,
        label: e.label,
        animated: e.animated ?? false,
        style: {
          stroke: edgeColor,
          ...(e.dashed ? { strokeDasharray: '6 3' } : {}),
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        labelStyle: { fontSize: 10, fill: '#666' },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
      };
    });

    if (layout !== 'manual') {
      const direction = layout === 'dagre-LR' ? 'LR' : 'TB';
      const nodeHeight = hasStateNodes ? 50 : 80;
      const laid = applyDagreLayout(mapped, edges, {
        direction,
        nodeWidth: 220,
        nodeHeight,
        rankSep: hasStateNodes ? 60 : 80,
        nodeSep: 40,
      });
      return { rfNodes: laid, rfEdges: edges };
    }

    return { rfNodes: mapped, rfEdges: edges };
  }, [simpleNodes, simpleEdges, layout]);

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height, position: 'relative' }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background gap={20} size={1} color="#e0e0e0" />
          {showControls && <Controls showInteractive={false} />}
          {showMiniMap && (
            <MiniMap
              nodeStrokeWidth={3}
              nodeColor={(node) => (node.data as { borderColor?: string })?.borderColor ?? '#aaa'}
              style={{ borderRadius: 8 }}
            />
          )}
        </ReactFlow>
        {legend && <Legend items={legend} />}
      </div>
    </ReactFlowProvider>
  );
}
