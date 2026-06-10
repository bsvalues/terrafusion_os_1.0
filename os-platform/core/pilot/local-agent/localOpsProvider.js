// GENERATED - DO NOT EDIT
"use strict";
// TerraFusion LocalOps provider abstraction (WO-LOCALOPS-002).
//
// Builds on the WO-LOCALOPS-001 AI profile contract: given a resolved
// AiProfileConfig, constructs the one provider the profile permits — a LOCAL
// model adapter or the disabled/refusing provider. There is no code path here
// that constructs an external adapter when the profile forbids external
// calls, and no fallback of any kind: when the permitted provider cannot be
// built, the factory fails CLOSED into a refusing provider with a structured,
// redaction-safe reason.
//
// Scope guard (doctrine): no UI, no RAG, no diagnostics beyond provider
// status, no shell/tool execution, no TerraTrace implementation (events are
// WO-LOCALOPS-003; callers receive structured results they can trace later).
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTERNAL_PROVIDER_IDS = exports.LOCAL_PROVIDER_IDS = void 0;
exports.isLocalOpsRefusal = isLocalOpsRefusal;
exports.createLocalOpsProvider = createLocalOpsProvider;
const aiProfile_js_1 = require("./aiProfile.js");
const ollamaAdapter_js_1 = require("./ollamaAdapter.js");
const redact_js_1 = require("./redact.js");
/** Provider ids that run inside the county boundary (no external network). */
exports.LOCAL_PROVIDER_IDS = ['ollama'];
/** Provider ids that are known to require calls outside the boundary. */
exports.EXTERNAL_PROVIDER_IDS = ['openai', 'claude', 'anthropic', 'remote'];
function isLocalOpsRefusal(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.refused === true &&
        typeof value.code === 'string');
}
// URL userinfo (user:pass@host) — adapter errors may echo a rejected baseUrl.
const URL_USERINFO_RE = /([a-z][a-z0-9+.-]*:\/\/)[^/\s@]+@/gi;
function safeReason(text) {
    return (0, redact_js_1.redactStringValue)(text.replace(URL_USERINFO_RE, '$1[REDACTED:userinfo]@'));
}
class RefusingLocalOpsProvider {
    constructor(config, refusal, kind) {
        this.config = config;
        this.refusal = refusal;
        this.kind = kind;
    }
    status() {
        return {
            ok: false,
            kind: this.kind,
            config: (0, aiProfile_js_1.redactedAiProfileSummary)(this.config),
            refusal: { code: this.refusal.code, reason: this.refusal.reason },
        };
    }
    async complete() {
        return this.refusal;
    }
    async close() {
        // Nothing to release.
    }
}
class LocalAdapterProvider {
    constructor(config, adapter) {
        this.config = config;
        this.adapter = adapter;
        this.kind = 'local';
    }
    status() {
        return {
            ok: true,
            kind: this.kind,
            config: (0, aiProfile_js_1.redactedAiProfileSummary)(this.config),
            adapter: this.adapter.name,
        };
    }
    complete(request, signal) {
        return this.adapter.complete(request, signal);
    }
    close() {
        return this.adapter.close();
    }
}
function refusal(config, code, reason) {
    return { refused: true, code, reason: safeReason(reason), profile: config.profile };
}
function refusing(config, code, reason, kind = 'refusing') {
    return new RefusingLocalOpsProvider(config, refusal(config, code, reason), kind);
}
/**
 * Construct the LocalOps provider for the active AI profile.
 *
 * Never throws for policy/config outcomes — every disallowed or unbuildable
 * configuration yields a refusing provider (fail closed) whose `complete()`
 * returns a structured `LocalOpsRefusal`.
 */
function createLocalOpsProvider(options = {}) {
    const config = options.config ?? (0, aiProfile_js_1.resolveAiProfile)(options.env ?? process.env);
    if (config.profile === 'disabled') {
        return refusing(config, 'AI_DISABLED', 'AI is disabled by the active profile. Set AI_PROFILE to enable a permitted mode.', 'disabled');
    }
    // Injected adapter (tests / future wiring): still capability-guarded.
    if (options.adapter) {
        if (!config.externalCalls && !options.adapter.capabilities.local) {
            return refusing(config, 'NON_LOCAL_ADAPTER_REFUSED', `adapter '${options.adapter.name}' does not declare local capability; the ${config.profile} profile forbids external calls.`);
        }
        return new LocalAdapterProvider(config, options.adapter);
    }
    const provider = config.provider.toLowerCase();
    if (provider === '') {
        return refusing(config, 'PROVIDER_NOT_CONFIGURED', 'AI_PROVIDER is not set. LocalOps fails closed instead of guessing a backend.');
    }
    if (exports.EXTERNAL_PROVIDER_IDS.includes(provider)) {
        if (!config.externalCalls) {
            return refusing(config, 'EXTERNAL_PROVIDER_REFUSED', `provider '${provider}' requires external calls, which the ${config.profile} profile forbids. There is no fallback.`);
        }
        return refusing(config, 'EXTERNAL_NOT_IMPLEMENTED', `provider '${provider}' is external; LocalOps provider v1 constructs local providers only. External adapter wiring is a later, separately-approved work order.`);
    }
    if (!exports.LOCAL_PROVIDER_IDS.includes(provider)) {
        return refusing(config, 'UNKNOWN_PROVIDER_REFUSED', `provider '${provider}' is not a known LocalOps provider. Known local providers: ${exports.LOCAL_PROVIDER_IDS.join(', ')}. LocalOps fails closed.`);
    }
    // provider === 'ollama'
    if (config.model === '') {
        return refusing(config, 'PROVIDER_UNAVAILABLE', 'AI_MODEL is not set; the local provider needs a model name.');
    }
    try {
        const adapter = new ollamaAdapter_js_1.OllamaAdapter({
            model: config.model,
            ...(config.baseUrl !== '' ? { baseUrl: config.baseUrl } : {}),
        });
        return new LocalAdapterProvider(config, adapter);
    }
    catch (error) {
        // e.g. non-loopback AI_BASE_URL — the adapter's own boundary guard.
        const message = error instanceof Error ? error.message : String(error);
        return refusing(config, 'PROVIDER_UNAVAILABLE', `local provider rejected: ${message}`);
    }
}
