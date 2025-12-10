/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION SYSTEM DIAGNOSTICS API CLIENT
 * Phase 15: SystemGPT Console - AI Control Center
 * Phase 17: Safe Mode & Kill Switch
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

// API Base URL - uses deterministic port 5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type SystemHealthStatus = 'Unknown' | 'Healthy' | 'Degraded' | 'Unhealthy';

/** Phase 17: SystemGPT operational mode */
export type SystemGptMode = 'Normal' | 'SafeMode';

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
  /** Phase 17: Current operational mode */
  mode: SystemGptMode;
  /** Phase 17: Reason for Safe Mode (if active) */
  modeReason?: string | null;
  /** Phase 17: Who changed the mode */
  modeChangedBy?: string | null;
  /** Phase 17: When the mode was changed */
  modeChangedAt?: string | null;
  timestamp: string;
  gptConfigs: GptConfigSummary[];
  embeddingStatus: EmbeddingServiceStatus;
  ragDatasets: RagDatasetSummary[];
  explainGptStatus: ServiceStatus;
  statistics: UsageStatistics;
  heraldMessages: HeraldMessage[];
}

/** Phase 17: Request to set Safe Mode */
export interface SetSystemGptModeRequest {
  enabled: boolean;
  reason?: string;
}

/** Phase 17: Response after setting mode */
export interface SetSystemGptModeResponse {
  success: boolean;
  mode: SystemGptMode;
  modeReason?: string | null;
  changedBy?: string | null;
  changedAt: string;
  message: string;
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

/**
 * Download AI Health Snapshot as JSON file.
 * Phase 16: One-click audit artifact for compliance and troubleshooting.
 */
export async function downloadHealthSnapshot(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/system/diagnostics/download`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Health snapshot download failed (${response.status}): ${errorText}`);
  }

  // Extract filename from Content-Disposition header or generate default
  const contentDisposition = response.headers.get('Content-Disposition');
  const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] || `terrafusion_ai_health_snapshot_${Date.now()}.json`;

  // Create blob and trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Set SystemGPT Safe Mode.
 * Phase 17: Kill Switch - allows county tech leads to constrain AI behavior during incidents.
 */
export async function setSystemGptMode(
  payload: SetSystemGptModeRequest
): Promise<SetSystemGptModeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/system/safe-mode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to set SystemGPT mode (${response.status})`);
  }

  return (await response.json()) as SetSystemGptModeResponse;
}

/**
 * Get current SystemGPT Safe Mode status.
 * Phase 17: Quick check for mode status without full diagnostics.
 */
export async function getSystemGptModeStatus(): Promise<SetSystemGptModeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/system/safe-mode`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get SystemGPT mode status (${response.status})`);
  }

  return (await response.json()) as SetSystemGptModeResponse;
}
