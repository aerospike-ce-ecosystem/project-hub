import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/* ------------------------------------------------------------------ */
/*  Custom Node                                                        */
/* ------------------------------------------------------------------ */

interface RepoNodeData {
  label: string;
  description: string;
  badges: string[];
  color: string;
  borderColor: string;
  icon: string;
  url?: string;
  [key: string]: unknown;
}

function RepoNode({ data }: NodeProps<Node<RepoNodeData>>) {
  const {
    label,
    description,
    badges = [],
    color,
    borderColor,
    icon,
    url,
  } = data;

  const handleClick = useCallback(() => {
    if (url) window.open(url, '_blank', 'noopener');
  }, [url]);

  return (
    <div
      onClick={handleClick}
      style={{
        background: color,
        border: `2px solid ${borderColor}`,
        borderRadius: 12,
        padding: '14px 18px',
        minWidth: 200,
        maxWidth: 260,
        cursor: url ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.15s',
        fontFamily: 'var(--ifm-font-family-base, system-ui)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 4px 20px ${borderColor}44`;
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <strong style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.2 }}>
          {label}
        </strong>
      </div>

      <div style={{ fontSize: 11, color: '#555', marginBottom: 8, lineHeight: 1.4 }}>
        {description}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {badges.map((badge) => (
          <span
            key={badge}
            style={{
              fontSize: 9,
              padding: '2px 7px',
              borderRadius: 10,
              background: `${borderColor}22`,
              border: `1px solid ${borderColor}55`,
              color: '#333',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nodes & Edges                                                      */
/* ------------------------------------------------------------------ */

const initialNodes: Node<RepoNodeData>[] = [
  // Core repos
  {
    id: 'aerospike-py',
    type: 'repoNode',
    position: { x: 100, y: 250 },
    data: {
      label: 'aerospike-py',
      description: 'Rust/PyO3 Python client for Aerospike CE',
      badges: ['Python', 'Rust', 'PyO3', 'Async'],
      color: '#f3e5f5',
      borderColor: '#9c27b0',
      icon: '\uD83D\uDC0D',
      url: 'https://github.com/aerospike-ce-ecosystem/aerospike-py',
    },
  },
  {
    id: 'acko',
    type: 'repoNode',
    position: { x: 520, y: 250 },
    data: {
      label: 'ACKO',
      description: 'Aerospike CE Kubernetes Operator',
      badges: ['Go', 'K8s Operator', 'Helm', 'CRD'],
      color: '#e8f5e9',
      borderColor: '#4caf50',
      icon: '\u2638\uFE0F',
      url: 'https://github.com/aerospike-ce-ecosystem/aerospike-ce-kubernetes-operator',
    },
  },
  {
    id: 'cluster-manager',
    type: 'repoNode',
    position: { x: 100, y: 50 },
    data: {
      label: 'Cluster Manager',
      description: 'Web UI for Aerospike cluster management',
      badges: ['Next.js', 'FastAPI', 'Zustand', 'Radix UI'],
      color: '#e1f5fe',
      borderColor: '#0288d1',
      icon: '\uD83D\uDDA5\uFE0F',
      url: 'https://github.com/aerospike-ce-ecosystem/aerospike-cluster-manager',
    },
  },
  {
    id: 'plugins',
    type: 'repoNode',
    position: { x: 520, y: 50 },
    data: {
      label: 'Ecosystem Plugins',
      description: 'Claude Code skills, agents, hooks',
      badges: ['Claude Code', 'Skills', 'Agents', 'Hooks'],
      color: '#fff3e0',
      borderColor: '#f57c00',
      icon: '\uD83E\uDDE9',
      url: 'https://github.com/aerospike-ce-ecosystem/aerospike-ce-ecosystem-plugins',
    },
  },
  // External deps
  {
    id: 'aerospike-server',
    type: 'repoNode',
    position: { x: 310, y: 480 },
    data: {
      label: 'Aerospike Server CE',
      description: 'Aerospike Community Edition database server',
      badges: ['CE 8.1', 'NoSQL', 'C'],
      color: '#ffebee',
      borderColor: '#e53935',
      icon: '\uD83D\uDDC4\uFE0F',
    },
  },
  {
    id: 'kubernetes',
    type: 'repoNode',
    position: { x: 660, y: 480 },
    data: {
      label: 'Kubernetes',
      description: 'Container orchestration platform',
      badges: ['K8s API', 'CRD', 'StatefulSet'],
      color: '#f5f5f5',
      borderColor: '#757575',
      icon: '\u2699\uFE0F',
    },
  },
];

const initialEdges: Edge[] = [
  // aerospike-py connections
  {
    id: 'py-server',
    source: 'aerospike-py',
    target: 'aerospike-server',
    label: 'protocol',
    animated: true,
    style: { stroke: '#9c27b0' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9c27b0' },
    labelStyle: { fontSize: 10, fill: '#666' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
  },
  // cluster-manager -> aerospike-py
  {
    id: 'cm-py',
    source: 'cluster-manager',
    target: 'aerospike-py',
    label: 'uses (backend)',
    style: { stroke: '#0288d1' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0288d1' },
    labelStyle: { fontSize: 10, fill: '#666' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
  },
  // cluster-manager -> kubernetes
  {
    id: 'cm-k8s',
    source: 'cluster-manager',
    target: 'kubernetes',
    label: 'manages',
    style: { stroke: '#0288d1', strokeDasharray: '6 3' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0288d1' },
    labelStyle: { fontSize: 10, fill: '#666' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
  },
  // acko -> aerospike-server
  {
    id: 'acko-server',
    source: 'acko',
    target: 'aerospike-server',
    label: 'manages',
    animated: true,
    style: { stroke: '#4caf50' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4caf50' },
    labelStyle: { fontSize: 10, fill: '#666' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
  },
  // acko -> kubernetes
  {
    id: 'acko-k8s',
    source: 'acko',
    target: 'kubernetes',
    label: 'extends',
    animated: true,
    style: { stroke: '#4caf50' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4caf50' },
    labelStyle: { fontSize: 10, fill: '#666' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
  },
  // plugins -> aerospike-py
  {
    id: 'plugins-py',
    source: 'plugins',
    target: 'aerospike-py',
    label: 'guides',
    style: { stroke: '#f57c00', strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' },
    labelStyle: { fontSize: 10, fill: '#666' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
  },
  // plugins -> acko
  {
    id: 'plugins-acko',
    source: 'plugins',
    target: 'acko',
    label: 'guides',
    style: { stroke: '#f57c00', strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' },
    labelStyle: { fontSize: 10, fill: '#666' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
  },
  // plugins -> cluster-manager
  {
    id: 'plugins-cm',
    source: 'plugins',
    target: 'cluster-manager',
    label: 'references',
    style: { stroke: '#f57c00', strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' },
    labelStyle: { fontSize: 10, fill: '#666' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
  },
];

/* ------------------------------------------------------------------ */
/*  Legend                                                              */
/* ------------------------------------------------------------------ */

function Legend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 11,
        zIndex: 5,
        lineHeight: 1.8,
      }}
    >
      <strong style={{ fontSize: 12 }}>Legend</strong>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="30" height="10">
          <line x1="0" y1="5" x2="30" y2="5" stroke="#666" strokeWidth="2" />
          <polygon points="28,2 30,5 28,8" fill="#666" />
        </svg>
        <span>uses / extends</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="30" height="10">
          <line x1="0" y1="5" x2="30" y2="5" stroke="#666" strokeWidth="2" strokeDasharray="4 4" />
          <polygon points="28,2 30,5 28,8" fill="#666" />
        </svg>
        <span>guides / references</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="30" height="14">
          <line x1="0" y1="7" x2="20" y2="7" stroke="#666" strokeWidth="2">
            <animate attributeName="x1" values="0;8;0" dur="1.5s" repeatCount="indefinite" />
          </line>
          <polygon points="28,4 30,7 28,10" fill="#666" />
        </svg>
        <span>animated = runtime connection</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const nodeTypes = { repoNode: RepoNode };

export default function EcosystemDependencyGraph() {
  const nodes = useMemo(() => initialNodes, []);
  const edges = useMemo(() => initialEdges, []);

  return (
    <div style={{ width: '100%', height: 650, position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background gap={20} size={1} color="#e0e0e0" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const d = node.data as RepoNodeData;
            return d?.borderColor ?? '#aaa';
          }}
          style={{ borderRadius: 8 }}
        />
      </ReactFlow>
      <Legend />
    </div>
  );
}
