/**
 * ingestWorkspaceEvent – OS-level telemetry ingestion helper.
 *
 * Provides a clean way to ingest events from external sources
 * (WebSocket, SSE, REST, workers) into the activity pipeline.
 *
 * Domain-neutral – no parcel/property/levy semantics.
 */
import type { IncomingWorkspaceEvent } from './types';
import { getWorkspaceActivityProvider } from './WorkspaceActivityProvider';

/**
 * Ingest an external event into the workspace activity stream.
 *
 * Events flow through the same provider used by all UI components:
 * - OSHealthSummaryBar
 * - WorkspaceActivityFeed
 * - WorkspaceHealthTimelinePanel
 *
 * @param event - The incoming event to ingest
 * @returns Promise that resolves when the event is recorded
 *
 * @example
 * ```ts
 * await ingestWorkspaceEvent({
 *   workspaceId: 'home',
 *   summary: 'CPU usage high (85%)',
 *   type: 'warning',
 *   source: 'Telemetry',
 *   kind: 'health_update',
 * });
 * ```
 */
export async function ingestWorkspaceEvent(event: IncomingWorkspaceEvent): Promise<void> {
  const { workspaceId, summary, type, source, kind } = event;

  // Fail-closed but quietly: caller should validate before calling
  if (!workspaceId || !summary || !type) {
    return;
  }

  const provider = getWorkspaceActivityProvider();

  await provider.recordActivity(workspaceId, {
    summary,
    type,
    source,
    kind,
  });
}
