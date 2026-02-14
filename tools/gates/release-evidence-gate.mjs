#!/usr/bin/env node
/**
 * Release Evidence Gate — Phase 6.5 Deployment Readiness
 *
 * Orchestrates all Phase 6 sub-gates and produces a unified release
 * evidence bundle proving deployment readiness:
 *
 *  Gate 1: Config Schema (6.1)
 *  Gate 2: Deploy Manifest Validation (6.2)
 *  Gate 3: Write-Lane RBAC (6.3)
 *  Gate 4: Deploy Smoke (6.4)
 *
 * Also verifies Phase 4-5 gates still exist and are executable.
 *
 * Usage: node tools/gates/release-evidence-gate.mjs
 * Exit:  0 = all pass, 1 = any failure
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const GATES_DIR = join(REPO_ROOT, 'tools', 'gates');
const OUTPUT_DIR = join(REPO_ROOT, '.terrafusion', 'contracts');
const RELEASE_EVIDENCE = join(REPO_ROOT, 'release-evidence-latest.json');

function sha256File(filePath) {
  const content = readFileSync(filePath);
  return 'sha256:' + createHash('sha256').update(content).digest('hex');
}

// ─── Gate definitions ───────────────────────────────────────────────
const PHASE6_GATES = [
  { id: '6.1', name: 'Config Schema', script: join(GATES_DIR, 'config-schema-gate.mjs') },
  { id: '6.2', name: 'Deploy Manifest', script: join(GATES_DIR, 'deploy-manifest-validate.mjs') },
  { id: '6.3', name: 'Write-Lane RBAC', script: join(GATES_DIR, 'write-lane-rbac-gate.mjs') },
  { id: '6.4', name: 'Deploy Smoke', script: join(GATES_DIR, 'deploy-smoke-gate.mjs') },
];

// Prior-phase gates to verify still exist
const PRIOR_GATES = [
  { id: '5.2', name: 'Threat Model', script: join(GATES_DIR, 'threatmodel-gate.mjs') },
  { id: '5.3', name: 'Runbooks', script: join(GATES_DIR, 'runbooks-gate.mjs') },
  { id: '5.4a', name: 'Query Budget', script: join(GATES_DIR, 'query-budget-gate.mjs') },
  { id: '5.4b', name: 'Perf Gate', script: join(GATES_DIR, 'perf-gate.mjs') },
];

// Phase 7 gates (fully executed)
const PHASE7_GATES = [
  { id: '7.3', name: 'SLO', script: join(GATES_DIR, 'slo-gate.mjs') },
  { id: '7.4', name: 'DR', script: join(GATES_DIR, 'dr-gate.mjs') },
  { id: '7.5', name: 'Cutover', script: join(GATES_DIR, 'cutover-gate.mjs') },
  { id: '7.6', name: 'Trace Coverage', script: join(GATES_DIR, 'trace-coverage-gate.mjs') },
];

// ─── Execution ──────────────────────────────────────────────────────
console.log('📦 Release Evidence Gate — Phase 6.5');
console.log(`   ${new Date().toISOString()}\n`);

let totalGates = 0;
let passedGates = 0;
let failedGates = 0;
const gateResults = [];

function runGate(gate, execute = true) {
  totalGates++;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${gate.id}: ${gate.name}`);
  console.log(`${'═'.repeat(60)}`);

  if (!existsSync(gate.script)) {
    console.error(`  ❌ Script not found: ${relative(REPO_ROOT, gate.script)}`);
    failedGates++;
    gateResults.push({ ...gate, status: 'MISSING', hash: null });
    return;
  }

  const hash = sha256File(gate.script);

  if (!execute) {
    // Just verify existence and hash
    console.log(`  ✅ Exists → ${relative(REPO_ROOT, gate.script)}`);
    console.log(`  🔑 ${hash.slice(0, 28)}...`);
    passedGates++;
    gateResults.push({ ...gate, status: 'VERIFIED', hash });
    return;
  }

  try {
    const output = execSync(`node "${gate.script}"`, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
      timeout: 30_000,
      stdio: 'pipe',
    });
    // Show last few lines (the summary)
    const lines = output.trim().split('\n');
    const summaryStart = lines.findIndex(l => l.includes('╔'));
    if (summaryStart !== -1) {
      console.log(lines.slice(summaryStart).join('\n'));
    } else {
      console.log(lines.slice(-3).join('\n'));
    }
    console.log(`  🔑 ${hash.slice(0, 28)}...`);
    passedGates++;
    gateResults.push({ ...gate, status: 'PASS', hash });
  } catch (err) {
    const output = err.stdout || err.message;
    const lines = output.trim().split('\n');
    console.log(lines.slice(-5).join('\n'));
    console.error(`  ❌ Gate FAILED`);
    failedGates++;
    gateResults.push({ ...gate, status: 'FAIL', hash });
  }
}

// Run Phase 6 gates (fully execute)
console.log('\n📋 Phase 6 — Deployment Readiness Gates\n');
for (const gate of PHASE6_GATES) {
  runGate(gate, true);
}

// Verify Phase 4-5 gates exist (don't re-execute — those have their own CI steps)
console.log('\n\n📋 Phase 4-5 — Prior Gate Verification (existence + hash)\n');
for (const gate of PRIOR_GATES) {
  runGate(gate, false);
}

// Run Phase 7 gates (fully execute)
console.log('\n\n📋 Phase 7 — Production Cutover Safety Gates\n');
for (const gate of PHASE7_GATES) {
  runGate(gate, true);
}

// ─── Build evidence bundle ──────────────────────────────────────────
const now = process.env.EVIDENCE_PACK_TIMESTAMP || new Date().toISOString();
const overallStatus = failedGates === 0 ? 'PASS' : 'FAIL';

mkdirSync(OUTPUT_DIR, { recursive: true });

const releaseEvidence = {
  contractVersion: '1.0.0',
  phase: 7,
  phaseTitle: 'Production Cutover Safety',
  generatedAt: now,
  overallStatus,
  gates: gateResults.map(g => ({
    id: g.id,
    name: g.name,
    status: g.status,
    scriptPath: relative(REPO_ROOT, g.script).replace(/\\/g, '/'),
    hash: g.hash,
  })),
  summary: {
    total: totalGates,
    passed: passedGates,
    failed: failedGates,
    phase6Executed: PHASE6_GATES.length,
    phase7Executed: PHASE7_GATES.length,
    priorVerified: PRIOR_GATES.length,
  },
  metadata: {
    nodeVersion: process.version,
    ciEnvironment: process.env.CI ? 'github-actions' : 'local',
    triggeredBy: process.env.GITHUB_ACTOR || 'local-dev',
  },
};

writeFileSync(RELEASE_EVIDENCE, JSON.stringify(releaseEvidence, null, 2));
writeFileSync(
  join(OUTPUT_DIR, 'release-evidence-phase6.json'),
  JSON.stringify(releaseEvidence, null, 2)
);

// ─── Summary ────────────────────────────────────────────────────────
console.log(`\n\n${'═'.repeat(60)}`);
console.log('  📦 Release Evidence Summary');
console.log(`${'═'.repeat(60)}`);
console.log(`\n  Status: ${overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  Gates:  ${passedGates}/${totalGates} passed`);
console.log(`  Output: release-evidence-latest.json`);

console.log('\n  Gate Results:');
for (const g of gateResults) {
  const icon = g.status === 'PASS' || g.status === 'VERIFIED' ? '✅' : '❌';
  console.log(`    ${icon} ${g.id} ${g.name} — ${g.status}`);
}

if (failedGates > 0) {
  console.error(`\n❌ Release evidence gate FAILED — ${failedGates}/${totalGates} gate(s) failed`);
  process.exit(1);
} else {
  console.log(`\n✅ Release evidence gate PASSED — all ${totalGates} gates verified`);
  process.exit(0);
}
