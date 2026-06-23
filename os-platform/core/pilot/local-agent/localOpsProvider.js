// GENERATED - DO NOT EDIT
"use strict";
// TerraFusion LocalOps provider abstraction (WO-LOCALOPS-002).
//
// Builds on the WO-LOCALOPS-001 AI profile contract: given a resolved
// AiProfileConfig, constructs the one provider the profile permits — a LOCAL
// model adapter or a refusing provider. There is no code path here that
// constructs an external adapter when the profile forbids external calls, and
// no fallback of any kind: when the permitted provider cannot be built or a
// permitted call fails, the result is a structured non-success outcome — never
// a silent cloud fallback, and never an unavailable/failed state disguised as
// success.
//
// Outcomes are AX-compatible: every result carries `ok` + a `status` drawn
// from a fixed taxonomy so a future TerraPilot UI can render a Provider Status
// Card, a Refusal Card, an Active Profile Badge, or a System Halt state
// without re-deriving meaning. Refusals/failures are distinct, and `disabled`
// is distinct from `unavailable`.
//
// Scope guard (doctrine): no UI, no RAG, no diagnostics beyond provider
// status, no shell/tool execution, no TerraTrace implementation (events are
// WO-LOCALOPS-003; callers receive structured results they can trace later).
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTERNAL_PROVIDER_IDS = exports.LOCAL_PROVIDER_IDS = void 0;
exports.isLocalOpsProblem = isLocalOpsProblem;
exports.isLocalOpsSuccess = isLocalOpsSuccess;
exports.createLocalOpsProvider = createLocalOpsProvider;
const aiProfile_js_1 = require("./aiProfile.js");
const ollamaAdapter_js_1 = require("./ollamaAdapter.js");
const redact_js_1 = require("./redact.js");
/** Provider ids that run inside the county boundary (no external network). */
exports.LOCAL_PROVIDER_IDS = ['ollama'];
/** Provider ids that are known to require calls outside the boundary. */
exports.EXTERNAL_PROVIDER_IDS = ['openai', 'claude', 'anthropic', 'remote'];
function isLocalOpsProblem(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.ok === false &&
        typeof value.status === 'string');
}
function isLocalOpsSuccess(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.ok === true &&
        value.status === 'success');
}
// URL userinfo (user:pass@host) — adapter errors may echo a rejected baseUrl.
const URL_USERINFO_RE = /([a-z][a-z0-9+.-]*:\/\/)[^/\s@]+@/gi;
function safeText(text) {
    return (0, redact_js_1.redactStringValue)(text.replace(URL_USERINFO_RE, '$1[REDACTED:userinfo]@'));
}
function problem(config, status, reasonCode, message, details = {}) {
    return {
        ok: false,
        status,
        reasonCode,
        profile: config.profile,
        provider: config.provider,
        message: safeText(message),
        ...(details.violatedConstraint ? { violatedConstraint: details.violatedConstraint } : {}),
        ...(details.safeAlternatives ? { safeAlternatives: details.safeAlternatives } : {}),
    };
}
class RefusingLocalOpsProvider {
    constructor(config, problemOutcome, kind) {
        this.config = config;
        this.problemOutcome = problemOutcome;
        this.kind = kind;
    }
    status() {
        const { ok: _ok, ...problemFields } = this.problemOutcome;
        return {
            ok: false,
            kind: this.kind,
            status: this.problemOutcome.status,
            config: (0, aiProfile_js_1.redactedAiProfileSummary)(this.config),
            problem: problemFields,
        };
    }
    async complete() {
        return this.problemOutcome;
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
            status: 'success',
            config: (0, aiProfile_js_1.redactedAiProfileSummary)(this.config),
            adapter: this.adapter.name,
        };
    }
    async complete(request, signal) {
        try {
            const completion = await this.adapter.complete(request, signal);
            return { ok: true, status: 'success', completion };
        }
        catch (error) {
            // A local provider failing at call time is a `failed` outcome — NEVER a
            // fallback to anything else, and never reported as success.
            const message = error instanceof Error ? error.message : String(error);
            return problem(this.config, 'failed', 'LOCAL_PROVIDER_FAILED', `local provider '${this.adapter.name}' failed during completion: ${message}`, {
                safeAlternatives: [
                    'Check the local model service health',
                    'Run LocalOps provider status',
                ],
            });
        }
    }
    close() {
        return this.adapter.close();
    }
}
function refusing(config, outcome, kind = 'refusing') {
    return new RefusingLocalOpsProvider(config, outcome, kind);
}
/**
 * Construct the LocalOps provider for the active AI profile.
 *
 * Never throws for policy/config outcomes — every disallowed or unbuildable
 * configuration yields a refusing provider (fail closed) whose `complete()`
 * returns a structured non-success `LocalOpsResult`.
 */
function createLocalOpsProvider(options = {}) {
    const config = options.config ?? (0, aiProfile_js_1.resolveAiProfile)(options.env ?? process.env);
    if (config.profile === 'disabled') {
        return refusing(config, problem(config, 'disabled', 'AI_DISABLED', 'AI is disabled by the active profile. Set AI_PROFILE to enable a permitted mode.', {
            violatedConstraint: 'ai_disabled',
            safeAlternatives: [
                'Set AI_PROFILE=localops with AI_PROVIDER=ollama for county-boundary-safe local AI',
            ],
        }), 'disabled');
    }
    // Injected adapter (tests / future wiring): still capability-guarded.
    if (options.adapter) {
        if (!config.externalCalls && !options.adapter.capabilities.local) {
            return refusing(config, problem(config, 'refused', 'NON_LOCAL_ADAPTER_REFUSED', `adapter '${options.adapter.name}' does not declare local capability; the ${config.profile} profile forbids external calls.`, {
                violatedConstraint: 'local_only',
                safeAlternatives: [
                    'Provide a local adapter (capabilities.local=true)',
                    'Use AI_PROFILE=hybrid-approved if external calls are policy-approved',
                ],
            }));
        }
        return new LocalAdapterProvider(config, options.adapter);
    }
    const provider = config.provider.toLowerCase();
    if (provider === '') {
        return refusing(config, problem(config, 'misconfigured', 'PROVIDER_NOT_CONFIGURED', 'AI_PROVIDER is not set. LocalOps fails closed instead of guessing a backend.', { safeAlternatives: ['Set AI_PROVIDER=ollama and AI_MODEL=<model>'] }));
    }
    if (exports.EXTERNAL_PROVIDER_IDS.includes(provider)) {
        if (!config.externalCalls) {
            return refusing(config, problem(config, 'refused', 'EXTERNAL_PROVIDER_REFUSED', `provider '${provider}' requires external calls, which the ${config.profile} profile forbids. There is no fallback.`, {
                violatedConstraint: 'no_external_calls',
                safeAlternatives: [
                    'Use AI_PROFILE=hybrid-approved with a documented county approval record',
                    'Use a local provider (AI_PROVIDER=ollama) on a loopback AI_BASE_URL',
                ],
            }));
        }
        return refusing(config, problem(config, 'unavailable', 'EXTERNAL_NOT_IMPLEMENTED', `provider '${provider}' is external; LocalOps provider v1 constructs local providers only. External adapter wiring is a later, separately-approved work order.`, {
            safeAlternatives: ['Use a local provider (AI_PROVIDER=ollama) on a loopback AI_BASE_URL'],
        }));
    }
    if (!exports.LOCAL_PROVIDER_IDS.includes(provider)) {
        return refusing(config, problem(config, 'misconfigured', 'UNKNOWN_PROVIDER_REFUSED', `provider '${provider}' is not a known LocalOps provider. LocalOps fails closed.`, {
            safeAlternatives: [`Use a known local provider: ${exports.LOCAL_PROVIDER_IDS.join(', ')}`],
        }));
    }
    // provider === 'ollama'
    if (config.model === '') {
        return refusing(config, problem(config, 'unavailable', 'PROVIDER_UNAVAILABLE', 'AI_MODEL is not set; the local provider needs a model name.', { safeAlternatives: ['Set AI_MODEL=<model>'] }));
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
        return refusing(config, problem(config, 'unavailable', 'PROVIDER_UNAVAILABLE', `local provider rejected: ${message}`, {
            violatedConstraint: 'loopback_only',
            safeAlternatives: [
                'Use a loopback AI_BASE_URL (http://127.0.0.1:PORT or http://localhost:PORT)',
            ],
        }));
    }
}
