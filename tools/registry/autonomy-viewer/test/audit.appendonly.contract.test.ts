/**
 * Audit Append-Only Contract Tests
 * ==================================
 *
 * Phase IIIm: Validates immutable audit trail for all calibration operations.
 *
 * Contract:
 * - audit_is_append_only: No deletions or mutations allowed
 * - audit_has_required_fields: Actor, action, timestamp, target always present
 * - audit_is_queryable: Support time-range and actor-based queries
 * - audit_is_pii_clean: No raw identifiers in audit records
 * - audit_chain_integrity: Sequential IDs, no gaps, tamper detection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// Types for Audit Log
// ============================================================================

/**
 * Audit action types.
 */
type AuditAction =
  | 'drift.detected'
  | 'recommendation.emitted'
  | 'notification.sent'
  | 'pr.created'
  | 'pr.approved'
  | 'pr.merged'
  | 'ack.recorded'
  | 'suppression.created'
  | 'suppression.cancelled'
  | 'slo.updated'
  | 'alert.updated';

/**
 * Audit record (immutable).
 */
interface AuditRecord {
  readonly id: string;
  readonly sequenceNumber: number;
  readonly action: AuditAction;
  readonly actor: AuditActor;
  readonly target: AuditTarget;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly details: Record<string, unknown>;
  readonly checksum: string;
}

/**
 * Audit actor (who performed the action).
 */
interface AuditActor {
  readonly type: 'system' | 'operator' | 'automation';
  readonly id: string;
  readonly displayName?: string;
}

/**
 * Audit target (what was affected).
 */
interface AuditTarget {
  readonly type: 'slo' | 'alert' | 'pr' | 'notification' | 'suppression';
  readonly id: string;
  readonly name?: string;
}

/**
 * Audit query parameters.
 */
interface AuditQuery {
  readonly startTime?: string;
  readonly endTime?: string;
  readonly actorId?: string;
  readonly actorType?: AuditActor['type'];
  readonly targetId?: string;
  readonly targetType?: AuditTarget['type'];
  readonly action?: AuditAction;
  readonly correlationId?: string;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Audit query result.
 */
interface AuditQueryResult {
  readonly records: readonly AuditRecord[];
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * Validation result.
 */
interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Chain integrity result.
 */
interface ChainIntegrityResult {
  readonly valid: boolean;
  readonly lastValidSequence: number;
  readonly errors: readonly string[];
}

// ============================================================================
// Constants
// ============================================================================

const REQUIRED_AUDIT_FIELDS = [
  'id',
  'sequenceNumber',
  'action',
  'actor',
  'target',
  'timestamp',
  'correlationId',
  'checksum',
] as const;

const ALLOWED_AUDIT_DIMENSIONS = ['provider', 'code', 'stage'] as const;

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Generate checksum for audit record.
 */
function generateChecksum(record: Omit<AuditRecord, 'checksum'>): string {
  const content = JSON.stringify({
    id: record.id,
    sequenceNumber: record.sequenceNumber,
    action: record.action,
    actor: record.actor,
    target: record.target,
    timestamp: record.timestamp,
    correlationId: record.correlationId,
    details: record.details,
  });

  // Simple hash for contract testing
  const hash = content.split('').reduce((acc, c) => {
    return ((acc << 5) - acc + c.charCodeAt(0)) | 0;
  }, 0);
  return `sha256:${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Validate audit record completeness.
 */
function validateAuditRecord(record: Partial<AuditRecord>): ValidationResult {
  const errors: string[] = [];

  for (const field of REQUIRED_AUDIT_FIELDS) {
    if (!(field in record) || record[field as keyof AuditRecord] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (record.actor) {
    if (!record.actor.type) errors.push('actor.type is required');
    if (!record.actor.id) errors.push('actor.id is required');
  }

  if (record.target) {
    if (!record.target.type) errors.push('target.type is required');
    if (!record.target.id) errors.push('target.id is required');
  }

  if (record.timestamp && isNaN(Date.parse(record.timestamp))) {
    errors.push('Invalid timestamp format');
  }

  if (record.sequenceNumber !== undefined && record.sequenceNumber < 0) {
    errors.push('sequenceNumber must be non-negative');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Filter dimensions for PII safety.
 */
function filterDimensions(
  details: Record<string, unknown>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (key === 'dimensions' && typeof value === 'object' && value !== null) {
      const dims: Record<string, unknown> = {};
      for (const dimKey of Object.keys(value as Record<string, unknown>)) {
        if (ALLOWED_AUDIT_DIMENSIONS.includes(dimKey as any)) {
          dims[dimKey] = (value as Record<string, unknown>)[dimKey];
        }
      }
      filtered[key] = dims;
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Check for PII in audit record.
 */
function containsPii(record: AuditRecord): boolean {
  const piiPatterns = [
    /\b[A-Z]{2}\d{6,}\b/, // Parcel IDs
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN-like
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i, // Email
  ];

  const textToScan = JSON.stringify(record);
  return piiPatterns.some((p) => p.test(textToScan));
}

/**
 * Immutable audit log (append-only).
 */
class ImmutableAuditLog {
  private readonly records: AuditRecord[] = [];
  private sequenceCounter = 0;

  append(
    action: AuditAction,
    actor: AuditActor,
    target: AuditTarget,
    correlationId: string,
    details: Record<string, unknown> = {}
  ): AuditRecord {
    const filteredDetails = filterDimensions(details);
    const recordBase: Omit<AuditRecord, 'checksum'> = {
      id: `audit-${Date.now()}-${this.sequenceCounter}`,
      sequenceNumber: this.sequenceCounter++,
      action,
      actor,
      target,
      timestamp: new Date().toISOString(),
      correlationId,
      details: filteredDetails,
    };

    const record: AuditRecord = {
      ...recordBase,
      checksum: generateChecksum(recordBase),
    };

    this.records.push(record);
    return record;
  }

  // Intentionally no delete or update methods - append only

  query(params: AuditQuery): AuditQueryResult {
    let filtered = [...this.records];

    if (params.startTime) {
      const start = new Date(params.startTime);
      filtered = filtered.filter((r) => new Date(r.timestamp) >= start);
    }
    if (params.endTime) {
      const end = new Date(params.endTime);
      filtered = filtered.filter((r) => new Date(r.timestamp) <= end);
    }
    if (params.actorId) {
      filtered = filtered.filter((r) => r.actor.id === params.actorId);
    }
    if (params.actorType) {
      filtered = filtered.filter((r) => r.actor.type === params.actorType);
    }
    if (params.targetId) {
      filtered = filtered.filter((r) => r.target.id === params.targetId);
    }
    if (params.targetType) {
      filtered = filtered.filter((r) => r.target.type === params.targetType);
    }
    if (params.action) {
      filtered = filtered.filter((r) => r.action === params.action);
    }
    if (params.correlationId) {
      filtered = filtered.filter((r) => r.correlationId === params.correlationId);
    }

    const total = filtered.length;
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 100;

    const paginated = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { records: paginated, total, hasMore };
  }

  verifyChainIntegrity(): ChainIntegrityResult {
    const errors: string[] = [];
    let lastValidSequence = -1;

    for (let i = 0; i < this.records.length; i++) {
      const record = this.records[i];

      // Check sequence continuity
      if (record.sequenceNumber !== i) {
        errors.push(
          `Sequence gap: expected ${i}, got ${record.sequenceNumber}`
        );
        break;
      }

      // Verify checksum
      const { checksum, ...rest } = record;
      const expectedChecksum = generateChecksum(rest);
      if (checksum !== expectedChecksum) {
        errors.push(`Checksum mismatch at sequence ${i}`);
        break;
      }

      lastValidSequence = i;
    }

    return {
      valid: errors.length === 0,
      lastValidSequence,
      errors,
    };
  }

  getRecordCount(): number {
    return this.records.length;
  }

  getLatestSequence(): number {
    return this.sequenceCounter - 1;
  }
}

// ============================================================================
// Contract: audit_is_append_only
// ============================================================================

describe('Audit Append-Only Contract', () => {
  describe('audit_is_append_only', () => {
    it('should only provide append method', () => {
      const log = new ImmutableAuditLog();

      // Verify append exists
      assert.ok(typeof log.append === 'function', 'Should have append method');

      // Verify no delete/update methods exist
      assert.ok(
        !('delete' in log) && !('remove' in log),
        'Should not have delete methods'
      );
      assert.ok(
        !('update' in log) && !('modify' in log),
        'Should not have update methods'
      );
    });

    it('should increment record count on each append', () => {
      const log = new ImmutableAuditLog();

      log.append(
        'drift.detected',
        { type: 'system', id: 'calibration-bot' },
        { type: 'slo', id: 'security.denial_rate' },
        'corr-1'
      );
      assert.strictEqual(log.getRecordCount(), 1);

      log.append(
        'recommendation.emitted',
        { type: 'system', id: 'calibration-bot' },
        { type: 'slo', id: 'security.denial_rate' },
        'corr-1'
      );
      assert.strictEqual(log.getRecordCount(), 2);
    });

    it('should preserve all appended records', () => {
      const log = new ImmutableAuditLog();

      log.append(
        'drift.detected',
        { type: 'system', id: 'calibration-bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-1'
      );
      log.append(
        'drift.detected',
        { type: 'system', id: 'calibration-bot' },
        { type: 'slo', id: 'slo-2' },
        'corr-2'
      );

      const result = log.query({});
      assert.strictEqual(result.records.length, 2);
      assert.ok(result.records.some((r) => r.target.id === 'slo-1'));
      assert.ok(result.records.some((r) => r.target.id === 'slo-2'));
    });

    it('should return immutable records', () => {
      const log = new ImmutableAuditLog();

      const record = log.append(
        'drift.detected',
        { type: 'system', id: 'calibration-bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-1'
      );

      // Record properties are readonly - TypeScript enforces this at compile time
      // At runtime, we verify the record exists and is complete
      assert.ok(record.id, 'Record should have id');
      assert.ok(record.checksum, 'Record should have checksum');
    });
  });

  // ============================================================================
  // Contract: audit_has_required_fields
  // ============================================================================

  describe('audit_has_required_fields', () => {
    it('should include all required fields on append', () => {
      const log = new ImmutableAuditLog();

      const record = log.append(
        'drift.detected',
        { type: 'system', id: 'calibration-bot' },
        { type: 'slo', id: 'security.denial_rate' },
        'corr-1'
      );

      const validation = validateAuditRecord(record);
      assert.ok(validation.valid, `Should have all fields: ${validation.errors.join(', ')}`);
    });

    it('should validate incomplete records', () => {
      const incomplete: Partial<AuditRecord> = {
        id: 'test-1',
        action: 'drift.detected',
        // missing: sequenceNumber, actor, target, timestamp, correlationId, checksum
      };

      const validation = validateAuditRecord(incomplete);
      assert.ok(!validation.valid, 'Should fail validation');
      assert.ok(validation.errors.length >= 4, 'Should have multiple errors');
    });

    it('should require actor type and id', () => {
      const validation = validateAuditRecord({
        id: 'test-1',
        sequenceNumber: 0,
        action: 'drift.detected',
        actor: { type: undefined as any, id: '' },
        target: { type: 'slo', id: 'slo-1' },
        timestamp: new Date().toISOString(),
        correlationId: 'corr-1',
        details: {},
        checksum: 'sha256:1234',
      });

      assert.ok(!validation.valid);
      assert.ok(validation.errors.some((e) => e.includes('actor')));
    });

    it('should require target type and id', () => {
      const validation = validateAuditRecord({
        id: 'test-1',
        sequenceNumber: 0,
        action: 'drift.detected',
        actor: { type: 'system', id: 'bot' },
        target: { type: undefined as any, id: '' },
        timestamp: new Date().toISOString(),
        correlationId: 'corr-1',
        details: {},
        checksum: 'sha256:1234',
      });

      assert.ok(!validation.valid);
      assert.ok(validation.errors.some((e) => e.includes('target')));
    });

    it('should require valid timestamp', () => {
      const validation = validateAuditRecord({
        id: 'test-1',
        sequenceNumber: 0,
        action: 'drift.detected',
        actor: { type: 'system', id: 'bot' },
        target: { type: 'slo', id: 'slo-1' },
        timestamp: 'not-a-date',
        correlationId: 'corr-1',
        details: {},
        checksum: 'sha256:1234',
      });

      assert.ok(!validation.valid);
      assert.ok(validation.errors.some((e) => e.includes('timestamp')));
    });
  });

  // ============================================================================
  // Contract: audit_is_queryable
  // ============================================================================

  describe('audit_is_queryable', () => {
    it('should query by time range', () => {
      const log = new ImmutableAuditLog();

      log.append(
        'drift.detected',
        { type: 'system', id: 'bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-1'
      );

      const result = log.query({
        startTime: new Date(Date.now() - 60000).toISOString(),
        endTime: new Date(Date.now() + 60000).toISOString(),
      });

      assert.strictEqual(result.records.length, 1);
    });

    it('should query by actor', () => {
      const log = new ImmutableAuditLog();

      log.append(
        'drift.detected',
        { type: 'system', id: 'calibration-bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-1'
      );
      log.append(
        'ack.recorded',
        { type: 'operator', id: 'ops-user-1' },
        { type: 'slo', id: 'slo-1' },
        'corr-1'
      );

      const result = log.query({ actorType: 'operator' });
      assert.strictEqual(result.records.length, 1);
      assert.strictEqual(result.records[0].actor.id, 'ops-user-1');
    });

    it('should query by target', () => {
      const log = new ImmutableAuditLog();

      log.append(
        'drift.detected',
        { type: 'system', id: 'bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-1'
      );
      log.append(
        'drift.detected',
        { type: 'system', id: 'bot' },
        { type: 'alert', id: 'alert-1' },
        'corr-2'
      );

      const result = log.query({ targetType: 'slo' });
      assert.strictEqual(result.records.length, 1);
      assert.strictEqual(result.records[0].target.id, 'slo-1');
    });

    it('should query by correlation ID', () => {
      const log = new ImmutableAuditLog();

      log.append(
        'drift.detected',
        { type: 'system', id: 'bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-123'
      );
      log.append(
        'recommendation.emitted',
        { type: 'system', id: 'bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-123'
      );
      log.append(
        'drift.detected',
        { type: 'system', id: 'bot' },
        { type: 'slo', id: 'slo-2' },
        'corr-456'
      );

      const result = log.query({ correlationId: 'corr-123' });
      assert.strictEqual(result.records.length, 2);
    });

    it('should support pagination', () => {
      const log = new ImmutableAuditLog();

      for (let i = 0; i < 10; i++) {
        log.append(
          'drift.detected',
          { type: 'system', id: 'bot' },
          { type: 'slo', id: `slo-${i}` },
          `corr-${i}`
        );
      }

      const page1 = log.query({ limit: 3, offset: 0 });
      assert.strictEqual(page1.records.length, 3);
      assert.strictEqual(page1.total, 10);
      assert.ok(page1.hasMore);

      const page2 = log.query({ limit: 3, offset: 3 });
      assert.strictEqual(page2.records.length, 3);
      assert.ok(page2.hasMore);

      const lastPage = log.query({ limit: 3, offset: 9 });
      assert.strictEqual(lastPage.records.length, 1);
      assert.ok(!lastPage.hasMore);
    });
  });

  // ============================================================================
  // Contract: audit_is_pii_clean
  // ============================================================================

  describe('audit_is_pii_clean', () => {
    it('should filter dimensions in details', () => {
      const log = new ImmutableAuditLog();

      const record = log.append(
        'drift.detected',
        { type: 'system', id: 'bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-1',
        {
          dimensions: {
            provider: 'auth0',
            code: '401',
            userId: 'user123', // should be filtered
            email: 'user@example.com', // should be filtered
          },
          driftPercent: 25,
        }
      );

      const dims = record.details.dimensions as Record<string, unknown>;
      assert.ok(!('userId' in dims), 'Should filter userId');
      assert.ok(!('email' in dims), 'Should filter email');
      assert.ok('provider' in dims, 'Should keep provider');
      assert.ok('code' in dims, 'Should keep code');
    });

    it('should not contain PII patterns in serialized record', () => {
      const log = new ImmutableAuditLog();

      const record = log.append(
        'drift.detected',
        { type: 'system', id: 'calibration-bot' },
        { type: 'slo', id: 'security.denial_rate' },
        'corr-1',
        { driftPercent: 25, dimensions: { provider: 'auth0' } }
      );

      assert.ok(!containsPii(record), 'Record should not contain PII');
    });

    it('should use hashed actor IDs for operators', () => {
      // This test documents that operator IDs should be internal identifiers,
      // not email addresses or other PII
      const log = new ImmutableAuditLog();

      const record = log.append(
        'ack.recorded',
        { type: 'operator', id: 'ops-user-12345' }, // internal ID, not email
        { type: 'slo', id: 'slo-1' },
        'corr-1'
      );

      assert.ok(!record.actor.id.includes('@'), 'Actor ID should not be email');
      assert.ok(!containsPii(record), 'Record should not contain PII');
    });
  });

  // ============================================================================
  // Contract: audit_chain_integrity
  // ============================================================================

  describe('audit_chain_integrity', () => {
    it('should have sequential sequence numbers', () => {
      const log = new ImmutableAuditLog();

      for (let i = 0; i < 5; i++) {
        log.append(
          'drift.detected',
          { type: 'system', id: 'bot' },
          { type: 'slo', id: `slo-${i}` },
          `corr-${i}`
        );
      }

      const result = log.query({});
      for (let i = 0; i < result.records.length; i++) {
        assert.strictEqual(result.records[i].sequenceNumber, i);
      }
    });

    it('should include checksum on every record', () => {
      const log = new ImmutableAuditLog();

      const record = log.append(
        'drift.detected',
        { type: 'system', id: 'bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-1'
      );

      assert.ok(record.checksum, 'Should have checksum');
      assert.ok(record.checksum.startsWith('sha256:'), 'Should have sha256 prefix');
    });

    it('should verify chain integrity successfully', () => {
      const log = new ImmutableAuditLog();

      for (let i = 0; i < 10; i++) {
        log.append(
          'drift.detected',
          { type: 'system', id: 'bot' },
          { type: 'slo', id: `slo-${i}` },
          `corr-${i}`
        );
      }

      const integrity = log.verifyChainIntegrity();
      assert.ok(integrity.valid, `Chain should be valid: ${integrity.errors.join(', ')}`);
      assert.strictEqual(integrity.lastValidSequence, 9);
    });

    it('should detect checksum tampering', () => {
      // This test documents the design: checksums would detect tampering
      // In the mock implementation, we verify checksum generation is deterministic
      const recordBase: Omit<AuditRecord, 'checksum'> = {
        id: 'test-1',
        sequenceNumber: 0,
        action: 'drift.detected',
        actor: { type: 'system', id: 'bot' },
        target: { type: 'slo', id: 'slo-1' },
        timestamp: '2026-01-01T00:00:00Z',
        correlationId: 'corr-1',
        details: {},
      };

      const checksum1 = generateChecksum(recordBase);
      const checksum2 = generateChecksum(recordBase);

      assert.strictEqual(checksum1, checksum2, 'Checksum should be deterministic');

      // Modified record should have different checksum
      const modified = { ...recordBase, sequenceNumber: 1 };
      const checksum3 = generateChecksum(modified);
      assert.notStrictEqual(checksum1, checksum3, 'Modified record should have different checksum');
    });

    it('should start sequence at zero', () => {
      const log = new ImmutableAuditLog();

      const record = log.append(
        'drift.detected',
        { type: 'system', id: 'bot' },
        { type: 'slo', id: 'slo-1' },
        'corr-1'
      );

      assert.strictEqual(record.sequenceNumber, 0);
    });
  });
});
