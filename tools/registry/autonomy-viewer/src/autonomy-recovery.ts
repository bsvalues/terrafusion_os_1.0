/**
 * Phase 4N31 – Autonomy Recovery Protocol
 * ========================================
 *
 * When autonomy pauses, this module generates:
 * - Root-cause capsule (why paused, what failed)
 * - Recovery prerequisites (what must pass to resume)
 * - Resume proof (evidence that prerequisites are met)
 *
 * Design principles:
 * - Deterministic: same input → identical output
 * - Fail-closed: resume requires explicit proof
 * - Auditable: every resume decision is provable
 * - Actionable: playbook strings tell operators what to do
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    extractFailureCategories,
    filterToWindow,
    type AutonomyHealth,
    type EvidenceRecordForHealth,
    type FailureCategory,
    type HealthLevel
} from './autonomy-health.js';
import { type AutonomyState } from './autonomy-state.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const RECOVERY_SCHEMA = 'terrafusion.autonomy.recovery.v1';
export const RECOVERY_TOOL_VERSION = '4N31.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types: Recovery Capsule
// ─────────────────────────────────────────────────────────────────────────────

export interface FailureDetail {
  category: FailureCategory;
  count: number;
  firstRecordId: string;
  lastRecordId: string;
  firstOccurrence: string;
  lastOccurrence: string;
}

export interface OperatorAction {
  category: FailureCategory;
  playbook: string;
  severity: 'critical' | 'high' | 'medium';
  estimatedTimeMinutes: number;
}

export interface ResumePrerequisite {
  id: string;
  description: string;
  check: string;
  required: boolean;
  satisfied?: boolean;
  evidence?: string;
}

export interface RecoveryCapsule {
  schema: typeof RECOVERY_SCHEMA;
  toolVersion: typeof RECOVERY_TOOL_VERSION;
  generatedAt: string;
  trigger: 'pause_required' | 'already_paused' | 'health_noop';
  /** Current pause state (if paused) */
  pauseState: {
    paused: boolean;
    reason?: string;
    expiresAt?: string;
    pausedAt?: string;
    pausedBy?: string;
  };
  /** Health summary at time of capsule generation */
  healthSummary: {
    level: HealthLevel;
    totalFailures: number;
    windowRecords: number;
    windowStart: string;
    windowEnd: string;
  };
  /** Ranked failure categories with details */
  failures: FailureDetail[];
  /** Recommended operator actions per category */
  operatorActions: OperatorAction[];
  /** Prerequisites that must pass before resume */
  resumePrerequisites: ResumePrerequisite[];
  /** Resume command to execute */
  resumeCommand: string;
  /** Dry-run command to validate before resume */
  dryRunCommand: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Resume Proof
// ─────────────────────────────────────────────────────────────────────────────

export type ResumeDecision = 'approved' | 'denied' | 'partial';

export interface PrerequisiteResult {
  id: string;
  description: string;
  required: boolean;
  satisfied: boolean;
  evidence: string;
  checkedAt: string;
}

export interface ResumeProof {
  schema: typeof RECOVERY_SCHEMA;
  toolVersion: typeof RECOVERY_TOOL_VERSION;
  generatedAt: string;
  decision: ResumeDecision;
  /** Summary of the decision */
  summary: string;
  /** Prerequisites checked */
  prerequisites: PrerequisiteResult[];
  /** Number required, number satisfied */
  counts: {
    total: number;
    required: number;
    satisfied: number;
    requiredSatisfied: number;
  };
  /** Evidence window used for checks */
  evidenceWindow: {
    recordCount: number;
    start: string;
    end: string;
    recordIds: string[];
  };
  /** If approved, TTL suggestion for the resume */
  suggestedResumeTtl?: string;
  /** Command that was executed */
  command: string;
  /** Actor who executed the resume */
  actor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Operator Action Playbooks (pre-approved strings)
// ─────────────────────────────────────────────────────────────────────────────

const OPERATOR_PLAYBOOKS: Record<FailureCategory, OperatorAction> = {
  verify_bundle_failed: {
    category: 'verify_bundle_failed',
    playbook:
      '1. Run `pnpm perf:verify-bundle --zip <bundle> --strict` to identify hash mismatches. 2. Verify manifest.json matches actual file hashes. 3. Re-generate bundle if corrupted.',
    severity: 'critical',
    estimatedTimeMinutes: 15,
  },
  verify_custody_failed: {
    category: 'verify_custody_failed',
    playbook:
      '1. Run `pnpm perf:verify-custody` to check chain-of-custody. 2. Verify all custody records are present. 3. Check for missing intermediate verifications.',
    severity: 'high',
    estimatedTimeMinutes: 20,
  },
  signatures_failed: {
    category: 'signatures_failed',
    playbook:
      '1. Verify signing identity in workflow. 2. Check OIDC token validity. 3. Re-sign with `cosign sign-blob`. 4. Verify with `cosign verify-blob --certificate-identity`.',
    severity: 'critical',
    estimatedTimeMinutes: 30,
  },
  pins_failed: {
    category: 'pins_failed',
    playbook:
      '1. Check expectedSignaturePolicy in evidence-index. 2. Verify issuer/identity pins match workflow. 3. Update policy if workflow identity changed.',
    severity: 'critical',
    estimatedTimeMinutes: 20,
  },
  rekor_failed: {
    category: 'rekor_failed',
    playbook:
      '1. Check Rekor transparency log status. 2. Verify bundle was uploaded to Rekor. 3. Re-upload if missing. 4. Check network connectivity to rekor.sigstore.dev.',
    severity: 'critical',
    estimatedTimeMinutes: 25,
  },
  publisher_asset_missing: {
    category: 'publisher_asset_missing',
    playbook:
      '1. Check GitHub release assets. 2. Verify artifact upload step in workflow. 3. Re-run publisher workflow if assets missing.',
    severity: 'high',
    estimatedTimeMinutes: 15,
  },
  tpi_failed: {
    category: 'tpi_failed',
    playbook:
      '1. Verify PR has required approvals. 2. Check approver count meets minApprovals. 3. Ensure approvers are not the PR author.',
    severity: 'high',
    estimatedTimeMinutes: 10,
  },
  break_glass_failed: {
    category: 'break_glass_failed',
    playbook:
      '1. Verify break-glass approvals (3+ required). 2. Check approver roles (Security, CIO). 3. Review break-glass policy version.',
    severity: 'critical',
    estimatedTimeMinutes: 30,
  },
  role_binding_failed: {
    category: 'role_binding_failed',
    playbook:
      '1. Check CODEOWNERS for Security/CIO approvers. 2. Verify approver GitHub usernames. 3. Ensure required roles have approved.',
    severity: 'high',
    estimatedTimeMinutes: 15,
  },
  workflow_failure: {
    category: 'workflow_failure',
    playbook:
      '1. Check workflow run logs for errors. 2. Verify all required steps completed. 3. Check for infrastructure issues (runner, network).',
    severity: 'medium',
    estimatedTimeMinutes: 20,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Resume Prerequisites per Category
// ─────────────────────────────────────────────────────────────────────────────

function getPrerequisitesForCategories(categories: FailureCategory[]): ResumePrerequisite[] {
  const prereqs: ResumePrerequisite[] = [];
  const addedIds = new Set<string>();

  // Always require: last N records verify OK
  if (!addedIds.has('verify_ok')) {
    prereqs.push({
      id: 'verify_ok',
      description: 'Last 3 records must have verify.ok = true',
      check: 'verify.ok === true for last 3 records',
      required: true,
    });
    addedIds.add('verify_ok');
  }

  // Category-specific prerequisites
  for (const category of categories) {
    switch (category) {
      case 'verify_bundle_failed':
        if (!addedIds.has('bundle_hash_ok')) {
          prereqs.push({
            id: 'bundle_hash_ok',
            description: 'Bundle hash verification must pass',
            check: 'pnpm perf:verify-bundle --strict returns ok',
            required: true,
          });
          addedIds.add('bundle_hash_ok');
        }
        break;

      case 'signatures_failed':
        if (!addedIds.has('signatures_ok')) {
          prereqs.push({
            id: 'signatures_ok',
            description: 'Signature verification must pass',
            check: 'signature.verified.ok === true for last record',
            required: true,
          });
          addedIds.add('signatures_ok');
        }
        break;

      case 'pins_failed':
        if (!addedIds.has('pins_ok')) {
          prereqs.push({
            id: 'pins_ok',
            description: 'Identity pins must be verified',
            check: 'signature.pinned === true for last record',
            required: true,
          });
          addedIds.add('pins_ok');
        }
        break;

      case 'rekor_failed':
        if (!addedIds.has('rekor_ok')) {
          prereqs.push({
            id: 'rekor_ok',
            description: 'Rekor transparency log must be anchored',
            check: 'rekor.anchored === true for last record',
            required: true,
          });
          addedIds.add('rekor_ok');
        }
        break;

      case 'tpi_failed':
        if (!addedIds.has('tpi_ok')) {
          prereqs.push({
            id: 'tpi_ok',
            description: 'Two-person integrity must pass for applicable PRs',
            check: 'tpi.ok === true for last applicable PR',
            required: true,
          });
          addedIds.add('tpi_ok');
        }
        break;

      case 'publisher_asset_missing':
        if (!addedIds.has('assets_ok')) {
          prereqs.push({
            id: 'assets_ok',
            description: 'All required assets must be present',
            check: 'localBundleMissing === false for last record',
            required: true,
          });
          addedIds.add('assets_ok');
        }
        break;

      case 'role_binding_failed':
        if (!addedIds.has('roles_ok')) {
          prereqs.push({
            id: 'roles_ok',
            description: 'Role binding must be satisfied',
            check: 'roleBinding.ok === true for last applicable record',
            required: true,
          });
          addedIds.add('roles_ok');
        }
        break;

      case 'verify_custody_failed':
        if (!addedIds.has('custody_ok')) {
          prereqs.push({
            id: 'custody_ok',
            description: 'Chain-of-custody must be verified',
            check: 'custody.ok === true for last record',
            required: true,
          });
          addedIds.add('custody_ok');
        }
        break;

      case 'break_glass_failed':
        if (!addedIds.has('break_glass_ok')) {
          prereqs.push({
            id: 'break_glass_ok',
            description: 'Break-glass protocol must pass if activated',
            check: 'breakGlass.ok === true when activated',
            required: true,
          });
          addedIds.add('break_glass_ok');
        }
        break;

      case 'workflow_failure':
        if (!addedIds.has('workflow_ok')) {
          prereqs.push({
            id: 'workflow_ok',
            description: 'Workflow must complete successfully',
            check: 'outcome !== "error" && outcome !== "workflow_failed"',
            required: true,
          });
          addedIds.add('workflow_ok');
        }
        break;
    }
  }

  return prereqs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recovery Capsule Generator
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateCapsuleOptions {
  records: EvidenceRecordForHealth[];
  health: AutonomyHealth;
  autonomyState?: AutonomyState;
  trigger: 'pause_required' | 'already_paused' | 'health_noop';
}

/**
 * Generate a recovery capsule with root-cause analysis and resume prerequisites.
 */
export function generateRecoveryCapsule(options: GenerateCapsuleOptions): RecoveryCapsule {
  const { records, health, autonomyState, trigger } = options;
  const now = new Date().toISOString();

  // Extract failure details with first/last record info
  const failureMap = new Map<
    FailureCategory,
    { count: number; records: { id: string; ts: string }[] }
  >();

  const windowRecords = filterToWindow(records);

  for (const record of windowRecords) {
    const categories = extractFailureCategories(record);
    for (const cat of categories) {
      const existing = failureMap.get(cat) || { count: 0, records: [] };
      existing.count++;
      existing.records.push({ id: record.runId, ts: record.generatedAt });
      failureMap.set(cat, existing);
    }
  }

  // Build ranked failure details
  const failures: FailureDetail[] = Array.from(failureMap.entries())
    .map(([category, data]) => {
      const sorted = data.records.sort((a, b) => a.ts.localeCompare(b.ts));
      return {
        category,
        count: data.count,
        firstRecordId: sorted[0]?.id || 'unknown',
        lastRecordId: sorted[sorted.length - 1]?.id || 'unknown',
        firstOccurrence: sorted[0]?.ts || now,
        lastOccurrence: sorted[sorted.length - 1]?.ts || now,
      };
    })
    .sort((a, b) => b.count - a.count); // Rank by count descending

  // Get operator actions for failed categories
  const operatorActions = failures.map(f => OPERATOR_PLAYBOOKS[f.category]);

  // Get resume prerequisites based on failure categories
  const failedCategories = failures.map(f => f.category);
  const resumePrerequisites = getPrerequisitesForCategories(failedCategories);

  // Build pause state from autonomy state
  const pauseState = {
    paused: autonomyState?.state === 'paused',
    reason: autonomyState?.reason ?? undefined,
    expiresAt: autonomyState?.expiresAt ?? undefined,
    pausedAt: autonomyState?.updatedAt,
    pausedBy: autonomyState?.updatedBy,
  };

  // Build health summary
  const healthSummary = {
    level: health.decision.level,
    totalFailures: health.totals.failed,
    windowRecords: health.window.recordCount,
    windowStart: health.window.windowStart,
    windowEnd: health.window.windowEnd,
  };

  return {
    schema: RECOVERY_SCHEMA,
    toolVersion: RECOVERY_TOOL_VERSION,
    generatedAt: now,
    trigger,
    pauseState,
    healthSummary,
    failures,
    operatorActions,
    resumePrerequisites,
    resumeCommand: `pnpm perf:autonomy resume --actor operator --recovery ./autonomy-recovery.json`,
    dryRunCommand: `pnpm perf:autonomy resume --actor operator --recovery ./autonomy-recovery.json --dry-run`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume Prerequisite Checker
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckPrerequisitesOptions {
  records: EvidenceRecordForHealth[];
  prerequisites: ResumePrerequisite[];
  minRecordsForVerifyOk?: number;
}

/**
 * Check all prerequisites against recent evidence records.
 * Returns prerequisite results with satisfied status and evidence.
 */
export function checkPrerequisites(options: CheckPrerequisitesOptions): PrerequisiteResult[] {
  const { records, prerequisites, minRecordsForVerifyOk = 3 } = options;
  const now = new Date().toISOString();

  // Sort records by date descending (newest first)
  const sorted = [...records].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const recent = sorted.slice(0, minRecordsForVerifyOk);

  const results: PrerequisiteResult[] = [];

  for (const prereq of prerequisites) {
    let satisfied = false;
    let evidence = 'No matching records';

    switch (prereq.id) {
      case 'verify_ok': {
        const okCount = recent.filter(r => r.verify?.ok === true).length;
        satisfied = okCount >= minRecordsForVerifyOk;
        evidence = `${okCount}/${minRecordsForVerifyOk} recent records have verify.ok=true`;
        break;
      }

      case 'bundle_hash_ok': {
        const lastOk = recent.find(r => r.verify?.ok === true);
        satisfied = !!lastOk;
        evidence = lastOk
          ? `Record ${lastOk.runId} has verify.ok=true`
          : 'No recent records with verify.ok=true';
        break;
      }

      case 'signatures_ok': {
        const lastSigned = recent.find(r => r.signature?.signed && r.signature?.verified?.ok);
        satisfied = !!lastSigned;
        evidence = lastSigned
          ? `Record ${lastSigned.runId} has signature.verified.ok=true`
          : 'No recent records with verified signatures';
        break;
      }

      case 'pins_ok': {
        const lastPinned = recent.find(r => r.signature?.signed && r.signature?.pinned);
        satisfied = !!lastPinned;
        evidence = lastPinned
          ? `Record ${lastPinned.runId} has signature.pinned=true`
          : 'No recent records with pinned signatures';
        break;
      }

      case 'rekor_ok': {
        const lastAnchored = recent.find(r => r.rekor?.anchored);
        satisfied = !!lastAnchored;
        evidence = lastAnchored
          ? `Record ${lastAnchored.runId} has rekor.anchored=true`
          : 'No recent records anchored in Rekor';
        break;
      }

      case 'tpi_ok': {
        // TPI only applies to non-ci tiers
        const applicableRecords = recent.filter(r => r.tier !== 'ci');
        if (applicableRecords.length === 0) {
          satisfied = true;
          evidence = 'No non-ci records in window (TPI not applicable)';
        } else {
          const lastTpiOk = applicableRecords.find(r => r.tpi?.ok);
          satisfied = !!lastTpiOk;
          evidence = lastTpiOk
            ? `Record ${lastTpiOk.runId} has tpi.ok=true`
            : 'No recent applicable records with tpi.ok=true';
        }
        break;
      }

      case 'assets_ok': {
        const lastAssetsOk = recent.find(r => r.localBundleMissing !== true);
        satisfied = !!lastAssetsOk;
        evidence = lastAssetsOk
          ? `Record ${lastAssetsOk.runId} has no missing assets`
          : 'Recent records have missing assets';
        break;
      }

      case 'roles_ok': {
        const applicableRecords = recent.filter(r => r.roleBinding && !r.roleBinding.skipped);
        if (applicableRecords.length === 0) {
          satisfied = true;
          evidence = 'No records with role binding requirements in window';
        } else {
          const lastRolesOk = applicableRecords.find(r => r.roleBinding?.ok);
          satisfied = !!lastRolesOk;
          evidence = lastRolesOk
            ? `Record ${lastRolesOk.runId} has roleBinding.ok=true`
            : 'No recent applicable records with roleBinding.ok=true';
        }
        break;
      }

      case 'custody_ok': {
        const lastCustodyOk = recent.find(r => r.custody?.ok);
        satisfied = lastCustodyOk !== undefined || recent.every(r => r.custody === undefined);
        evidence = lastCustodyOk
          ? `Record ${lastCustodyOk.runId} has custody.ok=true`
          : recent.every(r => r.custody === undefined)
            ? 'No custody checks in recent records (not applicable)'
            : 'No recent records with custody.ok=true';
        break;
      }

      case 'break_glass_ok': {
        const applicableRecords = recent.filter(r => r.breakGlass?.activated);
        if (applicableRecords.length === 0) {
          satisfied = true;
          evidence = 'No break-glass activations in window';
        } else {
          const lastOk = applicableRecords.find(r => r.breakGlass?.ok);
          satisfied = !!lastOk;
          evidence = lastOk
            ? `Record ${lastOk.runId} has breakGlass.ok=true`
            : 'Active break-glass without ok=true';
        }
        break;
      }

      case 'workflow_ok': {
        const lastWorkflowOk = recent.find(
          r => r.outcome !== 'error' && r.outcome !== 'workflow_failed'
        );
        satisfied = !!lastWorkflowOk;
        evidence = lastWorkflowOk
          ? `Record ${lastWorkflowOk.runId} has successful workflow outcome`
          : 'Recent records have workflow failures';
        break;
      }

      default:
        evidence = `Unknown prerequisite: ${prereq.id}`;
    }

    results.push({
      id: prereq.id,
      description: prereq.description,
      required: prereq.required,
      satisfied,
      evidence,
      checkedAt: now,
    });
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume Proof Generator
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateResumeProofOptions {
  records: EvidenceRecordForHealth[];
  capsule: RecoveryCapsule;
  actor: string;
  command: string;
  dryRun?: boolean;
}

/**
 * Generate a resume proof with prerequisite check results.
 * Always emits proof, even when denied.
 */
export function generateResumeProof(options: GenerateResumeProofOptions): ResumeProof {
  const { records, capsule, actor, command, dryRun = false } = options;
  const now = new Date().toISOString();

  // Check all prerequisites
  const prerequisites = checkPrerequisites({
    records,
    prerequisites: capsule.resumePrerequisites,
  });

  // Calculate counts
  const counts = {
    total: prerequisites.length,
    required: prerequisites.filter(p => p.required).length,
    satisfied: prerequisites.filter(p => p.satisfied).length,
    requiredSatisfied: prerequisites.filter(p => p.required && p.satisfied).length,
  };

  // Determine decision
  let decision: ResumeDecision;
  if (counts.requiredSatisfied === counts.required) {
    decision = 'approved';
  } else if (counts.satisfied > 0) {
    decision = 'partial';
  } else {
    decision = 'denied';
  }

  // Build evidence window info
  const sorted = [...records].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const windowRecords = sorted.slice(0, 10);

  const evidenceWindow = {
    recordCount: windowRecords.length,
    start: windowRecords[windowRecords.length - 1]?.generatedAt || now,
    end: windowRecords[0]?.generatedAt || now,
    recordIds: windowRecords.map(r => r.runId),
  };

  // Summary text
  const summaryParts: string[] = [];
  if (decision === 'approved') {
    summaryParts.push('All required prerequisites satisfied.');
    if (dryRun) {
      summaryParts.push('DRY RUN - no changes made.');
    } else {
      summaryParts.push('Autonomy resume approved.');
    }
  } else if (decision === 'partial') {
    summaryParts.push(
      `${counts.requiredSatisfied}/${counts.required} required prerequisites satisfied.`
    );
    const missing = prerequisites.filter(p => p.required && !p.satisfied);
    summaryParts.push(`Missing: ${missing.map(p => p.id).join(', ')}`);
  } else {
    summaryParts.push('No prerequisites satisfied. Resume denied.');
  }

  return {
    schema: RECOVERY_SCHEMA,
    toolVersion: RECOVERY_TOOL_VERSION,
    generatedAt: now,
    decision,
    summary: summaryParts.join(' '),
    prerequisites,
    counts,
    evidenceWindow,
    suggestedResumeTtl: decision === 'approved' ? '4h' : undefined,
    command,
    actor,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// File I/O Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_RECOVERY_PATH = path.join(__dirname, '..', 'autonomy-recovery.json');
const DEFAULT_RESUME_PROOF_PATH = path.join(__dirname, '..', 'resume-proof.json');

export function saveRecoveryCapsule(
  capsule: RecoveryCapsule,
  filePath: string = DEFAULT_RECOVERY_PATH
): void {
  fs.writeFileSync(filePath, JSON.stringify(capsule, null, 2), 'utf-8');
}

export function loadRecoveryCapsule(filePath: string = DEFAULT_RECOVERY_PATH): RecoveryCapsule {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  if (data.schema !== RECOVERY_SCHEMA) {
    throw new Error(`Invalid recovery capsule schema: ${data.schema}`);
  }
  return data as RecoveryCapsule;
}

export function saveResumeProof(
  proof: ResumeProof,
  filePath: string = DEFAULT_RESUME_PROOF_PATH
): void {
  fs.writeFileSync(filePath, JSON.stringify(proof, null, 2), 'utf-8');
}

export function loadResumeProof(filePath: string = DEFAULT_RESUME_PROOF_PATH): ResumeProof {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  if (data.schema !== RECOVERY_SCHEMA) {
    throw new Error(`Invalid resume proof schema: ${data.schema}`);
  }
  return data as ResumeProof;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export for Testing
// ─────────────────────────────────────────────────────────────────────────────

export { OPERATOR_PLAYBOOKS };
