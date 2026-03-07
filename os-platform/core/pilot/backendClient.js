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
exports.backendPost = backendPost;
exports.backendGet = backendGet;
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
// ============================================================================
// Client
// ============================================================================
/**
 * POST JSON to a backend endpoint. Returns typed result.
 */
async function backendPost(path, body, options) {
    const url = `${resolveBaseUrl()}${path}`;
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (options?.token) {
            headers['Authorization'] = `Bearer ${options.token}`;
        }
        const res = await fetch(url, {
            method: 'POST',
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
/**
 * GET from a backend endpoint. Returns typed result.
 */
async function backendGet(path, options) {
    const url = `${resolveBaseUrl()}${path}`;
    try {
        const headers = { 'Accept': 'application/json' };
        if (options?.token) {
            headers['Authorization'] = `Bearer ${options.token}`;
        }
        const res = await fetch(url, {
            method: 'GET',
            headers,
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
