#!/usr/bin/env node
/**
 * TerraFusion OS — SLO Burn Completeness Verification
 *
 * Validates Days 1-7 SLO burn evidence is complete for Validation Criterion #3.
 *
 * Usage:
 *   node scripts/verify-slo-burn-completeness.mjs
 *
 * Exit codes:
 *   0 = PASS (all 7 days complete, burn <25%)
 *   1 = FAIL (missing days, missing evidence, or burn ≥25%)
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
  evidenceDir: path.join(__dirname, '../docs/deploy/rehearsals/evidence/week1'),
  sloLogPath: path.join(__dirname, '../docs/ops/slo-tuning-log.md'),
  burnThreshold: 25.0, // <25% required for PASS
};

// ===== Validation Logic =====

async function checkDayEvidence(day) {
  const screenshot = path.join(CONFIG.evidenceDir, `slo-burn-day${day}.png`);
  const prometheus = path.join(CONFIG.evidenceDir, `prometheus-day${day}.json`);

  const errors = [];

  // Check files exist
  try {
    await fs.access(screenshot);
  } catch {
    errors.push(`Missing dashboard screenshot: slo-burn-day${day}.png`);
  }

  try {
    await fs.access(prometheus);

    // Validate Prometheus export has real data (not template nulls)
    const content = await fs.readFile(prometheus, 'utf-8');
    const data = JSON.parse(content);

    if (!data.slos || data.slos.api_availability.actual === null) {
      errors.push(`Prometheus export day${day} contains null values (template not filled)`);
    }
  } catch {
    errors.push(`Missing Prometheus export: prometheus-day${day}.json`);
  }

  return { day, valid: errors.length === 0, errors };
}

async function checkSLOLogEntries() {
  const logContent = await fs.readFile(CONFIG.sloLogPath, 'utf-8');
  const errors = [];

  for (let day = 1; day <= 7; day++) {
    const dayPattern = `Day ${day}`;
    if (!logContent.includes(dayPattern)) {
      errors.push(`Missing Day ${day} entry in slo-tuning-log.md`);
    } else if (logContent.includes(`Day ${day} — FILL BURN RATES`)) {
      errors.push(`Day ${day} entry not filled with actual burn rates`);
    }
  }

  return errors;
}

async function calculate7DayBurnAverage() {
  const logContent = await fs.readFile(CONFIG.sloLogPath, 'utf-8');
  const lines = logContent.split('\n');

  const burnRates = {
    api_availability: [],
    p95_latency: [],
    p99_latency: [],
    error_rate: [],
  };

  // Parse table rows for Days 1-7
  for (let day = 1; day <= 7; day++) {
    const row = lines.find(line => line.includes(`2026-02-${14 + day}`));
    if (!row) continue;

    const cols = row
      .split('|')
      .map(c => c.trim())
      .filter(Boolean);
    if (cols.length < 5) continue;

    // Extract burn rates (columns 2-5)
    for (let i = 0; i < 4; i++) {
      const value = parseFloat(cols[i + 1]);
      if (!isNaN(value)) {
        Object.values(burnRates)[i].push(value);
      }
    }
  }

  // Calculate averages
  const averages = {};
  for (const [slo, values] of Object.entries(burnRates)) {
    if (values.length === 0) {
      averages[slo] = null;
    } else {
      averages[slo] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  }

  // Overall average
  const allValues = Object.values(averages).filter(v => v !== null);
  const overallAverage =
    allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : null;

  return { averages, overallAverage };
}

// ===== Main Execution =====

async function main() {
  console.log(`\n🔍 TerraFusion OS — SLO Burn Completeness Verification\n`);
  console.log(`Target: 7 consecutive days, <25% average burn\n`);

  let allErrors = [];

  // Check Days 1-7 evidence
  console.log(`═══ Evidence File Verification ═══\n`);
  for (let day = 1; day <= 7; day++) {
    const result = await checkDayEvidence(day);
    if (result.valid) {
      console.log(`  ✅ Day ${day}: Evidence complete`);
    } else {
      console.log(`  ❌ Day ${day}: Evidence incomplete`);
      result.errors.forEach(err => console.log(`     - ${err}`));
      allErrors.push(...result.errors);
    }
  }

  // Check SLO log entries
  console.log(`\n═══ SLO Log Entry Verification ═══\n`);
  const logErrors = await checkSLOLogEntries();
  if (logErrors.length === 0) {
    console.log(`  ✅ All 7 days logged in slo-tuning-log.md`);
  } else {
    console.log(`  ❌ SLO log incomplete:`);
    logErrors.forEach(err => console.log(`     - ${err}`));
    allErrors.push(...logErrors);
  }

  // Calculate burn average
  console.log(`\n═══ 7-Day Burn Average Calculation ═══\n`);
  const { averages, overallAverage } = await calculate7DayBurnAverage();

  if (overallAverage === null) {
    console.log(`  ⚠️  Cannot calculate burn average (insufficient data)`);
    allErrors.push('Insufficient burn rate data to calculate 7-day average');
  } else {
    console.log(`  SLO-001 (API Avail): ${averages.api_availability?.toFixed(1)}%`);
    console.log(`  SLO-002 (P95 Lat):   ${averages.p95_latency?.toFixed(1)}%`);
    console.log(`  SLO-003 (P99 Lat):   ${averages.p99_latency?.toFixed(1)}%`);
    console.log(`  SLO-004 (Error Rate): ${averages.error_rate?.toFixed(1)}%`);
    console.log(`\n  📊 7-Day Average Burn: ${overallAverage.toFixed(1)}%`);
    console.log(`     Target: <${CONFIG.burnThreshold}%`);

    if (overallAverage >= CONFIG.burnThreshold) {
      console.log(`     ❌ FAIL (burn ≥${CONFIG.burnThreshold}%)`);
      allErrors.push(
        `7-day average burn ${overallAverage.toFixed(1)}% exceeds ${CONFIG.burnThreshold}% threshold`
      );
    } else {
      console.log(`     ✅ PASS (burn <${CONFIG.burnThreshold}%)`);
    }
  }

  // Final verdict
  console.log(`\n═══════════════════════════════════════\n`);
  if (allErrors.length === 0) {
    console.log(`✅ VALIDATION CRITERION #3: PASS`);
    console.log(`\nAll evidence complete, 7-day burn <25%\n`);
    console.log(`Next steps:`);
    console.log(`  1. Update docs/ops/validation-period-tracker.md (Criterion #3: ⏳ → ✅)`);
    console.log(`  2. Run gate verification:`);
    console.log(`     node tools/gates/validation-week12-gate.mjs`);
    console.log(`  3. Mint receipts:`);
    console.log(`     node scripts/phase4-evidence-pack.mjs`);
    console.log(`     node tools/gates/release-evidence-gate.mjs`);
    console.log(`  4. Commit state transition (3/5 → 4/5):`);
    console.log(`     git commit -m "ops(telemetry): complete Criterion #3 (7-day burn <25%)"`);
    console.log(``);
    process.exit(0);
  } else {
    console.log(`❌ VALIDATION CRITERION #3: FAIL\n`);
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
