// WORKBENCH-V0.3 SLICE-L: OS Shell Identity Spine Panel API client.
// Calls /api/sync/workbench/identity-spine/* on the .NET backend.
// The backend spawns identity-runner.mjs and returns raw pipe-delimited stdout.
// Output parsing is done client-side in parseIdentityDriftOutput.ts.

const API_BASE_URL = '/api/sync/workbench/identity-spine';

// ── DTOs (mirror WorkbenchIdentitySpineController response schema) ─────────────

export interface IdentitySpineRunResponse {
  exitCode: number;    // 0 = completed · 2 = error (psql not found / query error)
  stdout: string;      // raw pipe-delimited output from identity-drift-detector.sql
  stderr: string;      // normally empty; psql errors appear here
  durationMs: number;
  timestamp: string;   // ISO-8601 UTC
  runningNow: false;   // always false in body (409 guard fires before this)
}

export interface IdentitySpineStatusResponse {
  running: boolean;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * POST /api/sync/workbench/identity-spine/run
 *
 * Spawns identity-runner.mjs and returns its raw pipe-delimited output.
 * Throws IdentityConflictError on 409, generic Error on network/5xx.
 */
export async function runIdentitySpine(
  signal?: AbortSignal,
): Promise<IdentitySpineRunResponse> {
  const res = await fetch(`${API_BASE_URL}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    throw new IdentityConflictError(
      (body as { error?: string }).error ??
        'Identity runner already running — please wait.',
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ??
        `Identity spine run failed with HTTP ${res.status}`,
    );
  }

  return res.json() as Promise<IdentitySpineRunResponse>;
}

/**
 * GET /api/sync/workbench/identity-spine/status
 *
 * Returns current run state without triggering a run.
 */
export async function getIdentitySpineStatus(
  signal?: AbortSignal,
): Promise<IdentitySpineStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/status`, { signal });
  if (!res.ok) throw new Error(`Identity spine status failed with HTTP ${res.status}`);
  return res.json() as Promise<IdentitySpineStatusResponse>;
}

// ── Custom error types ────────────────────────────────────────────────────────

export class IdentityConflictError extends Error {
  readonly type = 'IdentityConflictError' as const;
  constructor(message: string) {
    super(message);
    this.name = 'IdentityConflictError';
  }
}
