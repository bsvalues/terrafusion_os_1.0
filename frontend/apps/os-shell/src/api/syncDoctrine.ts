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

import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

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
  signal?: AbortSignal,
): Promise<DoctrineState> {
  const url = `${API_BASE_URL}/sync/doctrine/state?recentGateLimit=${recentGateLimit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`getDoctrineState failed: HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as DoctrineState;
}

/**
 * Light-weight per-lane row counts. Use for periodic polling when
 * the dashboard only needs lane health (not the full state).
 */
export async function getDoctrineLanes(signal?: AbortSignal): Promise<DoctrineLanes> {
  const url = `${API_BASE_URL}/sync/doctrine/lanes`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`getDoctrineLanes failed: HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as DoctrineLanes;
}

/**
 * Single-batch detail with all gate results. Used for drilldown
 * when an operator clicks a row in the recent-gate-failures pane.
 */
export async function getDoctrineBatch(
  loadBatchId: string,
  signal?: AbortSignal,
): Promise<DoctrineBatchDetail> {
  const url = `${API_BASE_URL}/sync/doctrine/batch/${encodeURIComponent(loadBatchId)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`getDoctrineBatch failed: HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as DoctrineBatchDetail;
}
