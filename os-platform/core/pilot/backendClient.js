// GENERATED - DO NOT EDIT
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapBackend = unwrapBackend;
exports.backendGetAtlasRegression = backendGetAtlasRegression;
exports.backendPost = backendPost;
exports.backendGet = backendGet;
exports.backendPut = backendPut;
// ============================================================================
// Configuration
// ============================================================================
function resolveBaseUrl() {
    if (process.env.TF_API_BASE_URL) {
        return process.env.TF_API_BASE_URL.replace(/\/+$/, '');
    }
    const port = process.env.TF_API_PORT || '5046';
    return `http://localhost:${port}`;
}
/**
 * Unwrap a BackendResult, throwing on error. Use in handlers for clean control flow.
 */
function unwrapBackend(result, label) {
    if (result.ok === false) {
        throw new Error(`${label}: ${result.error}`);
    }
    return result.data;
}
function requestUrl(path, options) {
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
async function backendGetAtlasRegression(query, options) {
    try {
        const url = requestUrl(`/api/terraforge/regression?${query}`, { ...options, callerAuthorization: true });
        const headers = { Accept: 'application/json', Authorization: `Bearer ${options.token}` };
        if (options.correlationId && /^[A-Za-z0-9._-]{1,128}$/.test(options.correlationId))
            headers['X-Correlation-ID'] = options.correlationId;
        const response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(15000) });
        if (!response.ok || !response.body) {
            await response.body?.cancel();
            return { ok: false, status: response.status, error: 'Spatial observation source unavailable.' };
        }
        const reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        try {
            for (;;) {
                const next = await reader.read();
                if (next.done)
                    break;
                size += next.value.byteLength;
                if (size > 1024 * 1024)
                    throw new Error('Spatial source response exceeds limit.');
                chunks.push(next.value);
            }
        }
        finally {
            await reader.cancel();
            reader.releaseLock();
        }
        const bytes = Buffer.concat(chunks);
        const body = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
        return { ok: true, status: response.status, data: { body } };
    }
    catch {
        return { ok: false, status: 0, error: 'Spatial observation source unavailable or invalid.' };
    }
}
/**
 * POST JSON to a backend endpoint. Returns typed result.
 */
async function backendPost(path, body, options) {
    try {
        const url = requestUrl(path, options);
        const headers = { 'Content-Type': 'application/json' };
        if (options?.correlationId && /^[A-Za-z0-9._-]{1,128}$/.test(options.correlationId))
            headers['X-Correlation-ID'] = options.correlationId;
        if (options?.token) {
            headers['Authorization'] = `Bearer ${options.token}`;
        }
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
            redirect: options?.callerAuthorization ? 'error' : 'follow',
        });
        const text = await res.text();
        if (!res.ok) {
            return { ok: false, status: res.status, error: `Backend ${res.status}: ${res.statusText}`, raw: text };
        }
        const data = text ? JSON.parse(text) : {};
        return { ok: true, status: res.status, data };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, status: 0, error: `Backend unreachable: ${message}` };
    }
}
/**
 * GET from a backend endpoint. Returns typed result.
 */
async function backendGet(path, options) {
    try {
        const url = requestUrl(path, options);
        const headers = { 'Accept': 'application/json' };
        if (options?.correlationId && /^[A-Za-z0-9._-]{1,128}$/.test(options.correlationId))
            headers['X-Correlation-ID'] = options.correlationId;
        if (options?.token) {
            headers['Authorization'] = `Bearer ${options.token}`;
        }
        const res = await fetch(url, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(15000),
            redirect: options?.callerAuthorization ? 'error' : 'follow',
        });
        const text = await res.text();
        if (!res.ok) {
            return { ok: false, status: res.status, error: `Backend ${res.status}: ${res.statusText}`, raw: text };
        }
        const data = text ? JSON.parse(text) : {};
        return { ok: true, status: res.status, data };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, status: 0, error: `Backend unreachable: ${message}` };
    }
}
/**
 * PUT JSON to a backend endpoint. Returns typed result.
 */
async function backendPut(path, body, options) {
    const url = `${resolveBaseUrl()}${path}`;
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (options?.token) {
            headers['Authorization'] = `Bearer ${options.token}`;
        }
        const res = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });
        const text = await res.text();
        if (!res.ok) {
            return { ok: false, status: res.status, error: `Backend ${res.status}: ${res.statusText}`, raw: text };
        }
        const data = text ? JSON.parse(text) : {};
        return { ok: true, status: res.status, data };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, status: 0, error: `Backend unreachable: ${message}` };
    }
}
