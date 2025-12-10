/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION SYSTEM DIAGNOSTICS API CLIENT
 * Phase 15: SystemGPT Console - AI Control Center
 * Phase 17: Safe Mode & Kill Switch
 * Phase 18: Benton CAMA RAG Readiness Panel
 * Phase 19: AI Incident Timeline
 * Phase 20: Metrics & Telemetry Console
 * Phase 22: Multi-County Federation Layer
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

// API Base URL - uses deterministic port 5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════
// PHASE 22: COUNTY FEDERATION TYPES
// ═══════════════════════════════════════════════════════════════

/** Phase 22: County identifiers for multi-county federation */
export type CountyId = 'benton' | 'yakima' | 'franklin';

/** Phase 22: County metadata for display and selection */
export interface CountyOption {
  id: CountyId;
  displayName: string;
  isConfigured: boolean;
  state: string;
}

/** Phase 22: Available counties for the county selector */
export const COUNTY_OPTIONS: CountyOption[] = [
  { id: 'benton', displayName: 'Benton County', isConfigured: true, state: 'WA' },
  { id: 'yakima', displayName: 'Yakima County', isConfigured: false, state: 'WA' },
  { id: 'franklin', displayName: 'Franklin County', isConfigured: false, state: 'WA' },
];

/** Phase 22: Default county (Benton) */
export const DEFAULT_COUNTY_ID: CountyId = 'benton';

/** Phase 22: Get county option by ID */
export function getCountyOption(countyId: CountyId | string | undefined): CountyOption {
  const found = COUNTY_OPTIONS.find((c) => c.id === countyId);
  return found ?? COUNTY_OPTIONS[0]; // Default to Benton
}

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type SystemHealthStatus = 'Unknown' | 'Healthy' | 'Degraded' | 'Unhealthy';

/** Phase 17: SystemGPT operational mode */
export type SystemGptMode = 'Normal' | 'SafeMode';

/** Phase 18: Benton CAMA RAG overall status */
export type BentonRagStatus = 'Ready' | 'Stale' | 'Unindexed' | 'Partial';

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

/** Phase 18: Benton CAMA RAG Readiness */
export interface BentonRagReadiness {
  datasetKey: string;
  displayName: string;
  isIndexed: boolean;
  isPartiallyIndexed: boolean;
  documentCount: number;
  embeddingCount: number;
  lastIngestAt?: string | null;
  lastIndexAt?: string | null;
  overallStatus: BentonRagStatus;
  statusReason?: string | null;
  activeGptConfigs: string[];
}

// ═══════════════════════════════════════════════════════════════
// PHASE 19: AI INCIDENT TIMELINE TYPES
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// PHASE 26: GUARDRAIL DECISION TYPES
// ═══════════════════════════════════════════════════════════════

/** Phase 26: Guardrail decision kinds */
export type GuardrailDecisionKind =
  | 'None'
  | 'Allowed'
  | 'DeniedByPolicy'
  | 'DeniedUnconfigured'
  | 'ThrottledByCapacity'
  | 'SafeModeRecommended'
  | 'Sanitized'
  | 'ForceExplainOnValuation';

/** Phase 26: Last guardrail decision for UI display */
export interface LastGuardrailDecision {
  /** Whether the request was allowed. */
  allow: boolean;
  /** Reason for denial (if allow=false). */
  denyReason?: string | null;
  /** Decision kind for categorization. */
  kind: GuardrailDecisionKind;
  /** Safe Mode is recommended based on system state. */
  autoSafeModeRecommended: boolean;
  /** Request was/should be throttled. */
  autoThrottle: boolean;
  /** ExplainGPT is required for this request. */
  forceExplain: boolean;
  /** Sanitization was/should be applied. */
  autoSanitize: boolean;
  /** Human-readable advisory message. */
  advisory?: string | null;
  /** When this decision was made. */
  decisionTimestampUtc: string;
  /** Context ID of the evaluated request. */
  contextId?: string | null;
}

// ═══════════════════════════════════════════════════════════════

/** Phase 19: Types of AI system events */
export type SystemGptEventKind =
  | 'Unknown'
  | 'SafeModeChanged'
  | 'RagReindexed'
  | 'RagHealthChanged'
  | 'HealthSnapshotDownloaded'
  | 'BentonRagSnapshotDownloaded'
  | 'HeraldWarning'
  | 'HeraldError';

/** Phase 19: AI system event for timeline display */
export interface SystemGptEvent {
  timestampUtc: string;
  kind: SystemGptEventKind;
  severity: string; // 'info' | 'warning' | 'error' | 'critical'
  summary: string;
  details?: string | null;
  actor?: string | null;
  correlationId?: string | null;
}

export interface SystemDiagnosticsResponse {
  /** Phase 22: County identifier for this snapshot */
  countyId: string;
  /** Phase 22: County display name */
  countyName: string;
  /** Phase 22: Whether this county has AI/RAG services configured */
  countyConfigured: boolean;
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
  /** Phase 18: Benton CAMA RAG readiness status */
  bentonRag?: BentonRagReadiness | null;
  /** Phase 26: Last guardrail decision for this county */
  lastGuardrailDecision?: LastGuardrailDecision | null;
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
 * Phase 22: Multi-county federation - optional countyId parameter.
 * @param countyId - County identifier (benton, yakima, franklin). Defaults to Benton.
 */
export async function getSystemDiagnostics(
  countyId?: CountyId
): Promise<SystemDiagnosticsResponse> {
  const params = new URLSearchParams();
  if (countyId) {
    params.set('countyId', countyId);
  }
  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/gpt/system/diagnostics${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
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

/**
 * Download Benton CAMA RAG Snapshot as JSON file.
 * Phase 18: County-specific RAG health export for audits and demos.
 */
export async function downloadBentonRagSnapshot(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/rag/benton_cama_basics/export`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Benton RAG snapshot download failed (${response.status}): ${errorText}`);
  }

  // Extract filename from Content-Disposition header or generate default
  const contentDisposition = response.headers.get('Content-Disposition');
  const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] || `benton_cama_rag_snapshot_${Date.now()}.json`;

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

// ═══════════════════════════════════════════════════════════════
// PHASE 19: AI INCIDENT TIMELINE API
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch recent AI system events for timeline display.
 * Phase 19: AI Incident Timeline - "What happened to the AI system this week?"
 * Phase 22: Multi-county federation - optional countyId parameter.
 * @param countyId - County identifier (benton, yakima, franklin). Defaults to Benton.
 * @param since - Optional ISO timestamp to filter events after this time
 * @param limit - Maximum number of events to return (default: 50, max: 100)
 */
export async function getSystemGptEvents(
  countyId?: CountyId,
  since?: string,
  limit: number = 50
): Promise<SystemGptEvent[]> {
  const params = new URLSearchParams();
  if (countyId) {
    params.append('countyId', countyId);
  }
  if (since) {
    params.append('since', since);
  }
  params.append('limit', String(Math.min(limit, 100)));

  const url = `${API_BASE_URL}/api/gpt/system/events?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`System events request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as SystemGptEvent[];
}

// ═══════════════════════════════════════════════════════════════
// PHASE 20: METRICS & TELEMETRY CONSOLE API
// ═══════════════════════════════════════════════════════════════

/** Phase 20: A single data point in a metrics time series */
export interface SystemGptMetricSeriesPoint {
  timestampUtc: string;
  value: number;
}

/** Phase 20: A named time series of metric values (for sparkline charts) */
export interface SystemGptMetricSeries {
  name: string;
  unit: string;
  points: SystemGptMetricSeriesPoint[];
}

/** Phase 20: Comprehensive metrics snapshot for telemetry console */
export interface SystemGptMetricsSnapshot {
  /** Phase 22: County identifier for this snapshot */
  countyId: string;
  /** Phase 22: County display name */
  countyName: string;
  /** Phase 22: Whether this county has AI/RAG services configured */
  countyConfigured: boolean;

  generatedAtUtc: string;
  windowMinutes: number;

  // High-level stats
  gptLatencyMsP50: number;
  gptLatencyMsP95: number;
  ragLatencyMsP95: number;
  embeddingLatencyMsP95: number;

  requestsPerMinute: number;
  errorRatePercent: number;
  totalRequests: number;

  totalTokensIn: number;
  totalTokensOut: number;

  // Time series for charts
  series: SystemGptMetricSeries[];

  // Phase 21: Capacity prediction
  capacity?: SystemGptCapacityPrediction;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 21: Capacity Prediction & Advisory
// ─────────────────────────────────────────────────────────────────────────────

/** Phase 21: Saturation risk levels for capacity planning */
export type SaturationRiskLevel = 'Low' | 'Medium' | 'High';

/** Phase 21: Capacity prediction and advisory for county tech leads */
export interface SystemGptCapacityPrediction {
  /** Current saturation risk level */
  saturationRisk: SaturationRiskLevel;

  /** Predicted requests per minute in approximately 5 minutes */
  predictedRequestsPerMinuteIn5Min: number;

  /** True if GPT latency is trending upward */
  latencyIncreasing: boolean;

  /** True if error rate is trending upward */
  errorRateIncreasing: boolean;

  /** True if RAG latency is trending upward */
  ragLatencyIncreasing: boolean;

  /** Human-readable advisory for the county tech lead */
  advisory?: string;
}

/**
 * Fetch SystemGPT metrics snapshot for telemetry display.
 * Phase 20: AI Metrics & Telemetry - "How fast is GPT right now?"
 * Phase 22: Multi-county federation - optional countyId parameter.
 * @param countyId - County identifier (benton, yakima, franklin). Defaults to Benton.
 * @param windowMinutes - Time window in minutes (default: 15, max: 60)
 * @param maxSeriesPoints - Maximum data points per series (default: 50, max: 200)
 */
export async function getSystemGptMetrics(
  countyId?: CountyId,
  windowMinutes: number = 15,
  maxSeriesPoints: number = 50
): Promise<SystemGptMetricsSnapshot> {
  const params = new URLSearchParams();
  if (countyId) {
    params.append('countyId', countyId);
  }
  params.append('windowMinutes', String(Math.min(windowMinutes, 60)));
  params.append('maxSeriesPoints', String(Math.min(maxSeriesPoints, 200)));

  const url = `${API_BASE_URL}/api/gpt/system/metrics?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`System metrics request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as SystemGptMetricsSnapshot;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 23: FEDERATED OVERVIEW (MULTI-COUNTY DASHBOARD)
// ═══════════════════════════════════════════════════════════════

/** Phase 23: Per-county health overview for the Federated Dashboard */
export interface SystemGptCountyOverview {
  /** County code (e.g., "benton", "yakima", "franklin") */
  countyId: string;
  /** Display name (e.g., "Benton County") */
  countyName: string;
  /** Whether this county has full AI/RAG services configured */
  configured: boolean;
  /** Overall system health: "Healthy", "Degraded", "Unhealthy", or "Unknown" */
  health: string;
  /** Capacity risk level: "Low", "Medium", "High", or "Unknown" */
  capacityRisk: string;
  /** GPT latency P95 in milliseconds (-1 if unavailable) */
  p95LatencyMs: number;
  /** Error rate percentage (-1 if unavailable) */
  errorRatePercent: number;
  /** RAG readiness: "Ready", "Stale", "Partial", "Unindexed", or "Unknown" */
  ragStatus: string;
  /** SystemGPT operational mode: "Normal", "SafeMode", or "Unknown" */
  aiMode: string;
  /** Optional human-readable note */
  note?: string | null;
}

/** Phase 23: Federated overview response containing all counties */
export interface SystemGptFederatedOverviewResponse {
  /** Timestamp when this overview was generated */
  generatedAtUtc: string;
  /** Total number of counties in the federation */
  totalCounties: number;
  /** Number of fully configured counties */
  configuredCounties: number;
  /** Per-county overview list */
  counties: SystemGptCountyOverview[];
}

/**
 * Fetch federated overview of all counties' SystemGPT operational status.
 * Phase 23: Multi-County Dashboard - Aggregates all counties into a single view.
 * This endpoint returns data for ALL counties (no countyId parameter).
 */
export async function getSystemGptFederatedOverview(): Promise<SystemGptFederatedOverviewResponse> {
  const url = `${API_BASE_URL}/api/gpt/system/federated-overview`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Federated overview request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as SystemGptFederatedOverviewResponse;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 27: RAG FLEET READINESS & DRIFT DETECTION
// ═══════════════════════════════════════════════════════════════

/** Phase 27: Drift risk levels for cross-county RAG comparison */
export type RagFleetDriftRisk = 'Low' | 'Medium' | 'High';

/** Phase 27: Per-county RAG readiness snapshot for fleet comparison */
export interface RagCountyReadiness {
  /** County code (e.g., "benton", "yakima") */
  countyId: string;
  /** Display name (e.g., "Benton County") */
  countyName: string;
  /** Whether this county has RAG services configured */
  configured: boolean;
  /** RAG status: "Ready", "Stale", "Partial", "Unindexed", or "Unknown" */
  ragStatus: string;
  /** Number of documents in the RAG dataset */
  documentCount?: number | null;
  /** Number of embeddings/chunks */
  embeddingCount?: number | null;
  /** Last time the RAG index was updated */
  lastIndexedAtUtc?: string | null;
  /** Index age in hours */
  indexAgeHours?: number | null;
  /** Optional note about this county's RAG status */
  note?: string | null;
}

/** Phase 27: RAG Fleet Readiness response with cross-county drift detection */
export interface RagFleetReadiness {
  /** Timestamp when this readiness check was generated */
  generatedAtUtc: string;
  /** Fleet-wide drift risk level */
  fleetDriftRisk: RagFleetDriftRisk;
  /** Human-readable advisory explaining the drift status */
  advisory: string;
  /** Per-county RAG readiness data for comparison */
  counties: readonly RagCountyReadiness[];
  /** Total counties in the fleet */
  totalCounties: number;
  /** Number of counties with RAG configured */
  configuredCounties: number;
  /** Number of counties with RAG in "Ready" status */
  readyCounties: number;
  /** Drift conditions detected (for diagnostics) */
  driftConditions: readonly string[];
}

/**
 * Fetch RAG fleet readiness status across all configured counties.
 * Phase 27: Multi-County RAG Fleet Readiness - Detects cross-county drift.
 */
export async function fetchRagFleetReadiness(): Promise<RagFleetReadiness> {
  const url = `${API_BASE_URL}/api/gpt/system/fleet/rag-readiness`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`RAG fleet readiness request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as RagFleetReadiness;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 28: SYSTEMGPT ATLAS - MAP-BASED AI HEALTH VISUALIZATION
// ═══════════════════════════════════════════════════════════════

/** Phase 28: Single county node for the Atlas map visualization */
export interface SystemGptAtlasNode {
  /** County code (e.g., "benton", "yakima") */
  countyId: string;
  /** Display name (e.g., "Benton County") */
  countyName: string;
  /** Overall health status: "Healthy", "Degraded", "Unhealthy", or "Unknown" */
  health: SystemHealthStatus;
  /** Capacity risk: "Low", "Medium", "High", or "Overloaded" */
  capacityRisk: string;
  /** RAG status: "Ready", "Stale", "Partial", "Unindexed", or "Unknown" */
  ragStatus: string;
  /** Whether this county has GPT/RAG configured */
  configured: boolean;
  /** Fleet-wide drift risk detection from Phase 27 */
  fleetRagDriftRisk: RagFleetDriftRisk;
  /** Optional note about RAG fleet status */
  fleetRagNote?: string | null;
  /** Recent guardrail denial detected */
  recentGuardrailDeny: boolean;
  /** Recent safe mode recommendation */
  recentSafeModeRecommended: boolean;
  /** X coordinate on pseudo-map (0.0 to 1.0) */
  mapX: number;
  /** Y coordinate on pseudo-map (0.0 to 1.0) */
  mapY: number;
}

/** Phase 28: Atlas response with all county nodes for map visualization */
export interface SystemGptAtlasResponse {
  /** Timestamp when this Atlas snapshot was generated */
  generatedAtUtc: string;
  /** All county nodes for map rendering */
  nodes: readonly SystemGptAtlasNode[];
}

/**
 * Fetch SystemGPT Atlas with all county nodes for map-based visualization.
 * Phase 28: Map-Based AI Health Visualization.
 */
export async function fetchSystemGptAtlas(): Promise<SystemGptAtlasResponse> {
  const url = `${API_BASE_URL}/api/gpt/system/atlas`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`SystemGPT Atlas request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as SystemGptAtlasResponse;
}
