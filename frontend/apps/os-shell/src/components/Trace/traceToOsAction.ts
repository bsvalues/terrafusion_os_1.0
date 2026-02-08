/**
 * TerraFusion Trace-to-Action Mapper
 *
 * Converts action stream trace events into executable OS actions,
 * enabling "Jump to Surface" functionality from TerraTrace.
 *
 * Handles:
 * - Workbench navigation (with or without tabId)
 * - Standalone suite navigation
 * - Blocked traces (disabled/policy denials)
 * - PII privacy (no raw parcelId exposure)
 *
 * @module components/Trace/traceToOsAction
 * @see Slice 22: Trace-to-UI Correlation + Deep Link Replay
 */

import type { ActionStreamEvent } from '../../hooks/useActionStream';
import type { OsAction } from '../../services/osActions';

/**
 * Convert a trace event to a navigable OS action
 *
 * Returns null if the event is not navigable (e.g., handler-only actions,
 * system-level handlers, or events without href).
 *
 * @param event - The trace event to convert
 * @returns OsAction for navigation, or null if not navigable
 */
export function traceToOsAction(event: ActionStreamEvent): OsAction | null {
  // Only navigation actions with href are navigable
  if (event.actionType !== 'navigation' || !event.href) {
    return null;
  }

  // Build the action
  const actionId = generateJumpActionId(event);
  const label = generateJumpLabel(event);
  const description = generateJumpDescription(event);

  const action: OsAction = {
    id: actionId,
    label,
    description,
    intent: event.intent as 'standalone' | 'workbench' | 'system',
    href: event.href,
  };

  // Preserve disabled state for blocked traces
  if (event.type === 'blocked') {
    action.disabled = true;
    action.disabledReason = generateBlockedReason(event);
  }

  return action;
}

/**
 * Generate a unique action ID for Jump actions
 */
function generateJumpActionId(event: ActionStreamEvent): string {
  if (event.intent === 'workbench') {
    if (event.tabId) {
      return `jump-workbench-${event.tabId}`;
    }
    return `jump-workbench-${event.suiteId}`;
  }

  if (event.intent === 'standalone') {
    return `jump-standalone-${event.suiteId}`;
  }

  return `jump-${event.actionId}`;
}

/**
 * Generate a user-facing label for Jump actions
 * PII-safe: does not expose parcelIdHash or raw parcel IDs
 */
function generateJumpLabel(event: ActionStreamEvent): string {
  if (event.intent === 'workbench') {
    if (event.tabId) {
      const tabName = event.tabId.charAt(0).toUpperCase() + event.tabId.slice(1);
      return `Open Workbench: ${tabName}`;
    }
    return 'Open Workbench';
  }

  if (event.intent === 'standalone') {
    const suiteName = event.suiteId.charAt(0).toUpperCase() + event.suiteId.slice(1);
    return `Open Suite Home: ${suiteName}`;
  }

  return 'Jump to Surface';
}

/**
 * Generate a description for Jump actions
 * PII-safe: uses surface and intent, not parcel identifiers
 */
function generateJumpDescription(event: ActionStreamEvent): string {
  const surfaceName = event.surface.charAt(0).toUpperCase() + event.surface.slice(1);

  if (event.type === 'blocked') {
    return `Navigate to ${surfaceName} (previously blocked)`;
  }

  return `Navigate from trace to ${surfaceName}`;
}

/**
 * Generate disabled reason for blocked traces
 */
function generateBlockedReason(event: ActionStreamEvent): string {
  if (event.blockReason === 'disabled' && event.blockReasonDetail) {
    return event.blockReasonDetail;
  }

  if (event.blockReason === 'policy' && event.blockReasonDetail) {
    return `Blocked by policy: ${event.blockReasonDetail}`;
  }

  return 'Action was blocked';
}
