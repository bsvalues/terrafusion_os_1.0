/**
 * ═══════════════════════════════════════════════════════════════
 * WORKBENCH-V0.2 SLICE-I: QUARANTINE REVIEW API CLIENT
 *
 * Wraps the Slice I backend endpoints:
 *   GET  /api/sync/workbench/quarantine/review
 *   POST /api/sync/workbench/quarantine/review/{ref}/decision
 *
 * Doctrine invariants mirrored from the controller:
 *   - ACCEPT_AS_IS means reviewed + acknowledged; NOT promoted.
 *   - Source quarantine rows are NEVER mutated by this client.
 *   - Allowed dispositions: ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH.
 *   - No bulk action. No release. No canonical mutation.
 *
 * Per docs/sync/workbench/SLICE_I_QUARANTINE_REVIEW_CONTRACT.md §3 + §7.
 * ═══════════════════════════════════════════════════════════════
 */

import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL: string = (getViteEnv().VITE_API_URL as string | undefined) ?? '';

// ── Closed vocabularies ────────────────────────────────────────────────────────

/** Allowed operator dispositions. No other values accepted by the backend. */
export const ReviewDispositions = [
  'ACCEPT_AS_IS',
  'REJECT_PERMANENTLY',
  'NEEDS_RESEARCH',
] as const satisfies readonly string[];
export type ReviewDisposition = (typeof ReviewDispositions)[number];

/** Sentinel value for rows with no decision yet. Not sent to the backend. */
export const UNREVIEWED = 'UNREVIEWED' as const;
export type ReviewDispositionOrUnreviewed = ReviewDisposition | typeof UNREVIEWED;

// ── DTOs ───────────────────────────────────────────────────────────────────────

/** A single quarantine row joined with its current (latest) operator disposition. */
export interface QuarantineReviewRow {
  /** UUID of the quarantine row (string form of UnprovenRowId). */
  quarantineRowRef: string;
  propValYr: number;
  supNum: number;
  propId: number;
  imprvId: number;
  imprvDetId: number;
  iAttrValId: number;
  iAttrValCd: string;
  attrValueText: string | null;
  attrValueNumeric: number | null;
  quarantineReason: string;
  quarantineReasonDetail: string | null;
  universeCode: string | null;
  quarantinedAt: string;
  /** ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH | UNREVIEWED */
  currentDisposition: ReviewDispositionOrUnreviewed;
  currentNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  currentDecisionId: number | null;
}

export interface QuarantineReviewBrowseResponse {
  lane: string;
  totalSourceCount: number;
  returnedCount: number;
  items: QuarantineReviewRow[];
  notice: string;
}

export interface QuarantineReviewBrowseParams {
  lane?: string;
  limit?: number;
  reason?: string;
  disposition?: string;
}

export interface SaveDecisionRequestBody {
  lane: string;
  disposition: ReviewDisposition;
  note?: string;
  operatorIdentity?: string;
}

export interface SaveDecisionResponse {
  decisionId: number;
  disposition: string;
  savedAt: string;
  sourceRowCountAfterSave: number;
  notice: string;
}

// ── Error type ─────────────────────────────────────────────────────────────────

export class QuarantineReviewApiError extends Error {
  status: number;
  body: { error?: string } | null;
  constructor(status: number, message: string, body: { error?: string } | null) {
    super(message);
    this.name = 'QuarantineReviewApiError';
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

// ── Fetch functions ────────────────────────────────────────────────────────────

/**
 * Browse quarantine rows for a lane, joined with current disposition.
 * Source rows are immutable — this is read-only.
 */
export async function browseQuarantineReview(
  params: QuarantineReviewBrowseParams,
  signal?: AbortSignal,
): Promise<QuarantineReviewBrowseResponse> {
  const qs = new URLSearchParams();
  qs.set('lane', params.lane ?? 'imprv_attr');
  qs.set('limit', String(params.limit ?? 50));
  if (params.reason) qs.set('reason', params.reason);
  if (params.disposition) qs.set('disposition', params.disposition);

  const url = `${API_BASE_URL}/sync/workbench/quarantine/review?${qs.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new QuarantineReviewApiError(
      res.status,
      `browseQuarantineReview failed: HTTP ${res.status} ${res.statusText}`,
      body,
    );
  }
  return (await res.json()) as QuarantineReviewBrowseResponse;
}

/**
 * Append an operator disposition for a quarantine row.
 *
 * Does NOT release, promote, or delete the source quarantine row.
 * ACCEPT_AS_IS means reviewed + acknowledged only.
 */
export async function saveQuarantineReviewDecision(
  quarantineRowRef: string,
  body: SaveDecisionRequestBody,
  signal?: AbortSignal,
): Promise<SaveDecisionResponse> {
  const url = `${API_BASE_URL}/sync/workbench/quarantine/review/${encodeURIComponent(quarantineRowRef)}/decision`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new QuarantineReviewApiError(
      res.status,
      `saveQuarantineReviewDecision failed: HTTP ${res.status} ${res.statusText}`,
      errBody,
    );
  }
  return (await res.json()) as SaveDecisionResponse;
}
