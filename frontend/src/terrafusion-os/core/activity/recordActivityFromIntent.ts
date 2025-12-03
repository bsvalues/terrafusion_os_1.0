/**
 * recordActivityFromIntent – bridge from OmniIntent pipeline to activity logging.
 *
 * Maps intent types to WorkspaceActivityItem entries and records them
 * via the active WorkspaceActivityProvider.
 */
import type { WorkspaceActivityItem, WorkspaceActivityKind, WorkspaceActivityType } from './types';
import { getWorkspaceActivityProvider } from './WorkspaceActivityProvider';

/**
 * Intent payload shape from OmniIntentContext.
 * Mirrors the intent types from the context.
 */
export interface IntentPayload {
  type: string;
  objectType?: string;
  objectId?: string;
  workspaceId?: string;
  value?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Mapping from intent type to activity kind.
 */
const INTENT_TO_KIND: Record<string, WorkspaceActivityKind> = {
  object_selected: 'user_action',
  workspace_status_selected: 'health_update',
  workspace_status_changed: 'health_update',
  workspace_activity_selected: 'user_action',
  workspace_command_invoked: 'user_action',
  terra_command: 'user_action',
  navigate: 'user_action',
  search: 'user_action',
  filter: 'user_action',
  health_check: 'health_update',
  system_init: 'system_event',
  system_shutdown: 'system_event',
};

/**
 * Mapping from intent type to activity type.
 */
const INTENT_TO_TYPE: Record<string, WorkspaceActivityType> = {
  object_selected: 'info',
  workspace_status_selected: 'info',
  workspace_status_changed: 'info', // Overridden dynamically based on currentStatus
  workspace_activity_selected: 'info',
  workspace_command_invoked: 'info',
  terra_command: 'info',
  navigate: 'info',
  search: 'info',
  filter: 'info',
  health_check: 'info',
  system_init: 'info',
  system_shutdown: 'warning',
};

/**
 * Generate a human-readable summary for an intent.
 */
const summarizeIntent = (intent: IntentPayload): string => {
  switch (intent.type) {
    case 'object_selected':
      return `Selected ${intent.objectType ?? 'object'}: ${intent.objectId ?? 'unknown'}`;

    case 'workspace_status_selected':
      return `Viewed workspace status`;

    case 'workspace_status_changed': {
      const prev = intent.metadata?.previousStatus as string | undefined;
      const curr = intent.metadata?.currentStatus as string | undefined;
      if (prev && curr) {
        return `Status changed: ${prev} → ${curr}`;
      }
      return `Status changed to ${curr ?? 'unknown'}`;
    }

    case 'workspace_activity_selected':
      return `Viewed activity details`;

    case 'workspace_command_invoked': {
      const label = intent.metadata?.label as string | undefined;
      const cmdId = intent.metadata?.commandId as string | undefined;
      return `Command invoked: ${label ?? cmdId ?? 'unknown'}`;
    }

    case 'terra_command':
      return `TerraCommand: ${intent.value ?? 'executed'}`;

    case 'navigate':
      return `Navigated to ${intent.objectId ?? intent.value ?? 'location'}`;

    case 'search':
      return `Searched: ${intent.value ?? 'query'}`;

    case 'filter':
      return `Applied filter: ${intent.value ?? 'criteria'}`;

    case 'health_check':
      return `Health check triggered`;

    case 'system_init':
      return `System initialized`;

    case 'system_shutdown':
      return `System shutdown initiated`;

    default:
      return `Intent: ${intent.type}`;
  }
};

/**
 * Record an activity entry from an intent payload.
 *
 * @param workspaceId - The workspace to record activity for
 * @param intent - The intent payload to convert
 * @returns Promise that resolves when activity is recorded
 */
/**
 * Determine activity type dynamically for status changes.
 */
const getActivityType = (intent: IntentPayload): WorkspaceActivityType => {
  if (intent.type === 'workspace_status_changed') {
    const currentStatus = intent.metadata?.currentStatus as string | undefined;
    if (currentStatus === 'critical') return 'incident';
    if (currentStatus === 'warning') return 'warning';
    return 'info';
  }
  return INTENT_TO_TYPE[intent.type] ?? 'info';
};

/**
 * Record an activity entry from an intent payload.
 *
 * @param workspaceId - The workspace to record activity for
 * @param intent - The intent payload to convert
 * @returns Promise that resolves when activity is recorded
 */
export const recordActivityFromIntent = async (
  workspaceId: string,
  intent: IntentPayload
): Promise<void> => {
  const provider = getWorkspaceActivityProvider();

  const entry: Omit<WorkspaceActivityItem, 'id' | 'timestamp'> = {
    summary: summarizeIntent(intent),
    type: getActivityType(intent),
    kind: INTENT_TO_KIND[intent.type] ?? 'user_action',
    source:
      intent.type === 'workspace_status_changed'
        ? 'WorkspaceStatusChip'
        : intent.type === 'workspace_command_invoked'
          ? 'WorkspaceCommandPalette'
          : 'OmniIntent',
  };

  await provider.recordActivity(workspaceId, entry);
};

/**
 * Convenience wrapper for recording activity with explicit workspace context.
 * Use when the workspace ID is available from context.
 */
export const recordWorkspaceActivityFromIntent = async (
  getWorkspaceId: () => string | null | undefined,
  intent: IntentPayload
): Promise<void> => {
  const workspaceId = getWorkspaceId();
  if (!workspaceId) {
    console.warn('[recordActivityFromIntent] No workspace context, skipping activity log');
    return;
  }
  await recordActivityFromIntent(workspaceId, intent);
};
