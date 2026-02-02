/**
 * AuthZ Governance PR Contract Tests
 * ====================================
 *
 * Phase V: Validates PR governance for authorization policy changes.
 *
 * Contract:
 * - pr_requires_before_after_diff: semantic diff of policy state required
 * - pr_requires_metadata: author, justification, risk assessment required
 * - pr_enforces_auto_merge_false: autoMerge=false invariant for authz changes
 * - pr_validates_scope: only allowed artifact types and environments
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for AuthZ Governance PR
// ============================================================================

/**
 * PR status.
 */
type PRStatus = 'open' | 'review' | 'approved' | 'merged' | 'closed';

/**
 * Risk level.
 */
type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Artifact type.
 */
type ArtifactType = 'role' | 'permission' | 'binding' | 'abac_predicate' | 'default_permission';

/**
 * Change type.
 */
type ChangeType = 'add' | 'modify' | 'delete';

/**
 * Diff entry.
 */
interface DiffEntry {
  readonly artifactType: ArtifactType;
  readonly artifactId: string;
  readonly changeType: ChangeType;
  readonly before: Record<string, unknown> | null;
  readonly after: Record<string, unknown> | null;
  readonly semanticChanges: readonly string[];
}

/**
 * Policy diff (before/after).
 */
interface PolicyDiff {
  readonly diffId: string;
  readonly generatedAt: string;
  readonly environment: string;
  readonly entries: readonly DiffEntry[];
  readonly summary: {
    readonly additions: number;
    readonly modifications: number;
    readonly deletions: number;
    readonly affectedArtifacts: number;
  };
  readonly semanticHash: {
    readonly before: string;
    readonly after: string;
  };
}

/**
 * PR metadata.
 */
interface PRMetadata {
  readonly author: string;
  readonly authorId: string;
  readonly justification: string;
  readonly ticketRef: string | null;
  readonly riskAssessment: RiskAssessment;
  readonly approvers: readonly string[];
  readonly reviewedAt: string | null;
  readonly environment: string;
  readonly changeScope: readonly ArtifactType[];
}

/**
 * Risk assessment.
 */
interface RiskAssessment {
  readonly level: RiskLevel;
  readonly factors: readonly string[];
  readonly mitigations: readonly string[];
  readonly reviewRequired: boolean;
}

/**
 * AuthZ PR (policy change request).
 */
interface AuthZPR {
  readonly prId: string;
  readonly createdAt: string;
  readonly status: PRStatus;
  readonly title: string;
  readonly description: string;
  readonly diff: PolicyDiff;
  readonly metadata: PRMetadata;
  readonly autoMerge: false; // INVARIANT: always false
  readonly requiresApproval: true; // INVARIANT: always true
  readonly checks: readonly PRCheck[];
}

/**
 * PR check.
 */
interface PRCheck {
  readonly checkId: string;
  readonly name: string;
  readonly status: 'pending' | 'passed' | 'failed';
  readonly required: boolean;
  readonly message: string | null;
}

/**
 * PR validation result.
 */
interface PRValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly blockers: readonly string[];
}

/**
 * Allowed environment.
 */
const ALLOWED_ENVIRONMENTS = ['development', 'staging', 'production'] as const;

/**
 * Allowed artifact types for PR scope.
 */
const ALLOWED_ARTIFACT_TYPES: readonly ArtifactType[] = [
  'role',
  'permission',
  'binding',
  'abac_predicate',
  'default_permission',
];

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Validate PR has before/after diff.
 */
function validateDiff(diff: PolicyDiff | null): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!diff) {
    errors.push('PR must include policy diff');
    return { valid: false, errors };
  }

  if (!diff.semanticHash.before) {
    errors.push('Diff must include before hash');
  }

  if (!diff.semanticHash.after) {
    errors.push('Diff must include after hash');
  }

  if (diff.entries.length === 0) {
    errors.push('Diff must contain at least one entry');
  }

  for (const entry of diff.entries) {
    if (entry.changeType === 'add' && entry.before !== null) {
      errors.push(`Add entry ${entry.artifactId} should have null before`);
    }
    if (entry.changeType === 'delete' && entry.after !== null) {
      errors.push(`Delete entry ${entry.artifactId} should have null after`);
    }
    if (entry.changeType === 'modify' && (!entry.before || !entry.after)) {
      errors.push(`Modify entry ${entry.artifactId} must have both before and after`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate PR metadata.
 */
function validateMetadata(metadata: PRMetadata | null): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!metadata) {
    errors.push('PR must include metadata');
    return { valid: false, errors };
  }

  if (!metadata.author || metadata.author.trim() === '') {
    errors.push('Metadata must include author');
  }

  if (!metadata.authorId || metadata.authorId.trim() === '') {
    errors.push('Metadata must include authorId');
  }

  if (!metadata.justification || metadata.justification.trim() === '') {
    errors.push('Metadata must include justification');
  }

  if (!metadata.riskAssessment || !metadata.riskAssessment.level) {
    errors.push('Metadata must include risk assessment');
  } else {
    if (!metadata.riskAssessment.factors || metadata.riskAssessment.factors.length === 0) {
      errors.push('Risk assessment must include at least one factor');
    }
  }

  if (
    !ALLOWED_ENVIRONMENTS.includes(metadata.environment as (typeof ALLOWED_ENVIRONMENTS)[number])
  ) {
    errors.push(`Environment ${metadata.environment} not in allowed list`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate PR scope.
 */
function validateScope(pr: AuthZPR): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Early return if metadata or diff is null
  if (!pr.metadata || !pr.diff) {
    return { valid: true, errors: [] }; // Handled by other validators
  }

  for (const artifactType of pr.metadata.changeScope) {
    if (!ALLOWED_ARTIFACT_TYPES.includes(artifactType)) {
      errors.push(`Artifact type ${artifactType} not in allowed list`);
    }
  }

  // Diff entries must match declared scope
  for (const entry of pr.diff.entries) {
    if (!pr.metadata.changeScope.includes(entry.artifactType)) {
      errors.push(
        `Diff entry ${entry.artifactId} type ${entry.artifactType} not in declared scope`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate full PR.
 */
function validatePR(pr: AuthZPR): PRValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];

  // INVARIANT: autoMerge must be false
  if (pr.autoMerge !== false) {
    blockers.push('autoMerge must be false for authorization PRs');
  }

  // INVARIANT: requiresApproval must be true
  if (pr.requiresApproval !== true) {
    blockers.push('requiresApproval must be true for authorization PRs');
  }

  // Validate diff
  const diffResult = validateDiff(pr.diff);
  errors.push(...diffResult.errors);

  // Validate metadata
  const metadataResult = validateMetadata(pr.metadata);
  errors.push(...metadataResult.errors);

  // Validate scope
  const scopeResult = validateScope(pr);
  errors.push(...scopeResult.errors);

  // Check required checks
  for (const check of pr.checks.filter(c => c.required)) {
    if (check.status === 'failed') {
      blockers.push(`Required check ${check.name} failed: ${check.message}`);
    }
    if (check.status === 'pending') {
      warnings.push(`Required check ${check.name} pending`);
    }
  }

  // High/critical risk requires approvers
  if (
    pr.metadata &&
    pr.metadata.riskAssessment &&
    (pr.metadata.riskAssessment.level === 'critical' || pr.metadata.riskAssessment.level === 'high')
  ) {
    if (pr.metadata.approvers.length === 0) {
      blockers.push('High/critical risk PRs require at least one approver');
    }
  }

  return {
    valid: errors.length === 0 && blockers.length === 0,
    errors,
    warnings,
    blockers,
  };
}

/**
 * Create sample diff.
 */
function createSampleDiff(
  options: {
    entryCount?: number;
    includeHashes?: boolean;
    changeTypes?: ChangeType[];
  } = {}
): PolicyDiff {
  const { entryCount = 2, includeHashes = true, changeTypes = ['add', 'modify'] } = options;

  const entries: DiffEntry[] = Array.from({ length: entryCount }, (_, i) => {
    const changeType = changeTypes[i % changeTypes.length];
    return {
      artifactType: 'role' as ArtifactType,
      artifactId: `ROLE-${i + 1}`,
      changeType,
      before: changeType === 'add' ? null : { name: `OldRole${i}` },
      after: changeType === 'delete' ? null : { name: `NewRole${i}` },
      semanticChanges: changeType === 'modify' ? ['name changed'] : [],
    };
  });

  return {
    diffId: `DIFF-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    environment: 'production',
    entries,
    summary: {
      additions: entries.filter(e => e.changeType === 'add').length,
      modifications: entries.filter(e => e.changeType === 'modify').length,
      deletions: entries.filter(e => e.changeType === 'delete').length,
      affectedArtifacts: entries.length,
    },
    semanticHash: {
      before: includeHashes ? 'sha256:before-hash' : '',
      after: includeHashes ? 'sha256:after-hash' : '',
    },
  };
}

/**
 * Create sample metadata.
 */
function createSampleMetadata(
  options: {
    includeAuthor?: boolean;
    includeJustification?: boolean;
    includeRiskAssessment?: boolean;
    riskLevel?: RiskLevel;
    approvers?: string[];
  } = {}
): PRMetadata {
  const {
    includeAuthor = true,
    includeJustification = true,
    includeRiskAssessment = true,
    riskLevel = 'medium',
    approvers = [],
  } = options;

  return {
    author: includeAuthor ? 'security-team' : '',
    authorId: includeAuthor ? 'sha256:author-opaque-id' : '',
    justification: includeJustification ? 'Least privilege remediation per audit finding' : '',
    ticketRef: 'JIRA-1234',
    riskAssessment: includeRiskAssessment
      ? {
          level: riskLevel,
          factors: ['Modifies admin role', 'Production environment'],
          mitigations: ['Staged rollout', 'Rollback plan documented'],
          reviewRequired: riskLevel === 'high' || riskLevel === 'critical',
        }
      : ({} as RiskAssessment),
    approvers,
    reviewedAt: approvers.length > 0 ? new Date().toISOString() : null,
    environment: 'production',
    changeScope: ['role', 'permission'],
  };
}

/**
 * Create sample PR.
 */
function createSamplePR(
  options: {
    autoMerge?: boolean;
    requiresApproval?: boolean;
    includeDiff?: boolean;
    includeMetadata?: boolean;
    metadataOptions?: Parameters<typeof createSampleMetadata>[0];
    diffOptions?: Parameters<typeof createSampleDiff>[0];
    checks?: PRCheck[];
  } = {}
): AuthZPR {
  const {
    autoMerge = false,
    requiresApproval = true,
    includeDiff = true,
    includeMetadata = true,
    metadataOptions = {},
    diffOptions = {},
    checks = [
      { checkId: 'CHK-1', name: 'policy-lint', status: 'passed', required: true, message: null },
      { checkId: 'CHK-2', name: 'drift-check', status: 'passed', required: true, message: null },
    ],
  } = options;

  return {
    prId: `PR-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'open',
    title: 'Update admin role permissions',
    description: 'Remove unused write permission from admin role',
    diff: includeDiff ? createSampleDiff(diffOptions) : (null as unknown as PolicyDiff),
    metadata: includeMetadata
      ? createSampleMetadata(metadataOptions)
      : (null as unknown as PRMetadata),
    autoMerge: autoMerge as false,
    requiresApproval: requiresApproval as true,
    checks,
  };
}

// ============================================================================
// Contract: pr_requires_before_after_diff
// ============================================================================

describe('AuthZ Governance PR Contract', () => {
  describe('pr_requires_before_after_diff', () => {
    it('should require diff', () => {
      const pr = createSamplePR({ includeDiff: false });
      const result = validatePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('diff')));
    });

    it('should require before hash', () => {
      const pr = createSamplePR({
        diffOptions: { includeHashes: false },
      });
      // Manually clear before hash
      (pr.diff.semanticHash as { before: string }).before = '';
      const result = validateDiff(pr.diff);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('before hash')));
    });

    it('should require after hash', () => {
      const pr = createSamplePR();
      (pr.diff.semanticHash as { after: string }).after = '';
      const result = validateDiff(pr.diff);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('after hash')));
    });

    it('should require at least one diff entry', () => {
      const pr = createSamplePR({ diffOptions: { entryCount: 0 } });
      const result = validateDiff(pr.diff);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('at least one entry')));
    });

    it('should validate add entry has null before', () => {
      const pr = createSamplePR({ diffOptions: { changeTypes: ['add'] } });

      for (const entry of pr.diff.entries) {
        if (entry.changeType === 'add') {
          assert.strictEqual(entry.before, null);
        }
      }
    });

    it('should validate delete entry has null after', () => {
      const pr = createSamplePR({ diffOptions: { changeTypes: ['delete'] } });

      for (const entry of pr.diff.entries) {
        if (entry.changeType === 'delete') {
          assert.strictEqual(entry.after, null);
        }
      }
    });
  });

  // ============================================================================
  // Contract: pr_requires_metadata
  // ============================================================================

  describe('pr_requires_metadata', () => {
    it('should require metadata', () => {
      const pr = createSamplePR({ includeMetadata: false });
      const result = validatePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('metadata')));
    });

    it('should require author', () => {
      const pr = createSamplePR({ metadataOptions: { includeAuthor: false } });
      const result = validateMetadata(pr.metadata);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('author')));
    });

    it('should require justification', () => {
      const pr = createSamplePR({ metadataOptions: { includeJustification: false } });
      const result = validateMetadata(pr.metadata);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('justification')));
    });

    it('should require risk assessment', () => {
      const pr = createSamplePR({ metadataOptions: { includeRiskAssessment: false } });
      const result = validateMetadata(pr.metadata);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('risk assessment')));
    });

    it('should validate environment is allowed', () => {
      const pr = createSamplePR();
      assert.ok(
        ALLOWED_ENVIRONMENTS.includes(
          pr.metadata.environment as (typeof ALLOWED_ENVIRONMENTS)[number]
        )
      );
    });
  });

  // ============================================================================
  // Contract: pr_enforces_auto_merge_false
  // ============================================================================

  describe('pr_enforces_auto_merge_false', () => {
    it('should always have autoMerge=false', () => {
      const pr = createSamplePR();

      assert.strictEqual(pr.autoMerge, false);
    });

    it('should block if autoMerge=true', () => {
      const pr = createSamplePR({ autoMerge: true });
      const result = validatePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.blockers.some(b => b.includes('autoMerge must be false')));
    });

    it('should always require approval', () => {
      const pr = createSamplePR();

      assert.strictEqual(pr.requiresApproval, true);
    });

    it('should block if requiresApproval=false', () => {
      const pr = createSamplePR({ requiresApproval: false });
      const result = validatePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.blockers.some(b => b.includes('requiresApproval must be true')));
    });

    it('should require approvers for high-risk', () => {
      const pr = createSamplePR({
        metadataOptions: { riskLevel: 'high', approvers: [] },
      });
      const result = validatePR(pr);

      assert.ok(result.blockers.some(b => b.includes('require at least one approver')));
    });
  });

  // ============================================================================
  // Contract: pr_validates_scope
  // ============================================================================

  describe('pr_validates_scope', () => {
    it('should only allow valid artifact types', () => {
      const pr = createSamplePR();

      for (const type of pr.metadata.changeScope) {
        assert.ok(ALLOWED_ARTIFACT_TYPES.includes(type));
      }
    });

    it('should validate diff entries match declared scope', () => {
      const pr = createSamplePR();
      const result = validateScope(pr);

      assert.ok(result.valid);
    });

    it('should fail when diff entry not in scope', () => {
      const pr = createSamplePR();
      // Manually add entry not in scope
      (pr.diff.entries as DiffEntry[]).push({
        artifactType: 'binding',
        artifactId: 'BND-1',
        changeType: 'add',
        before: null,
        after: { principalType: 'group' },
        semanticChanges: [],
      });
      const result = validateScope(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('not in declared scope')));
    });

    it('should block on failed required checks', () => {
      const pr = createSamplePR({
        checks: [
          {
            checkId: 'CHK-1',
            name: 'policy-lint',
            status: 'failed',
            required: true,
            message: 'Syntax error',
          },
        ],
      });
      const result = validatePR(pr);

      assert.ok(result.blockers.some(b => b.includes('policy-lint failed')));
    });

    it('should warn on pending required checks', () => {
      const pr = createSamplePR({
        checks: [
          {
            checkId: 'CHK-1',
            name: 'drift-check',
            status: 'pending',
            required: true,
            message: null,
          },
        ],
      });
      const result = validatePR(pr);

      assert.ok(result.warnings.some(w => w.includes('drift-check pending')));
    });
  });
});
