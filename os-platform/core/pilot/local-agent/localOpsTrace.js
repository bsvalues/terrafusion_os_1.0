// GENERATED - DO NOT EDIT
"use strict";
// TerraFusion LocalOps trace event adapter (WO-LOCALOPS-003).
//
// A narrow, TerraTrace-COMPATIBLE event path for LocalOps. It does not change
// TerraTrace semantics and does not write to the canonical Postgres trace store
// (os-platform/core/trace) — bridging to that audit-grade, county-isolated
// store is a later concern (it needs DB + county context, out of scope here).
//
// Instead, LocalOps events are append-only projections emitted through a
// pluggable sink. The default sink is a SAFE NO-OP (so callers never break when
// no trace backend is configured); a JSONL sink reuses the existing append-only,
// auto-redacting local-agent event log. Events carry the same load-bearing
// fields as a TerraTrace event (correlationId, type, summary, schemaVersion,
// redacted context) so a future bridge can map them 1:1.
//
// Scope guard (doctrine): no RAG, no diagnostics, no UI, no mutable business
// state (append-only), and the provider abstraction (WO-002) is NOT modified —
// this module reads its public result/status types only.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalOpsTrace = exports.noopLocalOpsTraceSink = exports.LOCALOPS_TRACE_SCHEMA_VERSION = exports.LOCALOPS_EVENT_TYPES = void 0;
exports.createJsonlLocalOpsTraceSink = createJsonlLocalOpsTraceSink;
exports.createRecordingLocalOpsTraceSink = createRecordingLocalOpsTraceSink;
exports.createLocalOpsTrace = createLocalOpsTrace;
const node_crypto_1 = require("node:crypto");
const eventLog_js_1 = require("./eventLog.js");
const redact_js_1 = require("./redact.js");
/** The canonical LocalOps event types. */
exports.LOCALOPS_EVENT_TYPES = [
    'localops.ai.requested',
    'localops.ai.responded',
    'localops.provider.status_checked',
    'localops.policy.refused',
    'localops.approval.required',
    'localops.rag.retrieved',
    'localops.tool.diagnostic.started',
    'localops.tool.diagnostic.completed',
];
exports.LOCALOPS_TRACE_SCHEMA_VERSION = 'localops-trace/v1';
/** Default sink: does nothing. Safe when no trace backend is available. */
exports.noopLocalOpsTraceSink = {
    name: 'noop',
    emit() {
        /* intentionally empty */
    },
};
/**
 * JSONL sink: reuses the existing append-only, auto-redacting local-agent event
 * log (`.terrafusion/agent-events.jsonl`). Append-only; no mutable state.
 */
function createJsonlLocalOpsTraceSink(repoRoot) {
    return {
        name: 'jsonl',
        emit(event) {
            (0, eventLog_js_1.appendLocalAgentEvent)(repoRoot, event.type, {
                correlationId: event.correlationId,
                schemaVersion: event.schemaVersion,
                summary: event.summary,
                ...(event.session ? { session: event.session } : {}),
                ...(event.user ? { user: event.user } : {}),
                ...event.data,
            });
        },
    };
}
function createRecordingLocalOpsTraceSink() {
    const events = [];
    return {
        name: 'recording',
        events,
        emit(event) {
            events.push(event);
        },
    };
}
/**
 * LocalOps trace emitter. One instance carries a correlationId across a related
 * sequence of events. Sink failures are swallowed — telemetry must never break
 * the operator path. Every payload is redacted before it leaves this module.
 */
class LocalOpsTrace {
    constructor(options = {}) {
        this.sink = options.sink ?? exports.noopLocalOpsTraceSink;
        this.correlationId = options.correlationId ?? (0, node_crypto_1.randomUUID)();
        this.session = options.session;
        this.user = options.user;
    }
    /** Emit a structured, redacted event. Returns the event that was emitted. */
    emit(type, summary, data = {}) {
        const event = {
            type,
            ts: new Date().toISOString(),
            correlationId: this.correlationId,
            schemaVersion: exports.LOCALOPS_TRACE_SCHEMA_VERSION,
            ...(this.session ? { session: this.session } : {}),
            ...(this.user ? { user: this.user } : {}),
            summary: (0, redact_js_1.redactStringValue)(summary),
            data: (0, redact_js_1.redactPayload)(data).value,
        };
        try {
            this.sink.emit(event);
        }
        catch {
            // A sink failure must never propagate to the operator path.
        }
        return event;
    }
    // --- AI request/response -------------------------------------------------
    aiRequested(data = {}) {
        return this.emit('localops.ai.requested', 'LocalOps AI requested', data);
    }
    aiResponded(data = {}) {
        return this.emit('localops.ai.responded', `LocalOps AI responded: ${String(data.status ?? 'unknown')}`, data);
    }
    // --- Provider status -----------------------------------------------------
    providerStatusChecked(status) {
        const data = {
            ok: status.ok,
            kind: status.kind,
            status: status.status,
            ...(status.adapter ? { adapter: status.adapter } : {}),
            config: status.config,
            ...(status.problem
                ? {
                    reasonCode: status.problem.reasonCode,
                    profile: status.problem.profile,
                    provider: status.problem.provider,
                    ...(status.problem.violatedConstraint
                        ? { violatedConstraint: status.problem.violatedConstraint }
                        : {}),
                }
                : {}),
        };
        return this.emit('localops.provider.status_checked', `provider status: ${status.status}`, data);
    }
    // --- Policy refusal ------------------------------------------------------
    policyRefused(problem) {
        const data = {
            status: problem.status,
            reasonCode: problem.reasonCode,
            profile: problem.profile,
            provider: problem.provider,
            ...(problem.violatedConstraint ? { violatedConstraint: problem.violatedConstraint } : {}),
        };
        return this.emit('localops.policy.refused', `refused: ${problem.reasonCode}`, data);
    }
    // --- Human-approval gate -------------------------------------------------
    approvalRequired(data = {}) {
        return this.emit('localops.approval.required', 'human approval required before mutation', data);
    }
    // --- RAG (contract only; retrieval lands in WO-LOCALOPS-004) -------------
    ragRetrieved(data = {}) {
        return this.emit('localops.rag.retrieved', 'LocalOps local source retrieved', data);
    }
    // --- Diagnostics (contract only; impl lands in WO-LOCALOPS-005) ----------
    diagnosticStarted(data = {}) {
        return this.emit('localops.tool.diagnostic.started', `diagnostic started: ${String(data.name ?? 'unknown')}`, data);
    }
    diagnosticCompleted(data = {}) {
        return this.emit('localops.tool.diagnostic.completed', `diagnostic completed: ${String(data.name ?? 'unknown')}`, data);
    }
}
exports.LocalOpsTrace = LocalOpsTrace;
/** Convenience constructor mirroring the local-agent factory style. */
function createLocalOpsTrace(options = {}) {
    return new LocalOpsTrace(options);
}
