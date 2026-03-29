import React, { useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FlowDiagramProps, SimpleNode, SimpleEdge } from './types';
import { getColors } from './themes/colors';
import { DefaultNode } from './nodes/DefaultNode';
import { StateNode } from './nodes/StateNode';
import { GroupNode } from './nodes/GroupNode';
import { Legend } from './Legend';
import { useExpandable } from './ExpandButton';
import { applyDagreLayout } from './layout/dagre';

const nodeTypes = { default: DefaultNode, state: StateNode, group: GroupNode };

export default function FlowDiagramInner(props: FlowDiagramProps) {
  const {
    nodes: simpleNodes,
    edges: simpleEdges,
    height = 600,
    layout = 'dagre-TB',
    legend,
    showControls = true,
  } = props;

  const { containerRef, containerClassName, button } = useExpandable();

  const { initialNodes, initialEdges } = useMemo(() => {
    const hasStateNodes = simpleNodes.some(
      (n) => n.group === 'state' || n.group === 'state-start' || n.group === 'state-end',
    );

    // Separate parent (group) nodes and regular nodes
    // Parent nodes: nodes that have width AND height AND are referenced by other nodes' parent field
    const parentIds = new Set(simpleNodes.filter((n) => n.parent).map((n) => n.parent!));

    const mapped: Node[] = simpleNodes.map((n: SimpleNode) => {
      const isState =
        n.group === 'state' || n.group === 'state-start' || n.group === 'state-end';
      const isGroupNode = parentIds.has(n.id) && n.width && n.height;
      const colors = isState ? getColors('indigo') : getColors(n.group);

      const node: Node = {
        id: n.id,
        type: isGroupNode ? 'group' : isState ? 'state' : 'default',
        position: n.position ?? { x: 0, y: 0 },
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
      };

      if (isGroupNode) {
        node.style = { width: n.width, height: n.height };
      }

      if (n.parent) {
        node.parentId = n.parent;
        node.extent = 'parent';
      }

      return node;
    });

    // Sort: parent nodes must come before their children
    mapped.sort((a, b) => {
      if (a.parentId && !b.parentId) return 1;
      if (!a.parentId && b.parentId) return -1;
      return 0;
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
      return { initialNodes: laid, initialEdges: edges };
    }

    return { initialNodes: mapped, initialEdges: edges };
  }, [simpleNodes, simpleEdges, layout]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  return (
    <ReactFlowProvider>
      <div ref={containerRef} className={containerClassName} style={{ width: '100%', height, position: 'relative' }}>
        {button}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background gap={20} size={1} color="#e0e0e0" />
          {showControls && <Controls />}
        </ReactFlow>
        {legend && <Legend items={legend} />}
      </div>
    </ReactFlowProvider>
  );
}
