#!/usr/bin/env node
/**
 * Fail the docs build when the Release Compatibility Matrix has drifted.
 *
 * Offline and deterministic — no network, so it is safe to run on every build.
 * It cannot tell you the matrix is out of date relative to GitHub; that is the
 * scheduled `release-matrix.yml` workflow's job. What it catches is the two
 * ways the page silently lied before:
 *
 *   1. `last_updated` claiming a date newer than the newest content on the page
 *      (it read 2026-05-29 over 2026-04-07 content), so freshness could not be
 *      judged from the stamp.
 *
 *   2. A product listed in frontmatter `repos:` with no column in the
 *      compatibility matrix (`ackoctl` was declared but absent for months).
 *
 * Usage:
 *   node scripts/check-release-matrix.mjs
 */

import {readFile} from 'node:fs/promises';
import {dirname, join, resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const MATRIX_PATH = join(REPO_ROOT, 'docs/docs/history/releases/release-matrix.md');
const REL = relative(REPO_ROOT, MATRIX_PATH);

/** Frontmatter product key -> the heading it must appear as in the matrix. */
const COLUMN_ALIASES = {
  'aerospike-py': ['aerospike-py'],
  acko: ['ACKO'],
  'aerospike-ce-kubernetes-operator': ['ACKO'],
  'cluster-manager': ['Cluster Manager'],
  'aerospike-cluster-manager': ['Cluster Manager'],
  plugins: ['Plugins'],
  'aerospike-ce-ecosystem-plugins': ['Plugins'],
  ackoctl: ['ackoctl'],
};

const DATE_RE = /\b(20\d{2})-(\d{2})-(\d{2})\b/g;

/** Each problem carries its own remedy — the two rules have different fixes. */
function fail(problems) {
  process.stderr.write(`\n✖ ${REL} check failed\n\n`);
  for (const {message, fix} of problems) {
    process.stderr.write(`  ${message}\n`);
    process.stderr.write(`    Fix: ${fix}\n\n`);
  }
  process.exit(1);
}

const FIX_REGENERATE = 'node scripts/generate-release-matrix.mjs';
const FIX_BY_HAND =
  'add the missing column to the Cross-Project Compatibility Matrix by hand, ' +
  'or drop the product from the frontmatter `repos:` list';

/** Split leading YAML frontmatter from the body. */
function splitFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return {frontmatter: '', body: text};
  return {frontmatter: m[1], body: text.slice(m[0].length)};
}

/** `repos:` block as a flat list, supporting both YAML list styles. */
function parseRepos(frontmatter) {
  const inline = /^repos:\s*\[(.*)\]\s*$/m.exec(frontmatter);
  if (inline) {
    return inline[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const block = /^repos:\s*\n((?:\s*-\s*.+\n?)+)/m.exec(frontmatter);
  if (!block) return [];
  return block[1]
    .split('\n')
    .map((l) => l.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
}

/** All the header cells of the Cross-Project Compatibility Matrix table. */
function compatibilityHeaders(body) {
  const section = /##\s*Cross-Project Compatibility Matrix\s*\n([\s\S]*?)(?=\n##\s|\n---\s*\n##\s|$)/.exec(
    body,
  );
  if (!section) return null;
  const headerLine = section[1]
    .split('\n')
    .find((l) => l.trim().startsWith('|') && l.includes('|'));
  if (!headerLine) return null;
  return headerLine
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean);
}

function newestDate(text) {
  let newest = null;
  for (const m of text.matchAll(DATE_RE)) {
    if (newest === null || m[0] > newest) newest = m[0];
  }
  return newest;
}

async function main() {
  const text = await readFile(MATRIX_PATH, 'utf8');
  const {frontmatter, body} = splitFrontmatter(text);
  const problems = [];

  // --- Rule 1: last_updated must not predate the newest date on the page ----
  const stampMatch = /^last_updated:\s*(\S+)\s*$/m.exec(frontmatter);
  if (!stampMatch) {
    problems.push({
      message: 'frontmatter has no `last_updated:` field',
      fix: FIX_REGENERATE,
    });
  } else {
    const stamp = stampMatch[1];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(stamp)) {
      problems.push({
        message: `\`last_updated: ${stamp}\` is not a YYYY-MM-DD date`,
        fix: FIX_REGENERATE,
      });
    } else {
      const newest = newestDate(body);
      if (newest && stamp < newest) {
        problems.push({
          message:
            `\`last_updated: ${stamp}\` predates the newest content on the page (${newest}). ` +
            'A reader checking freshness would trust the older stamp over newer rows.',
          fix: FIX_REGENERATE,
        });
      }
    }
  }

  // --- Rule 2: every declared product needs a column ------------------------
  const headers = compatibilityHeaders(body);
  if (!headers) {
    problems.push({
      message: 'could not find the "Cross-Project Compatibility Matrix" table',
      fix: FIX_BY_HAND,
    });
  } else {
    for (const repoKey of parseRepos(frontmatter)) {
      const aliases = COLUMN_ALIASES[repoKey];
      if (!aliases) continue; // unknown key — not this check's business
      const present = aliases.some((a) =>
        headers.some((h) => h.toLowerCase() === a.toLowerCase()),
      );
      if (!present) {
        problems.push({
          message:
            `frontmatter declares \`${repoKey}\` but the compatibility matrix has no ` +
            `"${aliases[0]}" column (columns: ${headers.join(', ')}).`,
          fix: FIX_BY_HAND,
        });
      }
    }
  }

  if (problems.length) fail(problems);
  process.stdout.write(`✔ ${REL} freshness and coverage checks passed\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
