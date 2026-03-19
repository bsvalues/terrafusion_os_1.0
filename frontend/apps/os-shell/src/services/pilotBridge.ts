/**
 * PilotBridge — Context injection service for TerraPilot Muse Mode.
 *
 * Assembles validated parcel context + applicable statutes for the
 * AI explain pipeline. Read-only — no mutations.
 */

import type { OsActor } from '@/auth/useAuthContext';

export interface PilotContext {
  /** Active parcel ID (null if no parcel selected) */
  parcelId: string | null;
  /** County scope for isolation */
  countyId: string;
  /** Actor performing the query */
  actorId: string;
  /** Parcel data summary for grounding */
  parcelSummary?: Record<string, unknown>;
  /** Applicable statute references */
  statutes?: string[];
}

export interface PilotExplainRequest {
  /** What the user wants explained */
  query: string;
  /** Grounding context from the workbench */
  context: PilotContext;
  /** Source tag for audit */
  source: 'AI_PILOT';
}

export interface PilotExplainResponse {
  /** AI-generated explanation grounded in context */
  explanation: string;
  /** Sources cited in the explanation */
  sources: Array<{ type: 'statute' | 'trace' | 'parcel_data'; reference: string }>;
  /** Confidence score (0-1) */
  confidence: number;
  /** Trace ID for audit */
  traceId: string;
}

/**
 * Build a PilotContext from workbench state.
 * Pure function — no side effects.
 */
export function buildPilotContext(
  actor: OsActor | null,
  parcelId: string | null,
  parcelData?: Record<string, unknown>,
): PilotContext | null {
  if (!actor) return null;
  return {
    parcelId,
    countyId: actor.countyId,
    actorId: actor.userId,
    parcelSummary: parcelData,
    statutes: [], // Populated by explain endpoint from statute database
  };
}

/**
 * Build an explain request from context + query.
 */
export function buildExplainRequest(
  query: string,
  context: PilotContext,
): PilotExplainRequest {
  return { query, context, source: 'AI_PILOT' };
}
