import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

interface LayoutOptions {
  direction: 'TB' | 'LR';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions,
): Node[] {
  const {
    direction,
    nodeWidth = 200,
    nodeHeight = 80,
    rankSep = 80,
    nodeSep = 40,
  } = options;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep });

  for (const node of nodes) {
    const w = (node as Node & { width?: number }).width ?? nodeWidth;
    const h = (node as Node & { height?: number }).height ?? nodeHeight;
    g.setNode(node.id, { width: w, height: h });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const w = (node as Node & { width?: number }).width ?? nodeWidth;
    const h = (node as Node & { height?: number }).height ?? nodeHeight;

    // If the node has an explicit position, use it as override
    if (node.position.x !== 0 || node.position.y !== 0) {
      return node;
    }

    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    };
  });
}
