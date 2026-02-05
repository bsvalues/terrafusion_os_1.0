/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION PILOT API CLIENT
 * Phase 5: GovernanceLock - Single Choke Point Integration
 *
 * All tool invocations MUST go through POST /pilot/invoke.
 * This client enforces the single execution path from the UI.
 *
 * Phase 1 Day 2: Added error normalization helpers to populate
 * correlationId into ErrorInfo for consistent UI display.
 *
 * NOTE: This is the Pilot subsystem (port 5000) - intentionally
 * NOT using centralized apiBase.ts because Pilot has its own
 * URL resolution pattern. Do NOT migrate to buildApiUrl().
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { ErrorInfo } from '../hooks/useErrorHandler';
import { getViteEnv } from '../shared/viteEnv';

// Pilot API Base URL (Pilot subsystem, port 5000 - NOT TerraFusion core telemetry API)
const env = getViteEnv();
const API_BASE_URL = env.VITE_API_URL || 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS (mirrors os-platform/core/types)
// ═══════════════════════════════════════════════════════════════

export type Suite = 'forge' | 'atlas' | 'dais' | 'dossier' | 'os' | 'pilot' | 'gpt';
export type Risk = 'read_only' | 'write_low' | 'write_high' | 'irreversible';
export type Mode = 'pilot' | 'muse';
export type PiiHandling = 'none' | 'sanitize' | 'payload_ref';
export type TracePolicy = 'none' | 'summary_only' | 'payload_ref';

/** Tool definition from the manifest */
export interface PilotTool {
  toolId: string;
  displayName?: string;
  suite: Suite;
  mode?: Mode;
  risk: Risk;
  description?: string;
  requiresConfirmation?: boolean;
  reasonCodes?: string[];
  requiresSupervisorApproval?: boolean;
  supervisorRoles?: string[];
}

/** Full tool definition with all fields */
export interface PilotToolFull extends PilotTool {
  writeLane: Suite | null;
  touches?: string[];
  endpoints?: string[];
  uiSurfaces?: string[];
  reasonCodeRequired?: boolean;
  requiresSupervisorApproval?: boolean;
  supervisorRoles?: string[];
  crossSuiteReads?: Suite[];
  piiHandling?: PiiHandling;
  tracePolicy?: TracePolicy;
  payloadStore?: string;
}

/** Tool list response */
export interface PilotToolListResponse {
  count: number;
  tools: PilotTool[];
}

/** Request to invoke a tool */
export interface PilotInvokeRequest {
  toolId: string;
  params: Record<string, unknown>;
  mode?: Mode;
  parcelId?: string;
  dossierId?: string;
  confirmation?: boolean;
  reasonCode?: string;
  supervisorApproval?: {
    approvedBy: string;
    role: string;
  };
  /** Phase 4: Approval token for irreversible tools */
  approvalToken?: string;
}

// ═══════════════════════════════════════════════════════════════
// APPROVAL TOKEN TYPES (Phase 4: Solo Override)
// ═══════════════════════════════════════════════════════════════

/**
 * Approval Token - Required for irreversible tool execution.
 * Short-lived, request-scoped, and auditable.
 */
export interface ApprovalToken {
  /** Unique token identifier */
  tokenId: string;
  /** Tool this token authorizes */
  toolId: string;
  /** Hash of the request parameters (for scope verification) */
  requestHash: string;
  /** Token issuance timestamp */
  issuedAt: string;
  /** Token expiration timestamp (short TTL, typically 60-180s) */
  expiresAt: string;
  /** Principal who issued the token */
  issuedBy: string;
  /** Reason code for the action */
  reasonCode: string;
  /** Optional reason text */
  reasonText?: string;
}

/** Request to generate an approval token */
export interface ApprovalTokenRequest {
  toolId: string;
  params: Record<string, unknown>;
  reasonCode: string;
  reasonText?: string;
}

/** Response from approval token request */
export interface ApprovalTokenResponse {
  success: boolean;
  token?: ApprovalToken;
  error?: string;
  correlationId: string;
}

/** Response from tool invocation */
export interface PilotInvokeResponse {
  ok: boolean;
  correlationId: string;
  result?: unknown;
  error?: string;
  errorCode?: string;
  traceEventId?: string;
}

/** Request to validate a tool invocation */
export interface PilotValidateRequest {
  toolId: string;
  params?: Record<string, unknown>;
  mode?: Mode;
  confirmation?: boolean;
  reasonCode?: string;
}

/** Response from tool validation */
export interface PilotValidateResponse {
  valid: boolean;
  violations: string[];
  tool?: {
    toolId: string;
    suite: string;
    risk: string;
    requiresConfirmation?: boolean;
    reasonCodes?: string[];
    requiresSupervisorApproval?: boolean;
    supervisorRoles?: string[];
  };
  /** Preflight checklist - which safeguards are satisfied */
  preflight?: {
    confirmationRequired: boolean;
    confirmationProvided: boolean;
    reasonCodeRequired: boolean;
    reasonCodeProvided: boolean;
    supervisorRequired: boolean;
    supervisorProvided: boolean;
  };
}

/** Trace event from the trace log */
export interface PilotTraceEvent {
  eventId: string;
  type: string;
  toolId: string;
  correlationId: string;
  summary: string;
  timestamp: string;
  context: {
    countyId: string;
    userId: string;
    mode: Mode;
    parcelId?: string;
    dossierId?: string;
  };
  payloadRef?: string;
  redactedFields?: string[];
}

/** Trace query response */
export interface PilotTraceResponse {
  events: PilotTraceEvent[];
}

/** Health check response */
export interface PilotHealthResponse {
  status: string;
  service: string;
  registryVersion: string;
  toolCount: number;
  traceEventCount: number;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * List available tools.
 * @param mode - Optional filter by mode (pilot or muse)
 */
export async function listPilotTools(mode?: Mode): Promise<PilotToolListResponse> {
  const params = new URLSearchParams();
  if (mode) {
    params.set('mode', mode);
  }
  const queryString = params.toString();
  const url = `${API_BASE_URL}/pilot/tools${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to list tools (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PilotToolListResponse;
}

/**
 * Get a specific tool definition.
 * @param toolId - The tool ID to retrieve
 */
export async function getPilotTool(toolId: string): Promise<PilotToolFull> {
  const url = `${API_BASE_URL}/pilot/tools/${encodeURIComponent(toolId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Tool not found: ${toolId}`);
    }
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to get tool (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PilotToolFull;
}

/**
 * Invoke a tool through the single choke point.
 * This is THE ONLY way to execute tools from the UI.
 *
 * @param request - Tool invocation request
 */
export async function invokePilotTool(request: PilotInvokeRequest): Promise<PilotInvokeResponse> {
  const url = `${API_BASE_URL}/pilot/invoke`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  // Always parse JSON response even for errors
  const data = (await response.json()) as PilotInvokeResponse;

  // Return the response directly - it contains ok: true/false
  return data;
}

/**
 * Invoke a tool with normalized response format (Phase 2).
 * Wrapper around invokePilotTool that provides a simplified success/error interface.
 *
 * @param request - Tool invocation request
 * @returns Normalized response with success flag and correlationId
 */
export async function invokeTool(request: PilotInvokeRequest): Promise<{
  success: boolean;
  correlationId: string;
  result?: {
    toolId: string;
    output: string;
  };
  error?: {
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}> {
  const response = await invokePilotTool(request);

  if (response.ok && response.result) {
    return {
      success: true,
      correlationId: response.correlationId,
      result: {
        toolId: request.toolId,
        output:
          typeof response.result === 'string' ? response.result : JSON.stringify(response.result),
      },
    };
  } else {
    return {
      success: false,
      correlationId: response.correlationId,
      error: {
        code: response.errorCode || 'UNKNOWN_ERROR',
        message: response.error || 'Tool invocation failed',
        severity: getSeverityFromErrorCode(response.errorCode),
      },
    };
  }
}

/**
 * Validate a tool invocation without executing.
 * Use for pre-flight checks before showing confirmation dialogs.
 *
 * @param request - Validation request
 */
export async function validatePilotTool(
  request: PilotValidateRequest
): Promise<PilotValidateResponse> {
  const url = `${API_BASE_URL}/pilot/validate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Validation failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PilotValidateResponse;
}

/**
 * Get trace events for a correlation ID.
 * Use to show the audit trail for a tool invocation.
 *
 * @param correlationId - The correlation ID from invokePilotTool response
 */
export async function getPilotTrace(correlationId: string): Promise<PilotTraceResponse> {
  const url = `${API_BASE_URL}/pilot/trace/${encodeURIComponent(correlationId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to get trace (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PilotTraceResponse;
}

/**
 * Check Pilot service health.
 */
export async function getPilotHealth(): Promise<PilotHealthResponse> {
  const url = `${API_BASE_URL}/pilot/health`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Pilot service unhealthy (${response.status})`);
  }

  return (await response.json()) as PilotHealthResponse;
}

/**
 * Request an approval token for irreversible tool execution.
 * Phase 4: Solo Override - high-friction intent verification.
 *
 * @param request - Approval token request with tool details and reason
 * @returns Approval token response with short-lived token or error
 */
export async function requestApprovalToken(
  request: ApprovalTokenRequest
): Promise<ApprovalTokenResponse> {
  const url = `${API_BASE_URL}/pilot/approval/token`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  // Always parse JSON response even for errors
  const data = (await response.json()) as ApprovalTokenResponse;
  return data;
}

// ═══════════════════════════════════════════════════════════════
// RISK LEVEL HELPERS
// ═══════════════════════════════════════════════════════════════

/** Get risk level color for UI display */
export function getRiskColor(risk: Risk): string {
  switch (risk) {
    case 'read_only':
      return 'text-green-500';
    case 'write_low':
      return 'text-blue-500';
    case 'write_high':
      return 'text-orange-500';
    case 'irreversible':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/** Get risk level badge color for UI display */
export function getRiskBadgeColor(risk: Risk): string {
  switch (risk) {
    case 'read_only':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'write_low':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'write_high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'irreversible':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/** Get suite badge color for UI display */
export function getSuiteBadgeColor(suite: Suite): string {
  switch (suite) {
    case 'forge':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'atlas':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'dais':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'dossier':
      return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    case 'os':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case 'pilot':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'gpt':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

// ═══════════════════════════════════════════════════════════════
// ERROR NORMALIZATION (Phase 1 Day 2)
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize PilotInvokeResponse error into ErrorInfo
 *
 * Ensures correlationId flows from backend → UI consistently.
 * Used by error handlers to populate ErrorProvider.
 */
export function normalizePilotError(
  response: PilotInvokeResponse,
  context?: Record<string, unknown>
): ErrorInfo {
  return {
    message: response.error || 'Tool invocation failed',
    timestamp: new Date().toISOString(),
    errorId: `pilot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    correlationId: response.correlationId, // ⭐ Key: Flow correlationId to UI
    context: {
      errorCode: response.errorCode,
      component: 'PilotAPI',
      severity: getSeverityFromErrorCode(response.errorCode),
      traceEventId: response.traceEventId,
      ...context,
    },
  };
}

/**
 * Normalize fetch/network errors into ErrorInfo
 *
 * Generates correlationId for client-side errors (network failures, etc.)
 */
export function normalizeNetworkError(error: Error, context?: Record<string, unknown>): ErrorInfo {
  const correlationId = `net-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    message: error.message || 'Network request failed',
    stack: error.stack,
    timestamp: new Date().toISOString(),
    errorId: `network-${Date.now()}`,
    correlationId,
    context: {
      errorCode: 'NETWORK_ERROR',
      component: 'PilotAPI',
      severity: 'high',
      ...context,
    },
  };
}

/**
 * Determine error severity from errorCode
 */
function getSeverityFromErrorCode(errorCode?: string): 'low' | 'medium' | 'high' | 'critical' {
  if (!errorCode) return 'medium';

  // Critical errors
  if (errorCode === 'EXECUTION_FAILED' || errorCode === 'HANDLER_ERROR') {
    return 'critical';
  }

  // High-risk policy violations
  if (
    errorCode === 'WRITE_LANE_MISMATCH' ||
    errorCode === 'SUPERVISOR_APPROVAL_REQUIRED' ||
    errorCode === 'REJECTED_PII'
  ) {
    return 'high';
  }

  // Medium validation errors
  if (
    errorCode === 'CONFIRMATION_REQUIRED' ||
    errorCode === 'REASON_CODE_REQUIRED' ||
    errorCode === 'REJECTED_MISSING_EVIDENCE'
  ) {
    return 'medium';
  }

  return 'low';
}
