# Shell Integrity Recovery — Phases 21-25

**Date**: 2026-03-17
**Branch base**: `post-r3/w4-backend-truth-slice` (commit `14d00c50b`)
**Baseline**: 4,817 vitest tests passing, Phase 20 frozen
**Constitutional truth**: Parcel work collapses into the OS-owned Property Workbench. The shell owns launch/routing/chrome. Suites own domain context. Cross-lane ownership stays obvious.

---

## Dependency Graph

```
Phase 21 (diagnostic)
    ↓
Phase 22 (wiring fixes)
    ↓
  ┌─┴─┐
  23   24  (parallel)
  └─┬─┘
    ↓
Phase 25 (governance lock)
```

Critical path: 21 → 22 → (23 ‖ 24) → 25

---

## Phase 21 — Shell Truth Freeze

**Branch**: `post-r3/phase-21-shell-truth-freeze`
**Duration**: ~2 hours
**New tests**: 12-18
**Source changes**: 0 files
**Depends on**: None

### Goal

Prove the 8 shell assumptions with diagnostic-only tests. No source edits. No data-testid helpers. No fixes. Assertions are phrased as audit questions, not pre-approved truths.

### Audit Questions

| # | Question | Test Approach |
|---|----------|---------------|
| 1 | Does the desktop render launch surfaces? | Assert `StageZeroState` + `DesktopIconGrid` are imported and used in `Desktop.tsx` |
| 2 | Does the dock contain zero utilities? | Assert `Taskbar.tsx` does NOT import Clock, NotificationBell, SentinelChip, Settings, or Search |
| 3 | Does the top bar contain Clock/NotificationBell/SentinelChip? | Assert `Desktop.tsx` renders `DesktopTopSystemBar` containing all three + Search + ControlCenter + Profile |
| 4 | Do suite windows open near-full-stage? | Assert `MODULE_OBJECT_TYPES['suite-forge'].objectType === 'suite-workspace'` for all 5 suite IDs. Sizing is tested indirectly via classification — `getModuleWindowSize` is module-private and cannot be imported. Defer direct sizing test to Phase 22 where the export can be added. |
| 5 | Does the Property Workbench open maximized? | Assert `MODULE_OBJECT_TYPES['property-workbench'].objectType === 'tier0-workbench'`. Direct `getModuleWindowSize` call deferred to Phase 22. |
| 6 | Do os-pilot/os-trace/os-canon open in-shell? | Assert all 3 exist in `MODULE_REGISTRY` with `objectType: 'os-feature-window'` |
| 7 | Do parcel actions collapse into the Workbench? | Assert `evaluateSpawnIntent('forge').decision === 'route-to-workbench'`. Repeat for `atlas`, `dais`. Assert `evaluateSpawnIntent('suite-forge').decision === 'open'` (suite homes are standalone). Import from `../../stores/desktopStore`. |
| 8 | Are there hardcoded z-depth classes in governed shell files? | Scan `GenericModuleHost.tsx`, `Window.tsx`, `Taskbar.tsx`, `Desktop.tsx` for regex `/\bz-\d+\b/` and `/z-\[\d+\]/`. Assert zero findings per file; mark each file with findings as `it.todo("deferred to Phase 22: N z-depth classes in <file>")`. |

### Test File

`frontend/apps/os-shell/src/__tests__/shell/shellTruthAudit.contract.test.ts`

### Definition of Done

- All 8 audit questions have at least one test
- Tests that PASS document the assumption holds
- Tests that FAIL use `it.skip` or `it.todo` with a documented reason and a reference to Phase 22
- Maximum one known expected-fail, only if documented as deferred to Phase 22
- No source files modified. Period.
- `getModuleWindowSize` sizing tests deferred to Phase 22 (function is module-private; tested indirectly via `MODULE_OBJECT_TYPES` classification)

### Acceptance

```bash
npx vitest run "shellTruthAudit.contract"
```

### Agent Strategy

Single Claude Code session. Pure read + test-write.

### Out of Scope

No fixes. No "while I'm here" improvements. No data-testid additions. No imports of components under test. File-content and import-graph assertions only.

---

## Phase 22 — Shell Chrome + Windowing Contract

**Branch**: `post-r3/phase-22-shell-chrome-contract`
**Duration**: 3-4 hours
**New tests**: 12-15
**Source changes**: 4-5 files (includes `desktopStore.ts` export)
**Depends on**: Phase 21

### Goal

Eliminate hardcoded shell/window depth classes. Promote single z-index authority in governed files. Export `getModuleWindowSize` for testability. Fix any gaps Phase 21 identified.

### What Gets Fixed

1. **Z-index cleanup** — Replace hardcoded Tailwind `z-*` classes (both `z-10` and `z-[10]` forms) in:
   - `GenericModuleHost.tsx` (lines 18, 54, 149, 208)
   - `Window.tsx` (lines 301, 315)
   - Replace with scoped inline styles using local constants: `const WINDOW_INTERNAL_Z = { controls: 50, titleCenter: 10 }`

2. **Extend ZIndexOrdering test** — Add `Window.tsx` and `GenericModuleHost.tsx` to `SHELL_FILES` list in `ZIndexOrdering.test.tsx`. Un-skip any Phase 21 diagnostic tests that are now fixed.

3. **Verify registrations** — Confirm `os-pilot`, `os-trace`, `os-canon` entries in `MODULE_ENTRIES`. No change expected unless Phase 21 found a gap.

4. **Export `getModuleWindowSize`** — Add `export` to `getModuleWindowSize` in `desktopStore.ts` so Phase 21's deferred sizing tests can now run. Add direct sizing assertions: `getModuleWindowSize('suite-forge')` returns near-full-stage, `getModuleWindowSize('property-workbench')` returns `maximized: true`.

### Z-Index Detection Rule

The spec defines the real rule as: **no hardcoded Tailwind z-depth classes in governed shell/window chrome files**. Detection must catch both forms:
- Numeric utility classes: `z-10`, `z-20`, `z-50` (regex: `/\bz-\d+\b/`)
- Bracket classes: `z-[10]`, `z-[9999]` (regex: `/z-\[\d+\]/`)

### Test File

`frontend/apps/os-shell/src/__tests__/shell/shellChrome.contract.test.ts`

### Definition of Done

1. Zero hardcoded Tailwind z-depth classes in governed target files
2. All Phase 21 shellTruthAudit tests pass green (no more skips)
3. Window-internal layering expressed through constants/styles, not utility depth classes

### Acceptance

```bash
npx vitest run "shellChrome.contract" "shellTruthAudit.contract" "ZIndexOrdering"
rg -n '\bz-\d+\b|z-\[\d+\]' frontend/apps/os-shell/src/shell -g '*.tsx' -g '*.ts'
```

### Agent Strategy

Claude Code for multi-file z-index sweep + test creation. Optional Copilot for single-file edits (`GenericModuleHost.tsx`, `Window.tsx`).

### Out of Scope

No Dock restructuring. No Top Bar redesign. No new module registrations beyond what Phase 21 identified as missing.

---

## Phase 23 — Tier-0 Workbench Real Hosting Gate

**Branch**: `post-r3/phase-23-workbench-hosting-gate`
**Duration**: 2-3 hours
**New tests**: 10-12
**Source changes**: 1-2 files (data-testid additions only)
**Depends on**: Phase 22
**Can parallelize with**: Phase 24

### Goal

Formal pass/fail gate for real embedded surfaces in the Property Workbench. The governance docs call out Forge, Atlas, and Dais explicitly as the primary gate. Other tabs are secondary completeness checks.

### Primary Gate (MUST PASS)

For each of these 3 tabs, render the tab component and assert:
1. It does NOT render `PlaceholderModule` or a component with `data-testid="placeholder-module"`
2. It renders at least one interactive element (`button`, `select`, or `input`)
3. It renders a root container with a meaningful `data-testid`

| Tab | Expected Surface |
|-----|-----------------|
| Forge | CostForge / analytical workbench UI |
| Atlas | GIS Viewer / map surface UI |
| Dais | Workflow / appeals UI |

### Secondary Completeness (SHOULD PASS)

| Tab | Assertion |
|-----|-----------|
| Dossier | Renders real/non-placeholder surface if it exists |
| Pilot | Renders real/non-placeholder surface if it exists |

### Registry Assertions (inventory only)

| Tab | Assertion |
|-----|-----------|
| Clerk | Tab ID exists in `VALID_WORKBENCH_TAB_IDS` |
| Treasury | Tab ID exists in `VALID_WORKBENCH_TAB_IDS` |
| Audit | Tab ID exists in `VALID_WORKBENCH_TAB_IDS` |

### Workbench-Level Tests

1. `SuiteCompass` tab items match `VALID_WORKBENCH_TAB_IDS` from `suiteRegistry.ts`
2. Workbench opens maximized (`getModuleWindowSize('property-workbench')` returns `maximized: true` — available after Phase 22 export)

### Test File

`frontend/apps/os-shell/src/__tests__/workbench/workbenchRealHosting.gate.test.tsx`

### Definition of Done

- 3 primary gate tests pass (Forge, Atlas, Dais host real surfaces)
- 2 secondary completeness tests pass or are documented as `it.todo` with reason
- 3 registry assertions pass
- Workbench opens maximized
- Zero tabs in primary gate render PlaceholderModule

### Acceptance

```bash
npx vitest run "workbenchRealHosting.gate"
```

### Agent Strategy

Single Claude Code session. Use `it.each` over primary gate tabs.

### Out of Scope

No tab content redesign. No new workbench features. Clerk/Treasury/Audit are registry assertions only — they are not required to be interactive surfaces today unless separately mandated.

---

## Phase 24 — County Operations Scene Orchestration

**Branch**: `post-r3/phase-24-county-ops-scene`
**Duration**: 2-3 hours
**New tests**: 10-12
**Source changes**: 1-2 files (data-testid additions only)
**Depends on**: Phase 22
**Can parallelize with**: Phase 23

### Goal

Prove `StageZeroState` matches the County Operations Scene contract. Includes at least one direct scene-store orchestration proof beyond rendering checks.

### Rendering Tests

| # | Assertion |
|---|-----------|
| 1 | GIS center / county map area renders |
| 2 | Recent Work panel renders |
| 3 | Today's Work / Quick Actions render |
| 4 | County status strip renders |
| 5 | Search is NOT the hero surface (no prominent search bar in StageZeroState; search lives in Ctrl+K Command Palette) |

### Scene Orchestration Tests

| # | Assertion |
|---|-----------|
| 6 | Quick Action buttons call `activateModule()`, not `navigate()` |
| 7 | Recent parcel click opens workbench window via `activateModule('property-workbench', ...)` |
| 8 | `activateScene('county-ops')` (or the equivalent default scene ID from `sceneStore`) opens the predefined window set. Assert the scene-store state transitions and that `activateModule` is called for each window in the set. Name one concrete scene — do not test an abstract "any scene." |

### Test File

`frontend/apps/os-shell/src/__tests__/home/countyOpsScene.contract.test.tsx`

### Definition of Done

- 4 sections render (map, recent work, quick actions, county status)
- Quick actions use `activateModule()`, not `navigate()`
- At least one scene-store orchestration proof exists
- No search-first hero layout

### Acceptance

```bash
npx vitest run "countyOpsScene.contract"
```

### Agent Strategy

Single Claude Code session. Can run in parallel with Phase 23 since they touch different surfaces.

### Out of Scope

No StageZeroState redesign. No new scene definitions. No UI changes beyond data-testid additions for test targeting. Both Phases 23 and 24 MUST NOT make opportunistic edits to shared shell primitives (`desktopStore.ts`, `moduleActivation.ts`, `moduleComponents.tsx`). Use existing shared render helpers and providers for workbench and scene surfaces — do not invent ad hoc mocks or alternate wrappers that would turn the "real hosting gate" into a "mock hosting gate."

---

## Phase 25 — Anti-Drift Verification + Governance Hardening

**Branch**: `post-r3/phase-25-anti-drift-governance`
**Duration**: 2-3 hours
**New tests**: 10-14
**Source changes**: 0 files
**Depends on**: Phases 21-24 all complete

### Goal

Lock final behavior with non-duplicative proofs. Prove concrete paths, not just count structures.

### Launch/Surface Truth Table

For each module type, verify spawn behavior:

| Module Type | Example | Expected `evaluateSpawnIntent` | Expected Sizing |
|------------|---------|-------------------------------|-----------------|
| Suite | `suite-forge` | `'open'` | near-full-stage |
| Workbench | `property-workbench` | `'open'` | maximized |
| OS Feature | `os-pilot` | `'open'` | near-full-stage |
| Parcel-scoped | `forge` | `'route-to-workbench'` | N/A (hosted) |

### Ownership Contracts

| Domain | Assertion |
|--------|-----------|
| Dock | `CONSTITUTIONAL_SUITES.length === 5`, IDs = `['forge', 'atlas', 'dais', 'dossier', 'gpt']` |
| Top Bar | `Desktop.tsx` renders Clock, SentinelChip, NotificationBell |
| Workbench | `VALID_WORKBENCH_TAB_IDS.length === 9` and matches expected set |

### Registration Completeness

- Every suite has `suite-${id}` in `MODULE_REGISTRY`
- Every OS feature has `os-${id}` in `MODULE_REGISTRY`
- `'property-workbench'` is registered
- No orphaned entries (every registry key resolves to a component)
- Registry count assertion uses `>=` minimum, not exact count (registry grows over time)

### 3-Clicks-to-Value (Canonical Path Tests)

Instead of abstract structural math, prove 1-2 concrete user flows:

1. **Dock → Suite → Workbench**: Click Forge in dock → suite window opens → click parcel-scoped action → `activateModule('property-workbench', { metadata: { tabId: 'forge', parcelId } })` routes to Property Workbench with `activeTabId: 'forge'`
2. **Home → Recent Parcel → Workbench**: Click recent parcel in StageZeroState → `activateModule('property-workbench', { metadata: { parcelId: '<clicked-parcel-id>' } })` opens maximized workbench with parcel context containing the clicked parcel identifier

These are traced through the activation/spawn APIs, not full DOM renders. Assert exact payload shapes, not just call existence.

### Test File

`frontend/apps/os-shell/src/__tests__/shell/shellAntiDrift.contract.test.ts`

### Definition of Done

- Truth table covers all 4 module types with expected spawn behavior
- Ownership contracts: dock (5 suites), top bar (3 system utilities), workbench (9 tabs)
- Registration completeness: no orphaned entries, no missing components
- 2 canonical 3-click path tests pass
- Full `npx vitest run` passes with 0 new regressions

### Acceptance

```bash
npx vitest run "shellAntiDrift.contract"
npx vitest run  # full suite — 0 new regressions
```

### Agent Strategy

Single Claude Code session. Pure logic/import tests, no DOM rendering.

### Out of Scope

Do not re-test tab internals from Phase 23. Do not re-test rendering from Phase 24. No screenshot gates in this phase (optional future enhancement).

---

## Summary

| Phase | Branch | Tests | Source | Duration | Depends On |
|-------|--------|-------|--------|----------|-----------|
| 21 | `phase-21-shell-truth-freeze` | 12-18 | 0 files | 2h | None |
| 22 | `phase-22-shell-chrome-contract` | 12-15 | 4-5 files | 3-4h | 21 |
| 23 | `phase-23-workbench-hosting-gate` | 10-12 | 1-2 files | 2-3h | 22 |
| 24 | `phase-24-county-ops-scene` | 10-12 | 1-2 files | 2-3h | 22 |
| 25 | `phase-25-anti-drift-governance` | 10-14 | 0 files | 2-3h | 21-24 |
| **Total** | | **54-71** | **6-9 files** | **11-15h** | |

## Tool Split

- **Claude Code**: Multi-file shell wiring, module activation, window manager logic, scene orchestration, contract tests, build/test coordination
- **Copilot**: Single-file UI contract edits, data-testid additions, minor route/hook wiring
- **Codex**: Only after structure stabilizes; use for repetitive cleanup, not critical-path architecture

## Non-Negotiables

- Reuse-first, no hidden rebuilds
- Parcel work collapses into Workbench
- Dock launches; Top Bar holds global truth
- Dais / Forge / Dossier ownership stays constitutionally obvious
- Tests land with code, not afterward
- Phases 23 and 24 MUST NOT make opportunistic edits to shared shell primitives

## Explicitly Out of Scope

- No suite-home rebuilds
- No marketplace/plugin expansion
- No ML detours
- No repo-wide crusades
- No breaking the Dais/Forge/Dossier write-lane law
