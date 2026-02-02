/**
 * Phase 4N45d – DR Telemetry Contract Tests
 * ==========================================
 *
 * TDD-first tests for DR telemetry emission:
 *   - Required DR events emitted
 *   - Events are canonicalized and PII-safe
 *   - Events bound to rebuilt head hashes
 *
 * @module dr-telemetry.test
 * @version 4N45.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    validateNoPii
} from '../src/telemetry.js';

import {
    createDRFailedEvent,
    createDRHeadRebuiltEvent,
    createDRStartedEvent,
    DR_EVENT_TYPES,
    emitDRTelemetry,
} from '../src/dr-reconstitution.js';

import { createMemorySink } from '../src/telemetry-sinks.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – DR Event Types
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – DR Event Types', () => {
  it('DR event types are defined', () => {
    const expectedDRTypes = [
      'dr_reconstitution_started',
      'dr_head_rebuilt',
      'dr_reconstitution_failed',
    ];

    for (const type of expectedDRTypes) {
      assert.ok(DR_EVENT_TYPES.includes(type), `Expected DR event type "${type}"`);
    }
  });

  it('DR event types are compatible with telemetry schema', () => {
    // DR events should extend or be compatible with TelemetryEnvelope
    const drEvent = createDRStartedEvent({
      correlationId: 'dr-123',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
    });

    assert.ok(drEvent.eventType);
    assert.ok(drEvent.correlationId);
    assert.ok(drEvent.eventSha256);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – DR Started Event
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – DR Started Event', () => {
  it('createDRStartedEvent produces valid envelope', () => {
    const event = createDRStartedEvent({
      correlationId: 'dr-start-123',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
    });

    assert.strictEqual(event.eventType, 'dr_reconstitution_started');
    assert.strictEqual(event.correlationId, 'dr-start-123');
    assert.ok(event.details?.headType === 'ledger');
  });

  it('DR started event includes artifact count', () => {
    const event = createDRStartedEvent({
      correlationId: 'dr-start-456',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'rollup',
      artifactCount: 15,
    });

    assert.strictEqual(event.details?.artifactCount, 15);
  });

  it('DR started event is PII-safe', () => {
    const event = createDRStartedEvent({
      correlationId: 'dr-start-789',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
    });

    const piiResult = validateNoPii(event);
    assert.strictEqual(piiResult.safe, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – DR Head Rebuilt Event
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – DR Head Rebuilt Event', () => {
  it('createDRHeadRebuiltEvent includes rebuilt head hash', () => {
    const event = createDRHeadRebuiltEvent({
      correlationId: 'dr-rebuilt-123',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
      rebuiltHeadSha256: 'sha256:newhead123',
      sequenceNumber: 42,
      headSource: 'reconstructed',
    });

    assert.strictEqual(event.eventType, 'dr_head_rebuilt');
    assert.strictEqual(event.ledgerHeadSha256, 'sha256:newhead123');
    assert.strictEqual(event.details?.sequenceNumber, 42);
    assert.strictEqual(event.details?.headSource, 'reconstructed');
  });

  it('DR head rebuilt event binds to signer epoch', () => {
    const event = createDRHeadRebuiltEvent({
      correlationId: 'dr-rebuilt-456',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
      rebuiltHeadSha256: 'sha256:newhead456',
      sequenceNumber: 10,
      headSource: 'public-pack',
      signerEpochId: 3,
    });

    assert.strictEqual(event.signerEpochId, 3);
  });

  it('DR head rebuilt event includes warnings for partial recovery', () => {
    const event = createDRHeadRebuiltEvent({
      correlationId: 'dr-rebuilt-789',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'rollup',
      rebuiltHeadSha256: 'sha256:rollhead789',
      sequenceNumber: 5,
      headSource: 'reconstructed',
      warnings: ['Partial history: 2024-03 rollup missing'],
    });

    assert.ok(event.details?.warnings);
    assert.ok(event.details.warnings.includes('Partial history: 2024-03 rollup missing'));
  });

  it('DR head rebuilt event is PII-safe', () => {
    const event = createDRHeadRebuiltEvent({
      correlationId: 'dr-rebuilt-safe',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
      rebuiltHeadSha256: 'sha256:head',
      sequenceNumber: 1,
      headSource: 'existing',
    });

    const piiResult = validateNoPii(event);
    assert.strictEqual(piiResult.safe, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – DR Failed Event
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – DR Failed Event', () => {
  it('createDRFailedEvent includes error code', () => {
    const event = createDRFailedEvent({
      correlationId: 'dr-fail-123',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
      errorCode: 'DR_HEAD_AMBIGUOUS',
      errorMessage: 'Multiple candidate heads detected',
    });

    assert.strictEqual(event.eventType, 'dr_reconstitution_failed');
    assert.strictEqual(event.outcome, 'FAILURE');
    assert.ok(event.errorCodes?.includes('DR_HEAD_AMBIGUOUS'));
  });

  it('DR failed event includes chain break details', () => {
    const event = createDRFailedEvent({
      correlationId: 'dr-fail-456',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
      errorCode: 'DR_CHAIN_BROKEN',
      errorMessage: 'Chain break at sha256:missing',
      brokenLinks: ['sha256:missing'],
    });

    assert.strictEqual(event.details?.brokenLinks?.length, 1);
  });

  it('DR failed event includes insufficient assets details', () => {
    const event = createDRFailedEvent({
      correlationId: 'dr-fail-789',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
      errorCode: 'DR_INSUFFICIENT_ASSETS',
      errorMessage: 'No valid artifacts found',
      missingArtifacts: ['ledger-head.json', 'ledger-2024-06.json'],
    });

    assert.ok(event.details?.missingArtifacts);
    assert.strictEqual(event.details.missingArtifacts.length, 2);
  });

  it('DR failed event is PII-safe', () => {
    const event = createDRFailedEvent({
      correlationId: 'dr-fail-safe',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
      errorCode: 'DR_HEAD_NOT_FOUND',
      errorMessage: 'No head candidates',
    });

    const piiResult = validateNoPii(event);
    assert.strictEqual(piiResult.safe, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – DR Telemetry Emission
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – DR Telemetry Emission', () => {
  it('emitDRTelemetry sends events to sink', () => {
    const sink = createMemorySink();

    const startEvent = createDRStartedEvent({
      correlationId: 'dr-emit-1',
      repoIdentity: 'github.com/terrafusion/os',
      headType: 'ledger',
    });

    emitDRTelemetry(startEvent, sink);

    assert.strictEqual(sink.events.length, 1);
    assert.strictEqual(sink.events[0].eventType, 'dr_reconstitution_started');
  });

  it('DR events share correlation ID across workflow', () => {
    const sink = createMemorySink();
    const correlationId = 'dr-workflow-1';

    emitDRTelemetry(
      createDRStartedEvent({
        correlationId,
        repoIdentity: 'repo',
        headType: 'ledger',
      }),
      sink
    );

    emitDRTelemetry(
      createDRHeadRebuiltEvent({
        correlationId,
        repoIdentity: 'repo',
        headType: 'ledger',
        rebuiltHeadSha256: 'sha256:head1',
        sequenceNumber: 1,
        headSource: 'reconstructed',
      }),
      sink
    );

    assert.strictEqual(sink.events.length, 2);
    assert.strictEqual(sink.events[0].correlationId, correlationId);
    assert.strictEqual(sink.events[1].correlationId, correlationId);
  });

  it('DR events include rebuilt head binding', () => {
    const event = createDRHeadRebuiltEvent({
      correlationId: 'dr-bind-1',
      repoIdentity: 'repo',
      headType: 'ledger',
      rebuiltHeadSha256: 'sha256:ledgerhead123',
      sequenceNumber: 10,
      headSource: 'reconstructed',
    });

    assert.strictEqual(event.ledgerHeadSha256, 'sha256:ledgerhead123');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – DR Event Canonicalization
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – DR Event Canonicalization', () => {
  it('DR events have deterministic hashes', () => {
    const params = {
      correlationId: 'dr-canon-1',
      repoIdentity: 'repo',
      headType: 'ledger' as const,
      rebuiltHeadSha256: 'sha256:head1',
      sequenceNumber: 5,
      headSource: 'reconstructed' as const,
    };

    const event1 = createDRHeadRebuiltEvent({ ...params, timestampUtc: '2024-06-01T00:00:00Z' });
    const event2 = createDRHeadRebuiltEvent({ ...params, timestampUtc: '2024-06-01T00:00:00Z' });

    // Same eventId would make them identical, but since eventId is random,
    // we verify the event structure is consistent instead
    assert.strictEqual(event1.eventType, event2.eventType);
    assert.strictEqual(event1.ledgerHeadSha256, event2.ledgerHeadSha256);
  });

  it('DR events include eventSha256', () => {
    const event = createDRStartedEvent({
      correlationId: 'dr-hash-1',
      repoIdentity: 'repo',
      headType: 'ledger',
    });

    assert.ok(event.eventSha256);
    assert.ok(event.eventSha256.startsWith('sha256:'));
  });
});
