/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION EXPLAIN API CLIENT
 * Phase 13: "Explain This" - Make TerraFusion Self-Explaining
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

// API Base URL - uses deterministic port 5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
 * Response model from ExplainGPT endpoint
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
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Request an explanation for a TerraFusion context.
 * Phase 13: Self-explaining government OS.
 *
 * @param req - The explain request with context details
 * @returns ExplainResponse with explanation and related actions
 * @throws Error if request fails
 */
export async function explainContext(req: ExplainRequest): Promise<ExplainResponse> {
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

  return (await response.json()) as ExplainResponse;
}

/**
 * Convenience function for explaining a GPT Studio context
 */
export async function explainGptStudio(
  metadata?: Record<string, unknown>
): Promise<ExplainResponse> {
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
): Promise<ExplainResponse> {
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
): Promise<ExplainResponse> {
  return explainContext({
    contextType: 'PropertyCard',
    contextId: propertyId,
    metadata,
  });
}
