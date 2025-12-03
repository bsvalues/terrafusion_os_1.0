/**
 * ingestTelemetry – Telemetry → Activity mapper (single entry point).
 *
 * Maps neutral WorkspaceTelemetryEvent to internal activity types
 * and feeds into WorkspaceActivityProvider.
 *
 * This is the ONE neutral function that any telemetry source can call.
 * Under the hood, it just uses the existing recordActivity.
 *
 * No UI changes. No catalog changes. No intent changes.
 *
 * Domain-neutral – no parcel/property/levy semantics.
 */
import { getWorkspaceActivityProvider } from './WorkspaceActivityProvider';
import type { WorkspaceTelemetryEvent, WorkspaceTelemetryKind } from './telemetryTypes';
import type { WorkspaceActivityKind, WorkspaceActivityType } from './types';

/**
 * Map telemetry severity to internal activity type.
 */
function mapSeverityToType(severity: WorkspaceTelemetryEvent['severity']): WorkspaceActivityType {
  switch (severity) {
    case 'critical':
      return 'incident';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'info';
  }
}

/**
 * Map telemetry kind to internal activity kind.
 */
function mapTelemetryKindToActivityKind(kind: WorkspaceTelemetryKind): WorkspaceActivityKind {
  switch (kind) {
    case 'health':
    case 'incident':
      return 'health_update';
    case 'user_action':
      return 'user_action';
    case 'system':
    default:
      return 'system_event';
  }
}

/**
 * Ingest a telemetry event into the workspace activity stream.
 *
 * This is the single entry point for all external telemetry sources:
 * - WebSocket streams
 * - SSE connections
 * - REST polling
 * - AI swarm metrics
 * - Background services
 *
 * Events flow through the same provider used by all UI components:
 * - OSHealthSummaryBar
 * - WorkspaceActivityFeed
 * - WorkspaceHealthTimelinePanel
 *
 * @param event - The telemetry event to ingest
 * @returns Promise that resolves when the event is recorded
 *
 * @example
 * ```ts
 * await ingestWorkspaceTelemetry({
 *   workspaceId: 'home',
 *   severity: 'critical',
 *   kind: 'incident',
 *   message: 'Swarm degraded',
 *   source: 'SwarmMonitor',
 * });
 * ```
 */
export async function ingestWorkspaceTelemetry(event: WorkspaceTelemetryEvent): Promise<void> {
  const provider = getWorkspaceActivityProvider();

  const type = mapSeverityToType(event.severity);
  const kind = mapTelemetryKindToActivityKind(event.kind);

  // Note: occurredAt is captured but the provider generates its own timestamp
  // for consistency. This could be enhanced later if historical replay is needed.

  await provider.recordActivity(event.workspaceId, {
    summary: event.message,
    type,
    source: event.source ?? 'Telemetry',
    kind,
    // metadata: event.metadata, // if/when you add it
  });
}
