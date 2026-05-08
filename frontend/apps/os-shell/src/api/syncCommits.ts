/**
 * ═══════════════════════════════════════════════════════════════
 * SYNC-UX-1B: WORKBENCH COMMIT + EVIDENCE API CLIENT
 *
 * Wraps the SYNC-WORKBENCH-G (commit) and SYNC-WORKBENCH-H
 * (evidence) backend surfaces. The /workbench/sync/commits
 * page consumes these to render the decision-history panel and
 * download evidence packets.
 *
 * Pattern mirrors src/api/syncDoctrine.ts (compact fetch-based;
 * no axios, no secrets, DTOs carry counts + timestamps + IDs).
 *
 * No mutation of triage / quarantine / canonical rows occurs from
 * this UI surface. All endpoints are operator-driven.
 * ═══════════════════════════════════════════════════════════════
 */

import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// ───────────────────────────────────────────────────────────────
// Commit types — mirror IWorkbenchCommitService DTOs
// ───────────────────────────────────────────────────────────────

export interface CommitCreateRequest {
  IdempotencyKey: string;
  OperatorId: string;
  CommitNote?: string | null;
}

export interface CommitCreateResponse {
  commitId: string;
  status: 'Created' | 'Idempotent' | string;
  routedDecisionsApplied: number;
  dismissedDecisionsApplied: number;
  committedAt: string;
  universeDistributionJson: string;
  ratioDistributionJson: string;
}

export interface CommitSummaryResponse {
  commitId: string;
  committedAt: string;
  operatorId: string;
  idempotencyKey: string;
  routedDecisionsApplied: number;
  dismissedDecisionsApplied: number;
  commitNote: string | null;
}

export interface CommitListResponse {
  count: number;
  limit: number;
  offset: number;
  items: CommitSummaryResponse[];
}

export interface DecisionLinkResponse {
  linkId: string;
  triageId: string;
  unprovenRowId: string;
  decisionType: 'Route' | 'Dismiss' | string;
  routedToUniverse: string | null;
  routedToIAttrValCd: string | null;
  dismissalReason: string | null;
}

export interface CommitDetailResponse extends CommitSummaryResponse {
  universeDistributionJson: string;
  ratioDistributionJson: string;
  decisions: DecisionLinkResponse[];
}

// ───────────────────────────────────────────────────────────────
// Distribution snapshot shapes (parsed from JSON strings)
// ───────────────────────────────────────────────────────────────

export interface UniverseDistribution {
  REAL_RESIDENTIAL: number;
  REAL_COMMERCIAL: number;
  MOBILE_HOME: number;
  AG_CURRENT_USE: number;
  PERSONAL_PROPERTY: number;
  CONVERSION_LEGACY: number;
  UNKNOWN: number;
}

export interface RatioDistribution {
  DorQ_CountyQ: number;
  DorQ_CountyN: number;
  DorN_CountyQ: number;
  DorN_CountyN: number;
}

export const UNIVERSE_KEYS: ReadonlyArray<keyof UniverseDistribution> = [
  'REAL_RESIDENTIAL',
  'REAL_COMMERCIAL',
  'MOBILE_HOME',
  'AG_CURRENT_USE',
  'PERSONAL_PROPERTY',
  'CONVERSION_LEGACY',
  'UNKNOWN',
];

export const RATIO_KEYS: ReadonlyArray<keyof RatioDistribution> = [
  'DorQ_CountyQ',
  'DorQ_CountyN',
  'DorN_CountyQ',
  'DorN_CountyN',
];

/**
 * Tolerant JSON parse for the universe-distribution snapshot. Returns null
 * when the payload is unparseable so the UI can render a "could not parse"
 * placeholder instead of crashing the panel.
 */
export function parseUniverseDistribution(json: string): UniverseDistribution | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const out = {} as UniverseDistribution;
    for (const k of UNIVERSE_KEYS) {
      const v = raw?.[k];
      out[k] = typeof v === 'number' && Number.isFinite(v) ? v : 0;
    }
    return out;
  } catch {
    return null;
  }
}

/** Tolerant parse for the 4-cell ratio-distribution snapshot. */
export function parseRatioDistribution(json: string): RatioDistribution | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const out = {} as RatioDistribution;
    for (const k of RATIO_KEYS) {
      const v = raw?.[k];
      out[k] = typeof v === 'number' && Number.isFinite(v) ? v : 0;
    }
    return out;
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// Error types
// ───────────────────────────────────────────────────────────────

/**
 * Thrown by createCommit when the backend returns a structured error
 * (400/404/409/500). The UI maps `status` to operator-facing toasts:
 *   409 → "no pending decisions"
 *   400 → input-validation error
 *   500 → generic failure
 */
export class CommitApiError extends Error {
  public readonly status: number;
  public readonly serverMessage: string | null;

  constructor(status: number, serverMessage: string | null, message?: string) {
    super(message ?? serverMessage ?? `HTTP ${status}`);
    this.name = 'CommitApiError';
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

async function readErrorMessage(res: Response): Promise<string | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      return parsed?.error ?? text;
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────
// Fetch functions — Commit (G)
// ───────────────────────────────────────────────────────────────

/**
 * <c>POST /api/sync/workbench/g/commit</c>
 *
 * 200 — Created or Idempotent commit returned.
 * 400 — Invalid request body.
 * 409 — Conflict (e.g., no pending decisions to commit).
 * Throws CommitApiError on non-2xx so callers can branch on status.
 */
export async function createCommit(
  request: CommitCreateRequest,
  signal?: AbortSignal,
): Promise<CommitCreateResponse> {
  const url = `${API_BASE_URL}/api/sync/workbench/g/commit`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!res.ok) {
    const msg = await readErrorMessage(res);
    throw new CommitApiError(res.status, msg);
  }
  return (await res.json()) as CommitCreateResponse;
}

/**
 * <c>GET /api/sync/workbench/g/commits?limit=&offset=</c>
 */
export async function listCommits(
  limit = 50,
  offset = 0,
  signal?: AbortSignal,
): Promise<CommitListResponse> {
  const url = `${API_BASE_URL}/api/sync/workbench/g/commits?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`listCommits failed: HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as CommitListResponse;
}

/**
 * <c>GET /api/sync/workbench/g/commits/{commitId}</c>
 */
export async function getCommit(
  commitId: string,
  signal?: AbortSignal,
): Promise<CommitDetailResponse> {
  const url = `${API_BASE_URL}/api/sync/workbench/g/commits/${encodeURIComponent(commitId)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`getCommit failed: HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as CommitDetailResponse;
}

// ───────────────────────────────────────────────────────────────
// Fetch functions — Evidence packet (H)
// ───────────────────────────────────────────────────────────────

/** Build the absolute href for the evidence ZIP download anchor. */
export function evidenceZipHref(commitId: string): string {
  return `${API_BASE_URL}/api/sync/workbench/h/evidence/${encodeURIComponent(commitId)}.zip`;
}

/** Fetch the manifest JSON for a commit (returns parsed object). */
export async function getEvidenceManifest(
  commitId: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const url = `${API_BASE_URL}/api/sync/workbench/h/evidence/${encodeURIComponent(
    commitId,
  )}/manifest`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`getEvidenceManifest failed: HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as unknown;
}

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

/**
 * Generate an RFC 4122 v4 idempotency key. Uses crypto.randomUUID when
 * available and falls back to a Math.random shim for older runtimes /
 * non-secure contexts (idempotency key is operator-supplied, not a
 * security boundary).
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback v4 shim (RFC4122-ish; NOT cryptographically strong).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** First 8 chars of a UUID — the operator-friendly short ID. */
export function shortId(id: string): string {
  return id?.slice(0, 8) ?? '';
}
