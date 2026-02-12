#!/usr/bin/env node
/**
 * Quarantine Apply CLI — Execute git mv operations from a quarantine plan
 *
 * Usage:
 *   node scripts/quarantine/plan.mjs --json | node scripts/quarantine/apply.mjs
 *   node scripts/quarantine/apply.mjs --plan plan.json
 *   node scripts/quarantine/apply.mjs --plan plan.json --batch 50
 *
 * Safety:
 *   - Refuses to run if working tree is dirty (git status --porcelain)
 *   - Only performs `git mv` — no raw filesystem moves
 *   - --batch N limits to first N moves in plan order
 *   - --dry-run shows what would be done without executing
 *
 * All moves come from the planner's deterministic output.
 * The apply script does NOT re-sort or re-categorize.
 */
import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeMovesToApply } from './apply-core.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, '../../..');

function parseArgs(argv) {
  const args = argv.slice(2);
  let planFile = null;
  let batch = Infinity;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plan' && i + 1 < args.length) {
      planFile = args[++i];
    } else if (args[i] === '--batch' && i + 1 < args.length) {
      const n = parseInt(args[++i], 10);
      if (!Number.isFinite(n) || n < 0) {
        console.error('FATAL: --batch requires a non-negative integer.');
        process.exit(2);
      }
      batch = n;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { planFile, batch, dryRun };
}

function readPlan(planFile) {
  if (planFile) {
    const content = readFileSync(resolve(ROOT, planFile), 'utf8');
    return JSON.parse(content);
  }

  // Read from stdin (piped JSON) — cross-platform via fd 0
  if (!process.stdin.isTTY) {
    let raw;
    try {
      raw = readFileSync(0, 'utf8');
    } catch {
      // EOF, pipe closed, or no stdin
      return null;
    }

    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch (err) {
      console.error(
        'FATAL: Failed to parse plan JSON from stdin: ' +
          (err && err.message ? err.message : String(err))
      );
      process.exit(2);
    }
  }

  return null;
}

function getWorkingTreeStatus(cwd) {
  return execSync('git status --porcelain', { encoding: 'utf8', cwd });
}

function main() {
  const { planFile, batch, dryRun } = parseArgs(process.argv);

  // Load plan
  const plan = readPlan(planFile);

  // Get working tree status
  let statusOutput;
  try {
    statusOutput = getWorkingTreeStatus(ROOT);
  } catch {
    console.error('FATAL: not in a git repo or git not available.');
    process.exit(2);
  }

  // Compute moves
  const result = computeMovesToApply({ plan, batch, statusOutput });

  if (!result.ok) {
    console.error(`FATAL: ${result.error}`);
    process.exit(1);
  }

  if (result.moves.length === 0) {
    console.log('Nothing to apply (empty plan or batch=0).');
    process.exit(0);
  }

  // Report
  console.log(`Quarantine apply: ${result.moves.length} moves${dryRun ? ' (DRY RUN)' : ''}`);
  console.log('');

  if (dryRun) {
    for (const { from, to } of result.moves) {
      console.log(`  [dry-run] git mv "${from}" "${to}"`);
    }
    console.log(`\nDry run complete. No files were moved.`);
    process.exit(0);
  }

  // Execute git mv for each move
  let applied = 0;
  for (const { from, to } of result.moves) {
    // Strip trailing slash for git mv (git mv operates on directory names without trailing /)
    const src = from.endsWith('/') ? from.slice(0, -1) : from;
    const dst = to.endsWith('/') ? to.slice(0, -1) : to;

    try {
      // Ensure QUARANTINE bucket directory exists (cross-platform)
      const bucketDir = resolve(ROOT, dst.replace(/\/[^/]+$/, ''));
      mkdirSync(bucketDir, { recursive: true });

      // Use execFileSync (no shell) to avoid injection risks with arbitrary filenames
      execFileSync('git', ['mv', src, dst], { cwd: ROOT, stdio: 'pipe' });
      applied++;
      console.log(`  ✓ git mv "${src}" → "${dst}"`);
    } catch (err) {
      console.error(`  ✗ git mv "${src}" → "${dst}" FAILED`);
      console.error(`    ${err.stderr?.toString().trim() || err.message}`);
      console.error(`\nStopping after ${applied} successful moves. Fix the error and re-run.`);
      process.exit(1);
    }
  }

  console.log(`\n✅ Applied ${applied} moves. Run 'git status' to review, then commit.`);
}

main();
