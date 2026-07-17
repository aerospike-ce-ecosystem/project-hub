import React, {useEffect, useMemo, useRef, useState} from 'react';
import {repoColor, repoLabel} from './constants';
import styles from './styles.module.css';

interface Props {
  weeksDisplay: string[];
  weeksDateRange: string[];
  weeksAxis: string[];
  repos: string[];
  repoSeries: Record<string, number[]>;
  totalPerWeek: number[];
}

// The week count grows by one every Monday, so the plot is horizontally
// scrollable: every week gets a fixed minimum width and the chart scrolls
// inside its card once the weeks outgrow the available space. X-axis labels
// are thinned to at most MAX_TICKS so they never collide.
const PER_WEEK = 40; // min horizontal px per week before the chart scrolls
const MAX_TICKS = 13; // most X-axis labels to render at once

/**
 * Pure-SVG stacked bar chart. Horizontal axis = weeks, vertical = PR count.
 * Hover (or focus) a bar to see the per-repo breakdown in the tooltip.
 */
export default function WeeklyChart({
  weeksDisplay,
  weeksDateRange,
  weeksAxis,
  repos,
  repoSeries,
  totalPerWeek,
}: Props): React.JSX.Element {
  const [hover, setHover] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const n = weeksAxis.length;
  const M = {top: 16, right: 12, bottom: 56, left: 40};
  const H = 320;
  // Width grows with the week count; min-width + overflow-x makes it scroll.
  const innerW = Math.max(1, n) * PER_WEEK;
  const W = M.left + innerW + M.right;
  const innerH = H - M.top - M.bottom;

  const maxY = useMemo(() => {
    const m = Math.max(...totalPerWeek, 1);
    // round up to nearest 20 for clean grid lines
    return Math.ceil(m / 20) * 20;
  }, [totalPerWeek]);

  const bandWidth = innerW / Math.max(1, n);
  const barWidth = Math.max(8, bandWidth * 0.7);
  const yScale = (v: number) => (v / maxY) * innerH;
  const yTicks = Array.from({length: 5}, (_, i) => Math.round((maxY / 4) * i));

  // Thin the X-axis labels: show every `labelStep`-th tick plus the last week,
  // so the newest bucket is always labelled no matter how the step lands.
  const labelStep = Math.max(1, Math.ceil(n / MAX_TICKS));
  const showLabel = (i: number) => i % labelStep === 0 || i === n - 1;

  // Open on the most recent weeks (right edge) rather than the oldest.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [n]);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartScroll} ref={scrollRef}>
        <div className={styles.chartInner} style={{minWidth: `${W}px`}}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className={styles.chartSvg}
            role="img"
            aria-label="Weekly PR creation trend"
          >
            {/* Y grid + labels */}
            {yTicks.map((t) => {
              const y = M.top + innerH - yScale(t);
              return (
                <g key={t}>
                  <line
                    x1={M.left}
                    x2={W - M.right}
                    y1={y}
                    y2={y}
                    className={styles.gridLine}
                  />
                  <text x={M.left - 6} y={y + 4} className={styles.axisLabel} textAnchor="end">
                    {t}
                  </text>
                </g>
              );
            })}

            {/* Stacked bars — pointer events cover mouse + touch + pen in one path */}
            {weeksAxis.map((_, i) => {
              const x = M.left + bandWidth * i + (bandWidth - barWidth) / 2;
              let cumY = M.top + innerH;
              return (
                <g
                  key={i}
                  role="button"
                  tabIndex={0}
                  aria-label={`${weeksDisplay[i]}, total ${totalPerWeek[i]} PRs`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onPointerDown={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                >
                  {/* Hit area — fillOpacity 0 keeps the rect interactive in Safari */}
                  <rect
                    x={M.left + bandWidth * i}
                    y={M.top}
                    width={bandWidth}
                    height={innerH}
                    fill="black"
                    fillOpacity={0}
                  />
                  {repos.map((repo) => {
                    const v = repoSeries[repo]?.[i] ?? 0;
                    if (v === 0) return null;
                    const h = yScale(v);
                    cumY -= h;
                    return (
                      <rect
                        key={repo}
                        x={x}
                        y={cumY}
                        width={barWidth}
                        height={h}
                        fill={repoColor(repo)}
                        rx={2}
                        className={hover !== null && hover !== i ? styles.barDim : ''}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* X labels — thinned to at most MAX_TICKS so they never collide */}
            {weeksDisplay.map((label, i) => {
              if (!showLabel(i)) return null;
              const x = M.left + bandWidth * i + bandWidth / 2;
              return (
                <g key={i}>
                  <text
                    x={x}
                    y={H - M.bottom + 18}
                    className={styles.axisLabel}
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                  <text
                    x={x}
                    y={H - M.bottom + 32}
                    className={styles.axisLabelSub}
                    textAnchor="middle"
                  >
                    {weeksDateRange[i]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip lives inside the scrolled plot so it tracks its bar.
              Clamp to [6%, 94%] so it never spills past the chart bounds. */}
          {hover !== null && (
            <div
              className={styles.tooltip}
              style={{
                left: `${Math.min(94, Math.max(6, ((M.left + bandWidth * (hover + 0.5)) / W) * 100))}%`,
              }}
            >
              <div className={styles.tooltipTitle}>
                {weeksDisplay[hover]} <span className={styles.tooltipSub}>· {weeksDateRange[hover]}</span>
              </div>
              {repos
                .map((r) => ({repo: r, count: repoSeries[r]?.[hover] ?? 0}))
                .filter((d) => d.count > 0)
                .sort((a, b) => b.count - a.count)
                .map(({repo, count}) => (
                  <div key={repo} className={styles.tooltipRow}>
                    <span className={styles.tooltipDot} style={{background: repoColor(repo)}} />
                    <span className={styles.tooltipLabel}>{repoLabel(repo)}</span>
                    <span className={styles.tooltipValue}>{count}</span>
                  </div>
                ))}
              <div className={styles.tooltipFooter}>
                Total <strong>{totalPerWeek[hover]}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
