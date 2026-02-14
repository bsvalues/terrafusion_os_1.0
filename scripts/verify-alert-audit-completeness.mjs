#!/usr/bin/env node
/**
 * TerraFusion OS — Alert Audit Completeness Verification
 *
 * Validates Alert #001-100 audit is complete for Validation Criterion #4.
 *
 * Usage:
 *   node scripts/verify-alert-audit-completeness.mjs
 *
 * Exit codes:
 *   0 = PASS (all 100 alerts audited, FP <25%)
 *   1 = FAIL (missing alerts, gaps, or FP ≥25%)
 *
 * @classification Government Operations — FISMA-HIGH
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Configuration =====

const CONFIG = {
  evidenceDir: path.join(__dirname, '../docs/deploy/rehearsals/evidence/alerts'),
  auditLogPath: path.join(__dirname, '../docs/ops/alerts-noise-audit.md'),
  fpThreshold: 25.0, // <25% required for PASS
};

// ===== Validation Logic =====

async function checkAlertEvidence(id) {
  const payload = path.join(CONFIG.evidenceDir, `alert-${id}-payload.json`);
  const trace = path.join(CONFIG.evidenceDir, `alert-${id}-trace.json`);
  const ticket = path.join(CONFIG.evidenceDir, `alert-${id}-ticket.md`);

  const errors = [];

  // Check files exist
  try {
    await fs.access(payload);

    // Validate payload has real data (not template placeholders)
    const content = await fs.readFile(payload, 'utf-8');
    const data = JSON.parse(content);

    if (data.alert_name === 'FILL_ALERT_NAME') {
      errors.push(`Alert #${id} payload contains placeholder values (not filled)`);
    }
  } catch {
    errors.push(`Missing alert payload: alert-${id}-payload.json`);
  }

  try {
    await fs.access(trace);
  } catch {
    errors.push(`Missing trace: alert-${id}-trace.json`);
  }

  try {
    await fs.access(ticket);
  } catch {
    errors.push(`Missing ticket: alert-${id}-ticket.md`);
  }

  return { id, valid: errors.length === 0, errors };
}

async function parseAuditLog() {
  const auditLog = await fs.readFile(CONFIG.auditLogPath, 'utf-8');
  const lines = auditLog.split('\n');

  const entries = [];

  for (const line of lines) {
    const match = line.match(
      /^\| (\d{3}) \| ([^ |]+) \| ([^ |]+) \| ([^ |]+) \| ([^ |]+) \| ([^ |]+) \| (TP|FP|Flapping|Out-of-SLA) \|/
    );
    if (match) {
      entries.push({
        id: match[1],
        date: match[2],
        time: match[3],
        alertName: match[4],
        severity: match[5],
        ttack: match[6],
        classification: match[7],
      });
    }
  }

  return entries;
}

async function checkSequentialCompleteness(entries) {
  const errors = [];

  // Check all 001-100 present
  for (let i = 1; i <= 100; i++) {
    const id = String(i).padStart(3, '0');
    const entry = entries.find(e => e.id === id);

    if (!entry) {
      errors.push(`Missing alert audit entry: #${id}`);
    } else if (entry.alertName === 'FILL_ALERT_NAME') {
      errors.push(`Alert #${id} entry not filled with actual data`);
    }
  }

  // Check for gaps (non-sequential IDs)
  const ids = entries.map(e => parseInt(e.id)).sort((a, b) => a - b);
  for (let i = 0; i < ids.length - 1; i++) {
    if (ids[i + 1] !== ids[i] + 1) {
      errors.push(
        `Gap detected: Alert #${String(ids[i]).padStart(3, '0')} → #${String(ids[i + 1]).padStart(3, '0')} (sequential audit required)`
      );
    }
  }

  return errors;
}

function calculateFPRate(entries) {
  const fpCount = entries.filter(e => e.classification === 'FP').length;
  const total = entries.length;
  const fpRate = total > 0 ? (fpCount / total) * 100 : 0;

  return {
    total,
    tpCount: entries.filter(e => e.classification === 'TP').length,
    fpCount,
    flappingCount: entries.filter(e => e.classification === 'Flapping').length,
    outOfSLACount: entries.filter(e => e.classification === 'Out-of-SLA').length,
    fpRate,
  };
}

// ===== Main Execution =====

async function main() {
  console.log(`\n🔍 TerraFusion OS — Alert Audit Completeness Verification\n`);
  console.log(`Target: 100 sequential alerts, FP rate <25%\n`);

  let allErrors = [];

  // Parse audit log
  console.log(`═══ Audit Log Parsing ═══\n`);
  const entries = await parseAuditLog();
  console.log(`  📊 Found ${entries.length} audit entries\n`);

  // Check sequential completeness
  console.log(`═══ Sequential Completeness Check ═══\n`);
  const sequentialErrors = await checkSequentialCompleteness(entries);
  if (sequentialErrors.length === 0) {
    console.log(`  ✅ All alerts #001-100 present (no gaps)`);
  } else {
    console.log(`  ❌ Sequential audit incomplete:`);
    sequentialErrors.forEach(err => console.log(`     - ${err}`));
    allErrors.push(...sequentialErrors);
  }

  // Check evidence files for each alert
  console.log(`\n═══ Evidence File Verification ═══\n`);
  let evidenceCheckCount = 0;
  for (let i = 1; i <= Math.min(100, entries.length); i++) {
    const id = String(i).padStart(3, '0');
    const result = await checkAlertEvidence(id);

    if (result.valid) {
      evidenceCheckCount++;
    } else {
      console.log(`  ❌ Alert #${id}: Evidence incomplete`);
      result.errors.forEach(err => console.log(`     - ${err}`));
      allErrors.push(...result.errors);
    }
  }
  console.log(`  ✅ ${evidenceCheckCount}/${entries.length} alerts have complete evidence`);

  // Calculate FP rate
  console.log(`\n═══ False Positive Rate Calculation ═══\n`);
  const stats = calculateFPRate(entries);

  if (stats.total === 0) {
    console.log(`  ⚠️  No alerts to analyze`);
    allErrors.push('No audit entries found');
  } else {
    console.log(`  Total Alerts:     ${stats.total}`);
    console.log(
      `  True Positives:   ${stats.tpCount} (${((stats.tpCount / stats.total) * 100).toFixed(1)}%)`
    );
    console.log(`  False Positives:  ${stats.fpCount} (${stats.fpRate.toFixed(1)}%)`);
    console.log(`  Flapping:         ${stats.flappingCount}`);
    console.log(`  Out-of-SLA:       ${stats.outOfSLACount}`);
    console.log(`\n  📊 FP Rate: ${stats.fpRate.toFixed(1)}%`);
    console.log(`     Target: <${CONFIG.fpThreshold}%`);

    if (stats.total < 100) {
      console.log(`     ⚠️  Only ${stats.total}/100 alerts audited`);
      allErrors.push(`Incomplete audit: only ${stats.total}/100 alerts captured`);
    }

    if (stats.fpRate >= CONFIG.fpThreshold) {
      console.log(`     ❌ FAIL (FP rate ≥${CONFIG.fpThreshold}%)`);
      allErrors.push(
        `FP rate ${stats.fpRate.toFixed(1)}% exceeds ${CONFIG.fpThreshold}% threshold`
      );
    } else {
      console.log(`     ✅ PASS (FP rate <${CONFIG.fpThreshold}%)`);
    }
  }

  // Final verdict
  console.log(`\n═══════════════════════════════════════\n`);
  if (allErrors.length === 0 && stats.total === 100) {
    console.log(`✅ VALIDATION CRITERION #4: PASS`);
    console.log(`\nAll 100 alerts audited, FP rate <25%\n`);
    console.log(`Next steps:`);
    console.log(`  1. Update docs/ops/validation-period-tracker.md (Criterion #4: ⏳ → ✅)`);
    console.log(`  2. Run gate verification:`);
    console.log(`     node tools/gates/validation-week12-gate.mjs`);
    console.log(`  3. Mint receipts:`);
    console.log(`     node scripts/phase4-evidence-pack.mjs`);
    console.log(`     node tools/gates/release-evidence-gate.mjs`);
    console.log(`  4. Commit state transition (4/5 → 5/5, PHASE 8 AUTHORIZED):`);
    console.log(`     git commit -m "ops(telemetry): complete Criterion #4 (Alert FP <25%)"`);
    console.log(`     git commit -m "PHASE 8 KICKOFF: AUTHORIZED (5/5 validation complete)"`);
    console.log(``);
    process.exit(0);
  } else {
    console.log(`❌ VALIDATION CRITERION #4: FAIL\n`);
    console.log(`Errors found: ${allErrors.length}\n`);
    allErrors.forEach(err => console.log(`  - ${err}`));
    console.log(``);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
