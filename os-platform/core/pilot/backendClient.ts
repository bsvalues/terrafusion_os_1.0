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
  /** Actual caller credentials: local application only, never follow redirects. */
  callerAuthorization?: boolean;
  /** Correlation metadata only; never used as authorization. */
  correlationId?: string;
}

function requestUrl(path: string, options?: BackendCallOptions): string {
  const base = resolveBaseUrl();
  if (options?.callerAuthorization) {
    const target = new URL(base);
    if (!options.token || !['http:', 'https:'].includes(target.protocol) ||
        !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) ||
        target.username || target.password || target.pathname !== '/' || target.search || target.hash)
      throw new Error('Caller authorization requires a loopback backend destination.');
  }
  return `${base}${path}`;
}

// ============================================================================
// Client
// ============================================================================

/** Bounded authenticated regression read preserving exact UTF-8 JSON bytes for Atlas provenance. */
export async function backendGetAtlasRegression(
  query: URLSearchParams,
  options: BackendCallOptions
): Promise<BackendResult<{ body: string }>> {
  try {
    const url = requestUrl(`/api/terraforge/regression?${query}`, { ...options, callerAuthorization: true });
    const headers: Record<string, string> = { Accept: 'application/json', Authorization: `Bearer ${options.token}` };
    if (options.correlationId && /^[A-Za-z0-9._-]{1,128}$/.test(options.correlationId))
      headers['X-Correlation-ID'] = options.correlationId;
    const response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      return { ok: false, status: response.status, error: 'Spatial observation source unavailable.' };
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength;
        if (size > 1024 * 1024) throw new Error('Spatial source response exceeds limit.');
        chunks.push(next.value);
      }
    } finally { await reader.cancel(); reader.releaseLock(); }
    const bytes = Buffer.concat(chunks);
    const body = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    return { ok: true, status: response.status, data: { body } };
  } catch {
    return { ok: false, status: 0, error: 'Spatial observation source unavailable or invalid.' };
  }
}

/**
 * POST JSON to a backend endpoint. Returns typed result.
 */
export async function backendPost<T = unknown>(
  path: string,
  body: unknown,
  options?: BackendCallOptions
): Promise<BackendResult<T>> {
  try {
    const url = requestUrl(path, options);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options?.correlationId && /^[A-Za-z0-9._-]{1,128}$/.test(options.correlationId))
      headers['X-Correlation-ID'] = options.correlationId;
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
      redirect: options?.callerAuthorization ? 'error' : 'follow',
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
  try {
    const url = requestUrl(path, options);
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (options?.correlationId && /^[A-Za-z0-9._-]{1,128}$/.test(options.correlationId))
      headers['X-Correlation-ID'] = options.correlationId;
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15_000),
      redirect: options?.callerAuthorization ? 'error' : 'follow',
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
