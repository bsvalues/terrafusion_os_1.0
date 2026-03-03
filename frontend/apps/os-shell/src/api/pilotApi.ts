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

import { getSession } from '../auth/session';
import { ErrorInfo } from '../hooks/useErrorHandler';
import { getViteEnv } from '../shared/viteEnv';

// Pilot API Base URL (Pilot subsystem, port 5000 - NOT TerraFusion core telemetry API)
const env = getViteEnv();
const API_BASE_URL = env.VITE_API_URL || 'http://localhost:5000';

/**
 * Build standard Pilot API headers including identity from current session.
 * Injects x-user-id and x-county-id when a session exists.
 */
function buildPilotHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const session = getSession();
  if (session) {
    headers['x-user-id'] = session.userId;
    headers['x-county-id'] = session.countyId;
    if (session.role) headers['x-role'] = session.role;
    if (session.mode) headers['x-mode'] = session.mode;
  }
  return headers;
}

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

/** Nested confirmation payload (preferred form) */
export interface ConfirmationPayload {
  confirmed: boolean;
  reasonCode?: string;
  supervisorApproval?: { approvedBy: string; role: string };
}

/** Request to invoke a tool */
export interface PilotInvokeRequest {
  toolId: string;
  params: Record<string, unknown>;
  mode?: Mode;
  parcelId?: string;
  dossierId?: string;
  /**
   * Confirmation gate payload.
   * - `boolean`: legacy flat form (backward compat for PilotConsole callers)
   * - `ConfirmationPayload`: nested form (preferred, used by useToolInvocation)
   * invokePilotTool normalizes both to the flat wire format per INVOKE_CONTRACT.
   */
  confirmation?: boolean | ConfirmationPayload;
  /** @deprecated Use confirmation.reasonCode instead */
  reasonCode?: string;
  /** @deprecated Use confirmation.supervisorApproval instead */
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

/** Trace list query params */
export interface PilotTraceListParams {
  parcelId: string;
  toolId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/** Trace list response (with pagination metadata) */
export interface PilotTraceListResponse {
  events: PilotTraceEvent[];
  pagination: {
    offset: number;
    limit: number;
    returned: number;
  };
}

/** Trace-store diagnostics response (global, elevated-role only). */
export interface PilotTraceStatsResponse {
  totalEvents: number;
  oldestTimestamp: string | null;
  newestTimestamp: string | null;
  perParcelCap?: number;
  cappedParcelsCount?: number;
  maxEventsInParcel?: number;
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
    headers: buildPilotHeaders(),
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
    headers: buildPilotHeaders(),
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

  // Normalize confirmation to flat wire format (INVOKE_CONTRACT.md)
  const { confirmation, reasonCode, supervisorApproval, ...rest } = request;
  let wireBody: Record<string, unknown> = { ...rest };

  if (typeof confirmation === 'object' && confirmation !== null) {
    // Nested form → flatten
    wireBody.confirmation = confirmation.confirmed;
    if (confirmation.reasonCode) wireBody.reasonCode = confirmation.reasonCode;
    if (confirmation.supervisorApproval) wireBody.supervisorApproval = confirmation.supervisorApproval;
  } else {
    // Legacy flat form (boolean or undefined)
    if (confirmation !== undefined) wireBody.confirmation = confirmation;
    if (reasonCode) wireBody.reasonCode = reasonCode;
    if (supervisorApproval) wireBody.supervisorApproval = supervisorApproval;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: buildPilotHeaders(),
    body: JSON.stringify(wireBody),
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
    headers: buildPilotHeaders(),
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
    headers: buildPilotHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to get trace (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PilotTraceResponse;
}

/**
 * List trace events with parcel-scoped filtering and date range.
 * Newest-first ordering with offset/limit pagination.
 *
 * @param params - Query parameters (parcelId required, rest optional)
 */
export async function listPilotTraces(params: PilotTraceListParams): Promise<PilotTraceListResponse> {
  const qs = new URLSearchParams();
  qs.set('parcelId', params.parcelId);
  if (params.toolId) qs.set('toolId', params.toolId);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));

  const url = `${API_BASE_URL}/pilot/traces?${qs.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildPilotHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to list traces (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PilotTraceListResponse;
}

/** Parameters for trace export (NDJSON download). */
export interface TraceExportParams {
  parcelId: string;
  correlationId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

/** Error shape returned by the export endpoint on 4xx/5xx. */
export interface TraceExportError {
  error: string;
  correlationId?: string;
}

/**
 * Export trace events as an NDJSON blob (admin/elevated only).
 * Hits GET /pilot/traces/export with query parameters.
 *
 * @returns NDJSON Blob on success; throws with correlationId on failure.
 */
export async function exportTraces(params: TraceExportParams): Promise<Blob> {
  const qs = new URLSearchParams();
  qs.set('parcelId', params.parcelId);
  qs.set('format', 'ndjson');
  if (params.correlationId) qs.set('correlationId', params.correlationId);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));

  const url = `${API_BASE_URL}/pilot/traces/export?${qs.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildPilotHeaders(),
  });

  if (!response.ok) {
    let errBody: TraceExportError | undefined;
    try {
      errBody = (await response.json()) as TraceExportError;
    } catch {
      // non-JSON error body
    }
    const msg = errBody?.error ?? `Export failed (${response.status})`;
    const err = new Error(msg) as Error & { correlationId?: string; status?: number };
    err.correlationId = errBody?.correlationId;
    err.status = response.status;
    throw err;
  }

  return response.blob();
}

/**
 * Get global trace-store diagnostics.
 * Requires elevated trace role (enforced server-side).
 */
export async function getTraceStats(): Promise<PilotTraceStatsResponse> {
  const url = `${API_BASE_URL}/pilot/traces/stats`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildPilotHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to get trace stats (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PilotTraceStatsResponse;
}

/**
 * Check Pilot service health.
 */
export async function getPilotHealth(): Promise<PilotHealthResponse> {
  const url = `${API_BASE_URL}/pilot/health`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildPilotHeaders(),
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
    headers: buildPilotHeaders(),
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
