#!/usr/bin/env node
/**
 * Collect weekly PR statistics for the aerospike-ce-ecosystem org.
 *
 * Output: docs/src/data/pr-stats.json
 *
 * Requirements:
 *   - GitHub CLI (gh) authenticated, OR GH_TOKEN env var
 *   - Node.js >= 20
 *
 * Usage:
 *   node scripts/collect-pr-stats.mjs
 *   node scripts/collect-pr-stats.mjs --weeks 26   # limit to last N weeks
 */

import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {writeFile, mkdir} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUT_PATH = join(REPO_ROOT, 'docs/src/data/pr-stats.json');

const ORG = 'aerospike-ce-ecosystem';
const PER_REPO_LIMIT = 1000;

// Display ordering — keep stable across runs even as activity shifts
const REPO_ORDER = [
  'aerospike-py',
  'aerospike-cluster-manager',
  'aerospike-ce-kubernetes-operator',
  'ackoctl',
  'project-hub',
  'aerospike-ce-ecosystem-plugins',
  'workspace',
  'aerospike-ce-ui-kit',
  'aerospike-py-performance-report',
  'homebrew-tap',
  '.github',
];

/** Parse `--key value` style CLI args. */
function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) {
      const key = k.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[key] = v;
    }
  }
  return out;
}

/**
 * Compute ISO week label, e.g. "2026-W21" — Thursday-of-week rule.
 * Matches Python's `datetime.isocalendar()` so cross-language tooling agrees.
 */
function isoWeekLabel(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Thursday in current week decides the year
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Monday date for an ISO week label. */
function isoWeekStart(label) {
  const [y, w] = label.split('-W').map(Number);
  // Jan 4th is always in week 1
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (w - 1) * 7);
  return monday;
}

function isoWeekEnd(label) {
  const start = isoWeekStart(label);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return end;
}

/** "5월 1주차" — week number is computed from the Monday's day-of-month. */
function koreanWeekLabel(isoLabel) {
  const m = isoWeekStart(isoLabel);
  const weekInMonth = Math.floor((m.getUTCDate() - 1) / 7) + 1;
  return `${m.getUTCMonth() + 1}월 ${weekInMonth}주차`;
}

function dateRangeLabel(isoLabel) {
  const s = isoWeekStart(isoLabel);
  const e = isoWeekEnd(isoLabel);
  const pad = (n) => String(n).padStart(2, '0');
  return `${s.getUTCMonth() + 1}/${pad(s.getUTCDate())}–${e.getUTCMonth() + 1}/${pad(e.getUTCDate())}`;
}

async function gh(args) {
  try {
    const {stdout} = await execFileAsync('gh', args, {maxBuffer: 64 * 1024 * 1024});
    return stdout;
  } catch (err) {
    const msg = err.stderr || err.message;
    throw new Error(`gh ${args.join(' ')} failed: ${msg}`);
  }
}

async function listRepos() {
  const raw = await gh([
    'api',
    `orgs/${ORG}/repos?per_page=100&type=public`,
    '--jq',
    '.[] | {name: .name, archived: .archived, fork: .fork}',
  ]);
  const lines = raw.trim().split('\n').filter(Boolean);
  return lines.map((l) => JSON.parse(l)).filter((r) => !r.archived && !r.fork);
}

async function fetchRepoPrs(repo) {
  const raw = await gh([
    'pr',
    'list',
    '--repo',
    `${ORG}/${repo}`,
    '--state',
    'all',
    '--limit',
    String(PER_REPO_LIMIT),
    '--json',
    'number,createdAt,author,state,mergedAt,title,url',
  ]);
  return JSON.parse(raw);
}

function buildAxis(allWeeks) {
  if (allWeeks.size === 0) return [];
  const sorted = [...allWeeks].sort();
  const first = isoWeekStart(sorted[0]);
  const last = isoWeekStart(sorted[sorted.length - 1]);
  const axis = [];
  for (let cur = new Date(first); cur <= last; cur.setUTCDate(cur.getUTCDate() + 7)) {
    axis.push(isoWeekLabel(cur));
  }
  return axis;
}

async function main() {
  const args = parseArgs(process.argv);
  const weeksLimit = args.weeks ? Number(args.weeks) : null;

  console.error(`Listing repos for org "${ORG}"…`);
  const repos = await listRepos();
  console.error(`Found ${repos.length} repos.`);

  const allPrs = []; // {repo, number, createdAt, author, state, mergedAt, title, url}
  for (const r of repos) {
    process.stderr.write(`  ${r.name}: `);
    try {
      const prs = await fetchRepoPrs(r.name);
      for (const pr of prs) allPrs.push({...pr, repo: r.name});
      process.stderr.write(`${prs.length} PRs\n`);
    } catch (e) {
      process.stderr.write(`error (${e.message})\n`);
    }
  }

  const activeRepos = REPO_ORDER.filter((r) =>
    allPrs.some((p) => p.repo === r)
  );

  const perRepoWeekly = new Map();
  const allWeeks = new Set();
  const authorCounter = new Map();
  const stateCounter = new Map();
  const monthlyTotal = new Map();
  const recentPrs = [];
  let earliest = null;
  let latest = null;

  for (const pr of allPrs) {
    if (!activeRepos.includes(pr.repo)) continue;
    const created = new Date(pr.createdAt);
    const week = isoWeekLabel(created);
    allWeeks.add(week);

    if (!perRepoWeekly.has(pr.repo)) perRepoWeekly.set(pr.repo, new Map());
    const map = perRepoWeekly.get(pr.repo);
    map.set(week, (map.get(week) || 0) + 1);

    const login = pr.author?.login || 'unknown';
    authorCounter.set(login, (authorCounter.get(login) || 0) + 1);

    const effectiveState = pr.mergedAt ? 'MERGED' : pr.state;
    stateCounter.set(effectiveState, (stateCounter.get(effectiveState) || 0) + 1);

    const month = `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, '0')}`;
    monthlyTotal.set(month, (monthlyTotal.get(month) || 0) + 1);

    if (!earliest || created < earliest) earliest = created;
    if (!latest || created > latest) latest = created;

    recentPrs.push({
      repo: pr.repo,
      number: pr.number,
      title: pr.title,
      url: pr.url,
      author: login,
      createdAt: pr.createdAt,
      state: effectiveState,
    });
  }

  let weeksAxis = buildAxis(allWeeks);
  if (weeksLimit && weeksAxis.length > weeksLimit) {
    weeksAxis = weeksAxis.slice(-weeksLimit);
  }

  const repoSeries = {};
  for (const r of activeRepos) {
    repoSeries[r] = weeksAxis.map((w) => perRepoWeekly.get(r)?.get(w) || 0);
  }

  const totalPerWeek = weeksAxis.map((_, i) =>
    activeRepos.reduce((sum, r) => sum + repoSeries[r][i], 0)
  );
  const totalPrs = totalPerWeek.reduce((s, v) => s + v, 0);

  const recent4 = weeksAxis.slice(-4);
  const recent4Total = recent4.reduce(
    (s, w) => s + activeRepos.reduce((rs, r) => rs + (perRepoWeekly.get(r)?.get(w) || 0), 0),
    0
  );

  let peakWeek = null;
  let peakCount = 0;
  weeksAxis.forEach((w, i) => {
    if (totalPerWeek[i] > peakCount) {
      peakWeek = w;
      peakCount = totalPerWeek[i];
    }
  });

  const perRepoTotal = Object.fromEntries(
    activeRepos.map((r) => [r, Object.values(repoSeries[r]).reduce((s, v) => s + v, 0)])
  );

  recentPrs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const topContributors = [...authorCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({name, count}));

  const monthly = [...monthlyTotal.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([month, count]) => ({month, count}));

  const out = {
    generatedAt: new Date().toISOString(),
    org: ORG,
    earliest: earliest?.toISOString() || null,
    latest: latest?.toISOString() || null,
    totalPrs,
    repos: activeRepos,
    perRepoTotal,
    weeksAxis,
    weeksKorean: weeksAxis.map(koreanWeekLabel),
    weeksDateRange: weeksAxis.map(dateRangeLabel),
    repoSeries,
    totalPerWeek,
    recent4Weeks: recent4,
    recent4Total,
    peakWeek: peakWeek ? {week: peakWeek, korean: koreanWeekLabel(peakWeek), count: peakCount} : null,
    avgPerWeek: weeksAxis.length ? Number((totalPrs / weeksAxis.length).toFixed(2)) : 0,
    stateCounts: Object.fromEntries(stateCounter),
    topContributors,
    monthly,
    recentPrs: recentPrs.slice(0, 30),
  };

  await mkdir(dirname(OUT_PATH), {recursive: true});
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  console.error(`\nWrote ${OUT_PATH}`);
  console.error(`  ${totalPrs} PRs across ${weeksAxis.length} weeks (${activeRepos.length} active repos)`);
  console.error(`  peak: ${out.peakWeek?.korean} (${peakCount})  avg/week: ${out.avgPerWeek}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
