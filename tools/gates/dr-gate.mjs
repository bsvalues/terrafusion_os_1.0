#!/usr/bin/env node
/**
 * DR Gate — Phase 7.4 Production Cutover Safety
 *
 * Validates Disaster Recovery readiness:
 *   1. Backup script exists (ops/scripts/backup_sovereign.ps1)
 *   2. DR validation script exists (scripts/disaster-recovery-validation.sh)
 *   3. RPO/RTO are declared in the rollback runbook
 *   4. Rollback runbook exists with restore procedure
 *   5. ArgoCD sync-waves define ordered recovery
 *   6. revisionHistoryLimit ≥ 5 in Deployments (enables kubectl rollout undo)
 *   7. PDBs exist (production continuity during voluntary disruptions)
 *
 * Usage: node tools/gates/dr-gate.mjs
 * Exit:  0 = all pass, 1 = any failure
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');

// ─── Paths ──────────────────────────────────────────────────────────
const BACKUP_SCRIPT = join(REPO_ROOT, 'ops', 'scripts', 'backup_sovereign.ps1');
const DR_VALIDATION = join(REPO_ROOT, 'scripts', 'disaster-recovery-validation.sh');
const ROLLBACK_RUNBOOK = join(REPO_ROOT, 'docs', 'deploy', 'runbooks', 'rollback.md');
const CUTOVER_RUNBOOK = join(REPO_ROOT, 'docs', 'deploy', 'runbooks', 'cutover.md');
const SYNC_WAVES = join(REPO_ROOT, 'backend', 'gitops', 'argocd', 'sync-waves', 'sync-waves.yaml');
const K8S_DIR = join(REPO_ROOT, 'backend', 'k8s');

// K8s deployment files expected to contain revisionHistoryLimit and PDBs
const DEPLOYMENT_FILE = join(K8S_DIR, 'deployment.yaml');
const NAMESPACE_FILE = join(K8S_DIR, 'namespace.yaml');

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

console.log('🛡️  DR Gate — Phase 7.4\n');

// ─── Rule 1: Backup script exists ───────────────────────────────────
console.log('── 1. Backup Infrastructure ──');
rule(existsSync(BACKUP_SCRIPT), 'ops/scripts/backup_sovereign.ps1 exists');

if (existsSync(BACKUP_SCRIPT)) {
  const backupContent = readFileSync(BACKUP_SCRIPT, 'utf8');
  rule(
    /backup/i.test(backupContent) && /copy|compress/i.test(backupContent),
    'Backup script performs copy/compress operations'
  );
}

// ─── Rule 2: DR validation script exists ────────────────────────────
console.log('\n── 2. DR Validation Script ──');
rule(existsSync(DR_VALIDATION), 'scripts/disaster-recovery-validation.sh exists');

if (existsSync(DR_VALIDATION)) {
  const drContent = readFileSync(DR_VALIDATION, 'utf8');
  rule(drContent.includes('RPO'), 'DR script declares RPO');
  rule(drContent.includes('RTO'), 'DR script declares RTO');
}

// ─── Rule 3: Rollback runbook with RPO/RTO ──────────────────────────
console.log('\n── 3. Rollback Runbook ──');
rule(existsSync(ROLLBACK_RUNBOOK), 'docs/deploy/runbooks/rollback.md exists');

if (existsSync(ROLLBACK_RUNBOOK)) {
  const rollbackContent = readFileSync(ROLLBACK_RUNBOOK, 'utf8');
  rule(rollbackContent.includes('RPO'), 'Rollback runbook declares RPO');
  rule(rollbackContent.includes('RTO'), 'Rollback runbook declares RTO');
  rule(
    /rollback.?trigger/i.test(rollbackContent) || rollbackContent.includes('Rollback Triggers'),
    'Rollback triggers section present'
  );
  rule(
    /restore/i.test(rollbackContent) && /backup/i.test(rollbackContent),
    'Restore-from-backup procedure documented'
  );
  rule(
    rollbackContent.includes('Post-Incident') || rollbackContent.includes('post-mortem'),
    'Post-incident section present'
  );
}

// ─── Rule 4: Cutover runbook exists ─────────────────────────────────
console.log('\n── 4. Cutover Runbook ──');
rule(existsSync(CUTOVER_RUNBOOK), 'docs/deploy/runbooks/cutover.md exists');

if (existsSync(CUTOVER_RUNBOOK)) {
  const cutoverContent = readFileSync(CUTOVER_RUNBOOK, 'utf8');
  rule(
    cutoverContent.includes('Pre-Cutover') || cutoverContent.includes('Checklist'),
    'Pre-cutover checklist present'
  );
  rule(
    cutoverContent.includes('rollback.md') || cutoverContent.includes('Rollback'),
    'Cutover runbook references rollback procedure'
  );
}

// ─── Rule 5: ArgoCD sync-waves ──────────────────────────────────────
console.log('\n── 5. ArgoCD Sync Waves ──');
rule(existsSync(SYNC_WAVES), 'backend/gitops/argocd/sync-waves/sync-waves.yaml exists');

if (existsSync(SYNC_WAVES)) {
  const syncContent = readFileSync(SYNC_WAVES, 'utf8');
  rule(syncContent.includes('sync-wave'), 'Sync-wave annotations present');
  rule(
    syncContent.includes('terrafusion') && syncContent.includes('Namespace'),
    'Namespace resources defined with sync waves'
  );
}

// ─── Rule 6: Deployment revisionHistoryLimit ────────────────────────
console.log('\n── 6. Deployment Revision History ──');
if (existsSync(DEPLOYMENT_FILE)) {
  const deployContent = readFileSync(DEPLOYMENT_FILE, 'utf8');
  const histMatch = deployContent.match(/revisionHistoryLimit:\s*(\d+)/);
  if (histMatch) {
    const limit = parseInt(histMatch[1], 10);
    rule(limit >= 5, `revisionHistoryLimit = ${limit} (≥ 5 required)`);
  } else {
    rule(false, 'revisionHistoryLimit not found in deployment.yaml');
  }
} else {
  // Check all yaml files in k8s dir for revisionHistoryLimit
  let foundHistory = false;
  if (existsSync(K8S_DIR)) {
    const { readdirSync } = await import('node:fs');
    for (const f of readdirSync(K8S_DIR)) {
      if (f.endsWith('.yaml') || f.endsWith('.yml')) {
        const content = readFileSync(join(K8S_DIR, f), 'utf8');
        const match = content.match(/revisionHistoryLimit:\s*(\d+)/);
        if (match && parseInt(match[1], 10) >= 5) {
          foundHistory = true;
          rule(true, `revisionHistoryLimit ≥ 5 found in ${f}`);
          break;
        }
      }
    }
  }
  if (!foundHistory) {
    rule(false, 'revisionHistoryLimit ≥ 5 not found in any K8s manifest');
  }
}

// ─── Rule 7: PodDisruptionBudgets ───────────────────────────────────
console.log('\n── 7. PodDisruptionBudgets ──');
let pdbFound = false;
if (existsSync(K8S_DIR)) {
  const { readdirSync } = await import('node:fs');
  for (const f of readdirSync(K8S_DIR)) {
    if (f.endsWith('.yaml') || f.endsWith('.yml')) {
      const content = readFileSync(join(K8S_DIR, f), 'utf8');
      if (content.includes('PodDisruptionBudget')) {
        pdbFound = true;
        break;
      }
    }
  }
}
rule(pdbFound, 'PodDisruptionBudget resource exists in K8s manifests');

// ─── Summary ────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n── Summary: ${passed}/${total} rules passed ──`);

if (failed > 0) {
  console.log(`\n❌ DR Gate FAILED (${failed} violation(s))`);
  process.exit(1);
} else {
  console.log('\n✅ DR Gate PASSED');
  process.exit(0);
}
