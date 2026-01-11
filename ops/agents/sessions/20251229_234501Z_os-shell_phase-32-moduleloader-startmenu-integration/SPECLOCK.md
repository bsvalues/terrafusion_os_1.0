# SpecLock: phase-3.2-moduleloader-startmenu-integration

> Session: \`20251229_234501Z_os-shell_phase-32-moduleloader-startmenu-integration\`
> Status: **FROZEN**

---

## Scope

Files in scope for modification:

\`\`\`
frontend/apps/os-shell/src/components/desktop/ModuleLoader.tsx    # NEW
frontend/apps/os-shell/src/components/desktop/__tests__/ModuleLoader.test.tsx  # NEW
frontend/apps/os-shell/src/stores/startMenuStore.ts               # MODIFY (add launchModule action)
frontend/apps/os-shell/src/stores/__tests__/startMenuStore.test.ts # MODIFY (add launch tests)
frontend/electron/package.json                                     # MODIFY (add no-op test script)
\`\`\`

---

## Public API / Component Contracts

### ModuleLoader Component

**Location**: \`frontend/apps/os-shell/src/components/desktop/ModuleLoader.tsx\`

**Purpose**: Observes moduleRegistryStore state and renders appropriate UI for module loading lifecycle.

#### Props

| Prop | Type | Required | Default | Description |
|:-----|:-----|:---------|:--------|:------------|
| \`moduleId\` | \`string \| null\` | Yes | - | ID of module to load, or null for no selection |
| \`className\` | \`string\` | No | \`''\` | Additional CSS class names |
| \`onLoadSuccess\` | \`(module: LoadedModule) => void\` | No | - | Callback when module loads successfully |
| \`onLoadError\` | \`(error: Error) => void\` | No | - | Callback when module fails to load |

#### Internal State Machine

\`\`\`
┌──────────────┐    moduleId=null     ┌──────────────┐
│    EMPTY     │◄─────────────────────│     ANY      │
└──────────────┘                      └──────────────┘
       │ moduleId!==null
       ▼
┌──────────────┐    loadingState='loading'
│   LOADING    │──────────────────────┐
└──────────────┘                      │
       │ loadingState='loaded'        │ loadingState='error'
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│   SUCCESS    │              │    ERROR     │
│ (render mod) │              │ (retry btn)  │
└──────────────┘              └──────────────┘
       ▲                              │ retry click
       └──────────────────────────────┘
\`\`\`

#### Rendered States

| State | Renders | Actions |
|:------|:--------|:--------|
| \`EMPTY\` | Empty fragment or placeholder | None |
| \`LOADING\` | Spinner + "Loading {moduleName}..." | None |
| \`SUCCESS\` | Module component via dynamic render | None |
| \`ERROR\` | Error message + Retry button | Retry triggers \`retryLoad(moduleId)\` |

---

### StartMenu Integration Contract

**Location**: \`frontend/apps/os-shell/src/stores/startMenuStore.ts\`

**New Action**: \`launchModule(moduleId: string): void\`

| Action | Parameters | Side Effects | Store Changes |
|:-------|:-----------|:-------------|:--------------|
| \`launchModule\` | \`moduleId: string\` | Closes menu + clears search | Sets \`selectedModuleId: moduleId\` |

**New State**:

| Field | Type | Initial | Description |
|:------|:-----|:--------|:------------|
| \`selectedModuleId\` | \`string \| null\` | \`null\` | Currently selected module for loading |

**Behavior**:
1. User clicks app in StartMenu → \`launchModule(appId)\` is called
2. Store sets \`selectedModuleId = appId\`
3. Store calls \`close()\` (menu closes, search clears)
4. ModuleLoader observes \`selectedModuleId\` and initiates \`moduleRegistryStore.loadModule(appId)\`

---

## Error Model

| Code | Scenario | User Message | Recovery |
|:-----|:---------|:-------------|:---------|
| \`MODULE_NOT_REGISTERED\` | moduleId not in registry | "Module not found. It may have been removed." | None (user must select valid module) |
| \`MODULE_LOAD_FAILED\` | Loader throws | "Failed to load {moduleName}. Please try again." | Retry button |
| \`MODULE_TIMEOUT\` | Load exceeds 30s | "Module took too long to load." | Retry button |

---

## Telemetry Contracts

### Log Events (log-first breadcrumbs, no PII)

| Event | Level | Fields | When |
|:------|:------|:-------|:-----|
| \`module_load_started\` | INFO | \`{ moduleId, source: 'startmenu' \| 'direct' }\` | loadModule called |
| \`module_load_success\` | INFO | \`{ moduleId, durationMs }\` | Module loaded successfully |
| \`module_load_error\` | ERROR | \`{ moduleId, errorType, errorMessage }\` | Module load failed |
| \`module_load_retry\` | INFO | \`{ moduleId, attemptNumber }\` | User clicked retry |
| \`module_cache_hit\` | DEBUG | \`{ moduleId }\` | Module returned from cache |

**PII Rules**: 
- ❌ NEVER log user IDs, county IDs, or session tokens
- ✅ OK to log moduleId (system identifier, not user data)

---

## Backward Compat Rules

- **Breaking changes**: NONE
- StartMenu existing props/actions remain unchanged
- moduleRegistryStore API unchanged (already has loadModule, retryLoad)

---

## Non-goals

- ❌ Module hot-reload (out of scope for Phase 3.2)
- ❌ Module prefetching/preloading (future optimization)
- ❌ Module permission prompts (handled at registry level)
- ❌ Multi-module loading (one at a time for now)
- ❌ Module unloading on menu reopen (modules stay loaded)

---

## Test Success Criteria (RED → GREEN)

### Integration Tests Required

| Test ID | Description | Assertion |
|:--------|:------------|:----------|
| \`INT-001\` | Selecting module triggers loader lifecycle | \`selectedModuleId\` set and \`loadModule\` called with correct ID |
| \`INT-002\` | ModuleLoader shows loading state | Spinner visible, loading text shown |
| \`INT-003\` | ModuleLoader shows success state | Module component rendered |
| \`INT-004\` | ModuleLoader shows error + retry | Error message + retry button visible |
| \`INT-005\` | Retry button clears error and reloads | \`retryLoad\` called, loading state shown |
| \`INT-006\` | Cache hit returns immediately | No loader called on second load |
| \`INT-007\` | Null moduleId shows empty state | No side effects, stable render |

---

## Frozen At

**Status**: FROZEN

**Frozen At**: 2025-12-29T23:45:00Z

**Frozen By**: Claude Agent (Phase 3.2 Session)

---

## Amendment

**Amended At**: 2026-01-03

Clarified boundary: StartMenu does not call \`moduleRegistryStore.loadModule\`; it only selects a module and closes the menu. Module loading is initiated by the ModuleLoader observing \`selectedModuleId\`.

---

### Freeze Checklist

Before marking FROZEN:
- [x] All API surfaces documented
- [x] Error cases enumerated  
- [x] Telemetry contracts defined
- [x] Breaking changes assessed (none)
- [x] Non-goals documented
- [x] Test success criteria defined

**SPECLOCK IS FROZEN. Implementation must conform to this contract.**
