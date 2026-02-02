/**
 * Service Identity Lifecycle Contract Tests
 * ==========================================
 *
 * Phase VII: Validates expiry and rotation policy compliance.
 *
 * Contract:
 * - lifecycle_tracks_expiry: warn/critical thresholds per service tier
 * - lifecycle_enforces_rotation_cadence: class-based rotation policies
 * - lifecycle_generates_compliance_report: aggregated status by tier
 * - lifecycle_is_pii_clean: opaque IDs, no sensitive hostnames leaked
 */

import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Service Identity Lifecycle
// ============================================================================

/**
 * Service tier classification.
 */
type ServiceTier = 'critical' | 'high' | 'standard' | 'internal';

/**
 * Certificate class.
 */
type CertClass = 'leaf' | 'intermediate' | 'root';

/**
 * Expiry status.
 */
type ExpiryStatus = 'valid' | 'expiring_soon' | 'expiring_critical' | 'expired';

/**
 * Rotation compliance status.
 */
type RotationComplianceStatus = 'compliant' | 'due_soon' | 'overdue' | 'never_rotated';

/**
 * Lifecycle policy.
 */
interface LifecyclePolicy {
  readonly serviceTier: ServiceTier;
  readonly expiryWarnDays: number;
  readonly expiryCriticalDays: number;
  readonly maxRotationAgeDays: number;
  readonly rotationWarnDays: number;
}

/**
 * Certificate expiry check result.
 */
interface ExpiryCheckResult {
  readonly certId: string;
  readonly status: ExpiryStatus;
  readonly notAfter: string;
  readonly daysUntilExpiry: number;
  readonly serviceTier: ServiceTier;
  readonly environment: string;
}

/**
 * Rotation check result.
 */
interface RotationCheckResult {
  readonly bindingId: string;
  readonly certId: string;
  readonly status: RotationComplianceStatus;
  readonly lastRotated: string | null;
  readonly daysSinceRotation: number | null;
  readonly nextDue: string | null;
  readonly serviceTier: ServiceTier;
}

/**
 * Lifecycle compliance report.
 */
interface LifecycleComplianceReport {
  readonly reportId: string;
  readonly generatedAt: string;
  readonly environment?: string;
  readonly expiryChecks: readonly ExpiryCheckResult[];
  readonly rotationChecks: readonly RotationCheckResult[];
  readonly summary: LifecycleSummary;
}

/**
 * Lifecycle summary.
 */
interface LifecycleSummary {
  readonly totalCertificates: number;
  readonly totalBindings: number;
  readonly expiryByStatus: Record<ExpiryStatus, number>;
  readonly rotationByStatus: Record<RotationComplianceStatus, number>;
  readonly expiryByTier: Record<ServiceTier, Record<ExpiryStatus, number>>;
  readonly criticalExpiringCount: number;
  readonly overdueRotationCount: number;
}

// ============================================================================
// Default Policies (class-based)
// ============================================================================

const DEFAULT_POLICIES: Record<ServiceTier, LifecyclePolicy> = {
  critical: {
    serviceTier: 'critical',
    expiryWarnDays: 30,
    expiryCriticalDays: 7,
    maxRotationAgeDays: 90,
    rotationWarnDays: 75,
  },
  high: {
    serviceTier: 'high',
    expiryWarnDays: 30,
    expiryCriticalDays: 14,
    maxRotationAgeDays: 180,
    rotationWarnDays: 150,
  },
  standard: {
    serviceTier: 'standard',
    expiryWarnDays: 30,
    expiryCriticalDays: 14,
    maxRotationAgeDays: 365,
    rotationWarnDays: 330,
  },
  internal: {
    serviceTier: 'internal',
    expiryWarnDays: 30,
    expiryCriticalDays: 7,
    maxRotationAgeDays: 365,
    rotationWarnDays: 330,
  },
};

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
 * Check expiry status.
 */
function checkExpiryStatus(
  notAfter: string,
  policy: LifecyclePolicy
): { status: ExpiryStatus; daysUntilExpiry: number } {
  const now = new Date();
  const expiryDate = new Date(notAfter);
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );

  let status: ExpiryStatus;
  if (daysUntilExpiry < 0) {
    status = 'expired';
  } else if (daysUntilExpiry <= policy.expiryCriticalDays) {
    status = 'expiring_critical';
  } else if (daysUntilExpiry <= policy.expiryWarnDays) {
    status = 'expiring_soon';
  } else {
    status = 'valid';
  }

  return { status, daysUntilExpiry };
}

/**
 * Check rotation compliance.
 */
function checkRotationCompliance(
  lastRotated: string | null,
  policy: LifecyclePolicy
): { status: RotationComplianceStatus; daysSinceRotation: number | null; nextDue: string | null } {
  if (!lastRotated) {
    return { status: 'never_rotated', daysSinceRotation: null, nextDue: null };
  }

  const now = new Date();
  const rotatedDate = new Date(lastRotated);
  const daysSinceRotation = Math.floor(
    (now.getTime() - rotatedDate.getTime()) / (24 * 60 * 60 * 1000)
  );
  const nextDueDate = new Date(
    rotatedDate.getTime() + policy.maxRotationAgeDays * 24 * 60 * 60 * 1000
  );
  const nextDue = nextDueDate.toISOString();

  let status: RotationComplianceStatus;
  if (daysSinceRotation > policy.maxRotationAgeDays) {
    status = 'overdue';
  } else if (daysSinceRotation >= policy.rotationWarnDays) {
    status = 'due_soon';
  } else {
    status = 'compliant';
  }

  return { status, daysSinceRotation, nextDue };
}

/**
 * Generate expiry check for a certificate.
 */
function generateExpiryCheck(
  certId: string,
  notAfter: string,
  serviceTier: ServiceTier,
  environment: string,
  policies: Record<ServiceTier, LifecyclePolicy> = DEFAULT_POLICIES
): ExpiryCheckResult {
  const policy = policies[serviceTier];
  const { status, daysUntilExpiry } = checkExpiryStatus(notAfter, policy);

  return {
    certId,
    status,
    notAfter,
    daysUntilExpiry,
    serviceTier,
    environment,
  };
}

/**
 * Generate rotation check for a binding.
 */
function generateRotationCheck(
  bindingId: string,
  certId: string,
  lastRotated: string | null,
  serviceTier: ServiceTier,
  policies: Record<ServiceTier, LifecyclePolicy> = DEFAULT_POLICIES
): RotationCheckResult {
  const policy = policies[serviceTier];
  const { status, daysSinceRotation, nextDue } = checkRotationCompliance(lastRotated, policy);

  return {
    bindingId,
    certId,
    status,
    lastRotated,
    daysSinceRotation,
    nextDue,
    serviceTier,
  };
}

/**
 * Compute lifecycle summary.
 */
function computeSummary(
  expiryChecks: readonly ExpiryCheckResult[],
  rotationChecks: readonly RotationCheckResult[]
): LifecycleSummary {
  const expiryByStatus: Record<ExpiryStatus, number> = {
    valid: 0,
    expiring_soon: 0,
    expiring_critical: 0,
    expired: 0,
  };

  const rotationByStatus: Record<RotationComplianceStatus, number> = {
    compliant: 0,
    due_soon: 0,
    overdue: 0,
    never_rotated: 0,
  };

  const expiryByTier: Record<ServiceTier, Record<ExpiryStatus, number>> = {
    critical: { valid: 0, expiring_soon: 0, expiring_critical: 0, expired: 0 },
    high: { valid: 0, expiring_soon: 0, expiring_critical: 0, expired: 0 },
    standard: { valid: 0, expiring_soon: 0, expiring_critical: 0, expired: 0 },
    internal: { valid: 0, expiring_soon: 0, expiring_critical: 0, expired: 0 },
  };

  for (const check of expiryChecks) {
    expiryByStatus[check.status]++;
    expiryByTier[check.serviceTier][check.status]++;
  }

  for (const check of rotationChecks) {
    rotationByStatus[check.status]++;
  }

  return {
    totalCertificates: expiryChecks.length,
    totalBindings: rotationChecks.length,
    expiryByStatus,
    rotationByStatus,
    expiryByTier,
    criticalExpiringCount: expiryByStatus.expiring_critical + expiryByStatus.expired,
    overdueRotationCount: rotationByStatus.overdue,
  };
}

/**
 * Generate compliance report.
 */
function generateComplianceReport(
  expiryChecks: readonly ExpiryCheckResult[],
  rotationChecks: readonly RotationCheckResult[],
  environment?: string
): LifecycleComplianceReport {
  return {
    reportId: computeOpaqueId(`report-${Date.now()}`),
    generatedAt: new Date().toISOString(),
    environment,
    expiryChecks,
    rotationChecks,
    summary: computeSummary(expiryChecks, rotationChecks),
  };
}

// ============================================================================
// Contract: lifecycle_tracks_expiry
// ============================================================================

describe('Service Identity Lifecycle Contract', () => {
  describe('lifecycle_tracks_expiry', () => {
    it('should detect valid certificates', () => {
      const notAfter = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 180 days
      const check = generateExpiryCheck('sha256:cert1', notAfter, 'standard', 'production');

      assert.strictEqual(check.status, 'valid');
      assert.ok(check.daysUntilExpiry > 30);
    });

    it('should detect expiring soon', () => {
      const notAfter = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(); // 20 days
      const check = generateExpiryCheck('sha256:cert1', notAfter, 'standard', 'production');

      assert.strictEqual(check.status, 'expiring_soon');
    });

    it('should detect expiring critical', () => {
      const notAfter = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days
      const check = generateExpiryCheck('sha256:cert1', notAfter, 'standard', 'production');

      assert.strictEqual(check.status, 'expiring_critical');
    });

    it('should detect expired', () => {
      const notAfter = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
      const check = generateExpiryCheck('sha256:cert1', notAfter, 'standard', 'production');

      assert.strictEqual(check.status, 'expired');
      assert.ok(check.daysUntilExpiry < 0);
    });

    it('should use tier-specific thresholds', () => {
      // Critical tier has 7-day critical threshold; high tier has 14-day critical threshold
      const notAfter = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days

      const criticalCheck = generateExpiryCheck('sha256:cert1', notAfter, 'critical', 'production');
      const highCheck = generateExpiryCheck('sha256:cert2', notAfter, 'high', 'production');

      // 10 days: for 'critical' tier (7-day threshold), 10 > 7 → expiring_soon
      // 10 days: for 'high' tier (14-day threshold), 10 <= 14 → expiring_critical
      assert.strictEqual(criticalCheck.status, 'expiring_soon');
      assert.strictEqual(highCheck.status, 'expiring_critical');
    });

    it('should include environment in check', () => {
      const notAfter = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const check = generateExpiryCheck('sha256:cert1', notAfter, 'standard', 'staging');

      assert.strictEqual(check.environment, 'staging');
    });
  });

  // ============================================================================
  // Contract: lifecycle_enforces_rotation_cadence
  // ============================================================================

  describe('lifecycle_enforces_rotation_cadence', () => {
    it('should detect compliant rotation', () => {
      const lastRotated = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const check = generateRotationCheck(
        'sha256:binding1',
        'sha256:cert1',
        lastRotated,
        'standard'
      );

      assert.strictEqual(check.status, 'compliant');
    });

    it('should detect rotation due soon', () => {
      const lastRotated = new Date(Date.now() - 340 * 24 * 60 * 60 * 1000).toISOString(); // 340 days ago
      const check = generateRotationCheck(
        'sha256:binding1',
        'sha256:cert1',
        lastRotated,
        'standard'
      );

      assert.strictEqual(check.status, 'due_soon');
    });

    it('should detect overdue rotation', () => {
      const lastRotated = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(); // 400 days ago
      const check = generateRotationCheck(
        'sha256:binding1',
        'sha256:cert1',
        lastRotated,
        'standard'
      );

      assert.strictEqual(check.status, 'overdue');
    });

    it('should detect never rotated', () => {
      const check = generateRotationCheck('sha256:binding1', 'sha256:cert1', null, 'standard');

      assert.strictEqual(check.status, 'never_rotated');
      assert.strictEqual(check.daysSinceRotation, null);
    });

    it('should use stricter policy for critical tier', () => {
      // Critical tier: 90-day max vs standard 365-day
      const lastRotated = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(); // 100 days ago

      const criticalCheck = generateRotationCheck(
        'sha256:b1',
        'sha256:c1',
        lastRotated,
        'critical'
      );
      const standardCheck = generateRotationCheck(
        'sha256:b2',
        'sha256:c2',
        lastRotated,
        'standard'
      );

      assert.strictEqual(criticalCheck.status, 'overdue');
      assert.strictEqual(standardCheck.status, 'compliant');
    });

    it('should calculate next due date', () => {
      const lastRotated = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const check = generateRotationCheck(
        'sha256:binding1',
        'sha256:cert1',
        lastRotated,
        'standard'
      );

      assert.ok(check.nextDue !== null);
      assert.ok(new Date(check.nextDue) > new Date());
    });
  });

  // ============================================================================
  // Contract: lifecycle_generates_compliance_report
  // ============================================================================

  describe('lifecycle_generates_compliance_report', () => {
    it('should aggregate expiry status counts', () => {
      const expiryChecks: ExpiryCheckResult[] = [
        {
          certId: 'sha256:c1',
          status: 'valid',
          notAfter: '',
          daysUntilExpiry: 100,
          serviceTier: 'standard',
          environment: 'prod',
        },
        {
          certId: 'sha256:c2',
          status: 'expiring_critical',
          notAfter: '',
          daysUntilExpiry: 5,
          serviceTier: 'critical',
          environment: 'prod',
        },
        {
          certId: 'sha256:c3',
          status: 'expired',
          notAfter: '',
          daysUntilExpiry: -1,
          serviceTier: 'high',
          environment: 'prod',
        },
      ];

      const report = generateComplianceReport(expiryChecks, []);

      assert.strictEqual(report.summary.expiryByStatus.valid, 1);
      assert.strictEqual(report.summary.expiryByStatus.expiring_critical, 1);
      assert.strictEqual(report.summary.expiryByStatus.expired, 1);
      assert.strictEqual(report.summary.criticalExpiringCount, 2);
    });

    it('should aggregate rotation status counts', () => {
      const rotationChecks: RotationCheckResult[] = [
        {
          bindingId: 'sha256:b1',
          certId: 'sha256:c1',
          status: 'compliant',
          lastRotated: '',
          daysSinceRotation: 30,
          nextDue: '',
          serviceTier: 'standard',
        },
        {
          bindingId: 'sha256:b2',
          certId: 'sha256:c2',
          status: 'overdue',
          lastRotated: '',
          daysSinceRotation: 400,
          nextDue: '',
          serviceTier: 'standard',
        },
      ];

      const report = generateComplianceReport([], rotationChecks);

      assert.strictEqual(report.summary.rotationByStatus.compliant, 1);
      assert.strictEqual(report.summary.rotationByStatus.overdue, 1);
      assert.strictEqual(report.summary.overdueRotationCount, 1);
    });

    it('should break down expiry by tier', () => {
      const expiryChecks: ExpiryCheckResult[] = [
        {
          certId: 'sha256:c1',
          status: 'expiring_critical',
          notAfter: '',
          daysUntilExpiry: 5,
          serviceTier: 'critical',
          environment: 'prod',
        },
        {
          certId: 'sha256:c2',
          status: 'valid',
          notAfter: '',
          daysUntilExpiry: 100,
          serviceTier: 'standard',
          environment: 'prod',
        },
      ];

      const report = generateComplianceReport(expiryChecks, []);

      assert.strictEqual(report.summary.expiryByTier.critical.expiring_critical, 1);
      assert.strictEqual(report.summary.expiryByTier.standard.valid, 1);
    });

    it('should include report metadata', () => {
      const report = generateComplianceReport([], [], 'production');

      assert.ok(report.reportId.startsWith('sha256:'));
      assert.ok(report.generatedAt.length > 0);
      assert.strictEqual(report.environment, 'production');
    });
  });

  // ============================================================================
  // Contract: lifecycle_is_pii_clean
  // ============================================================================

  describe('lifecycle_is_pii_clean', () => {
    it('should use opaque cert IDs', () => {
      const notAfter = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const check = generateExpiryCheck('sha256:cert-abc', notAfter, 'standard', 'production');

      assert.ok(check.certId.startsWith('sha256:'));
    });

    it('should use opaque binding IDs', () => {
      const check = generateRotationCheck(
        'sha256:binding-xyz',
        'sha256:cert-abc',
        null,
        'standard'
      );

      assert.ok(check.bindingId.startsWith('sha256:'));
    });

    it('should use opaque report ID', () => {
      const report = generateComplianceReport([], []);

      assert.ok(report.reportId.startsWith('sha256:'));
    });

    it('should aggregate counts not identities', () => {
      const report = generateComplianceReport(
        [
          {
            certId: 'sha256:c1',
            status: 'valid',
            notAfter: '',
            daysUntilExpiry: 100,
            serviceTier: 'standard',
            environment: 'prod',
          },
        ],
        []
      );

      // Summary contains counts, not cert IDs
      assert.ok(typeof report.summary.totalCertificates === 'number');
      assert.ok(typeof report.summary.expiryByStatus.valid === 'number');
    });

    it('should not expose hostnames in summary', () => {
      const summaryJson = JSON.stringify(computeSummary([], []));

      // Should not contain typical hostname patterns
      assert.ok(!summaryJson.includes('.internal'));
      assert.ok(!summaryJson.includes('.local'));
      assert.ok(!summaryJson.includes('.com'));
    });
  });
});
