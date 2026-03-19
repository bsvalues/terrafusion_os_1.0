/**
 * pilotApi — HTTP client for the TerraPilot explain endpoint.
 *
 * Calls POST /api/pilot/explain and wraps the call with TerraTrace
 * canonical audit events (tool_invoked → tool_succeeded / tool_failed).
 */

import {
  generateCorrelationId,
  emitToolInvoked,
  emitToolSucceeded,
  emitToolFailed,
} from '@/services/terraTrace';

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

export interface ExplainRequest {
  query: string;
  parcelId?: string;
  countyId: string;
  actorId: string;
  source: string;
  parcelSummary?: Record<string, unknown>;
  statutes?: string[];
}

export interface ExplainSource {
  type: string;
  reference: string;
}

export interface ExplainResponse {
  explanation: string;
  sources: ExplainSource[];
  confidence: number;
  traceId: string;
}

// ---------------------------------------------------------------------------
// explain()
// ---------------------------------------------------------------------------

/**
 * Call POST /api/pilot/explain and return the grounded AI explanation.
 *
 * Emits TerraTrace audit events:
 *   tool_invoked  — before the fetch
 *   tool_succeeded — on 2xx response
 *   tool_failed    — on network error or non-2xx response
 */
export async function explain(req: ExplainRequest): Promise<ExplainResponse> {
  const correlationId = generateCorrelationId();

  emitToolInvoked({
    suite: 'pilot',
    correlationId,
    countyId: req.countyId,
    actor: { userId: req.actorId },
    parcelId: req.parcelId,
    inputSummary: 'muse explain request',
    risk: 'read_only',
  });

  const start = Date.now();

  try {
    const res = await fetch('/api/pilot/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const text = await res.text();
      emitToolFailed({
        suite: 'pilot',
        correlationId,
        countyId: req.countyId,
        actor: { userId: req.actorId },
        parcelId: req.parcelId,
        inputSummary: 'muse explain request',
        outputSummary: `HTTP ${res.status}: ${text}`.slice(0, 200),
      });
      throw new Error(`Explain failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as ExplainResponse;

    emitToolSucceeded({
      suite: 'pilot',
      correlationId,
      countyId: req.countyId,
      actor: { userId: req.actorId },
      parcelId: req.parcelId,
      outputSummary: `explain ok traceId=${data.traceId} durationMs=${Date.now() - start}`,
    });

    return data;
  } catch (err) {
    // Only emit failed if we haven't already emitted it (non-2xx path above re-throws
    // after emitting, so we catch that here too — but emitToolFailed is idempotent
    // from an audit perspective, so a double-emit on the error path is acceptable).
    if (err instanceof Error && err.message.startsWith('Explain failed:')) {
      // Already emitted tool_failed above — just rethrow.
      throw err;
    }

    emitToolFailed({
      suite: 'pilot',
      correlationId,
      countyId: req.countyId,
      actor: { userId: req.actorId },
      parcelId: req.parcelId,
      inputSummary: 'muse explain request',
      outputSummary: String(err).slice(0, 200),
    });

    throw err;
  }
}
