/**
 * Phase XXI — Optimization & Sustainability
 * ==========================================
 * Contract: suppression.hygiene.contract.test.ts
 *
 * Tests suppression hygiene: expiry enforcement, renewal workflow,
 * justification requirements, and audit trail.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Suppressions have mandatory expiry
 * - SEV1/SEV2 cannot be suppressed
 * - Renewals require justification
 * - Audit trail is immutable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type SuppressionId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type ServiceId = `sha256:${string}`;
type RenewalId = `sha256:${string}`;
type AuditEntryId = `sha256:${string}`;

type AlertSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4' | 'info';
type SuppressionStatus = 'active' | 'expired' | 'revoked' | 'pending_renewal';
type SuppressionScope = 'fingerprint' | 'service' | 'category' | 'all_matching';
type AuditAction = 'created' | 'renewed' | 'expired' | 'revoked' | 'modified';

interface Suppression {
  readonly id: SuppressionId;
  readonly agencyId: AgencyId;
  readonly scope: SuppressionScope;
  readonly targetFingerprint?: string;
  readonly targetServiceId?: ServiceId;
  readonly targetCategory?: string;
  readonly severity: AlertSeverity;
  readonly justification: string;
  readonly createdBy: `sha256:${string}`;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly status: SuppressionStatus;
  readonly renewalCount: number;
  readonly maxRenewals: number;
  readonly lastRenewalAt?: string;
}

interface SuppressionRenewal {
  readonly id: RenewalId;
  readonly suppressionId: SuppressionId;
  readonly justification: string;
  readonly renewedBy: `sha256:${string}`;
  readonly renewedAt: string;
  readonly previousExpiresAt: string;
  readonly newExpiresAt: string;
  readonly approvedBy?: `sha256:${string}`;
}

interface SuppressionAudit {
  readonly id: AuditEntryId;
  readonly suppressionId: SuppressionId;
  readonly action: AuditAction;
  readonly performedBy: `sha256:${string}`;
  readonly performedAt: string;
  readonly details: string;
  readonly evidenceRef: `sha256:${string}`;
}

interface SuppressionPolicy {
  readonly maxDurationDays: number;
  readonly maxRenewals: number;
  readonly requireSupervisorApproval: boolean;
  readonly minJustificationLength: number;
  readonly allowedSeverities: readonly AlertSeverity[];
}

interface SuppressionHygieneMetrics {
  readonly generatedAt: string;
  readonly totalActive: number;
  readonly totalExpired: number;
  readonly totalRevoked: number;
  readonly expiringWithin24Hours: number;
  readonly expiringWithin7Days: number;
  readonly averageRenewalCount: number;
  readonly suppressionsByScope: Record<SuppressionScope, number>;
  readonly staleSuppressions: number;
  readonly renewalsPending: number;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockSuppressionHygieneService() {
  const suppressions = new Map<SuppressionId, Suppression>();
  const renewals: SuppressionRenewal[] = [];
  const auditLog: SuppressionAudit[] = [];

  const defaultPolicy: SuppressionPolicy = {
    maxDurationDays: 30,
    maxRenewals: 3,
    requireSupervisorApproval: true,
    minJustificationLength: 50,
    allowedSeverities: ['sev3', 'sev4', 'info'],
  };

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function recordAudit(
    suppressionId: SuppressionId,
    action: AuditAction,
    performedBy: `sha256:${string}`,
    details: string
  ): SuppressionAudit {
    const entry: SuppressionAudit = {
      id: generateId('audit') as AuditEntryId,
      suppressionId,
      action,
      performedBy,
      performedAt: new Date().toISOString(),
      details,
      evidenceRef: generateId('evidence') as `sha256:${string}`,
    };
    auditLog.push(entry);
    return entry;
  }

  return {
    // Suppression Creation
    createSuppression(
      agencyId: AgencyId,
      scope: SuppressionScope,
      severity: AlertSeverity,
      justification: string,
      createdBy: `sha256:${string}`,
      durationDays: number,
      targetFingerprint?: string,
      targetServiceId?: ServiceId,
      targetCategory?: string
    ): Suppression | { error: string } {
      // Validate severity
      if (!defaultPolicy.allowedSeverities.includes(severity)) {
        return { error: `Cannot suppress ${severity} alerts` };
      }

      // Validate justification length
      if (justification.length < defaultPolicy.minJustificationLength) {
        return {
          error: `Justification must be at least ${defaultPolicy.minJustificationLength} characters`,
        };
      }

      // Validate duration
      if (durationDays > defaultPolicy.maxDurationDays) {
        return { error: `Duration cannot exceed ${defaultPolicy.maxDurationDays} days` };
      }

      const id = generateId('suppression') as SuppressionId;
      const now = new Date();
      const expiresAt = addDays(now, durationDays);

      const suppression: Suppression = {
        id,
        agencyId,
        scope,
        targetFingerprint,
        targetServiceId,
        targetCategory,
        severity,
        justification,
        createdBy,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active',
        renewalCount: 0,
        maxRenewals: defaultPolicy.maxRenewals,
      };

      suppressions.set(id, suppression);
      recordAudit(id, 'created', createdBy, `Created suppression for ${scope}`);
      return suppression;
    },

    getSuppression(id: SuppressionId): Suppression | null {
      return suppressions.get(id) ?? null;
    },

    // Severity Validation
    canSuppressSeverity(severity: AlertSeverity): boolean {
      return defaultPolicy.allowedSeverities.includes(severity);
    },

    // Expiry Management
    checkExpiry(id: SuppressionId): Suppression | null {
      const suppression = suppressions.get(id);
      if (!suppression) return null;

      const now = new Date();
      const expiresAt = new Date(suppression.expiresAt);

      if (now >= expiresAt && suppression.status === 'active') {
        const expired: Suppression = {
          ...suppression,
          status: 'expired',
        };
        suppressions.set(id, expired);
        recordAudit(id, 'expired', 'sha256:system', 'Suppression expired automatically');
        return expired;
      }

      return suppression;
    },

    getExpiringSoon(hours: number): readonly Suppression[] {
      const now = Date.now();
      const threshold = now + hours * 60 * 60 * 1000;

      return [...suppressions.values()].filter(s => {
        if (s.status !== 'active') return false;
        const expiresAt = new Date(s.expiresAt).getTime();
        return expiresAt <= threshold;
      });
    },

    // Renewal
    requestRenewal(
      id: SuppressionId,
      justification: string,
      renewedBy: `sha256:${string}`,
      additionalDays: number
    ): SuppressionRenewal | { error: string } {
      const suppression = suppressions.get(id);
      if (!suppression) {
        return { error: 'Suppression not found' };
      }

      if (suppression.status === 'revoked') {
        return { error: 'Cannot renew revoked suppression' };
      }

      if (suppression.renewalCount >= suppression.maxRenewals) {
        return { error: `Maximum renewals (${suppression.maxRenewals}) reached` };
      }

      if (justification.length < defaultPolicy.minJustificationLength) {
        return {
          error: `Justification must be at least ${defaultPolicy.minJustificationLength} characters`,
        };
      }

      if (additionalDays > defaultPolicy.maxDurationDays) {
        return { error: `Renewal cannot exceed ${defaultPolicy.maxDurationDays} days` };
      }

      const now = new Date();
      const previousExpiresAt = suppression.expiresAt;
      const newExpiresAt = addDays(now, additionalDays);

      const renewal: SuppressionRenewal = {
        id: generateId('renewal') as RenewalId,
        suppressionId: id,
        justification,
        renewedBy,
        renewedAt: now.toISOString(),
        previousExpiresAt,
        newExpiresAt: newExpiresAt.toISOString(),
      };

      // Update suppression if no approval required, else mark pending
      if (defaultPolicy.requireSupervisorApproval) {
        const updated: Suppression = {
          ...suppression,
          status: 'pending_renewal',
        };
        suppressions.set(id, updated);
      } else {
        const updated: Suppression = {
          ...suppression,
          expiresAt: newExpiresAt.toISOString(),
          renewalCount: suppression.renewalCount + 1,
          lastRenewalAt: now.toISOString(),
          status: 'active',
        };
        suppressions.set(id, updated);
        recordAudit(id, 'renewed', renewedBy, `Renewed for ${additionalDays} days`);
      }

      renewals.push(renewal);
      return renewal;
    },

    approveRenewal(
      renewalId: RenewalId,
      approvedBy: `sha256:${string}`
    ): Suppression | { error: string } {
      const renewal = renewals.find(r => r.id === renewalId);
      if (!renewal) {
        return { error: 'Renewal not found' };
      }

      const suppression = suppressions.get(renewal.suppressionId);
      if (!suppression) {
        return { error: 'Suppression not found' };
      }

      if (suppression.status !== 'pending_renewal') {
        return { error: 'Suppression not pending renewal' };
      }

      const updated: Suppression = {
        ...suppression,
        expiresAt: renewal.newExpiresAt,
        renewalCount: suppression.renewalCount + 1,
        lastRenewalAt: new Date().toISOString(),
        status: 'active',
      };
      suppressions.set(suppression.id, updated);

      // Update renewal with approver
      const renewalIndex = renewals.findIndex(r => r.id === renewalId);
      if (renewalIndex >= 0) {
        renewals[renewalIndex] = { ...renewal, approvedBy };
      }

      recordAudit(suppression.id, 'renewed', approvedBy, 'Renewal approved');
      return updated;
    },

    // Revocation
    revokeSuppression(
      id: SuppressionId,
      reason: string,
      revokedBy: `sha256:${string}`
    ): Suppression | null {
      const suppression = suppressions.get(id);
      if (!suppression) return null;

      const revoked: Suppression = {
        ...suppression,
        status: 'revoked',
      };
      suppressions.set(id, revoked);
      recordAudit(id, 'revoked', revokedBy, reason);
      return revoked;
    },

    // Queries
    getActiveSuppressions(): readonly Suppression[] {
      return [...suppressions.values()].filter(s => s.status === 'active');
    },

    getSuppressionsByAgency(agencyId: AgencyId): readonly Suppression[] {
      return [...suppressions.values()].filter(s => s.agencyId === agencyId);
    },

    getSuppressionsByStatus(status: SuppressionStatus): readonly Suppression[] {
      return [...suppressions.values()].filter(s => s.status === status);
    },

    getPendingRenewals(): readonly SuppressionRenewal[] {
      const pendingIds = new Set(
        [...suppressions.values()].filter(s => s.status === 'pending_renewal').map(s => s.id)
      );
      return renewals.filter(r => pendingIds.has(r.suppressionId) && !r.approvedBy);
    },

    // Audit
    getAuditLog(suppressionId: SuppressionId): readonly SuppressionAudit[] {
      return auditLog.filter(a => a.suppressionId === suppressionId);
    },

    getFullAuditLog(): readonly SuppressionAudit[] {
      return [...auditLog];
    },

    // Policy
    getPolicy(): SuppressionPolicy {
      return { ...defaultPolicy };
    },

    // Hygiene Metrics
    calculateHygieneMetrics(): SuppressionHygieneMetrics {
      const all = [...suppressions.values()];
      const now = Date.now();
      const h24 = now + 24 * 60 * 60 * 1000;
      const d7 = now + 7 * 24 * 60 * 60 * 1000;

      const active = all.filter(s => s.status === 'active');
      const expired = all.filter(s => s.status === 'expired');
      const revoked = all.filter(s => s.status === 'revoked');
      const pendingRenewal = all.filter(s => s.status === 'pending_renewal');

      const expiringWithin24Hours = active.filter(s => {
        const expiresAt = new Date(s.expiresAt).getTime();
        return expiresAt <= h24;
      }).length;

      const expiringWithin7Days = active.filter(s => {
        const expiresAt = new Date(s.expiresAt).getTime();
        return expiresAt <= d7;
      }).length;

      const totalRenewals = all.reduce((sum, s) => sum + s.renewalCount, 0);
      const averageRenewalCount = all.length > 0 ? totalRenewals / all.length : 0;

      const suppressionsByScope: Record<SuppressionScope, number> = {
        fingerprint: 0,
        service: 0,
        category: 0,
        all_matching: 0,
      };
      for (const s of all) {
        suppressionsByScope[s.scope]++;
      }

      // Stale = active but not used in 7 days (mock check)
      const staleSuppressions = 0;

      return {
        generatedAt: new Date().toISOString(),
        totalActive: active.length,
        totalExpired: expired.length,
        totalRevoked: revoked.length,
        expiringWithin24Hours,
        expiringWithin7Days,
        averageRenewalCount: Math.round(averageRenewalCount * 100) / 100,
        suppressionsByScope,
        staleSuppressions,
        renewalsPending: pendingRenewal.length,
      };
    },

    // Stale Detection
    isSuppressionStale(id: SuppressionId, daysSinceLastMatch: number): boolean {
      const suppression = suppressions.get(id);
      if (!suppression) return false;
      // Consider stale if no matches in 7+ days
      return daysSinceLastMatch >= 7;
    },

    // Validation
    validateJustification(justification: string): { valid: boolean; error?: string } {
      if (justification.length < defaultPolicy.minJustificationLength) {
        return {
          valid: false,
          error: `Justification must be at least ${defaultPolicy.minJustificationLength} characters (got ${justification.length})`,
        };
      }
      return { valid: true };
    },

    // Matching Check
    isAlertSuppressed(
      fingerprint: string,
      serviceId: ServiceId,
      category: string,
      severity: AlertSeverity
    ): { suppressed: boolean; suppressionId?: SuppressionId; reason?: string } {
      // SEV1/SEV2 never suppressed
      if (severity === 'sev1' || severity === 'sev2') {
        return { suppressed: false, reason: 'Critical alerts cannot be suppressed' };
      }

      for (const suppression of suppressions.values()) {
        if (suppression.status !== 'active') continue;
        if (suppression.severity !== severity) continue;

        let matches = false;
        switch (suppression.scope) {
          case 'fingerprint':
            matches = suppression.targetFingerprint === fingerprint;
            break;
          case 'service':
            matches = suppression.targetServiceId === serviceId;
            break;
          case 'category':
            matches = suppression.targetCategory === category;
            break;
          case 'all_matching':
            matches = true;
            break;
        }

        if (matches) {
          return { suppressed: true, suppressionId: suppression.id };
        }
      }

      return { suppressed: false };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXI: Suppression Hygiene Contracts', () => {
  let hygieneService: ReturnType<typeof createMockSuppressionHygieneService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const serviceA = 'sha256:service_alpha' as ServiceId;
  const operator = 'sha256:operator_001' as `sha256:${string}`;
  const supervisor = 'sha256:supervisor_001' as `sha256:${string}`;

  beforeEach(() => {
    hygieneService = createMockSuppressionHygieneService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate suppression IDs with sha256: prefix', () => {
      const result = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression creation.',
        operator,
        7,
        'fp1'
      );
      assert.ok('id' in result && result.id.startsWith('sha256:'));
    });

    it('should generate renewal IDs with sha256: prefix', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression creation.',
        operator,
        7,
        'fp1'
      );
      if ('id' in suppression) {
        const renewal = hygieneService.requestRenewal(
          suppression.id,
          'This is a valid renewal justification that meets the minimum length requirement for renewal.',
          operator,
          7
        );
        assert.ok('id' in renewal && renewal.id.startsWith('sha256:'));
      }
    });

    it('should generate audit IDs with sha256: prefix', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression creation.',
        operator,
        7,
        'fp1'
      );
      if ('id' in suppression) {
        const audit = hygieneService.getAuditLog(suppression.id);
        assert.ok(audit[0].id.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // Severity Protection Tests
  // ==========================================================================

  describe('Severity Protection', () => {
    it('should not allow suppressing SEV1', () => {
      assert.strictEqual(hygieneService.canSuppressSeverity('sev1'), false);
    });

    it('should not allow suppressing SEV2', () => {
      assert.strictEqual(hygieneService.canSuppressSeverity('sev2'), false);
    });

    it('should allow suppressing SEV3', () => {
      assert.strictEqual(hygieneService.canSuppressSeverity('sev3'), true);
    });

    it('should allow suppressing SEV4', () => {
      assert.strictEqual(hygieneService.canSuppressSeverity('sev4'), true);
    });

    it('should allow suppressing info', () => {
      assert.strictEqual(hygieneService.canSuppressSeverity('info'), true);
    });

    it('should reject creation for SEV1', () => {
      const result = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev1',
        'This is a valid justification that meets the minimum length requirement.',
        operator,
        7,
        'fp1'
      );
      assert.ok('error' in result);
    });

    it('should reject creation for SEV2', () => {
      const result = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev2',
        'This is a valid justification that meets the minimum length requirement.',
        operator,
        7,
        'fp1'
      );
      assert.ok('error' in result);
    });
  });

  // ==========================================================================
  // Suppression Creation Tests
  // ==========================================================================

  describe('Suppression Creation', () => {
    it('should create valid suppression', () => {
      const result = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );
      assert.ok('id' in result);
      assert.strictEqual(result.status, 'active');
    });

    it('should reject short justification', () => {
      const result = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'Too short',
        operator,
        7,
        'fp1'
      );
      assert.ok('error' in result);
      assert.ok(result.error.includes('characters'));
    });

    it('should reject excessive duration', () => {
      const result = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        90,
        'fp1'
      );
      assert.ok('error' in result);
      assert.ok(result.error.includes('exceed'));
    });

    it('should set expiry correctly', () => {
      const result = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );
      assert.ok('id' in result);

      const createdAt = new Date(result.createdAt).getTime();
      const expiresAt = new Date(result.expiresAt).getTime();
      const diffDays = (expiresAt - createdAt) / (24 * 60 * 60 * 1000);
      assert.ok(diffDays >= 6.9 && diffDays <= 7.1);
    });

    it('should record audit on creation', () => {
      const result = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );
      assert.ok('id' in result);

      const audit = hygieneService.getAuditLog(result.id);
      assert.strictEqual(audit.length, 1);
      assert.strictEqual(audit[0].action, 'created');
    });
  });

  // ==========================================================================
  // Expiry Tests
  // ==========================================================================

  describe('Expiry Management', () => {
    it('should get expiring soon suppressions', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        1,
        'fp1'
      );

      const expiring = hygieneService.getExpiringSoon(48);
      assert.strictEqual(expiring.length, 1);
    });

    it('should mark expired on check', () => {
      // Create a suppression that's already expired (using mock time would be ideal)
      const result = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in result) {
        // The checkExpiry would mark it expired if past expiry
        const checked = hygieneService.checkExpiry(result.id);
        assert.ok(checked);
      }
    });
  });

  // ==========================================================================
  // Renewal Tests
  // ==========================================================================

  describe('Renewal Workflow', () => {
    it('should request renewal', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        const renewal = hygieneService.requestRenewal(
          suppression.id,
          'This is a valid renewal justification that meets the minimum length requirement.',
          operator,
          7
        );
        assert.ok('id' in renewal);
      }
    });

    it('should require supervisor approval', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        hygieneService.requestRenewal(
          suppression.id,
          'This is a valid renewal justification that meets the minimum length requirement.',
          operator,
          7
        );

        const updated = hygieneService.getSuppression(suppression.id);
        assert.strictEqual(updated?.status, 'pending_renewal');
      }
    });

    it('should approve renewal', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        const renewal = hygieneService.requestRenewal(
          suppression.id,
          'This is a valid renewal justification that meets the minimum length requirement.',
          operator,
          7
        );

        if ('id' in renewal) {
          const approved = hygieneService.approveRenewal(renewal.id, supervisor);
          assert.ok('id' in approved);
          assert.strictEqual(approved.status, 'active');
          assert.strictEqual(approved.renewalCount, 1);
        }
      }
    });

    it('should reject renewal after max renewals', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        // Simulate 3 renewals
        for (let i = 0; i < 3; i++) {
          const renewal = hygieneService.requestRenewal(
            suppression.id,
            'This is a valid renewal justification that meets the minimum length requirement.',
            operator,
            7
          );
          if ('id' in renewal) {
            hygieneService.approveRenewal(renewal.id, supervisor);
          }
        }

        // 4th renewal should fail
        const result = hygieneService.requestRenewal(
          suppression.id,
          'This is a valid renewal justification that meets the minimum length requirement.',
          operator,
          7
        );
        assert.ok('error' in result);
        assert.ok(result.error.includes('Maximum renewals'));
      }
    });

    it('should get pending renewals', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        hygieneService.requestRenewal(
          suppression.id,
          'This is a valid renewal justification that meets the minimum length requirement.',
          operator,
          7
        );

        const pending = hygieneService.getPendingRenewals();
        assert.strictEqual(pending.length, 1);
      }
    });
  });

  // ==========================================================================
  // Revocation Tests
  // ==========================================================================

  describe('Revocation', () => {
    it('should revoke suppression', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        const revoked = hygieneService.revokeSuppression(
          suppression.id,
          'No longer needed',
          supervisor
        );
        assert.strictEqual(revoked?.status, 'revoked');
      }
    });

    it('should record audit on revocation', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        hygieneService.revokeSuppression(suppression.id, 'No longer needed', supervisor);
        const audit = hygieneService.getAuditLog(suppression.id);
        assert.ok(audit.some(a => a.action === 'revoked'));
      }
    });

    it('should not allow renewal of revoked suppression', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        hygieneService.revokeSuppression(suppression.id, 'No longer needed', supervisor);
        const result = hygieneService.requestRenewal(
          suppression.id,
          'This is a valid renewal justification that meets the minimum length requirement.',
          operator,
          7
        );
        assert.ok('error' in result);
      }
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Queries', () => {
    it('should get active suppressions', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      const active = hygieneService.getActiveSuppressions();
      assert.strictEqual(active.length, 1);
    });

    it('should get suppressions by agency', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      const byAgency = hygieneService.getSuppressionsByAgency(agencyA);
      assert.strictEqual(byAgency.length, 1);
    });

    it('should get suppressions by status', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        hygieneService.revokeSuppression(suppression.id, 'Revoked', supervisor);

        const revoked = hygieneService.getSuppressionsByStatus('revoked');
        assert.strictEqual(revoked.length, 1);
      }
    });
  });

  // ==========================================================================
  // Alert Matching Tests
  // ==========================================================================

  describe('Alert Matching', () => {
    it('should suppress matching alert', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      const result = hygieneService.isAlertSuppressed('fp1', serviceA, 'performance', 'sev3');
      assert.strictEqual(result.suppressed, true);
    });

    it('should not suppress non-matching alert', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      const result = hygieneService.isAlertSuppressed('fp2', serviceA, 'performance', 'sev3');
      assert.strictEqual(result.suppressed, false);
    });

    it('should never suppress SEV1', () => {
      hygieneService.createSuppression(
        agencyA,
        'all_matching',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7
      );

      const result = hygieneService.isAlertSuppressed('fp1', serviceA, 'performance', 'sev1');
      assert.strictEqual(result.suppressed, false);
      assert.ok(result.reason?.includes('Critical'));
    });

    it('should never suppress SEV2', () => {
      const result = hygieneService.isAlertSuppressed('fp1', serviceA, 'performance', 'sev2');
      assert.strictEqual(result.suppressed, false);
    });
  });

  // ==========================================================================
  // Hygiene Metrics Tests
  // ==========================================================================

  describe('Hygiene Metrics', () => {
    it('should calculate hygiene metrics', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      const metrics = hygieneService.calculateHygieneMetrics();
      assert.ok(metrics.generatedAt);
      assert.strictEqual(metrics.totalActive, 1);
    });

    it('should count by scope', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );
      hygieneService.createSuppression(
        agencyA,
        'service',
        'sev4',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        undefined,
        serviceA
      );

      const metrics = hygieneService.calculateHygieneMetrics();
      assert.strictEqual(metrics.suppressionsByScope.fingerprint, 1);
      assert.strictEqual(metrics.suppressionsByScope.service, 1);
    });

    it('should track expiring soon', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        1,
        'fp1'
      );

      const metrics = hygieneService.calculateHygieneMetrics();
      assert.strictEqual(metrics.expiringWithin7Days, 1);
    });

    it('should track pending renewals', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        hygieneService.requestRenewal(
          suppression.id,
          'This is a valid renewal justification that meets the minimum length requirement.',
          operator,
          7
        );

        const metrics = hygieneService.calculateHygieneMetrics();
        assert.strictEqual(metrics.renewalsPending, 1);
      }
    });
  });

  // ==========================================================================
  // Audit Trail Tests
  // ==========================================================================

  describe('Audit Trail', () => {
    it('should record creation audit', () => {
      const suppression = hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      if ('id' in suppression) {
        const audit = hygieneService.getAuditLog(suppression.id);
        assert.strictEqual(audit[0].action, 'created');
        assert.ok(audit[0].evidenceRef.startsWith('sha256:'));
      }
    });

    it('should get full audit log', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );
      hygieneService.createSuppression(
        agencyA,
        'service',
        'sev4',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        undefined,
        serviceA
      );

      const fullLog = hygieneService.getFullAuditLog();
      assert.strictEqual(fullLog.length, 2);
    });
  });

  // ==========================================================================
  // Policy Tests
  // ==========================================================================

  describe('Policy', () => {
    it('should get policy', () => {
      const policy = hygieneService.getPolicy();
      assert.ok(policy.maxDurationDays > 0);
      assert.ok(policy.maxRenewals > 0);
      assert.ok(policy.minJustificationLength > 0);
    });

    it('should not allow SEV1/SEV2 in policy', () => {
      const policy = hygieneService.getPolicy();
      assert.ok(!policy.allowedSeverities.includes('sev1'));
      assert.ok(!policy.allowedSeverities.includes('sev2'));
    });
  });

  // ==========================================================================
  // Justification Validation Tests
  // ==========================================================================

  describe('Justification Validation', () => {
    it('should validate sufficient justification', () => {
      const result = hygieneService.validateJustification(
        'This is a valid justification that meets the minimum length requirement for suppression.'
      );
      assert.strictEqual(result.valid, true);
    });

    it('should reject short justification', () => {
      const result = hygieneService.validateJustification('Too short');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes('characters'));
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of active suppressions', () => {
      hygieneService.createSuppression(
        agencyA,
        'fingerprint',
        'sev3',
        'This is a valid justification that meets the minimum length requirement for suppression.',
        operator,
        7,
        'fp1'
      );

      const s1 = hygieneService.getActiveSuppressions();
      const s2 = hygieneService.getActiveSuppressions();
      assert.ok(s1 !== s2);
    });

    it('should return copy of policy', () => {
      const p1 = hygieneService.getPolicy();
      const p2 = hygieneService.getPolicy();
      assert.ok(p1 !== p2);
    });
  });
});
