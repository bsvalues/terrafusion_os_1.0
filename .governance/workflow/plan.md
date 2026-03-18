# Plan: Workbench Shell Materials Adoption

> **Purpose:** Apply Visual Renaissance materials (LiquidPanel, TactileButton) to Workbench shell components.
> **Strategy:** "Skin the shell, not the suites" - OS-owned Tier-0 surface only.

---

* **Project:** Workbench Materials Adoption (Visual Renaissance)
* **Branch/PR:** main (direct, per solo-dev mode)
* **Date:** 2026-02-07
* **Discovery Link:** Reusing PR#255/256 research (design-system primitive adoption = NOT new initiative)
* **Research Link:** PR#256 merged LiquidPanel + TactileButton primitives

---

## Definition of Done

> What MUST be true for this to be complete?

- [x] Workbench shell adopts Liquid/Tactile primitives for 3 high-salience surfaces
- [x] ParcelContextHeader uses LiquidPanel (no raw legacy panels)
- [x] ResultPanel uses LiquidPanel with consistent padding/radius/shadow
- [x] InvocationHistory uses TactileButton; keyboard focus states intact
- [x] materialQualityGate enforced (fallback path without layout shift)
- [x] All tests pass (type-check, unit, phase83-tools)
- [x] Build succeeds
- [x] No regressions to routing truth, idle pulse, or tab order (PR#255 protections)
- [x] Gate 8 + Gate 9 pass (no GOVERNANCE OUTAGE)

---

## Phases & Tasks

### Phase 1: Test Harness (TDD)

> Write tests first for materials adoption + regression protection.

#### Task 1.1: Materials Gate Coverage

* **Description:** Write tests for LiquidPanel/TactileButton adoption in Workbench components
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/workbench/workbench.materials.test.tsx` (NEW)
* **Tests (TDD):**
  - [x] renders ParcelContextHeader with LiquidPanel when gate enabled
  - [x] falls back to legacy container when gate disabled
  - [x] InvocationHistory TactileButton preserves keyboard focus order
  - [x] ResultPanel uses LiquidPanel with consistent spacing
* **Acceptance Criteria:**
  - [x] Tests written BEFORE implementation
  - [x] Tests fail initially (no materials applied yet)

#### Task 1.2: Regression Protection

* **Description:** Add regression assertions for focus + routing stability
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/workbench/workbench.regression.test.tsx` (NEW)
* **Tests (TDD):**
  - [x] does not change tab order in Workbench shell scaffold
  - [x] route /property/:parcelId defaults to Summary without extra re-renders
* **Acceptance Criteria:**
  - [x] Tab order assertions from PR#255 extended
  - [x] Routing truth assertions remain stable

---

### Phase 2: Materials Implementation

> Apply Liquid/Tactile primitives behind quality gate.

#### Task 2.1: ParcelContextHeader Materials

* **Description:** Wrap header in LiquidPanel behind materialQualityGate
* **Files:**
  - `frontend/apps/os-shell/src/components/workbench/ParcelContextHeader.tsx`
* **Implementation:**
  - Import LiquidPanel, useMaterialQuality
  - Wrap outer div in LiquidPanel variant="infrastructure"
  - Preserve data-testid and aria attributes
  - Status chips keep semantic contrast in fallback
* **Acceptance Criteria:**
  - [x] LiquidPanel applied
  - [x] Fallback renders without layout shift
  - [x] Existing tests still pass

#### Task 2.2: ResultPanel Materials

* **Description:** Replace legacy panel container with LiquidPanel
* **Files:**
  - `frontend/apps/os-shell/src/components/workbench/ResultPanel.tsx`
* **Implementation:**
  - Import LiquidPanel
  - Apply to idle, loading, success, error states with appropriate variants
  - Normalize spacing with Liquid tokens
* **Acceptance Criteria:**
  - [x] All 4 states use LiquidPanel
  - [x] Consistent padding/radius/shadow semantics
  - [x] Error state contrast meets WCAG AA

#### Task 2.3: InvocationHistory TactileButtons

* **Description:** Convert action buttons to TactileButton
* **Files:**
  - `frontend/apps/os-shell/src/components/workbench/InvocationHistory.tsx`
* **Implementation:**
  - Import TactileButton
  - Replace Copy button with TactileButton variant="ghost"
  - Preserve aria-label and focus ring
  - Ensure keyboard tabbing order unchanged
* **Acceptance Criteria:**
  - [x] Copy buttons are TactileButtons
  - [x] Focus order preserved (regression test passes)
  - [x] Spring animation respects reduced-motion

---

### Phase 3: Verification

> Final verification before merge.

#### Task 3.1: Run All Gates

* **Description:** Execute full test suite + SEAL gates
* **Acceptance Criteria:**
  - [x] `pnpm test` passes
  - [x] `pnpm type-check` passes
  - [x] `node --test os-platform/core/tests/phase83-tools.test.mjs` passes
  - [x] Gate 8 + Gate 9 pass

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | Focus order broken by TactileButton | High | Low | Regression test catches it | Revert InvocationHistory change |
| R2 | Layout shift on fallback | Med | Low | Test both gate on/off states | Use static backdrop instead |
| R3 | WCAG contrast failure on glass | Med | Low | LiquidPanel has built-in contrast | Use getGlassTextColor() |

---

## Git Strategy

1. `test(workbench): materials gate coverage for header/panels`
2. `test(workbench): regression assertions for focus + routing`
3. `feat(workbench): apply Liquid/Tactile materials behind quality gate`

---

## Dependencies

- [x] PR#256 merged (Visual Renaissance primitives)
- [x] main branch green
- [x] Governance hardening complete (commit 066be828f)

---

# SLICE 2: Suite UX Clarity Pass

> **Purpose:** Make suite tiles navigationally unambiguous - every tile has one action that's clearly communicated.
> **Strategy:** Treat suite tiles as contractual navigation primitives, not marketing cards.

---

* **Project:** Suite Tile Routing + Intent Labeling
* **Branch/PR:** main (direct, per solo-dev mode)
* **Date:** 2026-02-07
* **Prereq:** Workbench Materials Adoption (Slice 1) complete

---

## Definition of Done

> What MUST be true for this to be complete?

- [x] Every suite tile has explicit `intent: 'workbench' | 'standalone'` metadata
- [x] Badge/label visually communicates intent ("Opens in Workbench" vs "Standalone")
- [x] All tile hrefs are valid and routed (no dead tiles)
- [x] Routing truth harness remains green
- [x] Keyboard navigation order stable
- [x] No navigation jitter
- [x] Test coverage for routing + a11y
- [x] Gate 8 + Gate 9 pass

---

## Routing Decision Framework

> Use this - no bikeshedding.

| Route to... | When... |
|-------------|---------|
| **Workbench tab** | Suite's primary job is parcel-scoped ("one parcel, one screen") |
| **Standalone home** | Cross-parcel, operational, admin, monitoring, or configuration |

If a suite does both: tile opens Standalone, and Standalone offers "Open current parcel in Workbench" as primary CTA.

---

## Phases & Tasks

### Phase 1: Test Harness (TDD)

#### Task 1.1: Routing Coverage

* **Description:** Write routing tests for suite tiles
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/shellhome/suiteTiles.routing.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] each suite tile has a valid href
  - [ ] tiles marked 'workbench' route to /property/:parcelId?tab=<x>
  - [ ] tiles marked 'standalone' route to /suite/<name>
  - [ ] OS entrypoints route to their standalone paths
  - [ ] no tile has undefined or # href
* **Acceptance Criteria:**
  - [ ] Tests written BEFORE implementation
  - [ ] Tests fail initially (intent metadata not yet applied)

#### Task 1.2: Accessibility Coverage

* **Description:** Write a11y tests for suite tiles
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/shellhome/suiteTiles.accessibility.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] tile role/name/description present
  - [ ] keyboard navigation order stable
  - [ ] focus visible on all interactive tiles
  - [ ] aria-label describes intent (e.g., "Open TerraForge in Workbench")
* **Acceptance Criteria:**
  - [ ] WCAG 2.1 AA compliance for tiles
  - [ ] Tab order matches visual order

---

### Phase 2: Intent Metadata

#### Task 2.1: Define Tile Contract

* **Description:** Add intent type to tile interface and suiteRegistry
* **Files:**
  - `frontend/apps/os-shell/src/config/suiteRegistry.ts`
  - `frontend/apps/os-shell/src/shell/home/ShellHome.tsx`
* **Implementation:**
  - Add `intent: 'workbench' | 'standalone'` to SuiteDefinition
  - Default: workbenchTab=true → intent='workbench'
  - Update Suite interface in ShellHome to include intent
* **Acceptance Criteria:**
  - [ ] Type-safe intent on every tile
  - [ ] No implicit routing decisions

#### Task 2.2: Intent Badges

* **Description:** Render clear intent badges on tiles
* **Files:**
  - `frontend/apps/os-shell/src/shell/home/ShellHome.tsx`
* **Implementation:**
  - Replace "WB" badge with "Opens in Workbench"
  - OS_ENTRYPOINTS get "Standalone" badge
  - Secondary line shows purpose (e.g., "Valuation summary")
* **Acceptance Criteria:**
  - [ ] Badge text is screenreader-accessible
  - [ ] Visual distinction between intent types

---

### Phase 3: Verification

#### Task 3.1: Run All Gates

* **Description:** Execute full test suite + SEAL gates
* **Acceptance Criteria:**
  - [ ] `pnpm test` passes
  - [ ] `pnpm type-check` passes
  - [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` passes
  - [ ] No dead tiles (all routes resolve)
  - [ ] Gate 8 + Gate 9 pass

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | Tab order broken by badge | Med | Low | a11y test catches it | Revert badge to span |
| R2 | Dead route for standalone | High | Med | Routing test fails | Create placeholder route |
| R3 | Navigation jitter | High | Low | Regression test | Revert routing change |

---

## Git Strategy

1. `test(shellhome): enforce suite tile routing + intent labels`
2. `feat(shellhome): clarify suite tiles (workbench vs standalone)`
3. `chore(shellhome): remove stub/placeholder routes if any`

---

## Document Status

- [x] Definition of Done complete
- [x] All phases defined
- [x] All tasks have acceptance criteria
- [x] Risk register complete
- [x] Git strategy defined
- [x] Dependencies verified
- [x] EXECUTION COMPLETE

---

# SLICE 3: Start Menu / Launcher Redesign

> **Purpose:** Build a unified Launcher surface (Start Menu / Cmd+K equivalent) using the same primitives as suite tiles.
> **Strategy:** Composition of existing primitives + intent contract from suiteRegistry. One system, not fragmented menus.

---

* **Project:** Launcher Surface (Start Menu / Command Palette Replacement)
* **Branch/PR:** main (direct, per solo-dev mode)
* **Date:** 2026-02-07
* **Prereq:** Suite UX Clarity Pass (Slice 2) complete

---

## Definition of Done

> What MUST be true for this to be complete?

- [x] Launcher exists as first-class surface (Start Menu equivalent)
- [x] Opens/closes deterministically (keyboard shortcut + Start button)
- [x] Focus is trapped while open; ESC closes; ENTER activates selection
- [x] Items include Workbench targets, Standalone suite homes, and system actions
- [x] Each item declares intent (`workbench|standalone|system`) with explicit route/action
- [x] Opening launcher does not cause desktop/shell jitter
- [x] No idle-pulse regressions; no routing-truth regressions
- [x] Launcher uses LiquidPanel + TactileButton behind materialQualityGate
- [x] Fallback remains clean on low-power/reduced-motion
- [x] Test coverage for behavior, routing, materials
- [x] Gate 8 + Gate 9 pass

---

## Phases & Tasks

### Phase 1: Test Harness (TDD)

> Write tests first for launcher behavior + routing + materials.

#### Task 1.1: Behavior Tests

* **Description:** Write keyboard/focus/lifecycle tests for Launcher
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/launcher/launcher.behavior.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] opens with keyboard shortcut (Ctrl+K)
  - [ ] opens with Start button click
  - [ ] closes on ESC key
  - [ ] focus trapped while open (Tab cycles within)
  - [ ] arrow key navigation changes active item
  - [ ] Enter activates active item
  - [ ] restores focus to invoker on close
* **Acceptance Criteria:**
  - [ ] Tests written BEFORE implementation
  - [ ] Tests fail initially (Launcher not yet built)

#### Task 1.2: Routing Tests

* **Description:** Write routing truth tests for launcher items
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/launcher/launcher.routing.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] Workbench items route to /property/:parcelId/tab/<x>
  - [ ] Standalone items route to suite home routes
  - [ ] System actions fire the correct handlers (Settings, Docs)
  - [ ] All launcher items have valid routes (no undefined/# hrefs)
  - [ ] Intent metadata matches suiteRegistry
* **Acceptance Criteria:**
  - [ ] Same routing truth as suite tiles
  - [ ] Intent contract extends to launcher

#### Task 1.3: Materials Gate Tests

* **Description:** Write materials gating tests
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/launcher/launcher.materials.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] Uses LiquidPanel when materialQualityGate enabled
  - [ ] Uses TactileButton for action items
  - [ ] Fallback container renders when gate disabled
  - [ ] No layout shift on gate toggle
* **Acceptance Criteria:**
  - [ ] Material adoption consistent with Workbench
  - [ ] Reduced-motion respected

---

### Phase 2: Launcher Model

> Define the item model and adapter from suiteRegistry.

#### Task 2.1: LauncherModel Types

* **Description:** Define normalized launcher item interface
* **Files:**
  - `frontend/apps/os-shell/src/components/Launcher/launcherModel.ts` (NEW)
* **Implementation:**
  - Define `LauncherItem` interface: `{id, label, intent, href|action, icon, keywords, a11yLabel}`
  - Define `LauncherSection` for grouping: suites, system, recent
  - Export helper `navigateToLauncherItem(item, navigate)` for unified routing
* **Acceptance Criteria:**
  - [ ] Type-safe item model
  - [ ] Intent inherited from suiteRegistry

#### Task 2.2: Registry Adapter

* **Description:** Create adapter to transform suiteRegistry to LauncherItems
* **Files:**
  - `frontend/apps/os-shell/src/config/suiteRegistry.ts` (ADD getLauncherItems)
* **Implementation:**
  - Add `getLauncherItems(): LauncherItem[]` function
  - Include CONSTITUTIONAL_SUITES + OS_ENTRYPOINTS + system actions
  - Map intent, route, labels consistently
* **Acceptance Criteria:**
  - [ ] Single source of truth maintained
  - [ ] No duplicate routing logic

---

### Phase 3: Launcher Component

> Build the Launcher UI with Liquid/Tactile primitives.

#### Task 3.1: Launcher Component

* **Description:** Build Launcher overlay with search + list
* **Files:**
  - `frontend/apps/os-shell/src/components/Launcher/Launcher.tsx` (NEW)
  - `frontend/apps/os-shell/src/components/Launcher/index.ts` (NEW)
* **Implementation:**
  - LiquidPanel container for overlay backdrop
  - Search input with focus on open
  - Filtered item list with keyboard navigation
  - TactileButton for each item
  - Focus trap implementation
  - ESC to close, Enter to activate
* **Acceptance Criteria:**
  - [ ] Keyboard-first design
  - [ ] Focus trap working
  - [ ] No jitter on open/close

#### Task 3.2: Wire to Shell

* **Description:** Connect Launcher to shell root + global shortcuts
* **Files:**
  - `frontend/apps/os-shell/src/shell/home/ShellHome.tsx` (or App.tsx)
  - `frontend/apps/os-shell/src/hooks/useGlobalShortcuts.ts` (if exists)
* **Implementation:**
  - Render Launcher conditionally (isOpen from store)
  - Wire Ctrl+K to toggle launcher
  - Wire Start button (if present) to open launcher
  - Update hint text in ShellHome footer
* **Acceptance Criteria:**
  - [ ] Launcher accessible from anywhere
  - [ ] Shortcut works globally

---

### Phase 4: Verification

> Final verification before merge.

#### Task 4.1: Run All Gates

* **Description:** Execute full test suite + SEAL gates
* **Acceptance Criteria:**
  - [ ] `pnpm test` passes
  - [ ] `pnpm type-check` passes
  - [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` passes
  - [ ] PR#255 regression harness green
  - [ ] Gate 8 + Gate 9 pass

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | Focus trap breaks outside Launcher | High | Low | Focus trap lib or manual impl | Use dialog element native |
| R2 | Jitter on overlay render | High | Med | Render in portal layer | Use transform instead of DOM insert |
| R3 | Shortcut conflicts with browser | Med | Low | Use Ctrl+K not Cmd+K on all | Make shortcut configurable |
| R4 | Duplicate routing logic | Med | Low | Single getLauncherItems adapter | Delete duplicate if found |

---

## Git Strategy

1. `test(launcher): keyboard behavior + focus trap + routing`
2. `test(launcher): materials gating coverage`
3. `feat(launcher): add Start/Launcher surface using Liquid/Tactile primitives`
4. `chore(launcher): consolidate intent-driven navigation helpers`

---

## Dependencies

- [x] Slice 2 complete (Suite UX Clarity)
- [x] suiteRegistry has intent metadata
- [x] LiquidPanel + TactileButton primitives available
- [x] materialQualityGate working

---

## Document Status (Slice 3)

- [x] Definition of Done defined
- [x] All phases defined
- [x] All tasks have acceptance criteria
- [x] Risk register complete
- [x] Git strategy defined
- [x] Dependencies verified
- [x] Execution complete

---

# Slice 4: Compositor Jitter Stabilization

> **Entry:** Slice 3 shipped (Launcher). Now stabilizing desktop/shell visual jitter at the source.
> **Strategy:** Telemetry-driven. Measure first, fix only what's broken. No aesthetic thrash.

---

## Definition of Done

> What MUST be true for this to be complete?

- [x] Jitter is measurable (layout shift probe implemented)
- [x] No layout shift > threshold during: route change, launcher open/close, idle pulse
- [x] Ambient layer renders only when materialQualityGate allows
- [x] Reduced-motion forces stable fallback (no compositor animation primitives)
- [x] Low-power path bypasses expensive backdrop effects
- [x] All existing test harnesses remain green (55 launcher, routing truth, focus order)
- [x] `pnpm type-check` passes
- [x] `node --test os-platform/core/tests/phase83-tools.test.mjs` passes

---

## Phases & Tasks

### Phase 1: Test Harness (TDD)

> Write tests first to measure current jitter state.

#### Task 1.1: Compositor Jitter Tests

* **Description:** Write layout shift detection tests
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/compositor/compositor.jitter.test.ts` (NEW)
* **Tests (TDD):**
  - [ ] does not trigger layout shift when opening/closing Launcher
  - [ ] does not trigger layout shift on route transitions (/desktop -> suite -> workbench)
  - [ ] reduced-motion forces stable fallback (no compositor animation primitives)
  - [ ] no reflow during idle state (10 second window)
* **Acceptance Criteria:**
  - [ ] Tests written BEFORE any fixes
  - [ ] Tests reveal current jitter state (pass = no fix needed)

#### Task 1.2: Ambient Layer Gating Tests

* **Description:** Write materialQualityGate integration tests for ambient layer
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/compositor/ambientLayer.gating.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] ambient layer mounts only when materialQualityGate allows
  - [ ] low-power path bypasses ambient compositor blur effects
  - [ ] reduced-motion disables looping animations
  - [ ] fallback is visually consistent (no flash/jump)
* **Acceptance Criteria:**
  - [ ] Material gating verified for ambient layer
  - [ ] Accessibility compliance

#### Task 1.3: Layout Shift Probe Helper

* **Description:** Create measurement utility for layout shift
* **Files:**
  - `frontend/apps/os-shell/src/perf/layoutShiftProbe.ts` (NEW)
* **Implementation:**
  - Aggregate PerformanceObserver entries for 'layout-shift' type
  - Export `startMeasuring()`, `stopMeasuring()`, `getShiftScore()` API
  - Support JSDOM fallback (no PerformanceObserver = return 0)
* **Acceptance Criteria:**
  - [ ] Works in browser + graceful degradation in JSDOM
  - [ ] No polling or RAF loops

---

### Phase 2: Compositor Stabilization

> Fix any observed jitter sources.

#### Task 2.1: Overlay Positioning Audit

* **Description:** Ensure ambient/compositor layers are pure overlays (no document flow impact)
* **Files:**
  - `frontend/apps/os-shell/src/shell/ambient/AmbientCompositor.tsx`
  - `frontend/apps/os-shell/src/components/compositor/layers/CSSAmbientLayer.tsx`
  - `frontend/apps/os-shell/src/shell/desktop/Desktop.tsx`
* **Implementation:**
  - Confirm `fixed inset-0` positioning (already in place)
  - Confirm `pointer-events-none` on ambient layers
  - Remove any width/height/top/left animations → transform/opacity only
  - Ensure no ancestor layout recalc triggered by ambient changes
* **Acceptance Criteria:**
  - [ ] No document flow impact
  - [ ] Transform/opacity only for motion

#### Task 2.2: Gate Integration

* **Description:** Ensure ambient layer respects materialQualityGate
* **Files:**
  - `frontend/apps/os-shell/src/shell/ambient/AmbientCompositor.tsx`
  - `frontend/apps/os-shell/src/shell/ambient/ambientPolicy.ts`
* **Implementation:**
  - Check for overlap between ambientPolicy and materialQualityGate
  - Consolidate if needed: low-power / reduced-motion → same fallback
  - Ensure blur effects disabled on LOW tier
* **Acceptance Criteria:**
  - [ ] Single source of truth for quality gating
  - [ ] No expensive effects on low-power devices

---

### Phase 3: Verification

> Final verification before merge.

#### Task 3.1: Run All Gates

* **Description:** Execute full test suite + SEAL gates
* **Acceptance Criteria:**
  - [ ] New compositor tests pass
  - [ ] Existing launcher tests (55) pass
  - [ ] `pnpm type-check` passes
  - [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` passes

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | PerformanceObserver not in JSDOM | Med | High | Graceful fallback in probe | Probe returns 0 in tests |
| R2 | Blur removal looks bad | Med | Low | Only remove on LOW tier | Gate with GPU detection |
| R3 | Gate consolidation breaks existing | High | Low | Keep both policies, merge behavior | Revert gate changes |
| R4 | Testing scope creep | Med | Med | Only fix what tests reveal | Skip fixes if tests pass |

---

## Git Strategy

1. `test(compositor): add layout-shift/jitter regression probes`
2. `feat(compositor): gate ambient layer + stabilize overlay rendering`
3. `chore(compositor): reduce-motion/low-power fallbacks + docs`

---

## Dependencies

- [x] Slice 3 complete (Launcher)
- [x] materialQualityGate implemented
- [x] AmbientCompositor + ambientPolicy in place
- [x] Existing stability tests (AmbientCompositor.stability.test.tsx)

---

## Document Status (Slice 4)

- [x] Definition of Done defined
- [x] All phases defined
- [x] All tasks have acceptance criteria
- [x] Risk register complete
- [x] Git strategy defined
- [x] Dependencies verified
- [x] Execution complete

---

# Slice 5: Launcher Polish (Pinned, Recents, Ranking)

> **Entry:** Slice 4 proven no jitter with telemetry probes. Launcher is now the "one system" interaction hub.
> **Strategy:** Pure UX lift with minimal platform risk. Add personalization layer (pinned, recents) and deterministic search ranking.

---

## Definition of Done

> What MUST be true for this to be complete?

- [x] User can pin/unpin any launcher item (suite or system)
- [x] Pinned items appear in a **Pinned** section at the top
- [x] Pins persist across reloads (localStorage)
- [x] Activated launcher items are recorded as recents (bounded to 10)
- [x] Recents appear in a **Recent** section below Pinned
- [x] Recents dedupe by item id and update timestamp on re-activation
- [x] Search ranking is deterministic: prefix > word > substring > keywords
- [x] Empty query shows: Pinned → Recent → Suites → System
- [x] No regressions to focus trap, ESC close, keyboard navigation
- [x] No routing truth regressions
- [x] `pnpm type-check` passes
- [x] `node --test os-platform/core/tests/phase83-tools.test.mjs` passes

---

## Phases & Tasks

### Phase 1: Test Harness (TDD)

> Write tests first for pinned, recents, and ranking.

#### Task 1.1: Pins Tests

* **Description:** Write tests for pin/unpin behavior
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/launcher/launcher.pins.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] pin adds item to pinned section
  - [ ] unpin removes item
  - [ ] pins persist via storage adapter
  - [ ] toggle behavior (pin if unpinned, unpin if pinned)
  - [ ] pinned items stay at top when filtering
* **Acceptance Criteria:**
  - [ ] Tests written BEFORE implementation
  - [ ] Tests fail initially (no pins logic yet)

#### Task 1.2: Recents Tests

* **Description:** Write tests for recents tracking
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/launcher/launcher.recents.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] activation writes recent
  - [ ] recents dedupe and reorder
  - [ ] recents capped at N (10)
  - [ ] recents persist via storage adapter
* **Acceptance Criteria:**
  - [ ] Recents behavior fully specified
  - [ ] MRU ordering verified

#### Task 1.3: Ranking Tests

* **Description:** Write tests for search ranking logic
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/launcher/launcher.ranking.test.ts` (NEW)
* **Tests (TDD):**
  - [ ] prefix match outranks substring
  - [ ] word match outranks partial substring
  - [ ] keywords contribute but rank lower than title
  - [ ] pinned boost applied and deterministic
  - [ ] empty query returns Pinned → Recent → Suites → System
* **Acceptance Criteria:**
  - [ ] Ranking is deterministic (same input = same output)
  - [ ] Edge cases covered (empty query, no matches)

---

### Phase 2: Personalization Stores

> Create stateful personalization layer.

#### Task 2.1: Storage Adapter

* **Description:** Create injectable localStorage wrapper
* **Files:**
  - `frontend/apps/os-shell/src/components/launcher/storageAdapter.ts` (NEW)
* **Implementation:**
  - `get<T>(key): T | null`, `set<T>(key, value): void`
  - Prefix keys with `tf_launcher_`
  - Handle JSON parse errors gracefully
  - Injectable for tests (mock storage)
* **Acceptance Criteria:**
  - [ ] Works with localStorage
  - [ ] Testable without global storage

#### Task 2.2: PinsStore

* **Description:** Create pinned items store
* **Files:**
  - `frontend/apps/os-shell/src/components/launcher/pinsStore.ts` (NEW)
* **Implementation:**
  - `getPinnedIds(): Set<string>`
  - `togglePin(id: string): void`
  - `isPinned(id: string): boolean`
  - Uses storageAdapter for persistence
* **Acceptance Criteria:**
  - [ ] Pin state survives reload
  - [ ] Zustand store for reactivity

#### Task 2.3: RecentsStore

* **Description:** Create recents tracking store
* **Files:**
  - `frontend/apps/os-shell/src/components/launcher/recentsStore.ts` (NEW)
* **Implementation:**
  - `record(id: string): void` - add/bump to front
  - `getRecentIds(): string[]` - ordered list
  - `clear(): void`
  - Cap at 10 items
* **Acceptance Criteria:**
  - [ ] MRU ordering preserved
  - [ ] Bounded size

---

### Phase 3: Ranking Engine

> Deterministic search ranking.

#### Task 3.1: Ranking Logic

* **Description:** Create ranking function for launcher items
* **Files:**
  - `frontend/apps/os-shell/src/components/launcher/ranking.ts` (NEW)
* **Implementation:**
  - `rankItems(items, query, context): RankedItem[]`
  - Context includes: pinnedSet, recentList
  - Score calculation: prefix(100) > word(70) > substring(40) > keyword(20)
  - Pinned boost: +50 if in pinnedSet
  - Recent boost: +30 scaled by recency
  - Stable sort by score descending, then alphabetically
* **Acceptance Criteria:**
  - [ ] Deterministic output
  - [ ] Testable without UI

---

### Phase 4: Launcher Component Update

> Wire personalization into Launcher UI.

#### Task 4.1: Section Rendering

* **Description:** Update Launcher to show Pinned/Recent sections
* **Files:**
  - `frontend/apps/os-shell/src/components/launcher/Launcher.tsx`
* **Implementation:**
  - Import pinsStore, recentsStore
  - Build sections: Pinned → Recent → Suites → System
  - Use ranking for filtered view
  - Ensure correct data-testid for each section
* **Acceptance Criteria:**
  - [ ] Sections render in correct order
  - [ ] Empty sections hidden

#### Task 4.2: Pin Affordance

* **Description:** Add pin/unpin button to launcher items
* **Files:**
  - `frontend/apps/os-shell/src/components/launcher/Launcher.tsx`
* **Implementation:**
  - Pin icon button (ghost variant)
  - aria-label includes pin state
  - Keyboard accessible (Tab to pin button)
  - Visually subtle but discoverable
* **Acceptance Criteria:**
  - [ ] Pin button accessible
  - [ ] State reflected immediately

#### Task 4.3: Record Activation

* **Description:** Record item activation to recents
* **Files:**
  - `frontend/apps/os-shell/src/components/launcher/Launcher.tsx`
* **Implementation:**
  - Call recentsStore.record(id) when item activated
  - Before navigation/action execution
* **Acceptance Criteria:**
  - [ ] Recents updated on every activation

---

### Phase 5: Verification

> Final verification before merge.

#### Task 5.1: Run All Gates

* **Description:** Execute full test suite + SEAL gates
* **Acceptance Criteria:**
  - [ ] New pins/recents/ranking tests pass
  - [ ] Existing launcher tests (55) pass
  - [ ] Compositor tests (33) pass
  - [ ] `pnpm type-check` passes
  - [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` passes

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | localStorage not available | Low | Low | Try/catch wrapper | Graceful fallback to in-memory |
| R2 | Pin button breaks focus order | Med | Low | Tab order test catches it | Remove button |
| R3 | Ranking flaky | High | Low | Deterministic sort, no randomness | Revert to original filter |
| R4 | Recents grow unbounded | Low | Low | Hard cap at 10 | Clear on overflow |

---

## Git Strategy

1. `test(launcher): pin + recents persistence + ranking determinism`
2. `feat(launcher): add pinned + recents sections`
3. `feat(launcher): deterministic ranking + query scoring`
4. `chore(launcher): a11y labels + storage adapter cleanup`

---

## Dependencies

- [x] Slice 3 complete (Launcher base)
- [x] Slice 4 complete (Compositor stability verified)
- [x] launcherModel.ts with item IDs
- [x] TactileButton primitive available

---

## Document Status (Slice 5)

- [x] Definition of Done defined
- [x] All phases defined
- [x] All tasks have acceptance criteria
- [x] Risk register complete
- [x] Git strategy defined
- [x] Dependencies verified
- [x] Execution complete

---

# Slice 6: Standalone Suite Homes Consistency

> **Purpose:** Create consistent shell contract for standalone suite homes.
> **Strategy:** OS-owned `StandaloneHomeShell` wrapper that suites plug into.

---

## Definition of Done (Slice 6)

> What MUST be true for this to be complete?

- [x] Every standalone suite home renders a consistent shell contract
  - Same header structure (title, intent badge "Standalone", optional subtitle)
  - Same container rhythm (LiquidPanel when gated; clean fallback when not)
  - Same primary actions pattern (Tactile buttons; keyboard reachable)
- [x] Navigation truth stays intact
  - From ShellHome tile → Standalone home loads without redirect hacks
  - From Launcher → Standalone home loads identically
  - Standalone home includes clear "Open Workbench (current parcel)" CTA only when parcel context exists
- [x] A11y baseline
  - h1 present, landmark regions sane, focus order stable, no hidden interactive decorations
- [x] No suite boundary violations
  - OS shell owns chrome + layout; suites own their internal content
- [x] All tests pass
- [x] Build succeeds

---

## Phases & Tasks (Slice 6)

### Phase 1: Test Harness (TDD)

> Write tests first for standalone home shell contract.

#### Task 1.1: Contract Tests

* **Description:** Test that standalone routes render consistent ShellChromeContract
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/standalone/standaloneHomes.contract.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] each standalone suite route renders h1 title
  - [ ] renders intent badge "Standalone"
  - [ ] consistent container structure (header + content + actions)
  - [ ] materialQualityGate on/off produces no layout shift
* **Acceptance Criteria:**
  - [ ] Tests written BEFORE implementation
  - [ ] Tests fail initially

#### Task 1.2: Navigation Tests

* **Description:** Test navigation parity between ShellHome and Launcher
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/standalone/standaloneHomes.navigation.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] ShellHome → standalone routes match launcher routes
  - [ ] back/forward preserves state (no full remount loops)
  - [ ] standalone route -> workbench CTA works when parcel context exists
* **Acceptance Criteria:**
  - [ ] Navigation parity verified

#### Task 1.3: Accessibility Tests

* **Description:** Test a11y baseline for standalone homes
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/standalone/standaloneHomes.accessibility.test.tsx` (NEW)
* **Tests (TDD):**
  - [ ] landmarks present (banner, main)
  - [ ] focus order stable
  - [ ] no interactive elements in aria-hidden layers
  - [ ] h1 is first heading
* **Acceptance Criteria:**
  - [ ] A11y baseline enforced

---

### Phase 2: Shell Contract

> Define types and create StandaloneHomeShell component.

#### Task 2.1: Contract Types

* **Description:** Define type-safe contract interfaces for standalone home
* **Files:**
  - `frontend/apps/os-shell/src/components/standalone/standaloneHomeContracts.ts` (NEW)
* **Implementation:**
  - `StandaloneHomeMeta`: title, description, icon, primaryActions[]
  - `StandaloneHomeAction`: id, label, intent, href | handler
  - `StandaloneHomeProps`: meta + children (content slot)
* **Acceptance Criteria:**
  - [ ] Types defined
  - [ ] Actions support both navigation and callbacks

#### Task 2.2: StandaloneHomeShell Component

* **Description:** Create shared shell wrapper using Liquid/Tactile primitives
* **Files:**
  - `frontend/apps/os-shell/src/components/standalone/StandaloneHomeShell.tsx` (NEW)
* **Implementation:**
  - Import LiquidPanel, TactileButton, useMaterialQuality
  - Header: Icon + Title (h1) + "Standalone" badge + description
  - Primary actions row (Tactile buttons)
  - Content slot for suite modules
  - Fallback path without glass effects
* **Acceptance Criteria:**
  - [ ] LiquidPanel + materialQualityGate enforced
  - [ ] Consistent header structure
  - [ ] Keyboard accessible

---

### Phase 3: Suite Migration

> Migrate standalone suite routes to use shared shell.

#### Task 3.1: PilotConsole Migration

* **Description:** Refactor PilotConsole to use StandaloneHomeShell
* **Files:**
  - `frontend/apps/os-shell/src/pages/PilotConsole.tsx`
* **Implementation:**
  - Wrap internal content in StandaloneHomeShell
  - Pass meta: { title: "TerraFusion Pilot Console", description: "...", icon: "🎮", primaryActions: [...] }
  - Keep existing tool invocation UI as content slot
* **Acceptance Criteria:**
  - [ ] Same functionality, consistent chrome
  - [ ] Tests pass

#### Task 3.2: Extend suiteRegistry with homeMeta

* **Description:** Add homeMeta to OS_FEATURES for standalone items
* **Files:**
  - `frontend/apps/os-shell/src/config/suiteRegistry.ts`
* **Implementation:**
  - Add `homeMeta?: StandaloneHomeMeta` to `OsFeatureDefinition`
  - Define homeMeta for pilot: { title, description, icon, primaryActions }
* **Acceptance Criteria:**
  - [ ] Registry extended
  - [ ] Type-safe

---

### Phase 4: Verification

> Final verification before merge.

#### Task 4.1: Run All Gates

* **Description:** Execute full test suite + SEAL gates
* **Acceptance Criteria:**
  - [ ] New standalone contract tests pass
  - [ ] Existing launcher tests pass
  - [ ] `pnpm type-check` passes
  - [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` passes

---

## Risk Register (Slice 6)

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | PilotConsole functionality breaks | High | Low | Keep internal UI unchanged, only wrap | Revert shell wrapper |
| R2 | New component causes layout shift | Med | Low | materialQualityGate + tests | Remove LiquidPanel |
| R3 | A11y regressions | Med | Low | axe tests | Fix violations |

---

## Git Strategy (Slice 6)

1. `test(standalone): contract + navigation + a11y tests for standalone homes`
2. `feat(standalone): add StandaloneHomeShell with Liquid/Tactile primitives`
3. `feat(standalone): migrate PilotConsole to shared shell`
4. `chore(standalone): extend suiteRegistry with homeMeta`

---

## Dependencies (Slice 6)

- [x] Slice 5 complete (Launcher personalization)
- [x] LiquidPanel + TactileButton primitives available
- [x] materialQualityGate working
- [x] OS_FEATURES in suiteRegistry

---

## Document Status (Slice 6)

- [x] Definition of Done defined
- [x] All phases defined
- [x] All tasks have acceptance criteria
- [x] Risk register complete
- [x] Git strategy defined
- [x] Dependencies verified
- [x] Execution complete

---

# Slice 25.3: Codex Directive Pack v1

> **Purpose:** Establish a TerraFusion-specific Codex operator playbook that keeps Codex in bounded recon, execution, and review lanes.
> **Strategy:** Documentation-only workflow slice. Tighten operator prompts without changing runtime code or promoting new rules into the live agent entrypoint.

---

* **Project:** TerraFusion Codex Directive Pack v1
* **Branch/PR:** current working tree
* **Date:** 2026-03-18
* **Prereq:** Existing workflow governance in `.governance/workflow/**`

---

## Definition of Done

> What MUST be true for this to be complete?

- [x] New `CODEX_DIRECTIVE_PACK_v1.md` exists under `.governance/workflow/`
- [x] Codex doctrine states bounded executor/reviewer role, not decider role
- [x] `Recon`, `Execution`, and `Review` modes are defined
- [x] Exactly 6 ready-to-paste TerraFusion prompts are included
- [x] Every prompt uses the same operator contract:
  - `Objective`
  - `Allowed files`
  - `Forbidden`
  - `Acceptance criteria`
  - `Proof`
  - `Non-goals`
  - `Output`
- [x] `README.md` links to the new pack and states it complements workflow governance
- [x] `REMEDIATION_PLAN_v1.md` points Codex assignments to the new bounded prompt pack
- [x] No promotion into `.github/AGENT_ENTRYPOINT.md` in v1
- [x] No runtime APIs, schemas, or types changed

---

## Phases & Tasks

### Phase 1: Pack Creation

#### Task 1.1: Create directive pack

* **Description:** Add the new Codex operator playbook under workflow governance docs
* **Files:**
  - `.governance/workflow/CODEX_DIRECTIVE_PACK_v1.md` (NEW)
* **Implementation:**
  - Define operating doctrine
  - Define `Recon`, `Execution`, `Review` modes
  - Lock the standard prompt contract and field order
  - Add 6 TerraFusion-specific prompts for recon, execution, and review lanes
* **Acceptance Criteria:**
  - [x] Pack exists
  - [x] All 6 prompts present
  - [x] Prompt contract consistent across all prompts

### Phase 2: Discoverability and Alignment

#### Task 2.1: Link from workflow README

* **Description:** Make the pack discoverable from canonical workflow docs
* **Files:**
  - `.governance/workflow/README.md`
* **Implementation:**
  - Add `Operator Playbooks` section
  - Link to `CODEX_DIRECTIVE_PACK_v1.md`
  - State that the pack complements, not replaces, `discovery.md`, `research.md`, `plan.md`, and `progress.md`
* **Acceptance Criteria:**
  - [x] README link added
  - [x] Non-replacement language explicit

#### Task 2.2: Align remediation plan

* **Description:** Point Codex references in the remediation plan to the bounded prompt pack
* **Files:**
  - `.governance/workflow/REMEDIATION_PLAN_v1.md`
* **Implementation:**
  - Add Codex operating rule near tool strategy
  - Tighten Codex rows in the tool-assignment matrix
  - Add cross-reference to the standard operator contract
* **Acceptance Criteria:**
  - [x] Remediation plan references the pack
  - [x] Human scope/governance ownership preserved

### Phase 3: Verification

#### Task 3.1: Structure and doctrine verification

* **Description:** Verify prompt count, field order, and cross-reference consistency
* **Acceptance Criteria:**
  - [x] 6 prompt headers confirmed
  - [x] Each prompt includes `Objective` through `Output` in order
  - [x] README and remediation plan references resolve
  - [x] Manual doctrine check confirms Codex remains bounded executor/reviewer only

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | Pack drifts from workflow governance | Med | Low | README states pack complements canonical workflow docs | Remove/adjust pack references |
| R2 | Prompts become too broad and invite scope creep | High | Low | Explicit `Allowed files` and `Forbidden` sections in every prompt | Tighten prompts in v1.1 |
| R3 | Live entrypoint and workflow docs diverge | Med | Low | Defer entrypoint promotion in v1 and state that explicitly | Keep pack doc-only |

---

## Git Strategy

1. `docs(workflow): add Codex directive pack v1`
2. `docs(workflow): link Codex operator pack from governance docs`

---

## Dependencies

- [x] Existing `.governance/workflow/**` docs available
- [x] Remediation plan already assigns Codex to mechanical lanes
- [x] No runtime or entrypoint changes required for v1

---

## Document Status (Slice 25.3)

- [x] Definition of Done defined
- [x] All phases defined
- [x] All tasks have acceptance criteria
- [x] Risk register complete
- [x] Git strategy defined
- [x] Dependencies verified
- [x] Execution complete

---

# Slice 25.4: Next-Phase Execution Roadmap

> **Purpose:** Lock the next execution phases into a proof-first sequence after the Codex directive pack so future work starts with governance truth, classifies the live Workbench real-host failure that was initially attributed to Atlas, closes the active Forge rehost queue, and only then enters Wave 0, Wave 1, and Wave 2.
> **Strategy:** Produce explicit workflow-canon and proof-posture artifacts first, treat the Workbench real-host gate as a hard classification gate with only three legal outcomes, split Forge closure into independent Comparable Sales and Income Valuation proof lanes, and keep Wave 0 inventory-only. Do not enter Waves 3-5 until earlier proof gates are satisfied.

---

* **Project:** TerraFusion Next-Phase Execution Roadmap
* **Branch/PR:** current working tree
* **Date:** 2026-03-18
* **Prereq:** Slice 25.3 complete; `CODEX_DIRECTIVE_PACK_v1.md` available for bounded Codex handoffs

---

## Definition of Done

> What MUST be true for this planning slice to be complete?

- [x] The next execution phases are ordered explicitly, not left as an informal backlog
- [x] Workflow reconciliation is Phase 1 before new feature execution and produces explicit canon artifacts
- [x] Workbench host truth is a hard classification gate before any broader execution
- [x] Comparable Sales and Income Valuation are separated into independent Forge proof lanes before broader remediation waves
- [x] Wave 0, Wave 1, and Wave 2 are separated into distinct phases with explicit proof requirements
- [x] Entry gates for Waves 3-5 are documented so they do not start early
- [x] Tool ownership is explicit: Codex for bounded recon/execution/review, Copilot for UI/auth-heavy implementation, Claude Code for backend-risky work
- [x] `progress.md` next steps are updated to match this roadmap

---

## Current State Calibration

> These facts were rechecked before locking the roadmap.

- [x] `frontend/apps/os-shell/src` currently shows raw `console.` matches = `960`, so Wave 0 must treat console cleanup as a real inventory item rather than a closed baseline
- [x] `frontend/apps/os-shell/src` currently shows `@ts-ignore` count = `0`
- [x] Raw `any` references remain high in `frontend/apps/os-shell/src` (`1010` matches), so Wave 0 must start with triage and scope narrowing instead of a blind bulk sweep
- [x] The former Atlas host blocker proved to be a stale label; direct Atlas proof stayed green while the combined real-host gate failure reduced to a bounded Dais lazy-host harness defect in `workbenchRealHosting.gate.test.tsx`
- [x] Comparable Sales host files exist in Forge:
  - `frontend/apps/os-shell/src/components/workbench/ComparableSalesPanel.tsx`
  - `frontend/apps/os-shell/src/services/comparableSalesService.ts`
  - `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx`
- [x] Income Valuation host files exist in Forge:
  - `frontend/apps/os-shell/src/pages/workbench/tabs/forge/IncomeApproach.tsx`
  - `frontend/apps/os-shell/src/components/workbench/IncomeValuationPanel.tsx`
  - `frontend/apps/os-shell/src/services/incomeValuationService.ts`
- [x] Wave 1 target surfaces exist and are discoverable:
  - `frontend/apps/os-shell/src/auth/useAuthContext.ts`
  - `frontend/apps/os-shell/src/components/gpt/GPTManagementDashboard.tsx`
  - `frontend/apps/os-shell/src/components/research/ResearchPortal.tsx`
  - `frontend/apps/os-shell/src/services/QuantumModuleManager.ts`
  - `frontend/apps/os-shell/src/hooks/useTodaysWork.ts`
  - `frontend/apps/os-shell/src/applications/terra-levy/hooks/useBudgetData.ts`
- [x] Wave 2 target surfaces exist and are discoverable:
  - `frontend/apps/os-shell/src/components/gpt/RAGDatasetManager.tsx`
  - `frontend/apps/os-shell/src/features/gpt/components/SystemGptAtlasPanel.tsx`
  - `backend/src/TerraFusion.API/Controllers/RAGController.cs`
  - `backend/src/TerraFusion.Consciousness/CoPilot/CoPilotController.cs`

---

## Phases & Tasks

### Phase 1: Workflow Truth Reconciliation

> Clean the governance ledger before starting new execution.

#### Task 1.1: Publish workflow canon update

* **Description:** Reconcile stale open/completed states between `plan.md`, `progress.md`, and the active remediation memo
* **Files:**
  - `.governance/workflow/plan.md`
  - `.governance/workflow/progress.md`
  - `.governance/workflow/REMEDIATION_PLAN_v1.md` if remediation assumptions need recalibration
* **Implementation:**
  - Mark historically completed slices consistently across workflow docs
  - Remove stale “open” signals for work already shipped
  - Recalibrate Wave 0 assumptions using current measured counts instead of older audit numbers
* **Acceptance Criteria:**
  - [x] Phase defined
  - [x] Cross-doc reconciliation identified as the first execution phase
  - [x] Wave 0 count drift explicitly called out

#### Task 1.2: Publish proof-posture note

* **Description:** Record the current proof boundary in one canonical note so later work cannot drift into invented staged-proof claims
* **Files:**
  - `.governance/workflow/proof-posture.md`
  - `.governance/workflow/progress.md`
* **Implementation:**
  - State that Muse-first is sealed on committed code only
  - State that no lawful staged-cache proof exists today
  - State that the Workbench real-host gate remains open until Phase 2 is classified and resolved
* **Acceptance Criteria:**
  - [x] Dedicated proof-posture artifact required
  - [x] Muse/staged-cache/Workbench-host truth called out explicitly

### Phase 2: Workbench Real-Host Root-Cause Classification

> Classify the Workbench real-host failure before rehost proof lanes or broader cleanup work begin.

#### Task 2.1: Classify the Workbench real-host failure

* **Description:** Investigate the current Workbench real-host failure, which was initially labeled as Atlas, and stop at a bounded root-cause classification unless the fix is trivial and local
* **Files:**
  - `frontend/apps/os-shell/src/__tests__/workbench/workbenchRealHosting.gate.test.tsx`
  - `frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx`
  - `frontend/apps/os-shell/src/__tests__/workbench/PropertyDais.test.tsx`
  - `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`
  - `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDais.tsx`
  - `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx`
  - `frontend/apps/os-shell/src/context/workbenchTabContext.tsx`
* **Implementation:**
  - Allow only three legal outcomes: harness/provider gap, lazy import/export resolution defect, or real host regression in the named Workbench tab surface / Workbench integration
  - Produce a bounded fix plan or apply a direct fix only if the issue is trivial and local
  - Do not mix this phase with opportunistic cleanup or unrelated refactors
* **Acceptance Criteria:**
  - [x] Phase defined
  - [x] Legal outcomes constrained to A/B/C classification
  - [x] Exit condition is bounded classification or trivial direct fix

* **Execution Outcome (2026-03-18):**
  - The Atlas label was stale. Direct Atlas proof stayed green while the combined real-host gate failed on Dais under the lazy host harness.
  - The bounded repair aligned `LazyDais` to the module default export path and preloaded the real tab modules in `workbenchRealHosting.gate.test.tsx`.
  - The real-host gate then passed `15/15`, closing Phase 2 without changing `PropertyAtlas.tsx` or `PropertyDais.tsx`.

### Phase 3: Forge Lane F1 — Comparable Sales Rehost Proof

> Close the first live Forge rehost lane before widening scope.

#### Task 3.1: Prove parcel-bound Forge sales hosting

* **Description:** Close the remaining proof gaps for Comparable Sales inside Forge
* **Files:**
  - `frontend/apps/os-shell/src/components/workbench/ComparableSalesPanel.tsx`
  - `frontend/apps/os-shell/src/services/comparableSalesService.ts`
  - `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx`
  - related Forge/workbench tests
* **Implementation:**
  - Verify parcel-bound populated state
  - Prove Benton snapshot filtering against the current parcel context
  - Verify selection/adjustment and reconciliation API reachability or record an explicit backend blocker with evidence
  - Verify suite launch lands on the Forge tab correctly
  - Prove no fake replacement surface was introduced
* **Acceptance Criteria:**
  - [x] Phase defined
  - [x] Required proof points named
  - [x] Files and boundaries named
  - [x] Dedicated evidence pack implied for F1 lane

### Phase 4: Forge Lane F2 — Income Valuation Rehost Proof

> Close the second live Forge rehost lane after Workbench host classification and alongside the first Forge proof lane.

#### Task 4.1: Prove Forge income hosting and persistence path

* **Description:** Convert Income Valuation from “in progress” into a fully verified Forge sub-tab surface
* **Files:**
  - `frontend/apps/os-shell/src/pages/workbench/tabs/forge/IncomeApproach.tsx`
  - `frontend/apps/os-shell/src/components/workbench/IncomeValuationPanel.tsx`
  - `frontend/apps/os-shell/src/services/incomeValuationService.ts`
  - `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`
  - related Forge/workbench tests
* **Implementation:**
  - Verify the income sub-tab host renders correctly from Forge
  - Prove API reachability for calculation and valuation-record persistence/retrieval paths
  - Clarify whether legacy standalone income surfaces remain archived-only or still require route cleanup
  - Prove no fake replacement surface was introduced
* **Acceptance Criteria:**
  - [x] Phase defined
  - [x] Host, service, and backend controller surfaces named
  - [x] Persistence/retrieval proof included in the phase scope
  - [x] Dedicated evidence pack implied for F2 lane

### Phase 5: Wave 0 Inventory and Governance Pass

> Start Wave 0 only after the workflow truth, Workbench host classification, and Forge proof lanes are stable.

#### Task 5.1: Recalibrated debt inventory

* **Description:** Inventory and categorize debt using current counts, not stale assumptions
* **Files:**
  - `frontend/apps/os-shell/**`
  - related tests only
* **Implementation:**
  - Preserve the zero-`@ts-ignore` baseline
  - Treat raw `console.` usage as a live inventory bucket because current probes show `960` matches in `frontend/apps/os-shell/src`
  - Triage `any` usage into governed production, test-only, compatibility/generator, archived, and deferred buckets before any bulk edits
  - End with a debt ledger, not a default cleanup sweep
  - Use Codex only for bounded mechanical cleanup after the inventory pass is explicitly approved
* **Acceptance Criteria:**
  - [x] Phase defined
  - [x] Current measured counts reflected in scope
  - [x] Codex usage constrained to post-triage mechanical work
  - [x] Wave 0 locked to inventory/governance by default

### Phase 6: Wave 1 Auth Context and Core Wiring

> Thread real auth after hygiene assumptions are corrected.

#### Task 6.1: Complete auth wiring on named surfaces

* **Description:** Finish the Wave 1 auth work on the existing named hooks and surfaces
* **Files:**
  - `frontend/apps/os-shell/src/auth/useAuthContext.ts`
  - `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx`
  - `frontend/apps/os-shell/src/components/gpt/GPTManagementDashboard.tsx`
  - `frontend/apps/os-shell/src/components/research/ResearchPortal.tsx`
  - `frontend/apps/os-shell/src/services/QuantumModuleManager.ts`
  - `frontend/apps/os-shell/src/hooks/useTodaysWork.ts`
  - `frontend/apps/os-shell/src/applications/terra-levy/hooks/useBudgetData.ts`
  - related auth contract tests
* **Implementation:**
  - Eliminate remaining hardcoded user/role placeholders
  - Prove session/auth context reaches the target surfaces
  - Keep Codex on bounded replacements and proof loops; reserve auth-model decisions to the human/Copilot lane
* **Acceptance Criteria:**
  - [x] Phase defined
  - [x] Named target files grounded in the current repo
  - [x] Tool split called out explicitly

### Phase 7: Wave 2 RAG and GPT Split

> Break Wave 2 into a backend recon pass and a bounded implementation pass.

#### Task 7.1: Backend inventory first

* **Description:** Start Wave 2 with a recon pass across RAG and CoPilot backend paths before touching implementation
* **Files:**
  - `backend/src/TerraFusion.API/Controllers/RAGController.cs`
  - `backend/src/TerraFusion.Consciousness/CoPilot/CoPilotController.cs`
  - related backend services/tests
* **Implementation:**
  - Inventory active endpoints, stubs, persistence gaps, and tests
  - Record blockers and drift before any frontend wiring changes
* **Acceptance Criteria:**
  - [x] Backend recon phase defined
  - [x] Relevant controllers named

#### Task 7.2: Frontend wiring after backend truth

* **Description:** Only after backend truth is known, wire the frontend RAG and GPT surfaces
* **Files:**
  - `frontend/apps/os-shell/src/components/gpt/RAGDatasetManager.tsx`
  - `frontend/apps/os-shell/src/components/gpt/GPTManagementDashboard.tsx`
  - `frontend/apps/os-shell/src/features/gpt/components/SystemGptAtlasPanel.tsx`
  - related contract tests
* **Implementation:**
  - Finish dataset CRUD wiring
  - Finish GPT dashboard integration
  - Replace remaining TODO-backed test gaps in the atlas panel
* **Acceptance Criteria:**
  - [x] Frontend implementation phase defined
  - [x] Backend-before-frontend ordering is explicit

### Phase 8: Waves 3-5 Entry Gate

> Prevent larger standalone/backend/infrastructure work from starting early.

#### Task 8.1: Gate later waves on earlier proof

* **Description:** Enter Waves 3-5 only after Phases 1-6 are closed with proof
* **Implementation:**
  - Do not start Standalone Page Completion, Backend Service Completion, or Infrastructure & Quality while workflow canon, proof-posture truth, Workbench host classification, Forge proof lanes, Wave 0 inventory, auth, and Wave 2 remain open
  - Require `pnpm run type-check` and `node --test os-platform/core/tests/phase83-tools.test.mjs` at each phase boundary
* **Acceptance Criteria:**
  - [x] Gate documented
  - [x] Required proof commands carried forward

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | Remediation waves start from stale assumptions | High | Med | Reconcile workflow truth first and recalibrate Wave 0 using current counts | Pause execution and refresh docs |
| R2 | Module rehost work widens into backend redesign | High | Med | Force recon/proof before implementation and use explicit blockers when backend truth fails | Hold frontend host as-is |
| R3 | Codex scope creeps into architecture or governance decisions | High | Low | Require bounded prompt pack usage for Codex slices | Reassign slice to human/Copilot/Claude |
| R4 | Waves 3-5 start before earlier proof is locked | Med | Med | Add explicit entry gate in this roadmap and carry it into `progress.md` next steps | Freeze later waves until proof lands |

---

## Git Strategy

1. `docs(workflow): add slice 25.4 next-phase roadmap`
2. `docs(workflow): record slice 25.4 completion and next-step queue`

---

## Dependencies

- [x] Slice 25.3 complete
- [x] `CODEX_DIRECTIVE_PACK_v1.md` available for bounded Codex handoffs
- [x] Current probes for Wave 0 calibration collected
- [x] Comparable Sales and Income Valuation host files confirmed in repo
- [x] Auth, RAG, and GPT target surfaces confirmed in repo

---

## Document Status (Slice 25.4)

- [x] Definition of Done defined
- [x] Current state calibrated with repo evidence
- [x] All phases defined
- [x] All tasks have acceptance criteria
- [x] Risk register complete
- [x] Git strategy defined
- [x] Dependencies verified
- [x] Execution complete
