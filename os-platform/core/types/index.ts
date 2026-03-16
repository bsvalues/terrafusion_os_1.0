/**
 * TerraFusion OS Core Types
 *
 * Shared type definitions for TerraPilot, TerraTrace, and runtime enforcement.
 * These types mirror the manifest schema and CI gate contracts.
 *
 * Reference: tools/registry/terrapilot.tools.schema.json
 */

// ============================================================================
// Suite & Risk Enums (matches manifest schema)
// ============================================================================

export type Suite = 'forge' | 'atlas' | 'dais' | 'dossier' | 'os' | 'pilot' | 'gpt' | 'clerk' | 'treasury' | 'audit';

export type Risk = 'read_only' | 'write_low' | 'write_high' | 'irreversible';

export type Mode = 'pilot' | 'muse';

export type TouchTarget = 'parcel' | 'dossier' | 'workflow' | 'notice' | 'trace' | 'model' | 'map';

export type PiiHandling = 'none' | 'sanitize' | 'payload_ref';

export type TracePolicy = 'none' | 'summary_only' | 'payload_ref';

export type PayloadStore = 'dossier' | 'secure-blob' | 'case-store' | 'clerk' | 'treasury' | 'audit';

// ============================================================================
// Office Registry Types (R3.1)
// ============================================================================

export type OfficeId = 'assessor' | 'clerk' | 'treasurer' | 'auditor' | 'recorder';

export type OfficeStatus = 'active' | 'reserved' | 'planned';

export interface OfficeDefinition {
  /** Unique office identifier */
  id: OfficeId;
  /** Human-readable display name */
  displayName: string;
  /** Suite IDs mapped to this office */
  suiteIds: Suite[];
  /** Workbench tab IDs contributed by this office */
  tabIds: string[];
  /** Office activation status */
  status: OfficeStatus;
  /** Governed tools available to this office */
  toolAllowlist: string[];
}

export interface OfficeRegistry {
  /** All known offices */
  offices: OfficeDefinition[];
  /** Get office by ID */
  getOffice(id: OfficeId): OfficeDefinition | undefined;
  /** Get active offices */
  getActiveOffices(): OfficeDefinition[];
  /** Get tools allowed for an office */
  getToolsForOffice(id: OfficeId): string[];
}

// ============================================================================
// Tool Manifest Types
// ============================================================================

export interface Tool {
  toolId: string;
  displayName?: string;
  suite: Suite;
  mode?: Mode;
  risk: Risk;
  writeLane: Suite | null;
  touches?: TouchTarget[];
  description?: string;
  endpoints?: string[];
  uiSurfaces?: string[];
  requiresConfirmation?: boolean;
  reasonCodeRequired?: boolean;
  reasonCodes?: string[];
  requiresSupervisorApproval?: boolean;
  supervisorRoles?: string[];
  crossSuiteReads?: Suite[];
  piiHandling?: PiiHandling;
  tracePolicy?: TracePolicy;
  payloadStore?: PayloadStore;
  /** Office scope — which office owns this tool (R3.1) */
  officeScope?: OfficeId;
}

export interface ToolManifest {
  $schema?: string;
  version: string;
  description?: string;
  lastUpdated?: string;
  tools: Tool[];
}

// ============================================================================
// Tool Execution Types
// ============================================================================

export interface SupervisorApproval {
  approvedBy: string;
  approvedAt: string;
  role: string;
}

export interface ToolExecutionContext {
  /** County ID for isolation */
  countyId: string;
  /** Executing user ID */
  userId: string;
  /** User's roles for authorization */
  roles: string[];
  /** Pilot or Muse mode */
  mode: Mode;
  /** Target parcel ID (if applicable) */
  parcelId?: string;
  /** Target dossier ID (if applicable) */
  dossierId?: string;
  /** Active office context (R3.1) */
  officeId?: OfficeId;
  /** User confirmed the action */
  confirmation?: boolean;
  /** Reason code for audit trail */
  reasonCode?: string;
  /** Supervisor approval for irreversible actions */
  supervisorApproval?: SupervisorApproval;
}

export interface ToolExecutionInput<TParams = unknown> {
  toolId: string;
  params: TParams;
  context: ToolExecutionContext;
}

export interface ToolExecutionSuccess<TResult = unknown> {
  ok: true;
  result: TResult;
  correlationId: string;
  traceEventId?: string;
}

export interface ToolExecutionFailure {
  ok: false;
  error: string;
  errorCode: string;
  correlationId: string;
  traceEventId?: string;
}

export type ToolExecutionResult<TResult = unknown> =
  | ToolExecutionSuccess<TResult>
  | ToolExecutionFailure;

// ============================================================================
// Trace Event Types
// ============================================================================

export type TraceEventType =
  | 'tool_invoked'
  | 'tool_completed'
  | 'tool_failed'
  | 'value_changed'
  | 'status_changed'
  | 'document_generated'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_denied'
  | 'redaction_requested'
  | 'redaction_ticket_created'
  | 'trace_accessed'
  | 'permission_denied';

export interface TraceEventInput {
  /** Event type */
  type: TraceEventType;
  /** Tool that generated this event */
  toolId: string;
  /** Correlation ID for invoke/result linkage */
  correlationId: string;
  /** Execution context */
  context: ToolExecutionContext;
  /** Office that generated this event (R3.1) */
  officeId?: OfficeId;
  /** Sanitized summary (always present) */
  summary: string;
  /** Reference to secure payload storage (if tracePolicy is payload_ref) */
  payloadRef?: string;
  /** Payload store location */
  payloadStore?: PayloadStore;
  /** Fields that were redacted */
  redactedFields?: string[];
  /** Error code for tool_failed events */
  errorCode?: string;
  /** Component that emitted the event (ToolRunner, ToolRegistry, Handler) */
  component?: string;
  /** Stack trace for handler errors (tool_failed events only) */
  stackTrace?: string;
}

export interface TraceEvent extends TraceEventInput {
  /** Unique event ID */
  eventId: string;
  /** Timestamp of event creation */
  timestamp: string;
  /** Schema version for forward compatibility */
  schemaVersion: string;
}

export interface TraceQueryOptions {
  parcelId?: string;
  dossierId?: string;
  toolId?: string;
  correlationId?: string;
  type?: TraceEventType;
  /** ISO 8601 lower bound (inclusive). Events with timestamp >= from. */
  from?: string;
  /** ISO 8601 upper bound (inclusive). Events with timestamp <= to. */
  to?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Enforcement Error Types
// ============================================================================

export class ToolEnforcementError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly toolId: string,
    public readonly gate: 'write_lane' | 'risk_policy' | 'pii_policy'
  ) {
    super(message);
    this.name = 'ToolEnforcementError';
  }
}

export class TraceEnforcementError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly toolId: string
  ) {
    super(message);
    this.name = 'TraceEnforcementError';
  }
}

// ============================================================================
// Shell Lifecycle Event Types (Lane B: OS Shell Window System)
// ============================================================================

export type ShellEventType =
  | 'window_opened'
  | 'window_closed'
  | 'window_focused'
  | 'window_minimized'
  | 'window_restored'
  | 'window_maximized'
  | 'window_snapped'
  | 'shell_mode_changed'
  | 'spawn_rejected'
  | 'spawn_routed_to_workbench';

export interface ShellEvent {
  /** Event type */
  type: ShellEventType;
  /** Window ID (null for shell-level events) */
  windowId: string | null;
  /** Module that owns the window */
  moduleId: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Additional context */
  detail?: Record<string, unknown>;
}
