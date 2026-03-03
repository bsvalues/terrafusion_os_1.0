/**
 * TerraFusion OS Core Types
 *
 * Shared type definitions for TerraPilot, TerraTrace, and runtime enforcement.
 * These types mirror the manifest schema and CI gate contracts.
 *
 * Reference: tools/registry/terrapilot.tools.schema.json
 */
export type Suite = 'forge' | 'atlas' | 'dais' | 'dossier' | 'os' | 'pilot' | 'gpt';
export type Risk = 'read_only' | 'write_low' | 'write_high' | 'irreversible';
export type Mode = 'pilot' | 'muse';
export type TouchTarget = 'parcel' | 'dossier' | 'workflow' | 'notice' | 'trace' | 'model' | 'map';
export type PiiHandling = 'none' | 'sanitize' | 'payload_ref';
export type TracePolicy = 'none' | 'summary_only' | 'payload_ref';
export type PayloadStore = 'dossier' | 'secure-blob' | 'case-store';
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
}
export interface ToolManifest {
    $schema?: string;
    version: string;
    description?: string;
    lastUpdated?: string;
    tools: Tool[];
}
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
export type ToolExecutionResult<TResult = unknown> = ToolExecutionSuccess<TResult> | ToolExecutionFailure;
export type TraceEventType = 'tool_invoked' | 'tool_completed' | 'tool_failed' | 'value_changed' | 'status_changed' | 'document_generated' | 'approval_requested' | 'approval_granted' | 'approval_denied' | 'redaction_requested' | 'redaction_ticket_created';
export interface TraceEventInput {
    /** Event type */
    type: TraceEventType;
    /** Tool that generated this event */
    toolId: string;
    /** Correlation ID for invoke/result linkage */
    correlationId: string;
    /** Execution context */
    context: ToolExecutionContext;
    /** Sanitized summary (always present) */
    summary: string;
    /** Reference to secure payload storage (if tracePolicy is payload_ref) */
    payloadRef?: string;
    /** Payload store location */
    payloadStore?: PayloadStore;
    /** Fields that were redacted */
    redactedFields?: string[];
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
export declare class ToolEnforcementError extends Error {
    readonly code: string;
    readonly toolId: string;
    readonly gate: 'write_lane' | 'risk_policy' | 'pii_policy';
    constructor(message: string, code: string, toolId: string, gate: 'write_lane' | 'risk_policy' | 'pii_policy');
}
export declare class TraceEnforcementError extends Error {
    readonly code: string;
    readonly toolId: string;
    constructor(message: string, code: string, toolId: string);
}
