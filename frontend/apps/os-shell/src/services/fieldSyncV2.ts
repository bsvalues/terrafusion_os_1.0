// TerraFusion OS — Field Sync Engine v2
// Hardened with idempotency, retry backoff, conflict detection, and progress callbacks.
// Harvested from terra-forge-rebuild — Supabase-free, routes through .NET API.

import {
  getPendingObservations,
  getRetryableObservations,
  markObservationSynced,
  markObservationError,
  resetObservationForRetry,
  type StoredObservation,
} from "./fieldStoreV2";

// ── Constants ──────────────────────────────────────────────────────
const MAX_RETRY_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 1000;

// ── Progress Callback ──────────────────────────────────────────────
export interface SyncProgress {
  total: number;
  completed: number;
  errors: number;
  currentObservation: string | null;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

// ── Sync Result ────────────────────────────────────────────────────
export interface SyncResult {
  synced: number;
  errors: number;
  conflicts: number;
  retried: number;
}

// ── Backend Adapter ────────────────────────────────────────────────
// Pluggable adapter so the sync engine is backend-agnostic
export interface FieldSyncAdapter {
  /** Post an observation to the backend. Return "success" or "conflict". */
  postObservation(obs: StoredObservation): Promise<"success" | "conflict">;
}

// Default adapter: routes through the OS .NET API
const defaultAdapter: FieldSyncAdapter = {
  async postObservation(obs: StoredObservation): Promise<"success" | "conflict"> {
    const apiPort = (globalThis as Record<string, unknown>).TF_API_PORT ?? 5046;
    const res = await fetch(`http://localhost:${apiPort}/api/field/observations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parcelId: obs.parcelId,
        assignmentId: obs.assignmentId,
        type: obs.type,
        timestamp: obs.timestamp,
        latitude: obs.latitude,
        longitude: obs.longitude,
        data: obs.data,
      }),
    });

    if (res.status === 409) return "conflict";
    if (!res.ok) throw new Error(`Sync failed: ${res.status} ${res.statusText}`);
    return "success";
  },
};

/**
 * Process all pending field observations through the backend.
 */
export async function syncPendingObservations(
  onProgress?: SyncProgressCallback,
  adapter: FieldSyncAdapter = defaultAdapter,
): Promise<SyncResult> {
  const pending = await getPendingObservations();
  let synced = 0;
  let errors = 0;
  let conflicts = 0;

  const progress: SyncProgress = {
    total: pending.length,
    completed: 0,
    errors: 0,
    currentObservation: null,
  };

  for (const obs of pending) {
    progress.currentObservation = obs.id;
    onProgress?.(progress);

    try {
      const result = await adapter.postObservation(obs);
      if (result === "conflict") {
        await markObservationError(obs.id, "Conflict: parcel modified since assignment");
        conflicts++;
        progress.errors++;
      } else {
        await markObservationSynced(obs.id);
        synced++;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown sync error";
      await markObservationError(obs.id, message);
      errors++;
      progress.errors++;
    }

    progress.completed++;
    onProgress?.(progress);
  }

  return { synced, errors, conflicts, retried: 0 };
}

/**
 * Retry failed observations with exponential backoff.
 */
export async function retryFailedObservations(
  onProgress?: SyncProgressCallback,
  adapter: FieldSyncAdapter = defaultAdapter,
): Promise<SyncResult> {
  const retryable = await getRetryableObservations(MAX_RETRY_ATTEMPTS);
  let synced = 0;
  let errors = 0;
  let conflicts = 0;

  const progress: SyncProgress = {
    total: retryable.length,
    completed: 0,
    errors: 0,
    currentObservation: null,
  };

  for (const obs of retryable) {
    // Exponential backoff
    const backoffMs = BACKOFF_BASE_MS * Math.pow(2, obs.syncAttempts || 0);
    await new Promise((r) => setTimeout(r, Math.min(backoffMs, 8000)));

    await resetObservationForRetry(obs.id);

    progress.currentObservation = obs.id;
    onProgress?.(progress);

    try {
      const result = await adapter.postObservation(obs);
      if (result === "conflict") {
        await markObservationError(obs.id, "Conflict: parcel modified since assignment");
        conflicts++;
        progress.errors++;
      } else {
        await markObservationSynced(obs.id);
        synced++;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Retry failed";
      await markObservationError(obs.id, message);
      errors++;
      progress.errors++;
    }

    progress.completed++;
    onProgress?.(progress);
  }

  return { synced, errors, conflicts, retried: retryable.length };
}

/**
 * Full sync cycle: process pending + retry failed.
 */
export async function fullSyncCycle(
  onProgress?: SyncProgressCallback,
  adapter?: FieldSyncAdapter,
): Promise<SyncResult> {
  const pendingResult = await syncPendingObservations(onProgress, adapter);
  const retryResult = await retryFailedObservations(onProgress, adapter);

  return {
    synced: pendingResult.synced + retryResult.synced,
    errors: pendingResult.errors + retryResult.errors,
    conflicts: pendingResult.conflicts + retryResult.conflicts,
    retried: retryResult.retried,
  };
}
