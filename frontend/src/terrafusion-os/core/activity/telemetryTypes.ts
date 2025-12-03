/**
 * Telemetry event types – neutral wire format for external sources.
 *
 * This is the "dumb" event shape that any telemetry source can emit:
 * WebSocket, SSE, REST polling, AI swarm, background services, etc.
 *
 * Domain-neutral – no parcel/property/levy semantics.
 */

/**
 * Severity level for telemetry events.
 * Maps to WorkspaceActivityType via ingestWorkspaceTelemetry.
 */
export type WorkspaceTelemetrySeverity = 'info' | 'warning' | 'critical';

/**
 * Kind/category of telemetry event.
 * Maps to WorkspaceActivityKind via ingestWorkspaceTelemetry.
 */
export type WorkspaceTelemetryKind = 'health' | 'incident' | 'system' | 'user_action';

/**
 * Neutral telemetry event shape.
 *
 * This is the smallest useful event shape that any telemetry source can emit.
 * The ingestWorkspaceTelemetry function maps this to internal activity types.
 *
 * @example
 * ```ts
 * const event: WorkspaceTelemetryEvent = {
 *   workspaceId: 'home',
 *   severity: 'critical',
 *   kind: 'incident',
 *   message: 'Swarm degraded',
 *   source: 'SwarmMonitor',
 * };
 * ```
 */
export interface WorkspaceTelemetryEvent {
  /** Target workspace ID */
  workspaceId: string;

  /** Event severity – maps to activity type */
  severity: WorkspaceTelemetrySeverity;

  /** Event category – maps to activity kind */
  kind: WorkspaceTelemetryKind;

  /** Human-readable message – becomes activity summary */
  message: string;

  /** Optional source identifier (e.g. "OS Core", "TelemetryService") */
  source?: string;

  /** Optional ISO timestamp; defaults to now if not provided */
  occurredAt?: string;

  // metadata?: Record<string, unknown>; // safe extension later
}
