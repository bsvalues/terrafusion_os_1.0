#!/usr/bin/env node
/**
 * SLO Gate — Phase 7.3 Production Cutover Safety
 *
 * Validates that Service Level Objectives are formally defined, that
 * Prometheus alert rules reference SLO thresholds, and that Grafana
 * dashboards exist to visualise them.
 *
 * Rules:
 *   1. docs/ops/slo.md exists and contains SLO table
 *   2. docs/ops/alerts.md exists and references SLO IDs
 *   3. docs/ops/dashboards.md exists and maps to SLOs
 *   4. prometheus-rules.yaml contains required alert names
 *   5. grafana-dashboards-configmap.yaml contains required dashboard keys
 *   6. SLO doc references prometheus-rules.yaml recording rules
 *   7. Error budget policy section exists in SLO doc
 *
 * Usage: node tools/gates/slo-gate.mjs
 * Exit:  0 = all pass, 1 = any failure
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');

// ─── Paths ──────────────────────────────────────────────────────────
const SLO_DOC = join(REPO_ROOT, 'docs', 'ops', 'slo.md');
const ALERTS_DOC = join(REPO_ROOT, 'docs', 'ops', 'alerts.md');
const DASHBOARDS_DOC = join(REPO_ROOT, 'docs', 'ops', 'dashboards.md');
const PROM_RULES = join(REPO_ROOT, 'backend', 'k8s', 'prometheus-rules.yaml');
const GRAFANA_DASHBOARDS = join(REPO_ROOT, 'backend', 'k8s', 'grafana-dashboards-configmap.yaml');

// ─── Required alert names (must appear in prometheus-rules.yaml) ────
const REQUIRED_ALERTS = [
  'TerraFusionAPIDown',
  'TerraFusionGatewayDown',
  'TerraFusionConsciousnessDown',
  'HighAPIResponseTime',
  'VeryHighAPIResponseTime',
  'HighAPIErrorRate',
  'VeryHighAPIErrorRate',
  'AuditLogIngestionFailure',
  'CountyDataIsolationBreachAttempt',
];

// ─── Required dashboard keys (must appear in grafana-dashboards-configmap.yaml) ──
const REQUIRED_DASHBOARD_KEYS = [
  'terrafusion-overview.json',
  'terrafusion-api.json',
  'terrafusion-consciousness.json',
  'terrafusion-gateway.json',
  'terrafusion-operations.json',
];

// ─── SLO IDs that must appear in slo.md ─────────────────────────────
const REQUIRED_SLO_IDS = [
  'SLO-001',
  'SLO-002',
  'SLO-003',
  'SLO-004',
  'SLO-005',
  'SLO-007',
  'SLO-008',
  'SLO-009',
  'SLO-010',
];

// ─── Gate runner ────────────────────────────────────────────────────
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

console.log('📏 SLO Gate — Phase 7.3\n');

// ─── Rule 1: SLO doc exists and has SLO table ──────────────────────
console.log('── 1. SLO Document ──');
const sloExists = existsSync(SLO_DOC);
rule(sloExists, 'docs/ops/slo.md exists');

let sloContent = '';
if (sloExists) {
  sloContent = readFileSync(SLO_DOC, 'utf8');
  rule(sloContent.includes('SLO Summary Table'), 'SLO Summary Table heading present');

  for (const id of REQUIRED_SLO_IDS) {
    rule(sloContent.includes(id), `SLO doc contains ${id}`);
  }

  rule(sloContent.includes('Error Budget Policy'), 'Error Budget Policy section present');
  rule(
    /recording.?rule/i.test(sloContent) && sloContent.includes('prometheus-rules.yaml'),
    'SLO doc references Prometheus recording rules'
  );
}

// ─── Rule 2: Alerts doc exists and references SLO IDs ───────────────
console.log('\n── 2. Alerts Document ──');
const alertsDocExists = existsSync(ALERTS_DOC);
rule(alertsDocExists, 'docs/ops/alerts.md exists');

if (alertsDocExists) {
  const alertsContent = readFileSync(ALERTS_DOC, 'utf8');
  // At least 5 SLO IDs must be referenced in the alerts doc
  const sloRefs = REQUIRED_SLO_IDS.filter(id => alertsContent.includes(id));
  rule(sloRefs.length >= 5, `Alerts doc references ≥5 SLO IDs (found ${sloRefs.length})`);
  rule(
    alertsContent.includes('prometheus-rules.yaml'),
    'Alerts doc references prometheus-rules.yaml'
  );
}

// ─── Rule 3: Dashboards doc exists and maps to SLOs ─────────────────
console.log('\n── 3. Dashboards Document ──');
const dashDocExists = existsSync(DASHBOARDS_DOC);
rule(dashDocExists, 'docs/ops/dashboards.md exists');

if (dashDocExists) {
  const dashContent = readFileSync(DASHBOARDS_DOC, 'utf8');
  rule(
    dashContent.includes('SLO Coverage') || dashContent.includes('SLO'),
    'Dashboards doc maps to SLOs'
  );
  rule(
    dashContent.includes('grafana-dashboards-configmap.yaml'),
    'Dashboards doc references grafana-dashboards-configmap.yaml'
  );
}

// ─── Rule 4: Prometheus rules contain required alerts ───────────────
console.log('\n── 4. Prometheus Alert Rules ──');
const promExists = existsSync(PROM_RULES);
rule(promExists, 'backend/k8s/prometheus-rules.yaml exists');

if (promExists) {
  const promContent = readFileSync(PROM_RULES, 'utf8');
  for (const alertName of REQUIRED_ALERTS) {
    rule(promContent.includes(alertName), `Alert "${alertName}" defined`);
  }
}

// ─── Rule 5: Grafana dashboards contain required keys ───────────────
console.log('\n── 5. Grafana Dashboard Keys ──');
const grafanaExists = existsSync(GRAFANA_DASHBOARDS);
rule(grafanaExists, 'backend/k8s/grafana-dashboards-configmap.yaml exists');

if (grafanaExists) {
  const grafanaContent = readFileSync(GRAFANA_DASHBOARDS, 'utf8');
  for (const key of REQUIRED_DASHBOARD_KEYS) {
    rule(grafanaContent.includes(key), `Dashboard key "${key}" present`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n── Summary: ${passed}/${total} rules passed ──`);

if (failed > 0) {
  console.log(`\n❌ SLO Gate FAILED (${failed} violation(s))`);
  process.exit(1);
} else {
  console.log('\n✅ SLO Gate PASSED');
  process.exit(0);
}
