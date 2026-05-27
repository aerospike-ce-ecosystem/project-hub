import React, {useMemo, useState} from 'react';
import {repoColor, repoLabel} from './constants';
import styles from './styles.module.css';

interface Props {
  weeksKorean: string[];
  weeksDateRange: string[];
  weeksAxis: string[];
  repos: string[];
  repoSeries: Record<string, number[]>;
  totalPerWeek: number[];
}

/**
 * Pure-SVG stacked bar chart. Horizontal axis = weeks, vertical = PR count.
 * Hover a bar to see per-repo breakdown in the tooltip.
 */
export default function WeeklyChart({
  weeksKorean,
  weeksDateRange,
  weeksAxis,
  repos,
  repoSeries,
  totalPerWeek,
}: Props): React.JSX.Element {
  const [hover, setHover] = useState<number | null>(null);

  const W = 920;
  const H = 320;
  const M = {top: 16, right: 12, bottom: 56, left: 40};
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const n = weeksAxis.length;

  const maxY = useMemo(() => {
    const m = Math.max(...totalPerWeek, 1);
    // round up to nearest 20 for clean grid lines
    return Math.ceil(m / 20) * 20;
  }, [totalPerWeek]);

  const bandWidth = innerW / n;
  const barWidth = Math.max(8, bandWidth * 0.7);
  const yScale = (v: number) => (v / maxY) * innerH;
  const yTicks = Array.from({length: 5}, (_, i) => Math.round((maxY / 4) * i));

  return (
    <div className={styles.chartContainer}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className={styles.chartSvg}
        role="img"
        aria-label="주차별 PR 생성 추이"
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

        {/* Stacked bars */}
        {weeksAxis.map((_, i) => {
          const x = M.left + bandWidth * i + (bandWidth - barWidth) / 2;
          let cumY = M.top + innerH;
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* Hover hit area (full column) */}
              <rect
                x={M.left + bandWidth * i}
                y={M.top}
                width={bandWidth}
                height={innerH}
                fill="transparent"
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

        {/* X labels — show every other tick on small viewports via CSS class */}
        {weeksKorean.map((label, i) => {
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

      {/* Tooltip — clamp to [6%, 94%] so it never spills past the chart bounds */}
      {hover !== null && (
        <div
          className={styles.tooltip}
          style={{
            left: `${Math.min(94, Math.max(6, ((hover + 0.5) / n) * 100))}%`,
          }}
        >
          <div className={styles.tooltipTitle}>
            {weeksKorean[hover]} <span className={styles.tooltipSub}>· {weeksDateRange[hover]}</span>
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
            합계 <strong>{totalPerWeek[hover]}</strong>건
          </div>
        </div>
      )}
    </div>
  );
}
