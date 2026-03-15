/**
 * Forge Valuation Agent Service (BIV-152)
 * ===================================================================
 * Client-side API service for requesting AI agent valuation analysis
 * and checking agent availability. Interfaces with the TerraFusion
 * Consciousness swarm for automated property analysis.
 */

// ============================================================================
// Types
// ============================================================================

/** AI agent valuation analysis result */
export interface AgentAnalysis {
  /** Parcel identifier analyzed */
  parcelId: string;
  /** Unique analysis request ID */
  analysisId: string;
  /** Agent that performed the analysis */
  agentId: string;
  /** Agent display name */
  agentName: string;
  /** Analysis status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** Recommended value from agent analysis */
  recommendedValue: number | null;
  /** Confidence score (0-1) */
  confidence: number | null;
  /** Valuation approach recommended by the agent */
  recommendedApproach: 'cost' | 'sales_comparison' | 'income' | 'blended' | null;
  /** Agent's narrative analysis and findings */
  narrative: string | null;
  /** Key factors the agent identified */
  keyFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }>;
  /** Comparable properties the agent considered */
  consideredComps: string[];
  /** ISO timestamp when analysis was requested */
  requestedAt: string;
  /** ISO timestamp when analysis was completed (null if pending) */
  completedAt: string | null;
}

/** Status of the AI valuation agent pool */
export interface AgentStatus {
  /** Total number of valuation agents in the swarm */
  totalAgents: number;
  /** Number of agents currently available */
  availableAgents: number;
  /** Number of agents currently processing requests */
  busyAgents: number;
  /** Number of queued analysis requests */
  queuedRequests: number;
  /** Average processing time in seconds */
  avgProcessingTimeSec: number;
  /** Whether the agent pool is accepting new requests */
  acceptingRequests: boolean;
  /** ISO timestamp of status snapshot */
  asOfTimestamp: string;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/agent';

/**
 * Request an AI agent valuation analysis for a parcel. The request is
 * queued and processed asynchronously by the Consciousness swarm.
 * @param parcelId - The parcel to analyze
 * @returns The initial agent analysis record (status will be 'pending')
 */
export async function requestAgentAnalysis(parcelId: string): Promise<AgentAnalysis> {
  const response = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parcelId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to request agent analysis for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch the current status of the AI valuation agent pool.
 * @returns Agent pool availability and queue status
 */
export async function fetchAgentStatus(): Promise<AgentStatus> {
  const response = await fetch(`${BASE_URL}/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent status: ${response.statusText}`);
  }
  return response.json();
}
