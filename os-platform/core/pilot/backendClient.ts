/**
 * TerraFusion OS — Backend HTTP Client
 *
 * Thin wrapper for calling the .NET backend API from the Node.js core platform.
 * Uses native `fetch` (Node 18+). No external deps.
 *
 * The base URL is resolved from environment variables per port governance rules:
 *   TF_API_BASE_URL  (full override)   → e.g. http://backend:5046
 *   TF_API_PORT      (port-only)       → defaults to 5046
 *
 * ⚠️  NEVER hardcode ports. See .github/copilot-instructions.md § PORT RULES.
 */

// ============================================================================
// Configuration
// ============================================================================

function resolveBaseUrl(): string {
  if (process.env.TF_API_BASE_URL) {
    return process.env.TF_API_BASE_URL.replace(/\/+$/, '');
  }
  const port = process.env.TF_API_PORT || '5046';
  return `http://localhost:${port}`;
}

// ============================================================================
// Types
// ============================================================================

export interface BackendResponse<T = unknown> {
  ok: true;
  status: number;
  data: T;
}

export interface BackendError {
  ok: false;
  status: number;
  error: string;
  raw?: string;
}

export type BackendResult<T = unknown> = BackendResponse<T> | BackendError;

/**
 * Unwrap a BackendResult, throwing on error. Use in handlers for clean control flow.
 */
export function unwrapBackend<T>(result: BackendResult<T>, label: string): T {
  if (result.ok === false) {
    throw new Error(`${label}: ${result.error}`);
  }
  return result.data;
}

// ============================================================================
// Call Options
// ============================================================================

export interface BackendCallOptions {
  /** Bearer token. When provided, sets Authorization header. */
  token?: string;
}

// ============================================================================
// Client
// ============================================================================

/**
 * POST JSON to a backend endpoint. Returns typed result.
 */
export async function backendPost<T = unknown>(
  path: string,
  body: unknown,
  options?: BackendCallOptions
): Promise<BackendResult<T>> {
  const url = `${resolveBaseUrl()}${path}`;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, error: `Backend ${res.status}: ${res.statusText}`, raw: text };
    }
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    return { ok: true, status: res.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, error: `Backend unreachable: ${message}` };
  }
}

/**
 * GET from a backend endpoint. Returns typed result.
 */
export async function backendGet<T = unknown>(
  path: string,
  options?: BackendCallOptions
): Promise<BackendResult<T>> {
  const url = `${resolveBaseUrl()}${path}`;
  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, error: `Backend ${res.status}: ${res.statusText}`, raw: text };
    }
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    return { ok: true, status: res.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, error: `Backend unreachable: ${message}` };
  }
}

/**
 * PUT JSON to a backend endpoint. Returns typed result.
 */
export async function backendPut<T = unknown>(
  path: string,
  body: unknown,
  options?: BackendCallOptions
): Promise<BackendResult<T>> {
  const url = `${resolveBaseUrl()}${path}`;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, error: `Backend ${res.status}: ${res.statusText}`, raw: text };
    }
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    return { ok: true, status: res.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, error: `Backend unreachable: ${message}` };
  }
}
