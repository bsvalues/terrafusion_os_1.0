/**
 * pilotApi — HTTP client for the TerraPilot explain and HITL draft endpoints.
 *
 * Calls POST /api/pilot/explain and the Phase 10 HITL draft endpoints,
 * wrapping every call with TerraTrace canonical audit events
 * (tool_invoked → tool_succeeded / tool_failed).
 */

import {
  generateCorrelationId,
  emitToolInvoked,
  emitToolSucceeded,
  emitToolFailed,
} from '@/services/terraTrace';

// ---------------------------------------------------------------------------
// Request / Response types — Explain
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

// ---------------------------------------------------------------------------
// Phase 10 — HITL Drafter Mode
// Request / Response types — Draft
// ---------------------------------------------------------------------------

export interface CreateDraftRequest {
  countyId: string;
  proposedBy: string;
  actionSummary: string;
  actionPayloadJson: string;
}

export interface ApproveDraftRequest {
  countyId: string;
  humanApproverId: string;
}

export interface RejectDraftRequest {
  countyId: string;
  humanApproverId: string;
  reason: string;
}

export interface DraftResponse {
  id: string;
  countyId: string;
  proposedBy: string;
  actionSummary: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  humanApproverId?: string;
  rejectionReason?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// createDraft
// ---------------------------------------------------------------------------

export async function createDraft(req: CreateDraftRequest): Promise<DraftResponse> {
  const correlationId = generateCorrelationId();
  emitToolInvoked({
    suite: 'pilot',
    correlationId,
    countyId: req.countyId,
    actor: { userId: req.proposedBy },
    inputSummary: 'createDraft',
    risk: 'write_low',
  });
  const start = Date.now();
  try {
    const res = await fetch('/api/pilot/drafts', {
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
        actor: { userId: req.proposedBy },
        outputSummary: `createDraft HTTP ${res.status}: ${text}`.slice(0, 200),
      });
      throw new Error(`createDraft failed: ${res.status} ${text}`);
    }
    const data: DraftResponse = await res.json();
    emitToolSucceeded({
      suite: 'pilot',
      correlationId,
      countyId: req.countyId,
      actor: { userId: req.proposedBy },
      outputSummary: `createDraft ok draftId=${data.id} durationMs=${Date.now() - start}`,
    });
    return data;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('createDraft failed:')) {
      throw err;
    }
    emitToolFailed({
      suite: 'pilot',
      correlationId,
      countyId: req.countyId,
      actor: { userId: req.proposedBy },
      outputSummary: String(err).slice(0, 200),
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// approveDraft — TruthGate: humanApproverId required
// ---------------------------------------------------------------------------

export async function approveDraft(draftId: string, req: ApproveDraftRequest): Promise<DraftResponse> {
  const correlationId = generateCorrelationId();
  emitToolInvoked({
    suite: 'pilot',
    correlationId,
    countyId: req.countyId,
    actor: { userId: req.humanApproverId },
    inputSummary: `approveDraft draftId=${draftId}`,
    risk: 'write_high',
  });
  const start = Date.now();
  try {
    const res = await fetch(`/api/pilot/drafts/${draftId}/approve`, {
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
        actor: { userId: req.humanApproverId },
        outputSummary: `approveDraft HTTP ${res.status}: ${text}`.slice(0, 200),
      });
      throw new Error(`approveDraft failed: ${res.status} ${text}`);
    }
    const data: DraftResponse = await res.json();
    emitToolSucceeded({
      suite: 'pilot',
      correlationId,
      countyId: req.countyId,
      actor: { userId: req.humanApproverId },
      outputSummary: `approveDraft ok draftId=${data.id} durationMs=${Date.now() - start}`,
    });
    return data;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('approveDraft failed:')) {
      throw err;
    }
    emitToolFailed({
      suite: 'pilot',
      correlationId,
      countyId: req.countyId,
      actor: { userId: req.humanApproverId },
      outputSummary: String(err).slice(0, 200),
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// rejectDraft — TruthGate: humanApproverId required
// ---------------------------------------------------------------------------

export async function rejectDraft(draftId: string, req: RejectDraftRequest): Promise<DraftResponse> {
  const correlationId = generateCorrelationId();
  emitToolInvoked({
    suite: 'pilot',
    correlationId,
    countyId: req.countyId,
    actor: { userId: req.humanApproverId },
    inputSummary: `rejectDraft draftId=${draftId}`,
    risk: 'write_low',
  });
  const start = Date.now();
  try {
    const res = await fetch(`/api/pilot/drafts/${draftId}/reject`, {
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
        actor: { userId: req.humanApproverId },
        outputSummary: `rejectDraft HTTP ${res.status}: ${text}`.slice(0, 200),
      });
      throw new Error(`rejectDraft failed: ${res.status} ${text}`);
    }
    const data: DraftResponse = await res.json();
    emitToolSucceeded({
      suite: 'pilot',
      correlationId,
      countyId: req.countyId,
      actor: { userId: req.humanApproverId },
      outputSummary: `rejectDraft ok draftId=${data.id} durationMs=${Date.now() - start}`,
    });
    return data;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('rejectDraft failed:')) {
      throw err;
    }
    emitToolFailed({
      suite: 'pilot',
      correlationId,
      countyId: req.countyId,
      actor: { userId: req.humanApproverId },
      outputSummary: String(err).slice(0, 200),
    });
    throw err;
  }
}
