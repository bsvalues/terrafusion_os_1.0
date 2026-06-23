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

import { randomUUID } from 'node:crypto';
import { appendLocalAgentEvent } from './eventLog.js';
import { redactPayload, redactStringValue, type RedactValue } from './redact.js';
import type { LocalOpsProblem, LocalOpsProviderStatus } from './localOpsProvider.js';
import type { AiProfileName } from './aiProfile.js';

/** The canonical LocalOps event types. */
export const LOCALOPS_EVENT_TYPES = [
  'localops.ai.requested',
  'localops.ai.responded',
  'localops.provider.status_checked',
  'localops.policy.refused',
  'localops.approval.required',
  'localops.rag.retrieved',
  'localops.tool.diagnostic.started',
  'localops.tool.diagnostic.completed',
] as const;

export type LocalOpsEventType = (typeof LOCALOPS_EVENT_TYPES)[number];

export const LOCALOPS_TRACE_SCHEMA_VERSION = 'localops-trace/v1';

/**
 * A LocalOps trace event. `data` is always redaction-safe. Shaped to be
 * TerraTrace-compatible: `correlationId`, `type`, `summary`, `schemaVersion`,
 * and a redacted context (`data`) mirror the canonical trace event's
 * load-bearing fields without coupling to its Postgres row type.
 */
export interface LocalOpsTraceEvent {
  type: LocalOpsEventType;
  /** ISO-8601 timestamp. */
  ts: string;
  correlationId: string;
  schemaVersion: string;
  /** Optional actor/session context when an upstream caller supplies it. */
  session?: string;
  user?: string;
  /** Short, redaction-safe human summary. */
  summary: string;
  /** Redacted structured context (profile/provider/reasonCode/etc.). */
  data: Record<string, RedactValue>;
}

/** A sink consumes emitted events. Implementations must be append-only. */
export interface LocalOpsTraceSink {
  readonly name: string;
  emit(event: LocalOpsTraceEvent): void;
}

/** Default sink: does nothing. Safe when no trace backend is available. */
export const noopLocalOpsTraceSink: LocalOpsTraceSink = {
  name: 'noop',
  emit() {
    /* intentionally empty */
  },
};

/**
 * JSONL sink: reuses the existing append-only, auto-redacting local-agent event
 * log (`.terrafusion/agent-events.jsonl`). Append-only; no mutable state.
 */
export function createJsonlLocalOpsTraceSink(repoRoot: string): LocalOpsTraceSink {
  return {
    name: 'jsonl',
    emit(event: LocalOpsTraceEvent): void {
      appendLocalAgentEvent(repoRoot, event.type, {
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

/** Recording sink for tests/inspection. Collects events in memory (append-only). */
export interface RecordingLocalOpsTraceSink extends LocalOpsTraceSink {
  readonly events: ReadonlyArray<LocalOpsTraceEvent>;
}

export function createRecordingLocalOpsTraceSink(): RecordingLocalOpsTraceSink {
  const events: LocalOpsTraceEvent[] = [];
  return {
    name: 'recording',
    events,
    emit(event: LocalOpsTraceEvent): void {
      events.push(event);
    },
  };
}

export interface LocalOpsTraceOptions {
  /** Sink to receive events. Defaults to the safe no-op sink. */
  sink?: LocalOpsTraceSink;
  /** Correlation id linking a sequence of events. Generated if absent. */
  correlationId?: string;
  /** Optional actor/session context from an upstream caller. */
  session?: string;
  user?: string;
}

type EventData = Record<string, RedactValue>;

/**
 * LocalOps trace emitter. One instance carries a correlationId across a related
 * sequence of events. Sink failures are swallowed — telemetry must never break
 * the operator path. Every payload is redacted before it leaves this module.
 */
export class LocalOpsTrace {
  readonly correlationId: string;
  private readonly sink: LocalOpsTraceSink;
  private readonly session?: string;
  private readonly user?: string;

  constructor(options: LocalOpsTraceOptions = {}) {
    this.sink = options.sink ?? noopLocalOpsTraceSink;
    this.correlationId = options.correlationId ?? randomUUID();
    this.session = options.session;
    this.user = options.user;
  }

  /** Emit a structured, redacted event. Returns the event that was emitted. */
  emit(type: LocalOpsEventType, summary: string, data: EventData = {}): LocalOpsTraceEvent {
    const event: LocalOpsTraceEvent = {
      type,
      ts: new Date().toISOString(),
      correlationId: this.correlationId,
      schemaVersion: LOCALOPS_TRACE_SCHEMA_VERSION,
      ...(this.session ? { session: this.session } : {}),
      ...(this.user ? { user: this.user } : {}),
      summary: redactStringValue(summary),
      data: redactPayload(data).value,
    };
    try {
      this.sink.emit(event);
    } catch {
      // A sink failure must never propagate to the operator path.
    }
    return event;
  }

  // --- AI request/response -------------------------------------------------
  aiRequested(
    data: { profile?: AiProfileName; provider?: string } & EventData = {}
  ): LocalOpsTraceEvent {
    return this.emit('localops.ai.requested', 'LocalOps AI requested', data);
  }

  aiResponded(
    data: { status?: string; profile?: AiProfileName; provider?: string } & EventData = {}
  ): LocalOpsTraceEvent {
    return this.emit(
      'localops.ai.responded',
      `LocalOps AI responded: ${String(data.status ?? 'unknown')}`,
      data
    );
  }

  // --- Provider status -----------------------------------------------------
  providerStatusChecked(status: LocalOpsProviderStatus): LocalOpsTraceEvent {
    const data: EventData = {
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
  policyRefused(problem: LocalOpsProblem): LocalOpsTraceEvent {
    const data: EventData = {
      status: problem.status,
      reasonCode: problem.reasonCode,
      profile: problem.profile,
      provider: problem.provider,
      ...(problem.violatedConstraint ? { violatedConstraint: problem.violatedConstraint } : {}),
    };
    return this.emit('localops.policy.refused', `refused: ${problem.reasonCode}`, data);
  }

  // --- Human-approval gate -------------------------------------------------
  approvalRequired(
    data: { reasonCode?: string; profile?: AiProfileName } & EventData = {}
  ): LocalOpsTraceEvent {
    return this.emit('localops.approval.required', 'human approval required before mutation', data);
  }

  // --- RAG (contract only; retrieval lands in WO-LOCALOPS-004) -------------
  ragRetrieved(data: EventData = {}): LocalOpsTraceEvent {
    return this.emit('localops.rag.retrieved', 'LocalOps local source retrieved', data);
  }

  // --- Diagnostics (contract only; impl lands in WO-LOCALOPS-005) ----------
  diagnosticStarted(data: { name?: string } & EventData = {}): LocalOpsTraceEvent {
    return this.emit(
      'localops.tool.diagnostic.started',
      `diagnostic started: ${String(data.name ?? 'unknown')}`,
      data
    );
  }

  diagnosticCompleted(data: { name?: string; ok?: boolean } & EventData = {}): LocalOpsTraceEvent {
    return this.emit(
      'localops.tool.diagnostic.completed',
      `diagnostic completed: ${String(data.name ?? 'unknown')}`,
      data
    );
  }
}

/** Convenience constructor mirroring the local-agent factory style. */
export function createLocalOpsTrace(options: LocalOpsTraceOptions = {}): LocalOpsTrace {
  return new LocalOpsTrace(options);
}
