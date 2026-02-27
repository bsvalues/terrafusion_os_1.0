/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION EXPLAIN API CLIENT
 * Phase 13: "Explain This" - Make TerraFusion Self-Explaining
 * Phase 25: V2 - Source Highlighting & Trace Carousel
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { getViteEnv } from '@/env/getViteEnv';

// API Base URL - uses deterministic port 5000
const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Context types for ExplainGPT requests
 */
export type ExplainContextType =
  | 'GPTStudio'
  | 'RAGTrace'
  | 'PropertyCard'
  | 'AssessmentWorkflow'
  | 'Dashboard'
  | string; // Allow custom context types

/**
 * Request model for ExplainGPT endpoint
 */
export interface ExplainRequest {
  /** Context type being explained (e.g., "GPTStudio", "RAGTrace") */
  contextType: ExplainContextType;
  /** Optional identifier for specific item within context */
  contextId?: string;
  /** Additional metadata to enrich explanation */
  metadata?: Record<string, unknown>;
  /** Optional specific question about the context */
  question?: string;
  /** Target audience (defaults to "county-staff") */
  audience?: string;
}

/**
 * Related action suggested by ExplainGPT
 */
export interface RelatedAction {
  /** Label for the action */
  label: string;
  /** Action type (navigate, toggle, export, open-modal) */
  actionType: string;
  /** Target for the action (route, toggle ID, etc.) */
  target: string;
}

/**
 * Response model from ExplainGPT endpoint (V1 - backward compatible)
 */
export interface ExplainResponse {
  /** Full explanation text */
  explanation: string;
  /** Short summary for previews */
  summary: string;
  /** Key points extracted from explanation */
  keyPoints: string[];
  /** Related actions user might want to take */
  relatedActions: RelatedAction[];
  /** Context type that was explained */
  contextType: string;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Confidence score (0-1) */
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 25 - V2 TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Source attribution for explanation segments.
 * Represents a document/knowledge-base entry that supports the explanation.
 */
export interface ExplainSourceAttribution {
  /** Unique source identifier */
  sourceId: string;
  /** Display title for the source */
  sourceTitle: string;
  /** Type of source (documentation, policy, data-record, etc.) */
  sourceType: string;
  /** Short preview snippet from the source */
  snippet: string;
}

/**
 * A segment of the explanation text with source links.
 * Allows highlighting which sources support each part of the explanation.
 */
export interface ExplainSegment {
  /** Unique segment identifier */
  segmentId: string;
  /** Text content of this segment */
  text: string;
  /** IDs of sources that support this segment */
  sourceIds: string[];
}

/**
 * A step in the explanation trace showing how the explanation was constructed.
 * Used for the trace carousel UI.
 */
export interface ExplainStep {
  /** Unique step identifier */
  stepId: string;
  /** Short title for the step */
  title: string;
  /** Detailed description of what happened in this step */
  description: string;
  /** IDs of sources accessed during this step */
  sourceIds: string[];
}

/**
 * V2 Response model from ExplainGPT endpoint with source attribution.
 * Phase 25: Source Highlighting & Trace Carousel
 */
export interface ExplainResponseV2 {
  /** Unique explanation identifier for tracking */
  explanationId: string;
  /** Full explanation text (for fallback display) */
  fullText: string;
  /** Short summary for previews */
  summary: string;
  /** Segmented explanation with source links (empty = V1 mode) */
  segments: ExplainSegment[];
  /** Sources that informed this explanation */
  sources: ExplainSourceAttribution[];
  /** Trace steps showing how explanation was generated */
  steps: ExplainStep[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Request an explanation for a TerraFusion context.
 * Phase 13: Self-explaining government OS.
 * Phase 25: V2 with source attribution and trace carousel.
 *
 * @param req - The explain request with context details
 * @returns ExplainResponseV2 with segmented explanation, sources, and trace steps
 * @throws Error if request fails
 */
export async function explainContext(req: ExplainRequest): Promise<ExplainResponseV2> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/explain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Note: AllowAnonymous on backend, no auth header needed
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`ExplainGPT request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as ExplainResponseV2;
}

/**
 * Convenience function for explaining a GPT Studio context
 */
export async function explainGptStudio(
  metadata?: Record<string, unknown>
): Promise<ExplainResponseV2> {
  return explainContext({
    contextType: 'GPTStudio',
    metadata,
  });
}

/**
 * Convenience function for explaining RAG trace panel
 */
export async function explainRagTrace(
  gptKey?: string,
  sourceCount?: number
): Promise<ExplainResponseV2> {
  return explainContext({
    contextType: 'RAGTrace',
    metadata: {
      gptKey,
      hasSources: sourceCount ?? 0,
    },
  });
}

/**
 * Convenience function for explaining a property card
 */
export async function explainPropertyCard(
  propertyId: string,
  metadata?: Record<string, unknown>
): Promise<ExplainResponseV2> {
  return explainContext({
    contextType: 'PropertyCard',
    contextId: propertyId,
    metadata,
  });
}

/**
 * Helper to check if a response is V2 (has populated segments)
 */
export function isExplainV2Response(response: ExplainResponseV2): boolean {
  return response.segments && response.segments.length > 0;
}

/**
 * Get sources for a specific segment
 */
export function getSourcesForSegment(
  segmentId: string,
  response: ExplainResponseV2
): ExplainSourceAttribution[] {
  const segment = response.segments.find((s) => s.segmentId === segmentId);
  if (!segment) return [];
  return response.sources.filter((src) => segment.sourceIds.includes(src.sourceId));
}

/**
 * Get segments that reference a specific source
 */
export function getSegmentsForSource(
  sourceId: string,
  response: ExplainResponseV2
): ExplainSegment[] {
  return response.segments.filter((seg) => seg.sourceIds.includes(sourceId));
}
