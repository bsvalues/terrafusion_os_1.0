/**
 * ActivityMapping.example.ts
 *
 * TEMPLATE: Shows how to map a new intent to an activity entry.
 * Copy the relevant patterns into core/activity/intentActivityBridge.ts.
 *
 * @see docs/os-workspace-spine-spec.md (Section 4)
 */

import type { WorkspaceActivityKind, WorkspaceActivityType } from '../core/activity/types';

// ═══════════════════════════════════════════════════════════════════
// INTERFACE: Intent shape (mirrors OmniIntentContext)
// ═══════════════════════════════════════════════════════════════════

interface OmniIntent {
  type: string;
  payload: any;
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE: Activity mapping function
// ═══════════════════════════════════════════════════════════════════

/**
 * Maps an intent to a workspace activity entry.
 *
 * This is the bridge between the intent spine and the activity provider.
 * Add new cases here when you create new intents.
 */
export async function recordWorkspaceActivityFromIntent(intent: OmniIntent): Promise<void> {
  // Get the activity provider (singleton)
  const { getWorkspaceActivityProvider } = await import(
    '../core/activity/WorkspaceActivityProvider'
  );
  const provider = getWorkspaceActivityProvider();

  switch (intent.type) {
    // ─────────────────────────────────────────────────────────────
    // Example: my_new_intent
    // ─────────────────────────────────────────────────────────────
    case 'my_new_intent': {
      const { workspaceId, someParam } = intent.payload ?? {};

      // Guard: skip if no workspace context
      if (!workspaceId) return;

      // Define activity type and kind
      const type: WorkspaceActivityType = 'info';
      const kind: WorkspaceActivityKind = 'user_action';

      await provider.recordActivity(workspaceId, {
        summary: `My new intent was triggered${someParam ? `: ${someParam}` : ''}`,
        type,
        source: 'MyNewOSObject',
        kind,
      });

      break;
    }

    // ─────────────────────────────────────────────────────────────
    // Example: object_selected (already exists, shown for reference)
    // ─────────────────────────────────────────────────────────────
    case 'object_selected': {
      const { workspaceId, objectId, objectType } = intent.payload ?? {};
      if (!workspaceId) return;

      await provider.recordActivity(workspaceId, {
        summary: `Selected ${objectType ?? 'object'}: ${objectId}`,
        type: 'info' as WorkspaceActivityType,
        source: 'OmniIntentContext',
        kind: 'user_action' as WorkspaceActivityKind,
      });

      break;
    }

    // ─────────────────────────────────────────────────────────────
    // Example: workspace_command_invoked
    // ─────────────────────────────────────────────────────────────
    case 'workspace_command_invoked': {
      const { workspaceId, command, label } = intent.payload ?? {};
      if (!workspaceId) return;

      await provider.recordActivity(workspaceId, {
        summary: `Command invoked: ${label ?? command}`,
        type: 'info' as WorkspaceActivityType,
        source: 'CommandPalette',
        kind: 'user_action' as WorkspaceActivityKind,
      });

      break;
    }

    // ─────────────────────────────────────────────────────────────
    // Add more intent cases here...
    // ─────────────────────────────────────────────────────────────

    default:
      // Unknown intents are silently ignored
      // (or you could log a warning in dev mode)
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY TYPES REFERENCE
// ═══════════════════════════════════════════════════════════════════
//
// WorkspaceActivityType:
//   'info'    - General information
//   'success' - Successful operation
//   'warning' - Warning/caution
//   'error'   - Error condition
//   'debug'   - Debug information
//
// WorkspaceActivityKind:
//   'user_action'      - User-initiated action
//   'system_event'     - System-initiated event
//   'background_task'  - Background process
//   'navigation'       - Navigation event
//   'data_change'      - Data modification
//
// ═══════════════════════════════════════════════════════════════════
// GOLDEN RULE: Keep activities domain-neutral
// ═══════════════════════════════════════════════════════════════════
//
// ❌ BAD:  summary: 'Parcel 12345 selected'
// ✅ GOOD: summary: 'Selected object: 12345'
//
// The domain context is passed from the payload.
