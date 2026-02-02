/**
 * Service Identity Evidence Contract Tests
 * =========================================
 *
 * Phase VII: Validates PII-clean, bounded evidence packs.
 *
 * Contract:
 * - evidence_is_pii_clean: opaque IDs, no sensitive hostnames
 * - evidence_uses_aggregated_counts: by tier/env/class
 * - evidence_is_bounded: size limits, dimension allowlist
 * - evidence_includes_at_risk_summary: soonest expiring without leaking details
 */

import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Service Identity Evidence
// ============================================================================

/**
 * Environment type.
 */
type Environment = 'production' | 'staging' | 'development' | 'test';

/**
 * Service tier.
 */
type ServiceTier = 'critical' | 'high' | 'standard' | 'internal';

/**
 * Cert class.
 */
type CertClass = 'leaf' | 'intermediate' | 'root';

/**
 * Issuer tier.
 */
type IssuerTier = 'public_ca' | 'private_ca' | 'self_signed' | 'spiffe';

/**
 * At-risk item summary (no PII).
 */
interface AtRiskSummary {
  readonly category: 'expiring_7d' | 'expiring_30d' | 'expired' | 'rotation_overdue';
  readonly count: number;
  readonly serviceTier: ServiceTier;
  readonly environment: Environment;
  readonly soonestDaysUntil?: number;
}

/**
 * Aggregated counts by dimension.
 */
interface DimensionCounts {
  readonly byEnvironment: Record<Environment, number>;
  readonly byServiceTier: Record<ServiceTier, number>;
  readonly byCertClass: Record<CertClass, number>;
  readonly byIssuerTier: Record<IssuerTier, number>;
}

/**
 * Evidence pack for service identity.
 */
interface ServiceIdentityEvidencePack {
  readonly packId: string;
  readonly generatedAt: string;
  readonly reportingPeriod: {
    readonly start: string;
    readonly end: string;
  };
  readonly totalCertificates: number;
  readonly totalBindings: number;
  readonly dimensionCounts: DimensionCounts;
  readonly atRiskSummaries: readonly AtRiskSummary[];
  readonly complianceRate: number;
  readonly driftEventCount: number;
  readonly checksum: string;
}

/**
 * Evidence validation result.
 */
interface EvidenceValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

// ============================================================================
// Constants
// ============================================================================

const DIMENSION_ALLOWLIST = [
  'environment',
  'service_tier',
  'cert_class',
  'issuer_tier',
  'principal_type',
] as const;

const MAX_AT_RISK_SUMMARIES = 100;
const MAX_PACK_SIZE_BYTES = 64 * 1024; // 64KB

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
 * Compute evidence checksum.
 */
function computeEvidenceChecksum(pack: Omit<ServiceIdentityEvidencePack, 'checksum'>): string {
  const data = JSON.stringify({
    packId: pack.packId,
    generatedAt: pack.generatedAt,
    totalCertificates: pack.totalCertificates,
    totalBindings: pack.totalBindings,
    complianceRate: pack.complianceRate,
  });
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate evidence pack.
 */
function validateEvidencePack(pack: ServiceIdentityEvidencePack): EvidenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Opaque ID check
  if (!pack.packId.startsWith('sha256:')) {
    errors.push('packId must be opaque (sha256:)');
  }

  // Checksum verification
  const computed = computeEvidenceChecksum({
    packId: pack.packId,
    generatedAt: pack.generatedAt,
    reportingPeriod: pack.reportingPeriod,
    totalCertificates: pack.totalCertificates,
    totalBindings: pack.totalBindings,
    dimensionCounts: pack.dimensionCounts,
    atRiskSummaries: pack.atRiskSummaries,
    complianceRate: pack.complianceRate,
    driftEventCount: pack.driftEventCount,
  });

  if (pack.checksum !== computed) {
    errors.push('Checksum mismatch');
  }

  // At-risk summaries limit
  if (pack.atRiskSummaries.length > MAX_AT_RISK_SUMMARIES) {
    errors.push(
      `Too many at-risk summaries: ${pack.atRiskSummaries.length} > ${MAX_AT_RISK_SUMMARIES}`
    );
  }

  // Size check
  const packSize = JSON.stringify(pack).length;
  if (packSize > MAX_PACK_SIZE_BYTES) {
    errors.push(`Pack size exceeds limit: ${packSize} > ${MAX_PACK_SIZE_BYTES}`);
  }

  // Dimension validation
  const dimensionKeys = Object.keys(pack.dimensionCounts);
  const allowedDimensions = ['byEnvironment', 'byServiceTier', 'byCertClass', 'byIssuerTier'];
  for (const key of dimensionKeys) {
    if (!allowedDimensions.includes(key)) {
      errors.push(`Invalid dimension: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Create sample dimension counts.
 */
function createSampleDimensionCounts(): DimensionCounts {
  return {
    byEnvironment: { production: 10, staging: 5, development: 3, test: 2 },
    byServiceTier: { critical: 5, high: 7, standard: 6, internal: 2 },
    byCertClass: { leaf: 15, intermediate: 3, root: 2 },
    byIssuerTier: { public_ca: 2, private_ca: 15, self_signed: 1, spiffe: 2 },
  };
}

/**
 * Create sample at-risk summary.
 */
function createSampleAtRiskSummary(options: Partial<AtRiskSummary> = {}): AtRiskSummary {
  return {
    category: options.category ?? 'expiring_7d',
    count: options.count ?? 3,
    serviceTier: options.serviceTier ?? 'critical',
    environment: options.environment ?? 'production',
    soonestDaysUntil: options.soonestDaysUntil ?? 5,
  };
}

/**
 * Create sample evidence pack.
 */
function createSampleEvidencePack(
  options: {
    atRiskCount?: number;
    complianceRate?: number;
  } = {}
): ServiceIdentityEvidencePack {
  const { atRiskCount = 4, complianceRate = 0.95 } = options;

  const atRiskSummaries = Array.from({ length: atRiskCount }, (_, i) =>
    createSampleAtRiskSummary({
      category: i === 0 ? 'expiring_7d' : 'expiring_30d',
      count: 2 + i,
      serviceTier: ['critical', 'high', 'standard', 'internal'][i % 4] as ServiceTier,
    })
  );

  const partial = {
    packId: computeOpaqueId(`pack-${Date.now()}`),
    generatedAt: new Date().toISOString(),
    reportingPeriod: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    totalCertificates: 20,
    totalBindings: 35,
    dimensionCounts: createSampleDimensionCounts(),
    atRiskSummaries,
    complianceRate,
    driftEventCount: 2,
  };

  const checksum = computeEvidenceChecksum(partial);

  return { ...partial, checksum };
}

/**
 * Hash hostname if sensitive.
 */
function hashSensitiveHostname(hostname: string): string {
  return `sha256:${crypto.createHash('sha256').update(hostname).digest('hex').slice(0, 12)}`;
}

/**
 * Check if string contains PII patterns.
 */
function containsPii(text: string): boolean {
  // Check for email patterns
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return true;

  // Check for raw hostnames (not hashed)
  if (/[a-zA-Z0-9-]+\.(internal|local|corp|company|example)\.[a-zA-Z]{2,}/.test(text)) return true;

  // Check for IP addresses
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(text)) return true;

  return false;
}

// ============================================================================
// Contract: evidence_is_pii_clean
// ============================================================================

describe('Service Identity Evidence Contract', () => {
  describe('evidence_is_pii_clean', () => {
    it('should use opaque pack ID', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.packId.startsWith('sha256:'));
    });

    it('should not contain raw hostnames in at-risk summaries', () => {
      const pack = createSampleEvidencePack();
      const json = JSON.stringify(pack.atRiskSummaries);

      assert.ok(!containsPii(json));
    });

    it('should hash sensitive hostnames', () => {
      const hostname = 'secret-service.internal.company.com';
      const hashed = hashSensitiveHostname(hostname);

      assert.ok(hashed.startsWith('sha256:'));
      assert.ok(!hashed.includes('secret'));
    });

    it('should not expose email addresses', () => {
      const pack = createSampleEvidencePack();
      const json = JSON.stringify(pack);

      assert.ok(!containsPii(json));
    });

    it('should use aggregated counts instead of lists', () => {
      const pack = createSampleEvidencePack();

      // Dimension counts are numbers, not lists of identifiers
      assert.ok(typeof pack.dimensionCounts.byEnvironment.production === 'number');
      assert.ok(typeof pack.dimensionCounts.byServiceTier.critical === 'number');
    });
  });

  // ============================================================================
  // Contract: evidence_uses_aggregated_counts
  // ============================================================================

  describe('evidence_uses_aggregated_counts', () => {
    it('should count by environment', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.dimensionCounts.byEnvironment.production >= 0);
      assert.ok(pack.dimensionCounts.byEnvironment.staging >= 0);
    });

    it('should count by service tier', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.dimensionCounts.byServiceTier.critical >= 0);
      assert.ok(pack.dimensionCounts.byServiceTier.high >= 0);
    });

    it('should count by cert class', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.dimensionCounts.byCertClass.leaf >= 0);
      assert.ok(pack.dimensionCounts.byCertClass.intermediate >= 0);
      assert.ok(pack.dimensionCounts.byCertClass.root >= 0);
    });

    it('should count by issuer tier', () => {
      const pack = createSampleEvidencePack();

      assert.ok(pack.dimensionCounts.byIssuerTier.public_ca >= 0);
      assert.ok(pack.dimensionCounts.byIssuerTier.private_ca >= 0);
    });

    it('should include compliance rate', () => {
      const pack = createSampleEvidencePack({ complianceRate: 0.92 });

      assert.strictEqual(pack.complianceRate, 0.92);
      assert.ok(pack.complianceRate >= 0 && pack.complianceRate <= 1);
    });
  });

  // ============================================================================
  // Contract: evidence_is_bounded
  // ============================================================================

  describe('evidence_is_bounded', () => {
    it('should enforce at-risk summaries limit', () => {
      const pack = createSampleEvidencePack({ atRiskCount: 150 });
      const result = validateEvidencePack(pack);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('at-risk summaries')));
    });

    it('should pass under limits', () => {
      const pack = createSampleEvidencePack({ atRiskCount: 10 });
      const result = validateEvidencePack(pack);

      assert.strictEqual(result.valid, true);
    });

    it('should use dimension allowlist', () => {
      const pack = createSampleEvidencePack();
      const dimensions = Object.keys(pack.dimensionCounts);

      const allowedPrefixes = ['by'];
      for (const dim of dimensions) {
        assert.ok(allowedPrefixes.some(p => dim.startsWith(p)));
      }
    });

    it('should verify checksum', () => {
      const pack = createSampleEvidencePack();
      const result = validateEvidencePack(pack);

      assert.strictEqual(result.valid, true);
    });

    it('should detect tampered pack', () => {
      const pack = createSampleEvidencePack();
      const tampered = { ...pack, totalCertificates: 999 };
      const result = validateEvidencePack(tampered);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('Checksum')));
    });
  });

  // ============================================================================
  // Contract: evidence_includes_at_risk_summary
  // ============================================================================

  describe('evidence_includes_at_risk_summary', () => {
    it('should categorize by risk type', () => {
      const summaries = [
        createSampleAtRiskSummary({ category: 'expiring_7d' }),
        createSampleAtRiskSummary({ category: 'expiring_30d' }),
        createSampleAtRiskSummary({ category: 'expired' }),
        createSampleAtRiskSummary({ category: 'rotation_overdue' }),
      ];

      const categories = summaries.map(s => s.category);
      assert.ok(categories.includes('expiring_7d'));
      assert.ok(categories.includes('expiring_30d'));
      assert.ok(categories.includes('expired'));
      assert.ok(categories.includes('rotation_overdue'));
    });

    it('should include soonest days until expiry', () => {
      const summary = createSampleAtRiskSummary({ soonestDaysUntil: 3 });

      assert.strictEqual(summary.soonestDaysUntil, 3);
    });

    it('should aggregate by service tier', () => {
      const summary = createSampleAtRiskSummary({
        serviceTier: 'critical',
        count: 5,
      });

      assert.strictEqual(summary.serviceTier, 'critical');
      assert.strictEqual(summary.count, 5);
    });

    it('should aggregate by environment', () => {
      const summary = createSampleAtRiskSummary({
        environment: 'production',
        count: 3,
      });

      assert.strictEqual(summary.environment, 'production');
    });

    it('should not include cert fingerprints or hostnames', () => {
      const summary = createSampleAtRiskSummary();
      const json = JSON.stringify(summary);

      assert.ok(!json.includes('sha256:')); // No specific cert refs
      assert.ok(!json.includes('.internal'));
      assert.ok(!json.includes('.local'));
    });
  });
});
