/**
 * ═══════════════════════════════════════════════════════════════
 * SYNC-UX-1A: SYNC QUARANTINE TRIAGE API CLIENT
 *
 * Wraps the SYNC-WORKBENCH-F triage surface:
 *   GET  /api/sync/workbench/f/quarantine/imprv-attr
 *   POST /api/sync/workbench/f/quarantine/imprv-attr/{id}/route
 *   POST /api/sync/workbench/f/quarantine/imprv-attr/{id}/dismiss
 *
 * Pattern mirrors src/api/syncDoctrine.ts (compact fetch-based;
 * no axios). DTOs are camelCase to match ASP.NET default System.Text.Json
 * naming policy on the controller's record returns.
 *
 * The triage page is the operator-facing surface for the
 * imprv_attr quarantine cohort surfaced by SYNC-DOCTRINE-4-IMPL-V8.
 * Decisions are doctrine-immutable on the source quarantine row and
 * are recorded on a sibling triage table; this client never mutates
 * the quarantine entity itself.
 *
 * No secrets. No PII beyond the canonical (PropId, ImprvId, ImprvDetId,
 * IAttrValCd) tuple already exposed by the doctrine console.
 * ═══════════════════════════════════════════════════════════════
 */

import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// ───────────────────────────────────────────────────────────────
// Closed vocabularies — mirror server-side const lists exactly.
// Adding a value here without server agreement will surface as a
// 400 InvalidInput from the controller's MapList/MapRoute paths.
// ───────────────────────────────────────────────────────────────

export const QuarantineReasons = [
  'UNKNOWN_UNIVERSE',
  'UNKNOWN_FOR_UNIVERSE_DICTIONARY',
  'UNIVERSE_NOT_EVALUATED',
  'DICTIONARY_NOT_LOADED_FOR_UNIVERSE',
  'LEGACY_CLASSIFICATION_UNCERTAIN',
] as const;
export type QuarantineReason = (typeof QuarantineReasons)[number];

export const UniverseCodes = [
  'REAL_RESIDENTIAL',
  'REAL_COMMERCIAL',
  'MOBILE_HOME',
  'AG_CURRENT_USE',
  'PERSONAL_PROPERTY',
  'CONVERSION_LEGACY',
  'UNKNOWN',
] as const;
export type UniverseCode = (typeof UniverseCodes)[number];

export const DismissalReasons = [
  'IntentionalNoise',
  'LegitimateMissing',
  'ConversionArtifact',
] as const;
export type DismissalReason = (typeof DismissalReasons)[number];

export const TriageStatuses = ['Open', 'Routed', 'Dismissed'] as const;
export type TriageStatus = (typeof TriageStatuses)[number];

// ───────────────────────────────────────────────────────────────
// DTOs — camelCase to match ASP.NET record serialization.
// ───────────────────────────────────────────────────────────────

export interface QuarantineRowResponse {
  unprovenRowId: string;
  propId: number;
  propValYr: number;
  supNum: number;
  imprvId: number;
  imprvDetId: number;
  iAttrValId: number;
  iAttrValCd: string;
  attrValueText: string | null;
  attrValueNumeric: number | null;
  quarantineReason: string;
  quarantineReasonDetail: string | null;
  universeCode: string | null;
  createdAt: string;
  triageStatus: string;
  suggestedReroute: string | null;
}

export interface QuarantineListResponse {
  count: number;
  limit: number;
  offset: number;
  items: QuarantineRowResponse[];
}

export interface RouteDecisionPayload {
  triageId: string;
  unprovenRowId: string;
  status: string;
  routedToUniverse: string;
  routedToIAttrValCd: string | null;
  updatedAt: string;
}

export interface DismissDecisionPayload {
  triageId: string;
  unprovenRowId: string;
  status: string;
  dismissalReason: string;
  updatedAt: string;
}

export interface RouteRequestBody {
  TargetUniverse: string;
  TargetIAttrValCd?: string | null;
  OperatorNote?: string | null;
}

export interface DismissRequestBody {
  DismissalReason: string;
  OperatorNote?: string | null;
}

// ───────────────────────────────────────────────────────────────
// Error envelope — surfaces the shape the controller returns on
// non-2xx so the UI can format conflict / not-found / validation
// messages without re-parsing fetch errors.
// ───────────────────────────────────────────────────────────────

export class QuarantineApiError extends Error {
  status: number;
  body: { error?: string } | null;
  constructor(status: number, message: string, body: { error?: string } | null) {
    super(message);
    this.name = 'QuarantineApiError';
    this.status = status;
    this.body = body;
  }
}

async function readErrorBody(res: Response): Promise<{ error?: string } | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as { error?: string };
    } catch {
      return { error: text };
    }
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// Filter / pagination input
// ───────────────────────────────────────────────────────────────

export interface QuarantineListParams {
  reason?: QuarantineReason | '';
  universe?: UniverseCode | '';
  propId?: number | null;
  limit?: number;
  offset?: number;
  /**
   * Client-only filter: status is not a server-side filter today.
   * Status filtering is applied in the page hook over fetched rows.
   */
  status?: TriageStatus | 'All';
}

// ───────────────────────────────────────────────────────────────
// Fetch functions
// ───────────────────────────────────────────────────────────────

/**
 * Fetch one page of imprv-attr quarantine rows. Reason / universe /
 * propId are optional server-side filters; limit/offset are required
 * for paging. The server caps limit; passing larger values is safe
 * but the response will reflect the server-side cap.
 */
export async function listQuarantineImprvAttr(
  params: QuarantineListParams,
  signal?: AbortSignal,
): Promise<QuarantineListResponse> {
  const qs = new URLSearchParams();
  if (params.reason) qs.set('reason', params.reason);
  if (params.universe) qs.set('universe', params.universe);
  if (params.propId !== undefined && params.propId !== null && !Number.isNaN(params.propId)) {
    qs.set('propId', String(params.propId));
  }
  qs.set('limit', String(params.limit ?? 100));
  qs.set('offset', String(params.offset ?? 0));

  const url = `${API_BASE_URL}/sync/workbench/f/quarantine/imprv-attr?${qs.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new QuarantineApiError(
      res.status,
      `listQuarantineImprvAttr failed: HTTP ${res.status} ${res.statusText}`,
      body,
    );
  }
  return (await res.json()) as QuarantineListResponse;
}

/**
 * Record a route decision against a single quarantined row. The
 * server is idempotent on identical re-routes (200 with the
 * existing decision); cross-target re-routes return 409 Conflict.
 */
export async function routeQuarantineImprvAttr(
  unprovenRowId: string,
  body: RouteRequestBody,
  signal?: AbortSignal,
): Promise<RouteDecisionPayload> {
  const url = `${API_BASE_URL}/sync/workbench/f/quarantine/imprv-attr/${encodeURIComponent(unprovenRowId)}/route`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new QuarantineApiError(
      res.status,
      `routeQuarantineImprvAttr failed: HTTP ${res.status} ${res.statusText}`,
      errBody,
    );
  }
  return (await res.json()) as RouteDecisionPayload;
}

/**
 * Record a dismiss decision. Idempotent on identical reason; cross-
 * branch (Routed → Dismissed) and divergent reasons surface as 409.
 */
export async function dismissQuarantineImprvAttr(
  unprovenRowId: string,
  body: DismissRequestBody,
  signal?: AbortSignal,
): Promise<DismissDecisionPayload> {
  const url = `${API_BASE_URL}/sync/workbench/f/quarantine/imprv-attr/${encodeURIComponent(unprovenRowId)}/dismiss`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new QuarantineApiError(
      res.status,
      `dismissQuarantineImprvAttr failed: HTTP ${res.status} ${res.statusText}`,
      errBody,
    );
  }
  return (await res.json()) as DismissDecisionPayload;
}

// ───────────────────────────────────────────────────────────────
// Bulk helpers — fan out N parallel mutations with a configurable
// concurrency cap. Each item resolves to an outcome record so the
// UI can render per-row status without short-circuiting on the
// first failure.
// ───────────────────────────────────────────────────────────────

export type BulkOutcome<TPayload> =
  | { unprovenRowId: string; status: 'ok'; payload: TPayload }
  | { unprovenRowId: string; status: 'error'; error: QuarantineApiError | Error };

const DEFAULT_PARALLELISM = 8;

async function runWithConcurrency<TPayload>(
  ids: readonly string[],
  worker: (id: string) => Promise<TPayload>,
  parallelism: number,
): Promise<BulkOutcome<TPayload>[]> {
  const results: BulkOutcome<TPayload>[] = new Array(ids.length);
  let cursor = 0;

  async function pull(): Promise<void> {
    while (cursor < ids.length) {
      const i = cursor++;
      const id = ids[i]!;
      try {
        const payload = await worker(id);
        results[i] = { unprovenRowId: id, status: 'ok', payload };
      } catch (e) {
        const error =
          e instanceof QuarantineApiError
            ? e
            : e instanceof Error
              ? e
              : new Error(String(e));
        results[i] = { unprovenRowId: id, status: 'error', error };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(Math.max(1, parallelism), ids.length || 1) },
    () => pull(),
  );
  await Promise.all(workers);
  return results;
}

export async function bulkRouteQuarantineImprvAttr(
  ids: readonly string[],
  body: RouteRequestBody,
  parallelism: number = DEFAULT_PARALLELISM,
): Promise<BulkOutcome<RouteDecisionPayload>[]> {
  return runWithConcurrency(
    ids,
    (id) => routeQuarantineImprvAttr(id, body),
    parallelism,
  );
}

export async function bulkDismissQuarantineImprvAttr(
  ids: readonly string[],
  body: DismissRequestBody,
  parallelism: number = DEFAULT_PARALLELISM,
): Promise<BulkOutcome<DismissDecisionPayload>[]> {
  return runWithConcurrency(
    ids,
    (id) => dismissQuarantineImprvAttr(id, body),
    parallelism,
  );
}
