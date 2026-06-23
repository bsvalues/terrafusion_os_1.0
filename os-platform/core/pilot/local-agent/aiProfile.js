// GENERATED - DO NOT EDIT
"use strict";
// TerraFusion LocalOps AI profile configuration contract (WO-LOCALOPS-001).
//
// Pure config resolution + validation. No provider calls, no I/O, no UI.
// Doctrine (docs/localops/LOCALOPS_DOCTRINE.md): localops/disabled profiles may
// be tightened by env overrides but never loosened — there is no way to express
// "localops with silent cloud fallback" in this contract.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RUNBOOK_PATH = exports.DEFAULT_LOCAL_KB_PATH = exports.AiProfileError = exports.DEFAULT_AI_PROFILE = exports.AI_PROFILES = exports.AI_PROFILE_ENV = void 0;
exports.isAiProfileName = isAiProfileName;
exports.resolveAiProfile = resolveAiProfile;
exports.redactedAiProfileSummary = redactedAiProfileSummary;
const redact_js_1 = require("./redact.js");
exports.AI_PROFILE_ENV = 'AI_PROFILE';
exports.AI_PROFILES = ['cloud-dev', 'hybrid-approved', 'localops', 'disabled'];
/** Default profile when AI_PROFILE is unset: AI is opt-in, never opt-out. */
exports.DEFAULT_AI_PROFILE = 'disabled';
class AiProfileError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AiProfileError';
    }
}
exports.AiProfileError = AiProfileError;
const PROFILE_DEFAULTS = {
    // Developer convenience profile for non-county environments.
    'cloud-dev': {
        externalCalls: true,
        allowWeb: true,
        allowShell: false,
        allowMutation: false,
        requireTrace: true,
        requireSources: false,
    },
    // External calls explicitly approved (e.g. documented county approval record).
    'hybrid-approved': {
        externalCalls: true,
        allowWeb: false,
        allowShell: false,
        allowMutation: false,
        requireTrace: true,
        requireSources: true,
    },
    // County-boundary-safe operator posture. Tighten-only.
    localops: {
        externalCalls: false,
        allowWeb: false,
        allowShell: false,
        allowMutation: false,
        requireTrace: true,
        requireSources: true,
    },
    // All AI action disabled. Tighten-only.
    disabled: {
        externalCalls: false,
        allowWeb: false,
        allowShell: false,
        allowMutation: false,
        requireTrace: true,
        requireSources: true,
    },
};
/** Profiles where env overrides may tighten permissions but never loosen them. */
const TIGHTEN_ONLY_PROFILES = new Set(['localops', 'disabled']);
const PERMISSION_ENV_KEYS = {
    externalCalls: 'AI_EXTERNAL_CALLS',
    allowWeb: 'AI_ALLOW_WEB',
    allowShell: 'AI_ALLOW_SHELL',
    allowMutation: 'AI_ALLOW_MUTATION',
    requireTrace: 'AI_REQUIRE_TRACE',
    requireSources: 'AI_REQUIRE_SOURCES',
};
/** Flags where `true` grants capability (loosening under tighten-only profiles). */
const GRANT_FLAGS = new Set([
    'externalCalls',
    'allowWeb',
    'allowShell',
    'allowMutation',
]);
exports.DEFAULT_LOCAL_KB_PATH = 'docs/localops';
exports.DEFAULT_RUNBOOK_PATH = 'docs/localops/BENTON_SERVER_RUNBOOK.md';
function isAiProfileName(value) {
    return exports.AI_PROFILES.includes(value);
}
function parseBool(envKey, raw) {
    const normalized = raw.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true')
        return true;
    if (normalized === '0' || normalized === 'false')
        return false;
    throw new AiProfileError(`${envKey} must be one of 1/0/true/false, got ${JSON.stringify(raw)}`);
}
function resolveProfileName(env) {
    const raw = env[exports.AI_PROFILE_ENV]?.trim() ?? '';
    if (raw === '')
        return exports.DEFAULT_AI_PROFILE;
    const normalized = raw.toLowerCase();
    if (!isAiProfileName(normalized)) {
        throw new AiProfileError(`${exports.AI_PROFILE_ENV} must be one of ${exports.AI_PROFILES.join(', ')}; got ${JSON.stringify(raw)}`);
    }
    return normalized;
}
/**
 * Resolve the AI profile config from the environment.
 *
 * - Unset AI_PROFILE resolves to `disabled` (AI is opt-in).
 * - Unknown AI_PROFILE values are rejected, not silently coerced.
 * - Under `localops`/`disabled`, env overrides may only tighten: any attempt to
 *   grant a capability (AI_EXTERNAL_CALLS=true etc.) or drop a safety
 *   requirement (AI_REQUIRE_TRACE=false etc.) throws AiProfileError.
 */
function resolveAiProfile(env = process.env) {
    const profile = resolveProfileName(env);
    const defaults = PROFILE_DEFAULTS[profile];
    const tightenOnly = TIGHTEN_ONLY_PROFILES.has(profile);
    const permissions = { ...defaults };
    for (const field of Object.keys(PERMISSION_ENV_KEYS)) {
        const envKey = PERMISSION_ENV_KEYS[field];
        const raw = env[envKey];
        if (raw === undefined || raw.trim() === '')
            continue;
        const value = parseBool(envKey, raw);
        if (tightenOnly) {
            const isGrant = GRANT_FLAGS.has(field);
            const loosens = isGrant ? value === true : value === false;
            if (loosens) {
                throw new AiProfileError(`${envKey}=${raw.trim()} loosens the ${profile} profile. ` +
                    `The ${profile} profile is tighten-only; use hybrid-approved (with a documented approval record) instead.`);
            }
        }
        permissions[field] = value;
    }
    return {
        profile,
        provider: env.AI_PROVIDER?.trim() ?? '',
        baseUrl: env.AI_BASE_URL?.trim() ?? '',
        model: env.AI_MODEL?.trim() ?? '',
        ...permissions,
        localKbPath: env.AI_LOCAL_KB_PATH?.trim() || exports.DEFAULT_LOCAL_KB_PATH,
        runbookPath: env.AI_RUNBOOK_PATH?.trim() || exports.DEFAULT_RUNBOOK_PATH,
    };
}
/** Strip URL userinfo (user:pass@) before display; non-URLs pass through. */
function stripUrlCredentials(raw) {
    if (raw === '')
        return raw;
    try {
        const url = new URL(raw);
        if (url.username || url.password) {
            url.username = '';
            url.password = '';
            return url.toString();
        }
        return raw;
    }
    catch {
        return raw;
    }
}
/**
 * Redacted, display-safe summary of the resolved profile. Routes every string
 * through the local-agent redactor (secrets, tokens, emails, user paths) and
 * strips URL credentials, so the summary is safe for logs/UI/trace.
 */
function redactedAiProfileSummary(config) {
    const { value } = (0, redact_js_1.redactPayload)({
        profile: config.profile,
        provider: config.provider,
        baseUrl: stripUrlCredentials(config.baseUrl),
        model: config.model,
        externalCalls: config.externalCalls,
        allowWeb: config.allowWeb,
        allowShell: config.allowShell,
        allowMutation: config.allowMutation,
        requireTrace: config.requireTrace,
        requireSources: config.requireSources,
        localKbPath: config.localKbPath,
        runbookPath: config.runbookPath,
    });
    return value;
}
