/**
 * TerraTrace Projection Feed (READ-ONLY)
 *
 * Provides:
 *  - types for trace events
 *  - strict sanitization (PII redaction) so we never leak sensitive data
 *  - a deterministic read-only request handler with injected dependencies
 */

export type Risk = 'read_only' | 'write_low' | 'write_high' | 'irreversible';

export type TraceEvent = Readonly<{
  id: string;
  ts: string;
  countyId: string;
  actorId: string;
  subjectId?: string;
  tool?: string;
  risk?: Risk;
  kind: string;
  message?: string;
  payload?: unknown;
  correlationId?: string;
}>;

export type TraceProjection = Readonly<{
  id: string;
  ts: string;
  countyId: string;
  actorId: string;
  subjectId?: string;
  tool?: string;
  risk?: Risk;
  kind: string;
  message?: string;
  projectionPayload?: unknown;
  correlationId?: string;
}>;

export type TraceQuery = Readonly<{
  countyId: string;
  subjectId?: string;
  since?: string;
  limit?: number;
}>;

export interface TraceStore {
  /** Returns events; handler normalizes. MUST be read-only. */
  listEvents(query: TraceQuery): Promise<TraceEvent[]>;
}

export interface Rbac {
  /** Returns true if actor can read trace for a county. */
  canReadTrace(input: { actorId: string; countyId: string }): Promise<boolean>;
}

export type TraceFeedDeps = Readonly<{
  store: TraceStore;
  rbac: Rbac;
  nowIso?: () => string;
  maxLimit?: number;
}>;

const DEFAULT_MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

/**
 * Redact common PII patterns from any string.
 * This is trace-safety, not full DLP. Phase 2 can widen detectors.
 */
export function redactPiiFromString(s: string): string {
  const ssn = /\b\d{3}-\d{2}-\d{4}\b/g;
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const phone =
    /(?:^|(?<=\s))(?:\+?1[\s.-]?)?(?:\(\s*\d{3}\s*\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g;

  return s
    .replace(ssn, '[REDACTED_SSN]')
    .replace(email, '[REDACTED_EMAIL]')
    .replace(phone, '[REDACTED_PHONE]');
}

/**
 * Deep-sanitize unknown payloads:
 * - strings get PII redaction
 * - arrays/objects recursively sanitized
 * - primitives returned as-is
 * - functions/symbols are stripped (not JSON-safe anyway)
 */
export function sanitizeUnknown(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  const t = typeof input;

  if (t === 'string') return redactPiiFromString(input as string);
  if (t === 'number' || t === 'boolean') return input;

  if (Array.isArray(input)) return input.map(sanitizeUnknown);

  if (t === 'object') {
    const obj = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = sanitizeUnknown(v);
    }
    return out;
  }

  return '[REDACTED_NON_JSON]';
}

/** Convert a raw event into a safe projection for read-only feed. */
export function toProjection(e: TraceEvent): TraceProjection {
  return {
    id: e.id,
    ts: e.ts,
    countyId: e.countyId,
    actorId: e.actorId,
    subjectId: e.subjectId,
    tool: e.tool,
    risk: e.risk,
    kind: e.kind,
    message: e.message ? redactPiiFromString(e.message) : undefined,
    projectionPayload: e.payload !== undefined ? sanitizeUnknown(e.payload) : undefined,
    correlationId: e.correlationId,
  };
}

/**
 * Fetch-style handler: (req) => Response
 * Headers: x-actor-id
 * Query params: countyId (required), subjectId, since, limit
 */
export function createTraceFeedHandler(deps: TraceFeedDeps) {
  const maxLimit = deps.maxLimit ?? DEFAULT_MAX_LIMIT;
  const nowIso = deps.nowIso ?? (() => new Date().toISOString());

  return async function handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (req.method !== 'GET') {
      return json(405, { ok: false, error: 'MethodNotAllowed', now: nowIso() });
    }

    const actorId = req.headers.get('x-actor-id')?.trim();
    if (!actorId) {
      return json(401, { ok: false, error: 'MissingActor', now: nowIso() });
    }

    const countyId = url.searchParams.get('countyId')?.trim() ?? '';
    if (!countyId) {
      return json(400, { ok: false, error: 'MissingCountyId', now: nowIso() });
    }

    const allowed = await deps.rbac.canReadTrace({ actorId, countyId });
    if (!allowed) {
      return json(403, { ok: false, error: 'Forbidden', now: nowIso() });
    }

    const subjectId = url.searchParams.get('subjectId')?.trim() || undefined;
    const since = url.searchParams.get('since')?.trim() || undefined;

    const limitRaw = url.searchParams.get('limit')?.trim();
    const limitParsed = limitRaw ? Number(limitRaw) : DEFAULT_LIMIT;
    const limit = clampInt(limitParsed, 1, maxLimit);

    const events = await deps.store.listEvents({ countyId, subjectId, since, limit });

    const sliced = events.slice(0, limit);
    const projections = sliced.map(toProjection);

    return json(200, {
      ok: true,
      now: nowIso(),
      query: { countyId, subjectId, since, limit },
      events: projections,
    });
  };
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
