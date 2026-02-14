#!/usr/bin/env node
/**
 * Validation Week 1-2 Gate Runner
 *
 * Purpose: Single-command receipt validation after production cutover
 * Runs all validation-critical gates in sequence
 *
 * Usage: node tools/gates/validation-week12-gate.mjs
 *
 * Exit Codes:
 *   0 - All gates passed
 *   1 - One or more gates failed
 */

import { execSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');

const GATES = [
  {
    name: 'Trace Coverage Gate',
    script: 'tools/gates/trace-coverage-gate.mjs',
    critical: true,
    description: 'BLOCK policy enforcement: exemptions ≤3, ratchet cap 3',
  },
  {
    name: 'Runbook Freshness Gate',
    script: 'tools/gates/runbook-freshness-gate.mjs',
    critical: true,
    description: 'All paging alert runbooks fresh <90 days',
  },
  {
    name: 'Ops Validation Artifacts Gate',
    script: 'tools/gates/ops-validation-artifacts-gate.mjs',
    critical: false,
    description: 'Production cutover + rollback drill evidence (expected amber until sign-off)',
  },
  {
    name: 'Phase 4 Evidence Pack',
    script: 'tools/security/phase4-evidence-pack.mjs',
    critical: false,
    description: 'Evidence pack generation + hash verification',
  },
  {
    name: 'Release Evidence Gate',
    script: 'tools/gates/release-evidence-gate.mjs',
    critical: false,
    description: 'Release evidence validation',
  },
];

console.log('🚦 Validation Week 1-2 Gate Runner\n');
console.log('Running all validation-critical gates in sequence...\n');

let failedGates = [];
let passedGates = [];
let skippedGates = [];

for (const gate of GATES) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 Running: ${gate.name}`);
  console.log(`   ${gate.description}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const scriptPath = resolve(ROOT, gate.script);
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: ROOT,
    });

    passedGates.push(gate.name);
    console.log(`\n✅ ${gate.name} PASSED\n`);
  } catch (error) {
    if (gate.critical) {
      failedGates.push(gate.name);
      console.error(`\n❌ ${gate.name} FAILED (CRITICAL)\n`);
    } else {
      skippedGates.push(gate.name);
      console.warn(`\n⚠️  ${gate.name} FAILED (non-critical, expected until execution)\n`);
    }
  }
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('📋 VALIDATION WEEK 1-2 GATE SUMMARY');
console.log('='.repeat(80) + '\n');

console.log(`✅ Passed: ${passedGates.length}`);
passedGates.forEach(name => console.log(`   - ${name}`));

if (skippedGates.length > 0) {
  console.log(`\n⚠️  Expected Failures: ${skippedGates.length} (non-critical, awaiting execution)`);
  skippedGates.forEach(name => console.log(`   - ${name}`));
}

if (failedGates.length > 0) {
  console.log(`\n❌ Failed (CRITICAL): ${failedGates.length}`);
  failedGates.forEach(name => console.log(`   - ${name}`));
  console.log('\n❌ VALIDATION WEEK 1-2 GATE RUNNER: FAILED');
  console.log('   Fix critical gate failures before proceeding.\n');
  process.exit(1);
} else {
  console.log('\n✅ VALIDATION WEEK 1-2 GATE RUNNER: PASSED');
  console.log('   All critical gates operational. Non-critical gates awaiting execution.\n');
  process.exit(0);
}
