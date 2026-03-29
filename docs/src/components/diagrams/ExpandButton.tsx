import { useState, useCallback, useEffect, useRef } from 'react';

export function useExpandable() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  useEffect(() => {
    if (expanded) {
      document.documentElement.classList.add('diagram-expanded');

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setExpanded(false);
      };
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('keydown', onKey);
        document.documentElement.classList.remove('diagram-expanded');
      };
    }
  }, [expanded]);

  const containerClassName = expanded ? 'diagram-expanded-container' : '';

  const button = (
    <button
      onClick={toggle}
      title={expanded ? 'Close (ESC)' : 'Expand diagram'}
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        width: 32,
        height: 32,
        border: '1px solid var(--ifm-color-emphasis-300, #ccc)',
        borderRadius: 6,
        background: 'var(--ifm-background-surface-color, #fff)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ifm-color-emphasis-700, #555)',
      }}
    >
      {expanded ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="6,2 2,2 2,6" />
          <polyline points="10,14 14,14 14,10" />
          <line x1="2" y1="2" x2="6.5" y2="6.5" />
          <line x1="14" y1="14" x2="9.5" y2="9.5" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="10,2 14,2 14,6" />
          <polyline points="6,14 2,14 2,10" />
          <line x1="14" y1="2" x2="9.5" y2="6.5" />
          <line x1="2" y1="14" x2="6.5" y2="9.5" />
        </svg>
      )}
    </button>
  );

  return { containerRef, containerClassName, expanded, button };
}
