/**
 * Data Access Governance PR Contract Tests
 * ==========================================
 *
 * Phase VIII: Validates governance-grade PR structure for data access changes.
 *
 * Contract:
 * - pr_requires_before_after_diff: observable state change for policies/bindings
 * - pr_requires_metadata: risk assessment, impacted datasets, justification
 * - pr_enforces_auto_merge_false: no automated merge for data access changes
 * - pr_validates_data_posture: data-specific validation rules
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';

// ============================================================================
// Types for Data Access Governance PRs
// ============================================================================

/**
 * Environment.
 */
type Environment = 'production' | 'staging' | 'development' | 'test';

/**
 * Dataset risk tier.
 */
type DatasetRiskTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Risk level.
 */
type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Change category for data access.
 */
type DataChangeCategory =
  | 'export_policy_change'
  | 'access_binding_create'
  | 'access_binding_delete'
  | 'dataset_classification_change'
  | 'approval_gate_change';

/**
 * Policy state snapshot.
 */
interface PolicyStateSnapshot {
  readonly policyId: string;
  readonly action: 'allow' | 'deny' | 'require_approval';
  readonly datasetRiskTier: DatasetRiskTier;
  readonly maxExportSizeBytes?: number;
  readonly requiresApproval: boolean;
}

/**
 * Binding state snapshot.
 */
interface BindingStateSnapshot {
  readonly bindingId: string;
  readonly datasetId: string;
  readonly principalId: string;
  readonly accessModes: readonly string[];
  readonly environment: Environment;
}

/**
 * Data diff entry.
 */
interface DataDiffEntry {
  readonly artifactId: string;
  readonly artifactType: 'export_policy' | 'access_binding' | 'classification';
  readonly changeCategory: DataChangeCategory;
  readonly before: PolicyStateSnapshot | BindingStateSnapshot | null;
  readonly after: PolicyStateSnapshot | BindingStateSnapshot | null;
}

/**
 * Data change scope.
 */
interface DataChangeScope {
  readonly environments: readonly Environment[];
  readonly datasetRiskTiers: readonly DatasetRiskTier[];
  readonly changeCategories: readonly DataChangeCategory[];
  readonly affectedDatasetCount: number;
  readonly affectedPolicyCount: number;
}

/**
 * Data risk assessment.
 */
interface DataRiskAssessment {
  readonly level: RiskLevel;
  readonly factors: readonly string[];
  readonly mitigations: readonly string[];
  readonly requiredApprovals: number;
  readonly requiresSecurityReview: boolean;
  readonly dataExfiltrationRisk: boolean;
}

/**
 * Governance PR metadata for data access.
 */
interface DataGovernancePRMetadata {
  readonly changeType: 'data_access';
  readonly requestedAt: string;
  readonly requestedBy: string;
  readonly riskAssessment: DataRiskAssessment;
  readonly changeScope: DataChangeScope;
  readonly justification: string;
  readonly ticketRef?: string;
  readonly rollbackPlan: string;
}

/**
 * Data access governance PR.
 */
interface DataGovernancePR {
  readonly prId: string;
  readonly title: string;
  readonly description: string;
  readonly createdAt: string;
  readonly autoMerge: false; // INVARIANT
  readonly requiresApproval: true; // INVARIANT
  readonly metadata: DataGovernancePRMetadata;
  readonly diff: readonly DataDiffEntry[];
  readonly validationErrors: readonly string[];
  readonly validationWarnings: readonly string[];
}

/**
 * Validation result.
 */
interface DataGovernancePRValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly riskLevel: RiskLevel;
}

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Compute opaque ID.
 */
function computeOpaqueId(input: string): string {
  return `sha256:${crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
}

/**
 * Compute risk level from scope.
 */
function computeRiskLevel(scope: DataChangeScope): RiskLevel {
  if (scope.environments.includes('production') && scope.datasetRiskTiers.includes('critical')) {
    return 'critical';
  }
  if (scope.environments.includes('production') && scope.datasetRiskTiers.includes('high')) {
    return 'high';
  }
  if (scope.environments.includes('production')) {
    return 'medium';
  }
  return 'low';
}

/**
 * Validate governance PR.
 */
function validateDataGovernancePR(pr: DataGovernancePR): DataGovernancePRValidationResult {
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
      errors.push(`Diff entry ${entry.artifactId} has neither before nor after state`);
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

    // Rollback plan required for high/critical risk
    const risk = pr.metadata.riskAssessment?.level;
    if ((risk === 'critical' || risk === 'high') && !pr.metadata.rollbackPlan) {
      errors.push('Rollback plan required for critical/high risk changes');
    }

    // Data exfiltration check
    if (pr.metadata.riskAssessment?.dataExfiltrationRisk) {
      warnings.push('Data exfiltration risk flagged - requires security review');
    }
  }

  const riskLevel = pr.metadata?.changeScope
    ? computeRiskLevel(pr.metadata.changeScope)
    : 'high';

  return { valid: errors.length === 0, errors, warnings, riskLevel };
}

/**
 * Create sample policy snapshot.
 */
function createSamplePolicySnapshot(options: Partial<PolicyStateSnapshot> = {}): PolicyStateSnapshot {
  return {
    policyId: options.policyId ?? computeOpaqueId('policy-sample'),
    action: options.action ?? 'require_approval',
    datasetRiskTier: options.datasetRiskTier ?? 'high',
    maxExportSizeBytes: options.maxExportSizeBytes,
    requiresApproval: options.requiresApproval ?? true,
  };
}

/**
 * Create sample binding snapshot.
 */
function createSampleBindingSnapshot(options: Partial<BindingStateSnapshot> = {}): BindingStateSnapshot {
  return {
    bindingId: options.bindingId ?? computeOpaqueId('binding-sample'),
    datasetId: options.datasetId ?? computeOpaqueId('dataset-sample'),
    principalId: options.principalId ?? computeOpaqueId('principal-sample'),
    accessModes: options.accessModes ?? ['read'],
    environment: options.environment ?? 'production',
  };
}

/**
 * Create sample diff entry.
 */
function createSampleDiffEntry(options: {
  category?: DataChangeCategory;
  hasBefore?: boolean;
  hasAfter?: boolean;
  artifactType?: 'export_policy' | 'access_binding' | 'classification';
} = {}): DataDiffEntry {
  const {
    category = 'export_policy_change',
    hasBefore = true,
    hasAfter = true,
    artifactType = 'export_policy',
  } = options;

  return {
    artifactId: computeOpaqueId('artifact-sample'),
    artifactType,
    changeCategory: category,
    before: hasBefore ? createSamplePolicySnapshot() : null,
    after: hasAfter ? createSamplePolicySnapshot({ action: 'deny' }) : null,
  };
}

/**
 * Create sample scope.
 */
function createSampleScope(options: Partial<DataChangeScope> = {}): DataChangeScope {
  return {
    environments: options.environments ?? ['production'],
    datasetRiskTiers: options.datasetRiskTiers ?? ['high'],
    changeCategories: options.changeCategories ?? ['export_policy_change'],
    affectedDatasetCount: options.affectedDatasetCount ?? 1,
    affectedPolicyCount: options.affectedPolicyCount ?? 1,
  };
}

/**
 * Create sample risk assessment.
 */
function createSampleRiskAssessment(scope: DataChangeScope): DataRiskAssessment {
  const level = computeRiskLevel(scope);
  const hasCritical = scope.datasetRiskTiers.includes('critical');

  return {
    level,
    factors: [`${scope.environments.join(', ')} environment(s)`, `${scope.affectedDatasetCount} dataset(s)`],
    mitigations: ['Staged rollout', 'Monitoring', 'Immediate rollback'],
    requiredApprovals: level === 'critical' ? 2 : 1,
    requiresSecurityReview: level === 'critical' || hasCritical,
    dataExfiltrationRisk: scope.changeCategories.includes('export_policy_change') && hasCritical,
  };
}

/**
 * Create sample metadata.
 */
function createSampleMetadata(options: {
  scope?: DataChangeScope;
  justification?: string;
  rollbackPlan?: string;
} = {}): DataGovernancePRMetadata {
  const scope = options.scope ?? createSampleScope();

  return {
    changeType: 'data_access',
    requestedAt: new Date().toISOString(),
    requestedBy: computeOpaqueId('user-sample'),
    riskAssessment: createSampleRiskAssessment(scope),
    changeScope: scope,
    justification: options.justification ?? 'Tightening export policy per security review',
    ticketRef: 'SEC-67890',
    rollbackPlan: options.rollbackPlan ?? 'Restore previous policy from backup',
  };
}

/**
 * Create sample governance PR.
 */
function createSampleGovernancePR(options: {
  autoMerge?: boolean;
  requiresApproval?: boolean;
  includeDiff?: boolean;
  includeMetadata?: boolean;
  scope?: DataChangeScope;
  justification?: string;
  rollbackPlan?: string;
} = {}): DataGovernancePR {
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
    prId: `PR-DATA-${Date.now()}`,
    title: 'Tighten export policy for high-risk datasets',
    description: 'Reducing export size limits and adding approval gates',
    createdAt: new Date().toISOString(),
    autoMerge: autoMerge as false,
    requiresApproval: requiresApproval as true,
    metadata: includeMetadata ? createSampleMetadata({ scope, justification, rollbackPlan }) : undefined as never,
    diff: includeDiff ? [createSampleDiffEntry()] : [],
    validationErrors: [],
    validationWarnings: [],
  };
}

// ============================================================================
// Contract: pr_requires_before_after_diff
// ============================================================================

describe('Data Access Governance PR Contract', () => {
  describe('pr_requires_before_after_diff', () => {
    it('should require diff for validation', () => {
      const pr = createSampleGovernancePR({ includeDiff: false });
      const result = validateDataGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some((e) => e.includes('Diff')));
    });

    it('should include before state for existing artifacts', () => {
      const entry = createSampleDiffEntry({ category: 'export_policy_change' });

      assert.ok(entry.before !== null);
    });

    it('should include after state for changes', () => {
      const entry = createSampleDiffEntry({ category: 'export_policy_change' });

      assert.ok(entry.after !== null);
    });

    it('should have null before for new bindings', () => {
      const entry = createSampleDiffEntry({
        category: 'access_binding_create',
        hasBefore: false,
        hasAfter: true,
        artifactType: 'access_binding',
      });

      assert.strictEqual(entry.before, null);
      assert.ok(entry.after !== null);
    });

    it('should have null after for deleted bindings', () => {
      const entry = createSampleDiffEntry({
        category: 'access_binding_delete',
        hasBefore: true,
        hasAfter: false,
        artifactType: 'access_binding',
      });

      assert.ok(entry.before !== null);
      assert.strictEqual(entry.after, null);
    });

    it('should fail if entry has neither before nor after', () => {
      const pr: DataGovernancePR = {
        ...createSampleGovernancePR(),
        diff: [{
          artifactId: 'sha256:x',
          artifactType: 'export_policy',
          changeCategory: 'export_policy_change',
          before: null,
          after: null,
        }],
      };
      const result = validateDataGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some((e) => e.includes('neither before nor after')));
    });
  });

  // ============================================================================
  // Contract: pr_requires_metadata
  // ============================================================================

  describe('pr_requires_metadata', () => {
    it('should require metadata', () => {
      const pr = createSampleGovernancePR({ includeMetadata: false });
      const result = validateDataGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some((e) => e.includes('Metadata')));
    });

    it('should require risk assessment', () => {
      const pr = createSampleGovernancePR();

      assert.ok(pr.metadata.riskAssessment !== undefined);
      assert.ok(['critical', 'high', 'medium', 'low'].includes(pr.metadata.riskAssessment.level));
    });

    it('should include data exfiltration risk flag', () => {
      const scope = createSampleScope({
        environments: ['production'],
        datasetRiskTiers: ['critical'],
        changeCategories: ['export_policy_change'],
      });
      const pr = createSampleGovernancePR({ scope });

      assert.ok(pr.metadata.riskAssessment.dataExfiltrationRisk !== undefined);
    });

    it('should require justification', () => {
      const pr = createSampleGovernancePR({ justification: 'short' });
      const result = validateDataGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some((e) => e.includes('Justification')));
    });

    it('should require rollback plan for high risk', () => {
      const scope = createSampleScope({ environments: ['production'], datasetRiskTiers: ['critical'] });
      const pr = createSampleGovernancePR({ scope, rollbackPlan: '' });

      const prWithoutRollback: DataGovernancePR = {
        ...pr,
        metadata: { ...pr.metadata, rollbackPlan: '' },
      };
      const result = validateDataGovernancePR(prWithoutRollback);

      assert.ok(!result.valid);
      assert.ok(result.errors.some((e) => e.includes('Rollback plan')));
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
      const result = validateDataGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some((e) => e.includes('autoMerge')));
    });

    it('should always require approval', () => {
      const pr = createSampleGovernancePR();

      assert.strictEqual(pr.requiresApproval, true);
    });

    it('should fail validation if requiresApproval=false', () => {
      const pr = createSampleGovernancePR({ requiresApproval: false });
      const result = validateDataGovernancePR(pr);

      assert.ok(!result.valid);
      assert.ok(result.errors.some((e) => e.includes('requiresApproval')));
    });
  });

  // ============================================================================
  // Contract: pr_validates_data_posture
  // ============================================================================

  describe('pr_validates_data_posture', () => {
    it('should compute risk from production + critical', () => {
      const scope = createSampleScope({
        environments: ['production'],
        datasetRiskTiers: ['critical'],
      });
      const risk = computeRiskLevel(scope);

      assert.strictEqual(risk, 'critical');
    });

    it('should compute risk from production + high', () => {
      const scope = createSampleScope({
        environments: ['production'],
        datasetRiskTiers: ['high'],
      });
      const risk = computeRiskLevel(scope);

      assert.strictEqual(risk, 'high');
    });

    it('should accept all change categories', () => {
      const categories: DataChangeCategory[] = [
        'export_policy_change',
        'access_binding_create',
        'access_binding_delete',
        'dataset_classification_change',
        'approval_gate_change',
      ];

      for (const cat of categories) {
        const entry = createSampleDiffEntry({ category: cat });
        assert.strictEqual(entry.changeCategory, cat);
      }
    });

    it('should use opaque artifact IDs', () => {
      const snapshot = createSamplePolicySnapshot();

      assert.ok(snapshot.policyId.startsWith('sha256:'));
    });

    it('should pass validation for well-formed PR', () => {
      const pr = createSampleGovernancePR();
      const result = validateDataGovernancePR(pr);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });
});
