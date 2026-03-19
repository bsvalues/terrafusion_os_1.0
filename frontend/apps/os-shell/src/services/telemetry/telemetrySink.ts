/**
 * Telemetry Sink
 *
 * Subscribes to the trace bus and batches writes to the telemetry store.
 * Provides buffering and periodic flushing for performance.
 *
 * @module services/telemetry/telemetrySink
 * @see Slice 20: Persisted Telemetry Backend
 */

import type { OsActionTracePayload } from '../osActions';
import type { StoredTraceEvent, TelemetryStore } from './telemetryStore';

// ============================================================================
// Types
// ============================================================================

export interface TelemetrySinkConfig {
  /** Number of events to buffer before flushing (default: 10) */
  batchSize: number;

  /** Flush interval in milliseconds (default: 250) */
  flushIntervalMs: number;
}

export interface TelemetrySinkStats {
  /** Total events ingested */
  ingestedCount: number;

  /** Total events flushed to store */
  flushedCount: number;

  /** Events currently in buffer */
  bufferedCount: number;
}

export interface TelemetrySink {
  /** Ingest a trace event into the buffer */
  ingest(event: TraceEventInput): void;

  /** Flush buffered events to store immediately */
  flush(): Promise<void>;

  /** Stop the sink (flushes remaining events) */
  stop(): Promise<void>;

  /** Get sink statistics */
  stats(): TelemetrySinkStats;
}

/** Input event format from the trace bus */
export interface TraceEventInput {
  type: 'os_action_invoked' | 'os_action_completed' | 'os_action_failed';
  payload: OsActionTracePayload;
  timestamp: number;
}

// ============================================================================
// Implementation
// ============================================================================

let idCounter = 0;

function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const counter = (idCounter++).toString(36);
  return `te-${timestamp}-${random}-${counter}`;
}

export function createTelemetrySink(
  store: TelemetryStore,
  config: TelemetrySinkConfig
): TelemetrySink {
  let buffer: StoredTraceEvent[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let ingestedCount = 0;
  let flushedCount = 0;
  let isRunning = true;
  let pendingFlush: Promise<void> | null = null;

  // Start flush timer
  flushTimer = setInterval(() => {
    if (buffer.length > 0 && isRunning) {
      pendingFlush = doFlush();
    }
  }, config.flushIntervalMs);

  async function doFlush(): Promise<void> {
    if (buffer.length === 0) return;

    const toFlush = buffer;
    buffer = [];

    // Write each event individually (adapter handles batching internally if needed)
    for (const event of toFlush) {
      try {
        await store.append(event);
        flushedCount++;
      } catch (error) {
        // Log but continue - best effort persistence
      }
    }
  }

  function transformEvent(input: TraceEventInput): StoredTraceEvent {
    return {
      id: generateEventId(),
      type: input.type,
      timestamp: input.timestamp,
      payload: {
        actionId: input.payload.actionId,
        actionType: input.payload.actionType,
        intent: input.payload.intent,
        surface: input.payload.surface,
        suiteId: input.payload.suiteId,
        href: input.payload.href,
        tabId: input.payload.tabId,
        parcelIdHash: input.payload.parcelIdHash,
        errorCode: input.payload.errorCode,
        durationMs: input.payload.durationMs,
      },
    };
  }

  return {
    ingest(event: TraceEventInput): void {
      if (!isRunning) return;

      const storedEvent = transformEvent(event);
      buffer.push(storedEvent);
      ingestedCount++;

      // Flush if batch size reached
      if (buffer.length >= config.batchSize) {
        pendingFlush = doFlush();
      }
    },

    async flush(): Promise<void> {
      // Wait for any pending flush first
      if (pendingFlush) {
        await pendingFlush;
        pendingFlush = null;
      }
      // Then flush remaining buffer
      await doFlush();
    },

    async stop(): Promise<void> {
      isRunning = false;

      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }

      // Final flush (waits for pending)
      await this.flush();
    },

    stats(): TelemetrySinkStats {
      return {
        ingestedCount,
        flushedCount,
        bufferedCount: buffer.length,
      };
    },
  };
}

// ============================================================================
// Singleton Instance with Trace Bus Integration
// ============================================================================

import { subscribeToAllTraces } from '../osActions';
import { getTelemetryStore } from './telemetryStore';

const DEFAULT_SINK_CONFIG: TelemetrySinkConfig = {
  batchSize: 10,
  flushIntervalMs: 250,
};

let defaultSink: TelemetrySink | null = null;
let unsubscribe: (() => void) | null = null;

export function startTelemetrySink(): TelemetrySink {
  if (defaultSink) return defaultSink;

  defaultSink = createTelemetrySink(getTelemetryStore(), DEFAULT_SINK_CONFIG);

  // Subscribe to trace bus
  unsubscribe = subscribeToAllTraces((event) => {
    if (
      event.type === 'os_action_invoked' ||
      event.type === 'os_action_completed' ||
      event.type === 'os_action_failed'
    ) {
      defaultSink!.ingest({
        type: event.type,
        payload: event.payload as OsActionTracePayload,
        timestamp: Date.now(),
      });
    }
  });

  return defaultSink;
}

export async function stopTelemetrySink(): Promise<void> {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  if (defaultSink) {
    await defaultSink.stop();
    defaultSink = null;
  }
}

export function getTelemetrySink(): TelemetrySink | null {
  return defaultSink;
}
