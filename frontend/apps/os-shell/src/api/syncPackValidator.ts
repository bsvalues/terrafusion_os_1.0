// WORKBENCH-V0.3 SLICE-K: OS Shell Source Pack Fit Panel API client.
// Calls /api/sync/workbench/source-pack/* on the .NET backend.
// The backend spawns pack-validator-runner.mjs and returns raw pipe-delimited stdout.
// Output parsing is done client-side in parsePackValidatorOutput.ts.

const API_BASE_URL = '/api/sync/workbench/source-pack';

// ── DTOs (mirror WorkbenchSourcePackController response schema) ───────────────

export interface PackValidatorRunResponse {
  exitCode: number;    // 0 = completed · 2 = error (psql not found / query error)
  stdout: string;      // raw pipe-delimited output from harris-pacs-pack-validator.sql
  stderr: string;      // normally empty; psql errors appear here
  durationMs: number;
  timestamp: string;   // ISO-8601 UTC
  runningNow: false;   // always false in body (409 guard fires before this)
}

export interface PackValidatorStatusResponse {
  running: boolean;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * POST /api/sync/workbench/source-pack/run
 *
 * Spawns pack-validator-runner.mjs and returns its raw pipe-delimited output.
 * Throws DoctorConflictError on 409, generic Error on network/5xx.
 */
export async function runPackValidator(
  signal?: AbortSignal,
): Promise<PackValidatorRunResponse> {
  const res = await fetch(`${API_BASE_URL}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    throw new PackValidatorConflictError(
      (body as { error?: string }).error ??
        'Pack validator already running — please wait.',
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ??
        `Pack validator run failed with HTTP ${res.status}`,
    );
  }

  return res.json() as Promise<PackValidatorRunResponse>;
}

/**
 * GET /api/sync/workbench/source-pack/status
 *
 * Returns current run state without triggering a run.
 */
export async function getPackValidatorStatus(
  signal?: AbortSignal,
): Promise<PackValidatorStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/status`, { signal });
  if (!res.ok) throw new Error(`Pack validator status failed with HTTP ${res.status}`);
  return res.json() as Promise<PackValidatorStatusResponse>;
}

// ── Custom error types ────────────────────────────────────────────────────────

export class PackValidatorConflictError extends Error {
  readonly type = 'PackValidatorConflictError' as const;
  constructor(message: string) {
    super(message);
    this.name = 'PackValidatorConflictError';
  }
}
