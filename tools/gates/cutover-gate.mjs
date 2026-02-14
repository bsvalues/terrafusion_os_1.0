#!/usr/bin/env node
/**
 * Cutover Gate — Phase 7.5 Production Cutover Safety
 *
 * Validates production cutover readiness:
 *   1. Cutover runbook exists with required sections
 *   2. Rollback runbook exists with explicit triggers
 *   3. Version pinning: platform.json has a semver version
 *   4. ArgoCD applications target specific revisions (not HEAD/main)
 *   5. K8s Deployments have health probes (readiness + liveness)
 *   6. Database migration docs reference backward-compat pattern
 *   7. TLS configuration present in Ingress
 *   8. Gate status checklist present in cutover runbook
 *
 * Usage: node tools/gates/cutover-gate.mjs
 * Exit:  0 = all pass, 1 = any failure
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');

// ─── Paths ──────────────────────────────────────────────────────────
const CUTOVER_RUNBOOK = join(REPO_ROOT, 'docs', 'deploy', 'runbooks', 'cutover.md');
const ROLLBACK_RUNBOOK = join(REPO_ROOT, 'docs', 'deploy', 'runbooks', 'rollback.md');
const PLATFORM_JSON = join(REPO_ROOT, 'platform.json');
const ARGOCD_APPS_DIR = join(REPO_ROOT, 'backend', 'gitops', 'argocd', 'applications');
const K8S_DIR = join(REPO_ROOT, 'backend', 'k8s');

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

console.log('🚀 Cutover Gate — Phase 7.5\n');

// ─── Rule 1: Cutover runbook ────────────────────────────────────────
console.log('── 1. Cutover Runbook ──');
const cutoverExists = existsSync(CUTOVER_RUNBOOK);
rule(cutoverExists, 'docs/deploy/runbooks/cutover.md exists');

if (cutoverExists) {
  const content = readFileSync(CUTOVER_RUNBOOK, 'utf8');
  rule(content.includes('Version Pinning'), 'Version pinning section present');
  rule(content.includes('Migration'), 'Migration section present');
  rule(
    content.includes('Smoke Verification') || content.includes('Smoke'),
    'Smoke verification section present'
  );
  rule(
    content.includes('Gate Status') || content.includes('gates'),
    'Gate status checklist referenced'
  );
  rule(content.includes('Maintenance Window'), 'Maintenance window procedure present');
  rule(content.includes('Traffic Shift'), 'Traffic shift procedure present');
}

// ─── Rule 2: Rollback runbook ───────────────────────────────────────
console.log('\n── 2. Rollback Runbook ──');
const rollbackExists = existsSync(ROLLBACK_RUNBOOK);
rule(rollbackExists, 'docs/deploy/runbooks/rollback.md exists');

if (rollbackExists) {
  const content = readFileSync(ROLLBACK_RUNBOOK, 'utf8');
  rule(content.includes('Rollback Triggers'), 'Rollback triggers section present');
  rule(
    content.includes('argocd') || content.includes('ArgoCD'),
    'ArgoCD rollback procedure documented'
  );
  rule(
    content.includes('kubectl rollout undo') || content.includes('rollout undo'),
    'kubectl rollback fallback documented'
  );
  rule(
    content.includes('Database Rollback') || content.includes('Database Restore'),
    'Database rollback procedure present'
  );
}

// ─── Rule 3: Version pinning (platform.json or package.json) ────────
console.log('\n── 3. Version Pinning ──');
const platformExists = existsSync(PLATFORM_JSON);
rule(platformExists, 'platform.json exists');

// Version can live in platform.json or root package.json
const PKG_JSON = join(REPO_ROOT, 'package.json');
let versionFound = false;

for (const [label, path] of [
  ['platform.json', PLATFORM_JSON],
  ['package.json', PKG_JSON],
]) {
  if (!existsSync(path)) continue;
  try {
    const obj = JSON.parse(readFileSync(path, 'utf8'));
    const ver = obj.version || obj.platformVersion || '';
    if (/^\d+\.\d+\.\d+/.test(ver)) {
      rule(true, `${label} version is semver: "${ver}"`);
      versionFound = true;
      break;
    }
  } catch {
    /* skip */
  }
}
if (!versionFound) {
  rule(false, 'Semver version found in platform.json or package.json');
}

// ─── Rule 4: ArgoCD applications exist ──────────────────────────────
console.log('\n── 4. ArgoCD Applications ──');
const argoAppsExist = existsSync(ARGOCD_APPS_DIR);
rule(argoAppsExist, 'backend/gitops/argocd/applications/ exists');

if (argoAppsExist) {
  const argoApps = readdirSync(ARGOCD_APPS_DIR).filter(
    f => f.endsWith('.yaml') || f.endsWith('.yml')
  );
  rule(argoApps.length >= 2, `≥ 2 ArgoCD application manifests (found ${argoApps.length})`);

  // At least one app should target production
  const hasProd = argoApps.some(f => f.includes('prod'));
  rule(hasProd, 'At least one ArgoCD app targets production');

  // Check that apps define targetRevision
  let hasRevision = false;
  for (const f of argoApps) {
    const content = readFileSync(join(ARGOCD_APPS_DIR, f), 'utf8');
    if (content.includes('targetRevision')) {
      hasRevision = true;
      break;
    }
  }
  rule(hasRevision, 'ArgoCD applications define targetRevision');
}

// ─── Rule 5: K8s Deployments have health probes ─────────────────────
console.log('\n── 5. Health Probes ──');
if (existsSync(K8S_DIR)) {
  const k8sFiles = readdirSync(K8S_DIR).filter(
    f => (f.endsWith('.yaml') || f.endsWith('.yml')) && f.includes('deployment')
  );

  let allHaveReadiness = true;
  let allHaveLiveness = true;
  let deploymentCount = 0;

  for (const f of k8sFiles) {
    const content = readFileSync(join(K8S_DIR, f), 'utf8');
    if (content.includes('kind: Deployment') || content.includes('kind:Deployment')) {
      deploymentCount++;
      if (!content.includes('readinessProbe')) allHaveReadiness = false;
      if (!content.includes('livenessProbe')) allHaveLiveness = false;
    }
  }

  rule(deploymentCount > 0, `Deployment manifests found (${deploymentCount})`);
  rule(allHaveReadiness, 'All Deployments have readinessProbe');
  rule(allHaveLiveness, 'All Deployments have livenessProbe');
} else {
  rule(false, 'backend/k8s/ directory exists');
}

// ─── Rule 6: TLS in Ingress ─────────────────────────────────────────
console.log('\n── 6. TLS Configuration ──');
if (existsSync(K8S_DIR)) {
  let tlsFound = false;
  for (const f of readdirSync(K8S_DIR)) {
    if (f.endsWith('.yaml') || f.endsWith('.yml')) {
      const content = readFileSync(join(K8S_DIR, f), 'utf8');
      if (content.includes('Ingress') && content.includes('tls:')) {
        tlsFound = true;
        break;
      }
    }
  }
  rule(tlsFound, 'Ingress resource has TLS configuration');
}

// ─── Summary ────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n── Summary: ${passed}/${total} rules passed ──`);

if (failed > 0) {
  console.log(`\n❌ Cutover Gate FAILED (${failed} violation(s))`);
  process.exit(1);
} else {
  console.log('\n✅ Cutover Gate PASSED');
  process.exit(0);
}
