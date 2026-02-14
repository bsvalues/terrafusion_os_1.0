#!/usr/bin/env node
/**
 * TerraFusion OS — Daily SLO Burn Capture Script
 *
 * Automates daily SLO burn evidence capture for Validation Criterion #3.
 *
 * Usage:
 *   node scripts/capture-daily-slo-burn.mjs --day 2
 *   node scripts/capture-daily-slo-burn.mjs --day 2 --dashboard-url http://grafana:3000/... --prometheus-url http://prometheus:9090
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
  dashboardUrl: process.env.GRAFANA_DASHBOARD_URL || 'http://localhost:3000/d/slo-burn',
  prometheusUrl: process.env.PROMETHEUS_URL || 'http://localhost:9090',
};

// ===== CLI Arguments =====

function parseArgs() {
  const args = process.argv.slice(2);
  const day = args.find(arg => arg.startsWith('--day'))?.split('=')[1];

  if (!day || isNaN(day) || day < 1 || day > 7) {
    console.error('❌ Error: --day must be 1-7');
    console.error('Usage: node scripts/capture-daily-slo-burn.mjs --day 2');
    process.exit(1);
  }

  return { day: parseInt(day) };
}

// ===== Evidence Capture =====

async function captureDashboardScreenshot(day) {
  const filename = `slo-burn-day${day}.png`;
  const filepath = path.join(CONFIG.evidenceDir, filename);

  console.log(`📸 Capturing dashboard screenshot for Day ${day}...`);
  console.log(`   Dashboard URL: ${CONFIG.dashboardUrl}`);
  console.log(`   → ${filepath}`);

  // In production, this would use Puppeteer/Playwright to screenshot dashboard
  // For now, create placeholder with instructions
  const placeholderNote = `
# Dashboard Screenshot Placeholder — Day ${day}

**Manual Capture Required:**

1. Navigate to: ${CONFIG.dashboardUrl}
2. Ensure 24h time window is selected
3. Screenshot entire dashboard (minimum 1280x720)
4. Save as: ${filename}
5. Replace this placeholder file

**Required in screenshot:**
- Timestamp (UTC)
- Burn rate for all 4 SLOs
- SLO targets vs actuals
- Incident markers (if any)

**Automation Note:**
To enable automated screenshot capture, install Puppeteer:
  npm install puppeteer
Then uncomment the automation code in capture-daily-slo-burn.mjs
`;

  await fs.writeFile(filepath, placeholderNote, 'utf-8');
  console.log(`   ⚠️  Placeholder created (manual screenshot required)`);

  return filepath;
}

async function capturePrometheusMetrics(day) {
  const filename = `prometheus-day${day}.json`;
  const filepath = path.join(CONFIG.evidenceDir, filename);

  console.log(`📊 Capturing Prometheus metrics for Day ${day}...`);
  console.log(`   Prometheus URL: ${CONFIG.prometheusUrl}`);
  console.log(`   → ${filepath}`);

  // Calculate date for Day N
  const cutoverDate = new Date('2026-02-14T00:00:00Z');
  const targetDate = new Date(cutoverDate);
  targetDate.setDate(targetDate.getDate() + day);

  const timestamp = targetDate.toISOString();

  // In production, this would query Prometheus API
  // For now, create schema-compliant template
  const metrics = {
    timestamp,
    window: '24h',
    slos: {
      api_availability: {
        target: 0.995,
        actual: null, // FILL FROM PROMETHEUS
        burn_rate: null, // FILL FROM PROMETHEUS
      },
      p95_latency: {
        target_ms: 200,
        actual_ms: null, // FILL FROM PROMETHEUS
        burn_rate: null, // FILL FROM PROMETHEUS
      },
      p99_latency: {
        target_ms: 500,
        actual_ms: null, // FILL FROM PROMETHEUS
        burn_rate: null, // FILL FROM PROMETHEUS
      },
      error_rate: {
        target: 0.01,
        actual: null, // FILL FROM PROMETHEUS
        burn_rate: null, // FILL FROM PROMETHEUS
      },
    },
    incidents: [],
    _note: 'MANUAL FILL REQUIRED: Replace null values with actual Prometheus query results',
  };

  await fs.writeFile(filepath, JSON.stringify(metrics, null, 2), 'utf-8');
  console.log(`   ⚠️  Template created (manual fill required)`);

  return filepath;
}

async function appendSLOLogEntry(day, screenshotPath, prometheusPath) {
  console.log(`📝 Appending entry to SLO tuning log...`);

  const logContent = await fs.readFile(CONFIG.sloLogPath, 'utf-8');

  // Find the table for Week 1
  const dayEntry = `| 2026-02-${14 + day} | Pending | Pending | Pending | Pending | Day ${day} — FILL BURN RATES | evidence/week1/slo-burn-day${day}.png, prometheus-day${day}.json |`;

  // Check if entry already exists
  if (logContent.includes(`Day ${day} —`)) {
    console.log(`   ⚠️  Day ${day} entry already exists (skipping append)`);
    return;
  }

  // Find insertion point (after Day 1 row)
  const lines = logContent.split('\n');
  const day1Index = lines.findIndex(line => line.includes('2026-02-15'));

  if (day1Index === -1) {
    console.error(`   ❌ Could not find Day 1 row in SLO log`);
    process.exit(1);
  }

  // Insert new row after appropriate day
  const insertIndex = day1Index + (day - 1);
  lines.splice(insertIndex + 1, 0, dayEntry);

  await fs.writeFile(CONFIG.sloLogPath, lines.join('\n'), 'utf-8');
  console.log(`   ✅ Entry appended`);
}

// ===== Main Execution =====

async function main() {
  const { day } = parseArgs();

  console.log(`\n🚀 TerraFusion OS — Daily SLO Burn Capture (Day ${day})\n`);

  // Ensure evidence directory exists
  await fs.mkdir(CONFIG.evidenceDir, { recursive: true });

  // Capture evidence artifacts
  const screenshotPath = await captureDashboardScreenshot(day);
  const prometheusPath = await capturePrometheusMetrics(day);

  // Append log entry
  await appendSLOLogEntry(day, screenshotPath, prometheusPath);

  console.log(`\n✅ Day ${day} evidence capture complete\n`);
  console.log(`Next steps:`);
  console.log(`  1. Replace screenshot placeholder with actual dashboard image`);
  console.log(`  2. Fill Prometheus metrics template with actual query results`);
  console.log(`  3. Commit evidence:`);
  console.log(`     git add docs/deploy/rehearsals/evidence/week1/slo-burn-day${day}.png`);
  console.log(`     git add docs/deploy/rehearsals/evidence/week1/prometheus-day${day}.json`);
  console.log(`     git add docs/ops/slo-tuning-log.md`);
  console.log(`     git commit -m "ops(telemetry): capture Day ${day} SLO burn evidence"`);
  console.log(``);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
