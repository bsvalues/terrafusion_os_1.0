# TerraFusion OS Workspace Spine Spec

Status: DRAFT (contracts stable, implementation evolving)  
Scope: OS objects, intents, activity system, and workspace/right-rail wiring

> 🗺️ **Navigation Hub:** [`docs/OS_SPINE_INDEX.md`](./OS_SPINE_INDEX.md) – Links to all spine-related docs and code paths.

---

## 1. OS Objects (Catalog-Level)

OS objects are **domain-neutral UI primitives** registered in a central catalog and resolved by ID.

### 1.1 Object IDs

```ts
type OSObjectId =
  | 'object_quicklist'
  | 'workspace_status_chip'
  | 'workspace_activity_feed'
  | 'workspace_command_palette';
```

> **Rule:** OS objects must **not** bake in domain concepts (e.g. parcel, levy). They operate in terms of "workspace", "object", "status", "activity", "command".

### 1.2 Catalog Contract

```ts
interface OSObjectDefinition {
  id: OSObjectId;
  label: string;
  domain: 'os'; // reserved for OS-level primitives
  resolveComponent: () => React.ComponentType<any>;
}

declare const OS_OBJECTS: Record<OSObjectId, OSObjectDefinition>;

declare function listOSObjects(): OSObjectDefinition[];

declare function resolveOSObjectComponent(
  id: OSObjectId
): React.ComponentType<any>;
```

**Invariants:**

* `OS_OBJECTS` must contain at least **two** entries (to catch "forgot to register" issues).
* `listOSObjects()` always returns all registered entries.
* `resolveOSObjectComponent(id)` must throw or fail loudly for unknown IDs (never silently `undefined`).

---

## 2. Intent Spine (OmniIntent)

The **intent spine** is the single pipeline that carries all high-level UI events and OS actions.

### 2.1 Intent Types

```ts
type IntentType =
  | 'object_selected'
  | 'workspace_status_selected'
  | 'workspace_status_changed'
  | 'workspace_activity_selected'
  | 'workspace_command_invoked';
  // extensible: add new intent types here

interface Intent<T = any> {
  type: IntentType;
  payload: T;
}
```

### 2.2 Emitter Contract

```ts
interface OmniIntentContextValue {
  emitIntent<T = any>(type: IntentType, payload: T): void;
  // plus right-rail state, etc.
}
```

**Rules:**

* OS objects **MUST** use `emitIntent` for cross-cutting behavior (right-rail, logging, navigation).
* Payloads must be **serializable** (no functions, DOM nodes, etc.).
* Domain-specific reactions (e.g. "open Parcel 123") happen **downstream**, not inside OS objects.

---

## 3. Activity System

The activity system turns **intents and telemetry** into a normalized event stream.

### 3.1 Core Types

```ts
export type WorkspaceActivityType = 'info' | 'warning' | 'incident';

export type WorkspaceActivityKind =
  | 'user_action'
  | 'system_event'
  | 'health_update';

export interface WorkspaceActivityItem {
  id: string;
  timestamp: string; // ISO 8601
  summary: string;
  type: WorkspaceActivityType;
  source?: string;              // e.g. "WorkspaceStatusChip", "Telemetry"
  kind?: WorkspaceActivityKind;
}

export interface SystemWorkspaceActivityItem {
  workspaceId: string;
  item: WorkspaceActivityItem;
}
```

### 3.2 Provider Contract

```ts
export interface WorkspaceActivityProvider {
  getRecentActivity(
    workspaceId: string,
    options?: { limit?: number }
  ): Promise<WorkspaceActivityItem[]>;

  recordActivity(
    workspaceId: string,
    entry: Omit<WorkspaceActivityItem, 'id' | 'timestamp'>
  ): Promise<void>;

  // Optional, for OS-wide consoles
  getAllRecentActivity?(
    options?: { limitPerWorkspace?: number }
  ): Promise<SystemWorkspaceActivityItem[]>;
}

declare function getWorkspaceActivityProvider(): WorkspaceActivityProvider;
declare function setWorkspaceActivityProvider(p: WorkspaceActivityProvider): void;
```

**Rules:**

* `recordActivity` is the **only** write interface used by UI and intent/telemetry bridges.
* Implementations **MAY** be in-memory (dev) or backed by a service (prod) without changing callers.
* `getAllRecentActivity` is optional; OS-wide UIs must degrade gracefully if not implemented.

### 3.3 Hooks

```ts
interface UseWorkspaceActivityResult {
  items: WorkspaceActivityItem[];
  loading: boolean;
  error: Error | null;
}

export function useWorkspaceActivity(
  workspaceId: string,
  options?: { limit?: number }
): UseWorkspaceActivityResult;

interface UseSystemActivityResult {
  items: SystemWorkspaceActivityItem[];
  loading: boolean;
  error: Error | null;
}

export function useSystemActivity(
  options?: { limitPerWorkspace?: number }
): UseSystemActivityResult;
```

---

## 4. Intent → Activity Bridge

All logging from UI flows through a **single translation layer**.

```ts
export interface OmniIntent {
  type: IntentType;
  payload: any;
}

export async function recordWorkspaceActivityFromIntent(
  intent: OmniIntent
): Promise<void>;
```

### 4.1 Mappings (Examples)

* `workspace_status_selected`
  → "Workspace status viewed (status)" (`kind: 'health_update'`)

* `workspace_status_changed`
  → "Workspace status changed: X → Y" (type: warning/incident/info based on new status)

* `workspace_command_invoked`
  → "Command invoked: label" (`kind: 'user_action'`)

* `object_selected`
  → "Object selected: type id" (`kind: 'user_action'`)

**Rules:**

* The bridge must **not** introduce domain terms (parcel, levy, etc.).
* It is safe to ignore unknown intents; adding new intent types is additive.

---

## 5. Telemetry → Activity Bridge

Telemetry ingestion uses a separate neutral contract.

```ts
export type WorkspaceTelemetrySeverity = 'info' | 'warning' | 'critical';
export type WorkspaceTelemetryKind =
  | 'health'
  | 'incident'
  | 'system'
  | 'user_action';

export interface WorkspaceTelemetryEvent {
  workspaceId: string;
  severity: WorkspaceTelemetrySeverity;
  kind: WorkspaceTelemetryKind;
  message: string;
  source?: string;
  occurredAt?: string; // ISO
}

export async function ingestWorkspaceTelemetry(
  event: WorkspaceTelemetryEvent
): Promise<void>;
```

**Rules:**

* Mapping from telemetry → activity is **pure** (no side effects beyond `recordActivity`).
* Telemetry sources (WebSocket, SSE, polling, backend push) must convert their payloads to this shape.

---

## 6. Workspace-Level Hooks & Surfaces

### 6.1 Health Summary

```ts
export type WorkspaceHealthLevel = 'nominal' | 'degraded' | 'critical';

export interface WorkspaceHealthSummary {
  level: WorkspaceHealthLevel;
  incidents24h: number;
  lastIncident?: WorkspaceActivityItem;
}

export function computeWorkspaceHealthSummary(
  items: WorkspaceActivityItem[],
  now?: Date
): WorkspaceHealthSummary;
```

**Usage:**

* `OSHealthSummaryBar` → always-visible banner (level + incidents in last 24h).
* `WorkspaceStatusChip` → can show "last incident" inline.

### 6.2 Panels & Workspaces

* Right-rail panels (examples):

  ```ts
  type RightRailPanelId =
    | 'workspace-health'
    | 'workspace-activity-detail';
  ```

* Special workspaces:

  * `HomeWorkspace` (per-workspace view with primitives)
  * `SystemActivityWorkspace` (OS-wide console, uses `useSystemActivity`)

---

## 7. Commands & Command Palette

### 7.1 Command Types

```ts
export type WorkspaceCommandId = string;

export type WorkspaceCommandKind = 'core' | 'suggested';

export interface WorkspaceCommand {
  id: WorkspaceCommandId;
  label: string;
  description?: string;
  category?: string;
  kind?: WorkspaceCommandKind; // default 'core'
  score?: number;              // suggested ranking
}
```

### 7.2 Providers

```ts
export interface WorkspaceCommandProvider {
  getCommands(workspaceId: string): Promise<WorkspaceCommand[]>;
}

export interface WorkspaceCommandSuggestionContext {
  workspaceId: string;
}

export interface WorkspaceCommandSuggestionProvider {
  getSuggestedCommands(
    ctx: WorkspaceCommandSuggestionContext
  ): Promise<WorkspaceCommand[]>;
}

export function createAIEnhancedWorkspaceCommandProvider(
  base: WorkspaceCommandProvider,
  suggestions: WorkspaceCommandSuggestionProvider
): WorkspaceCommandProvider;

export function getWorkspaceCommandProvider(): WorkspaceCommandProvider;
export function setWorkspaceCommandProvider(
  provider: WorkspaceCommandProvider
): void;
```

**Rules:**

* Base provider defines **core** commands; suggestion provider decorates with `kind: 'suggested'`.
* Composite provider dedupes by `id` and orders: core first, then suggestions by `score`.

### 7.3 Palette → Intent

```ts
// from WorkspaceCommandPalette
emitIntent('workspace_command_invoked', {
  workspaceId,
  commandId: cmd.id,
  label: cmd.label,
});
```

Downstream, intent handling:

```ts
case 'workspace_command_invoked': {
  const { workspaceId, commandId } = intent.payload;

  switch (commandId) {
    case 'open-health-timeline':
      setRightRail({ panel: 'workspace-health', props: { workspaceId } });
      break;
    // ...other commands...
  }

  // Log usage:
  void recordWorkspaceActivityFromIntent(intent);
}
```

---

## 8. Testing & CI Expectations

**Unit Tests MUST cover:**

* `osObjects`:

  * All IDs present.
  * Resolver returns components.
  * Catalog has ≥ 2 entries.

* Activity:

  * `WorkspaceActivityProvider` default implementation (reads/writes, OS-wide view).
  * `recordWorkspaceActivityFromIntent` mappings.
  * `ingestWorkspaceTelemetry` mappings.
  * `computeWorkspaceHealthSummary` edge cases.

* Commands:

  * `createAIEnhancedWorkspaceCommandProvider` dedupe + ordering.
  * `WorkspaceCommandPalette` core/suggested grouping and filtering.

**CI Gates:**

* `npm run test:os:unit` – unit tests for OS primitives & providers.
* `npm run test:os:smoke` – catalog and contract smoke tests.
* OS pipeline **MUST fail** if any OS spine test fails (Gate F-OS).

---

## 9. Contributor Checklist

When adding a new OS primitive, follow this checklist to ensure full compliance:

### Adding a New OS Object

1. **Define ID** in `core/osObjects/types.ts` – add to `OSObjectId` union
2. **Create component** in `core/osObjects/` – must be domain-neutral
3. **Register** in `core/osObjects/catalog.ts` – add entry to `OS_OBJECTS`
4. **Add tests** in `core/osObjects/__tests__/` – component + catalog coverage
5. **Update this spec** – add ID to Section 1.1

### Adding a New Intent Type

1. **Define type** in `core/state/OmniIntentContext.tsx` – add to `IntentType` union
2. **Add bridge mapping** in `core/activity/intentActivityBridge.ts`
3. **Add tests** for the new mapping
4. **Update this spec** – add to Section 2.1

### Adding a New Activity Kind or Type

1. **Extend types** in `core/activity/types.ts`
2. **Update bridges** (intent + telemetry) if needed
3. **Update this spec** – Section 3.1

### Adding a New Workspace

1. **Create component** in `workspaces/` – use existing hooks (`useWorkspaceActivity`, `useOmniIntent`)
2. **Add tests** in `workspaces/__tests__/`
3. **If OS-wide**: use `useSystemActivity` and handle graceful degradation

### Adding a New Command

1. **Define command** via provider (core or suggestion)
2. **Handle intent** downstream if command triggers right-rail or navigation
3. **Add tests** for provider and palette filtering

---

## 10. File Reference

| Contract | Source Location |
|----------|-----------------|
| OS Object types | `core/osObjects/types.ts` |
| OS Object catalog | `core/osObjects/catalog.ts` |
| Intent types & context | `core/state/OmniIntentContext.tsx` |
| Activity types | `core/activity/types.ts` |
| Activity provider | `core/activity/WorkspaceActivityProvider.ts` |
| Activity hooks | `core/activity/useWorkspaceActivity.ts`, `core/activity/useSystemActivity.ts` |
| Intent → Activity bridge | `core/activity/intentActivityBridge.ts` |
| Telemetry → Activity bridge | `core/activity/telemetryActivityBridge.ts` |
| Health summary | `core/activity/workspaceHealthSummary.ts` |
| Command types | `core/commands/types.ts` |
| Command provider | `core/commands/WorkspaceCommandProvider.ts` |
| AI-enhanced provider | `core/commands/createAIEnhancedProvider.ts` |
| Command palette | `core/osObjects/WorkspaceCommandPalette.tsx` |
| System activity workspace | `workspaces/SystemActivityWorkspace.tsx` |

---

*Last updated: 2025-12-03*
