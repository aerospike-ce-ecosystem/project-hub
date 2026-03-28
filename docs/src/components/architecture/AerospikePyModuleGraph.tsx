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
/*  Custom Nodes                                                       */
/* ------------------------------------------------------------------ */

interface LayerNodeData {
  label: string;
  items: string[];
  color: string;
  borderColor: string;
  icon: string;
  [key: string]: unknown;
}

function LayerNode({ data }: NodeProps<Node<LayerNodeData>>) {
  const { label, items, color, borderColor, icon } = data;
  return (
    <div
      style={{
        background: color,
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        padding: '12px 16px',
        minWidth: 180,
        maxWidth: 280,
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
/*  Node Data                                                          */
/* ------------------------------------------------------------------ */

const PURPLE = { color: '#f3e5f5', borderColor: '#9c27b0' };
const BLUE = { color: '#e3f2fd', borderColor: '#1976d2' };
const GREEN = { color: '#e8f5e9', borderColor: '#4caf50' };
const ORANGE = { color: '#fff3e0', borderColor: '#f57c00' };
const TEAL = { color: '#e0f2f1', borderColor: '#00897b' };
const RED = { color: '#ffebee', borderColor: '#e53935' };
const GREY = { color: '#f5f5f5', borderColor: '#757575' };

const initialNodes: Node<LayerNodeData>[] = [
  // Python Layer (top row)
  {
    id: 'py-client',
    type: 'layerNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'Python Client API',
      items: ['Client', 'AsyncClient', 'type stubs (.pyi)', 'exception', 'types'],
      icon: '\uD83D\uDC0D',
      ...PURPLE,
    },
  },
  {
    id: 'py-cdt',
    type: 'layerNode',
    position: { x: 300, y: 0 },
    data: {
      label: 'CDT Operations',
      items: ['list_ops', 'map_ops', 'bit_ops', 'hll_ops'],
      icon: '\uD83D\uDCE6',
      ...PURPLE,
    },
  },
  {
    id: 'py-expr',
    type: 'layerNode',
    position: { x: 560, y: 0 },
    data: {
      label: 'Expressions & Filters',
      items: ['exp module', 'Predicates', 'Filter expressions'],
      icon: '\uD83D\uDD0D',
      ...PURPLE,
    },
  },
  {
    id: 'py-numpy',
    type: 'layerNode',
    position: { x: 810, y: 0 },
    data: {
      label: 'NumPy Batch',
      items: ['batch_read', 'batch_write', 'numpy_support'],
      icon: '\uD83D\uDCCA',
      ...PURPLE,
    },
  },

  // PyO3 Bridge (middle)
  {
    id: 'pyo3-bridge',
    type: 'layerNode',
    position: { x: 330, y: 150 },
    data: {
      label: 'PyO3 Bridge',
      items: ['pyo3 0.28.2', '#[pyclass]', '#[pymethods]', 'GIL management'],
      icon: '\uD83D\uDD17',
      ...ORANGE,
    },
  },

  // Rust Core (third row)
  {
    id: 'rust-core',
    type: 'layerNode',
    position: { x: 0, y: 300 },
    data: {
      label: 'Rust Core',
      items: [
        'lib.rs', 'client.rs', 'async_client.rs', 'client_ops.rs',
        'client_common.rs', 'operations.rs', 'expressions.rs',
        'query.rs', 'numpy_support.rs', 'batch_types.rs',
        'backpressure.rs', 'record_helpers.rs', 'runtime.rs',
        'errors.rs', 'constants.rs',
      ],
      icon: '\uD83E\uDD80',
      ...RED,
    },
  },
  {
    id: 'rust-observability',
    type: 'layerNode',
    position: { x: 350, y: 300 },
    data: {
      label: 'Observability',
      items: ['metrics.rs', 'tracing.rs', 'logging.rs', 'bug_report.rs'],
      icon: '\uD83D\uDCCA',
      ...GREEN,
    },
  },
  {
    id: 'rust-policy',
    type: 'layerNode',
    position: { x: 610, y: 300 },
    data: {
      label: 'Policies',
      items: [
        'admin_policy', 'batch_policy', 'client_policy',
        'query_policy', 'read_policy', 'write_policy',
      ],
      icon: '\uD83D\uDCCB',
      ...TEAL,
    },
  },
  {
    id: 'rust-types',
    type: 'layerNode',
    position: { x: 860, y: 300 },
    data: {
      label: 'Types',
      items: ['key.rs', 'value.rs', 'record.rs', 'bin.rs', 'host.rs'],
      icon: '\uD83D\uDCDD',
      ...BLUE,
    },
  },

  // Runtime & External (bottom)
  {
    id: 'tokio',
    type: 'layerNode',
    position: { x: 150, y: 470 },
    data: {
      label: 'Tokio Runtime',
      items: ['async runtime', 'multi-thread scheduler'],
      icon: '\u26A1',
      ...GREY,
    },
  },
  {
    id: 'rust-client',
    type: 'layerNode',
    position: { x: 510, y: 470 },
    data: {
      label: 'aerospike-client-rust v2',
      items: ['alpha.10', 'wire protocol', 'connection pool'],
      icon: '\uD83D\uDCE1',
      ...RED,
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Edges                                                              */
/* ------------------------------------------------------------------ */

const initialEdges: Edge[] = [
  // Python -> PyO3
  { id: 'py-c-pyo3', source: 'py-client', target: 'pyo3-bridge', style: { stroke: '#9c27b0' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9c27b0' } },
  { id: 'py-cdt-pyo3', source: 'py-cdt', target: 'pyo3-bridge', style: { stroke: '#9c27b0' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9c27b0' } },
  { id: 'py-expr-pyo3', source: 'py-expr', target: 'pyo3-bridge', style: { stroke: '#9c27b0' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9c27b0' } },
  { id: 'py-np-pyo3', source: 'py-numpy', target: 'pyo3-bridge', style: { stroke: '#9c27b0' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9c27b0' } },

  // PyO3 -> Rust layers
  { id: 'pyo3-core', source: 'pyo3-bridge', target: 'rust-core', label: 'binds', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'pyo3-obs', source: 'pyo3-bridge', target: 'rust-observability', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' } },
  { id: 'pyo3-policy', source: 'pyo3-bridge', target: 'rust-policy', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' } },
  { id: 'pyo3-types', source: 'pyo3-bridge', target: 'rust-types', style: { stroke: '#f57c00' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' } },

  // Rust Core -> external
  { id: 'core-tokio', source: 'rust-core', target: 'tokio', label: 'async runtime', animated: true, style: { stroke: '#757575' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#757575' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'core-rclient', source: 'rust-core', target: 'rust-client', label: 'wire protocol', animated: true, style: { stroke: '#e53935' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e53935' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const nodeTypes = { layerNode: LayerNode };

export default function AerospikePyModuleGraph() {
  const nodes = useMemo(() => initialNodes, []);
  const edges = useMemo(() => initialEdges, []);

  return (
    <div style={{ width: '100%', height: 620, position: 'relative' }}>
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
            const d = node.data as LayerNodeData;
            return d?.borderColor ?? '#aaa';
          }}
          style={{ borderRadius: 8 }}
        />
      </ReactFlow>

      {/* Layer labels on the left */}
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
        <div><span style={{ color: '#9c27b0' }}>{'\u25A0'}</span> Python API</div>
        <div><span style={{ color: '#f57c00' }}>{'\u25A0'}</span> PyO3 Bridge</div>
        <div><span style={{ color: '#e53935' }}>{'\u25A0'}</span> Rust Core</div>
        <div><span style={{ color: '#4caf50' }}>{'\u25A0'}</span> Observability</div>
        <div><span style={{ color: '#00897b' }}>{'\u25A0'}</span> Policies</div>
        <div><span style={{ color: '#1976d2' }}>{'\u25A0'}</span> Types</div>
        <div><span style={{ color: '#757575' }}>{'\u25A0'}</span> External</div>
      </div>
    </div>
  );
}
