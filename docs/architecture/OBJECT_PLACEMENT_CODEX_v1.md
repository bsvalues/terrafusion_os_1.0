# 3-6-9 Object Placement Codex v1

> Machine-enforceable placement law for every object in TerraFusion OS.

**Source of Truth**: `frontend/apps/os-shell/src/contracts/objectPlacement.ts`
**Governance Tests**: `os-platform/core/tests/` (5 test files, 265+ assertions)

---

## The Three Laws

| # | Law | Question | Enforced By |
|---|-----|----------|-------------|
| **3** | Identity | What IS this object? | `TerraFusionObjectType` (15 types) |
| **6** | Layer | Where does it LIVE? | `TerraFusionLayer` (6 layers) + `RenderMode` |
| **9** | Completion | Can the user FINISH work? | `completionRequired` + `evidenceRequired` + `generateCompletionReport()` |

---

## 15 Canonical Object Types

Precedence rules prevent classification fights:

| Type | Layer | Render | Parcel? | Completion? | Evidence? |
|------|-------|--------|---------|-------------|-----------|
| `os-shell-surface` | layer-1-shell | always-visible | No | No | No |
| `home-scene` | layer-2-home | route-activated | No | No | No |
| `suite-workspace` | layer-3-suite | window-spawned | No | Yes | No |
| `tier0-workbench` | layer-4-workbench | window-spawned | Yes | Yes | Yes |
| `parcel-scoped-app` | layer-4-workbench | window-spawned | Yes | Yes | Yes |
| `cross-parcel-operational-app` | layer-5-application | window-spawned | No | Yes | No |
| `os-feature-window` | layer-5-application | window-spawned | No | Yes | No |
| `global-signal` | layer-1-shell | always-visible | No | No | No |
| `workflow-capability-service` | no-direct-ui | headless | No | No | No |
| `invisible-infrastructure-service` | no-direct-ui | headless | No | No | No |
| `audit-evidence-surface` | layer-4-workbench | overlay | Yes | Yes | Yes |
| `notification-alert` | layer-1-shell | toast-ephemeral | No | No | No |
| `domain-router` | layer-3-suite | route-activated | No | No | No |
| `state-signal-service` | no-direct-ui | headless | No | No | No |
| `batch-calibration-tool` | layer-5-application | window-spawned | No | Yes | Yes |

### Precedence Rules

- Tab-hosted parcel UI = `parcel-scoped-app` (not `tier0-workbench`)
- `tier0-workbench` = ONLY the host surface itself
- `notification-alert` = ephemeral signal delivery (toast)
- `global-signal` = persistent shell status (clock, connectivity, mode indicator)
- `state-signal-service` = shell mode / theme / connectivity state logic (headless)
- `workflow-capability-service` = domain logic (export, sync, batch) with no UI
- `invisible-infrastructure-service` = pure plumbing (auth, telemetry, cache)
- `batch-calibration-tool` = only if unique placement law vs `cross-parcel-operational-app`

---

## Two-Axis Model

Every classified object declares TWO axes:

| Axis | Field | Answers |
|------|-------|---------|
| **Primary** | `objectType` | What it IS |
| **Secondary** | `hostSurface` | Where it is HOSTED (optional) |

Example: CostForge on a parcel workbench tab:
- `objectType: 'parcel-scoped-app'`
- `hostSurface: 'tier0-workbench'`

Objects that ARE a host (like the workbench itself) have no `hostSurface`.

---

## Layer Ownership

```
Layer 1: Shell         os-shell-surface, global-signal, notification-alert
Layer 2: Home          home-scene
Layer 3: Suite         suite-workspace, domain-router
Layer 4: Workbench     tier0-workbench, parcel-scoped-app, audit-evidence-surface
Layer 5: Application   cross-parcel-operational-app, os-feature-window, batch-calibration-tool
No UI:                 workflow-capability-service, invisible-infrastructure-service, state-signal-service
```

---

## Anti-Drift Rules

| Rule | Enforcement |
|------|-------------|
| Shell chrome imports ONLY shell-layer types | Static analysis in codex Suite 4 |
| Suite homes do not import other suite domains | Suite boundary enforcement (Phase 8) |
| Workbench tabs contain ONLY `parcel-scoped-app` types | Workbench host boundary (Phase 7) |
| `cross-parcel-operational-app` never inside workbench | Workbench host validation |
| `no-direct-ui` objects never appear in routes/renders | Type-level enforcement |
| No forked truth tables | Codex Suite 4 verifies no re-export of shellMode/suiteRegistry constants |
| Suite windows render ONLY `suite-workspace` objects | `validateSuiteRendering()` (Phase 8) |

---

## Completion + Evidence Requirements

Objects with `completionRequired: true` must have:
- `entryPath` — a way for the user to reach the object (e.g. `desktop-icon:forge`, `workbench-tab:atlas`)
- `hasActionableUI: true` — interactive controls that let the user do real work

Objects with `evidenceRequired: true` must additionally have:
- `hasEvidenceExport: true` — the ability to produce evidence artifacts

### ObjectClassification (Phase 10)

```typescript
interface ObjectClassification {
  objectType: TerraFusionObjectType;
  hostSurface?: TerraFusionObjectType;
  entryPath?: string;           // Required for completionRequired types
  hasActionableUI?: boolean;    // Required for completionRequired types
  hasEvidenceExport?: boolean;  // Required for evidenceRequired types
}
```

Validated by `validateCompletion()` helper and `generateCompletionReport()`.

### Completion Report

`generateCompletionReport()` returns a `CompletionReport`:

```typescript
interface CompletionReportEntry {
  moduleId: string;
  status: 'complete' | 'incomplete' | 'exempt';
  missing: string[];
}

interface CompletionReport {
  totalModules: number;
  complete: number;
  incomplete: number;
  exempt: number;
  entries: CompletionReportEntry[];
}
```

Current state: **0 incomplete modules** across 40+ classified surfaces.

---

## Boundary Validators

### Workbench Host Boundary (Phase 7)

`validateWorkbenchHost(tabId)` enforces that only `parcel-scoped-app` and `audit-evidence-surface` types render inside the tier-0 workbench, and they must declare `hostSurface: 'tier0-workbench'`.

### Suite Boundary Enforcement (Phase 8)

`validateSuiteRendering(moduleId)` enforces that suite window contexts only render `suite-workspace` classified objects. Uses `SUITE_MODULE_IDS` set (the 5 constitutional suites).

Both return `null` for lawful placements or a violation object describing the breach.

---

## Full Routing Matrix

### Layer 1: Shell (always-visible)

| Surface | Module ID | Object Type |
|---------|-----------|-------------|
| Taskbar | `taskbar` | os-shell-surface |
| Dock | `dock` | os-shell-surface |
| Start Menu | `start-menu` | os-shell-surface |
| Top Bar | `top-bar` | os-shell-surface |

### Layer 2: Home (route-activated)

| Surface | Module ID | Object Type |
|---------|-----------|-------------|
| Home Scene | `home-scene` | home-scene |
| Desktop Scene | `desktop-scene` | home-scene |

### Layer 3: Suites (window-spawned)

| Surface | Module ID | Object Type | Entry Path |
|---------|-----------|-------------|------------|
| TerraForge Suite | `suite-forge` | suite-workspace | desktop-icon:forge |
| TerraAtlas Suite | `suite-atlas` | suite-workspace | desktop-icon:atlas |
| TerraDais Suite | `suite-dais` | suite-workspace | desktop-icon:dais |
| TerraDossier Suite | `suite-dossier` | suite-workspace | desktop-icon:dossier |
| TerraGPT Suite | `suite-gpt` | suite-workspace | desktop-icon:gpt |

### Layer 4: Workbench (window-spawned, parcel-scoped)

| Surface | Module ID | Object Type | Host | Entry Path |
|---------|-----------|-------------|------|------------|
| Property Workbench | `property-workbench` | tier0-workbench | - | desktop-icon:workbench |
| Summary Tab | `summary` | parcel-scoped-app | tier0-workbench | workbench-tab:summary |
| Forge Tab | `forge` | parcel-scoped-app | tier0-workbench | workbench-tab:forge |
| Atlas Tab | `atlas` | parcel-scoped-app | tier0-workbench | workbench-tab:atlas |
| Dais Tab | `dais` | parcel-scoped-app | tier0-workbench | workbench-tab:dais |
| Clerk Tab | `clerk` | parcel-scoped-app | tier0-workbench | workbench-tab:clerk |
| Treasury Tab | `treasury` | parcel-scoped-app | tier0-workbench | workbench-tab:treasury |
| Audit Tab | `audit` | parcel-scoped-app | tier0-workbench | workbench-tab:audit |
| Dossier Tab | `dossier` | parcel-scoped-app | tier0-workbench | workbench-tab:dossier |
| Pilot Tab | `pilot` | parcel-scoped-app | tier0-workbench | workbench-tab:pilot |

### Layer 5: Applications (window-spawned)

#### OS Feature Windows

| Surface | Module ID | Object Type | Entry Path |
|---------|-----------|-------------|------------|
| TerraPilot | `os-pilot` | os-feature-window | desktop-icon:pilot |
| TerraTrace | `os-trace` | os-feature-window | desktop-icon:trace |
| TerraCanon | `os-canon` | os-feature-window | desktop-icon:canon |
| Settings | `settings` | os-feature-window | desktop-icon:settings |
| Shortcuts/Help | `shortcuts-help` | os-feature-window | desktop-icon:shortcuts-help |
| Plugin Manager | `plugin-manager` | os-feature-window | desktop-icon:plugin-manager |

#### Cross-Parcel Operational Apps

| Surface | Module ID | Object Type | Entry Path |
|---------|-----------|-------------|------------|
| Federation Dashboard | `federation-dashboard` | cross-parcel-operational-app | desktop-icon:federation-dashboard |
| CostForge | `costforge` | cross-parcel-operational-app | desktop-icon:costforge |
| TerraGaia | `terra-gaia` | cross-parcel-operational-app | desktop-icon:terra-gaia |
| Levy Calculator | `levy-calculator` | cross-parcel-operational-app | desktop-icon:levy-calculator |
| GIS Viewer | `gis-viewer` | cross-parcel-operational-app | desktop-icon:gis-viewer |
| Document Manager | `document-manager` | cross-parcel-operational-app | desktop-icon:document-manager |
| Reporting | `reporting` | cross-parcel-operational-app | desktop-icon:reporting |
| Atlas AI | `atlas-ai` | cross-parcel-operational-app | desktop-icon:atlas-ai |
| Marketplace | `marketplace` | cross-parcel-operational-app | desktop-icon:marketplace |
| Counties | `counties` | cross-parcel-operational-app | desktop-icon:counties |
| Government Architecture | `government-architecture` | cross-parcel-operational-app | desktop-icon:government-architecture |
| Sovereign Dashboard | `sovereign-dashboard` | cross-parcel-operational-app | desktop-icon:sovereign-dashboard |
| AxiomFS | `axiom-fs` | cross-parcel-operational-app | desktop-icon:axiom-fs |

**Total classified surfaces**: 46 (4 shell + 2 scenes + 5 suites + 1 workbench + 9 tabs + 6 OS features + 13 cross-parcel + 6 headless exempt)

---

## Governance Test Suite

5 test files, 265+ assertions across all codex phases:

### 1. Object Placement Codex (`object-placement-codex.test.mjs`)

| Suite | Assertions | Validates |
|-------|------------|-----------|
| Policy Table Completeness | ~15 | Every type has a policy entry with all required fields |
| Unified Inventory Coverage | ~20 | Every registered surface is classified |
| Layer + Host Law | ~30 | Classifications match policy, host relationships valid |
| Anti-Drift Static Analysis | ~20 | No forked truths, no cross-boundary imports |
| Completion + Evidence | ~15 | Correct flags per type |
| Registry-Contract Cross-Ref | ~10 | suiteRegistry annotations match contract |

### 2. Workbench Host Boundary (`workbench-host-boundary.test.mjs`)

| Suite | Assertions | Validates |
|-------|------------|-----------|
| Validator Contract | ~10 | Function exists, returns correct types |
| All Tabs Lawful | ~10 | Every workbench tab passes validation |
| Boundary Rejection | ~10 | Non-workbench types are rejected |
| Static Analysis | ~10 | PropertyWorkbenchWindow only renders lawful types |

### 3. Suite Boundary Enforcement (`suite-boundary-enforcement.test.mjs`)

| Suite | Assertions | Validates |
|-------|------------|-----------|
| Validator Contract | ~8 | validateSuiteRendering exists, SUITE_MODULE_IDS exported |
| Constitutional Suite Ids | ~6 | All 5 suites classified as suite-workspace |
| Boundary Rejection | ~6 | Non-suite types rejected at boundary |
| Static Source Analysis | ~8 | moduleComponents only renders suite-workspace types |

### 4. Launcher Routing Enforcement (`launcher-routing-enforcement.test.mjs`)

| Suite | Assertions | Validates |
|-------|------------|-----------|
| Routing Table | ~15 | Every MODULE_OBJECT_TYPES entry has valid routing |
| Layer Consistency | ~15 | Routing matches PLACEMENT_POLICY layers |
| Host Surface Law | ~10 | Host declarations match policy |

### 5. Completion Reporting (`completion-reporting.test.mjs`)

| Suite | Assertions | Validates |
|-------|------------|-----------|
| generateCompletionReport Contract | ~8 | Function + types exist, barrel-exported |
| completionRequired Metadata | ~30 | Every completionRequired module has entryPath + hasActionableUI |
| evidenceRequired Metadata | ~10 | Every evidenceRequired module has hasEvidenceExport |
| Exempt Classification | ~8 | Shell/scene/headless types correctly exempt |
| Report Generator Logic | ~7 | Iterates types, cross-refs policy, checks fields |
| Zero Incomplete | ~4 | 0 incomplete modules, counts match expectations |

### Running Tests

```bash
# Individual test file
node --test os-platform/core/tests/object-placement-codex.test.mjs
node --test os-platform/core/tests/workbench-host-boundary.test.mjs
node --test os-platform/core/tests/suite-boundary-enforcement.test.mjs
node --test os-platform/core/tests/launcher-routing-enforcement.test.mjs
node --test os-platform/core/tests/completion-reporting.test.mjs

# All codex governance tests
node --test os-platform/core/tests/*.test.mjs
```

---

## Validation Helpers

| Function | Phase | Purpose |
|----------|-------|---------|
| `validatePlacement()` | 6 | Check layer + render mode + host surface |
| `validateCompletion()` | 6 | Check completion metadata for required types |
| `detectDrift()` | 6 | Detect layer/render placement drift |
| `requiresWorkbenchHost()` | 6 | Query if type must live in workbench |
| `isStandaloneAllowed()` | 6 | Query if type may open standalone |
| `isParcelScoped()` | 6 | Query if type operates on single parcel |
| `getAllowedRenderMode()` | 6 | Get expected render mode for type |
| `getObjectClassification()` | 6 | Look up classification by module ID |
| `validateWorkbenchHost()` | 7 | Enforce workbench tab boundary law |
| `validateSuiteRendering()` | 8 | Enforce suite window boundary law |
| `generateCompletionReport()` | 10 | Audit all modules for completion compliance |
