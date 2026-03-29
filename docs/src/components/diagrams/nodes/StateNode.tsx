import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StateNodeData } from '../types';

export function StateNode({ data }: NodeProps<Node<StateNodeData>>) {
  const { label, isStart, isEnd, color, borderColor } = data;

  if (isStart || isEnd) {
    return (
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: isStart ? borderColor : 'transparent',
          border: `3px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isEnd && (
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: borderColor }} />
        )}
        <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: color,
        border: `2px solid ${borderColor}`,
        borderRadius: 20,
        padding: '8px 18px',
        minWidth: 120,
        fontFamily: 'var(--ifm-font-family-base, system-ui)',
        textAlign: 'center',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 3px 12px ${borderColor}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <strong style={{ fontSize: 11, color: '#1a1a1a' }}>{label}</strong>
    </div>
  );
}
