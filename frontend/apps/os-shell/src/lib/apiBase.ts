/**
 * TerraFusion OS - Centralized API Base Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * GOVERNANCE: All API clients MUST use this module for base URL resolution.
 *
 * INVARIANT B (LOCKED):
 * - Callsites pass paths WITHOUT /api prefix (e.g., '/agents/events')
 * - This module prepends '/api' in browser context
 * - Vite proxy forwards /api/* → backend
 *
 * WHY RELATIVE PATHS:
 * - In browser builds, Vite's proxy handles /api → backend forwarding
 * - This works in dev (localhost:5173 → localhost:5000) and production (same-origin)
 * - Hardcoded absolute URLs bypass the proxy, causing CORS issues and 404s
 *
 * USAGE:
 *   import { buildApiUrl } from '@/lib/apiBase';
 *   const url = buildApiUrl('/agents/events');  // → "/api/agents/events"
 *
 * FORBIDDEN:
 *   buildApiUrl('/api/agents/events')  // THROWS - /api prefix not allowed
 *   fetch('http://localhost:5000/...')  // BYPASS - use apiFetch instead
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getViteEnv } from '../shared/viteEnv';
import { getToken, setToken } from '../auth/authStorage';

let devTokenPromise: Promise<string | null> | null = null;

function envFlag(value: unknown): boolean {
  return String(value ?? '').toLowerCase() === 'true';
}

function shouldUseDevPreviewToken(): boolean {
  const env = getViteEnv();
  const explicitPreviewBypass =
    envFlag(env.VITE_USE_MOCK_DATA) || envFlag(env.VITE_DEV_PREVIEW_BYPASS_AUTH);
  const viteDevMode =
    envFlag(env.DEV) && String(env.MODE ?? '').toLowerCase() === 'development';
  const forceAuthInDev = envFlag(env.VITE_ENFORCE_AUTH_IN_DEV);

  return explicitPreviewBypass || (viteDevMode && !forceAuthInDev);
}

async function getBearerTokenForApiFetch(path: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const existing = getToken();
  if (existing) return existing;
  if (path === '/auth/dev-token' || !shouldUseDevPreviewToken()) return null;

  devTokenPromise ??= fetch('/api/auth/dev-token')
    .then(async (response) => {
      if (!response.ok) return null;
      const payload = await response.json() as { token?: unknown };
      return typeof payload.token === 'string' && payload.token.length > 0
        ? payload.token
        : null;
    })
    .catch(() => null);

  const token = await devTokenPromise;
  if (token) setToken(token);
  return token;
}

/**
 * Returns the API base URL.
 * - Browser/Vite: Always returns '/api' (uses proxy)
 * - Node/SSR: Can use VITE_API_URL for server-to-server calls
 */
export function getApiBase(): string {
  // In browser context, ALWAYS use relative path to leverage Vite proxy
  if (typeof window !== 'undefined') {
    return '/api';
  }

  // In Node/SSR context, allow absolute URL for server-to-server communication
  const env = getViteEnv();
  const envUrl = env.VITE_API_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return envUrl.replace(/\/$/, '');
  }

  return '/api';
}

/**
 * Builds a full API URL from a path.
 * INVARIANT B: path must NOT include /api prefix (we add it).
 *
 * @param path - API path (e.g., '/agents/events') - MUST start with '/', MUST NOT start with '/api'
 * @returns Full URL (e.g., '/api/agents/events')
 * @throws Error if path violates invariant
 */
export function buildApiUrl(path: string): string {
  // Hard guard: path must start with /
  if (!path.startsWith('/')) {
    throw new Error(`[apiBase] Path must start with "/": got "${path}"`);
  }

  // Hard guard: path must NOT include /api prefix (Invariant B)
  if (path.startsWith('/api/') || path === '/api') {
    throw new Error(
      `[apiBase] Do not prefix /api at call sites (Invariant B). Got "${path}", expected "${path.replace(/^\/api/, '')}"`
    );
  }

  const base = getApiBase();
  return `${base}${path}`;
}

/**
 * Fetches from the API with proper base URL handling.
 * Wrapper around fetch that adds the API base prefix.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = buildApiUrl(path);
  const token = await getBearerTokenForApiFetch(path);
  if (!token) {
    return fetch(url, init);
  }

  const headers = new Headers(init?.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...init,
    headers: Object.fromEntries(headers.entries()),
  });
}

/**
 * Fetches JSON from the API with proper base URL handling.
 * Throws on non-2xx responses with the response body included in the error.
 *
 * @param path - API path (e.g., '/pilt/status') — MUST NOT include '/api' prefix
 * @param init - Optional RequestInit (signal, headers, method, body, ...)
 * @returns Parsed JSON body cast to T
 */
export async function apiFetchJson<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `[apiFetchJson] ${res.status} ${res.statusText} for ${path}${detail ? ` — ${detail}` : ''}`
    );
  }
  return (await res.json()) as T;
}
