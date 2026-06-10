// GENERATED - DO NOT EDIT
"use strict";
// TerraFusion LocalOps read-only diagnostics (WO-LOCALOPS-005).
//
// A fixed allowlist of READ-ONLY diagnostics built on the seams already landed:
// the AI profile contract (WO-001), the provider abstraction (WO-002), the
// trace adapter (WO-003), and the local KB (WO-004). Every diagnostic only
// observes — it performs no mutation, no shell execution, no service restart,
// no database write, no migration, and no network I/O. Any request outside the
// allowlist (or that names a mutating/operational action) is REFUSED with a
// structured, redaction-safe reason.
//
// Scope guard (doctrine): no UI, no mutation, no shell, no DB writes/migrations,
// no service control. App/service-health, DB-connectivity, and log-summary
// diagnostics are intentionally NOT implemented here — there is no existing
// safe read-only seam to reuse, so they are deferred rather than guessed.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalOpsDiagnostics = exports.READONLY_DIAGNOSTICS = void 0;
exports.isDiagnosticRefusal = isDiagnosticRefusal;
exports.isDiagnosticName = isDiagnosticName;
exports.createLocalOpsDiagnostics = createLocalOpsDiagnostics;
const aiProfile_js_1 = require("./aiProfile.js");
const localOpsProvider_js_1 = require("./localOpsProvider.js");
const localOpsKb_js_1 = require("./localOpsKb.js");
const redact_js_1 = require("./redact.js");
/** The fixed set of read-only diagnostics. Nothing outside this list runs. */
exports.READONLY_DIAGNOSTICS = [
    'ai.profile',
    'config.summary',
    'provider.status',
    'kb.status',
];
function isDiagnosticRefusal(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.ok === false &&
        value.status === 'refused');
}
function isDiagnosticName(value) {
    return exports.READONLY_DIAGNOSTICS.includes(value);
}
/** Substrings that indicate a mutating/operational (non-read-only) request. */
const UNSAFE_TERMS = [
    'restart',
    'reboot',
    'start',
    'stop',
    'kill',
    'migrate',
    'migration',
    'write',
    'delete',
    'drop',
    'update',
    'mutate',
    'repair',
    'fix',
    'exec',
    'shell',
    'run',
    'apply',
    'deploy',
];
class LocalOpsDiagnostics {
    constructor(options) {
        this.repoRoot = options.repoRoot;
        this.config = options.config ?? (0, aiProfile_js_1.resolveAiProfile)(options.env ?? process.env);
        this.trace = options.trace;
    }
    /** Names of the available read-only diagnostics. */
    list() {
        return [...exports.READONLY_DIAGNOSTICS];
    }
    /**
     * Gated entry point. Refuses unknown or unsafe (mutating/operational) names
     * with a structured refusal; otherwise runs the read-only diagnostic.
     */
    request(name) {
        const trimmed = name.trim();
        if (isDiagnosticName(trimmed)) {
            return this.run(trimmed);
        }
        const lower = trimmed.toLowerCase();
        const unsafe = UNSAFE_TERMS.some(term => lower.includes(term));
        const refusal = unsafe
            ? {
                ok: false,
                status: 'refused',
                reasonCode: 'UNSAFE_DIAGNOSTIC',
                name: (0, redact_js_1.redactStringValue)(trimmed),
                message: `'${trimmed}' implies a mutating or operational action; LocalOps diagnostics are read-only and refuse it.`,
                safeAlternatives: [`Use a read-only diagnostic: ${exports.READONLY_DIAGNOSTICS.join(', ')}`],
            }
            : {
                ok: false,
                status: 'refused',
                reasonCode: 'UNKNOWN_DIAGNOSTIC',
                name: (0, redact_js_1.redactStringValue)(trimmed),
                message: `'${trimmed}' is not a known LocalOps diagnostic.`,
                safeAlternatives: [`Available: ${exports.READONLY_DIAGNOSTICS.join(', ')}`],
            };
        // Redact the message defensively (name may echo user input).
        refusal.message = (0, redact_js_1.redactStringValue)(refusal.message);
        this.trace?.emit('localops.policy.refused', `diagnostic refused: ${refusal.reasonCode}`, {
            reasonCode: refusal.reasonCode,
            name: refusal.name,
        });
        return refusal;
    }
    /** Run every read-only diagnostic. */
    runAll() {
        return this.list().map(name => this.run(name));
    }
    run(name) {
        this.trace?.diagnosticStarted({ name });
        const result = this.compute(name);
        this.trace?.diagnosticCompleted({ name, ok: result.status !== 'error', status: result.status });
        return result;
    }
    finalize(name, status, summary, data) {
        return {
            name,
            readonly: true,
            status,
            summary: (0, redact_js_1.redactStringValue)(summary),
            data: (0, redact_js_1.redactPayload)(data).value,
        };
    }
    compute(name) {
        switch (name) {
            case 'ai.profile':
                return this.finalize('ai.profile', 'ok', `active AI profile: ${this.config.profile}`, {
                    profile: this.config.profile,
                    provider: this.config.provider,
                    externalCalls: this.config.externalCalls,
                    allowMutation: this.config.allowMutation,
                    requireSources: this.config.requireSources,
                    requireTrace: this.config.requireTrace,
                });
            case 'config.summary':
                return this.finalize('config.summary', 'ok', 'redacted AI profile configuration', (0, aiProfile_js_1.redactedAiProfileSummary)(this.config));
            case 'provider.status': {
                const status = (0, localOpsProvider_js_1.createLocalOpsProvider)({ config: this.config }).status();
                // Read-only health: a non-ready provider is a `warn`, not an `error`
                // (e.g. no local model running is an expected operator condition).
                return this.finalize('provider.status', status.ok ? 'ok' : 'warn', `provider status: ${status.status}`, {
                    ok: status.ok,
                    kind: status.kind,
                    status: status.status,
                    ...(status.adapter ? { adapter: status.adapter } : {}),
                    config: status.config,
                    ...(status.problem
                        ? { reasonCode: status.problem.reasonCode, problemStatus: status.problem.status }
                        : {}),
                });
            }
            case 'kb.status': {
                const kb = (0, localOpsKb_js_1.createLocalOpsKb)({ repoRoot: this.repoRoot, config: this.config }).status();
                return this.finalize('kb.status', kb.fileCount > 0 ? 'ok' : 'warn', `local KB: ${kb.fileCount} file(s) across ${kb.roots.length} root(s)`, {
                    roots: kb.roots,
                    rootsExcluded: kb.rootsExcluded,
                    fileCount: kb.fileCount,
                    requireSources: kb.requireSources,
                });
            }
        }
    }
}
exports.LocalOpsDiagnostics = LocalOpsDiagnostics;
function createLocalOpsDiagnostics(options) {
    return new LocalOpsDiagnostics(options);
}
