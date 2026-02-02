/**
 * Phase 4N50 — Telemetry Rollup Contract Tests
 * =============================================
 *
 * Tests for parsing JSONL telemetry into deterministic summaries.
 *
 * CONTRACTS:
 * - Counts event types correctly
 * - Preserves correlation chains
 * - Fails-closed on invalid JSONL
 * - Output is deterministic given same inputs
 * - Handles empty input gracefully
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    computeRollup,
    parseJsonlEvents,
    TELEMETRY_ROLLUP_SCHEMA,
    TELEMETRY_ROLLUP_VERSION
} from '../src/ops/telemetry-rollup.js';

import { TELEMETRY_VERSION, type TelemetryEnvelope } from '../src/telemetry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function createTestEvent(
  eventType: string,
  correlationId: string,
  outcome: 'SUCCESS' | 'FAILURE' = 'SUCCESS'
): TelemetryEnvelope {
  return {
    schemaVersion: TELEMETRY_VERSION,
    eventType: eventType as TelemetryEnvelope['eventType'],
    eventId: `event-${Math.random().toString(36).slice(2)}`,
    eventSha256: `sha256:${'a'.repeat(64)}`,
    timestampUtc: '2026-01-31T12:00:00.000Z',
    correlationId,
    repoIdentity: 'terrafusion/os',
    outcome,
  };
}

function createJsonlInput(events: TelemetryEnvelope[]): string {
  return events.map(e => JSON.stringify(e)).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

describe('TelemetryRollup: Schema & Version', () => {
  it('exports TELEMETRY_ROLLUP_SCHEMA', () => {
    assert.equal(TELEMETRY_ROLLUP_SCHEMA, 'terrafusion.autonomy.telemetry-rollup.v1');
  });

  it('exports TELEMETRY_ROLLUP_VERSION matching 4N50.x', () => {
    assert.match(TELEMETRY_ROLLUP_VERSION, /^4N50\.\d+$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: parseJsonlEvents
// ─────────────────────────────────────────────────────────────────────────────

describe('TelemetryRollup: parseJsonlEvents', () => {
  it('parses_valid_jsonl', () => {
    const events = [
      createTestEvent('casefile_generated', 'corr-1'),
      createTestEvent('casefile_signed', 'corr-1'),
    ];
    const jsonl = createJsonlInput(events);

    const result = parseJsonlEvents(jsonl);

    assert.equal(result.ok, true);
    assert.equal(result.events.length, 2);
    assert.deepEqual(result.errors, []);
  });

  it('handles_empty_input', () => {
    const result = parseJsonlEvents('');

    assert.equal(result.ok, true);
    assert.equal(result.events.length, 0);
  });

  it('skips_empty_lines', () => {
    const events = [createTestEvent('casefile_generated', 'corr-1')];
    const jsonl = '\n\n' + JSON.stringify(events[0]) + '\n\n';

    const result = parseJsonlEvents(jsonl);

    assert.equal(result.ok, true);
    assert.equal(result.events.length, 1);
  });

  it('fails_closed_on_invalid_json_line', () => {
    // Line 1: valid event, Line 2: invalid JSON, Line 3: valid event
    const validEvent = createTestEvent('casefile_generated', 'corr-1');
    const jsonl = JSON.stringify(validEvent) + '\n{invalid json\n' + JSON.stringify(validEvent);

    const result = parseJsonlEvents(jsonl);

    // Should still parse valid lines, but report error for invalid
    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors[0].includes('line 2'), `Expected 'line 2' in: ${result.errors[0]}`);
    // Should have parsed the 2 valid events
    assert.equal(result.events.length, 2);
  });

  it('fails_closed_on_wrong_schema', () => {
    const badEvent = {
      schemaVersion: 'wrong-version',
      eventType: 'casefile_generated',
      eventId: 'test',
    };
    const jsonl = JSON.stringify(badEvent);

    const result = parseJsonlEvents(jsonl);

    assert.equal(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('schema')));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: computeRollup - Event Counting
// ─────────────────────────────────────────────────────────────────────────────

describe('TelemetryRollup: Event Counting', () => {
  it('rollup_counts_event_types_correctly', () => {
    const events = [
      createTestEvent('casefile_generated', 'corr-1'),
      createTestEvent('casefile_generated', 'corr-2'),
      createTestEvent('casefile_signed', 'corr-1'),
      createTestEvent('ledger_published', 'corr-3'),
    ];

    const result = computeRollup(events);

    assert.equal(result.eventCounts.casefile_generated, 2);
    assert.equal(result.eventCounts.casefile_signed, 1);
    assert.equal(result.eventCounts.ledger_published, 1);
    assert.equal(result.totalEvents, 4);
  });

  it('rollup_counts_success_and_failure', () => {
    const events = [
      createTestEvent('casefile_generated', 'corr-1', 'SUCCESS'),
      createTestEvent('casefile_verified', 'corr-1', 'FAILURE'),
      createTestEvent('casefile_signed', 'corr-2', 'SUCCESS'),
    ];

    const result = computeRollup(events);

    assert.equal(result.outcomeStats.success, 2);
    assert.equal(result.outcomeStats.failure, 1);
    assert.equal(result.outcomeStats.successRate, 66.67); // 2/3 * 100, rounded
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: computeRollup - Correlation Chains
// ─────────────────────────────────────────────────────────────────────────────

describe('TelemetryRollup: Correlation Chains', () => {
  it('rollup_preserves_correlation_chains', () => {
    const events = [
      createTestEvent('casefile_generated', 'corr-1'),
      createTestEvent('casefile_signed', 'corr-1'),
      createTestEvent('casefile_verified', 'corr-1'),
      createTestEvent('casefile_generated', 'corr-2'),
      createTestEvent('ledger_published', 'corr-3'),
    ];

    const result = computeRollup(events);

    assert.equal(result.correlationChains.total, 3);
    assert.ok('corr-1' in result.correlationChains.byId);
    assert.equal(result.correlationChains.byId['corr-1'].eventCount, 3);
    assert.deepEqual(result.correlationChains.byId['corr-1'].eventTypes, [
      'casefile_generated',
      'casefile_signed',
      'casefile_verified',
    ]);
  });

  it('rollup_tracks_complete_vs_incomplete_chains', () => {
    // Complete chain: generated → signed → verified
    const completeChain = [
      createTestEvent('casefile_generated', 'corr-complete'),
      createTestEvent('casefile_signed', 'corr-complete'),
      createTestEvent('casefile_verified', 'corr-complete'),
    ];

    // Incomplete chain: only generated
    const incompleteChain = [createTestEvent('casefile_generated', 'corr-incomplete')];

    const events = [...completeChain, ...incompleteChain];
    const result = computeRollup(events);

    assert.equal(result.correlationChains.total, 2);
    // Chain with 3+ events is "complete"
    assert.equal(result.correlationChains.byId['corr-complete'].eventCount, 3);
    assert.equal(result.correlationChains.byId['corr-incomplete'].eventCount, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe('TelemetryRollup: Determinism', () => {
  it('rollup_is_deterministic_given_same_inputs', () => {
    const events = [
      createTestEvent('casefile_generated', 'corr-1'),
      createTestEvent('casefile_signed', 'corr-1'),
      createTestEvent('ledger_published', 'corr-2'),
    ];

    const results: string[] = [];
    for (let i = 0; i < 10; i++) {
      const result = computeRollup(events);
      // Exclude generatedAt for comparison
      const { generatedAt, ...rest } = result;
      results.push(JSON.stringify(rest));
    }

    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      assert.equal(results[i], results[0]);
    }
  });

  it('rollup_event_order_does_not_affect_counts', () => {
    const events = [
      createTestEvent('casefile_generated', 'corr-1'),
      createTestEvent('ledger_published', 'corr-2'),
      createTestEvent('casefile_generated', 'corr-3'),
    ];

    // Shuffle order
    const shuffled = [...events].reverse();

    const result1 = computeRollup(events);
    const result2 = computeRollup(shuffled);

    assert.equal(result1.eventCounts.casefile_generated, result2.eventCounts.casefile_generated);
    assert.equal(result1.eventCounts.ledger_published, result2.eventCounts.ledger_published);
    assert.equal(result1.totalEvents, result2.totalEvents);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Empty/Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('TelemetryRollup: Edge Cases', () => {
  it('handles_empty_events_array', () => {
    const result = computeRollup([]);

    assert.equal(result.totalEvents, 0);
    assert.equal(result.correlationChains.total, 0);
    assert.equal(result.outcomeStats.success, 0);
    assert.equal(result.outcomeStats.failure, 0);
  });

  it('handles_single_event', () => {
    const events = [createTestEvent('casefile_generated', 'corr-1')];
    const result = computeRollup(events);

    assert.equal(result.totalEvents, 1);
    assert.equal(result.correlationChains.total, 1);
    assert.equal(result.eventCounts.casefile_generated, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Result Shape
// ─────────────────────────────────────────────────────────────────────────────

describe('TelemetryRollup: Result Shape', () => {
  it('returns_TelemetryRollupResult_contract', () => {
    const events = [createTestEvent('casefile_generated', 'corr-1')];
    const result = computeRollup(events);

    // Required fields
    assert.ok('$schema' in result);
    assert.ok('version' in result);
    assert.ok('generatedAt' in result);
    assert.ok('totalEvents' in result);
    assert.ok('eventCounts' in result);
    assert.ok('outcomeStats' in result);
    assert.ok('correlationChains' in result);

    // Schema matches
    assert.equal(result.$schema, TELEMETRY_ROLLUP_SCHEMA);
    assert.equal(result.version, TELEMETRY_ROLLUP_VERSION);
  });
});
