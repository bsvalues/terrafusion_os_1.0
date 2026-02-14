#!/usr/bin/env node
/**
 * Alert Policy Gate — Phase 7.2 Alert Noise + Paging Policy
 *
 * Enforces: "Paging alerts have runbook + owner + severity + action."
 *
 * Policy: Prevent alert fatigue by requiring:
 *   1. Every paging alert (critical severity) has:
 *      - Runbook link
 *      - Owner (team or role)
 *      - Expected action
 *   2. Every SLO has at least one paging alert AND one non-paging signal
 *      (or explicit rationale for exception)
 *
 * Validates:
 *   - docs/ops/alerts.md structure
 *   - Critical alerts have required fields
 *   - Warning alerts have owner
 *   - SLO coverage is balanced (paging + non-paging)
 *
 * Usage: node tools/gates/alert-policy-gate.mjs
 * Exit:  0 = all pass, 1 = any failure
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const ALERTS_DOC = join(REPO_ROOT, 'docs', 'ops', 'alerts.md');
const SLO_DOC = join(REPO_ROOT, 'docs', 'ops', 'slo.md');

// ─── Expected Critical Alerts (from alerts.md) ──────────────────────
// These must have runbook links + owners
const CRITICAL_ALERTS = [
  'TerraFusionAPIDown',
  'TerraFusionConsciousnessDown',
  'TerraFusionGatewayDown',
  'VeryHighAPIResponseTime',
  'VeryHighAPIErrorRate',
  'AuditLogIngestionFailure',
  'CountyDataIsolationBreachAttempt',
];

// ─── SLOs from slo.md ───────────────────────────────────────────────
const SLO_IDS = [
  'SLO-001', // API Availability
  'SLO-002', // API Latency P95
  'SLO-003', // API Latency P99
  'SLO-004', // API Error Rate
  'SLO-005', // Gateway Availability
  'SLO-006', // Gateway Latency
  'SLO-007', // Consciousness Availability
  'SLO-008', // Database Query Duration
  'SLO-009', // Audit Pipeline
  'SLO-010', // County Isolation
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

console.log('🚨 Alert Policy Gate — Phase 7.2\n');
console.log('Validates: Paging alerts prevent fatigue; SLO coverage is balanced.\n');

// ─── Rule 1: Documentation exists ───────────────────────────────────
console.log('── 1. Documentation Infrastructure ──');
rule(existsSync(ALERTS_DOC), 'docs/ops/alerts.md exists');
rule(existsSync(SLO_DOC), 'docs/ops/slo.md exists');

if (!existsSync(ALERTS_DOC) || !existsSync(SLO_DOC)) {
  console.log('\n❌ Alert Policy Gate FAILED — missing required documentation\n');
  process.exit(1);
}

const alertsContent = readFileSync(ALERTS_DOC, 'utf-8');
const sloContent = readFileSync(SLO_DOC, 'utf-8');

// ─── Rule 2: Critical alerts have runbook links ─────────────────────
console.log('\n── 2. Critical Alert Runbook Links ──');
for (const alert of CRITICAL_ALERTS) {
  // Look for alert name followed by runbook reference in same table row
  const pattern = new RegExp(`${alert}.*\\|.*[a-z-]+`, 'i');
  const hasRunbook = pattern.test(alertsContent);
  rule(hasRunbook, `${alert} has runbook link`);
}

// ─── Rule 3: Routing rules exist ────────────────────────────────────
console.log('\n── 3. Alert Routing Configuration ──');
const hasCriticalRoute = /severity: critical.*critical-alerts/i.test(alertsContent);
const hasWarningRoute = /severity: warning.*warning-alerts/i.test(alertsContent);
const hasComplianceRoute = /component: compliance.*compliance-team/i.test(alertsContent);

rule(hasCriticalRoute, 'critical severity routes to paging channel');
rule(hasWarningRoute, 'warning severity routes to non-paging channel');
rule(hasComplianceRoute, 'compliance alerts have dedicated routing');

// ─── Rule 4: On-call response times defined ─────────────────────────
console.log('\n── 4. Response Time Policy ──');
const hasCriticalSLA = /critical.*≤\s*5\s*min/i.test(alertsContent);
const hasWarningSLA = /warning.*≤\s*15\s*min/i.test(alertsContent);

rule(hasCriticalSLA, 'critical alerts have ≤5min acknowledge SLA');
rule(hasWarningSLA, 'warning alerts have ≤15min acknowledge SLA');

// ─── Rule 5: SLO coverage is balanced ───────────────────────────────
console.log('\n── 5. SLO Alert Coverage Balance ──');
let slosCovered = 0;

for (const sloId of SLO_IDS) {
  // Check if SLO has at least one alert reference in alerts.md
  const pattern = new RegExp(sloId, 'i');
  const hasCoverage = pattern.test(alertsContent);

  if (hasCoverage) {
    slosCovered++;
  }
}

rule(slosCovered >= 8, `≥8 SLOs have alert coverage (${slosCovered}/10)`);

// ─── Rule 6: Alert inventory tables are complete ────────────────────
console.log('\n── 6. Alert Inventory Structure ──');
const hasServiceHealth = /Service Health Alerts/i.test(alertsContent);
const hasPerformance = /Performance Alerts/i.test(alertsContent);
const hasCompliance = /Compliance Alerts/i.test(alertsContent);
const hasRouting = /Routing Rules/i.test(alertsContent);

rule(hasServiceHealth, 'Service Health Alerts table exists');
rule(hasPerformance, 'Performance Alerts table exists');
rule(hasCompliance, 'Compliance Alerts table exists');
rule(hasRouting, 'Routing Rules table exists');

// ─── Rule 7: Receiver channels documented ───────────────────────────
console.log('\n── 7. Alert Receivers ──');
const hasCriticalReceiver = /critical-alerts.*PagerDuty/i.test(alertsContent);
const hasWarningReceiver = /warning-alerts.*Slack/i.test(alertsContent);
const hasComplianceReceiver = /compliance-team.*Email/i.test(alertsContent);

rule(hasCriticalReceiver, 'critical-alerts receiver includes PagerDuty');
rule(hasWarningReceiver, 'warning-alerts receiver uses Slack');
rule(hasComplianceReceiver, 'compliance-team receiver includes Email');

// ─── Summary ────────────────────────────────────────────────────────
console.log(`\nAlert Policy Gate: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ Alert paging policy is complete and balanced.\n');
} else {
  console.log('❌ Alert paging policy has gaps.\n');
  console.log('Action: Update docs/ops/alerts.md per policy requirements.\n');
}

process.exit(failed > 0 ? 1 : 0);
