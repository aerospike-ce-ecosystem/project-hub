import React, { useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { DefaultNodeData } from '../types';

export function DefaultNode({ data }: NodeProps<Node<DefaultNodeData>>) {
  const { label, description, items = [], icon, color, borderColor, url } = data;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) window.open(url, '_blank', 'noopener');
  }, [url]);

  return (
    <div
      onClick={handleClick}
      style={{
        background: color,
        border: `2px solid ${borderColor}`,
        borderRadius: 12,
        padding: '12px 16px',
        minWidth: 160,
        maxWidth: 280,
        cursor: url ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.15s',
        fontFamily: 'var(--ifm-font-family-base, system-ui)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 20px ${borderColor}44`;
        e.currentTarget.style.transform = 'scale(1.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: description || items.length ? 6 : 0 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <strong style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.2 }}>
          {label}
        </strong>
      </div>

      {description && (
        <div style={{ fontSize: 10, color: '#555', marginBottom: items.length ? 6 : 0, lineHeight: 1.4 }}>
          {description}
        </div>
      )}

      {items.length > 0 && (
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
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
