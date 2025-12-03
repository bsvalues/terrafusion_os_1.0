/**
 * IntentMapping.example.ts
 *
 * TEMPLATE: Shows how to add a new intent to the OmniIntent router.
 * Copy the relevant patterns into core/state/OmniIntentContext.tsx.
 *
 * @see docs/os-workspace-spine-spec.md (Section 2)
 */

// ═══════════════════════════════════════════════════════════════════
// STEP 1: Extend IntentType (in OmniIntentContext.tsx)
// ═══════════════════════════════════════════════════════════════════

export type IntentType =
  // Existing intents
  | 'object_selected'
  | 'workspace_status_selected'
  | 'workspace_status_changed'
  | 'workspace_activity_selected'
  | 'workspace_command_invoked'
  // Add your new intent here ↓
  | 'my_new_intent';

// ═══════════════════════════════════════════════════════════════════
// STEP 2: Define the payload shape (optional but recommended)
// ═══════════════════════════════════════════════════════════════════

interface MyNewIntentPayload {
  workspaceId?: string;
  someParam?: string;
  // Add small, serializable fields only
}

// ═══════════════════════════════════════════════════════════════════
// STEP 3: Handle it inside emitIntent (in OmniIntentContext.tsx)
// ═══════════════════════════════════════════════════════════════════

// Inside the emitIntent function, add a case:
/*
const emitIntent = (type: IntentType, payload: any) => {
  const intent: Intent = { type, payload };

  switch (intent.type) {
    case 'my_new_intent': {
      const { workspaceId, someParam } = intent.payload ?? {};

      // Example: open a right-rail panel
      setRightRail({
        panel: 'my-new-panel',
        props: { workspaceId, someParam },
      });

      break;
    }

    // Keep existing cases...
    case 'object_selected':
      // existing logic
      break;
  }

  // IMPORTANT: Flow into activity logging
  void recordWorkspaceActivityFromIntent(intent);
};
*/

// ═══════════════════════════════════════════════════════════════════
// STEP 4: Add to intentActivityBridge (if logging needed)
// ═══════════════════════════════════════════════════════════════════

// In core/activity/intentActivityBridge.ts, add mapping:
/*
case 'my_new_intent': {
  const { workspaceId, someParam } = intent.payload ?? {};
  if (!workspaceId) return;

  await provider.recordActivity(workspaceId, {
    summary: `New intent triggered: ${someParam ?? 'unknown'}`,
    type: 'info',
    source: 'OmniIntentContext',
    kind: 'user_action',
  });
  break;
}
*/

// ═══════════════════════════════════════════════════════════════════
// GOLDEN RULE: Keep intents domain-neutral
// ═══════════════════════════════════════════════════════════════════
//
// ❌ BAD:  'parcel_selected', 'levy_updated', 'permit_created'
// ✅ GOOD: 'object_selected', 'entity_updated', 'resource_created'
//
// The domain context comes from the payload, not the intent type.
