#!/usr/bin/env node
/**
 * Performance Gate — Phase 5.4 CI Enforcement
 *
 * Orchestrates two sub-gates:
 *  1. Microbench gate — runs dotnet test for PerfBudget-tagged tests
 *  2. Query budget gate — static SQL analysis (delegates to query-budget-gate.mjs)
 *
 * Usage: node tools/gates/perf-gate.mjs
 * Exit:  0 = all pass, 1 = any failure
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const TEST_PROJECT = join(
  REPO_ROOT,
  'backend',
  'tests',
  'TerraFusion.Security.Tests',
  'TerraFusion.Security.Tests.csproj'
);
const QUERY_GATE = join(import.meta.dirname, 'query-budget-gate.mjs');

let failures = 0;

function runGate(name, command, opts = {}) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${'═'.repeat(60)}\n`);

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      cwd: opts.cwd || REPO_ROOT,
      timeout: opts.timeout || 120_000,
      stdio: 'pipe',
    });
    console.log(output);
    return true;
  } catch (err) {
    console.error(err.stdout || '');
    console.error(err.stderr || '');
    console.error(err.message || '');
    return false;
  }
}

console.log('⚡ Performance Gate — Phase 5.4');
console.log(`   ${new Date().toISOString()}\n`);

// ─── Gate 1: Microbench (p95 budget tests) ──────────────────────────
const benchPassed = runGate(
  '🔬 Gate 1: Microbench (p95 budget enforcement)',
  `dotnet test "${TEST_PROJECT}" -c Release -v minimal --no-restore --filter "Category=PerfBudget"`,
  { cwd: join(REPO_ROOT, 'backend'), timeout: 180_000 }
);
if (!benchPassed) {
  console.error('  ❌ Microbench gate FAILED — p95 budget exceeded');
  failures++;
} else {
  console.log('  ✅ Microbench gate PASSED');
}

// ─── Gate 2: Query budget (static SQL analysis) ─────────────────────
const queryPassed = runGate(
  '📊 Gate 2: Query budget (static SQL analysis)',
  `node "${QUERY_GATE}"`
);
if (!queryPassed) {
  console.error('  ❌ Query budget gate FAILED');
  failures++;
} else {
  console.log('  ✅ Query budget gate PASSED');
}

// ─── Summary ────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
if (failures > 0) {
  console.error(`❌ Performance gate FAILED — ${failures}/2 sub-gate(s) failed`);
  process.exit(1);
} else {
  console.log('✅ Performance gate PASSED — all sub-gates green');
  process.exit(0);
}
