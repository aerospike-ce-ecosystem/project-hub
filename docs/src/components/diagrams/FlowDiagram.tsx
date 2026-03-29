import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import type { FlowDiagramProps } from './types';

export default function FlowDiagram(props: FlowDiagramProps) {
  const { height = 600 } = props;
  return (
    <BrowserOnly
      fallback={
        <div
          style={{
            width: '100%',
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--ifm-background-surface-color, #f8f9fa)',
            borderRadius: 8,
            border: '1px solid var(--ifm-color-emphasis-200, #dee2e6)',
            color: 'var(--ifm-color-emphasis-600, #868e96)',
            fontSize: 14,
          }}
        >
          Loading diagram...
        </div>
      }
    >
      {() => {
        const Inner = require('./FlowDiagramInner').default;
        return <Inner {...props} />;
      }}
    </BrowserOnly>
  );
}
