#!/usr/bin/env node
/**
 * TerraFusion Brain Pulse — read-only status snapshot.
 *
 * Collects status from Brain CLI, git, open WOs, and the control panel spec.
 * Writes a markdown report to .terrafusion/context/pulse-latest.md and stdout.
 *
 * ZERO mutations: no git commits, no file edits outside context/, no WO creation,
 * no canon changes, no queue changes.
 *
 * WO-0118 — Control Plane Activation: Read-Only Pulse
 *
 * Usage:
 *   node scripts/brain/brain-pulse.mjs
 *   pnpm brain pulse  (after adding 'pulse' dispatch to brain.mjs)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dir, '..', '..');
const NOW = new Date().toISOString();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(args) {
  try {
    return execFileSync(process.execPath, args, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
      timeout: 30_000,
    });
  } catch (e) {
    return (e.stdout || '') + `\n[exit ${e.status ?? '?'}]`;
  }
}

function git(args) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
      timeout: 10_000,
    }).trim();
  } catch (e) {
    return `[git error: ${e.message.split('\n')[0]}]`;
  }
}

function readJSON(relPath) {
  try {
    return JSON.parse(readFileSync(join(REPO_ROOT, relPath), 'utf8'));
  } catch {
    return null;
  }
}

function section(title, body) {
  return [`## ${title}`, '', body.trim() || '_no data_', ''].join('\n');
}

// ---------------------------------------------------------------------------
// Collect
// ---------------------------------------------------------------------------

const BRAIN = join(REPO_ROOT, 'scripts', 'brain', 'brain.mjs');

const branch = git(['branch', '--show-current']);
const lastCommit = git(['log', '--oneline', '-1']);
const dirtyLines = git(['status', '--porcelain']).split('\n').filter(Boolean);
const dirtyCount = dirtyLines.length;

const brainStatus = run([BRAIN, 'status']);
const brainGates = run([BRAIN, 'gates']);
const brainDrift = run([BRAIN, 'drift']);

// Open P0/P1 drift — filter table rows whose severity column is P0 or P1
// and that are not marked RESOLVED.
const openDrift = brainDrift
  .split('\n')
  .filter(l => /\|\s*P[01]\s*\|/.test(l) && !/RESOLVED/.test(l))
  .slice(0, 15);

// Open WOs
const WO_DIR = join(REPO_ROOT, 'docs', 'brain', 'workorders', 'active');
const openWOs = existsSync(WO_DIR)
  ? readdirSync(WO_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
  : [];

// Control panel lane statuses
const cpSpec = readJSON('ops/control-panel/control-panel.spec.json');
const lanes = cpSpec?.lanes ?? [];

// Next queued action
const nextQueue = readJSON('docs/brain/canon/next-queue.json');
const nextItem = nextQueue?.queue?.[0] ?? null;

// ---------------------------------------------------------------------------
// Format report
// ---------------------------------------------------------------------------

const header = [
  '# TerraFusion Brain Pulse',
  '',
  `**Generated:** ${NOW}`,
  `**Branch:** \`${branch}\``,
  `**Last commit:** \`${lastCommit}\``,
  `**Dirty files:** ${dirtyCount}${dirtyCount > 0 ? ' ⚠️' : ' ✅'}`,
].join('\n');

const statusSection = section('Brain Status', brainStatus);

const driftSection = section(
  'Open P0/P1 Drift',
  openDrift.length > 0 ? openDrift.join('\n') : '_No open P0/P1 drift rows. ✅_'
);

const woSection = section(
  `Open Work Orders (${openWOs.length})`,
  openWOs.length > 0 ? openWOs.map(f => `- \`${f}\``).join('\n') : '_No active work orders._'
);

const cpSection = section(
  'Control Panel Lane Statuses',
  [
    '| Lane | Status | Cadence |',
    '|------|--------|---------|',
    ...lanes.map(l => `| ${l.title} | ${l.defaultStatus} | ${l.expectedCadence ?? '—'} |`),
  ].join('\n')
);

const nextSection = section(
  'Next Queued Action',
  nextItem
    ? `**${nextItem.title}**  \nRisk: \`${nextItem.risk}\`  \nWhy now: ${nextItem.why_now}`
    : '_Queue empty._'
);

// Gates — first 35 lines only (long doc)
const gatesExcerpt = brainGates.split('\n').slice(0, 35).join('\n');
const gatesSection = section('Release Gates (excerpt)', gatesExcerpt);

const footer = [
  '---',
  '',
  '> **Pulse is read-only.** No files were edited. No commits were staged.',
  '> To act on a finding: open the control panel → select an action → human approves.',
].join('\n');

const report = [
  header,
  '',
  '---',
  '',
  statusSection,
  '',
  '---',
  '',
  driftSection,
  '',
  '---',
  '',
  woSection,
  '',
  '---',
  '',
  cpSection,
  '',
  '---',
  '',
  nextSection,
  '',
  '---',
  '',
  gatesSection,
  '',
  footer,
].join('\n');

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

// Context file — not canon, not queue, not product code.
const outPath = join(REPO_ROOT, '.terrafusion', 'context', 'pulse-latest.md');
try {
  writeFileSync(outPath, report, 'utf8');
} catch {
  // Non-fatal: .terrafusion/context/ may not exist in CI.
}

// If running in GitHub Actions, write to step summary.
if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, report, { flag: 'a' });
  } catch {
    // Non-fatal.
  }
}

process.stdout.write(report + '\n');
