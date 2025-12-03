# 🧠 OS Workspace Spine – Contributor Quick Guide

This guide explains how to safely extend the **TerraFusion OS workspace spine**:

* OS objects (catalog primitives)
* Intents
* Activity + Telemetry
* Command palette
* Workspaces / right-rail panels

Follow this and you won't break the OS.

> 🗺️ **Navigation Hub:** [`docs/OS_SPINE_INDEX.md`](./OS_SPINE_INDEX.md) – Links to all spine-related docs and code paths.

> **Spec reference:** See [os-workspace-spine-spec.md](./os-workspace-spine-spec.md) for full contract definitions.

---

## 1. Adding a New **OS Object** (Catalog Primitive)

**Examples:** mini dashboards, new chips, small workspace widgets.

### Step 1: Create the component

Place under `frontend/src/terrafusion-os/core/osObjects/` or `workspaces/`:

```tsx
// core/osObjects/MyNewOSObject.tsx
import React from 'react';
import { useOmniIntent } from '../state/OmniIntentContext';

export interface MyNewOSObjectProps {
  workspaceId?: string;
  // keep props domain-neutral
}

export const MyNewOSObject: React.FC<MyNewOSObjectProps> = ({
  workspaceId,
}) => {
  const { emitIntent } = useOmniIntent();

  // use emitIntent(...) for cross-cutting behavior
  return <div>My new OS object</div>;
};
```

### Step 2: Register in the catalog

Edit `core/osObjects/catalog.ts`:

```ts
type OSObjectId =
  | 'object_quicklist'
  | 'workspace_status_chip'
  | 'workspace_activity_feed'
  | 'workspace_command_palette'
  | 'my_new_os_object'; // ← add

import { MyNewOSObject } from './MyNewOSObject';

const OS_OBJECTS: Record<OSObjectId, OSObjectDefinition> = {
  // existing...
  my_new_os_object: {
    id: 'my_new_os_object',
    label: 'My New OS Object',
    domain: 'os',
    resolveComponent: () => MyNewOSObject,
  },
};
```

### Step 3: Use via catalog (never direct import)

```tsx
const MyNewOSObjectComp = resolveOSObjectComponent('my_new_os_object');
<MyNewOSObjectComp workspaceId="home" />;
```

### Step 4: Add tests

* Extend `core/osObjects/__tests__/catalog.test.ts`:
  * ID exists in the catalog.
  * `resolveOSObjectComponent('my_new_os_object')` returns a component.
* Create `core/osObjects/__tests__/MyNewOSObject.test.tsx`:
  * Render test.
  * Intent emission behavior.

### Step 5: Verify

```bash
npx vitest run src/terrafusion-os
```

---

## 2. Adding a New **Intent**

If your primitive needs a new cross-cutting behavior:

### Step 1: Add intent type

Edit `core/state/OmniIntentContext.tsx`:

```ts
type IntentType =
  | 'object_selected'
  | 'workspace_status_selected'
  | 'workspace_status_changed'
  | 'workspace_activity_selected'
  | 'workspace_command_invoked'
  | 'my_new_intent'; // ← add
```

### Step 2: Emit from your component

```ts
emitIntent('my_new_intent', { workspaceId, someData });
```

### Step 3: Handle in context

```ts
const emitIntent = (type: IntentType, payload: any) => {
  const intent: Intent = { type, payload };

  switch (intent.type) {
    case 'my_new_intent':
      // update right-rail, workspace state, etc.
      break;
    // ...
  }

  void recordWorkspaceActivityFromIntent(intent);
};
```

### Step 4: Map to activity (for logging)

Edit `core/activity/intentActivityBridge.ts`:

```ts
case 'my_new_intent': {
  const { workspaceId } = intent.payload ?? {};
  if (!workspaceId) return;

  await provider.recordActivity(workspaceId, {
    summary: 'My new intent fired',
    type: 'info',
    source: 'MyNewOSObject',
    kind: 'user_action',
  });
  break;
}
```

### Step 5: Update spec

Add the new intent to `docs/os-workspace-spine-spec.md` Section 2.1.

---

## 3. Touching the **Activity System**

If you're changing how events are stored or displayed:

### ❌ DO NOT

* Change `useWorkspaceActivity` or `useSystemActivity` signatures.
* Bypass `recordActivity` or `ingestWorkspaceTelemetry`.
* Reach into provider internals from components.

### ✅ ALLOWED

**New provider implementation:**

* Implement `WorkspaceActivityProvider` interface.
* Wire with `setWorkspaceActivityProvider(...)` at bootstrap.
* Keep `recordActivity` and `getRecentActivity` semantics identical.

**New activity views:**

* Build components using:
  * `useWorkspaceActivity(workspaceId, { limit })`, or
  * `useSystemActivity({ limitPerWorkspace })`
* Do not access provider internals directly.

### Verify

```bash
npx vitest run src/terrafusion-os
```

---

## 4. Extending the **Command Palette**

To add new commands or AI-suggested commands:

### Step 1: Add a core command

Edit `core/commands/WorkspaceCommandProvider.ts`:

```ts
const STATIC_COMMANDS: WorkspaceCommand[] = [
  // existing...
  {
    id: 'my-new-command',
    label: 'My New Command',
    description: 'Explain what it does in neutral terms.',
    kind: 'core',
  },
];
```

### Step 2: Handle in intent switch

```ts
case 'workspace_command_invoked': {
  const { workspaceId, commandId } = intent.payload ?? {};

  switch (commandId) {
    case 'my-new-command':
      // react (open panel, change state, etc.)
      break;
  }

  void recordWorkspaceActivityFromIntent(intent);
  break;
}
```

### Step 3: AI suggestions (optional)

* Implement `WorkspaceCommandSuggestionProvider` (e.g. call backend AI).
* Wrap with `createAIEnhancedWorkspaceCommandProvider(base, suggestions)`.
* Wire via `setWorkspaceCommandProvider(...)`.

---

## 5. Adding a New **Workspace** or Right-Rail Panel

### Workspace (full page)

* Place in `workspaces/`, e.g. `MyNewWorkspace.tsx`.
* Use OS hooks/primitives only:
  * `OSHealthSummaryBar`
  * `workspace_activity_feed` component (via catalog)
  * `useWorkspaceActivity` / `useSystemActivity`
  * `emitIntent(...)`
* Register in workspace registry/router.

### Right-rail panel

* Implement a component taking **only** required props (e.g. `workspaceId`, `activityId`).
* Add a new `RightRailPanelId` and render case.
* Open via intent handler (e.g. `workspace_activity_selected`).

---

## 6. Quick Checklist Before Opening a PR

Before shipping anything that touches OS spine:

- [ ] New OS object registered in `catalog.ts`
- [ ] No domain terms added to OS-level types, intents, or providers
- [ ] All new behavior flows through:
  - [ ] `emitIntent(...)`
  - [ ] `recordWorkspaceActivityFromIntent(...)` or `ingestWorkspaceTelemetry(...)`
- [ ] Tests updated:
  - [ ] `catalog.test.ts` (if catalog changed)
  - [ ] Activity / telemetry tests (if mappings changed)
  - [ ] Command provider/palette tests (if commands changed)
- [ ] `docs/os-workspace-spine-spec.md` updated if:
  - [ ] New intent
  - [ ] New OS object ID
  - [ ] New provider contract (method/field)

### Run verification

```bash
npx vitest run src/terrafusion-os
```

If all tests pass, you're inside the rails of the OS spine. ✅

---

## File Quick Reference

| What | Where |
|------|-------|
| OS Object catalog | `core/osObjects/catalog.ts` |
| OS Object types | `core/osObjects/types.ts` |
| Intent context | `core/state/OmniIntentContext.tsx` |
| Activity types | `core/activity/types.ts` |
| Activity provider | `core/activity/WorkspaceActivityProvider.ts` |
| Intent → Activity bridge | `core/activity/intentActivityBridge.ts` |
| Telemetry → Activity bridge | `core/activity/telemetryActivityBridge.ts` |
| Command provider | `core/commands/WorkspaceCommandProvider.ts` |
| Command palette | `core/osObjects/WorkspaceCommandPalette.tsx` |
| Workspaces | `workspaces/*.tsx` |
| Tests | `**/__tests__/*.test.ts(x)` |

---

*Last updated: 2025-12-03*
