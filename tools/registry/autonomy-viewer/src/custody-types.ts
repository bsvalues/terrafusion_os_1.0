/**
 * Phase 4N11 — Chain of Custody Types
 *
 * Type definitions for the custody viewer that produces
 * courtroom-grade "single page of truth" audit packets.
 *
 * SCHEMA: terrafusion.autonomy.custody.v1
 *
 * @module custody-types
 */

// ─────────────────────────────────────────────────────────────────────────────
// Apply Outcome Types (mirrors perf-skill-audit)
// ─────────────────────────────────────────────────────────────────────────────

export type ApplyOutcome = 'applied' | 'skipped' | 'blocked' | 'noop' | 'dry-run';

// ─────────────────────────────────────────────────────────────────────────────
// Apply Proof (from apply-proofs.json)
// ─────────────────────────────────────────────────────────────────────────────

export interface ApplyProof {
  planItemId: string;
  strategyId?: string;
  outcome: ApplyOutcome;

  /** SHA of final commit if applied */
  finalCommitSha?: string;
  /** Rollback command (git revert <sha>) */
  rollbackCommand?: string;

  /** Governance surface checks */
  allowedSurfaceCheck?: { passed: boolean; detail?: string; matchedPattern?: string };
  forbiddenPathCheck?: { passed: boolean; detail?: string; matchedPattern?: string };
  gitApplyCheck?: { ok: boolean; detail?: string };

  /** Semantic guards that passed (e.g., "no-circular-deps", "type-safe") */
  semanticGuardsPassed?: string[];

  /** Human-readable summary of the patch */
  patchSummary?: string;

  /** Diff statistics */
  diffStats?: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };

  /** Gate results (type-check, phase83, etc.) */
  gates?: Array<{
    name: string;
    passed: boolean;
    durationMs?: number;
    command?: string;
  }>;

  /** Selection reason (why this item was picked) */
  selectionReason?: {
    category: string;
    detail?: string;
    message?: string;
    rankingAudit?: string[];
  };

  /** Target file(s) affected */
  targetFile?: string;

  /** Tier (0 = safe, 1 = needs opt-in) */
  tier?: number;

  /** Kind of optimization (debarrel-import, dedupe-imports, etc.) */
  kind?: string;

  /** Risk score (0-100) */
  riskScore?: number;

  /** Estimated lines changed */
  estimatedLinesChanged?: number;

  /** Base SHA before patch */
  baseSha?: string;

  /** Timestamp of proof generation */
  timestamp?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Perf Plan Item (from perf.plan.json)
// ─────────────────────────────────────────────────────────────────────────────

export interface PerfPlanItem {
  id: string;
  kind: string;
  tier: number;
  priorityScore: number;
  estimatedLinesChanged?: number;
  riskScore?: number;
  file?: string;
  eligible?: boolean;
  filterReason?: string;
  strategyId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify Bundle Result (from verify-bundle.json)
// ─────────────────────────────────────────────────────────────────────────────

export interface VerifyBundleResult {
  ok: boolean;
  schema?: string;
  bundleName?: string;
  manifestSha256?: string;
  filesVerified?: number;
  missing?: string[];
  extra?: string[];
  errors?: string[];
  strict?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Record (from evidence-index.json)
// ─────────────────────────────────────────────────────────────────────────────

export type RetentionTier = 'ci' | 'merged' | 'incident';

export interface EvidenceRecord {
  bundleName: string;
  manifestSha256: string;
  retentionTier: RetentionTier;
  releaseTag?: string;
  incident?: boolean;
  incidentSource?: string;
  verifyOk?: boolean;
  verifyStrict?: boolean;
}

export interface EvidenceIndex {
  schema: string;
  generatedAt?: string;
  retention?: {
    ciDays: number;
    mergedDays: number;
    incidentDays: number;
    tier?: RetentionTier;
  };
  records?: EvidenceRecord[];
  bundle?: {
    name: string;
    manifestSha256: string;
    verifyOk: boolean;
    verifyStrict: boolean;
  };
  source?: {
    workflow: string;
    runId: string;
    repo: string;
    ref: string;
    actor?: string;
    prNumber?: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Custody Attestation Checklist
// ─────────────────────────────────────────────────────────────────────────────

export interface CustodyChecklist {
  bundleVerified: boolean;
  proofPresent: boolean;
  rollbackCommandValid: boolean;
  gatesPassed: boolean;
  retentionTierApplied: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custody Model (the complete chain-of-custody document)
// ─────────────────────────────────────────────────────────────────────────────

export interface CustodyModel {
  /** Schema identifier for versioning */
  schema: 'terrafusion.autonomy.custody.v1';

  /** AUDIT READY / NOT AUDIT READY */
  auditReady: boolean;
  /** Reasons why not audit ready (empty if ready) */
  auditReadyReasons: string[];

  /** The primary proof being documented */
  proof: ApplyProof;

  /** Corresponding plan item (if available) */
  planItem?: PerfPlanItem;

  /** Bundle verification result (if available) */
  verify?: VerifyBundleResult;

  /** Evidence record from index (if available) */
  evidenceRecord?: EvidenceRecord;

  /** Verification command for bundle integrity check */
  verifyCommand: string;

  /** Chain-of-custody attestation checklist */
  checklist: CustodyChecklist;

  /** Source metadata (workflow, PR, etc.) */
  source?: {
    workflow?: string;
    runId?: string;
    repo?: string;
    ref?: string;
    actor?: string;
    prNumber?: number;
    branch?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Input Paths
// ─────────────────────────────────────────────────────────────────────────────

export interface CustodyInputPaths {
  proofPath: string;
  planPath?: string;
  verifyPath?: string;
  evidenceIndexPath?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Options
// ─────────────────────────────────────────────────────────────────────────────

export interface CustodyCliOptions extends CustodyInputPaths {
  out: string;
  emitJson?: boolean;
  strict?: boolean;
  verbose?: boolean;
}
