// WO-AI-CONSOLIDATION-002 — LocalOps → TerraTrace bridge (thin seam).
//
// Realizes the bridge contract documented in WO-LOCALOPS-003: LocalOps trace
// events carry the load-bearing fields (type, correlationId, schemaVersion,
// summary, redacted data) "so a future bridge can map them 1:1 onto the
// canonical trace store". This module IS that bridge: a LocalOpsTraceSink that
// maps each localops.* event onto a canonical TerraTrace `TraceEventInput` and
// emits it through the injected trace service (the constitutional append-only
// spine; see .github/AGENT_ENTRYPOINT.md "TERRATRACE").
//
// Scope honesty: this unifies the GOVERNED ON-SERVER AI OPERATOR PATH (the
// LocalOps engine + diagnostics + KB) onto TerraTrace. The .NET AuditLogs
// paths (AICommandService / Muse HTTP) are a separate seam — out of this
// container's provable surface and out of the agent entrypoint's allowed
// lanes — and remain tracked in docs/ai-consolidation/.
//
// Design rules:
//  - 1:1, lossless-where-the-union-allows: the original localops type is
//    preserved as a summary prefix (the canonical union is closed).
//  - The bridge NEVER throws into the operator path: emit errors are swallowed
//    (the LocalOps trace adapter additionally guards sinks).
//  - County context is explicit: the canonical store requires county/user
//    context, which LocalOps v1 does not invent — callers supply it.

import type { LocalOpsTraceEvent, LocalOpsTraceSink } from './localOpsTrace.js';
import type {
  Mode,
  ToolExecutionContext,
  TraceEvent,
  TraceEventInput,
  TraceEventType,
} from '../../types/index.js';

/** The minimal TerraTrace surface the bridge needs (TraceService satisfies it). */
export interface TerraTraceEmitter {
  emit(input: TraceEventInput): TraceEvent;
}

export interface TerraTraceBridgeContext {
  /** County ID for isolation — required by the canonical trace context. */
  countyId: string;
  /** Operator/user ID attributed to LocalOps activity. */
  userId: string;
  /** Roles for the trace context. Defaults to ['operator']. */
  roles?: string[];
  /** Pilot or Muse mode. LocalOps is the Pilot operator path; defaults to 'pilot'. */
  mode?: Mode;
}

export interface CreateTerraTraceBridgeSinkOptions {
  trace: TerraTraceEmitter;
  context: TerraTraceBridgeContext;
}

/** toolId per localops event family — stable, queryable identifiers. */
function toolIdFor(type: LocalOpsTraceEvent['type']): string {
  switch (type) {
    case 'localops.ai.requested':
    case 'localops.ai.responded':
      return 'localops.engine';
    case 'localops.provider.status_checked':
      return 'localops.provider';
    case 'localops.policy.refused':
      return 'localops.policy';
    case 'localops.approval.required':
      return 'localops.approval';
    case 'localops.rag.retrieved':
      return 'localops.kb';
    case 'localops.tool.diagnostic.started':
    case 'localops.tool.diagnostic.completed':
      return 'localops.diagnostics';
  }
}

/** Canonical event type per localops event (closed-union mapping). */
function traceTypeFor(event: LocalOpsTraceEvent): TraceEventType {
  switch (event.type) {
    case 'localops.ai.requested':
    case 'localops.tool.diagnostic.started':
      return 'tool_invoked';
    case 'localops.ai.responded':
      return event.data.status === 'success' ? 'tool_completed' : 'tool_failed';
    case 'localops.tool.diagnostic.completed':
      return event.data.ok === false ? 'tool_failed' : 'tool_completed';
    case 'localops.provider.status_checked':
    case 'localops.rag.retrieved':
      return 'tool_completed';
    case 'localops.policy.refused':
      return 'permission_denied';
    case 'localops.approval.required':
      return 'approval_requested';
  }
}

/**
 * Map a LocalOps trace event 1:1 onto a canonical TerraTrace event input.
 * Pure function — exported for direct contract testing.
 */
export function mapLocalOpsEventToTraceInput(
  event: LocalOpsTraceEvent,
  context: TerraTraceBridgeContext
): TraceEventInput {
  const type = traceTypeFor(event);
  const errorCode =
    type === 'tool_failed' || type === 'permission_denied'
      ? String(event.data.reasonCode ?? event.data.status ?? 'LOCALOPS_FAILURE')
      : undefined;

  const executionContext: ToolExecutionContext = {
    countyId: context.countyId,
    userId: event.user ?? context.userId,
    roles: context.roles ?? ['operator'],
    mode: context.mode ?? 'pilot',
  };

  return {
    type,
    toolId: toolIdFor(event.type),
    correlationId: event.correlationId,
    context: executionContext,
    // The canonical union is closed; the original localops type is preserved
    // verbatim as a summary prefix so the mapping stays 1:1-recoverable.
    summary: `[${event.type}] ${event.summary}`,
    component: 'LocalOpsTraceBridge',
    ...(errorCode ? { errorCode } : {}),
  };
}

/**
 * A LocalOpsTraceSink that forwards every event to the canonical TerraTrace
 * service. Emit failures never reach the operator path.
 */
export function createTerraTraceBridgeSink(
  options: CreateTerraTraceBridgeSinkOptions
): LocalOpsTraceSink {
  const { trace, context } = options;
  return {
    name: 'terratrace-bridge',
    emit(event: LocalOpsTraceEvent): void {
      try {
        trace.emit(mapLocalOpsEventToTraceInput(event, context));
      } catch {
        // The trace spine must never break the operator path (mirrors the
        // LocalOps doctrine: sink failures are non-fatal).
      }
    },
  };
}

/**
 * Fan a LocalOps trace stream out to several sinks (e.g. the engine's
 * recording sink AND the TerraTrace bridge). Each sink is error-isolated.
 */
export function composeLocalOpsTraceSinks(
  ...sinks: LocalOpsTraceSink[]
): LocalOpsTraceSink {
  return {
    name: `compose(${sinks.map((s) => s.name).join(',')})`,
    emit(event: LocalOpsTraceEvent): void {
      for (const sink of sinks) {
        try {
          sink.emit(event);
        } catch {
          // One failing sink must not starve the others or the caller.
        }
      }
    },
  };
}
