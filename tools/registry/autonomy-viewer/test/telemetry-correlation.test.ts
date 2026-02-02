/**
 * Phase 4N45c – Telemetry Correlation Contract Tests
 * ===================================================
 *
 * TDD-first tests for telemetry correlation semantics:
 *   - Correlation ID propagates through pipeline
 *   - Related events are linkable
 *   - Transaction boundaries are explicit
 *
 * @module telemetry-correlation.test
 * @version 4N45.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    createCorrelationId,
    createTelemetryEvent,
    getEventChain,
    linkEvents,
    type TelemetryEnvelope,
} from '../src/telemetry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Correlation ID Management
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Correlation ID Management', () => {
  it('createCorrelationId generates unique IDs', () => {
    const id1 = createCorrelationId();
    const id2 = createCorrelationId();

    assert.notStrictEqual(id1, id2);
  });

  it('correlation ID has expected format', () => {
    const id = createCorrelationId();

    // Should be a valid UUID or similar format
    assert.ok(id.length >= 16);
    assert.ok(/^[a-zA-Z0-9-]+$/.test(id));
  });

  it('correlation ID is required in events', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-required',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    assert.ok(event.correlationId);
    assert.strictEqual(event.correlationId, 'corr-required');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Event Chaining
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Event Chaining', () => {
  it('linkEvents creates parent-child relationship', () => {
    const parent = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-chain',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    const child = createTelemetryEvent({
      eventType: 'casefile_signed',
      correlationId: 'corr-chain',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      casefileSha256: 'sha256:case123',
      signerEpochId: 1,
    });

    const linked = linkEvents(parent, child);

    assert.strictEqual(linked.parentEventId, parent.eventId);
    assert.strictEqual(linked.correlationId, parent.correlationId);
  });

  it('all events in workflow share correlation ID', () => {
    const correlationId = createCorrelationId();

    const events = [
      createTelemetryEvent({
        eventType: 'casefile_generated',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
      }),
      createTelemetryEvent({
        eventType: 'casefile_signed',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        casefileSha256: 'sha256:case123',
        signerEpochId: 1,
      }),
      createTelemetryEvent({
        eventType: 'ledger_published',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
      }),
    ];

    // All should have same correlation ID
    for (const event of events) {
      assert.strictEqual(event.correlationId, correlationId);
    }
  });

  it('getEventChain reconstructs ordered sequence', () => {
    const correlationId = 'corr-sequence';
    const now = Date.now();

    const events: TelemetryEnvelope[] = [
      createTelemetryEvent({
        eventType: 'casefile_generated',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        timestampUtc: new Date(now).toISOString(),
      }),
      createTelemetryEvent({
        eventType: 'casefile_signed',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        casefileSha256: 'sha256:case',
        signerEpochId: 1,
        timestampUtc: new Date(now + 1000).toISOString(),
      }),
      createTelemetryEvent({
        eventType: 'ledger_published',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        timestampUtc: new Date(now + 2000).toISOString(),
      }),
    ];

    const chain = getEventChain(events, correlationId);

    assert.strictEqual(chain.length, 3);
    assert.strictEqual(chain[0].eventType, 'casefile_generated');
    assert.strictEqual(chain[1].eventType, 'casefile_signed');
    assert.strictEqual(chain[2].eventType, 'ledger_published');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Correlation Context Propagation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Correlation Context Propagation', () => {
  it('caseId propagates through related events', () => {
    const correlationId = 'corr-case';
    const caseId = 'ARK/2024/001234';

    const events = [
      createTelemetryEvent({
        eventType: 'casefile_generated',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        caseId,
      }),
      createTelemetryEvent({
        eventType: 'casefile_signed',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        caseId,
        casefileSha256: 'sha256:case',
        signerEpochId: 1,
      }),
    ];

    for (const event of events) {
      assert.strictEqual(event.caseId, caseId);
    }
  });

  it('releaseTag propagates through related events', () => {
    const correlationId = 'corr-release';
    const releaseTag = 'v1.0.0-rc.42';

    const events = [
      createTelemetryEvent({
        eventType: 'ledger_published',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        releaseTag,
      }),
      createTelemetryEvent({
        eventType: 'distribution_pack_emitted',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        releaseTag,
        metrics: { sizeBytes: 1024 },
      }),
    ];

    for (const event of events) {
      assert.strictEqual(event.releaseTag, releaseTag);
    }
  });

  it('signerEpochId propagates for signer operations', () => {
    const correlationId = 'corr-signer';
    const signerEpochId = 3;

    const events = [
      createTelemetryEvent({
        eventType: 'signer_epoch_created',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        signerEpochId,
      }),
      createTelemetryEvent({
        eventType: 'casefile_signed',
        correlationId,
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        casefileSha256: 'sha256:case',
        signerEpochId,
      }),
    ];

    for (const event of events) {
      assert.strictEqual(event.signerEpochId, signerEpochId);
    }
  });
});
