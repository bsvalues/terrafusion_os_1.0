/**
 * ═══════════════════════════════════════════════════════════════
 * OPS-1-B: WORKBENCH SYNC READINESS API CLIENT
 *
 * Wraps the OPS-1-A backend facade
 * (GET  /api/workbench/sync-readiness)
 * (POST /api/workbench/sync-readiness/refresh)
 *
 * The frontend NEVER reads SyncAtlas artifact files directly; it
 * consumes sanitized DTOs through this client. Pattern mirrors
 * src/api/canonPing.ts (compact fetch-based client; no axios).
 *
 * No secrets. No PII. The DTOs carry only counts, timestamps,
 * status enums, and identifiers per the OPS-1 hard guards.
 * ═══════════════════════════════════════════════════════════════
 */

import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// ───────────────────────────────────────────────────────────────
// DTO types — mirror the OPS-1-A backend contract verbatim.
// ───────────────────────────────────────────────────────────────

export type SyncReadinessStatusValue = 'YES' | 'WARN' | 'NO' | 'UNKNOWN';

export interface SyncReadinessPanel {
  status: SyncReadinessStatusValue | string; // tolerant of unknown values
  headline: string;
  detail?: string | null;
  capturedAtUtc?: string | null;
  source: string;
}

export interface SyncReadinessLastProof {
  catalogHealth: string;
  invariantArtifact: string;
  preflightEvidence: string;
  coverageReport: string;
}

export interface SyncReadiness {
  countyId: string;
  sourceConnectionId: string;
  workbookId?: string | null;
  assembledAtUtc: string;
  reachability: SyncReadinessPanel;
  catalogHealth: SyncReadinessPanel;
  invariants: SyncReadinessPanel;
  preflights: SyncReadinessPanel;
  coverage: SyncReadinessPanel;
  lastProof: SyncReadinessLastProof;
}

export interface SyncReadinessRefreshSurface {
  surface: string;
  succeeded: boolean;
  exitCode?: number | null;
  stderrSummary?: string | null;
  completedAtUtc: string;
}

export interface SyncReadinessRefresh {
  readiness: SyncReadiness;
  sessionArtifactDir: string;
  startedAtUtc: string;
  completedAtUtc: string;
  surfaces: Record<string, SyncReadinessRefreshSurface>;
}

// ───────────────────────────────────────────────────────────────
// API calls.
// ───────────────────────────────────────────────────────────────

export interface SyncReadinessScope {
  countyId: string;
  sourceConnectionId: string;
  workbookId?: string;
}

export async function getSyncReadiness(scope: SyncReadinessScope): Promise<SyncReadiness> {
  const params = new URLSearchParams({
    countyId: scope.countyId,
    sourceConnectionId: scope.sourceConnectionId,
  });
  if (scope.workbookId) params.set('workbookId', scope.workbookId);

  const url = `${API_BASE_URL}/api/workbench/sync-readiness?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`GET sync-readiness failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as SyncReadiness;
}

export interface SyncReadinessRefreshArgs {
  countyId: string;
  sourceConnectionId: string;
  workbookId: string;
}

export async function refreshSyncReadiness(
  args: SyncReadinessRefreshArgs,
): Promise<SyncReadinessRefresh> {
  const params = new URLSearchParams({
    countyId: args.countyId,
    sourceConnectionId: args.sourceConnectionId,
    workbookId: args.workbookId,
  });
  const url = `${API_BASE_URL}/api/workbench/sync-readiness/refresh?${params.toString()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`POST sync-readiness/refresh failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as SyncReadinessRefresh;
}
