/**
 * Phase 4N45c – Telemetry Schema Contract Tests
 * ==============================================
 *
 * TDD-first tests for telemetry event schema:
 *   - Schema is versioned and stable
 *   - Canonicalization hash is deterministic
 *   - Required fields present per event type
 *
 * @module telemetry-schema.test
 * @version 4N45.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    canonicalizeEvent,
    computeEventHash,
    createTelemetryEvent,
    REQUIRED_FIELDS_BY_EVENT_TYPE,
    TELEMETRY_EVENT_TYPES,
    TELEMETRY_SCHEMA,
    TELEMETRY_VERSION,
    validateEventFields,
    type TelemetryEnvelope,
    type TelemetryEventType,
} from '../src/telemetry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Telemetry Schema Versioning
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Telemetry Schema Versioning', () => {
  it('schema matches expected identifier', () => {
    assert.strictEqual(TELEMETRY_SCHEMA, 'terrafusion.autonomy.telemetry.v1');
  });

  it('version is 4N45.1', () => {
    assert.strictEqual(TELEMETRY_VERSION, '4N45.1');
  });

  it('event types are explicitly enumerated', () => {
    const expectedTypes: TelemetryEventType[] = [
      'casefile_generated',
      'casefile_signed',
      'casefile_verified',
      'ledger_published',
      'ledger_head_updated',
      'rollup_emitted',
      'distribution_pack_emitted',
      'redaction_applied',
      'retention_expired',
      'retention_deleted',
      'break_glass_invoked',
      'signer_epoch_created',
      'signer_rotated',
      'signer_revoked',
    ];

    for (const type of expectedTypes) {
      assert.ok(
        TELEMETRY_EVENT_TYPES.includes(type),
        `Expected event type "${type}" to be in TELEMETRY_EVENT_TYPES`
      );
    }
  });

  it('no free-form event types allowed', () => {
    // All event types must be in the explicit list (14 base + 3 DR events)
    assert.strictEqual(TELEMETRY_EVENT_TYPES.length, 17);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Telemetry Envelope Structure
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Telemetry Envelope Structure', () => {
  it('createTelemetryEvent produces valid envelope', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-123',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
    });

    assert.strictEqual(event.schemaVersion, TELEMETRY_VERSION);
    assert.strictEqual(event.eventType, 'casefile_generated');
    assert.ok(event.eventId);
    assert.ok(event.eventSha256);
    assert.ok(event.timestampUtc);
    assert.strictEqual(event.correlationId, 'corr-123');
    assert.strictEqual(event.repoIdentity, 'github.com/terrafusion/os');
    assert.strictEqual(event.outcome, 'SUCCESS');
  });

  it('envelope includes optional cryptographic bindings', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_signed',
      correlationId: 'corr-456',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
      casefileSha256: 'sha256:abc123',
      ledgerHeadSha256: 'sha256:def456',
      signerEpochId: 1,
      signerKeyId: 'sha256:key789',
    });

    assert.strictEqual(event.casefileSha256, 'sha256:abc123');
    assert.strictEqual(event.ledgerHeadSha256, 'sha256:def456');
    assert.strictEqual(event.signerEpochId, 1);
    assert.strictEqual(event.signerKeyId, 'sha256:key789');
  });

  it('envelope includes metrics when provided', () => {
    const event = createTelemetryEvent({
      eventType: 'distribution_pack_emitted',
      correlationId: 'corr-789',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
      metrics: {
        sizeBytes: 1024 * 1024,
        durationMs: 1500,
      },
    });

    assert.deepStrictEqual(event.metrics, {
      sizeBytes: 1024 * 1024,
      durationMs: 1500,
    });
  });

  it('envelope includes error codes on failure', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_verified',
      correlationId: 'corr-fail',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'FAILURE',
      errorCodes: ['SIGNATURE_INVALID', 'SIGNER_REVOKED'],
    });

    assert.strictEqual(event.outcome, 'FAILURE');
    assert.deepStrictEqual(event.errorCodes, ['SIGNATURE_INVALID', 'SIGNER_REVOKED']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Canonicalization & Deterministic Hashing
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Canonicalization & Deterministic Hashing', () => {
  it('canonicalization is deterministic across runs', () => {
    // Create a single event and verify canonicalizeEvent returns same result
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-det-1',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      timestampUtc: '2024-01-15T10:00:00Z',
    });

    // Multiple calls to canonicalizeEvent with same input should be identical
    const canonical1 = canonicalizeEvent(event);
    const canonical2 = canonicalizeEvent(event);
    const canonical3 = canonicalizeEvent(event);

    assert.strictEqual(canonical1, canonical2);
    assert.strictEqual(canonical2, canonical3);
  });

  it('eventSha256 changes with any field change', () => {
    const base = {
      eventType: 'casefile_generated' as const,
      correlationId: 'corr-hash',
      repoIdentity: 'repo',
      outcome: 'SUCCESS' as const,
      timestampUtc: '2024-01-15T10:00:00Z',
    };

    const hash1 = computeEventHash(base);
    const hash2 = computeEventHash({ ...base, correlationId: 'corr-different' });

    assert.notStrictEqual(hash1, hash2);
  });

  it('key ordering does not affect canonicalization', () => {
    const event1 = {
      eventType: 'casefile_generated' as const,
      correlationId: 'corr',
      repoIdentity: 'repo',
      outcome: 'SUCCESS' as const,
    };

    const event2 = {
      outcome: 'SUCCESS' as const,
      repoIdentity: 'repo',
      eventType: 'casefile_generated' as const,
      correlationId: 'corr',
    };

    const canonical1 = canonicalizeEvent(event1 as TelemetryEnvelope);
    const canonical2 = canonicalizeEvent(event2 as TelemetryEnvelope);

    assert.strictEqual(canonical1, canonical2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Required Fields by Event Type
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Required Fields by Event Type', () => {
  it('casefile events require casefileSha256', () => {
    const required = REQUIRED_FIELDS_BY_EVENT_TYPE['casefile_signed'];
    assert.ok(required.includes('casefileSha256'));
  });

  it('signer events require signerEpochId', () => {
    const required = REQUIRED_FIELDS_BY_EVENT_TYPE['signer_epoch_created'];
    assert.ok(required.includes('signerEpochId'));
  });

  it('revocation events require revocationState', () => {
    const required = REQUIRED_FIELDS_BY_EVENT_TYPE['signer_revoked'];
    assert.ok(required.includes('revocationState'));
  });

  it('distribution events require metrics.sizeBytes', () => {
    const required = REQUIRED_FIELDS_BY_EVENT_TYPE['distribution_pack_emitted'];
    assert.ok(required.includes('metrics.sizeBytes'));
  });

  it('validateEventFields rejects missing required fields', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_signed',
      correlationId: 'corr',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      // Missing: casefileSha256
    });

    const result = validateEventFields(event);
    assert.strictEqual(result.valid, false);
    assert.ok(result.missingFields?.includes('casefileSha256'));
  });

  it('validateEventFields accepts complete event', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_signed',
      correlationId: 'corr',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      casefileSha256: 'sha256:abc',
      signerEpochId: 1,
    });

    const result = validateEventFields(event);
    assert.strictEqual(result.valid, true);
  });
});
