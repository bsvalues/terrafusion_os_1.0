/**
 * Patch Strategy Types (Phase 4M4)
 *
 * Defines the contract for all auto-fix patch strategies.
 * Each strategy must prove safety before patch generation.
 */

import type { EvidenceItem, Finding } from '../scanners/types.js';

/**
 * Strategy identifier for routing
 */
export type PatchStrategyId =
  // Tier 0: Deterministic, minimal semantics risk
  | 'missing-use-client'
  | 'dedupe-imports'
  | 'debarrel-import'
  | 'setstate-nonfunctional' // Phase 4M6a: Tier 0 expansion
  // Tier 1: Higher impact, constrained safety
  | 'waterfall-parallelize'
  | 'rerender-stabilize'
  // Review-only fallback
  | 'review-only';

/**
 * Risk level for applying patch
 */
export type PatchRisk = 'low' | 'medium' | 'high';

/**
 * Eligibility status
 */
export type EligibilityStatus = 'eligible' | 'review' | 'blocked';

/**
 * Result of canApply check
 */
export interface CanApplyResult {
  ok: boolean;
  reason?: string;
}

/**
 * Evidence item with additional context for patches
 */
export interface PatchEvidence extends EvidenceItem {
  before?: string;
  after?: string;
  varName?: string;
}

/**
 * Result of buildPatch
 */
export interface BuildPatchResult {
  patch: string; // Unified diff format
  evidence: PatchEvidence[];
  insertLine?: number; // For insertions
  deletedLines?: number[]; // For removals
}

/**
 * Result of patch integrity verification
 */
export interface PatchIntegrityResult {
  valid: boolean;
  reason?: string;
  diffStats?: {
    additions: number;
    deletions: number;
    changedFiles: number;
  };
}

/**
 * Patch strategy interface - all strategies must implement this
 */
export interface PatchStrategy {
  /** Strategy identifier */
  id: PatchStrategyId;

  /** Human-readable name */
  name: string;

  /** Risk level when applied */
  risk: PatchRisk;

  /** Tier (0=ship first, 1=ship next, 2=hold) */
  tier: 0 | 1 | 2;

  /** Which scanner kinds this strategy handles */
  handlesKinds: string[];

  /**
   * Check if this strategy can safely apply to the finding
   * Must return { ok: false } if ANY safety concern exists
   */
  canApply(finding: Finding, fileContent: string): CanApplyResult;

  /**
   * Build the patch for the finding
   * Only called if canApply returned { ok: true }
   */
  buildPatch(finding: Finding, fileContent: string): BuildPatchResult;

  /**
   * Verify patch integrity after building
   * Checks function boundary preservation, minimal diff, etc.
   */
  verifyPatchIntegrity(
    finding: Finding,
    originalContent: string,
    patchedContent: string
  ): PatchIntegrityResult;
}

/**
 * Enhanced plan item for perf.plan.json
 */
export interface PerfPlanItem {
  id: string;
  scanner: string;
  kind: string;
  priorityScore: number;
  eligibility: EligibilityStatus;
  reason: string;
  patchStrategy: PatchStrategyId;
  file: string; // Primary file (first in files array)
  files: string[];
  evidence: PatchEvidence[];
  risk: PatchRisk;
  gates: string[];
  suggestedPatch?: string;
  startLine?: number;
  endLine?: number;
  functionName?: string;
  // Phase 4M5: Autonomy envelope fields
  estimatedLinesChanged?: number;
  riskScore?: number; // 0-100, computed from tier + proximity to boundary surfaces
}

/**
 * Unified perf.plan.json schema
 */
export interface PerfPlan {
  generated: string;
  ref: string;
  baseSha: string; // Phase 4M5: Git SHA the plan was generated against
  rulesVersion: string;
  summary: {
    total: number;
    eligible: number;
    review: number;
    blocked: number;
    byStrategy: Record<PatchStrategyId, number>;
    byRisk: Record<PatchRisk, number>;
  };
  items: PerfPlanItem[];
}

/**
 * Outcome of patch application
 */
export type ApplyOutcome = 'applied' | 'skipped' | 'rolled_back' | 'noop';

/**
 * Selection reason for --auto mode
 */
export interface SelectionReason {
  /** Why this item was selected (or why no item was selected) */
  reason: string;
  /** Total candidates considered */
  candidatesConsidered: number;
  /** Candidates filtered by governance */
  filteredByGovernance: number;
  /** Candidates filtered by tier */
  filteredByTier: number;
  /** Final ranking factors */
  rankingFactors?: {
    priorityScore: number;
    estimatedLinesChanged: number;
    riskScore: number;
    id: string;
  };
}

/**
 * Proof artifact for ralph-apply (audit-grade contract)
 *
 * Required fields for audit trail:
 * - planItemId: Links to specific plan item
 * - allowedSurfaceCheck: Core Governance Surface validation
 * - forbiddenPathCheck: Forbidden zone validation
 * - gitApplyCheck: Patch application result
 * - gates: All gate results with log paths
 * - outcome: Final state
 * - finalCommitSha: Only if outcome=applied
 */
export interface ApplyProof {
  /** Unique identifier linking to perf.plan.json item */
  planItemId: string;

  /** Strategy used for patch generation */
  strategyId: PatchStrategyId;

  /** ISO timestamp of application attempt */
  appliedAt: string;

  /** Core Governance Surface check */
  allowedSurfaceCheck: {
    passed: boolean;
    file: string;
    reason?: string;
  };

  /** Forbidden path check */
  forbiddenPathCheck: {
    passed: boolean;
    file: string;
    reason?: string;
  };

  /** git apply --check result */
  gitApplyCheck: {
    ok: boolean;
    output?: string;
  };

  /** Unified diff that was applied (or attempted) */
  patch: string;

  /** Gate results with log paths */
  gates: {
    name: string;
    command: string;
    passed: boolean;
    logPath?: string;
    durationMs?: number;
  }[];

  /** Final outcome of the application */
  outcome: ApplyOutcome;

  /** Commit SHA (only if outcome=applied) */
  finalCommitSha?: string;

  /** Selection reason for --auto mode (explains deterministic choice) */
  selectionReason?: SelectionReason;

  /** Rollback command (only if outcome=applied) */
  rollbackCommand?: string;

  /** Reason for skip or rollback */
  failureReason?: string;

  // Phase 4M6a: Enhanced proof fields for audit-grade verification

  /** Semantic guards that passed for this transformation */
  semanticGuardsPassed?: string[];

  /** Summary of the patch transformation */
  patchSummary?: {
    kind: string;
    strategyId: string;
    file: string;
    transformations: string[];
  };

  /** Diff statistics for the patch */
  diffStats?: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
}
