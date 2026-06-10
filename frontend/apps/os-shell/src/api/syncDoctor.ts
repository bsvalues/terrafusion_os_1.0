// WORKBENCH-V0.3 SLICE-J: OS Shell Doctor Panel API client.
// Calls /api/sync/workbench/doctor/* on the .NET backend.
// The backend spawns tf-sync-doctor.mjs and returns raw stdout.
// Output parsing is done client-side in parseDoctorOutput.ts.

const API_BASE_URL = '/api/sync/workbench/doctor';

// ── DTOs (mirror WorkbenchDoctorController response schema) ──────────────────

export interface DoctorRunResponse {
  exitCode: number;       // 0=PASS/WARN · 1=FAIL · 2=error
  stdout: string;         // raw stdout from tf-sync-doctor.mjs
  stderr: string;         // normally empty
  durationMs: number;
  timestamp: string;      // ISO-8601 UTC
  runningNow: false;      // always false in body (409 guard fires before this)
}

export interface DoctorStatusResponse {
  running: boolean;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * POST /api/sync/workbench/doctor/run
 *
 * Spawns the doctor tool and returns its raw output.
 * Throws on network error or HTTP 5xx.
 * Returns the response body for HTTP 409 so callers can detect concurrent runs.
 */
export async function runDoctor(signal?: AbortSignal): Promise<DoctorRunResponse> {
  const res = await fetch(`${API_BASE_URL}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (res.status === 409) {
    // Concurrent run — return a synthetic result so the UI shows the "already running" message.
    const body = await res.json().catch(() => ({}));
    throw new DoctorConflictError(
      (body as { error?: string }).error ?? 'Doctor is already running — please wait.',
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Doctor run failed with HTTP ${res.status}`,
    );
  }

  return res.json() as Promise<DoctorRunResponse>;
}

/**
 * GET /api/sync/workbench/doctor/status
 *
 * Returns current run state without triggering a run.
 */
export async function getDoctorStatus(signal?: AbortSignal): Promise<DoctorStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/status`, { signal });
  if (!res.ok) throw new Error(`Doctor status failed with HTTP ${res.status}`);
  return res.json() as Promise<DoctorStatusResponse>;
}

// ── Custom error types ────────────────────────────────────────────────────────

export class DoctorConflictError extends Error {
  readonly type = 'DoctorConflictError' as const;
  constructor(message: string) {
    super(message);
    this.name = 'DoctorConflictError';
  }
}
