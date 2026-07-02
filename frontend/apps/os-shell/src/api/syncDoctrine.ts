/**
 * ═══════════════════════════════════════════════════════════════
 * DASHBOARD-1: SYNC DOCTRINE API CLIENT
 *
 * Wraps the operator status read surface
 * (GET /api/sync/doctrine/state)
 * (GET /api/sync/doctrine/lanes)
 * (GET /api/sync/doctrine/batch/{guid})
 *
 * The sync-doctrine console renders the data from these endpoints
 * as a read-only status board. Pattern mirrors
 * src/api/workbenchSyncReadiness.ts (compact fetch-based; no axios).
 *
 * Distinct from sync-readiness: that surface is operator-driven
 * probe-on-click against PACS. This surface is the doctrine
 * pipeline's own canonical state — the snapshot is the answer.
 * 30s polling is appropriate (DB reads, not PACS probes).
 *
 * No secrets. No PII. DTOs carry counts, timestamps, status enums,
 * lineage identifiers per the doctrine isolation contract.
 * ═══════════════════════════════════════════════════════════════
 */

import { apiFetch, apiFetchJson } from '@/lib/apiBase';

// Invariant B (see src/lib/apiBase.ts): pass BARE paths (no /api prefix, no
// absolute base). apiFetch/apiFetchJson prepend /api in the browser so every
// request rides the Vite proxy — no hardcoded VITE_API_URL, no CORS bypass.

// ───────────────────────────────────────────────────────────────
// DTO types — mirror DoctrineStatusController response shape.
// ───────────────────────────────────────────────────────────────

export interface DoctrineCanonicalCounts {
  tf_parcel: number;
  tf_sale: number;
  tf_owner: number;
  tf_parcel_owner_link: number;
  tf_assessment_wsdor: number;
  tf_improvement: number;
  tf_improvement_feature: number;
  tf_land: number;
  tf_parcel_geom: number;
}

export interface DoctrineTruthCounts {
  truth_pacs_sale: number;
  truth_pacs_parcel_spine: number;
  truth_pacs_owner_current: number;
  truth_pacs_wash_prop_owner_val: number;
  truth_pacs_imprv_current: number;
  truth_pacs_land_current: number;
}

export interface DoctrineRawCounts {
  legacy_pacs_raw_sale: number;
  legacy_pacs_raw_property: number;
  legacy_pacs_raw_prop_supp_assoc: number;
  legacy_pacs_raw_account: number;
  legacy_pacs_raw_owner: number;
  legacy_pacs_raw_wash_prop_owner_val: number;
  legacy_pacs_raw_imprv: number;
  legacy_pacs_raw_imprv_detail: number;
  legacy_pacs_raw_imprv_attr: number;
  legacy_pacs_raw_land_detail: number;
}

export interface DoctrineQuarantineCounts {
  legacy_tf_unproven_sale: number;
  legacy_tf_unproven_owner_current: number;
  legacy_tf_unproven_wash_prop_owner_val: number;
  legacy_tf_unproven_imprv_current: number;
  legacy_tf_unproven_imprv_attr: number;
  legacy_tf_unproven_land_current: number;
}

export interface DoctrineLastCompletedRow {
  sourceSystem: string;
  lastCompletedAt: string | null;
  rowsExtracted: number | null;
  rowsPromoted: number | null;
}

export interface DoctrineGateFailureRow {
  loadBatchId: string;
  gateName: string;
  gateStage: string;
  status: string; // 'FAIL' | 'WARN'
  expected: string | null;
  actual: string | null;
  detail: string | null;
  executedAt: string;
}

export interface DoctrineOutcomeSummary {
  status: string;
  count: number;
}

export interface DoctrineCounty {
  id: string;
  name: string;
  state: string;
  fipsCode: string | null;
}

export interface DoctrineState {
  snapshotAt: string;
  operational: boolean;
  summary: {
    canonicalRowsTotal: number;
    quarantineRowsTotal: number;
    countiesBound: number;
  };
  canonical: DoctrineCanonicalCounts;
  truth: DoctrineTruthCounts;
  raw: DoctrineRawCounts;
  quarantine: DoctrineQuarantineCounts;
  lastCompleted: DoctrineLastCompletedRow[];
  batchOutcomeSummary: DoctrineOutcomeSummary[];
  gateOutcomeSummary: DoctrineOutcomeSummary[];
  recentGateFailures: DoctrineGateFailureRow[];
  counties: DoctrineCounty[];
}

export interface DoctrineLane {
  lane: string;
  canonicalCount: number;
  truthCount: number;
  rawCount: number;
  quarantineCount: number;
}

export interface DoctrineLanes {
  snapshotAt: string;
  lanes: DoctrineLane[];
}

export interface DoctrineBatchDetail {
  batch: {
    loadBatchId: string;
    sourceFamily: string;
    sourceSystem: string;
    sourceFileOrDatabase: string | null;
    sourceQueryHash: string | null;
    operator: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    rowsExtracted: number | null;
    rowsPromoted: number | null;
    errorSummary: string | null;
  };
  gates: Array<{
    gateName: string;
    gateStage: string;
    status: string;
    expected: string | null;
    actual: string | null;
    detail: string | null;
    executedAt: string;
  }>;
}

// ───────────────────────────────────────────────────────────────
// Fetch functions
// ───────────────────────────────────────────────────────────────

/**
 * Fetch the full doctrine state snapshot. ~20 KB JSON; suitable
 * for the main dashboard load and 30s polling refresh.
 */
export async function getDoctrineState(
  recentGateLimit = 25,
  signal?: AbortSignal
): Promise<DoctrineState> {
  return apiFetchJson<DoctrineState>(`/sync/doctrine/state?recentGateLimit=${recentGateLimit}`, {
    signal,
  });
}

/**
 * Light-weight per-lane row counts. Use for periodic polling when
 * the dashboard only needs lane health (not the full state).
 */
export async function getDoctrineLanes(signal?: AbortSignal): Promise<DoctrineLanes> {
  return apiFetchJson<DoctrineLanes>('/sync/doctrine/lanes', { signal });
}

/**
 * Single-batch detail with all gate results. Used for drilldown
 * when an operator clicks a row in the recent-gate-failures pane.
 */
export async function getDoctrineBatch(
  loadBatchId: string,
  signal?: AbortSignal
): Promise<DoctrineBatchDetail> {
  return apiFetchJson<DoctrineBatchDetail>(
    `/sync/doctrine/batch/${encodeURIComponent(loadBatchId)}`,
    { signal }
  );
}

// ───────────────────────────────────────────────────────────────
// SYNC-COMPLETE-2 — single-lane drain endpoints. The full-corpus
// run-all-lanes call exceeds curl's 6h timeout in production; these
// per-lane drains let the operator checkpoint after each lane.
// ───────────────────────────────────────────────────────────────

/** Lane keys exposed by the backend's DoctrineDrainController. */
export type DrainLaneName =
  | 'parcel'
  | 'owner-wsdor'
  | 'improvement'
  | 'land'
  | 'sales'
  | 'geometry';

export interface DoctrineDrainRequest {
  /** Audit anchor written on every batch this lane creates. */
  operatorName: string;
  /** PACS prop_val_yr filter. Default 2026 (Benton's active year). */
  workingYear?: number;
  /** When true (default), seed source TopN is null = full corpus. */
  fullCorpus?: boolean;
  /** Override per-lane safe defaults (200/500). Effective only when fullCorpus=false. */
  topN?: number | null;
}

/** Shape returned by every drain endpoint, success or failure. */
export interface DoctrineDrainResponse {
  lane: DrainLaneName;
  status: 'Succeeded' | 'Failed';
  /** Set on Failed responses; identifies which stage tripped. */
  failedStage?: string;
  /** Set on Failed responses; raw error summary string. */
  error?: string | null;
  batchIds: string[];
  counts: {
    rowsLanded: number;
    rowsPromotedToTruth: number;
    rowsCanonicalized: number;
    rowsQuarantinedThisLane: number;
  };
  durationSec: number;
  gateSummary: {
    totals: Array<{ status: string; count: number }>;
    recentFailures: Array<{
      loadBatchId: string;
      gateName: string;
      gateStage: string;
      status: string;
      expected: string | null;
      actual: string | null;
      detail: string | null;
      executedAt: string;
    }>;
  };
  quarantineDelta: {
    before: number;
    after: number;
    delta: number;
  };
  nextRecommendedLane: DrainLaneName | null;
}

/**
 * Trigger a single-lane doctrine drain. The request blocks until the
 * lane finishes (or fails) — wall-clock can be many minutes; for
 * full-corpus runs the operator should still use curl with
 * <c>-m 21600</c>. The browser fetch will time out before then.
 *
 * Failed responses come back as HTTP 500 with the same envelope
 * shape; this fn parses both and returns a typed object either way.
 * It throws only on transport-level failures (network down, abort).
 */
export async function postDoctrineDrain(
  lane: DrainLaneName,
  request: DoctrineDrainRequest,
  signal?: AbortSignal
): Promise<DoctrineDrainResponse> {
  const body = JSON.stringify({
    OperatorName: request.operatorName,
    WorkingYear: request.workingYear ?? 2026,
    FullCorpus: request.fullCorpus ?? true,
    TopN: request.topN ?? null,
  });
  // apiFetch (not apiFetchJson) — this endpoint returns the SAME envelope on
  // both 200 (Succeeded) and 500 (Failed); we must parse the body ourselves,
  // so we need the raw Response rather than a throw-on-non-2xx helper.
  const res = await apiFetch(`/sync/doctrine/drain/${lane}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal,
  });
  // Both Succeeded (200) and Failed (500) carry the envelope.
  const text = await res.text();
  let parsed: DoctrineDrainResponse;
  try {
    parsed = JSON.parse(text) as DoctrineDrainResponse;
  } catch (e) {
    throw new Error(
      `postDoctrineDrain(${lane}) HTTP ${res.status} returned non-JSON: ${text.slice(0, 200)}`
    );
  }
  return parsed;
}
