/**
 * Secrets Governance PR Contract Tests
 * =====================================
 *
 * Phase VI: Validates governance-grade PR structure for secrets changes.
 *
 * Contract:
 * - pr_requires_before_after_diff: observable state change for secrets
 * - pr_requires_metadata: risk assessment, impacted secrets, environment tags
 * - pr_enforces_auto_merge_false: no automated merge for secrets changes
 * - pr_validates_secrets_posture: secrets-specific validation rules
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Secrets Governance PRs
// ============================================================================

/**
 * Secret class classification.
 */
type SecretClass = 'critical' | 'high' | 'medium' | 'low';

/**
 * Environment type.
 */
type Environment = 'production' | 'staging' | 'development' | 'test';

/**
 * Change category for secrets.
 */
type SecretsChangeCategory =
  | 'rotation'
  | 'access_grant'
  | 'access_revoke'
  | 'policy_update'
  | 'secret_create'
  | 'secret_delete'
  | 'scope_change';

/**
 * Risk level.
 */
type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Secret state snapshot.
 */
interface SecretStateSnapshot {
  readonly secretId: string; // Opaque sha256:
  readonly secretClass: SecretClass;
  readonly environment: Environment;
  readonly lastRotated: string | null;
  readonly accessorCount: number;
  readonly hasRotationPolicy: boolean;
  readonly policyMaxAgeDays: number | null;
}

/**
 * Secret diff entry.
 */
interface SecretDiffEntry {
  readonly secretId: string;
  readonly changeCategory: SecretsChangeCategory;
  readonly before: SecretStateSnapshot | null;
  readonly after: SecretStateSnapshot | null;
  readonly accessChange?: {
    readonly added: readonly string[];
    readonly removed: readonly string[];
  };
}

/**
 * Secret change scope.
 */
interface SecretChangeScope {
  readonly environments: readonly Environment[];
  readonly secretClasses: readonly SecretClass[];
  readonly changeCategories: readonly SecretsChangeCategory[];
  readonly affectedSecretCount: number;
  readonly affectedAccessorCount: number;
}

/**
 * Risk assessment for secrets changes.
 */
interface SecretsRiskAssessment {
  readonly level: RiskLevel;
  readonly factors: readonly string[];
  readonly mitigations: readonly string[];
  readonly requiredApprovals: number;
  readonly requiresSecurityReview: boolean;
  readonly productionImpact: boolean;
}

/**
 * Secrets governance PR metadata.
 */
interface SecretsGovernancePRMetadata {
  readonly changeType: 'secrets_posture';
  readonly requestedAt: string;
  readonly requestedBy: string; // Opaque
  readonly riskAssessment: SecretsRiskAssessment;
  readonly changeScope: SecretChangeScope;
  readonly justification: string;
  readonly ticketRef?: string;
  readonly rollbackPlan: string;
}

/**
 * Secrets governance PR.
 */
interface SecretsGovernancePR {
  readonly prId: string;
  readonly title: string;
  readonly description: string;
  readonly createdAt: string;
  readonly autoMerge: false; // INVARIANT
  readonly requiresApproval: true; // INVARIANT
  readonly metadata: SecretsGovernancePRMetadata;
  readonly diff: readonly SecretDiffEntry[];
  readonly validationErrors: readonly string[];
  readonly validationWarnings: readonly string[];
}

/**
 * PR validation result.
 */
interface SecretsGovernancePRValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly riskLevel: RiskLevel;
}

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Compute risk level from scope.
 */
function computeRiskLevel(scope: SecretChangeScope): RiskLevel {
  if (scope.environments.includes('production') && scope.secretClasses.includes('critical')) {
    return 'critical';
  }
  if (scope.environments.includes('production')) {
    return 'high';
  }
  if (scope.secretClasses.includes('critical')) {
    return 'high';
  }
  return 'medium';
}

/**
 * Validate PR structure.
 */
function validateSecretsGovernancePR(pr: SecretsGovernancePR): SecretsGovernancePRValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // INVARIANT: autoMerge must be false
  if (pr.autoMerge !== false) {
    errors.push('autoMerge must be false');
  }

  // INVARIANT: requiresApproval must be true
  if (pr.requiresApproval !== true) {
    errors.push('requiresApproval must be true');
  }

  // Diff required
  if (!pr.diff || pr.diff.length === 0) {
    errors.push('Diff is required - must show before/after state');
  }

  // Each diff entry must have before or after
  for (const entry of pr.diff) {
    if (!entry.before && !entry.after) {
      errors.push(`Diff entry ${entry.secretId} has neither before nor after state`);
    }
  }

  // Metadata required
  if (!pr.metadata) {
    errors.push('Metadata is required');
  } else {
    // Risk assessment required
    if (!pr.metadata.riskAssessment) {
      errors.push('Risk assessment is required');
    }

    // Change scope required
    if (!pr.metadata.changeScope) {
      errors.push('Change scope is required');
    }

    // Justification required
    if (!pr.metadata.justification || pr.metadata.justification.length < 10) {
      errors.push('Justification is required (min 10 chars)');
    }

    // Rollback plan required for critical/high risk
    const risk = pr.metadata.riskAssessment?.level;
    if ((risk === 'critical' || risk === 'high') && !pr.metadata.rollbackPlan) {
      errors.push('Rollback plan required for critical/high risk changes');
    }
  }

  // Compute risk for response
  const riskLevel = pr.metadata?.changeScope ? computeRiskLevel(pr.metadata.changeScope) : 'high';

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskLevel,
  };
}

/**
 * Create sample snapshot.
 */
function createSampleSnapshot(options: Partial<SecretStateSnapshot> = {}): SecretStateSnapshot {
  return {
    secretId: options.secretId ?? 'sha256:secret-abc123',
    secretClass: options.secretClass ?? 'high',
    environment: options.environment ?? 'production',
    lastRotated: options.lastRotated ?? new Date().toISOString(),
    accessorCount: options.accessorCount ?? 3,
    hasRotationPolicy: options.hasRotationPolicy ?? true,
    policyMaxAgeDays: options.policyMaxAgeDays ?? 90,
  };
}

/**
 * Create sample diff entry.
 */
function createSampleDiffEntry(
  options: {
    category?: SecretsChangeCategory;
    hasBefore?: boolean;
    hasAfter?: boolean;
  } = {}
): SecretDiffEntry {
  const { category = 'rotation', hasBefore = true, hasAfter = true } = options;

  return {
    secretId: 'sha256:secret-abc123',
    changeCategory: category,
    before: hasBefore ? createSampleSnapshot() : null,
    after: hasAfter ? createSampleSnapshot({ lastRotated: new Date().toISOString() }) : null,
  };
}

/**
 * Create sample scope.
 */
function createSampleScope(options: Partial<SecretChangeScope> = {}): SecretChangeScope {
  return {
    environments: options.environments ?? ['production'],
    secretClasses: options.secretClasses ?? ['high'],
    changeCategories: options.changeCategories ?? ['rotation'],
    affectedSecretCount: options.affectedSecretCount ?? 1,
    affectedAccessorCount: options.affectedAccessorCount ?? 3,
  };
}

/**
 * Create sample risk assessment.
 */
function createSampleRiskAssessment(scope: SecretChangeScope): SecretsRiskAssessment {
  const level = computeRiskLevel(scope);

  return {
    level,
    factors: [
      `${scope.environments.join(', ')} environment(s)`,
      `${scope.affectedSecretCount} secret(s)`,
    ],
    mitigations: ['Staged rollout', 'Monitoring alerts'],
    requiredApprovals: level === 'critical' ? 2 : 1,
    requiresSecurityReview: level === 'critical' || level === 'high',
    productionImpact: scope.environments.includes('production'),
  };
}

/**
 * Create sample metadata.
 */
function createSampleMetadata(
  options: {
    scope?: SecretChangeScope;
    justification?: string;
    rollbackPlan?: string;
  } = {}
): SecretsGovernancePRMetadata {
  const scope = options.scope ?? createSampleScope();

  return {
    changeType: 'secrets_posture',
    requestedAt: new Date().toISOString(),
    requestedBy: 'sha256:user-abc123',
    riskAssessment: createSampleRiskAssessment(scope),
    changeScope: scope,
    justification: options.justification ?? 'Scheduled rotation per security policy',
    ticketRef: 'SEC-12345',
    rollbackPlan: options.rollbackPlan ?? 'Restore previous secret version from vault',
  };
}

/**
 * Create sample governance PR.
 */
function createSampleGovernancePR(
  options: {
    autoMerge?: boolean;
    requiresApproval?: boolean;
    includeDiff?: boolean;
    includeMetadata?: boolean;
    scope?: SecretChangeScope;
    justification?: string;
    rollbackPlan?: string;
  } = {}
): SecretsGovernancePR {
  const {
    autoMerge = false,
    requiresApproval = true,
    includeDiff = true,
    includeMetadata = true,
    scope,
    justification,
    rollbackPlan,
  } = options;

  return {
    prId: `PR-SECRETS-${Date.now()}`,
    title: 'Secret rotation: production credentials',
    description: 'Rotating production database credentials per 90-day policy',
    createdAt: new Date().toISOString(),
    autoMerge: autoMerge as false,
    requiresApproval: requiresApproval as true,
    metadata: includeMetadata
      ? createSampleMetadata({ scope, justification, rollbackPlan })
      : (undefined as never),
    diff: includeDiff ? [createSampleDiffEntry()] : [],
    validationErrors: [],
    validationWarnings: [],
  };
}

// ============================================================================
// Contract: pr_requires_before_after_diff
// ============================================================================

describe('Secrets Governance PR Contract', () => {
  describe('pr_requires_before_after_diff', () => {
    it('should require diff for validation', () => {
      const pr = createSampleGovernancePR({ includeDiff: false });
      const result = validateSecretsGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('Diff')));
    });

    it('should include before state for existing secrets', () => {
      const entry = createSampleDiffEntry({ category: 'rotation' });

      assert.ok(entry.before !== null);
      assert.ok(entry.before?.secretId.startsWith('sha256:'));
    });

    it('should include after state for changes', () => {
      const entry = createSampleDiffEntry({ category: 'rotation' });

      assert.ok(entry.after !== null);
    });

    it('should have null before for new secrets', () => {
      const entry = createSampleDiffEntry({
        category: 'secret_create',
        hasBefore: false,
        hasAfter: true,
      });

      assert.strictEqual(entry.before, null);
      assert.ok(entry.after !== null);
    });

    it('should have null after for deleted secrets', () => {
      const entry = createSampleDiffEntry({
        category: 'secret_delete',
        hasBefore: true,
        hasAfter: false,
      });

      assert.ok(entry.before !== null);
      assert.strictEqual(entry.after, null);
    });

    it('should fail if entry has neither before nor after', () => {
      const pr: SecretsGovernancePR = {
        ...createSampleGovernancePR(),
        diff: [{ secretId: 'sha256:x', changeCategory: 'rotation', before: null, after: null }],
      };
      const result = validateSecretsGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('neither before nor after')));
    });
  });

  // ============================================================================
  // Contract: pr_requires_metadata
  // ============================================================================

  describe('pr_requires_metadata', () => {
    it('should require metadata', () => {
      const pr = createSampleGovernancePR({ includeMetadata: false });
      const result = validateSecretsGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('Metadata')));
    });

    it('should require risk assessment', () => {
      const pr = createSampleGovernancePR();

      assert.ok(pr.metadata.riskAssessment !== undefined);
      assert.ok(['critical', 'high', 'medium', 'low'].includes(pr.metadata.riskAssessment.level));
    });

    it('should require change scope', () => {
      const pr = createSampleGovernancePR();

      assert.ok(pr.metadata.changeScope !== undefined);
      assert.ok(pr.metadata.changeScope.environments.length > 0);
    });

    it('should require justification', () => {
      const pr = createSampleGovernancePR({ justification: 'short' });
      const result = validateSecretsGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('Justification')));
    });

    it('should require rollback plan for high risk', () => {
      const scope = createSampleScope({
        environments: ['production'],
        secretClasses: ['critical'],
      });
      const pr = createSampleGovernancePR({ scope, rollbackPlan: '' });

      // Override to remove rollback plan
      const prWithoutRollback: SecretsGovernancePR = {
        ...pr,
        metadata: { ...pr.metadata, rollbackPlan: '' },
      };
      const result = validateSecretsGovernancePR(prWithoutRollback);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('Rollback plan')));
    });
  });

  // ============================================================================
  // Contract: pr_enforces_auto_merge_false
  // ============================================================================

  describe('pr_enforces_auto_merge_false', () => {
    it('should always have autoMerge=false', () => {
      const pr = createSampleGovernancePR();

      assert.strictEqual(pr.autoMerge, false);
    });

    it('should fail validation if autoMerge=true', () => {
      const pr = createSampleGovernancePR({ autoMerge: true });
      const result = validateSecretsGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('autoMerge')));
    });

    it('should always require approval', () => {
      const pr = createSampleGovernancePR();

      assert.strictEqual(pr.requiresApproval, true);
    });

    it('should fail validation if requiresApproval=false', () => {
      const pr = createSampleGovernancePR({ requiresApproval: false });
      const result = validateSecretsGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('requiresApproval')));
    });
  });

  // ============================================================================
  // Contract: pr_validates_secrets_posture
  // ============================================================================

  describe('pr_validates_secrets_posture', () => {
    it('should compute risk from production + critical', () => {
      const scope = createSampleScope({
        environments: ['production'],
        secretClasses: ['critical'],
      });
      const risk = computeRiskLevel(scope);

      assert.strictEqual(risk, 'critical');
    });

    it('should compute risk from production alone', () => {
      const scope = createSampleScope({
        environments: ['production'],
        secretClasses: ['medium'],
      });
      const risk = computeRiskLevel(scope);

      assert.strictEqual(risk, 'high');
    });

    it('should accept all change categories', () => {
      const categories: SecretsChangeCategory[] = [
        'rotation',
        'access_grant',
        'access_revoke',
        'policy_update',
        'secret_create',
        'secret_delete',
        'scope_change',
      ];

      for (const cat of categories) {
        const entry = createSampleDiffEntry({ category: cat });
        assert.strictEqual(entry.changeCategory, cat);
      }
    });

    it('should use opaque secret IDs', () => {
      const snapshot = createSampleSnapshot();

      assert.ok(snapshot.secretId.startsWith('sha256:'));
    });

    it('should pass validation for well-formed PR', () => {
      const pr = createSampleGovernancePR();
      const result = validateSecretsGovernancePR(pr);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });
});
