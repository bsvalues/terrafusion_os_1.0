/**
 * Phase 4N50 — Telemetry Rollup
 * ==============================
 *
 * Parse JSONL telemetry into deterministic summaries.
 *
 * Features:
 *   - Count event types correctly
 *   - Preserve correlation chains
 *   - Fail-closed on invalid JSONL
 *   - Deterministic output given same inputs
 *
 * @module ops/telemetry-rollup
 * @version 4N50.1
 */

import {
    TELEMETRY_VERSION,
    type TelemetryEnvelope,
    type TelemetryEventType,
} from '../telemetry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const TELEMETRY_ROLLUP_SCHEMA = 'terrafusion.autonomy.telemetry-rollup.v1';
export const TELEMETRY_ROLLUP_VERSION = '4N50.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ParseResult {
  readonly ok: boolean;
  readonly events: readonly TelemetryEnvelope[];
  readonly errors: readonly string[];
}

export interface CorrelationChainInfo {
  readonly eventCount: number;
  readonly eventTypes: readonly string[];
  readonly outcome: 'SUCCESS' | 'FAILURE' | 'MIXED';
}

export interface TelemetryRollupResult {
  readonly $schema: typeof TELEMETRY_ROLLUP_SCHEMA;
  readonly version: typeof TELEMETRY_ROLLUP_VERSION;
  readonly generatedAt: string;
  readonly totalEvents: number;
  readonly eventCounts: Readonly<Partial<Record<TelemetryEventType, number>>>;
  readonly outcomeStats: {
    readonly success: number;
    readonly failure: number;
    readonly successRate: number;
  };
  readonly correlationChains: {
    readonly total: number;
    readonly byId: Readonly<Record<string, CorrelationChainInfo>>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// parseJsonlEvents
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse JSONL telemetry input into events.
 * Fails-closed on invalid JSON or wrong schema.
 */
export function parseJsonlEvents(jsonl: string): ParseResult {
  const events: TelemetryEnvelope[] = [];
  const errors: string[] = [];
  let hasErrors = false;

  if (!jsonl || jsonl.trim() === '') {
    return { ok: true, events: [], errors: [] };
  }

  const lines = jsonl.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const lineNum = i + 1;

    try {
      const parsed = JSON.parse(line) as TelemetryEnvelope;

      // Validate schema version
      if (parsed.schemaVersion !== TELEMETRY_VERSION) {
        errors.push(
          `line ${lineNum}: invalid schema version "${parsed.schemaVersion}", expected "${TELEMETRY_VERSION}"`
        );
        hasErrors = true;
        continue;
      }

      events.push(parsed);
    } catch (e) {
      const err = e as Error;
      errors.push(`line ${lineNum}: ${err.message}`);
      hasErrors = true;
    }
  }

  return {
    ok: !hasErrors,
    events,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// computeRollup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a deterministic rollup summary from telemetry events.
 */
export function computeRollup(events: readonly TelemetryEnvelope[]): TelemetryRollupResult {
  // Count events by type
  const eventCounts: Partial<Record<TelemetryEventType, number>> = {};
  let successCount = 0;
  let failureCount = 0;

  // Track correlation chains
  const correlationMap: Record<
    string,
    { eventTypes: string[]; outcomes: ('SUCCESS' | 'FAILURE')[] }
  > = {};

  for (const event of events) {
    // Count by event type
    const eventType = event.eventType;
    eventCounts[eventType] = (eventCounts[eventType] ?? 0) + 1;

    // Count outcomes
    if (event.outcome === 'SUCCESS') {
      successCount++;
    } else {
      failureCount++;
    }

    // Track correlation chains
    const corrId = event.correlationId;
    if (!correlationMap[corrId]) {
      correlationMap[corrId] = { eventTypes: [], outcomes: [] };
    }
    correlationMap[corrId].eventTypes.push(eventType);
    correlationMap[corrId].outcomes.push(event.outcome);
  }

  // Build correlation chain info
  const correlationChains: Record<string, CorrelationChainInfo> = {};
  const corrIds = Object.keys(correlationMap).sort();

  for (const corrId of corrIds) {
    const chain = correlationMap[corrId];
    const hasSuccess = chain.outcomes.includes('SUCCESS');
    const hasFailure = chain.outcomes.includes('FAILURE');
    let outcome: 'SUCCESS' | 'FAILURE' | 'MIXED';
    if (hasSuccess && hasFailure) {
      outcome = 'MIXED';
    } else if (hasSuccess) {
      outcome = 'SUCCESS';
    } else {
      outcome = 'FAILURE';
    }

    correlationChains[corrId] = {
      eventCount: chain.eventTypes.length,
      eventTypes: chain.eventTypes,
      outcome,
    };
  }

  // Compute success rate
  const total = successCount + failureCount;
  const successRate = total > 0 ? Math.round((successCount / total) * 10000) / 100 : 0;

  return {
    $schema: TELEMETRY_ROLLUP_SCHEMA,
    version: TELEMETRY_ROLLUP_VERSION,
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    eventCounts,
    outcomeStats: {
      success: successCount,
      failure: failureCount,
      successRate,
    },
    correlationChains: {
      total: corrIds.length,
      byId: correlationChains,
    },
  };
}
