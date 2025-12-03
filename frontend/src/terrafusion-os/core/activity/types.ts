/**
 * OS-level activity types.
 * Domain-neutral – no parcel/property/levy semantics.
 */

export type WorkspaceActivityType = 'info' | 'warning' | 'incident';

/**
 * Filter options for the activity feed UI.
 */
export type WorkspaceActivityFilter = 'all' | 'warning' | 'incident';

/**
 * Categorize where events came from:
 * - user_action: User clicked/interacted with something
 * - system_event: OS/system reported something
 * - health_update: Status/health check result
 */
export type WorkspaceActivityKind = 'user_action' | 'system_event' | 'health_update';

export interface WorkspaceActivityItem {
  id: string;
  timestamp: string; // ISO8601
  summary: string;
  type: WorkspaceActivityType;
  source?: string; // e.g., "OS Core", "AI Swarm", "Telemetry"
  kind?: WorkspaceActivityKind;
}

/**
 * OS-wide activity item – wraps a WorkspaceActivityItem with its originating workspaceId.
 * Used by the SystemActivityWorkspace to display cross-workspace activity.
 */
export interface SystemWorkspaceActivityItem {
  workspaceId: string;
  item: WorkspaceActivityItem;
}

/**
 * Incoming event shape for external telemetry sources (WebSocket, SSE, REST, worker).
 * This is the "wire format" for pushing events into the OS activity stream.
 */
export interface IncomingWorkspaceEvent {
  workspaceId: string;
  summary: string;
  type: WorkspaceActivityType;
  source?: string;
  kind?: WorkspaceActivityKind;
  timestamp?: string; // Optional; defaults to now if missing
}
