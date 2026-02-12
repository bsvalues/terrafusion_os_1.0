#!/usr/bin/env node
/**
 * Quarantine Planner CLI — Compute deterministic move plan from git-tracked root
 *
 * Usage:
 *   node scripts/quarantine/plan.mjs               # dry-run (human-readable)
 *   node scripts/quarantine/plan.mjs --json         # dry-run (machine-readable)
 *   node scripts/quarantine/plan.mjs --check        # exit 1 if plan is non-empty
 *
 * All modes are read-only. No mutations are performed.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePlan } from './plan-core.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, '../../..');

/**
 * Parse root entries from git ls-tree (full format) into { name, type } objects.
 * @param {string} cwd  Repository root
 * @returns {Array<{name: string, type: string}>}
 */
function getGitEntries(cwd) {
  // Full format: "<mode> <type> <hash>\t<name>\0"
  const raw = execSync('git ls-tree -z HEAD', { encoding: 'utf8', cwd });
  return raw
    .split('\0')
    .filter(Boolean)
    .map(line => {
      const tabIdx = line.indexOf('\t');
      const meta = line.slice(0, tabIdx); // "<mode> <type> <hash>"
      const name = line.slice(tabIdx + 1);
      const type = meta.split(' ')[1]; // "tree" or "blob"
      return { name, type };
    });
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const checkMode = args.includes('--check');

  // Load keep-list
  const keepListPath = join(ROOT, 'scripts', 'quarantine', 'keep-list.json');
  const keepList = JSON.parse(readFileSync(keepListPath, 'utf8'));

  // Get tracked root entries via git
  let entries;
  try {
    entries = getGitEntries(ROOT);
  } catch {
    console.error('FATAL: not in a git repo or git not available.');
    process.exit(2);
  }

  const plan = computePlan({ entries, keepList });

  // Summarize
  const dirMoves = plan.filter(m => m.from.endsWith('/'));
  const fileMoves = plan.filter(m => !m.from.endsWith('/'));

  if (jsonMode) {
    process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
  } else {
    console.log(
      `Quarantine plan: ${plan.length} moves (${dirMoves.length} dirs, ${fileMoves.length} files)`
    );
    if (plan.length > 0) {
      console.log('');
      for (const { from, to } of plan) {
        console.log(`  ${from}  →  ${to}`);
      }
    }
  }

  if (checkMode) {
    if (plan.length > 0) {
      console.error(`\n❌ CHECK FAILED: ${plan.length} entries still need quarantine.`);
      process.exit(1);
    } else {
      console.log('\n✅ CHECK PASSED: no quarantine moves needed.');
    }
  } else if (!jsonMode) {
    if (plan.length === 0) {
      console.log('\n✅ Root is clean — nothing to quarantine.');
    } else {
      console.log(`\nℹ️  This is a dry-run. No files were moved.`);
    }
  }
}

main();
