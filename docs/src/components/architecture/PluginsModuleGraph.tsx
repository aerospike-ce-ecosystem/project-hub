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

const ORANGE = { color: '#fff3e0', borderColor: '#f57c00' };
const PURPLE = { color: '#f3e5f5', borderColor: '#9c27b0' };
const GREEN = { color: '#e8f5e9', borderColor: '#4caf50' };
const BLUE = { color: '#e3f2fd', borderColor: '#1976d2' };
const TEAL = { color: '#e0f2f1', borderColor: '#00897b' };
const RED = { color: '#ffebee', borderColor: '#e53935' };
const GREY = { color: '#f5f5f5', borderColor: '#757575' };

/* ------------------------------------------------------------------ */
/*  Nodes                                                              */
/* ------------------------------------------------------------------ */

const initialNodes: Node<ModuleNodeData>[] = [
  /* ---- Plugin Manifest ---- */
  {
    id: 'manifest',
    type: 'moduleNode',
    position: { x: 310, y: 0 },
    data: {
      label: 'Plugin Manifest',
      items: ['plugin.json', 'marketplace.json', 'v1.0.0'],
      icon: '\uD83D\uDCCB',
      ...ORANGE,
    },
  },

  /* ---- Skills (ACKO) ---- */
  {
    id: 'skill-deploy',
    type: 'moduleNode',
    position: { x: 0, y: 130 },
    data: {
      label: 'acko-deploy',
      items: ['8 YAML examples', 'CE constraints', 'quick deploy'],
      icon: '\u2638\uFE0F',
      ...GREEN,
    },
  },
  {
    id: 'skill-ops',
    type: 'moduleNode',
    position: { x: 270, y: 130 },
    data: {
      label: 'acko-operations',
      items: ['scale', 'upgrade', 'restart', 'ACL', 'troubleshooting'],
      icon: '\uD83D\uDD27',
      ...GREEN,
    },
  },
  {
    id: 'skill-config',
    type: 'moduleNode',
    position: { x: 540, y: 130 },
    data: {
      label: 'acko-config-reference',
      items: ['CE 8.1 params', 'CRD mapping', 'breaking changes'],
      icon: '\uD83D\uDCDC',
      ...GREEN,
    },
  },

  /* ---- Skills (Python) ---- */
  {
    id: 'skill-py-api',
    type: 'moduleNode',
    position: { x: 60, y: 280 },
    data: {
      label: 'aerospike-py-api',
      items: ['CRUD', 'batch', 'CDT', 'expression', 'admin', 'observability'],
      icon: '\uD83D\uDC0D',
      ...PURPLE,
    },
  },
  {
    id: 'skill-py-fastapi',
    type: 'moduleNode',
    position: { x: 380, y: 280 },
    data: {
      label: 'aerospike-py-fastapi',
      items: ['AsyncClient lifespan', 'DI pattern', 'error mapping'],
      icon: '\u26A1',
      ...PURPLE,
    },
  },

  /* ---- Agent ---- */
  {
    id: 'agent-debugger',
    type: 'moduleNode',
    position: { x: 200, y: 420 },
    data: {
      label: 'acko-cluster-debugger',
      items: ['autonomous agent', 'kubectl diagnostics', '39 issue-fix mappings', 'CE pitfalls'],
      icon: '\uD83D\uDD0D',
      ...BLUE,
    },
  },

  /* ---- Reference Docs ---- */
  {
    id: 'ref-docs',
    type: 'moduleNode',
    position: { x: 530, y: 420 },
    data: {
      label: 'Reference Documents',
      items: ['24 files', 'parameters', 'validation', 'diagnostic commands'],
      icon: '\uD83D\uDCDA',
      ...TEAL,
    },
  },

  /* ---- Target Repos ---- */
  {
    id: 'target-acko',
    type: 'moduleNode',
    position: { x: 60, y: 560 },
    data: {
      label: 'ACKO Repo',
      items: ['CRD', 'Controller', 'Helm'],
      icon: '\u2699\uFE0F',
      ...GREY,
    },
  },
  {
    id: 'target-py',
    type: 'moduleNode',
    position: { x: 330, y: 560 },
    data: {
      label: 'aerospike-py Repo',
      items: ['Client API', 'AsyncClient', 'CDT ops'],
      icon: '\uD83E\uDD80',
      ...GREY,
    },
  },
  {
    id: 'target-cm',
    type: 'moduleNode',
    position: { x: 590, y: 560 },
    data: {
      label: 'Cluster Manager Repo',
      items: ['FastAPI', 'Next.js'],
      icon: '\uD83D\uDDA5\uFE0F',
      ...GREY,
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Edges                                                              */
/* ------------------------------------------------------------------ */

const initialEdges: Edge[] = [
  // Manifest -> Skills
  { id: 'man-deploy', source: 'manifest', target: 'skill-deploy', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' } },
  { id: 'man-ops', source: 'manifest', target: 'skill-ops', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' } },
  { id: 'man-config', source: 'manifest', target: 'skill-config', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' } },
  { id: 'man-pyapi', source: 'manifest', target: 'skill-py-api', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' } },
  { id: 'man-pyfastapi', source: 'manifest', target: 'skill-py-fastapi', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' } },

  // Skills -> Reference Docs
  { id: 'deploy-ref', source: 'skill-deploy', target: 'ref-docs', label: 'includes', style: { stroke: '#00897b', strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00897b' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'ops-ref', source: 'skill-ops', target: 'ref-docs', style: { stroke: '#00897b', strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00897b' } },
  { id: 'config-ref', source: 'skill-config', target: 'ref-docs', style: { stroke: '#00897b', strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00897b' } },
  { id: 'pyapi-ref', source: 'skill-py-api', target: 'ref-docs', style: { stroke: '#00897b', strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#00897b' } },

  // Skills -> Agent (config-ref used by agent)
  { id: 'ops-agent', source: 'skill-ops', target: 'agent-debugger', label: 'informs', style: { stroke: '#1976d2' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'config-agent', source: 'skill-config', target: 'agent-debugger', style: { stroke: '#1976d2' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' } },

  // Skills/Agent -> Target repos
  { id: 'deploy-acko', source: 'skill-deploy', target: 'target-acko', label: 'guides', animated: true, style: { stroke: '#4caf50' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4caf50' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'ops-acko', source: 'skill-ops', target: 'target-acko', style: { stroke: '#4caf50' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4caf50' } },
  { id: 'agent-acko', source: 'agent-debugger', target: 'target-acko', label: 'debugs', animated: true, style: { stroke: '#1976d2' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'pyapi-py', source: 'skill-py-api', target: 'target-py', label: 'guides', animated: true, style: { stroke: '#9c27b0' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9c27b0' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'pyfastapi-py', source: 'skill-py-fastapi', target: 'target-py', style: { stroke: '#9c27b0' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9c27b0' } },
  { id: 'pyfastapi-cm', source: 'skill-py-fastapi', target: 'target-cm', label: 'references', style: { stroke: '#9c27b0', strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9c27b0' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const nodeTypes = { moduleNode: ModuleNode };

export default function PluginsModuleGraph() {
  const nodes = useMemo(() => initialNodes, []);
  const edges = useMemo(() => initialEdges, []);

  return (
    <div style={{ width: '100%', height: 700, position: 'relative' }}>
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

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
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
        <div><span style={{ color: '#f57c00' }}>{'\u25A0'}</span> Plugin Manifest</div>
        <div><span style={{ color: '#4caf50' }}>{'\u25A0'}</span> ACKO Skills</div>
        <div><span style={{ color: '#9c27b0' }}>{'\u25A0'}</span> Python Skills</div>
        <div><span style={{ color: '#1976d2' }}>{'\u25A0'}</span> Agent</div>
        <div><span style={{ color: '#00897b' }}>{'\u25A0'}</span> Reference Docs</div>
        <div><span style={{ color: '#757575' }}>{'\u25A0'}</span> Target Repos</div>
      </div>
    </div>
  );
}
