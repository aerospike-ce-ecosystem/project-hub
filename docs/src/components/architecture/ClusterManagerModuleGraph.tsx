import React, { useMemo } from 'react';
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

interface ModuleNodeData {
  label: string;
  items: string[];
  color: string;
  borderColor: string;
  icon: string;
  [key: string]: unknown;
}

function ModuleNode({ data }: NodeProps<Node<ModuleNodeData>>) {
  const { label, items, color, borderColor, icon } = data;
  return (
    <div
      style={{
        background: color,
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        padding: '12px 16px',
        minWidth: 180,
        maxWidth: 290,
        fontFamily: 'var(--ifm-font-family-base, system-ui)',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 4px 16px ${borderColor}33`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <strong style={{ fontSize: 12, color: '#1a1a1a' }}>{label}</strong>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {items.map((item) => (
          <span
            key={item}
            style={{
              fontSize: 9,
              padding: '1px 6px',
              borderRadius: 8,
              background: `${borderColor}18`,
              border: `1px solid ${borderColor}40`,
              color: '#444',
              fontFamily: 'var(--ifm-font-family-monospace, monospace)',
              whiteSpace: 'nowrap',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Colors                                                             */
/* ------------------------------------------------------------------ */

const BLUE = { color: '#e1f5fe', borderColor: '#0288d1' };
const INDIGO = { color: '#e8eaf6', borderColor: '#3f51b5' };
const PURPLE = { color: '#f3e5f5', borderColor: '#9c27b0' };
const TEAL = { color: '#e0f2f1', borderColor: '#00897b' };
const GREEN = { color: '#e8f5e9', borderColor: '#4caf50' };
const ORANGE = { color: '#fff3e0', borderColor: '#f57c00' };
const RED = { color: '#ffebee', borderColor: '#e53935' };
const GREY = { color: '#f5f5f5', borderColor: '#757575' };

/* ------------------------------------------------------------------ */
/*  Nodes                                                              */
/* ------------------------------------------------------------------ */

const initialNodes: Node<ModuleNodeData>[] = [
  /* ---- Frontend (Next.js) ---- */
  {
    id: 'fe-router',
    type: 'moduleNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'App Router (Next.js 16)',
      items: ['16 page routes', 'app/ directory', 'RSC', 'streaming'],
      icon: '\uD83C\uDF10',
      ...BLUE,
    },
  },
  {
    id: 'fe-components',
    type: 'moduleNode',
    position: { x: 300, y: 0 },
    data: {
      label: 'Components',
      items: [
        'ui/ (16 Radix)',
        'common/ (24)',
        'k8s/ (27)',
        'browser/',
        'cluster/',
        'cluster-list/',
        'connection/',
        'admin/',
        'layout/',
      ],
      icon: '\uD83E\uDDE9',
      ...BLUE,
    },
  },
  {
    id: 'fe-stores',
    type: 'moduleNode',
    position: { x: 0, y: 150 },
    data: {
      label: 'State (Zustand)',
      items: [
        '11 stores',
        'clusterStore',
        'k8sStore',
        'connectionStore',
        'uiStore',
      ],
      icon: '\uD83D\uDCBE',
      ...INDIGO,
    },
  },
  {
    id: 'fe-hooks',
    type: 'moduleNode',
    position: { x: 280, y: 150 },
    data: {
      label: 'Hooks & Types',
      items: [
        '6 custom hooks',
        '9 API type modules',
        '8 Zod schemas',
      ],
      icon: '\uD83D\uDD17',
      ...INDIGO,
    },
  },

  /* ---- Backend (FastAPI) ---- */
  {
    id: 'be-routers',
    type: 'moduleNode',
    position: { x: 610, y: 0 },
    data: {
      label: 'FastAPI Routers',
      items: [
        'admin_users', 'admin_roles', 'clusters',
        'connections', 'indexes', 'k8s_clusters',
        'metrics', 'query', 'records', 'sample_data', 'udfs',
      ],
      icon: '\u26A1',
      ...GREEN,
    },
  },
  {
    id: 'be-models',
    type: 'moduleNode',
    position: { x: 610, y: 160 },
    data: {
      label: 'Pydantic Models',
      items: [
        '15+ model files',
        'k8s/ subpackage',
        'request/response schemas',
      ],
      icon: '\uD83D\uDCCB',
      ...GREEN,
    },
  },
  {
    id: 'be-services',
    type: 'moduleNode',
    position: { x: 900, y: 0 },
    data: {
      label: 'Services & Utils',
      items: [
        'k8s_service',
        'metrics_service',
        'client_manager',
        'expression_builder',
        'converters',
        'rate_limit',
        'info_parser',
      ],
      icon: '\uD83D\uDD27',
      ...TEAL,
    },
  },
  {
    id: 'be-db',
    type: 'moduleNode',
    position: { x: 900, y: 150 },
    data: {
      label: 'Database Layer',
      items: ['aiosqlite (SQLite)', 'asyncpg (PostgreSQL)', 'dual-backend dispatch'],
      icon: '\uD83D\uDDC3\uFE0F',
      ...TEAL,
    },
  },

  /* ---- Dependencies ---- */
  {
    id: 'dep-aspy',
    type: 'moduleNode',
    position: { x: 200, y: 330 },
    data: {
      label: 'aerospike-py',
      items: ['AsyncClient', 'query', 'batch', 'CDT ops'],
      icon: '\uD83D\uDC0D',
      ...PURPLE,
    },
  },
  {
    id: 'dep-k8s-client',
    type: 'moduleNode',
    position: { x: 510, y: 330 },
    data: {
      label: 'Kubernetes Client',
      items: ['kubernetes-python', 'kubectl proxy'],
      icon: '\u2638\uFE0F',
      ...ORANGE,
    },
  },

  /* ---- External ---- */
  {
    id: 'ext-as',
    type: 'moduleNode',
    position: { x: 200, y: 480 },
    data: {
      label: 'Aerospike Server',
      items: ['CE 8.1', 'wire protocol'],
      icon: '\uD83D\uDDC4\uFE0F',
      ...RED,
    },
  },
  {
    id: 'ext-k8s',
    type: 'moduleNode',
    position: { x: 510, y: 480 },
    data: {
      label: 'Kubernetes API',
      items: ['cluster', 'pods', 'services'],
      icon: '\u2699\uFE0F',
      ...GREY,
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Edges                                                              */
/* ------------------------------------------------------------------ */

const initialEdges: Edge[] = [
  // Frontend internal
  { id: 'router-comp', source: 'fe-router', target: 'fe-components', label: 'renders', style: { stroke: '#0288d1' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0288d1' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'router-stores', source: 'fe-router', target: 'fe-stores', style: { stroke: '#0288d1' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0288d1' } },
  { id: 'comp-hooks', source: 'fe-components', target: 'fe-hooks', style: { stroke: '#0288d1' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0288d1' } },
  { id: 'comp-stores', source: 'fe-components', target: 'fe-stores', style: { stroke: '#3f51b5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3f51b5' } },

  // Frontend -> Backend (API calls)
  { id: 'hooks-routers', source: 'fe-hooks', target: 'be-routers', label: 'fetch API', style: { stroke: '#ff9800', strokeWidth: 2, strokeDasharray: '8 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ff9800' }, labelStyle: { fontSize: 10, fill: '#666', fontWeight: 600 }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'stores-routers', source: 'fe-stores', target: 'be-routers', style: { stroke: '#ff9800', strokeDasharray: '8 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ff9800' } },

  // Backend internal
  { id: 'routers-models', source: 'be-routers', target: 'be-models', style: { stroke: '#4caf50' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4caf50' } },
  { id: 'routers-services', source: 'be-routers', target: 'be-services', label: 'calls', style: { stroke: '#4caf50' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4caf50' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'services-db', source: 'be-services', target: 'be-db', style: { stroke: '#00897b' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00897b' } },

  // Backend -> Dependencies
  { id: 'routers-aspy', source: 'be-routers', target: 'dep-aspy', label: 'aerospike-py', style: { stroke: '#9c27b0' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9c27b0' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'services-k8s', source: 'be-services', target: 'dep-k8s-client', label: 'k8s ops', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },

  // Dependencies -> External
  { id: 'aspy-as', source: 'dep-aspy', target: 'ext-as', animated: true, style: { stroke: '#e53935' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e53935' } },
  { id: 'k8sclient-k8s', source: 'dep-k8s-client', target: 'ext-k8s', animated: true, style: { stroke: '#757575' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#757575' } },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const nodeTypes = { moduleNode: ModuleNode };

export default function ClusterManagerModuleGraph() {
  const nodes = useMemo(() => initialNodes, []);
  const edges = useMemo(() => initialEdges, []);

  return (
    <div style={{ width: '100%', height: 650, position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background gap={20} size={1} color="#e0e0e0" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const d = node.data as ModuleNodeData;
            return d?.borderColor ?? '#aaa';
          }}
          style={{ borderRadius: 8 }}
        />
      </ReactFlow>

      {/* Section labels */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 11,
          zIndex: 5,
          fontWeight: 600,
          color: '#0288d1',
        }}
      >
        Frontend (Next.js 16)
      </div>
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 100,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 11,
          zIndex: 5,
          fontWeight: 600,
          color: '#4caf50',
        }}
      >
        Backend (FastAPI)
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 10,
          zIndex: 5,
          lineHeight: 1.8,
        }}
      >
        <strong style={{ fontSize: 11 }}>Layers</strong>
        <div><span style={{ color: '#0288d1' }}>{'\u25A0'}</span> Frontend UI</div>
        <div><span style={{ color: '#3f51b5' }}>{'\u25A0'}</span> State / Hooks</div>
        <div><span style={{ color: '#4caf50' }}>{'\u25A0'}</span> Backend API</div>
        <div><span style={{ color: '#00897b' }}>{'\u25A0'}</span> Services / DB</div>
        <div><span style={{ color: '#9c27b0' }}>{'\u25A0'}</span> aerospike-py</div>
        <div><span style={{ color: '#f57c00' }}>{'\u25A0'}</span> K8s Client</div>
        <div><span style={{ color: '#ff9800' }}>{'\u25A0'} - -</span> API boundary</div>
      </div>
    </div>
  );
}
