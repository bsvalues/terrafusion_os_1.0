/**
 * ═══════════════════════════════════════════════════════════════
 * SYNC-UX-1C: FULL-CORPUS SYNC RUNNER API CLIENT
 *
 * Wraps the durable full-corpus runner endpoints introduced by
 * SYNC-COMPLETE-2 and exposed at /api/sync/corpus/*.
 *
 * Endpoints (see backend FullCorpusController):
 *   POST /api/sync/corpus/start             → 202 { runId, status }
 *   POST /api/sync/corpus/{runId}/resume    → 202 | 404 | 409
 *   GET  /api/sync/corpus/recent            → { runs }
 *   GET  /api/sync/corpus/{runId}           → { run, lanes }
 *   GET  /api/sync/corpus/{runId}/reconciliation
 *                                           → { run, reconciliations }
 *   GET  /api/sync/corpus/{runId}/evidence.zip → signed ZIP
 *
 * Pattern mirrors src/api/syncDoctrine.ts (compact fetch-based).
 * ═══════════════════════════════════════════════════════════════
 */

import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// ───────────────────────────────────────────────────────────────
// DTO types — mirror FullCorpusController response shapes.
// ───────────────────────────────────────────────────────────────

export type RunStatus =
  | 'Queued'
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Interrupted'
  | 'Resumed';

export type LaneStatus =
  | 'Pending'
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Skipped';

export type ReconciliationStatus =
  | 'Match'
  | 'AcceptableDelta'
  | 'Investigate';

export type ExpectedBasis =
  | 'RAW_SOURCE'
  | 'DOCTRINE_FILTERED'
  | 'DEDUPED_CANONICAL'
  | 'EXTERNAL_FEATURE_COUNT';

/**
 * Lane order — used by the backend orchestrator and rendered
 * left-to-right in the lane progress strip.
 */
export const LaneOrder = [
  'parcel',
  'owner-wsdor',
  'improvement',
  'land',
  'sales',
  'geometry',
] as const;

export type LaneName = (typeof LaneOrder)[number];

/** Run snapshot — single FullCorpusRun row in the controller envelope. */
export interface FullCorpusRunResponse {
  runId: string;
  operatorName: string;
  workingYear: number;
  status: RunStatus;
  currentLane: LaneName | null;
  nextLaneOnResume: LaneName | null;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
}

/** Lane result — one row per lane (six per run). */
export interface FullCorpusLaneResultResponse {
  laneResultId: string;
  runId: string;
  lane: LaneName;
  status: LaneStatus;
  startedAt: string | null;
  finishedAt: string | null;
  batchIdsJson: string | null;
  countsJson: string | null;
  gateSummaryJson: string | null;
  quarantineDeltaJson: string | null;
  errorMessage: string | null;
}

/** Reconciliation row — one per lane after completion. */
export interface FullCorpusReconciliationResponse {
  reconciliationId: string;
  runId: string;
  lane: LaneName;
  expectedBasis: ExpectedBasis;
  pacsSourceCount: number;
  tfCanonicalCount: number;
  delta: number;
  deltaPct: number;
  tolerancePct: number;
  reconciliationStatus: ReconciliationStatus;
  notes: string | null;
  computedAt: string;
}

/** GET /{runId} envelope. */
export interface CorpusStatusResponse {
  run: FullCorpusRunResponse;
  lanes: FullCorpusLaneResultResponse[];
}

/** GET /{runId}/reconciliation envelope. */
export interface CorpusReconciliationResponseEnvelope {
  run: FullCorpusRunResponse;
  reconciliations: FullCorpusReconciliationResponse[];
}

/** POST /start request. */
export interface StartCorpusRequest {
  operatorName: string;
  workingYear: number;
}

/** POST /start | /resume response. */
export interface CorpusStartOrResumeResponse {
  runId: string;
  status: RunStatus;
}

export interface RecentRunEntry {
  runId: string;
  operatorName: string;
  workingYear: number;
  status: RunStatus;
  currentLane: LaneName | null;
  nextLaneOnResume: LaneName | null;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
}

export interface CorpusRecentRunsResponseEnvelope {
  runs: RecentRunEntry[];
}

/** Resume mutation outcome. */
export type ResumeOutcome =
  | { kind: 'ok'; runId: string; status: RunStatus }
  | { kind: 'conflict'; error: string; status?: RunStatus }
  | { kind: 'notFound'; error: string };

// ───────────────────────────────────────────────────────────────
// Fetch functions
// ───────────────────────────────────────────────────────────────

/**
 * Enqueue a new full-corpus run. Returns 202 with the new run id;
 * the hosted worker picks it up within ~5s.
 */
export async function postCorpusStart(
  request: StartCorpusRequest,
  signal?: AbortSignal,
): Promise<CorpusStartOrResumeResponse> {
  const url = `${API_BASE_URL}/api/sync/corpus/start`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      OperatorName: request.operatorName,
      WorkingYear: request.workingYear,
    }),
    signal,
  });
  if (!res.ok) {
    throw new Error(
      `postCorpusStart failed: HTTP ${res.status} ${res.statusText}`,
    );
  }
  return (await res.json()) as CorpusStartOrResumeResponse;
}

/**
 * Flip a Failed | Interrupted run back to Queued. Returns:
 *  - { kind: 'ok' }      on 202
 *  - { kind: 'notFound' }on 404
 *  - { kind: 'conflict' }on 409 (run not in resumable state)
 *
 * Throws only on transport-level failures.
 */
export async function postCorpusResume(
  runId: string,
  signal?: AbortSignal,
): Promise<ResumeOutcome> {
  const url = `${API_BASE_URL}/api/sync/corpus/${encodeURIComponent(runId)}/resume`;
  const res = await fetch(url, { method: 'POST', signal });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 202) {
    return {
      kind: 'ok',
      runId: String(body.runId ?? runId),
      status: (body.status as RunStatus) ?? 'Queued',
    };
  }
  if (res.status === 404) {
    return {
      kind: 'notFound',
      error: String(body.error ?? 'Run not found'),
    };
  }
  if (res.status === 409) {
    return {
      kind: 'conflict',
      error: String(body.error ?? 'Run not in resumable state'),
      status: body.status as RunStatus | undefined,
    };
  }
  throw new Error(`postCorpusResume failed: HTTP ${res.status} ${res.statusText}`);
}

/** Fetch recent persisted full-corpus runs from backend state. */
export async function getCorpusRecentRuns(
  limit = 10,
  signal?: AbortSignal,
): Promise<RecentRunEntry[]> {
  const boundedLimit = Math.max(1, Math.min(50, Math.trunc(limit)));
  const url = `${API_BASE_URL}/api/sync/corpus/recent?limit=${boundedLimit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(
      `getCorpusRecentRuns failed: HTTP ${res.status} ${res.statusText}`,
    );
  }
  const body = (await res.json()) as CorpusRecentRunsResponseEnvelope;
  return Array.isArray(body.runs) ? body.runs : [];
}

/** Fetch run + 6 lane results. */
export async function getCorpusStatus(
  runId: string,
  signal?: AbortSignal,
): Promise<CorpusStatusResponse> {
  const url = `${API_BASE_URL}/api/sync/corpus/${encodeURIComponent(runId)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(
      `getCorpusStatus failed: HTTP ${res.status} ${res.statusText}`,
    );
  }
  return (await res.json()) as CorpusStatusResponse;
}

/**
 * Fetch reconciliation envelope. The reconciliations array is
 * empty until the run reaches Completed and the post-drain
 * reconciliation pass populates rows.
 */
export async function getCorpusReconciliation(
  runId: string,
  signal?: AbortSignal,
): Promise<CorpusReconciliationResponseEnvelope> {
  const url = `${API_BASE_URL}/api/sync/corpus/${encodeURIComponent(runId)}/reconciliation`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(
      `getCorpusReconciliation failed: HTTP ${res.status} ${res.statusText}`,
    );
  }
  return (await res.json()) as CorpusReconciliationResponseEnvelope;
}

/** Direct download URL for the corpus evidence ZIP. */
export function getCorpusEvidenceZipUrl(runId: string): string {
  return `${API_BASE_URL}/api/sync/corpus/${encodeURIComponent(runId)}/evidence.zip`;
}
