import React from 'react';
import statsData from '@site/src/data/pr-stats.json';
import type {PrStatsData} from './types';
import {repoColor, repoLabel} from './constants';
import WeeklyChart from './WeeklyChart';
import RepoMatrix from './RepoMatrix';
import styles from './styles.module.css';

const data: PrStatsData = statsData as PrStatsData;

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
}

function formatGenerated(iso: string): string {
  // Render in UTC and label it explicitly so the panel header reads on one
  // consistent timezone (formatDate also uses UTC).
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min} UTC`;
}

function Sparkline({values, color}: {values: number[]; color: string}): React.JSX.Element {
  if (values.length === 0) return <svg />;
  const W = 60;
  const H = 18;
  const max = Math.max(...values, 1);
  const step = W / Math.max(values.length - 1, 1);
  const pts = values
    .map((v, i) => `${i * step},${H - (v / max) * (H - 2) - 1}`)
    .join(' ');
  return (
    <svg width={W} height={H} className={styles.sparkline} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function StateBar(): React.JSX.Element {
  const merged = data.stateCounts.MERGED ?? 0;
  const closed = data.stateCounts.CLOSED ?? 0;
  const open = data.stateCounts.OPEN ?? 0;
  const total = merged + closed + open || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className={styles.stateCard}>
      <div className={styles.stateBar}>
        <div className={styles.stateSegMerged} style={{width: pct(merged)}} title={`Merged ${merged}`} />
        <div className={styles.stateSegClosed} style={{width: pct(closed)}} title={`Closed ${closed}`} />
        <div className={styles.stateSegOpen} style={{width: pct(open)}} title={`Open ${open}`} />
      </div>
      <div className={styles.stateLegend}>
        <span><span className={`${styles.stateDot} ${styles.dotMerged}`} />Merged <strong>{merged}</strong></span>
        <span><span className={`${styles.stateDot} ${styles.dotClosed}`} />Closed <strong>{closed}</strong></span>
        <span><span className={`${styles.stateDot} ${styles.dotOpen}`} />Open <strong>{open}</strong></span>
      </div>
    </div>
  );
}

function TopContributors(): React.JSX.Element {
  const top = data.topContributors;
  if (top.length === 0) {
    return <p className={styles.muted}>No contributor data yet.</p>;
  }
  const max = top[0].count || 1;
  const denom = data.totalPrs || 1;
  return (
    <div className={styles.contribList}>
      {top.map(({name, count}, i) => (
        <div key={name} className={styles.contribRow}>
          <span className={styles.contribRank}>{i + 1}</span>
          <span className={styles.contribName}>{name}</span>
          <span className={styles.contribBarTrack}>
            <span className={styles.contribBarFill} style={{width: `${(count / max) * 100}%`}} />
          </span>
          <span className={styles.contribCount}>{count}</span>
          <span className={styles.contribShare}>{((count / denom) * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

function RecentPrs(): React.JSX.Element {
  return (
    <div className={styles.recentWrap}>
      <table className={styles.recentTable}>
        <thead>
          <tr>
            <th>PR</th>
            <th>Repo</th>
            <th>Title</th>
            <th>Author</th>
            <th>Created</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {data.recentPrs.map((pr) => (
            <tr key={`${pr.repo}-${pr.number}`}>
              <td>
                <a href={pr.url} target="_blank" rel="noopener noreferrer">
                  #{pr.number}
                </a>
              </td>
              <td>
                <span
                  className={styles.repoChip}
                  style={{
                    background: `color-mix(in srgb, ${repoColor(pr.repo)} 14%, transparent)`,
                    color: repoColor(pr.repo),
                  }}
                >
                  {repoLabel(pr.repo)}
                </span>
              </td>
              <td className={styles.recentTitle}>{pr.title}</td>
              <td className={styles.muted}>{pr.author}</td>
              <td className={styles.muted}>{pr.createdAt.slice(0, 10)}</td>
              <td>
                <span className={`${styles.pill} ${styles[`pill${pr.state.charAt(0)}${pr.state.slice(1).toLowerCase()}`]}`}>
                  {pr.state}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatsPanel(): React.JSX.Element {
  const merged = data.stateCounts.MERGED ?? 0;
  const mergeRate = data.totalPrs ? (merged / data.totalPrs) * 100 : 0;
  const last4 = data.recent4Weeks;

  return (
    <section className={styles.statsRoot}>
      <div className={styles.statsHeader}>
        <div>
          <span className={styles.eyebrow}>ORG Activity</span>
          <h2 className={styles.statsTitle}>Weekly PR Activity</h2>
          <p className={styles.statsSub}>
            <code>{data.org}</code> · range <strong>{formatDate(data.earliest)} – {formatDate(data.latest)}</strong>
            <span className={styles.metaDot}>·</span>
            Refreshed every Monday 00:00 UTC
            <span className={styles.metaDot}>·</span>
            Last updated {formatGenerated(data.generatedAt)}
          </p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={`${styles.kpi} ${styles.kpiAccent}`}>
          <div className={styles.kpiLabel}>Total PRs</div>
          <div className={styles.kpiValue}>{data.totalPrs.toLocaleString()}</div>
          <div className={styles.kpiHint}>{data.repos.length} active repos</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Avg / week</div>
          <div className={styles.kpiValue}>{data.avgPerWeek.toFixed(1)}</div>
          <div className={styles.kpiHint}>over {data.weeksAxis.length} weeks</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Peak week</div>
          <div className={styles.kpiValue}>{data.peakWeek?.count ?? 0}</div>
          <div className={styles.kpiHint}>{data.peakWeek?.display ?? '—'}</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Last 4 weeks</div>
          <div className={styles.kpiValue}>{data.recent4Total}</div>
          <div className={styles.kpiHint}>
            {last4.length > 0
              ? `${data.weeksDisplay[data.weeksAxis.indexOf(last4[0])]} – ${data.weeksDisplay[data.weeksAxis.indexOf(last4[last4.length - 1])]}`
              : '—'}
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Merge rate</div>
          <div className={styles.kpiValue}>
            {mergeRate.toFixed(1)}
            <span className={styles.kpiUnit}>%</span>
          </div>
          <div className={styles.kpiHint}>{merged} merged</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3>Weekly PR creation trend</h3>
          <span className={styles.cardTag}>Stacked by repo · month-week buckets</span>
        </div>
        <p className={styles.cardDesc}>Hover (or focus) a bar to see the per-repo breakdown.</p>
        <WeeklyChart
          weeksDisplay={data.weeksDisplay}
          weeksDateRange={data.weeksDateRange}
          weeksAxis={data.weeksAxis}
          repos={data.repos}
          repoSeries={data.repoSeries}
          totalPerWeek={data.totalPerWeek}
        />
        <div className={styles.legend}>
          {data.repos.map((r) => (
            <span key={r} className={styles.legendChip}>
              <span className={styles.legendDot} style={{background: repoColor(r)}} />
              {repoLabel(r)}
              <span className={styles.legendCount}>{data.perRepoTotal[r]}</span>
              <Sparkline values={data.repoSeries[r]} color={repoColor(r)} />
            </span>
          ))}
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>PR state distribution</h3>
            <span className={styles.cardTag}>{data.totalPrs} total</span>
          </div>
          <p className={styles.cardDesc}>Merge rate: <strong>{mergeRate.toFixed(1)}%</strong></p>
          <StateBar />
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Top contributors</h3>
            <span className={styles.cardTag}>bots included</span>
          </div>
          <p className={styles.cardDesc}>Top 15 PR authors</p>
          <TopContributors />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3>Week × Repo matrix</h3>
          <span className={styles.cardTag}>{data.weeksAxis.length} weeks × {data.repos.length} repos</span>
        </div>
        <p className={styles.cardDesc}>Cell shading scales with each repo&apos;s activity for that week · <span className={styles.zeroHint}>·</span> means zero.</p>
        <RepoMatrix
          weeksAxis={data.weeksAxis}
          weeksDisplay={data.weeksDisplay}
          weeksDateRange={data.weeksDateRange}
          repos={data.repos}
          repoSeries={data.repoSeries}
          totalPerWeek={data.totalPerWeek}
          perRepoTotal={data.perRepoTotal}
          totalPrs={data.totalPrs}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3>Recent PRs</h3>
          <span className={styles.cardTag}>Latest 30 · by created date</span>
        </div>
        <p className={styles.cardDesc}>Click a PR number to open it on GitHub.</p>
        <RecentPrs />
      </div>
    </section>
  );
}

export default function HomeStats(): React.JSX.Element {
  // SSR-safe: render same markup server-side; charts are pure SVG so hydration is fine
  return <StatsPanel />;
}
