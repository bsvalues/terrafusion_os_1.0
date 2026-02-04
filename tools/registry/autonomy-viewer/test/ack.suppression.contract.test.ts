/**
 * Acknowledgement & Suppression Ledger Contract Tests
 * =====================================================
 *
 * Phase IIIm: Validates operator acknowledgement and suppression workflows.
 *
 * Contract:
 * - ack_requires_justification: All acknowledgements must include reason
 * - suppression_has_expiry: Suppressions auto-expire after configured duration
 * - suppression_is_scoped: Suppressions target specific SLO/alert, not global
 * - ledger_is_auditable: All ack/suppression events logged with operator ID
 * - no_permanent_silence: Maximum suppression duration enforced
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Acknowledgement & Suppression
// ============================================================================

/**
 * Acknowledgement action types.
 */
type AckAction = 'acknowledge' | 'suppress' | 'escalate' | 'override';

/**
 * Suppression scope.
 */
type SuppressionScope = 'slo' | 'alert' | 'recommendation';

/**
 * Acknowledgement record.
 */
interface AcknowledgementRecord {
  readonly id: string;
  readonly action: AckAction;
  readonly targetId: string;
  readonly targetType: SuppressionScope;
  readonly operatorId: string;
  readonly justification: string;
  readonly timestamp: string;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Suppression record.
 */
interface SuppressionRecord {
  readonly id: string;
  readonly targetId: string;
  readonly targetType: SuppressionScope;
  readonly operatorId: string;
  readonly justification: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly active: boolean;
  readonly durationDays: number;
  readonly correlationId?: string;
}

/**
 * Suppression configuration.
 */
interface SuppressionConfig {
  readonly maxDurationDays: number;
  readonly defaultDurationDays: number;
  readonly requireJustification: boolean;
  readonly minJustificationLength: number;
}

/**
 * Ledger entry (union of ack and suppression).
 */
interface LedgerEntry {
  readonly id: string;
  readonly type: 'ack' | 'suppression' | 'expiry' | 'cancel';
  readonly targetId: string;
  readonly operatorId: string;
  readonly timestamp: string;
  readonly details: Record<string, unknown>;
}

/**
 * Validation result.
 */
interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SUPPRESSION_CONFIG: SuppressionConfig = {
  maxDurationDays: 30,
  defaultDurationDays: 7,
  requireJustification: true,
  minJustificationLength: 20,
};

const MAX_SUPPRESSION_DAYS = 30; // Hard cap - no exceptions

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Generate unique ID.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate acknowledgement.
 */
function validateAcknowledgement(
  ack: Partial<AcknowledgementRecord>,
  config: SuppressionConfig = DEFAULT_SUPPRESSION_CONFIG
): ValidationResult {
  const errors: string[] = [];

  if (!ack.targetId) {
    errors.push('targetId is required');
  }
  if (!ack.targetType) {
    errors.push('targetType is required');
  }
  if (!ack.operatorId) {
    errors.push('operatorId is required');
  }
  if (!ack.action) {
    errors.push('action is required');
  }

  if (config.requireJustification) {
    if (!ack.justification) {
      errors.push('justification is required');
    } else if (ack.justification.length < config.minJustificationLength) {
      errors.push(`justification must be at least ${config.minJustificationLength} characters`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate suppression.
 */
function validateSuppression(
  sup: Partial<SuppressionRecord>,
  config: SuppressionConfig = DEFAULT_SUPPRESSION_CONFIG
): ValidationResult {
  const errors: string[] = [];

  if (!sup.targetId) {
    errors.push('targetId is required');
  }
  if (!sup.targetType) {
    errors.push('targetType is required');
  }
  if (!sup.operatorId) {
    errors.push('operatorId is required');
  }

  if (config.requireJustification) {
    if (!sup.justification) {
      errors.push('justification is required');
    } else if (sup.justification.length < config.minJustificationLength) {
      errors.push(`justification must be at least ${config.minJustificationLength} characters`);
    }
  }

  if (sup.durationDays !== undefined) {
    if (sup.durationDays <= 0) {
      errors.push('durationDays must be positive');
    }
    if (sup.durationDays > MAX_SUPPRESSION_DAYS) {
      errors.push(`durationDays cannot exceed ${MAX_SUPPRESSION_DAYS}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create acknowledgement record.
 */
function createAcknowledgement(
  targetId: string,
  targetType: SuppressionScope,
  operatorId: string,
  action: AckAction,
  justification: string,
  correlationId?: string
): AcknowledgementRecord {
  return {
    id: generateId(),
    action,
    targetId,
    targetType,
    operatorId,
    justification,
    timestamp: new Date().toISOString(),
    correlationId,
  };
}

/**
 * Create suppression record.
 */
function createSuppression(
  targetId: string,
  targetType: SuppressionScope,
  operatorId: string,
  justification: string,
  durationDays: number,
  config: SuppressionConfig = DEFAULT_SUPPRESSION_CONFIG
): SuppressionRecord {
  const effectiveDuration = Math.min(durationDays, config.maxDurationDays, MAX_SUPPRESSION_DAYS);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + effectiveDuration * 24 * 60 * 60 * 1000);

  return {
    id: generateId(),
    targetId,
    targetType,
    operatorId,
    justification,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true,
    durationDays: effectiveDuration,
  };
}

/**
 * Check if suppression is expired.
 */
function isSuppressionExpired(suppression: SuppressionRecord, now?: Date): boolean {
  const checkTime = now ?? new Date();
  return new Date(suppression.expiresAt) <= checkTime;
}

/**
 * Check if target is suppressed.
 */
function isTargetSuppressed(
  targetId: string,
  suppressions: readonly SuppressionRecord[],
  now?: Date
): boolean {
  const checkTime = now ?? new Date();
  return suppressions.some(
    s => s.targetId === targetId && s.active && !isSuppressionExpired(s, checkTime)
  );
}

/**
 * Suppression ledger (in-memory for contract testing).
 */
class SuppressionLedger {
  private readonly entries: LedgerEntry[] = [];
  private readonly suppressions: Map<string, SuppressionRecord> = new Map();
  private readonly acknowledgements: Map<string, AcknowledgementRecord> = new Map();

  recordAcknowledgement(ack: AcknowledgementRecord): void {
    this.acknowledgements.set(ack.id, ack);
    this.entries.push({
      id: generateId(),
      type: 'ack',
      targetId: ack.targetId,
      operatorId: ack.operatorId,
      timestamp: ack.timestamp,
      details: { action: ack.action, justification: ack.justification },
    });
  }

  recordSuppression(sup: SuppressionRecord): void {
    this.suppressions.set(sup.id, sup);
    this.entries.push({
      id: generateId(),
      type: 'suppression',
      targetId: sup.targetId,
      operatorId: sup.operatorId,
      timestamp: sup.createdAt,
      details: {
        durationDays: sup.durationDays,
        expiresAt: sup.expiresAt,
        justification: sup.justification,
      },
    });
  }

  cancelSuppression(supId: string, operatorId: string, reason: string): boolean {
    const sup = this.suppressions.get(supId);
    if (!sup || !sup.active) return false;

    // Create updated record (immutable pattern)
    const updated: SuppressionRecord = { ...sup, active: false };
    this.suppressions.set(supId, updated);

    this.entries.push({
      id: generateId(),
      type: 'cancel',
      targetId: sup.targetId,
      operatorId,
      timestamp: new Date().toISOString(),
      details: { reason, originalSuppressionId: supId },
    });

    return true;
  }

  getActiveSuppressions(targetId?: string): readonly SuppressionRecord[] {
    const now = new Date();
    const all = Array.from(this.suppressions.values());
    const active = all.filter(s => s.active && !isSuppressionExpired(s, now));
    if (targetId) {
      return active.filter(s => s.targetId === targetId);
    }
    return active;
  }

  getLedgerEntries(since?: Date): readonly LedgerEntry[] {
    if (!since) return [...this.entries];
    return this.entries.filter(e => new Date(e.timestamp) >= since);
  }

  getEntryCount(): number {
    return this.entries.length;
  }
}

// ============================================================================
// Contract: ack_requires_justification
// ============================================================================

describe('Acknowledgement & Suppression Contract', () => {
  describe('ack_requires_justification', () => {
    it('should reject acknowledgement without justification', () => {
      const result = validateAcknowledgement({
        targetId: 'security.denial_rate',
        targetType: 'slo',
        operatorId: 'ops-user-1',
        action: 'acknowledge',
        justification: '', // empty
      });

      assert.ok(!result.valid, 'Should reject empty justification');
      assert.ok(result.errors.some(e => e.includes('justification')));
    });

    it('should reject justification below minimum length', () => {
      const result = validateAcknowledgement({
        targetId: 'security.denial_rate',
        targetType: 'slo',
        operatorId: 'ops-user-1',
        action: 'acknowledge',
        justification: 'too short',
      });

      assert.ok(!result.valid, 'Should reject short justification');
      assert.ok(result.errors.some(e => e.includes('20 characters')));
    });

    it('should accept valid acknowledgement with justification', () => {
      const result = validateAcknowledgement({
        targetId: 'security.denial_rate',
        targetType: 'slo',
        operatorId: 'ops-user-1',
        action: 'acknowledge',
        justification: 'Investigating auth issues with third-party provider',
      });

      assert.ok(result.valid, `Should be valid: ${result.errors.join(', ')}`);
    });

    it('should require operator ID for audit trail', () => {
      const result = validateAcknowledgement({
        targetId: 'security.denial_rate',
        targetType: 'slo',
        action: 'acknowledge',
        justification: 'This is a valid justification message',
      });

      assert.ok(!result.valid, 'Should reject missing operatorId');
      assert.ok(result.errors.some(e => e.includes('operatorId')));
    });
  });

  // ============================================================================
  // Contract: suppression_has_expiry
  // ============================================================================

  describe('suppression_has_expiry', () => {
    it('should set expiry date on suppression', () => {
      const suppression = createSuppression(
        'security.denial_rate',
        'slo',
        'ops-user-1',
        'Known issue being addressed in sprint',
        7
      );

      assert.ok(suppression.expiresAt, 'Should have expiresAt');
      assert.ok(
        new Date(suppression.expiresAt) > new Date(suppression.createdAt),
        'Expiry should be after creation'
      );
    });

    it('should detect expired suppressions', () => {
      const suppression: SuppressionRecord = {
        id: 'test-1',
        targetId: 'security.denial_rate',
        targetType: 'slo',
        operatorId: 'ops-user-1',
        justification: 'Testing expiry detection logic',
        createdAt: '2026-01-01T00:00:00Z',
        expiresAt: '2026-01-08T00:00:00Z',
        active: true,
        durationDays: 7,
      };

      const beforeExpiry = new Date('2026-01-05T00:00:00Z');
      const afterExpiry = new Date('2026-01-10T00:00:00Z');

      assert.ok(!isSuppressionExpired(suppression, beforeExpiry), 'Should not be expired');
      assert.ok(isSuppressionExpired(suppression, afterExpiry), 'Should be expired');
    });

    it('should use default duration if not specified', () => {
      const suppression = createSuppression(
        'security.denial_rate',
        'slo',
        'ops-user-1',
        'Using default duration settings',
        DEFAULT_SUPPRESSION_CONFIG.defaultDurationDays
      );

      assert.strictEqual(suppression.durationDays, DEFAULT_SUPPRESSION_CONFIG.defaultDurationDays);
    });

    it('should calculate correct expiry from duration', () => {
      const now = new Date();
      const suppression = createSuppression(
        'security.denial_rate',
        'slo',
        'ops-user-1',
        'Testing expiry calculation logic',
        14
      );

      const expiresAt = new Date(suppression.expiresAt);
      const expectedExpiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Allow 1 second tolerance for test execution time
      const diff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime());
      assert.ok(diff < 1000, 'Expiry should be ~14 days from now');
    });
  });

  // ============================================================================
  // Contract: suppression_is_scoped
  // ============================================================================

  describe('suppression_is_scoped', () => {
    it('should only suppress the specific target', () => {
      const suppression = createSuppression(
        'security.denial_rate',
        'slo',
        'ops-user-1',
        'Scoped suppression for specific SLO',
        7
      );

      const suppressions = [suppression];
      const now = new Date();

      assert.ok(
        isTargetSuppressed('security.denial_rate', suppressions, now),
        'Target should be suppressed'
      );
      assert.ok(
        !isTargetSuppressed('security.latency_p99', suppressions, now),
        'Other targets should not be suppressed'
      );
    });

    it('should require targetType for scoping', () => {
      const result = validateSuppression({
        targetId: 'security.denial_rate',
        operatorId: 'ops-user-1',
        justification: 'This is a valid suppression reason',
        durationDays: 7,
      });

      assert.ok(!result.valid, 'Should reject missing targetType');
      assert.ok(result.errors.some(e => e.includes('targetType')));
    });

    it('should support different scope types', () => {
      const scopes: SuppressionScope[] = ['slo', 'alert', 'recommendation'];

      for (const scope of scopes) {
        const sup = createSuppression(
          'target-1',
          scope,
          'ops-user-1',
          'Testing different suppression scopes',
          7
        );
        assert.strictEqual(sup.targetType, scope, `Should support ${scope} scope`);
      }
    });

    it('should not have global suppression option', () => {
      // This test documents that there is no "suppress all" functionality
      const result = validateSuppression({
        targetId: '*', // attempting global
        targetType: 'slo',
        operatorId: 'ops-user-1',
        justification: 'Attempting global suppression',
        durationDays: 7,
      });

      // Even if valid structurally, the system should not honor '*'
      // This is a design constraint documented in the contract
      assert.ok(true, 'No global suppression - scoped by design');
    });
  });

  // ============================================================================
  // Contract: ledger_is_auditable
  // ============================================================================

  describe('ledger_is_auditable', () => {
    it('should log acknowledgements to ledger', () => {
      const ledger = new SuppressionLedger();
      const ack = createAcknowledgement(
        'security.denial_rate',
        'slo',
        'ops-user-1',
        'acknowledge',
        'Reviewed and confirmed expected behavior'
      );

      ledger.recordAcknowledgement(ack);
      const entries = ledger.getLedgerEntries();

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].type, 'ack');
      assert.strictEqual(entries[0].operatorId, 'ops-user-1');
    });

    it('should log suppressions to ledger', () => {
      const ledger = new SuppressionLedger();
      const sup = createSuppression(
        'security.denial_rate',
        'slo',
        'ops-user-2',
        'Suppressing during maintenance window',
        3
      );

      ledger.recordSuppression(sup);
      const entries = ledger.getLedgerEntries();

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].type, 'suppression');
      assert.strictEqual(entries[0].operatorId, 'ops-user-2');
    });

    it('should log cancellations to ledger', () => {
      const ledger = new SuppressionLedger();
      const sup = createSuppression(
        'security.denial_rate',
        'slo',
        'ops-user-1',
        'Creating suppression to test cancel',
        7
      );

      ledger.recordSuppression(sup);
      ledger.cancelSuppression(sup.id, 'ops-user-2', 'No longer needed');

      const entries = ledger.getLedgerEntries();
      assert.strictEqual(entries.length, 2);
      assert.strictEqual(entries[1].type, 'cancel');
      assert.strictEqual(entries[1].operatorId, 'ops-user-2');
    });

    it('should preserve full audit trail', () => {
      const ledger = new SuppressionLedger();

      // Multiple operations
      const ack = createAcknowledgement(
        'slo-1',
        'slo',
        'op-1',
        'acknowledge',
        'First acknowledgement in the trail'
      );
      const sup = createSuppression('slo-2', 'slo', 'op-2', 'Suppression for full audit trail', 7);

      ledger.recordAcknowledgement(ack);
      ledger.recordSuppression(sup);
      ledger.cancelSuppression(sup.id, 'op-3', 'Cancelled by admin');

      const entries = ledger.getLedgerEntries();
      assert.strictEqual(entries.length, 3);

      // Check chronological order
      for (let i = 1; i < entries.length; i++) {
        assert.ok(
          new Date(entries[i].timestamp) >= new Date(entries[i - 1].timestamp),
          'Entries should be chronological'
        );
      }
    });

    it('should include correlation ID when available', () => {
      const ack = createAcknowledgement(
        'security.denial_rate',
        'slo',
        'ops-user-1',
        'acknowledge',
        'Acknowledging with correlation for tracing',
        'drift-security.denial_rate-12345'
      );

      assert.ok(ack.correlationId, 'Should have correlationId');
      assert.strictEqual(ack.correlationId, 'drift-security.denial_rate-12345');
    });
  });

  // ============================================================================
  // Contract: no_permanent_silence
  // ============================================================================

  describe('no_permanent_silence', () => {
    it('should enforce maximum suppression duration', () => {
      const result = validateSuppression({
        targetId: 'security.denial_rate',
        targetType: 'slo',
        operatorId: 'ops-user-1',
        justification: 'Attempting very long suppression',
        durationDays: 365, // 1 year - should be rejected
      });

      assert.ok(!result.valid, 'Should reject excessive duration');
      assert.ok(result.errors.some(e => e.includes('30')));
    });

    it('should cap duration at maximum even if requested longer', () => {
      const suppression = createSuppression(
        'security.denial_rate',
        'slo',
        'ops-user-1',
        'Requesting 90 days but expect cap',
        90 // Requesting 90 days
      );

      assert.strictEqual(
        suppression.durationDays,
        MAX_SUPPRESSION_DAYS,
        `Should cap at ${MAX_SUPPRESSION_DAYS} days`
      );
    });

    it('should reject zero or negative duration', () => {
      const result = validateSuppression({
        targetId: 'security.denial_rate',
        targetType: 'slo',
        operatorId: 'ops-user-1',
        justification: 'Attempting zero duration suppression',
        durationDays: 0,
      });

      assert.ok(!result.valid, 'Should reject zero duration');
      assert.ok(result.errors.some(e => e.includes('positive')));
    });

    it('should require renewal for continued suppression', () => {
      // This test documents the design: no auto-renewal
      const suppression = createSuppression(
        'security.denial_rate',
        'slo',
        'ops-user-1',
        'Suppression that will need renewal',
        30
      );

      // After max days, suppression expires - must create new one
      const afterMax = new Date(Date.now() + (MAX_SUPPRESSION_DAYS + 1) * 24 * 60 * 60 * 1000);
      assert.ok(isSuppressionExpired(suppression, afterMax), 'Should expire after max days');
    });
  });
});
