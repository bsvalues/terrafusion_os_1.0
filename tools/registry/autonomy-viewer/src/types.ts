/**
 * Phase 4M9 — Autonomy Viewer Types
 *
 * Type definitions for the dashboard viewer inputs.
 * These are flexible to handle variations in the artifact schemas.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Re-export Evidence Index Types (Phase 4N6)
// ─────────────────────────────────────────────────────────────────────────────

export type {
    EvidenceArtifacts, EvidenceBundle, EvidenceIndex, EvidenceIndexSource, EvidenceRecord, EvidenceRetention, EvidenceRollback
} from './evidence-index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Input Artifact Types (from perf-skill-audit outputs)
// ─────────────────────────────────────────────────────────────────────────────

export type ApplyOutcome = 'applied' | 'skipped' | 'blocked' | 'noop' | 'dry-run';

export interface ApplyProof {
  planItemId?: string;
  strategyId?: string;
  outcome: ApplyOutcome;
  finalCommitSha?: string;
  rollbackCommand?: string;
  failureReason?: string;
  selectionReason?: {
    category: string;
    message: string;
  };
  gates?: Array<{
    name: string;
    passed: boolean;
    output?: string;
  }>;
  diffStats?: {
    insertions: number;
    deletions: number;
    filesChanged: number;
  };
  targetFile?: string;
  timestamp?: string;
}

export interface AutonomyReport {
  runId: string;
  timestamp: string;
  outcome: ApplyOutcome;
  applied: number;
  skipped: number;
  blocked: number;
  noop: number;
  totalEligible: number;
  safetyRails: SafetyRailsStatus;
  proofs: ApplyProof[];
}

export interface SafetyRailsStatus {
  allowedSurface: boolean;
  forbiddenPaths: boolean;
  baseShaMatch: boolean;
  cleanWorkingTree: boolean;
  protectedBranchGuard: boolean;
  gitApplyCheck: boolean;
  gatesPassed: boolean;
}

export interface PlanItem {
  id: string;
  strategyId: string;
  file: string;
  kind: string;
  priority: number;
  riskScore: number;
  estimatedLinesChanged: number;
  eligible: boolean;
  filterReason?: string;
  tier?: number;
}

export interface PerfPlan {
  version: string;
  generatedAt: string;
  items: PlanItem[];
}

export interface ActionableFinding {
  id: string;
  kind: string;
  file: string;
  line?: number;
  priority: number;
  riskScore: number;
  message: string;
}

export interface ActionableReport {
  findings: ActionableFinding[];
  summary: {
    total: number;
    byKind: Record<string, number>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard View Model (normalized for rendering)
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardViewModel {
  /** Generation metadata */
  generatedAt: string;
  viewerVersion: string;

  /** Executive Summary */
  summary: {
    runId: string;
    timestamp: string;
    outcome: ApplyOutcome;
    outcomeLabel: string;
    appliedCount: number;
    skippedCount: number;
    blockedCount: number;
    noopCount: number;
    selectionReason?: string;
    appliedFile?: string;
    appliedStrategy?: string;
    appliedDiffStats?: {
      insertions: number;
      deletions: number;
    };
  };

  /** Safety Rails Status */
  safetyRails: Array<{
    name: string;
    passed: boolean;
    description: string;
  }>;

  /** Rollback Panel */
  rollback: {
    applicable: boolean;
    reason?: string;
    proofId?: string;
    commitSha?: string;
    previewCommand?: string;
    executeCommand?: string;
    manualCommand?: string;
    postRollbackGates: string[];
  };

  /** Findings & Plan */
  findings: {
    total: number;
    eligible: number;
    filtered: number;
    topFindings: Array<{
      kind: string;
      file: string;
      priority: number;
      riskScore: number;
      estimatedLines: number;
      filterReason?: string;
    }>;
  };

  /** Proof Artifacts */
  artifacts: Array<{
    name: string;
    purpose: string;
  }>;

  /** Evidence Ledger (Phase 4N7) — only present if evidence index loaded */
  evidenceLedger?: {
    present: boolean;
    schema: string;
    generatedAt: string;
    source: {
      workflow: string;
      runId: string;
      repo: string;
      ref: string;
    };
    bundle: {
      name: string;
      manifestSha256: string;
      verifyOk: boolean;
      verifyStrict: boolean;
    };
    retention: {
      days: number;
      policy: string;
      tier: 'ci' | 'merged' | 'incident';
      tierLabel: string;
    };
    verifyCommand: string;
    records: Array<{
      recordId: string;
      status: string;
      planItemId: string;
      strategyId: string;
    }>;
  };

  /** Verification status — red banner if failed */
  verificationFailed: boolean;
}
