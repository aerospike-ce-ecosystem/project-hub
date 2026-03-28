import React, { type ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

interface ReactFlowWrapperProps {
  children: ReactNode;
  height?: number;
  fallback?: ReactNode;
}

export default function ReactFlowWrapper({
  children,
  height = 600,
  fallback,
}: ReactFlowWrapperProps) {
  const defaultFallback = (
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
  );

  return (
    <BrowserOnly fallback={fallback ?? defaultFallback}>
      {() => <>{children}</>}
    </BrowserOnly>
  );
}
