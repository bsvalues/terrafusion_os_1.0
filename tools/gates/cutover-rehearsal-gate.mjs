#!/usr/bin/env node
/**
 * Cutover Rehearsal Gate — Phase 7.1 Cutover Rehearsal Evidence
 *
 * Enforces: "Production cutover readiness is demonstrated via rehearsal."
 *
 * Policy: Every release targeting production must have a rehearsal record
 * (tabletop or dry run) within 30 days of scheduled cutover.
 *
 * Validates:
 *   - Rehearsal record exists (docs/deploy/rehearsals/latest.md)
 *   - Required fields populated (date, version, participants, results)
 *   - Rollback simulation performed
 *   - RPO/RTO targets validated or declared N/A
 *   - All pre-cutover checklist items addressed
 *
 * Usage: node tools/gates/cutover-rehearsal-gate.mjs
 * Exit:  0 = all pass, 1 = any failure
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const REHEARSAL_DIR = join(REPO_ROOT, 'docs', 'deploy', 'rehearsals');
const LATEST_REHEARSAL = join(REHEARSAL_DIR, 'latest.md');

// ─── Required Fields ────────────────────────────────────────────────
const REQUIRED_FIELDS = [
  'Rehearsal Type',
  'Date',
  'Release Version',
  'Environment',
  'Participants',
  'Duration',
];

const REQUIRED_TABLES = [
  'Pre-Cutover Checklist Results',
  'Cutover Steps Executed',
  'Rollback Simulation',
  'Recovery Time Validation',
];

// ─── Gate Runner ────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function rule(ok, label) {
  if (ok) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

console.log('🎯 Cutover Rehearsal Gate — Phase 7.1\n');
console.log('Validates: Cutover procedures are practiced before production.\n');

// ─── Rule 1: Rehearsal directory exists ─────────────────────────────
console.log('── 1. Rehearsal Infrastructure ──');
rule(existsSync(REHEARSAL_DIR), 'docs/deploy/rehearsals/ exists');

// ─── Rule 2: Latest rehearsal record exists ─────────────────────────
const rehearsalExists = existsSync(LATEST_REHEARSAL);
rule(rehearsalExists, 'latest.md rehearsal record exists');

if (!rehearsalExists) {
  console.log('\n⚠️  No rehearsal record found.');
  console.log('   Create: docs/deploy/rehearsals/latest.md');
  console.log('   Template: docs/deploy/rehearsals/rehearsal-template.md\n');
  console.log(`Cutover Rehearsal Gate: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// ─── Rule 3: Rehearsal is recent (≤30 days old) ─────────────────────
console.log('\n── 2. Rehearsal Freshness ──');
const stats = statSync(LATEST_REHEARSAL);
const ageMs = Date.now() - stats.mtimeMs;
const ageDays = ageMs / (1000 * 60 * 60 * 24);
rule(ageDays <= 30, `rehearsal is ≤30 days old (${ageDays.toFixed(1)} days)`);

// ─── Rule 4: Parse and validate required fields ─────────────────────
console.log('\n── 3. Required Fields ──');
const content = readFileSync(LATEST_REHEARSAL, 'utf-8');

for (const field of REQUIRED_FIELDS) {
  const pattern = new RegExp(`\\*\\*${field}\\*\\*.*\\|.*[^\\s-]`, 'i');
  const present = pattern.test(content);
  rule(present, `"${field}" field populated`);
}

// ─── Rule 5: Required tables present ────────────────────────────────
console.log('\n── 4. Required Tables ──');
for (const table of REQUIRED_TABLES) {
  const present = content.includes(table);
  rule(present, `"${table}" table exists`);
}

// ─── Rule 6: Rollback simulation performed ──────────────────────────
console.log('\n── 5. Rollback Readiness ──');
const rollbackSimulated = /Rollback Simulation[\s\S]*?\[x\] Yes/i.test(content);
const rollbackNA = /Rollback Simulation[\s\S]*?\[x\] N\/A/i.test(content);
rule(rollbackSimulated || rollbackNA, 'Rollback simulation performed or declared N/A');

// ─── Rule 7: RPO/RTO validation ─────────────────────────────────────
console.log('\n── 6. Recovery Time Objectives ──');
const rpoValidated = /RPO.*Objective.*✅/i.test(content);
const rtoValidated = /RTO.*Objective.*✅/i.test(content);
const drNA = /Recovery Time Validation[\s\S]*?N\/A/i.test(content);
rule((rpoValidated && rtoValidated) || drNA, 'RPO/RTO targets validated or declared N/A');

// ─── Rule 8: Pre-cutover checklist addressed ────────────────────────
console.log('\n── 7. Pre-Cutover Checklist ──');
const checklistItems = (content.match(/\| .* \| ✅/g) || []).length;
rule(checklistItems >= 4, `pre-cutover checklist has ≥4 items addressed (${checklistItems})`);

// ─── Summary ────────────────────────────────────────────────────────
console.log(`\nCutover Rehearsal Gate: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ Cutover rehearsal evidence is complete.\n');
} else {
  console.log('❌ Cutover rehearsal evidence is incomplete.\n');
  console.log('Action: Complete rehearsal record per template and re-run gate.\n');
}

process.exit(failed > 0 ? 1 : 0);
