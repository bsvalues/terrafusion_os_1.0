/**
 * Data Export Controls Contract Tests
 * =====================================
 *
 * Phase VIII: Validates export policy enforcement and drift detection.
 *
 * Contract:
 * - export_policy_enforces_allow_deny: policies by dataset tier and principal type
 * - export_policy_detects_drift: catches policy relaxations, new endpoints
 * - export_policy_validates_approval: approval requirements by risk tier
 * - export_policy_enforces_size_limits: bounded export sizes
 * - export_policy_is_pii_clean: opaque IDs, no raw identifiers
 */

import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Export Controls
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
 * Principal type.
 */
type PrincipalType = 'user' | 'service' | 'job' | 'bi_tool' | 'api_client';

/**
 * Export action.
 */
type ExportAction = 'allow' | 'deny' | 'require_approval';

/**
 * Export path type.
 */
type ExportPathType = 'download' | 'report' | 'api_export' | 'etl_pipeline' | 'backup';

/**
 * Drift type for export policy.
 */
type ExportPolicyDriftType =
  | 'policy_relaxed'
  | 'new_export_endpoint'
  | 'approval_removed'
  | 'size_limit_increased'
  | 'principal_type_added';

/**
 * Export policy rule.
 */
interface ExportPolicyRule {
  readonly ruleId: string; // opaque sha256:
  readonly datasetRiskTier: DatasetRiskTier;
  readonly principalType: PrincipalType;
  readonly environment: Environment;
  readonly action: ExportAction;
  readonly maxExportSizeBytes?: number;
  readonly requiresApproval: boolean;
  readonly approverRoles?: readonly string[];
  readonly enabled: boolean;
}

/**
 * Export request.
 */
interface ExportRequest {
  readonly requestId: string; // opaque sha256:
  readonly datasetId: string; // opaque sha256:
  readonly datasetRiskTier: DatasetRiskTier;
  readonly principalId: string; // opaque sha256:
  readonly principalType: PrincipalType;
  readonly environment: Environment;
  readonly exportPathType: ExportPathType;
  readonly requestedSizeBytes: number;
  readonly timestamp: string;
}

/**
 * Export evaluation result.
 */
interface ExportEvaluationResult {
  readonly requestId: string;
  readonly action: ExportAction;
  readonly matchedRuleId: string | null;
  readonly reason: string;
  readonly requiresApproval: boolean;
  readonly sizeLimitExceeded: boolean;
}

/**
 * Export policy drift event.
 */
interface ExportPolicyDriftEvent {
  readonly driftId: string; // opaque sha256:
  readonly driftType: ExportPolicyDriftType;
  readonly ruleId: string; // opaque sha256:
  readonly environment: Environment;
  readonly timestamp: string;
  readonly before: Partial<ExportPolicyRule>;
  readonly after: Partial<ExportPolicyRule>;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Export policy store.
 */
interface ExportPolicyStore {
  getRules: (environment?: Environment) => readonly ExportPolicyRule[];
  evaluateRequest: (
    request: ExportRequest,
    rules: readonly ExportPolicyRule[]
  ) => ExportEvaluationResult;
  detectDrift: (
    before: readonly ExportPolicyRule[],
    after: readonly ExportPolicyRule[]
  ) => readonly ExportPolicyDriftEvent[];
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
 * Create sample policy rule.
 */
function createSampleRule(options: Partial<ExportPolicyRule> = {}): ExportPolicyRule {
  return {
    ruleId: options.ruleId ?? computeOpaqueId(`rule-${Date.now()}`),
    datasetRiskTier: options.datasetRiskTier ?? 'high',
    principalType: options.principalType ?? 'service',
    environment: options.environment ?? 'production',
    action: options.action ?? 'require_approval',
    maxExportSizeBytes: options.maxExportSizeBytes,
    requiresApproval: options.requiresApproval ?? true,
    approverRoles: options.approverRoles ?? ['data_owner', 'security'],
    enabled: options.enabled ?? true,
  };
}

/**
 * Create sample export request.
 */
function createSampleRequest(options: Partial<ExportRequest> = {}): ExportRequest {
  return {
    requestId: options.requestId ?? computeOpaqueId(`request-${Date.now()}`),
    datasetId: options.datasetId ?? computeOpaqueId('dataset-sample'),
    datasetRiskTier: options.datasetRiskTier ?? 'high',
    principalId: options.principalId ?? computeOpaqueId('principal-sample'),
    principalType: options.principalType ?? 'service',
    environment: options.environment ?? 'production',
    exportPathType: options.exportPathType ?? 'api_export',
    requestedSizeBytes: options.requestedSizeBytes ?? 1000000,
    timestamp: options.timestamp ?? new Date().toISOString(),
  };
}

/**
 * Create export policy store.
 */
function createExportPolicyStore(): ExportPolicyStore {
  return {
    getRules(environment) {
      // Mock implementation
      const rules = [
        createSampleRule({ datasetRiskTier: 'critical', action: 'deny', requiresApproval: false }),
        createSampleRule({ datasetRiskTier: 'high', action: 'require_approval' }),
        createSampleRule({ datasetRiskTier: 'medium', action: 'allow', requiresApproval: false }),
        createSampleRule({ datasetRiskTier: 'low', action: 'allow', requiresApproval: false }),
      ];

      if (environment) {
        return rules.filter(r => r.environment === environment);
      }
      return rules;
    },

    evaluateRequest(request, rules) {
      // Find matching rule
      const matchingRule = rules.find(
        r =>
          r.enabled &&
          r.datasetRiskTier === request.datasetRiskTier &&
          r.principalType === request.principalType &&
          r.environment === request.environment
      );

      if (!matchingRule) {
        // Default deny for unmatched
        return {
          requestId: request.requestId,
          action: 'deny',
          matchedRuleId: null,
          reason: 'No matching policy rule',
          requiresApproval: false,
          sizeLimitExceeded: false,
        };
      }

      const sizeLimitExceeded = matchingRule.maxExportSizeBytes
        ? request.requestedSizeBytes > matchingRule.maxExportSizeBytes
        : false;

      return {
        requestId: request.requestId,
        action: sizeLimitExceeded ? 'deny' : matchingRule.action,
        matchedRuleId: matchingRule.ruleId,
        reason: sizeLimitExceeded
          ? `Export size exceeds limit (${matchingRule.maxExportSizeBytes} bytes)`
          : `Matched rule for ${request.datasetRiskTier} ${request.principalType}`,
        requiresApproval: matchingRule.requiresApproval,
        sizeLimitExceeded,
      };
    },

    detectDrift(before, after) {
      const drifts: ExportPolicyDriftEvent[] = [];

      // Check for relaxed policies
      for (const afterRule of after) {
        const beforeRule = before.find(r => r.ruleId === afterRule.ruleId);

        if (!beforeRule) {
          // New rule added
          if (afterRule.action === 'allow') {
            drifts.push({
              driftId: computeOpaqueId(`drift-new-${afterRule.ruleId}`),
              driftType: 'new_export_endpoint',
              ruleId: afterRule.ruleId,
              environment: afterRule.environment,
              timestamp: new Date().toISOString(),
              before: {},
              after: afterRule,
              severity: afterRule.datasetRiskTier === 'critical' ? 'critical' : 'high',
            });
          }
          continue;
        }

        // Check for policy relaxation
        if (beforeRule.action === 'deny' && afterRule.action !== 'deny') {
          drifts.push({
            driftId: computeOpaqueId(`drift-relax-${afterRule.ruleId}`),
            driftType: 'policy_relaxed',
            ruleId: afterRule.ruleId,
            environment: afterRule.environment,
            timestamp: new Date().toISOString(),
            before: { action: beforeRule.action },
            after: { action: afterRule.action },
            severity: afterRule.datasetRiskTier === 'critical' ? 'critical' : 'high',
          });
        }

        // Check for approval removal
        if (beforeRule.requiresApproval && !afterRule.requiresApproval) {
          drifts.push({
            driftId: computeOpaqueId(`drift-approval-${afterRule.ruleId}`),
            driftType: 'approval_removed',
            ruleId: afterRule.ruleId,
            environment: afterRule.environment,
            timestamp: new Date().toISOString(),
            before: { requiresApproval: true },
            after: { requiresApproval: false },
            severity: afterRule.datasetRiskTier === 'critical' ? 'critical' : 'high',
          });
        }

        // Check for size limit increase
        if (
          beforeRule.maxExportSizeBytes !== undefined &&
          afterRule.maxExportSizeBytes !== undefined &&
          afterRule.maxExportSizeBytes > beforeRule.maxExportSizeBytes
        ) {
          drifts.push({
            driftId: computeOpaqueId(`drift-size-${afterRule.ruleId}`),
            driftType: 'size_limit_increased',
            ruleId: afterRule.ruleId,
            environment: afterRule.environment,
            timestamp: new Date().toISOString(),
            before: { maxExportSizeBytes: beforeRule.maxExportSizeBytes },
            after: { maxExportSizeBytes: afterRule.maxExportSizeBytes },
            severity: 'medium',
          });
        }
      }

      return drifts;
    },
  };
}

// ============================================================================
// Contract: export_policy_enforces_allow_deny
// ============================================================================

describe('Data Export Controls Contract', () => {
  describe('export_policy_enforces_allow_deny', () => {
    it('should deny export for critical datasets', () => {
      const store = createExportPolicyStore();
      const rules = [
        createSampleRule({ datasetRiskTier: 'critical', action: 'deny', enabled: true }),
      ];
      const request = createSampleRequest({ datasetRiskTier: 'critical' });

      const result = store.evaluateRequest(request, rules);

      assert.strictEqual(result.action, 'deny');
    });

    it('should require approval for high-risk datasets', () => {
      const store = createExportPolicyStore();
      const rules = [
        createSampleRule({ datasetRiskTier: 'high', action: 'require_approval', enabled: true }),
      ];
      const request = createSampleRequest({ datasetRiskTier: 'high' });

      const result = store.evaluateRequest(request, rules);

      assert.strictEqual(result.action, 'require_approval');
      assert.strictEqual(result.requiresApproval, true);
    });

    it('should allow export for low-risk datasets', () => {
      const store = createExportPolicyStore();
      const rules = [
        createSampleRule({
          datasetRiskTier: 'low',
          action: 'allow',
          requiresApproval: false,
          enabled: true,
        }),
      ];
      const request = createSampleRequest({ datasetRiskTier: 'low' });

      const result = store.evaluateRequest(request, rules);

      assert.strictEqual(result.action, 'allow');
    });

    it('should deny unmatched requests by default', () => {
      const store = createExportPolicyStore();
      const rules: ExportPolicyRule[] = []; // no rules
      const request = createSampleRequest();

      const result = store.evaluateRequest(request, rules);

      assert.strictEqual(result.action, 'deny');
      assert.strictEqual(result.matchedRuleId, null);
    });

    it('should match by principal type', () => {
      const store = createExportPolicyStore();
      const rules = [
        createSampleRule({ principalType: 'user', action: 'require_approval' }),
        createSampleRule({ principalType: 'service', action: 'allow', requiresApproval: false }),
      ];
      const request = createSampleRequest({ principalType: 'service' });

      const result = store.evaluateRequest(request, rules);

      assert.strictEqual(result.action, 'allow');
    });
  });

  // ============================================================================
  // Contract: export_policy_detects_drift
  // ============================================================================

  describe('export_policy_detects_drift', () => {
    it('should detect policy relaxation', () => {
      const store = createExportPolicyStore();
      const ruleId = computeOpaqueId('rule-1');
      const before = [createSampleRule({ ruleId, action: 'deny' })];
      const after = [createSampleRule({ ruleId, action: 'allow' })];

      const drifts = store.detectDrift(before, after);

      assert.ok(drifts.some(d => d.driftType === 'policy_relaxed'));
    });

    it('should detect new export endpoint', () => {
      const store = createExportPolicyStore();
      const before: ExportPolicyRule[] = [];
      const after = [createSampleRule({ action: 'allow' })];

      const drifts = store.detectDrift(before, after);

      assert.ok(drifts.some(d => d.driftType === 'new_export_endpoint'));
    });

    it('should detect approval removal', () => {
      const store = createExportPolicyStore();
      const ruleId = computeOpaqueId('rule-1');
      const before = [createSampleRule({ ruleId, requiresApproval: true })];
      const after = [createSampleRule({ ruleId, requiresApproval: false })];

      const drifts = store.detectDrift(before, after);

      assert.ok(drifts.some(d => d.driftType === 'approval_removed'));
    });

    it('should detect size limit increase', () => {
      const store = createExportPolicyStore();
      const ruleId = computeOpaqueId('rule-1');
      const before = [createSampleRule({ ruleId, maxExportSizeBytes: 1000000 })];
      const after = [createSampleRule({ ruleId, maxExportSizeBytes: 10000000 })];

      const drifts = store.detectDrift(before, after);

      assert.ok(drifts.some(d => d.driftType === 'size_limit_increased'));
    });

    it('should set severity based on risk tier', () => {
      const store = createExportPolicyStore();
      const before: ExportPolicyRule[] = [];
      const after = [createSampleRule({ datasetRiskTier: 'critical', action: 'allow' })];

      const drifts = store.detectDrift(before, after);

      assert.ok(drifts.some(d => d.severity === 'critical'));
    });
  });

  // ============================================================================
  // Contract: export_policy_validates_approval
  // ============================================================================

  describe('export_policy_validates_approval', () => {
    it('should require approval for high-risk tier', () => {
      const rule = createSampleRule({ datasetRiskTier: 'high', requiresApproval: true });

      assert.strictEqual(rule.requiresApproval, true);
    });

    it('should include approver roles', () => {
      const rule = createSampleRule({ approverRoles: ['data_owner', 'security'] });

      assert.ok(rule.approverRoles?.includes('data_owner'));
      assert.ok(rule.approverRoles?.includes('security'));
    });

    it('should detect approval removal as drift', () => {
      const store = createExportPolicyStore();
      const ruleId = computeOpaqueId('rule-1');
      const before = [
        createSampleRule({ ruleId, requiresApproval: true, approverRoles: ['security'] }),
      ];
      const after = [createSampleRule({ ruleId, requiresApproval: false, approverRoles: [] })];

      const drifts = store.detectDrift(before, after);

      const approvalDrift = drifts.find(d => d.driftType === 'approval_removed');
      assert.ok(approvalDrift);
    });
  });

  // ============================================================================
  // Contract: export_policy_enforces_size_limits
  // ============================================================================

  describe('export_policy_enforces_size_limits', () => {
    it('should deny when size limit exceeded', () => {
      const store = createExportPolicyStore();
      const rules = [createSampleRule({ maxExportSizeBytes: 1000000, action: 'allow' })];
      const request = createSampleRequest({ requestedSizeBytes: 2000000 });

      const result = store.evaluateRequest(request, rules);

      assert.strictEqual(result.action, 'deny');
      assert.strictEqual(result.sizeLimitExceeded, true);
    });

    it('should allow when under size limit', () => {
      const store = createExportPolicyStore();
      const rules = [
        createSampleRule({ maxExportSizeBytes: 1000000, action: 'allow', requiresApproval: false }),
      ];
      const request = createSampleRequest({ requestedSizeBytes: 500000 });

      const result = store.evaluateRequest(request, rules);

      assert.strictEqual(result.action, 'allow');
      assert.strictEqual(result.sizeLimitExceeded, false);
    });

    it('should include size limit in denial reason', () => {
      const store = createExportPolicyStore();
      const rules = [createSampleRule({ maxExportSizeBytes: 1000000, action: 'allow' })];
      const request = createSampleRequest({ requestedSizeBytes: 5000000 });

      const result = store.evaluateRequest(request, rules);

      assert.ok(result.reason.includes('exceeds'));
    });

    it('should allow unlimited when no size limit set', () => {
      const store = createExportPolicyStore();
      const rules = [
        createSampleRule({
          maxExportSizeBytes: undefined,
          action: 'allow',
          requiresApproval: false,
        }),
      ];
      const request = createSampleRequest({ requestedSizeBytes: 999999999 });

      const result = store.evaluateRequest(request, rules);

      assert.strictEqual(result.sizeLimitExceeded, false);
    });
  });

  // ============================================================================
  // Contract: export_policy_is_pii_clean
  // ============================================================================

  describe('export_policy_is_pii_clean', () => {
    it('should use opaque rule IDs', () => {
      const rule = createSampleRule();

      assert.ok(rule.ruleId.startsWith('sha256:'));
    });

    it('should use opaque request IDs', () => {
      const request = createSampleRequest();

      assert.ok(request.requestId.startsWith('sha256:'));
    });

    it('should use opaque drift IDs', () => {
      const store = createExportPolicyStore();
      const before: ExportPolicyRule[] = [];
      const after = [createSampleRule({ action: 'allow' })];

      const drifts = store.detectDrift(before, after);

      assert.ok(drifts[0].driftId.startsWith('sha256:'));
    });

    it('should use opaque dataset IDs in requests', () => {
      const request = createSampleRequest();

      assert.ok(request.datasetId.startsWith('sha256:'));
    });

    it('should not expose table names', () => {
      const request = createSampleRequest();

      assert.ok(!request.datasetId.includes('customer'));
      assert.ok(!request.datasetId.includes('users'));
    });
  });
});
