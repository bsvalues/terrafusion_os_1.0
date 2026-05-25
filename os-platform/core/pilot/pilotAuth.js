// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS — Pilot Auth
 *
 * Service-account token acquisition for the Pilot runtime.
 * Uses an injected bearer token, an explicit development-only backend token,
 * or POST /api/auth/login with configurable credentials.
 *
 * Credentials are resolved from environment variables:
 *   TF_PILOT_BEARER_TOKEN       (preferred external token injection)
 *   TF_PILOT_USE_DEV_TOKEN=1    (uses backend Development-only /api/auth/dev-token)
 *   TF_PILOT_EMAIL     (default: admin@gov.)
 *   TF_PILOT_PASSWORD  (default: TerraFusion2026!)
 *
 * Tokens are cached in-process and refreshed 5 minutes before expiry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.acquirePilotToken = acquirePilotToken;
exports.clearPilotToken = clearPilotToken;
const backendClient_js_1 = require("./backendClient.js");
// ============================================================================
// State
// ============================================================================
let cachedToken = null;
// ============================================================================
// Public API
// ============================================================================
/**
 * Acquire a Pilot service token. Returns cached token if still valid
 * (with 5-minute safety buffer). Otherwise, calls backend /api/auth/login.
 */
async function acquirePilotToken() {
    const bufferMs = 5 * 60 * 1000;
    if (cachedToken && cachedToken.expiresAt.getTime() > Date.now() + bufferMs) {
        return cachedToken;
    }
    const injectedBearerToken = process.env.TF_PILOT_BEARER_TOKEN?.trim();
    if (injectedBearerToken) {
        cachedToken = {
            token: injectedBearerToken,
            email: process.env.TF_PILOT_EMAIL || 'pilot-service@terrafusion.local',
            roles: ['GovernmentUser', 'Assessor'],
            expiresAt: new Date(Date.now() + 55 * 60 * 1000),
        };
        return cachedToken;
    }
    if (process.env.TF_PILOT_USE_DEV_TOKEN === '1') {
        const result = await (0, backendClient_js_1.backendGet)('/api/auth/dev-token');
        if (result.ok === false) {
            cachedToken = null;
            throw new Error(`Pilot dev-token auth failed: ${result.error}`);
        }
        cachedToken = {
            token: result.data.token,
            email: 'dev@terrafusion.local',
            roles: ['Developer', 'Assessor', 'GovernmentUser'],
            expiresAt: new Date(Date.now() + (result.data.expiresIn ?? 120) * 60 * 1000),
        };
        return cachedToken;
    }
    const email = process.env.TF_PILOT_EMAIL || 'admin@gov.';
    const password = process.env.TF_PILOT_PASSWORD || 'TerraFusion2026!';
    const result = await (0, backendClient_js_1.backendPost)('/api/auth/login', { email, password });
    if (result.ok === false) {
        cachedToken = null;
        throw new Error(`Pilot auth failed: ${result.error}`);
    }
    cachedToken = {
        token: result.data.token,
        email: result.data.email,
        roles: result.data.roles,
        expiresAt: new Date(result.data.expiresAt),
    };
    return cachedToken;
}
/**
 * Clear cached token. Call on 401 responses to force re-authentication.
 */
function clearPilotToken() {
    cachedToken = null;
}
