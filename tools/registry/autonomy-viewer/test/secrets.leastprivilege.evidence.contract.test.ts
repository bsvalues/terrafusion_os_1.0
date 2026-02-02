/**
 * Secrets Least-Privilege Evidence Contract Tests
 * =================================================
 *
 * Phase VI: Validates least-privilege evidence packs for secrets access.
 *
 * Contract:
 * - evidence_shows_access_posture: who can read/write/admin which secrets
 * - evidence_highlights_overbroad_grants: flags excessive permissions
 * - evidence_aggregates_by_dimension: by principal_type, environment, risk_tier
 * - evidence_is_pii_clean: opaque IDs, aggregated counts only
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Secrets Least-Privilege Evidence
// ============================================================================

/**
 * Secret class (risk tier).
 */
type SecretClass = 'critical' | 'high' | 'medium' | 'low';

/**
 * Access level.
 */
type AccessLevel = 'read' | 'write' | 'admin';

/**
 * Principal type.
 */
type PrincipalType = 'user' | 'group' | 'service_principal' | 'workload_identity';

/**
 * Overbroad grant type.
 */
type OverbroadGrantType =
  | 'wildcard_secret_access'
  | 'admin_on_critical'
  | 'write_on_prod'
  | 'excessive_scope'
  | 'unused_binding';

/**
 * Risk tier.
 */
type RiskTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Allowed dimension for aggregation.
 */
type AllowedDimension =
  | 'environment'
  | 'secret_class'
  | 'principal_type'
  | 'access_level'
  | 'risk_tier';

/**
 * Access grant summary (aggregated, no individual principals).
 */
interface AccessGrantSummary {
  readonly secretClass: SecretClass;
  readonly environment: string;
  readonly accessLevel: AccessLevel;
  readonly principalType: PrincipalType;
  readonly grantCount: number; // Aggregated count, not individual IDs
  readonly uniqueSecrets: number;
}

/**
 * Overbroad grant finding.
 */
interface OverbroadGrantFinding {
  readonly findingId: string;
  readonly detectedAt: string;
  readonly grantType: OverbroadGrantType;
  readonly severity: RiskTier;
  readonly secretId: string; // Opaque or pattern
  readonly principalId: string; // Opaque
  readonly principalType: PrincipalType;
  readonly accessLevel: AccessLevel;
  readonly environment: string;
  readonly reason: string;
  readonly recommendation: string;
}

/**
 * Least-privilege evidence pack.
 */
interface SecretsLeastPrivilegeEvidencePack {
  readonly packId: string;
  readonly generatedAt: string;
  readonly environment: string;
  readonly period: 'weekly' | 'monthly' | 'quarterly';
  readonly accessSummaries: readonly AccessGrantSummary[];
  readonly overbroadFindings: readonly OverbroadGrantFinding[];
  readonly aggregations: EffectiveAccessAggregations;
  readonly metadata: EvidencePackMetadata;
}

/**
 * Effective access aggregations.
 */
interface EffectiveAccessAggregations {
  readonly bySecretClass: Record<SecretClass, ClassAccessSummary>;
  readonly byPrincipalType: Record<PrincipalType, number>;
  readonly byAccessLevel: Record<AccessLevel, number>;
  readonly byEnvironment: Record<string, number>;
  readonly totalGrants: number;
  readonly totalUniqueSecrets: number;
  readonly totalUniquePrincipals: number; // Count only, not IDs
}

/**
 * Per-class access summary.
 */
interface ClassAccessSummary {
  readonly totalGrants: number;
  readonly readGrants: number;
  readonly writeGrants: number;
  readonly adminGrants: number;
  readonly uniqueSecrets: number;
}

/**
 * Evidence pack metadata.
 */
interface EvidencePackMetadata {
  readonly version: string;
  readonly generator: string;
  readonly dimensionsUsed: readonly AllowedDimension[];
  readonly piiClean: boolean;
  readonly checksum: string;
}

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_DIMENSIONS: readonly AllowedDimension[] = [
  'environment',
  'secret_class',
  'principal_type',
  'access_level',
  'risk_tier',
];

const HIGH_RISK_COMBINATIONS: readonly { secretClass: SecretClass; accessLevel: AccessLevel }[] = [
  { secretClass: 'critical', accessLevel: 'admin' },
  { secretClass: 'critical', accessLevel: 'write' },
  { secretClass: 'high', accessLevel: 'admin' },
];

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Create access grant summary.
 */
function createAccessGrantSummary(
  secretClass: SecretClass,
  environment: string,
  accessLevel: AccessLevel,
  principalType: PrincipalType,
  grantCount: number,
  uniqueSecrets: number
): AccessGrantSummary {
  return {
    secretClass,
    environment,
    accessLevel,
    principalType,
    grantCount,
    uniqueSecrets,
  };
}

/**
 * Check if grant is overbroad.
 */
function detectOverbroadGrant(
  secretId: string,
  principalId: string,
  principalType: PrincipalType,
  accessLevel: AccessLevel,
  secretClass: SecretClass,
  environment: string,
  scope: string
): OverbroadGrantFinding | null {
  // Check for wildcard access
  if (secretId === '*' || secretId.includes('*')) {
    return {
      findingId: `OVB-${Date.now()}`,
      detectedAt: new Date().toISOString(),
      grantType: 'wildcard_secret_access',
      severity: 'critical',
      secretId,
      principalId,
      principalType,
      accessLevel,
      environment,
      reason: 'Wildcard secret access grants access to all secrets',
      recommendation: 'Narrow grant to specific secret paths',
    };
  }

  // Check for admin on critical secrets
  if (secretClass === 'critical' && accessLevel === 'admin') {
    return {
      findingId: `OVB-${Date.now()}`,
      detectedAt: new Date().toISOString(),
      grantType: 'admin_on_critical',
      severity: 'critical',
      secretId,
      principalId,
      principalType,
      accessLevel,
      environment,
      reason: 'Admin access on critical secrets creates blast radius',
      recommendation: 'Use read-only access with break-glass for admin operations',
    };
  }

  // Check for write on production
  if (environment === 'production' && accessLevel === 'write' && secretClass !== 'low') {
    return {
      findingId: `OVB-${Date.now()}`,
      detectedAt: new Date().toISOString(),
      grantType: 'write_on_prod',
      severity: 'high',
      secretId,
      principalId,
      principalType,
      accessLevel,
      environment,
      reason: 'Write access to production secrets increases risk',
      recommendation: 'Use CI/CD automation with scoped credentials instead',
    };
  }

  // Check for excessive scope
  if (scope === '/' || scope === '/*') {
    return {
      findingId: `OVB-${Date.now()}`,
      detectedAt: new Date().toISOString(),
      grantType: 'excessive_scope',
      severity: 'high',
      secretId,
      principalId,
      principalType,
      accessLevel,
      environment,
      reason: 'Root scope grants access across all paths',
      recommendation: 'Narrow to specific service or team scope',
    };
  }

  return null;
}

/**
 * Aggregate access summaries.
 */
function aggregateAccessSummaries(
  summaries: readonly AccessGrantSummary[]
): EffectiveAccessAggregations {
  const bySecretClass: Record<SecretClass, ClassAccessSummary> = {
    critical: { totalGrants: 0, readGrants: 0, writeGrants: 0, adminGrants: 0, uniqueSecrets: 0 },
    high: { totalGrants: 0, readGrants: 0, writeGrants: 0, adminGrants: 0, uniqueSecrets: 0 },
    medium: { totalGrants: 0, readGrants: 0, writeGrants: 0, adminGrants: 0, uniqueSecrets: 0 },
    low: { totalGrants: 0, readGrants: 0, writeGrants: 0, adminGrants: 0, uniqueSecrets: 0 },
  };
  const byPrincipalType: Record<string, number> = {};
  const byAccessLevel: Record<string, number> = {};
  const byEnvironment: Record<string, number> = {};

  let totalGrants = 0;
  const secretSet = new Set<string>();
  let uniquePrincipals = 0;

  for (const s of summaries) {
    totalGrants += s.grantCount;
    uniquePrincipals += s.grantCount; // Simplified: count grants as proxy

    // By class
    bySecretClass[s.secretClass].totalGrants += s.grantCount;
    bySecretClass[s.secretClass].uniqueSecrets += s.uniqueSecrets;
    if (s.accessLevel === 'read') bySecretClass[s.secretClass].readGrants += s.grantCount;
    if (s.accessLevel === 'write') bySecretClass[s.secretClass].writeGrants += s.grantCount;
    if (s.accessLevel === 'admin') bySecretClass[s.secretClass].adminGrants += s.grantCount;

    // By principal type
    byPrincipalType[s.principalType] = (byPrincipalType[s.principalType] ?? 0) + s.grantCount;

    // By access level
    byAccessLevel[s.accessLevel] = (byAccessLevel[s.accessLevel] ?? 0) + s.grantCount;

    // By environment
    byEnvironment[s.environment] = (byEnvironment[s.environment] ?? 0) + s.grantCount;
  }

  return {
    bySecretClass,
    byPrincipalType: byPrincipalType as Record<PrincipalType, number>,
    byAccessLevel: byAccessLevel as Record<AccessLevel, number>,
    byEnvironment,
    totalGrants,
    totalUniqueSecrets: summaries.reduce((sum, s) => sum + s.uniqueSecrets, 0),
    totalUniquePrincipals: uniquePrincipals,
  };
}

/**
 * Generate evidence pack.
 */
function generateEvidencePack(
  summaries: readonly AccessGrantSummary[],
  findings: readonly OverbroadGrantFinding[],
  environment: string
): SecretsLeastPrivilegeEvidencePack {
  return {
    packId: `SECRETS-LP-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    environment,
    period: 'monthly',
    accessSummaries: summaries,
    overbroadFindings: findings,
    aggregations: aggregateAccessSummaries(summaries),
    metadata: {
      version: '1.0.0',
      generator: 'secrets-leastprivilege-builder',
      dimensionsUsed: ['environment', 'secret_class', 'principal_type', 'access_level'],
      piiClean: true,
      checksum: `sha256:pack-${Date.now()}`,
    },
  };
}

/**
 * Validate dimensions used.
 */
function validateDimensions(dimensions: readonly string[]): { valid: boolean; invalid: string[] } {
  const invalid = dimensions.filter(d => !ALLOWED_DIMENSIONS.includes(d as AllowedDimension));
  return { valid: invalid.length === 0, invalid };
}

/**
 * Check if evidence is PII-clean.
 */
function isPIIClean(pack: SecretsLeastPrivilegeEvidencePack): {
  clean: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check for email patterns
  const packStr = JSON.stringify(pack);
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailPattern.test(packStr)) {
    violations.push('Email pattern detected');
  }

  // Check for non-opaque IDs in findings
  for (const f of pack.overbroadFindings) {
    if (!f.principalId.startsWith('sha256:')) {
      violations.push(`Non-opaque principal ID: ${f.principalId}`);
    }
    if (f.secretId !== '*' && !f.secretId.startsWith('sha256:') && !f.secretId.includes('*')) {
      violations.push(`Non-opaque secret ID: ${f.secretId}`);
    }
  }

  return { clean: violations.length === 0, violations };
}

// ============================================================================
// Contract: evidence_shows_access_posture
// ============================================================================

describe('Secrets Least-Privilege Evidence Contract', () => {
  describe('evidence_shows_access_posture', () => {
    it('should show grants by secret class', () => {
      const summaries = [
        createAccessGrantSummary('critical', 'production', 'read', 'service_principal', 5, 3),
        createAccessGrantSummary('high', 'production', 'write', 'service_principal', 10, 5),
      ];
      const pack = generateEvidencePack(summaries, [], 'production');

      assert.strictEqual(pack.aggregations.bySecretClass['critical'].totalGrants, 5);
      assert.strictEqual(pack.aggregations.bySecretClass['high'].totalGrants, 10);
    });

    it('should show grants by access level', () => {
      const summaries = [
        createAccessGrantSummary('high', 'production', 'read', 'service_principal', 10, 5),
        createAccessGrantSummary('high', 'production', 'write', 'service_principal', 3, 2),
        createAccessGrantSummary('high', 'production', 'admin', 'service_principal', 1, 1),
      ];
      const pack = generateEvidencePack(summaries, [], 'production');

      assert.strictEqual(pack.aggregations.byAccessLevel['read'], 10);
      assert.strictEqual(pack.aggregations.byAccessLevel['write'], 3);
      assert.strictEqual(pack.aggregations.byAccessLevel['admin'], 1);
    });

    it('should show grants by principal type', () => {
      const summaries = [
        createAccessGrantSummary('high', 'production', 'read', 'service_principal', 10, 5),
        createAccessGrantSummary('high', 'production', 'read', 'workload_identity', 5, 3),
      ];
      const pack = generateEvidencePack(summaries, [], 'production');

      assert.strictEqual(pack.aggregations.byPrincipalType['service_principal'], 10);
      assert.strictEqual(pack.aggregations.byPrincipalType['workload_identity'], 5);
    });

    it('should track unique secrets', () => {
      const summaries = [
        createAccessGrantSummary('high', 'production', 'read', 'service_principal', 10, 5),
      ];
      const pack = generateEvidencePack(summaries, [], 'production');

      assert.strictEqual(pack.aggregations.totalUniqueSecrets, 5);
    });
  });

  // ============================================================================
  // Contract: evidence_highlights_overbroad_grants
  // ============================================================================

  describe('evidence_highlights_overbroad_grants', () => {
    it('should detect wildcard secret access', () => {
      const finding = detectOverbroadGrant(
        '*',
        'sha256:p1',
        'service_principal',
        'read',
        'high',
        'prod',
        '/'
      );

      assert.ok(finding !== null);
      assert.strictEqual(finding.grantType, 'wildcard_secret_access');
      assert.strictEqual(finding.severity, 'critical');
    });

    it('should detect admin on critical secrets', () => {
      const finding = detectOverbroadGrant(
        'sha256:crit-secret',
        'sha256:p1',
        'service_principal',
        'admin',
        'critical',
        'production',
        '/api'
      );

      assert.ok(finding !== null);
      assert.strictEqual(finding.grantType, 'admin_on_critical');
    });

    it('should detect write on production', () => {
      const finding = detectOverbroadGrant(
        'sha256:secret',
        'sha256:p1',
        'service_principal',
        'write',
        'high',
        'production',
        '/api'
      );

      assert.ok(finding !== null);
      assert.strictEqual(finding.grantType, 'write_on_prod');
    });

    it('should detect excessive scope', () => {
      const finding = detectOverbroadGrant(
        'sha256:secret',
        'sha256:p1',
        'service_principal',
        'read',
        'medium',
        'staging',
        '/'
      );

      assert.ok(finding !== null);
      assert.strictEqual(finding.grantType, 'excessive_scope');
    });

    it('should include recommendation', () => {
      const finding = detectOverbroadGrant(
        '*',
        'sha256:p1',
        'service_principal',
        'read',
        'high',
        'prod',
        '/'
      );

      assert.ok(finding !== null);
      assert.ok(finding.recommendation.length > 0);
    });
  });

  // ============================================================================
  // Contract: evidence_aggregates_by_dimension
  // ============================================================================

  describe('evidence_aggregates_by_dimension', () => {
    it('should use only allowed dimensions', () => {
      const pack = generateEvidencePack([], [], 'production');
      const result = validateDimensions(pack.metadata.dimensionsUsed);

      assert.ok(result.valid);
    });

    it('should reject forbidden dimensions', () => {
      const result = validateDimensions(['user_email', 'principal_name']);

      assert.ok(!result.valid);
      assert.ok(result.invalid.includes('user_email'));
    });

    it('should aggregate by environment', () => {
      const summaries = [
        createAccessGrantSummary('high', 'production', 'read', 'service_principal', 10, 5),
        createAccessGrantSummary('high', 'staging', 'read', 'service_principal', 5, 3),
      ];
      const pack = generateEvidencePack(summaries, [], 'production');

      assert.strictEqual(pack.aggregations.byEnvironment['production'], 10);
      assert.strictEqual(pack.aggregations.byEnvironment['staging'], 5);
    });

    it('should break down by secret class and access level', () => {
      const summaries = [
        createAccessGrantSummary('critical', 'production', 'read', 'service_principal', 5, 2),
        createAccessGrantSummary('critical', 'production', 'admin', 'service_principal', 1, 1),
      ];
      const pack = generateEvidencePack(summaries, [], 'production');

      assert.strictEqual(pack.aggregations.bySecretClass['critical'].readGrants, 5);
      assert.strictEqual(pack.aggregations.bySecretClass['critical'].adminGrants, 1);
    });
  });

  // ============================================================================
  // Contract: evidence_is_pii_clean
  // ============================================================================

  describe('evidence_is_pii_clean', () => {
    it('should pass PII check for clean pack', () => {
      const pack = generateEvidencePack([], [], 'production');
      const result = isPIIClean(pack);

      assert.ok(result.clean);
    });

    it('should use opaque principal IDs in findings', () => {
      const finding = detectOverbroadGrant(
        '*',
        'sha256:opaque',
        'service_principal',
        'read',
        'high',
        'prod',
        '/'
      );
      const pack = generateEvidencePack([], finding ? [finding] : [], 'production');
      const result = isPIIClean(pack);

      assert.ok(result.clean);
    });

    it('should provide counts, not individual IDs', () => {
      const summaries = [
        createAccessGrantSummary('high', 'production', 'read', 'service_principal', 10, 5),
      ];
      const pack = generateEvidencePack(summaries, [], 'production');

      // Summaries have counts, not individual principal IDs
      assert.ok(typeof pack.accessSummaries[0].grantCount === 'number');
      assert.ok(!('principalIds' in pack.accessSummaries[0]));
    });

    it('should mark metadata as PII-clean', () => {
      const pack = generateEvidencePack([], [], 'production');

      assert.strictEqual(pack.metadata.piiClean, true);
    });

    it('should include checksum', () => {
      const pack = generateEvidencePack([], [], 'production');

      assert.ok(pack.metadata.checksum.startsWith('sha256:'));
    });
  });
});
