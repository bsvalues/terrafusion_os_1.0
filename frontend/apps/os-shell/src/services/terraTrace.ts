/**
 * TFR-027: TerraTrace Audit Event Service
 *
 * Append-only event spine for the TerraFusion OS.
 * Every mutation across any suite emits a trace event that is
 * fire-and-forget POSTed to /api/trace/events.
 * County-scoped via the current session context.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FieldDiff {
  field: string;
  before: unknown;
  after: unknown;
}

export interface TraceEvent {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  countyId: string;
  diffs: FieldDiff[];
  meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

let _countyId = '';
let _actor = '';

/**
 * Initialise session-scoped context so every event carries the
 * correct county and actor without the caller threading it through.
 */
export function initTraceContext(countyId: string, actor: string): void {
  _countyId = countyId;
  _actor = actor;
}

/** Accessor for current trace session context. Returns empty strings before init. */
export function getTraceContext(): { countyId: string; actor: string } {
  return { countyId: _countyId, actor: _actor };
}

function generateId(): string {
  return `tr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Compute a shallow diff between two plain objects.
 * Only top-level scalar / JSON-serialisable values are compared.
 */
export function computeDiff(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
): FieldDiff[] {
  if (!before && !after) return [];
  if (!before) {
    return Object.entries(after!).map(([field, value]) => ({
      field,
      before: undefined,
      after: value,
    }));
  }
  if (!after) {
    return Object.entries(before).map(([field, value]) => ({
      field,
      before: value,
      after: undefined,
    }));
  }

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diffs: FieldDiff[] = [];

  for (const key of allKeys) {
    const bVal = before[key];
    const aVal = after[key];
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      diffs.push({ field: key, before: bVal, after: aVal });
    }
  }

  return diffs;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Emit a trace event.  This is fire-and-forget — callers are never
 * blocked and network failures are silently swallowed so that the
 * critical-path write is never impeded by audit infrastructure.
 */
export function emitTraceEvent(
  action: string,
  entityType: string,
  entityId: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
): void {
  const event: TraceEvent = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    actor: _actor || 'unknown',
    countyId: _countyId || 'unknown',
    diffs: computeDiff(before, after),
  };

  // Fire-and-forget — intentionally no await, no .catch() propagation.
  void fetch('/api/trace/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(() => {
    // Swallow — audit infrastructure must never break the caller.
  });
}

// ---------------------------------------------------------------------------
// Phase 8: Intent/Result paired trace events
// ---------------------------------------------------------------------------

export interface TraceIntent {
  intentId: string;
  source: string;
  intent: string;
  countyId: string;
  actorId: string;
  timestamp: string;
}

export interface TraceResult {
  intentId: string;
  outcome: string;
  reason?: string;
  traceId: string;
  durationMs: number;
  timestamp: string;
}

const _intentLog: TraceIntent[] = [];
const _resultLog: TraceResult[] = [];

/** Emit an intent trace — call BEFORE operation execution */
export function emitIntent(intent: TraceIntent): void {
  _intentLog.push({ ...intent });
  emitTraceEvent(
    intent.intent,
    intent.source,
    intent.intentId,
    { countyId: intent.countyId, actorId: intent.actorId, type: 'INTENT' },
    undefined,
  );
}

/** Emit a result trace — call AFTER operation execution */
export function emitResult(result: TraceResult): void {
  _resultLog.push({ ...result });
  emitTraceEvent(
    result.outcome,
    'truthgate',
    result.intentId,
    { intentId: result.intentId, traceId: result.traceId, durationMs: result.durationMs, reason: result.reason, type: 'RESULT' },
    undefined,
  );
}

/** Get unpaired intents (intents without matching results) — for sweep tooling */
export function getUnpairedIntents(): TraceIntent[] {
  const resultIds = new Set(_resultLog.map(r => r.intentId));
  return _intentLog.filter(i => !resultIds.has(i.intentId));
}

/** Get the full intent/result log — for audit replay */
export function getTraceLog(): { intents: TraceIntent[]; results: TraceResult[] } {
  return { intents: [..._intentLog], results: [..._resultLog] };
}

/** Clear trace logs — for testing only */
export function _clearTraceLog(): void {
  _intentLog.length = 0;
  _resultLog.length = 0;
}
