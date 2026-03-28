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
        minWidth: 190,
        maxWidth: 300,
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

const GREEN = { color: '#e8f5e9', borderColor: '#4caf50' };
const BLUE = { color: '#e3f2fd', borderColor: '#1976d2' };
const PURPLE = { color: '#f3e5f5', borderColor: '#9c27b0' };
const ORANGE = { color: '#fff3e0', borderColor: '#f57c00' };
const TEAL = { color: '#e0f2f1', borderColor: '#00897b' };
const RED = { color: '#ffebee', borderColor: '#e53935' };
const GREY = { color: '#f5f5f5', borderColor: '#757575' };

/* ------------------------------------------------------------------ */
/*  Nodes                                                              */
/* ------------------------------------------------------------------ */

const initialNodes: Node<ModuleNodeData>[] = [
  // CRD Layer
  {
    id: 'crd',
    type: 'moduleNode',
    position: { x: 320, y: 0 },
    data: {
      label: 'CRD (api/v1alpha1)',
      items: [
        'AerospikeCluster types',
        'AerospikeClusterTemplate',
        'webhook validation',
        'defaulting',
        'types_monitoring',
        'types_network',
        'types_networkpolicy',
        'types_storage',
        'types_rack',
        'types_pod',
      ],
      icon: '\uD83D\uDCDC',
      ...GREEN,
    },
  },

  // Controller Layer
  {
    id: 'controller-core',
    type: 'moduleNode',
    position: { x: 0, y: 160 },
    data: {
      label: 'Controller Core',
      items: [
        'reconciler.go',
        'reconciler_statefulset.go',
        'reconciler_status.go',
        'reconciler_restart.go',
        'reconciler_acl.go',
        'reconciler_helpers.go',
        'events.go',
      ],
      icon: '\uD83C\uDFAF',
      ...BLUE,
    },
  },
  {
    id: 'controller-config',
    type: 'moduleNode',
    position: { x: 310, y: 160 },
    data: {
      label: 'Controller Config',
      items: [
        'reconciler_config.go',
        'reconciler_dynamic_config.go',
        'reconciler_monitoring.go',
        'reconciler_services.go',
        'aero_client.go',
        'aero_info.go',
        'retry.go',
      ],
      icon: '\u2699\uFE0F',
      ...BLUE,
    },
  },
  {
    id: 'controller-resources',
    type: 'moduleNode',
    position: { x: 620, y: 160 },
    data: {
      label: 'Controller Resources',
      items: [
        'reconciler_pdb.go',
        'reconciler_cleanup.go',
        'reconciler_operations.go',
        'reconciler_networkpolicy.go',
        'reconciler_scaledown.go',
        'reconciler_warm_restart.go',
        'reconciler_pod_service.go',
        'reconciler_readiness_gate.go',
      ],
      icon: '\uD83D\uDD27',
      ...BLUE,
    },
  },

  // Internal packages
  {
    id: 'internal',
    type: 'moduleNode',
    position: { x: 0, y: 340 },
    data: {
      label: 'Internal Packages',
      items: [
        'configdiff', 'configgen', 'errors',
        'initcontainer', 'metrics', 'podutil',
        'storage', 'template', 'utils', 'version',
      ],
      icon: '\uD83D\uDCE6',
      ...PURPLE,
    },
  },

  // Helm Charts
  {
    id: 'helm',
    type: 'moduleNode',
    position: { x: 350, y: 340 },
    data: {
      label: 'Helm Charts',
      items: [
        'operator chart',
        'CRD subchart',
        'UI templates',
        'values.yaml',
      ],
      icon: '\u2638\uFE0F',
      ...ORANGE,
    },
  },

  // Managed K8s Resources
  {
    id: 'k8s-resources',
    type: 'moduleNode',
    position: { x: 630, y: 340 },
    data: {
      label: 'Managed K8s Resources',
      items: [
        'StatefulSet', 'Service', 'PVC',
        'ConfigMap', 'PDB', 'NetworkPolicy',
        'ServiceMonitor', 'PrometheusRule',
      ],
      icon: '\uD83C\uDFD7\uFE0F',
      ...TEAL,
    },
  },

  // External
  {
    id: 'controller-runtime',
    type: 'moduleNode',
    position: { x: 100, y: 510 },
    data: {
      label: 'controller-runtime v0.23',
      items: ['sigs.k8s.io/controller-runtime', 'client-go'],
      icon: '\uD83D\uDCDA',
      ...GREY,
    },
  },
  {
    id: 'as-go-client',
    type: 'moduleNode',
    position: { x: 450, y: 510 },
    data: {
      label: 'aerospike-client-go v8.6',
      items: ['info commands', 'cluster status', 'admin ops'],
      icon: '\uD83D\uDCE1',
      ...RED,
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Edges                                                              */
/* ------------------------------------------------------------------ */

const initialEdges: Edge[] = [
  // CRD -> Controllers
  { id: 'crd-core', source: 'crd', target: 'controller-core', label: 'watches', style: { stroke: '#4caf50' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4caf50' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'crd-config', source: 'crd', target: 'controller-config', style: { stroke: '#4caf50' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4caf50' } },
  { id: 'crd-res', source: 'crd', target: 'controller-resources', style: { stroke: '#4caf50' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4caf50' } },

  // Controllers -> Internal
  { id: 'core-int', source: 'controller-core', target: 'internal', label: 'imports', style: { stroke: '#1976d2' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'config-int', source: 'controller-config', target: 'internal', style: { stroke: '#1976d2' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' } },

  // Controllers -> K8s Resources
  { id: 'core-k8s', source: 'controller-core', target: 'k8s-resources', label: 'creates/updates', style: { stroke: '#1976d2', strokeDasharray: '6 3' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'res-k8s', source: 'controller-resources', target: 'k8s-resources', style: { stroke: '#1976d2', strokeDasharray: '6 3' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' } },

  // Helm -> CRD
  { id: 'helm-crd', source: 'helm', target: 'crd', label: 'installs', style: { stroke: '#f57c00', strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f57c00' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },

  // External deps
  { id: 'core-runtime', source: 'controller-core', target: 'controller-runtime', animated: true, label: 'framework', style: { stroke: '#757575' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#757575' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'core-asclient', source: 'controller-core', target: 'as-go-client', animated: true, label: 'info/admin', style: { stroke: '#e53935' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e53935' }, labelStyle: { fontSize: 10, fill: '#666' }, labelBgStyle: { fill: '#fff', fillOpacity: 0.85 } },
  { id: 'config-asclient', source: 'controller-config', target: 'as-go-client', style: { stroke: '#e53935' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e53935' } },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const nodeTypes = { moduleNode: ModuleNode };

export default function ACKOModuleGraph() {
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
        <div><span style={{ color: '#4caf50' }}>{'\u25A0'}</span> CRD / API</div>
        <div><span style={{ color: '#1976d2' }}>{'\u25A0'}</span> Controller</div>
        <div><span style={{ color: '#9c27b0' }}>{'\u25A0'}</span> Internal Packages</div>
        <div><span style={{ color: '#f57c00' }}>{'\u25A0'}</span> Helm Charts</div>
        <div><span style={{ color: '#00897b' }}>{'\u25A0'}</span> K8s Resources</div>
        <div><span style={{ color: '#757575' }}>{'\u25A0'}</span> External Deps</div>
      </div>
    </div>
  );
}
