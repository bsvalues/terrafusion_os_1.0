# 🤖 TerraFusion OS – Agent Onboarding Guide (Workspace Spine)

**Audience:** AI agents (Copilot, Replit Agent, Cursor, ChatGPT, Claude, etc.) working on TerraFusion OS.  
**Scope:** How to touch **OS objects**, **intents**, **activity**, and **workspaces** without breaking the OS.

If you are an AI agent changing code under `terrafusion-os/core/` or `terrafusion-os/workspaces/`, you **must** follow this.

> 🗺️ **Navigation Hub:** [`docs/OS_SPINE_INDEX.md`](./OS_SPINE_INDEX.md) – Links to all spine-related docs and code paths.

---

## 0. Read This Before You Touch Anything

As an AI agent, before editing workspace-related code:

1. **Read (or refresh):**
   * [OS_SPINE_INDEX.md](./OS_SPINE_INDEX.md) (navigation hub – start here)
   * [os-workspace-spine-spec.md](./os-workspace-spine-spec.md) (contract for objects/intents/activity)
   * [OS_SPINE_CONTRIBUTOR_GUIDE.md](./OS_SPINE_CONTRIBUTOR_GUIDE.md) (step-by-step contributor checklist)

2. **Know the golden rule:**

> **All OS behavior flows through the spine:**  
> **OS Objects → Intents → Activity Provider → Hooks → Workspaces / Panels**

Do **not** bypass this.

---

## 1. Where You're Allowed to Work

As an agent, it's safe to modify:

| Path | What You Can Do |
|------|-----------------|
| `workspaces/` | Workspace-level components, OS primitives |
| `core/osObjects/catalog.ts` | Catalog registration only |
| `core/osObjects/*.tsx` | New OS object components |
| `core/activity/` | Provider implementations, intent↔activity mapping, telemetry ingestion, health summary |
| `core/commands/` | Command providers, AI suggestion providers, palette behavior |
| `core/state/OmniIntentContext.tsx` | Intent routing, right-rail panel selection |

### You MUST NOT:

* Hardcode domain-specific logic (parcels, levies, GIS, etc.) inside OS-level primitives.
* Reach directly into provider internals from UI; always use hooks:
  * `useWorkspaceActivity`
  * `useSystemActivity`
  * `useWorkspaceCommands`

---

## 2. Adding or Editing an **OS Object**

**OS Objects** are catalog-registered primitives like:

* `object_quicklist`
* `workspace_status_chip`
* `workspace_activity_feed`
* `workspace_command_palette`

### 🚀 USE THE SCAFFOLD (Recommended)

**Always use the scaffold script** instead of hand-writing components:

```bash
npm run scaffold:os-object MyNewOSObject my_new_os_object
```

This creates:
- Component pre-wired to intent spine
- Tests with correct mocking
- Spec snippet to paste into docs

Then follow the printed instructions to register in catalog.

### Manual approach (if needed):

1. **Add/modify component in `core/osObjects/` or `workspaces/`**

   * Props must be **domain-neutral**:
     * `workspaceId`, `items`, `status`, `commands`, etc.
   * Cross-cutting actions must go through:

   ```ts
   const { emitIntent } = useOmniIntent();
   emitIntent('some_intent', payload);
   ```

2. **Register it in `core/osObjects/catalog.ts`**

   * Add an ID to the `OSObjectId` union.
   * Add an entry to `OS_OBJECTS`.
   * Use `domain: 'os'`.

3. **NEVER:**

   * Place feature-specific behavior (e.g. levy math) inside an OS object.
   * Call APIs, fetch data, or hit services directly from OS objects.

4. **Update tests:**

   * Extend `catalog.test.ts` with:
     * presence of new ID
     * resolver returns a component
   * New object gets its own test file under `core/osObjects/__tests__/` or `workspaces/__tests__/`.

---

## 3. Working With **Intents**

The **only** sanctioned pipeline for OS-level events is:

```ts
emitIntent(type: IntentType, payload: any);
```

### When adding a new intent:

1. Add type to the `IntentType` union in `core/state/OmniIntentContext.tsx`.
2. Emit it from the OS object via `emitIntent`.
3. Handle it in `OmniIntentContext.tsx`:
   * Update right rail / workspace state as needed.
4. If it should be logged → add mapping in `core/activity/intentActivityBridge.ts`.

### Never:

* Bypass the intent system by directly manipulating global state from within primitives.
* Introduce domain terms in intent types or payload structure.

---

## 4. Activity & Telemetry – How You Log Things

There are **two** legal entry points into the activity system:

### 1. From intents:

```ts
void recordWorkspaceActivityFromIntent(intent);
```

* Already called from `emitIntent`.
* As an agent, you should **only** modify the mapping in `intentActivityBridge.ts`.

### 2. From telemetry:

```ts
await ingestWorkspaceTelemetry({
  workspaceId,
  severity: 'info' | 'warning' | 'critical',
  kind: 'health' | 'incident' | 'system' | 'user_action',
  message,
  source,
  occurredAt,
});
```

* Only telemetry bridges or WebSocket/SSE hooks should call this.
* It maps into `recordActivity` via a pure function.

### Hooks for reading:

**Per workspace:**
```ts
const { items, loading, error } = useWorkspaceActivity(workspaceId, { limit });
```

**OS-wide:**
```ts
const { items, loading, error } = useSystemActivity({ limitPerWorkspace });
```

### As an agent, you must not:

* Add new write paths that bypass `recordActivity`.
* Hardcode storage in UI components (no local arrays that "look like" activity).

---

## 5. Commands & Command Palette

The workspace command system has three layers:

1. **Base commands** (`core`):
   * Defined in `baseWorkspaceCommandProvider`.

2. **AI suggestions** (`suggested`):
   * Defined via `WorkspaceCommandSuggestionProvider`.
   * Composed with `createAIEnhancedWorkspaceCommandProvider`.

3. **Palette UI**:
   * `WorkspaceCommandPalette` renders all commands and emits `workspace_command_invoked`.

### As an agent, when adding a new command:

1. Add it to `STATIC_COMMANDS` in `WorkspaceCommandProvider.ts`.
2. Handle it in `workspace_command_invoked` inside `OmniIntentContext.tsx`.
3. Log it via `recordWorkspaceActivityFromIntent`.

### To add AI suggestions:

* Implement a new `WorkspaceCommandSuggestionProvider`.
* Compose it with `createAIEnhancedWorkspaceCommandProvider(base, suggestions)`.
* Wire via `setWorkspaceCommandProvider`.

### Do not:

* Call AI APIs directly from React components.
* Return non-neutral strings like "Open Parcel 1234…" at the OS level. Those belong in domain modules, not the OS spine.

---

## 6. Workspaces & Right-Rail Panels

**Workspaces** are full-page shells (e.g. `HomeWorkspace`, `SystemActivityWorkspace`).

**Right-rail panels** are side views driven by intents.

### For a new workspace:

* Place it under `workspaces/`.
* Use OS hooks & primitives:
  * `OSHealthSummaryBar`
  * `WorkspaceActivityFeed` (via catalog)
  * `WorkspaceCommandPalette` (via catalog)
* Register it in the workspace registry/router.

### For a new right-rail panel:

1. Create a component with minimal props: `workspaceId`, `activityId`, etc.
2. Add a `RightRailPanelId`.
3. Render it via the right-rail switch.
4. Open it by handling an intent in `emitIntent`.

### Never:

* Make right-rail panels fetch from arbitrary services directly.
* Wire panels to domain-specific APIs inside the OS layer.

---

## 7. CI / Tests – What You MUST Run

Any time you (as an agent) alter:

* `core/osObjects/*`
* `core/state/OmniIntentContext.tsx`
* `core/activity/*`
* `core/commands/*`
* `workspaces/*` under the OS spine

You must:

1. **Update or add tests** as per the OS spine spec.

2. **Run at least:**

   ```bash
   npx vitest run src/terrafusion-os
   ```

3. **Ensure all tests pass** before suggesting merge.

If tests fail, **do not** attempt to "quick fix" by altering contracts. Instead:

* Re-read [os-workspace-spine-spec.md](./os-workspace-spine-spec.md).
* Adjust your implementation to respect the contracts.

---

## 8. Quick "Agent Sanity Checklist"

Before you declare your changes "done":

- [ ] I did **not** add any domain-specific logic under `core/` or OS primitives.
- [ ] All cross-cutting actions go through **intents** (`emitIntent`).
- [ ] All logging goes through:
  - [ ] `recordWorkspaceActivityFromIntent`, or
  - [ ] `ingestWorkspaceTelemetry`.
- [ ] I used `useWorkspaceActivity` / `useSystemActivity` / `useWorkspaceCommands` instead of inventing new hooks.
- [ ] I updated tests relevant to:
  - [ ] OS objects
  - [ ] Activity / telemetry
  - [ ] Commands / palette
  - [ ] Workspaces / panels
- [ ] `npx vitest run src/terrafusion-os` is **green**.

If all of these are true, you (the agent) are operating inside the TerraFusion OS rails. ✅

---

## 9. File Quick Reference

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
| AI-enhanced provider | `core/commands/createAIEnhancedProvider.ts` |
| Command palette | `core/osObjects/WorkspaceCommandPalette.tsx` |
| Workspaces | `workspaces/*.tsx` |
| Tests | `**/__tests__/*.test.ts(x)` |

---

## Related Docs

* [os-workspace-spine-spec.md](./os-workspace-spine-spec.md) – Full contract specification
* [OS_SPINE_CONTRIBUTOR_GUIDE.md](./OS_SPINE_CONTRIBUTOR_GUIDE.md) – Human contributor guide

---

*Last updated: 2025-12-03*
