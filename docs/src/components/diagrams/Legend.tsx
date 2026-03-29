import React from 'react';

interface LegendProps {
  items: Record<string, string>;
}

export function Legend({ items }: LegendProps) {
  const entries = Object.entries(items);
  if (entries.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 11,
        zIndex: 5,
        lineHeight: 1.8,
      }}
    >
      {entries.map(([color, text]) => (
        <div key={color} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: color,
              border: `1px solid ${color}`,
              flexShrink: 0,
            }}
          />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}
