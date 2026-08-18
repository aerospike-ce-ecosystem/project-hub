#!/usr/bin/env node
/**
 * Regenerate the machine-maintained section of the Release Compatibility Matrix.
 *
 * Output: docs/docs/history/releases/release-matrix.md
 *   — rewrites everything between the BEGIN/END GENERATED markers
 *   — rewrites the `last_updated:` frontmatter field
 *
 * Two independent facts are emitted, and they are not the same thing:
 *
 *   1. Latest release per product, read from each repo's `releases/latest`.
 *      This is what a user installing today gets. It is NOT evidence that the
 *      combination was tested together.
 *
 *   2. The submodule pins on `workspace`'s default branch, resolved to release
 *      tags. `workspace/.github/workflows/verify.yml` runs against exactly that
 *      set, so it is the closest thing the ecosystem has to a verified-together
 *      combination.
 *
 * Requirements:
 *   - GitHub CLI (gh) authenticated, OR GH_TOKEN env var
 *   - Node.js >= 20
 *
 * Usage:
 *   node scripts/generate-release-matrix.mjs
 *   node scripts/generate-release-matrix.mjs --check   # exit 1 if the file would change
 */

import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const MATRIX_PATH = join(REPO_ROOT, 'docs/docs/history/releases/release-matrix.md');

const ORG = 'aerospike-ce-ecosystem';
const WORKSPACE_REPO = 'workspace';

const BEGIN = '<!-- BEGIN GENERATED: current-releases -->';
const END = '<!-- END GENERATED: current-releases -->';

/**
 * Products that appear in the generated tables, in display order.
 * `key` is the submodule path inside `workspace`, which equals the repo name.
 */
const PRODUCTS = [
  {repo: 'aerospike-py', label: 'aerospike-py'},
  {repo: 'aerospike-ce-kubernetes-operator', label: 'ACKO'},
  {repo: 'aerospike-cluster-manager', label: 'Cluster Manager'},
  {repo: 'aerospike-ce-ecosystem-plugins', label: 'Plugins'},
  {repo: 'ackoctl', label: 'ackoctl'},
];

/** How many tags to walk back when a submodule pin is not itself a tag. */
const MAX_TAG_WALK = 30;

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = true;
  }
  return out;
}

/** Call the GitHub REST API through `gh`. Returns null on 404. */
async function api(path) {
  try {
    const {stdout} = await execFileAsync('gh', ['api', path], {
      maxBuffer: 32 * 1024 * 1024,
      env: process.env,
    });
    return JSON.parse(stdout);
  } catch (err) {
    const msg = `${err.stderr || ''}${err.message || ''}`;
    if (msg.includes('HTTP 404') || msg.includes('Not Found')) return null;
    throw new Error(`gh api ${path} failed: ${msg.trim()}`);
  }
}

/** ISO timestamp -> YYYY-MM-DD, or '-' when absent. */
function day(iso) {
  return iso ? iso.slice(0, 10) : '-';
}

/** Descending semver-ish comparison; unparseable tags sort last. */
function compareTagsDesc(a, b) {
  const parse = (t) => {
    const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(t);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  };
  const pa = parse(a);
  const pb = parse(b);
  if (!pa && !pb) return a.localeCompare(b);
  if (!pa) return 1;
  if (!pb) return -1;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pb[i] - pa[i];
  }
  return 0;
}

/** Latest published release for a repo, or null when the repo has none. */
async function latestRelease(repo) {
  const rel = await api(`repos/${ORG}/${repo}/releases/latest`);
  if (!rel) return null;
  return {tag: rel.tag_name, published: rel.published_at, url: rel.html_url};
}

/** Submodule path -> pinned commit SHA, read from workspace's default branch. */
async function workspacePins() {
  const repo = await api(`repos/${ORG}/${WORKSPACE_REPO}`);
  if (!repo) throw new Error(`${ORG}/${WORKSPACE_REPO} not reachable`);
  const tree = await api(
    `repos/${ORG}/${WORKSPACE_REPO}/git/trees/${repo.default_branch}`,
  );
  const pins = {};
  for (const entry of tree.tree ?? []) {
    // Submodules appear as type "commit" in a git tree.
    if (entry.type === 'commit') pins[entry.path] = entry.sha;
  }
  return {pins, branch: repo.default_branch};
}

/**
 * Resolve a commit SHA to a release tag.
 *
 * Exact tag match is preferred. Otherwise walk tags newest-first and return the
 * first one the commit is a descendant of, so the pin is reported as
 * "vX.Y.Z + N commits" rather than as an opaque SHA.
 */
async function describePin(repo, sha) {
  if (!sha) return {text: '-', exact: false};
  const tags = (await api(`repos/${ORG}/${repo}/tags?per_page=100`)) ?? [];

  const exact = tags.find((t) => t.commit?.sha === sha);
  if (exact) return {text: exact.name, exact: true, tag: exact.name};

  const ordered = tags.map((t) => t.name).sort(compareTagsDesc);
  for (const tag of ordered.slice(0, MAX_TAG_WALK)) {
    const cmp = await api(
      `repos/${ORG}/${repo}/compare/${encodeURIComponent(tag)}...${sha}`,
    );
    if (!cmp) continue;
    if (cmp.status === 'identical') return {text: tag, exact: true, tag};
    if (cmp.status === 'ahead') {
      const n = cmp.ahead_by;
      return {text: `${tag} +${n} commit${n === 1 ? '' : 's'}`, exact: false, tag};
    }
  }
  return {text: `commit \`${sha.slice(0, 7)}\``, exact: false};
}

function renderTable(rows, header, align) {
  const lines = [`| ${header.join(' | ')} |`, `|${align.join('|')}|`];
  for (const r of rows) lines.push(`| ${r.join(' | ')} |`);
  return lines.join('\n');
}

async function build() {
  const latest = {};
  for (const p of PRODUCTS) latest[p.repo] = await latestRelease(p.repo);

  const {pins, branch} = await workspacePins();
  const pinned = {};
  for (const p of PRODUCTS) pinned[p.repo] = await describePin(p.repo, pins[p.repo]);

  const generatedAt = new Date().toISOString();

  const latestRows = PRODUCTS.map((p) => {
    const r = latest[p.repo];
    return [
      `**${p.label}**`,
      r ? `[\`${r.tag}\`](${r.url})` : '_no releases_',
      r ? day(r.published) : '-',
      `[${p.repo}](https://github.com/${ORG}/${p.repo}/releases)`,
    ];
  });

  const verifiedRow = PRODUCTS.map((p) => pinned[p.repo].text);
  const allExact = PRODUCTS.every((p) => pinned[p.repo].exact);

  // The freshness checker keys off the newest date in the document, so the
  // dates emitted here are what `last_updated` has to keep up with.
  const dates = PRODUCTS.map((p) => latest[p.repo]?.published)
    .filter(Boolean)
    .map(day)
    .sort();
  const newestDate = dates.length ? dates[dates.length - 1] : day(generatedAt);

  const body = [
    BEGIN,
    '',
    '<!-- Generated by scripts/generate-release-matrix.mjs — do not edit by hand.',
    `     Regenerate with: node scripts/generate-release-matrix.mjs -->`,
    '',
    '### 현재 릴리스 (자동 생성)',
    '',
    `각 repo의 \`releases/latest\`에서 읽은 값입니다. 마지막 생성: \`${generatedAt}\``,
    '',
    renderTable(
      latestRows,
      ['Product', 'Latest', 'Published', 'Releases'],
      [':---', ':---:', ':---:', ':---'],
    ),
    '',
    ':::caution 이 표는 "함께 테스트된 조합"이 아닙니다',
    '위 표는 각 제품의 **최신 릴리스**일 뿐이며, 같은 행에 있다는 이유로 함께 검증되었다는 뜻이 아닙니다.',
    '실제로 함께 검증된 조합은 바로 아래 "workspace 검증 조합" 표를 보세요.',
    ':::',
    '',
    '### workspace 검증 조합 (자동 생성)',
    '',
    `[\`workspace\`](https://github.com/${ORG}/${WORKSPACE_REPO}) 는 각 제품을 git submodule로 고정하고,`,
    `\`verify.yml\`이 그 고정된 조합에 대해 smoke check를 실행합니다.`,
    `아래는 \`${WORKSPACE_REPO}\` \`${branch}\` 브랜치의 현재 submodule pin을 release tag로 환산한 값입니다.`,
    '',
    renderTable(
      [verifiedRow],
      PRODUCTS.map((p) => p.label),
      PRODUCTS.map(() => ':---:'),
    ),
    '',
    allExact
      ? '모든 pin이 정확히 release tag를 가리킵니다.'
      : '`+N commits`로 표시된 항목은 해당 tag 이후의 커밋에 고정되어 있어 릴리스된 버전과 정확히 일치하지 않습니다.',
    '',
    `<!-- newest-release-date: ${newestDate} -->`,
    '',
    END,
  ].join('\n');

  return {body, newestDate};
}

async function main() {
  const args = parseArgs(process.argv);
  const {body, newestDate} = await build();

  const original = await readFile(MATRIX_PATH, 'utf8');
  const start = original.indexOf(BEGIN);
  const stop = original.indexOf(END);
  if (start === -1 || stop === -1) {
    throw new Error(
      `markers not found in ${MATRIX_PATH} — expected ${BEGIN} and ${END}`,
    );
  }

  let next =
    original.slice(0, start) + body + original.slice(stop + END.length);

  // Keep the freshness stamp from drifting ahead of (or behind) the content.
  next = next.replace(/^last_updated:.*$/m, `last_updated: ${newestDate}`);

  if (args.check) {
    if (next !== original) {
      process.stderr.write(
        'release-matrix.md is out of date — run: node scripts/generate-release-matrix.mjs\n',
      );
      process.exit(1);
    }
    process.stdout.write('release-matrix.md is up to date\n');
    return;
  }

  if (next === original) {
    process.stdout.write('release-matrix.md unchanged\n');
    return;
  }

  await writeFile(MATRIX_PATH, next);
  process.stdout.write(`release-matrix.md updated (last_updated: ${newestDate})\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
