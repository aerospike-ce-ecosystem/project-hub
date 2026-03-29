export interface SimpleNode {
  id: string;
  label: string;
  description?: string;
  items?: string[];
  icon?: string;
  group?: string;
  url?: string;
  position?: { x: number; y: number };
  parent?: string;
  /** Node width hint for layout (default: 200) */
  width?: number;
  /** Node height hint for layout (default: auto) */
  height?: number;
}

export interface SimpleEdge {
  from: string;
  to: string;
  label?: string;
  animated?: boolean;
  dashed?: boolean;
  color?: string;
}

export interface FlowDiagramProps {
  nodes: SimpleNode[];
  edges: SimpleEdge[];
  height?: number;
  layout?: 'dagre-TB' | 'dagre-LR' | 'manual';
  legend?: Record<string, string>;
  showMiniMap?: boolean;
  showControls?: boolean;
}

export interface StateNodeData {
  label: string;
  isStart?: boolean;
  isEnd?: boolean;
  color: string;
  borderColor: string;
  [key: string]: unknown;
}

export interface DefaultNodeData {
  label: string;
  description?: string;
  items?: string[];
  icon?: string;
  color: string;
  borderColor: string;
  url?: string;
  [key: string]: unknown;
}
