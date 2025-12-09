/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION SYSTEM DIAGNOSTICS API CLIENT
 * Phase 15: SystemGPT Console - AI Control Center
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

// API Base URL - uses deterministic port 5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type SystemHealthStatus = 'Unknown' | 'Healthy' | 'Degraded' | 'Unhealthy';

export interface GptConfigSummary {
  key: string;
  name: string;
  enabled: boolean;
  model: string;
  ragEnabled: boolean;
  conversationCount: number;
}

export interface EmbeddingServiceStatus {
  mode: string;
  available: boolean;
  dimensions: number;
  provider: string;
  lastSuccess?: string;
}

export interface RagDatasetSummary {
  key: string;
  name: string;
  indexed: boolean;
  documentCount: number;
  embeddingCount: number;
  lastIndexed?: string;
  status: string;
}

export interface ServiceStatus {
  healthy: boolean;
  message: string;
  lastCheck?: string;
  responseTimeMs?: number;
}

export interface UsageStatistics {
  totalConversations: number;
  totalMessages: number;
  auditRecordCount: number;
  ragTraceCount: number;
  messagesLast24h: number;
  conversationsLast24h: number;
}

export interface HeraldMessage {
  level: string;
  message: string;
  timestamp: string;
  source: string;
}

export interface SystemDiagnosticsResponse {
  overallHealth: SystemHealthStatus;
  timestamp: string;
  gptConfigs: GptConfigSummary[];
  embeddingStatus: EmbeddingServiceStatus;
  ragDatasets: RagDatasetSummary[];
  explainGptStatus: ServiceStatus;
  statistics: UsageStatistics;
  heraldMessages: HeraldMessage[];
}

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch system diagnostics snapshot.
 * Phase 15: AI Control Center for county tech leads.
 */
export async function getSystemDiagnostics(): Promise<SystemDiagnosticsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/system/diagnostics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`System diagnostics request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as SystemDiagnosticsResponse;
}

/**
 * Trigger RAG index operation.
 * Calls the existing /api/gpt/rag/index endpoint.
 */
export async function triggerRagIndex(datasetKey: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/rag/index/${datasetKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`RAG index request failed (${response.status}): ${errorText}`);
  }
}

/**
 * Get GPT health status.
 */
export async function getGptHealth(): Promise<{ healthy: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/rag/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return { healthy: false, message: 'API not responding' };
  }

  return { healthy: true, message: 'All systems operational' };
}
