/**
 * Phase 4N45c – Telemetry Sinks
 * =============================
 *
 * Transport-agnostic sinks for telemetry emission:
 *   - StdoutSink: JSONL to stdout (baseline)
 *   - FileSink: Append-only JSONL file (air-gap compatible)
 *   - MemorySink: In-memory buffer for testing
 *
 * @module telemetry-sinks
 * @version 4N45.1
 */

import type { TelemetryEnvelope } from './telemetry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Sink Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface TelemetrySink {
  readonly type: 'stdout' | 'file' | 'memory' | 'http';
  readonly path?: string;
  emit(event: TelemetryEnvelope): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSONL Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format an event as a single-line JSON (JSONL format).
 */
export function formatAsJsonl(event: TelemetryEnvelope): string {
  // Sort keys for deterministic output
  const eventRecord = event as unknown as Record<string, unknown>;
  const sortedKeys = Object.keys(eventRecord).sort();
  const sorted: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    const value = eventRecord[key];
    if (value !== undefined) {
      sorted[key] = value;
    }
  }

  return JSON.stringify(sorted) + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory Sink (Test Helper)
// ─────────────────────────────────────────────────────────────────────────────

export interface MemorySink extends TelemetrySink {
  readonly type: 'memory';
  readonly events: TelemetryEnvelope[];
  clear(): void;
}

/**
 * Create an in-memory sink for testing.
 */
export function createMemorySink(): MemorySink {
  const events: TelemetryEnvelope[] = [];

  return {
    type: 'memory',
    events,
    emit(event: TelemetryEnvelope): void {
      events.push(event);
    },
    clear(): void {
      events.length = 0;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stdout Sink
// ─────────────────────────────────────────────────────────────────────────────

export interface StdoutSinkOptions {
  /** Custom writer function (for testing) */
  readonly writer?: (line: string) => void;
}

export interface StdoutSink extends TelemetrySink {
  readonly type: 'stdout';
}

/**
 * Create a stdout JSONL sink.
 */
export function createStdoutSink(options?: StdoutSinkOptions): StdoutSink {
  const writer = options?.writer ?? ((line: string) => process.stdout.write(line));

  return {
    type: 'stdout',
    emit(event: TelemetryEnvelope): void {
      writer(formatAsJsonl(event));
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// File Sink
// ─────────────────────────────────────────────────────────────────────────────

export interface FileSinkOptions {
  /** Path to the JSONL file */
  readonly path: string;
  /** Custom append function (for testing without filesystem) */
  readonly appendFn?: (line: string) => void;
}

export interface FileSink extends TelemetrySink {
  readonly type: 'file';
  readonly path: string;
}

/**
 * Create an append-only file JSONL sink.
 */
export function createFileSink(options: FileSinkOptions): FileSink {
  const { path, appendFn } = options;

  // Default append function uses fs (lazy import to avoid requiring fs in tests)
  const append =
    appendFn ??
    ((line: string) => {
      // Dynamic import to avoid requiring fs when using custom appendFn
      // This allows the sink to work in browser/test environments
      import('node:fs').then(fs => {
        fs.appendFileSync(path, line);
      });
    });

  return {
    type: 'file',
    path,
    emit(event: TelemetryEnvelope): void {
      append(formatAsJsonl(event));
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Emit Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit a telemetry event to a sink.
 *
 * This is the primary entry point for telemetry emission.
 */
export function emitTelemetry(event: TelemetryEnvelope, sink: TelemetrySink): void {
  sink.emit(event);
}

/**
 * Emit a telemetry event to multiple sinks.
 */
export function emitTelemetryToAll(
  event: TelemetryEnvelope,
  sinks: readonly TelemetrySink[]
): void {
  for (const sink of sinks) {
    sink.emit(event);
  }
}
