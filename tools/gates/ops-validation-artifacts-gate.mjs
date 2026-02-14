#!/usr/bin/env node
/**
 * Ops Validation Artifacts Gate — 30-Day Validation Period Enforcement
 *
 * Enforces: "Production validation artifacts must exist and be complete."
 *
 * Policy: During the 30-day validation period after Phase 7, certain
 * operational artifacts must be created and maintained to prove the
 * architecture under production conditions.
 *
 * Validates:
 *   - Production cutover record exists (docs/deploy/rehearsals/production-cutover-*.md)
 *   - SLO tuning log exists (docs/ops/slo-tuning-log.md)
 *   - Validation tracker exists (docs/ops/validation-period-tracker.md)
 *   - Required fields are populated
 *
 * Usage: node tools/gates/ops-validation-artifacts-gate.mjs
 * Exit:  0 = all pass, 1 = any failure
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const REHEARSALS_DIR = join(REPO_ROOT, 'docs', 'deploy', 'rehearsals');
const SLO_TUNING_LOG = join(REPO_ROOT, 'docs', 'ops', 'slo-tuning-log.md');
const VALIDATION_TRACKER = join(REPO_ROOT, 'docs', 'ops', 'validation-period-tracker.md');

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

console.log('📊 Ops Validation Artifacts Gate — 30-Day Validation Period\n');
console.log('Validates: Production validation artifacts exist and are complete.\n');

// ─── Rule 1: Directory structure ────────────────────────────────────
console.log('── 1. Infrastructure ──');
rule(existsSync(REHEARSALS_DIR), 'docs/deploy/rehearsals/ exists');

// ─── Rule 2: Production cutover record exists ───────────────────────
console.log('\n── 2. Production Cutover Evidence ──');

let prodCutoverFile = null;
if (existsSync(REHEARSALS_DIR)) {
  const files = readdirSync(REHEARSALS_DIR);
  const prodFiles = files.filter(f => f.startsWith('production-cutover-') && f.endsWith('.md'));

  if (prodFiles.length > 0) {
    prodCutoverFile = join(REHEARSALS_DIR, prodFiles[0]);
    rule(true, `production cutover record exists: ${prodFiles[0]}`);
  } else {
    rule(false, 'production-cutover-*.md exists');
  }
} else {
  rule(false, 'production-cutover-*.md exists (directory missing)');
}

// ─── Rule 3: Cutover record completeness ────────────────────────────
if (prodCutoverFile) {
  console.log('\n── 3. Cutover Record Completeness ──');

  const content = readFileSync(prodCutoverFile, 'utf-8');

  const requiredSections = [
    'Pre-Cutover Checklist Results',
    'Cutover Steps Executed',
    'Rollback Simulation',
    'Recovery Time Validation',
  ];

  for (const section of requiredSections) {
    const hasSection = content.includes(section);
    rule(hasSection, `"${section}" section exists`);
  }

  // Check for actual vs. planned timings
  const hasTimings = /Planned.*Actual/i.test(content);
  rule(hasTimings, 'actual vs. planned timings recorded');

  // Check for sign-off
  const hasSignoff = /Sign-Off/i.test(content) && /Approved|✅/i.test(content);
  rule(hasSignoff, 'cutover sign-off completed');
}

// ─── Rule 4: SLO tuning log exists ──────────────────────────────────
console.log('\n── 4. SLO Tuning Log ──');
const tuningLogExists = existsSync(SLO_TUNING_LOG);
rule(tuningLogExists, 'docs/ops/slo-tuning-log.md exists');

if (tuningLogExists) {
  const content = readFileSync(SLO_TUNING_LOG, 'utf-8');

  const requiredSections = [
    'SLO Burn Tracking',
    'Alert Threshold Adjustments',
    'Alert Noise Audit',
  ];

  for (const section of requiredSections) {
    const hasSection = content.includes(section);
    rule(hasSection, `"${section}" section exists`);
  }

  // Check for data entry (not just template)
  const hasData = /\d{4}-\d{2}-\d{2}/.test(content);
  rule(hasData, 'tuning log has date entries (not just template)');
}

// ─── Rule 5: Validation tracker exists ──────────────────────────────
console.log('\n── 5. Validation Period Tracker ──');
const trackerExists = existsSync(VALIDATION_TRACKER);
rule(trackerExists, 'docs/ops/validation-period-tracker.md exists');

if (trackerExists) {
  const content = readFileSync(VALIDATION_TRACKER, 'utf-8');

  // Check for success criteria tracking
  const hasCriteria = /Success Criteria Tracking/i.test(content);
  rule(hasCriteria, 'success criteria tracking table exists');

  // Check for weekly status updates
  const hasUpdates = /Weekly Status Updates/i.test(content);
  rule(hasUpdates, 'weekly status updates section exists');
}

// ─── Summary ────────────────────────────────────────────────────────
console.log(`\nOps Validation Artifacts Gate: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All validation period artifacts are present and complete.\n');
} else {
  console.log('❌ Some validation artifacts are missing or incomplete.\n');
  console.log('Action Items:\n');

  if (!prodCutoverFile) {
    console.log(
      '  - Execute production cutover and create docs/deploy/rehearsals/production-cutover-YYYY-MM-DD.md'
    );
  }

  if (!tuningLogExists) {
    console.log('  - Start SLO tuning log: docs/ops/slo-tuning-log.md');
  }

  if (!trackerExists) {
    console.log('  - Track validation progress: docs/ops/validation-period-tracker.md');
  }

  console.log();
}

process.exit(failed > 0 ? 1 : 0);
