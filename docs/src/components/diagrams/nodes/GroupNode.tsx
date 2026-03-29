import React, { useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

interface GroupNodeData {
  label: string;
  color: string;
  borderColor: string;
  icon?: string;
  description?: string;
  url?: string;
  [key: string]: unknown;
}

export function GroupNode({ data }: NodeProps<Node<GroupNodeData>>) {
  const { label, color, borderColor, icon, description, url } = data;

  const handleClick = useCallback(() => {
    if (url) window.open(url, '_blank', 'noopener');
  }, [url]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `${color}44`,
        border: `3px solid ${borderColor}`,
        borderRadius: 16,
        fontFamily: 'var(--ifm-font-family-base, system-ui)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />

      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '6px 12px',
          cursor: url ? 'pointer' : 'default',
        }}
      >
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: borderColor,
        }}>
          {label}
        </span>
      </div>

      {description && (
        <div style={{
          fontSize: 10,
          color: borderColor,
          opacity: 0.8,
          textAlign: 'center',
          marginTop: -4,
          paddingBottom: 4,
        }}>
          {description}
        </div>
      )}
    </div>
  );
}
