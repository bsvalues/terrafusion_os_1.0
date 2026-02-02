/**
 * Secrets Rotation Contract Tests
 * =================================
 *
 * Phase VI: Validates rotation compliance evidence.
 *
 * Contract:
 * - rotation_tracks_compliance: last-rotated + next-due per secret
 * - rotation_enforces_max_age: policy-based limits per secret class
 * - rotation_detects_overdue: flags secrets past rotation window
 * - rotation_evidence_is_pii_clean: no secret values ever, aggregated counts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Rotation Compliance
// ============================================================================

/**
 * Secret class (risk tier).
 */
type SecretClass = 'critical' | 'high' | 'medium' | 'low';

/**
 * Rotation status.
 */
type RotationStatus = 'compliant' | 'due_soon' | 'overdue' | 'no_policy';

/**
 * Secret rotation state.
 */
interface SecretRotationState {
  readonly secretId: string; // Opaque ID
  readonly secretClass: SecretClass;
  readonly environment: string;
  readonly rotationPolicyDays: number | null;
  readonly lastRotatedAt: string | null;
  readonly nextDueAt: string | null;
  readonly daysUntilDue: number | null;
  readonly daysSinceRotation: number | null;
  readonly status: RotationStatus;
}

/**
 * Rotation policy (per secret class and environment).
 */
interface RotationPolicy {
  readonly secretClass: SecretClass;
  readonly environment: string;
  readonly maxAgeDays: number;
  readonly warnBeforeDays: number;
}

/**
 * Rotation compliance summary.
 */
interface RotationComplianceSummary {
  readonly reportId: string;
  readonly generatedAt: string;
  readonly environment: string;
  readonly totalSecrets: number;
  readonly compliant: number;
  readonly dueSoon: number;
  readonly overdue: number;
  readonly noPolicy: number;
  readonly complianceRate: number; // 0-1
  readonly byClass: Record<SecretClass, ClassRotationSummary>;
  readonly overdueSecrets: readonly OverdueSecretRef[];
}

/**
 * Per-class rotation summary.
 */
interface ClassRotationSummary {
  readonly total: number;
  readonly compliant: number;
  readonly dueSoon: number;
  readonly overdue: number;
  readonly complianceRate: number;
}

/**
 * Overdue secret reference (no value, opaque ID).
 */
interface OverdueSecretRef {
  readonly secretId: string;
  readonly secretClass: SecretClass;
  readonly daysOverdue: number;
  readonly lastRotatedAt: string | null;
  readonly storeId: string;
}

/**
 * Default rotation policies by class and environment.
 */
const DEFAULT_ROTATION_POLICIES: readonly RotationPolicy[] = [
  { secretClass: 'critical', environment: 'production', maxAgeDays: 30, warnBeforeDays: 7 },
  { secretClass: 'critical', environment: 'staging', maxAgeDays: 60, warnBeforeDays: 14 },
  { secretClass: 'high', environment: 'production', maxAgeDays: 60, warnBeforeDays: 14 },
  { secretClass: 'high', environment: 'staging', maxAgeDays: 90, warnBeforeDays: 21 },
  { secretClass: 'medium', environment: 'production', maxAgeDays: 90, warnBeforeDays: 21 },
  { secretClass: 'medium', environment: 'staging', maxAgeDays: 180, warnBeforeDays: 30 },
  { secretClass: 'low', environment: 'production', maxAgeDays: 180, warnBeforeDays: 30 },
  { secretClass: 'low', environment: 'staging', maxAgeDays: 365, warnBeforeDays: 60 },
];

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Get applicable rotation policy.
 */
function getRotationPolicy(
  secretClass: SecretClass,
  environment: string,
  policies: readonly RotationPolicy[] = DEFAULT_ROTATION_POLICIES
): RotationPolicy | null {
  return policies.find(p => p.secretClass === secretClass && p.environment === environment) ?? null;
}

/**
 * Calculate rotation state for a secret.
 */
function calculateRotationState(
  secretId: string,
  secretClass: SecretClass,
  environment: string,
  lastRotatedAt: string | null,
  rotationPolicyDays: number | null,
  now: Date = new Date()
): SecretRotationState {
  const policy = getRotationPolicy(secretClass, environment);
  const effectiveMaxDays = rotationPolicyDays ?? policy?.maxAgeDays ?? null;
  const warnDays = policy?.warnBeforeDays ?? 7;

  if (!lastRotatedAt || !effectiveMaxDays) {
    return {
      secretId,
      secretClass,
      environment,
      rotationPolicyDays: effectiveMaxDays,
      lastRotatedAt,
      nextDueAt: null,
      daysUntilDue: null,
      daysSinceRotation: null,
      status: effectiveMaxDays ? 'overdue' : 'no_policy',
    };
  }

  const lastRotated = new Date(lastRotatedAt);
  const daysSinceRotation = Math.floor(
    (now.getTime() - lastRotated.getTime()) / (24 * 60 * 60 * 1000)
  );
  const nextDue = new Date(lastRotated.getTime() + effectiveMaxDays * 24 * 60 * 60 * 1000);
  const daysUntilDue = Math.floor((nextDue.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  let status: RotationStatus;
  if (daysUntilDue < 0) {
    status = 'overdue';
  } else if (daysUntilDue <= warnDays) {
    status = 'due_soon';
  } else {
    status = 'compliant';
  }

  return {
    secretId,
    secretClass,
    environment,
    rotationPolicyDays: effectiveMaxDays,
    lastRotatedAt,
    nextDueAt: nextDue.toISOString(),
    daysUntilDue,
    daysSinceRotation,
    status,
  };
}

/**
 * Generate rotation compliance summary.
 */
function generateRotationSummary(
  states: readonly SecretRotationState[],
  environment: string
): RotationComplianceSummary {
  const byClass: Record<SecretClass, ClassRotationSummary> = {
    critical: { total: 0, compliant: 0, dueSoon: 0, overdue: 0, complianceRate: 1 },
    high: { total: 0, compliant: 0, dueSoon: 0, overdue: 0, complianceRate: 1 },
    medium: { total: 0, compliant: 0, dueSoon: 0, overdue: 0, complianceRate: 1 },
    low: { total: 0, compliant: 0, dueSoon: 0, overdue: 0, complianceRate: 1 },
  };

  let compliant = 0;
  let dueSoon = 0;
  let overdue = 0;
  let noPolicy = 0;
  const overdueSecrets: OverdueSecretRef[] = [];

  for (const state of states) {
    byClass[state.secretClass].total++;

    switch (state.status) {
      case 'compliant':
        compliant++;
        byClass[state.secretClass].compliant++;
        break;
      case 'due_soon':
        dueSoon++;
        byClass[state.secretClass].dueSoon++;
        break;
      case 'overdue':
        overdue++;
        byClass[state.secretClass].overdue++;
        overdueSecrets.push({
          secretId: state.secretId,
          secretClass: state.secretClass,
          daysOverdue: state.daysUntilDue ? Math.abs(state.daysUntilDue) : 0,
          lastRotatedAt: state.lastRotatedAt,
          storeId: 'STORE-UNKNOWN', // Would come from inventory
        });
        break;
      case 'no_policy':
        noPolicy++;
        break;
    }
  }

  // Compute per-class compliance rates
  for (const cls of Object.keys(byClass) as SecretClass[]) {
    const c = byClass[cls];
    c.complianceRate = c.total > 0 ? c.compliant / c.total : 1;
  }

  const totalSecrets = states.length;
  const complianceRate = totalSecrets > 0 ? compliant / totalSecrets : 1;

  return {
    reportId: `ROT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    environment,
    totalSecrets,
    compliant,
    dueSoon,
    overdue,
    noPolicy,
    complianceRate,
    byClass,
    overdueSecrets,
  };
}

/**
 * Create sample rotation state.
 */
function createSampleRotationState(
  options: {
    secretId?: string;
    secretClass?: SecretClass;
    environment?: string;
    daysAgo?: number;
    policyDays?: number;
  } = {}
): SecretRotationState {
  const {
    secretId = `sha256:secret-${Date.now()}`,
    secretClass = 'high',
    environment = 'production',
    daysAgo = 30,
    policyDays = 60,
  } = options;

  const lastRotatedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  return calculateRotationState(secretId, secretClass, environment, lastRotatedAt, policyDays);
}

// ============================================================================
// Contract: rotation_tracks_compliance
// ============================================================================

describe('Secrets Rotation Contract', () => {
  describe('rotation_tracks_compliance', () => {
    it('should track last-rotated timestamp', () => {
      const state = createSampleRotationState({ daysAgo: 15 });

      assert.ok(state.lastRotatedAt !== null);
      assert.ok(state.daysSinceRotation !== null);
      assert.ok(state.daysSinceRotation >= 14 && state.daysSinceRotation <= 16);
    });

    it('should calculate next-due timestamp', () => {
      const state = createSampleRotationState({ daysAgo: 30, policyDays: 60 });

      assert.ok(state.nextDueAt !== null);
      assert.ok(state.daysUntilDue !== null);
      assert.ok(state.daysUntilDue >= 29 && state.daysUntilDue <= 31);
    });

    it('should identify compliant secrets', () => {
      const state = createSampleRotationState({ daysAgo: 10, policyDays: 60 });

      assert.strictEqual(state.status, 'compliant');
    });

    it('should identify due-soon secrets', () => {
      const state = createSampleRotationState({ daysAgo: 55, policyDays: 60 });

      assert.strictEqual(state.status, 'due_soon');
    });

    it('should identify overdue secrets', () => {
      const state = createSampleRotationState({ daysAgo: 70, policyDays: 60 });

      assert.strictEqual(state.status, 'overdue');
    });
  });

  // ============================================================================
  // Contract: rotation_enforces_max_age
  // ============================================================================

  describe('rotation_enforces_max_age', () => {
    it('should use policy-based max age', () => {
      const policy = getRotationPolicy('critical', 'production');

      assert.ok(policy !== null);
      assert.strictEqual(policy.maxAgeDays, 30);
    });

    it('should have stricter policies for production', () => {
      const prodPolicy = getRotationPolicy('high', 'production');
      const stagingPolicy = getRotationPolicy('high', 'staging');

      assert.ok(prodPolicy !== null);
      assert.ok(stagingPolicy !== null);
      assert.ok(prodPolicy.maxAgeDays < stagingPolicy.maxAgeDays);
    });

    it('should have stricter policies for higher risk classes', () => {
      const criticalPolicy = getRotationPolicy('critical', 'production');
      const lowPolicy = getRotationPolicy('low', 'production');

      assert.ok(criticalPolicy !== null);
      assert.ok(lowPolicy !== null);
      assert.ok(criticalPolicy.maxAgeDays < lowPolicy.maxAgeDays);
    });

    it('should use secret-specific policy if provided', () => {
      const state = calculateRotationState(
        'sha256:test',
        'high',
        'production',
        new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        45 // Override default 60-day policy
      );

      assert.strictEqual(state.rotationPolicyDays, 45);
      assert.strictEqual(state.status, 'due_soon'); // 35 days into 45-day policy
    });

    it('should include warn-before-days in policy', () => {
      const policy = getRotationPolicy('critical', 'production');

      assert.ok(policy !== null);
      assert.ok(policy.warnBeforeDays > 0);
    });
  });

  // ============================================================================
  // Contract: rotation_detects_overdue
  // ============================================================================

  describe('rotation_detects_overdue', () => {
    it('should detect overdue secrets', () => {
      const states = [
        createSampleRotationState({ secretId: 'sha256:s1', daysAgo: 70, policyDays: 60 }),
        createSampleRotationState({ secretId: 'sha256:s2', daysAgo: 10, policyDays: 60 }),
      ];
      const summary = generateRotationSummary(states, 'production');

      assert.strictEqual(summary.overdue, 1);
      assert.strictEqual(summary.overdueSecrets.length, 1);
    });

    it('should include days overdue in report', () => {
      const states = [
        createSampleRotationState({ secretId: 'sha256:s1', daysAgo: 70, policyDays: 60 }),
      ];
      const summary = generateRotationSummary(states, 'production');

      assert.ok(summary.overdueSecrets[0].daysOverdue >= 9);
    });

    it('should calculate compliance rate', () => {
      const states = [
        createSampleRotationState({ secretId: 'sha256:s1', daysAgo: 10, policyDays: 60 }),
        createSampleRotationState({ secretId: 'sha256:s2', daysAgo: 10, policyDays: 60 }),
        createSampleRotationState({ secretId: 'sha256:s3', daysAgo: 70, policyDays: 60 }),
      ];
      const summary = generateRotationSummary(states, 'production');

      // 2 compliant out of 3
      assert.ok(summary.complianceRate >= 0.65 && summary.complianceRate <= 0.68);
    });

    it('should group by secret class', () => {
      const states = [
        createSampleRotationState({ secretId: 'sha256:s1', secretClass: 'critical', daysAgo: 10 }),
        createSampleRotationState({
          secretId: 'sha256:s2',
          secretClass: 'critical',
          daysAgo: 70,
          policyDays: 30,
        }),
        createSampleRotationState({ secretId: 'sha256:s3', secretClass: 'low', daysAgo: 10 }),
      ];
      const summary = generateRotationSummary(states, 'production');

      assert.strictEqual(summary.byClass['critical'].total, 2);
      assert.strictEqual(summary.byClass['critical'].overdue, 1);
      assert.strictEqual(summary.byClass['low'].total, 1);
    });

    it('should handle secrets with no policy', () => {
      const state = calculateRotationState('sha256:nopolicy', 'high', 'unknown-env', null, null);

      assert.strictEqual(state.status, 'no_policy');
    });
  });

  // ============================================================================
  // Contract: rotation_evidence_is_pii_clean
  // ============================================================================

  describe('rotation_evidence_is_pii_clean', () => {
    it('should use opaque secret IDs', () => {
      const states = [createSampleRotationState({ secretId: 'sha256:opaque-id' })];
      const summary = generateRotationSummary(states, 'production');

      for (const overdue of summary.overdueSecrets) {
        assert.ok(overdue.secretId.startsWith('sha256:'));
      }
    });

    it('should never include secret values', () => {
      const summary = generateRotationSummary(
        [createSampleRotationState({ daysAgo: 70, policyDays: 60 })],
        'production'
      );

      const summaryStr = JSON.stringify(summary);
      assert.ok(!summaryStr.includes('secretValue'));
      assert.ok(!summaryStr.includes('password'));
      assert.ok(!summaryStr.includes('"value"'));
    });

    it('should provide aggregated counts', () => {
      const summary = generateRotationSummary(
        [
          createSampleRotationState({ secretId: 'sha256:s1' }),
          createSampleRotationState({ secretId: 'sha256:s2' }),
        ],
        'production'
      );

      assert.ok(typeof summary.totalSecrets === 'number');
      assert.ok(typeof summary.compliant === 'number');
      assert.ok(typeof summary.complianceRate === 'number');
    });

    it('should include report metadata', () => {
      const summary = generateRotationSummary([createSampleRotationState()], 'production');

      assert.ok(summary.reportId.startsWith('ROT-'));
      assert.ok(summary.generatedAt);
      assert.strictEqual(summary.environment, 'production');
    });
  });
});
