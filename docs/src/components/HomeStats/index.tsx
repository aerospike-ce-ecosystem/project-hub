import React from 'react';
import statsData from '@site/src/data/pr-stats.json';
import type {PrStatsData} from './types';
import {repoColor, repoLabel} from './constants';
import WeeklyChart from './WeeklyChart';
import RepoMatrix from './RepoMatrix';
import styles from './styles.module.css';

const data: PrStatsData = statsData as PrStatsData;

function formatDateKr(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
}

function formatGeneratedKr(iso: string): string {
  // Render in UTC and label it explicitly — formatDateKr also uses UTC, so the
  // header (집계 ~ / 마지막 업데이트) stays on one consistent timezone.
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
    return <p className={styles.muted}>아직 기여자 데이터가 없습니다.</p>;
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
          <h2 className={styles.statsTitle}>주간 PR 활동 지표</h2>
          <p className={styles.statsSub}>
            <code>{data.org}</code> · 집계 <strong>{formatDateKr(data.earliest)} ~ {formatDateKr(data.latest)}</strong>
            <span className={styles.metaDot}>·</span>
            매주 월요일 09:00 KST 자동 갱신
            <span className={styles.metaDot}>·</span>
            마지막 업데이트 {formatGeneratedKr(data.generatedAt)}
          </p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={`${styles.kpi} ${styles.kpiAccent}`}>
          <div className={styles.kpiLabel}>총 PR</div>
          <div className={styles.kpiValue}>{data.totalPrs.toLocaleString()}</div>
          <div className={styles.kpiHint}>{data.repos.length}개 활성 repo</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>평균 / 주</div>
          <div className={styles.kpiValue}>{data.avgPerWeek.toFixed(1)}</div>
          <div className={styles.kpiHint}>{data.weeksAxis.length}주 기준</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>피크 주차</div>
          <div className={styles.kpiValue}>{data.peakWeek?.count ?? 0}</div>
          <div className={styles.kpiHint}>{data.peakWeek?.korean ?? '—'}</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>최근 4주</div>
          <div className={styles.kpiValue}>{data.recent4Total}</div>
          <div className={styles.kpiHint}>
            {last4.length > 0
              ? `${data.weeksKorean[data.weeksAxis.indexOf(last4[0])]} ~ ${data.weeksKorean[data.weeksAxis.indexOf(last4[last4.length - 1])]}`
              : '—'}
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Merge Rate</div>
          <div className={styles.kpiValue}>
            {mergeRate.toFixed(1)}
            <span className={styles.kpiUnit}>%</span>
          </div>
          <div className={styles.kpiHint}>{merged} merged</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3>주차별 PR 생성 추이</h3>
          <span className={styles.cardTag}>Repo 누적 · 월·주차 단위</span>
        </div>
        <p className={styles.cardDesc}>막대에 마우스를 올리면 repo별 세부 카운트를 확인할 수 있습니다.</p>
        <WeeklyChart
          weeksKorean={data.weeksKorean}
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
            <h3>PR 상태 분포</h3>
            <span className={styles.cardTag}>{data.totalPrs}건</span>
          </div>
          <p className={styles.cardDesc}>Merge rate: <strong>{mergeRate.toFixed(1)}%</strong></p>
          <StateBar />
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Top Contributors</h3>
            <span className={styles.cardTag}>bot 포함</span>
          </div>
          <p className={styles.cardDesc}>PR 생성자 기준 상위 15명</p>
          <TopContributors />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3>주차 × Repo 매트릭스</h3>
          <span className={styles.cardTag}>{data.weeksAxis.length}주 × {data.repos.length}개 repo</span>
        </div>
        <p className={styles.cardDesc}>셀 배경 진하기 = 해당 repo 내 상대적 활동량 · <span className={styles.zeroHint}>·</span> 표기는 0건</p>
        <RepoMatrix
          weeksAxis={data.weeksAxis}
          weeksKorean={data.weeksKorean}
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
          <h3>최근 PR</h3>
          <span className={styles.cardTag}>생성일 내림차순 · 30건</span>
        </div>
        <p className={styles.cardDesc}>PR 번호 클릭 시 GitHub에서 열림</p>
        <RecentPrs />
      </div>
    </section>
  );
}

export default function HomeStats(): React.JSX.Element {
  // SSR-safe: render same markup server-side; charts are pure SVG so hydration is fine
  return <StatsPanel />;
}
