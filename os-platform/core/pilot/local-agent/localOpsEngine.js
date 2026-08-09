// GENERATED - DO NOT EDIT
"use strict";
// WO-AI-CONSOLIDATION-001 — LocalOps engine (provider/engine layer only).
//
// Turns the existing local brain into the LocalOps engine path. Composes the
// already-governed LocalOps seams — the profile contract (WO-001), the local
// provider abstraction (WO-002), the trace adapter (WO-003), the local KB
// (WO-004), and the read-only diagnostics (WO-005) — into the in-shell panel's
// `LocalOpsViewModel` plus a single local-only answer.
//
// It drives the SAME local-Ollama substrate MuseService uses, but ONLY through
// the LocalOps provider abstraction: there is no call to the .NET Muse HTTP
// endpoint, no cloud path, and no silent fallback. Local-first, source-grounded,
// trace-emitting, read-only — the LocalOps doctrine, end to end.
//
// Boundary note: this is the engine/view-model layer (Node). Transporting its
// output to the browser panel (a host/endpoint) is a separate, approval-gated
// slice — the in-shell panel still performs no API calls itself.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocalOpsEngine = createLocalOpsEngine;
const aiProfile_js_1 = require("./aiProfile.js");
const localOpsProvider_js_1 = require("./localOpsProvider.js");
const localOpsKb_js_1 = require("./localOpsKb.js");
const localOpsDiagnostics_js_1 = require("./localOpsDiagnostics.js");
const localOpsTrace_js_1 = require("./localOpsTrace.js");
const localOpsTraceBridge_js_1 = require("./localOpsTraceBridge.js");
function flagsOf(config) {
    return {
        externalCalls: config.externalCalls,
        allowWeb: config.allowWeb,
        allowShell: config.allowShell,
        allowMutation: config.allowMutation,
        requireTrace: config.requireTrace,
        requireSources: config.requireSources,
    };
}
/**
 * Create a LocalOps engine over the governed local provider. Provider, KB,
 * diagnostics and trace share one recording trace so the view model can surface
 * the append-only event stream.
 */
function createLocalOpsEngine(options) {
    const env = options.env ?? process.env;
    const config = (0, aiProfile_js_1.resolveAiProfile)(env);
    const recording = (0, localOpsTrace_js_1.createRecordingLocalOpsTraceSink)();
    const sink = options.sink
        ? (0, localOpsTraceBridge_js_1.composeLocalOpsTraceSinks)(recording, options.sink)
        : recording;
    const trace = (0, localOpsTrace_js_1.createLocalOpsTrace)({ sink });
    const provider = (0, localOpsProvider_js_1.createLocalOpsProvider)({ config, env, adapter: options.adapter });
    const kb = (0, localOpsKb_js_1.createLocalOpsKb)({ repoRoot: options.repoRoot, env, trace });
    const diagnostics = (0, localOpsDiagnostics_js_1.createLocalOpsDiagnostics)({ repoRoot: options.repoRoot, env, trace });
    let lastGrounded = false;
    let lastSources = [];
    let lastRefusal;
    function traceViews() {
        return recording.events.map((e) => ({ type: e.type, ts: e.ts, summary: e.summary }));
    }
    function viewModel() {
        const st = provider.status();
        return {
            profile: config.profile,
            provider: config.provider || '(unset)',
            model: config.model || undefined,
            flags: flagsOf(config),
            providerStatus: { ok: st.ok, status: st.status, adapter: st.adapter },
            diagnostics: diagnostics.runAll().map((d) => ({
                name: d.name,
                status: d.status,
                summary: d.summary,
            })),
            refusal: lastRefusal,
            grounded: lastGrounded,
            sources: lastSources,
            traceEvents: traceViews(),
        };
    }
    async function ask(question, signal) {
        trace.aiRequested({ profile: config.profile, provider: config.provider });
        // Source grounding (I6): retrieve local sources first; when sources are
        // required and nothing supports the question, refuse BEFORE calling the
        // model — an ungrounded confident answer is not permitted.
        const retrieval = kb.retrieve(question);
        lastGrounded = retrieval.grounded;
        lastSources = retrieval.sources.map((s) => ({
            sourceFile: s.sourceFile,
            heading: s.heading,
            snippet: s.snippet,
        }));
        if (config.requireSources && !retrieval.canAnswer) {
            const refusal = {
                reasonCode: 'NO_GROUNDING',
                status: 'refused',
                message: 'No local source supports this question; LocalOps will not answer ungrounded.',
                safeAlternatives: [
                    'Add the relevant document to the local KB (docs/ allowlist)',
                    'Ask about a documented runbook topic',
                ],
            };
            lastRefusal = refusal;
            trace.emit('localops.policy.refused', 'LocalOps refused: no local source', {
                reasonCode: 'NO_GROUNDING',
                profile: config.profile,
                violatedConstraint: 'source_grounding',
            });
            trace.aiResponded({ status: 'refused' });
            return { answered: false, text: null, grounded: retrieval.grounded, sources: lastSources, refusal };
        }
        // The provider enforces local-only / no-external / no-silent-fallback. We
        // never construct a cloud adapter and never reach the network on refusal.
        const result = await provider.complete({ messages: [{ role: 'user', content: question }] }, signal);
        if ((0, localOpsProvider_js_1.isLocalOpsProblem)(result)) {
            const refusal = {
                reasonCode: result.reasonCode,
                status: result.status,
                message: result.message,
                safeAlternatives: result.safeAlternatives,
            };
            lastRefusal = refusal;
            trace.policyRefused(result);
            trace.aiResponded({ status: result.status });
            return { answered: false, text: null, grounded: retrieval.grounded, sources: lastSources, refusal };
        }
        lastRefusal = undefined;
        trace.aiResponded({ status: 'success' });
        return {
            answered: true,
            text: result.completion.text,
            grounded: retrieval.grounded,
            sources: lastSources,
        };
    }
    async function close() {
        await provider.close();
    }
    return { viewModel, ask, close };
}
