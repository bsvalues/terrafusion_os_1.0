/**
 * Data High-Risk Evidence Contract Tests
 * =======================================
 *
 * Phase VIII: Validates PII-clean evidence packs for high-risk data access.
 *
 * Contract:
 * - evidence_aggregates_by_dimensions: by env, dataset_tier, access_mode, principal_type
 * - evidence_highlights_at_risk: new access, policy weakened, anomalous volume
 * - evidence_is_bounded: size limits, max entries
 * - evidence_is_pii_clean: opaque IDs, no query text, aggregated counts
 * - evidence_includes_checksum: tamper-evident
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';

// ============================================================================
// Types for High-Risk Evidence
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
 * Access mode.
 */
type AccessMode = 'read' | 'write' | 'export' | 'admin';

/**
 * Principal type.
 */
type PrincipalType = 'user' | 'service' | 'job' | 'bi_tool' | 'api_client';

/**
 * Risk category for evidence.
 */
type RiskCategory =
  | 'new_access_high_risk'
  | 'export_policy_weakened'
  | 'anomalous_volume'
  | 'unusual_export'
  | 'access_outside_window'
  | 'scope_expansion';

/**
 * Dimension allowlist (bounded).
 */
const DIMENSION_ALLOWLIST = ['environment', 'dataset_tier', 'access_mode', 'principal_type', 'risk_tier'] as const;
type AllowedDimension = (typeof DIMENSION_ALLOWLIST)[number];

/**
 * At-risk summary entry.
 */
interface AtRiskSummary {
  readonly riskCategory: RiskCategory;
  readonly count: number;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly sampleAnomalyId?: string; // opaque sha256:
}

/**
 * Dimension aggregation.
 */
interface DimensionAggregation {
  readonly dimension: AllowedDimension;
  readonly values: Record<string, number>;
}

/**
 * Effective access summary.
 */
interface EffectiveAccessSummary {
  readonly totalAccessEvents: number;
  readonly totalExportEvents: number;
  readonly byEnvironment: Record<Environment, number>;
  readonly byDatasetTier: Record<DatasetRiskTier, number>;
  readonly byAccessMode: Record<AccessMode, number>;
  readonly byPrincipalType: Record<PrincipalType, number>;
}

/**
 * Data access evidence pack.
 */
interface DataAccessEvidencePack {
  readonly packId: string; // opaque sha256:
  readonly generatedAt: string;
  readonly environment: Environment;
  readonly scope: 'full' | 'high_risk_only' | 'exports_only';
  readonly effectiveAccess: EffectiveAccessSummary;
  readonly atRiskSummaries: readonly AtRiskSummary[];
  readonly aggregations: readonly DimensionAggregation[];
  readonly anomalyCount: number;
  readonly metadata: EvidenceMetadata;
  readonly checksum: string;
}

/**
 * Evidence metadata.
 */
interface EvidenceMetadata {
  readonly version: string;
  readonly generator: string;
  readonly windowStart: string;
  readonly windowEnd: string;
}

/**
 * Evidence pack limits.
 */
interface EvidencePackLimits {
  readonly maxAtRiskSummaries: number;
  readonly maxAggregations: number;
  readonly maxPackSizeBytes: number;
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
 * Compute checksum.
 */
function computeChecksum(data: object): string {
  const json = JSON.stringify(data, Object.keys(data).sort());
  return `sha256:${crypto.createHash('sha256').update(json).digest('hex')}`;
}

/**
 * Verify checksum.
 */
function verifyChecksum(pack: DataAccessEvidencePack): boolean {
  const { checksum, ...rest } = pack;
  const computed = computeChecksum(rest);
  return computed === checksum;
}

/**
 * Create sample effective access summary.
 */
function createSampleEffectiveAccess(options: Partial<EffectiveAccessSummary> = {}): EffectiveAccessSummary {
  return {
    totalAccessEvents: options.totalAccessEvents ?? 1000,
    totalExportEvents: options.totalExportEvents ?? 50,
    byEnvironment: options.byEnvironment ?? { production: 800, staging: 150, development: 50, test: 0 },
    byDatasetTier: options.byDatasetTier ?? { critical: 100, high: 300, medium: 400, low: 200 },
    byAccessMode: options.byAccessMode ?? { read: 850, write: 100, export: 50, admin: 0 },
    byPrincipalType: options.byPrincipalType ?? { user: 200, service: 700, job: 80, bi_tool: 15, api_client: 5 },
  };
}

/**
 * Create sample at-risk summary.
 */
function createSampleAtRiskSummary(options: Partial<AtRiskSummary> = {}): AtRiskSummary {
  return {
    riskCategory: options.riskCategory ?? 'new_access_high_risk',
    count: options.count ?? 5,
    severity: options.severity ?? 'high',
    sampleAnomalyId: options.sampleAnomalyId ?? computeOpaqueId('anomaly-sample'),
  };
}

/**
 * Create sample aggregation.
 */
function createSampleAggregation(dimension: AllowedDimension, values: Record<string, number>): DimensionAggregation {
  return { dimension, values };
}

/**
 * Create sample evidence pack.
 */
function createSampleEvidencePack(options: {
  environment?: Environment;
  scope?: 'full' | 'high_risk_only' | 'exports_only';
  atRiskSummaries?: readonly AtRiskSummary[];
  effectiveAccess?: EffectiveAccessSummary;
  anomalyCount?: number;
} = {}): DataAccessEvidencePack {
  const pack = {
    packId: computeOpaqueId(`pack-${Date.now()}`),
    generatedAt: new Date().toISOString(),
    environment: options.environment ?? 'production',
    scope: options.scope ?? 'full',
    effectiveAccess: options.effectiveAccess ?? createSampleEffectiveAccess(),
    atRiskSummaries: options.atRiskSummaries ?? [
      createSampleAtRiskSummary({ riskCategory: 'new_access_high_risk', count: 3 }),
      createSampleAtRiskSummary({ riskCategory: 'anomalous_volume', count: 2 }),
    ],
    aggregations: [
      createSampleAggregation('environment', { production: 800, staging: 150, development: 50 }),
      createSampleAggregation('dataset_tier', { critical: 100, high: 300, medium: 400, low: 200 }),
    ],
    anomalyCount: options.anomalyCount ?? 5,
    metadata: {
      version: '1.0.0',
      generator: 'tf-data-evidence',
      windowStart: new Date(Date.now() - 86400000).toISOString(),
      windowEnd: new Date().toISOString(),
    },
  };

  return {
    ...pack,
    checksum: computeChecksum(pack),
  };
}

/**
 * Check if pack is bounded.
 */
function isPackBounded(pack: DataAccessEvidencePack, limits: EvidencePackLimits): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (pack.atRiskSummaries.length > limits.maxAtRiskSummaries) {
    violations.push(`At-risk summaries exceed limit: ${pack.atRiskSummaries.length} > ${limits.maxAtRiskSummaries}`);
  }

  if (pack.aggregations.length > limits.maxAggregations) {
    violations.push(`Aggregations exceed limit: ${pack.aggregations.length} > ${limits.maxAggregations}`);
  }

  const packSize = JSON.stringify(pack).length;
  if (packSize > limits.maxPackSizeBytes) {
    violations.push(`Pack size exceeds limit: ${packSize} > ${limits.maxPackSizeBytes}`);
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Check if pack uses only allowed dimensions.
 */
function usesOnlyAllowedDimensions(pack: DataAccessEvidencePack): boolean {
  for (const agg of pack.aggregations) {
    if (!DIMENSION_ALLOWLIST.includes(agg.dimension)) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// Contract: evidence_aggregates_by_dimensions
// ============================================================================

describe('Data High-Risk Evidence Contract', () => {
  describe('evidence_aggregates_by_dimensions', () => {
    it('should aggregate by environment', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.effectiveAccess.byEnvironment);
      assert.ok(pack.effectiveAccess.byEnvironment.production >= 0);
    });

    it('should aggregate by dataset tier', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.effectiveAccess.byDatasetTier);
      assert.ok(pack.effectiveAccess.byDatasetTier.critical >= 0);
    });

    it('should aggregate by access mode', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.effectiveAccess.byAccessMode);
      assert.ok(pack.effectiveAccess.byAccessMode.export >= 0);
    });

    it('should aggregate by principal type', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.effectiveAccess.byPrincipalType);
      assert.ok(pack.effectiveAccess.byPrincipalType.service >= 0);
    });

    it('should use only allowed dimensions', () => {
      const pack = createSampleEvidencePack();

      assert.ok(usesOnlyAllowedDimensions(pack));
    });
  });

  // ============================================================================
  // Contract: evidence_highlights_at_risk
  // ============================================================================

  describe('evidence_highlights_at_risk', () => {
    it('should highlight new access to high-risk datasets', () => {
      const pack = createSampleEvidencePack({
        atRiskSummaries: [createSampleAtRiskSummary({ riskCategory: 'new_access_high_risk' })],
      });

      assert.ok(pack.atRiskSummaries.some((s) => s.riskCategory === 'new_access_high_risk'));
    });

    it('should highlight export policy weakened', () => {
      const pack = createSampleEvidencePack({
        atRiskSummaries: [createSampleAtRiskSummary({ riskCategory: 'export_policy_weakened' })],
      });

      assert.ok(pack.atRiskSummaries.some((s) => s.riskCategory === 'export_policy_weakened'));
    });

    it('should highlight anomalous volume', () => {
      const pack = createSampleEvidencePack({
        atRiskSummaries: [createSampleAtRiskSummary({ riskCategory: 'anomalous_volume' })],
      });

      assert.ok(pack.atRiskSummaries.some((s) => s.riskCategory === 'anomalous_volume'));
    });

    it('should include severity', () => {
      const summary = createSampleAtRiskSummary({ severity: 'critical' });

      assert.strictEqual(summary.severity, 'critical');
    });

    it('should include count', () => {
      const summary = createSampleAtRiskSummary({ count: 10 });

      assert.strictEqual(summary.count, 10);
    });
  });

  // ============================================================================
  // Contract: evidence_is_bounded
  // ============================================================================

  describe('evidence_is_bounded', () => {
    it('should pass within limits', () => {
      const pack = createSampleEvidencePack();
      const limits: EvidencePackLimits = {
        maxAtRiskSummaries: 100,
        maxAggregations: 20,
        maxPackSizeBytes: 100000,
      };

      const result = isPackBounded(pack, limits);

      assert.strictEqual(result.valid, true);
    });

    it('should fail when at-risk summaries exceed limit', () => {
      const pack = createSampleEvidencePack({
        atRiskSummaries: Array.from({ length: 15 }, () => createSampleAtRiskSummary()),
      });
      const limits: EvidencePackLimits = {
        maxAtRiskSummaries: 10,
        maxAggregations: 20,
        maxPackSizeBytes: 100000,
      };

      const result = isPackBounded(pack, limits);

      assert.strictEqual(result.valid, false);
      assert.ok(result.violations.some((v) => v.includes('At-risk')));
    });

    it('should enforce dimension allowlist', () => {
      const pack = createSampleEvidencePack();

      for (const agg of pack.aggregations) {
        assert.ok(DIMENSION_ALLOWLIST.includes(agg.dimension));
      }
    });

    it('should include total counts', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.effectiveAccess.totalAccessEvents > 0);
      assert.ok(pack.effectiveAccess.totalExportEvents >= 0);
    });
  });

  // ============================================================================
  // Contract: evidence_is_pii_clean
  // ============================================================================

  describe('evidence_is_pii_clean', () => {
    it('should use opaque pack ID', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.packId.startsWith('sha256:'));
    });

    it('should use opaque sample anomaly IDs', () => {
      const summary = createSampleAtRiskSummary();

      if (summary.sampleAnomalyId) {
        assert.ok(summary.sampleAnomalyId.startsWith('sha256:'));
      }
    });

    it('should not contain query text', () => {
      const pack = createSampleEvidencePack();
      const packJson = JSON.stringify(pack);

      assert.ok(!packJson.includes('SELECT'));
      assert.ok(!packJson.includes('FROM'));
      assert.ok(!packJson.includes('WHERE'));
    });

    it('should use aggregated counts not lists', () => {
      const pack = createSampleEvidencePack();

      // Should have counts, not arrays of identifiers
      assert.strictEqual(typeof pack.effectiveAccess.totalAccessEvents, 'number');
      assert.strictEqual(typeof pack.effectiveAccess.byEnvironment.production, 'number');
    });

    it('should not expose dataset names', () => {
      const pack = createSampleEvidencePack();
      const packJson = JSON.stringify(pack);

      assert.ok(!packJson.includes('customer'));
      assert.ok(!packJson.includes('users_table'));
    });
  });

  // ============================================================================
  // Contract: evidence_includes_checksum
  // ============================================================================

  describe('evidence_includes_checksum', () => {
    it('should include checksum', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.checksum);
      assert.ok(pack.checksum.startsWith('sha256:'));
    });

    it('should verify valid checksum', () => {
      const pack = createSampleEvidencePack();

      assert.ok(verifyChecksum(pack));
    });

    it('should detect tampered pack', () => {
      const pack = createSampleEvidencePack();
      const tampered: DataAccessEvidencePack = {
        ...pack,
        anomalyCount: pack.anomalyCount + 100,
      };

      assert.strictEqual(verifyChecksum(tampered), false);
    });

    it('should use deterministic checksum', () => {
      const base = {
        generatedAt: '2024-01-01T00:00:00.000Z',
        anomalyCount: 5,
      };

      const checksum1 = computeChecksum(base);
      const checksum2 = computeChecksum(base);

      assert.strictEqual(checksum1, checksum2);
    });
  });
});
