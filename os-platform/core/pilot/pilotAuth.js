// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS — Pilot Auth
 *
 * Token acquisition for the Pilot runtime.
 * Uses the development-only token endpoint when explicitly selected by the
 * integrated preview, otherwise calls POST /api/auth/login with configured
 * service-account credentials.
 *
 * Credentials are resolved from environment variables:
 *   TF_PILOT_AUTH_MODE (optional: dev-token)
 *   TF_PILOT_EMAIL     (service-account default: admin@gov.)
 *   TF_PILOT_PASSWORD  (required for service-account auth)
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
 * (with 5-minute safety buffer). Otherwise, acquires a backend token using the
 * configured authentication mode.
 */
async function acquirePilotToken() {
    const bufferMs = 5 * 60 * 1000;
    if (cachedToken && cachedToken.expiresAt.getTime() > Date.now() + bufferMs) {
        return cachedToken;
    }
    if (process.env.TF_PILOT_AUTH_MODE === 'dev-token') {
        const result = await (0, backendClient_js_1.backendGet)('/api/auth/dev-token');
        if (result.ok === false) {
            cachedToken = null;
            throw new Error(`Pilot development auth failed: ${result.error}`);
        }
        const expiresInSeconds = Number(result.data.expiresIn);
        if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
            cachedToken = null;
            throw new Error('Pilot development auth failed: invalid token expiry');
        }
        cachedToken = {
            token: result.data.token,
            email: 'dev@terrafusion.local',
            roles: ['Developer', 'Assessor', 'GovernmentUser'],
            expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        };
        return cachedToken;
    }
    const email = process.env.TF_PILOT_EMAIL || 'admin@gov.';
    const password = process.env.TF_PILOT_PASSWORD;
    if (!password) {
        throw new Error('TF_PILOT_PASSWORD is required for Pilot authentication');
    }
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
