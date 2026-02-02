/**
 * Phase 4N45c – Telemetry Sinks Contract Tests
 * =============================================
 *
 * TDD-first tests for telemetry emission sinks:
 *   - Stdout JSONL sink
 *   - File sink (append-only, air-gap compatible)
 *   - Transport-agnostic event envelope
 *
 * @module telemetry-sinks.test
 * @version 4N45.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createTelemetryEvent } from '../src/telemetry.js';

import {
    createFileSink,
    createMemorySink,
    createStdoutSink,
    emitTelemetry,
    formatAsJsonl
} from '../src/telemetry-sinks.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – JSONL Formatting
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – JSONL Formatting', () => {
  it('formatAsJsonl produces single-line JSON', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-123',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    const jsonl = formatAsJsonl(event);

    // Should be single line
    assert.ok(!jsonl.includes('\n') || jsonl.endsWith('\n'));
    // Should be valid JSON
    const parsed = JSON.parse(jsonl.trim());
    assert.strictEqual(parsed.eventType, 'casefile_generated');
  });

  it('formatAsJsonl is deterministic', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-123',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      timestampUtc: '2024-01-15T10:00:00Z',
    });

    const jsonl1 = formatAsJsonl(event);
    const jsonl2 = formatAsJsonl(event);

    assert.strictEqual(jsonl1, jsonl2);
  });

  it('formatAsJsonl handles special characters', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-123',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      details: {
        path: 'C:\\Users\\test\\file.txt',
        message: 'Line1\nLine2',
      },
    });

    const jsonl = formatAsJsonl(event);
    const parsed = JSON.parse(jsonl.trim());

    assert.strictEqual(parsed.details.path, 'C:\\Users\\test\\file.txt');
    assert.strictEqual(parsed.details.message, 'Line1\nLine2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Memory Sink (Test Helper)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Memory Sink', () => {
  it('createMemorySink captures events', () => {
    const sink = createMemorySink();

    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-mem',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    emitTelemetry(event, sink);

    assert.strictEqual(sink.events.length, 1);
    assert.strictEqual(sink.events[0].correlationId, 'corr-mem');
  });

  it('memory sink preserves event order', () => {
    const sink = createMemorySink();

    emitTelemetry(
      createTelemetryEvent({
        eventType: 'casefile_generated',
        correlationId: 'corr-1',
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
      }),
      sink
    );

    emitTelemetry(
      createTelemetryEvent({
        eventType: 'casefile_signed',
        correlationId: 'corr-2',
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        casefileSha256: 'sha256:case',
        signerEpochId: 1,
      }),
      sink
    );

    assert.strictEqual(sink.events.length, 2);
    assert.strictEqual(sink.events[0].eventType, 'casefile_generated');
    assert.strictEqual(sink.events[1].eventType, 'casefile_signed');
  });

  it('memory sink can be cleared', () => {
    const sink = createMemorySink();

    emitTelemetry(
      createTelemetryEvent({
        eventType: 'casefile_generated',
        correlationId: 'corr',
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
      }),
      sink
    );

    assert.strictEqual(sink.events.length, 1);

    sink.clear();

    assert.strictEqual(sink.events.length, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Stdout Sink
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Stdout Sink', () => {
  it('createStdoutSink creates valid sink', () => {
    const sink = createStdoutSink();

    assert.ok(sink);
    assert.strictEqual(typeof sink.emit, 'function');
    assert.strictEqual(sink.type, 'stdout');
  });

  it('stdout sink uses JSONL format', () => {
    const outputs: string[] = [];
    const sink = createStdoutSink({
      writer: (line: string) => outputs.push(line),
    });

    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-stdout',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    emitTelemetry(event, sink);

    assert.strictEqual(outputs.length, 1);
    const parsed = JSON.parse(outputs[0].trim());
    assert.strictEqual(parsed.eventType, 'casefile_generated');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – File Sink
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – File Sink', () => {
  it('createFileSink creates valid sink', () => {
    const lines: string[] = [];
    const sink = createFileSink({
      path: '/tmp/telemetry.jsonl',
      appendFn: (line: string) => lines.push(line),
    });

    assert.ok(sink);
    assert.strictEqual(typeof sink.emit, 'function');
    assert.strictEqual(sink.type, 'file');
    assert.strictEqual(sink.path, '/tmp/telemetry.jsonl');
  });

  it('file sink appends JSONL lines', () => {
    const lines: string[] = [];
    const sink = createFileSink({
      path: '/tmp/telemetry.jsonl',
      appendFn: (line: string) => lines.push(line),
    });

    emitTelemetry(
      createTelemetryEvent({
        eventType: 'casefile_generated',
        correlationId: 'corr-1',
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
      }),
      sink
    );

    emitTelemetry(
      createTelemetryEvent({
        eventType: 'casefile_signed',
        correlationId: 'corr-2',
        repoIdentity: 'repo',
        outcome: 'SUCCESS',
        casefileSha256: 'sha256:case',
        signerEpochId: 1,
      }),
      sink
    );

    assert.strictEqual(lines.length, 2);
    assert.ok(lines[0].includes('casefile_generated'));
    assert.ok(lines[1].includes('casefile_signed'));
  });

  it('file sink is append-only', () => {
    const lines: string[] = [];
    const sink = createFileSink({
      path: '/tmp/telemetry.jsonl',
      appendFn: (line: string) => lines.push(line),
    });

    // Emit multiple events
    for (let i = 0; i < 5; i++) {
      emitTelemetry(
        createTelemetryEvent({
          eventType: 'casefile_generated',
          correlationId: `corr-${i}`,
          repoIdentity: 'repo',
          outcome: 'SUCCESS',
        }),
        sink
      );
    }

    assert.strictEqual(lines.length, 5);
    // Each line should be parseable independently
    for (const line of lines) {
      const parsed = JSON.parse(line.trim());
      assert.ok(parsed.eventType);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Multi-Sink Emission
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Multi-Sink Emission', () => {
  it('emitTelemetry sends to multiple sinks', () => {
    const memorySink = createMemorySink();
    const fileLines: string[] = [];
    const fileSink = createFileSink({
      path: '/tmp/telemetry.jsonl',
      appendFn: (line: string) => fileLines.push(line),
    });

    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-multi',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    emitTelemetry(event, memorySink);
    emitTelemetry(event, fileSink);

    assert.strictEqual(memorySink.events.length, 1);
    assert.strictEqual(fileLines.length, 1);
  });
});
