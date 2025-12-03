# TerraFusion OS – Workspace Spine Index

This file is the **navigation hub** for everything related to the TerraFusion OS **workspace spine**:

> OS Objects → Intents → Activity → Telemetry → Commands → Workspaces/Right-Rail

If you are touching anything under `terrafusion-os/`, `core/`, or `workspaces/` at the OS level, start here.

---

## 1. Core Spec (Contracts You MUST Follow)

### 🔹 1.1 OS Workspace Spine Spec

**File:** [`docs/os-workspace-spine-spec.md`](./os-workspace-spine-spec.md)  
**Audience:** Engineers & AI agents  
**Purpose:** Defines the **canonical contracts** for:

- OS Objects & catalog
- Intent types & routing
- Activity provider (`WorkspaceActivityProvider`)
- Telemetry ingestion
- Health summary
- Command providers & palette
- Workspaces & right-rail panels

> If you change any OS-level type, intent, provider, or primitive, you **must** check it against this spec.

### 🔹 1.2 Workspace Experience Spec (v1)

**File:** [`docs/WORKSPACE_EXPERIENCE_V1.md`](./WORKSPACE_EXPERIENCE_V1.md)  
**Audience:** UI/UX designers, frontend engineers, AI agents  
**Purpose:** Defines the **visual language** and **interaction patterns** for:

- macOS Tahoe + TerraSphere design philosophy
- Workspace layout templates
- Motion & timing (Framer Motion standards)
- Typography & color system (`--os-*` tokens)
- OS object styling rules
- HomeWorkspace & SystemActivityWorkspace UX
- Right-rail panel patterns

> If you're styling or animating any OS-level UI, you **must** follow this spec.

---

## 2. How Humans Extend the Spine

### 🔹 2.1 OS Spine Contributor Guide

**File:** [`docs/OS_SPINE_CONTRIBUTOR_GUIDE.md`](./OS_SPINE_CONTRIBUTOR_GUIDE.md)  
**Audience:** Human contributors  
**Purpose:** Step-by-step "how do I…?" guide:

- Add a new OS object (catalog primitive)
- Add a new intent
- Map intent → activity
- Extend the activity system
- Add commands & command handlers
- Add a new workspace or right-rail panel
- Run the correct OS tests

Includes:

- Checklists for PRs
- Specific test files to update
- Required `npm run test:os:unit` and `npm run test:os:smoke` gates

---

## 3. How AI Agents Must Behave

### 🔹 3.1 Agent Onboarding Guide (OS Spine)

**File:** [`docs/AGENT_ONBOARDING_OS_SPINE.md`](./AGENT_ONBOARDING_OS_SPINE.md)  
**Audience:** AI agents (Claude, Copilot, Cursor, Replit Agent, ChatGPT, etc.)  
**Purpose:** Hard rails for agents working on the OS spine:

- What files they are allowed to touch
- Which paths they **must not** use (no domain logic under `terrafusion-os/`)
- How to:
  - Use `emitIntent(...)`
  - Use `recordWorkspaceActivityFromIntent(...)`
  - Use `ingestWorkspaceTelemetry(...)`
  - Use `useWorkspaceActivity` / `useSystemActivity` / `useWorkspaceCommands`
- Mandatory tests & commands before proposing edits

> If an AI agent edits OS spine code, it must follow this guide or its changes are invalid.

---

## 4. Workspace Spine Bundle (Scaffolding & Examples)

### 🔹 4.1 Spine Bundle (Templates)

**Folder:** [`frontend/tools/os-spine-bundle/`](../frontend/tools/os-spine-bundle/)

Contains:

| File | Purpose |
|------|---------|
| `README.md` | High-level explanation |
| `scaffold-os-object.ts` | CLI script to scaffold new OS objects |
| `templates/OSObject.tsx.tpl` | Minimal OS object template |
| `templates/OSObject.test.tsx.tpl` | Matching test template |
| `templates/IntentMapping.example.ts` | Example of adding & routing a new intent |
| `templates/ActivityMapping.example.ts` | Example of mapping intent to activity |
| `templates/SpecSnippet.md.tpl` | Doc snippet for new OS objects |

**Use when:**

- You're adding a new OS primitive and want a **copy-paste-safe** starting point.
- You're building a new panel or object and need to see the correct `emitIntent` + activity pattern.

**Quick command:**

```bash
cd frontend
npm run scaffold:os-object MyNewOSObject my_new_os_object
```

---

## 5. Where Code Lives (Spine-Related)

For quick navigation (all paths relative to `frontend/src/terrafusion-os/`):

### OS Objects & Catalog

| Path | Purpose |
|------|---------|
| `core/osObjects/catalog.ts` | Central OS object registry |
| `workspaces/ObjectQuickList.tsx` | Catalog browser primitive |
| `workspaces/WorkspaceStatusChip.tsx` | Status display primitive |
| `workspaces/WorkspaceActivityFeed.tsx` | Activity feed primitive |
| `workspaces/WorkspaceCommandPalette.tsx` | Command palette primitive |

### Intents & Right-Rail

| Path | Purpose |
|------|---------|
| `core/state/OmniIntentContext.tsx` | Intent spine (emitIntent, routing) |

### Activity & Telemetry

| Path | Purpose |
|------|---------|
| `core/activity/WorkspaceActivityProvider.ts` | Async activity provider |
| `core/activity/useWorkspaceActivity.ts` | Hook for workspace-scoped activity |
| `core/activity/useSystemActivity.ts` | Hook for cross-workspace activity |
| `core/activity/intentActivityBridge.ts` | Maps intents → activity entries |
| `core/activity/types.ts` | Activity type definitions |
| `core/activity/telemetryTypes.ts` | Telemetry type definitions |
| `core/activity/ingestTelemetry.ts` | Telemetry ingestion |
| `core/activity/healthSummary.ts` | Health aggregation + level computation |
| `core/activity/useWorkspaceHealthSummary.ts` | Hook for health summary |
| `core/activity/useWorkspaceTelemetry.ts` | Hook for telemetry |

### Commands

| Path | Purpose |
|------|---------|
| `core/commands/types.ts` | Command type definitions |
| `core/commands/WorkspaceCommandProvider.ts` | Async command provider |
| `core/commands/SuggestionProvider.ts` | Base suggestion provider |
| `core/commands/StubAISuggestionProvider.ts` | AI suggestion stub |
| `core/commands/useWorkspaceCommands.ts` | Hook for commands |

### Workspaces & Panels

| Path | Purpose |
|------|---------|
| `workspaces/HomeWorkspace.tsx` | Main OS home workspace |
| `workspaces/SystemActivityWorkspace.tsx` | Cross-workspace activity view |
| `workspaces/WorkspaceHealthTimelinePanel.tsx` | Health timeline panel |
| `workspaces/OSHealthSummaryBar.tsx` | Health summary bar |
| `workspaces/WorkspaceHealthPanel.tsx` | Right-rail health details panel |
| `workspaces/WorkspaceActivityDetailPanel.tsx` | Right-rail activity details panel |
| `workspaces/RightRailShell.tsx` | Standard right-rail panel router |
| `workspaces/WorkspaceDashboard.tsx` | Main workspace host with right-rail |
### UI Primitives (Tahoe Glass & TerraSphere)

| Path | Purpose |
|------|---------|
| `os/ui/OSGlassPanel.tsx` | Universal glass container (cards, panels) |
| `os/ui/OSGlassPanelRightRail.tsx` | Right-rail glass panel (slide-in) |
| `os/ui/TerraSphereStatus.tsx` | Animated health sphere (pulse + orbit) |
| `os/ui/WorkspaceTerraSphere.tsx` | Workspace-aware health sphere |
| `os/ui/index.ts` | Barrel export for UI primitives |

> **Note:** These are low-level UI primitives (not OS objects). Use inside workspaces and OS objects.
---

## 6. Required Tests & Commands

Any change to the OS spine should, at minimum, touch one or more of:

| Test Location | Coverage |
|--------------|----------|
| `core/osObjects/__tests__/catalog.test.ts` | Catalog registration |
| `core/activity/__tests__/*` | Activity provider, hooks, telemetry |
| `core/commands/__tests__/*` | Command provider, suggestions |
| `workspaces/__tests__/*` | Primitives and panels |

**Required commands before any PR:**

```bash
# Run OS unit tests
npm run test:os:unit

# Run OS smoke tests (full spine validation)
npm run test:os:smoke

# Or run all OS tests at once
npx vitest run src/terrafusion-os
```

> If either of these fails, the OS spine is considered **broken** until fixed.

**Current test count:** 325 tests across 26 files.

---

## 7. Golden Rule (Intent Flow)

```
┌─────────────┐    emitIntent()    ┌──────────────────┐
│  OS Object  │ ─────────────────► │ OmniIntentContext │
└─────────────┘                    └────────┬─────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
        ┌───────────────────┐                           ┌───────────────────┐
        │ recordActivity... │                           │  setRightRail()   │
        │ (activity bridge) │                           │  (UI routing)     │
        └─────────┬─────────┘                           └───────────────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ ActivityProvider  │
        └─────────┬─────────┘
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
┌──────────────┐      ┌──────────────┐
│ useWorkspace │      │ useSystem    │
│ Activity()   │      │ Activity()   │
└──────────────┘      └──────────────┘
```

**Remember:** OS Objects → emitIntent() → Activity Provider → Hooks → Workspaces/Panels

---

## 8. How Other Docs Should Link Here

### In `CLAUDE.md` / `AI_AGENT_QUICK_START.md`:

Add a short "OS Spine" section:

```markdown
## 🔧 OS Spine (Workspace System)

If touching files under `src/terrafusion-os/`:

1. **Start here:** [docs/OS_SPINE_INDEX.md](docs/OS_SPINE_INDEX.md)
2. **Agent rules:** [docs/AGENT_ONBOARDING_OS_SPINE.md](docs/AGENT_ONBOARDING_OS_SPINE.md)
3. **Contracts:** [docs/os-workspace-spine-spec.md](docs/os-workspace-spine-spec.md)
```

### In project `README.md`:

Under "Architecture" or "Workspace System", add:

```markdown
### OS Workspace Spine

For the workspace system architecture, start here:
- **[OS Spine Index](docs/OS_SPINE_INDEX.md)** – Navigation hub for all spine docs
```

---

## 9. When in Doubt

If you're unsure how to extend the workspace system:

1. **Read/re-read:** [`docs/os-workspace-spine-spec.md`](./os-workspace-spine-spec.md)
2. **Check:** [`docs/OS_SPINE_CONTRIBUTOR_GUIDE.md`](./OS_SPINE_CONTRIBUTOR_GUIDE.md)
3. **For AI agents:** [`docs/AGENT_ONBOARDING_OS_SPINE.md`](./AGENT_ONBOARDING_OS_SPINE.md)
4. **Look at templates in:** [`frontend/tools/os-spine-bundle/`](../frontend/tools/os-spine-bundle/)
5. **Scaffold new objects:** `npm run scaffold:os-object`

If it still isn't clear, **do not guess**.  
Open an issue or ask for clarification, referencing the section you're stuck on.

---

## 10. Quick Reference

| I want to... | Go to... |
|--------------|----------|
| Understand the contracts | [os-workspace-spine-spec.md](./os-workspace-spine-spec.md) |
| Understand the UX/visual rules | [WORKSPACE_EXPERIENCE_V1.md](./WORKSPACE_EXPERIENCE_V1.md) |
| Add a new OS object | [OS_SPINE_CONTRIBUTOR_GUIDE.md § OS Objects](./OS_SPINE_CONTRIBUTOR_GUIDE.md) |
| Add a new intent | [OS_SPINE_CONTRIBUTOR_GUIDE.md § Intents](./OS_SPINE_CONTRIBUTOR_GUIDE.md) |
| Style a workspace | [WORKSPACE_EXPERIENCE_V1.md § CSS Properties](./WORKSPACE_EXPERIENCE_V1.md#13-css-custom-properties-reference) |
| Use a glass panel | `import { OSGlassPanel } from '../os/ui'` |
| Scaffold an OS object | `npm run scaffold:os-object` |
| See intent mapping example | [IntentMapping.example.ts](../frontend/tools/os-spine-bundle/templates/IntentMapping.example.ts) |
| See activity mapping example | [ActivityMapping.example.ts](../frontend/tools/os-spine-bundle/templates/ActivityMapping.example.ts) |
| Run OS tests | `npm run test:os:smoke` |
| Read the spec in terminal | `npm run spine:docs` |

---

*Last updated: January 2025*  
*Test count: 325 tests | 26 files | 0 failures*
