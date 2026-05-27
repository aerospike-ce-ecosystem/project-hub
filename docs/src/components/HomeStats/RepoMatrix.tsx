import React from 'react';
import {repoColor, repoLabel} from './constants';
import styles from './styles.module.css';

interface Props {
  weeksAxis: string[];
  weeksKorean: string[];
  weeksDateRange: string[];
  repos: string[];
  repoSeries: Record<string, number[]>;
  totalPerWeek: number[];
  perRepoTotal: Record<string, number>;
  totalPrs: number;
}

/** Map a value to a heatmap intensity (8% to 70% mix) for the given repo. */
function heatStyle(repo: string, value: number, max: number): React.CSSProperties {
  if (value === 0 || max === 0) return {};
  const intensity = value / max;
  const pct = 8 + intensity * 62;
  const color = repoColor(repo);
  return {
    background: `color-mix(in srgb, ${color} ${pct.toFixed(0)}%, transparent)`,
    color: intensity > 0.6 ? '#fff' : 'inherit',
    fontWeight: 600,
  };
}

function totalHeatStyle(value: number, max: number): React.CSSProperties {
  if (value === 0 || max === 0) return {};
  const intensity = value / max;
  const pct = 10 + intensity * 60;
  return {
    background: `color-mix(in srgb, var(--matrix-total-tint) ${pct.toFixed(0)}%, transparent)`,
    color: intensity > 0.55 ? '#fff' : 'inherit',
    fontWeight: 700,
  };
}

export default function RepoMatrix({
  weeksAxis,
  weeksKorean,
  weeksDateRange,
  repos,
  repoSeries,
  totalPerWeek,
  perRepoTotal,
  totalPrs,
}: Props): React.JSX.Element {
  const repoMax: Record<string, number> = {};
  for (const r of repos) {
    repoMax[r] = Math.max(...(repoSeries[r] ?? [0]));
  }
  const totalMax = Math.max(...totalPerWeek, 1);

  return (
    <div className={styles.matrixWrap}>
      <table className={styles.matrix}>
        <thead>
          <tr>
            <th className={styles.weekHeader}>주차</th>
            {repos.map((r) => (
              <th key={r} className={styles.repoHeader}>
                <span className={styles.repoDot} style={{background: repoColor(r)}} />
                {repoLabel(r)}
              </th>
            ))}
            <th className={styles.totalHeader}>합계</th>
          </tr>
        </thead>
        <tbody>
          {weeksAxis.map((w, i) => (
            <tr key={w}>
              <td className={styles.weekCell}>
                <div className={styles.weekCellInner}>
                  <span className={styles.weekMain}>{weeksKorean[i]}</span>
                  <span className={styles.weekSub}>{weeksDateRange[i]}</span>
                </div>
              </td>
              {repos.map((r) => {
                const v = repoSeries[r]?.[i] ?? 0;
                return (
                  <td
                    key={r}
                    className={`${styles.numCell} ${v === 0 ? styles.zeroCell : styles.heatCell}`}
                    style={heatStyle(r, v, repoMax[r] ?? 0)}
                  >
                    {v === 0 ? '·' : v}
                  </td>
                );
              })}
              <td
                className={`${styles.numCell} ${styles.totalCell} ${totalPerWeek[i] === 0 ? styles.zeroCell : ''}`}
                style={totalHeatStyle(totalPerWeek[i], totalMax)}
              >
                {totalPerWeek[i] === 0 ? '·' : totalPerWeek[i]}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className={styles.weekCell}>
              <div className={styles.weekCellInner}>
                <span className={styles.weekMain}>전체 합계</span>
              </div>
            </td>
            {repos.map((r) => (
              <td key={r} className={`${styles.numCell} ${styles.totalCell}`}>
                {perRepoTotal[r] ?? 0}
              </td>
            ))}
            <td className={`${styles.numCell} ${styles.totalCell} ${styles.grandTotal}`}>
              {totalPrs}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
