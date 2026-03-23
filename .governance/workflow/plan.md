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

# SLICE 3: OS Shell URL Provenance Hardening

> **Purpose:** Close the strongest real follow-up from the frontend shell Snyk triage by constraining iframe and popup URLs to trusted origins.
> **Strategy:** Validate launch URLs before they reach browser sinks, fail closed, and prove the patched files disappear from the frontend scan report.

* **Project:** OS Shell URL Provenance Hardening
* **Branch/PR:** main (direct, per solo-dev mode)
* **Date:** 2026-03-22
* **Discovery Link:** Reusing existing frontend shell scan triage (incremental security hardening, not a new initiative)
* **Research Link:** `os-platform/core/pilot/ops/frontend-os-shell-snyk-triage-2026-03-22.md`

## Definition of Done

- [x] Shared helper resolves only trusted iframe/popup URLs
- [x] `PWAShell.tsx` validates module iframe URLs before launch
- [x] `ProfessionalDashboard.tsx` validates dialog iframe URLs before launch
- [x] `TerraPrimeSuite.tsx` constrains iframe and pop-out URLs to allowlisted origins
- [x] Blocked URL state fails closed with truthful UI behavior
- [x] Focused security tests cover helper and TerraPrime popup path
- [x] Required gates pass (`type-check`, `phase83-tools`)
- [x] Fresh frontend scan no longer reports patched files
- [x] Governed-core Snyk baseline restored after frontend-only scan

## Phases & Tasks

### Phase 1: Trust Resolver

- [x] Add canonical trusted URL helper for same-origin shell routes and allowlisted absolute suite origins
- [x] Add hardened popup helper with `noopener,noreferrer`

### Phase 2: Sink Hardening

- [x] Gate `PWAShell.tsx` module iframe launches through the helper
- [x] Gate `ProfessionalDashboard.tsx` iframe launches through the helper
- [x] Gate `TerraPrimeSuite.tsx` iframe, popup, and postMessage target origin through the helper

### Phase 3: Proof Wall

- [x] Add focused frontend tests for the helper and TerraPrime popup hardening
- [x] Run targeted vitest proof
- [x] Run required repo gates
- [x] Re-run frontend Snyk and verify patched files are absent
- [x] Restore governed-core `security:scan` + `security:check`

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

* **Execution Outcome (2026-03-18):**
  - `PropertyWorkbench.tsx` and `PropertyWorkbenchWindow.tsx` now derive `countyId`, `userId`, and `roles` from auth claims first with session fallback, removing the hardcoded empty-role workbench context.
  - `ResearchPortal.tsx` now derives researcher identity from governed auth/session surfaces, initializes through `researchSessionAPI`, and removes the legacy hardcoded researcher/institution strings from production code.
  - `QuantumModuleManager.ts` now builds module loading context from canonical auth/session helpers instead of reading `tf.session.dev` directly, and resolves permissions/security level from auth-aware helpers.
  - `useTodaysWork.ts` and `useBudgetData.ts` are now API-first hooks with explicit fallback provenance instead of fixture-only or no-op behavior.
  - Proof landed through the targeted Wave 1 auth bundle (`161/161`), `pnpm run type-check`, and `node --test os-platform/core/tests/phase83-tools.test.mjs` (`54/54`).

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

---

# Slice 25.5: Post-Wave-2 Copilot Multi-Agent Phase Map

> **Purpose:** Keep the next Copilot phases on the same proof-first, multi-agent operating model without reopening execution early.
> **Strategy:** Planning only. Preserve the Phase 3 hard stop, require an explicit go/no-go before any post-Wave-2 implementation, and standardize every future phase on one writer lane plus read-only parallel truth and proof lanes.

---

* **Project:** Post-Wave-2 Copilot Multi-Agent Planning
* **Branch/PR:** current working tree
* **Date:** 2026-03-18
* **Prereq:** CP-W2-8 hard stop review remains active in `.governance/workflow/progress.md`

Execution artifact (2026-03-19 refresh):
- `docs/superpowers/plans/2026-03-19-multi-agent-subagent-parallel-execution-plan.md`
- `docs/superpowers/plans/2026-03-19-cp13-production-gate-catalog.md`
- `docs/superpowers/plans/2026-03-19-cp14-tenant-rbac-isolation-closure-packet.md`
- `docs/superpowers/plans/2026-03-19-cp15-runtime-completeness-closure-packet.md`
- `docs/superpowers/plans/2026-03-19-cp16-service-registry-orchestration-closure-packet.md`
- `docs/superpowers/plans/2026-03-19-cp17-sre-restore-dr-hypercare-closure-packet.md`
- `docs/superpowers/plans/2026-03-19-cp18-security-compliance-seal-packet.md`
- `docs/superpowers/plans/2026-03-19-cp19-go-live-decision-packet.md`

---

## Definition of Done

> What MUST be true for this planning slice to be complete?

- [x] Future Copilot work stays behind the existing hard stop until an explicit go/no-go decision is recorded
- [x] Every future phase uses the same bounded lane split: Copilot writer lane, Claude read-only contract lane, Codex read-only proof lane
- [x] Parallelism is limited to read-only research, proof audits, or disjoint-file execution with exclusive file ownership
- [x] Every future phase has an explicit closure wall, a closure note, and a fresh hard stop before the next phase opens
- [x] No planning text here authorizes Waves 3-5 execution on its own

---

## Operating Rules

### Rule 1: Hard Stop First

- No post-Wave-2 implementation starts until a human records an explicit go/no-go decision.
- Planning may continue under the hard stop, but execution may not.
- If repo truth changes before go/no-go, refresh the checkpoint before opening any new lane.

### Rule 2: One Writer Per Slice

- Copilot is the default writer for the active bounded slice unless the phase charter says otherwise.
- Claude and Codex may run in parallel only as read-only subagents unless a future charter assigns them a distinct file set.
- No two agents write the same file in the same slice.

### Rule 3: Parallelism Is Evidence-Scoped

- Safe parallel work:
  - backend contract clarification
  - proof-surface audit
  - stale test and client drift classification
  - route and DTO inventory
- Unsafe parallel work:
  - overlapping edits in the same feature lane
  - simultaneous truth-setting in both docs and implementation without a single owner
  - speculative frontend compatibility shims before backend truth is settled

### Rule 4: Every Phase Ends Twice

- First end: the bounded proof wall is green.
- Second end: a checkpoint or hard stop note is written before the next phase opens.

---

## Standard Phase Frame

Use this same frame for every future Copilot phase after go/no-go.

### Phase A: Charter

* **Output:** one bounded phase brief
* **Must include:**
  - objective
  - allowed files
  - forbidden files
  - success criteria
  - proof wall
  - closure artifact

### Phase B: Read-Only Parallel Truth Pass

* **Copilot lane:** inspect the active writer lane and classify likely implementation seams
* **Claude lane:** clarify backend/service/DTO/route truth only
* **Codex lane:** isolate lawful proof surfaces, stale tests to quarantine, and RED→GREEN checklist
* **Exit condition:** the writer lane has enough repo truth to implement without inventing contracts

### Phase C: Bounded Implementation

* **Copilot lane:** implement only inside the named live lane
* **Claude lane:** answer contract ambiguities only if new uncertainty appears
* **Codex lane:** remain read-only unless the phase charter explicitly grants a disjoint proof-only file set
* **Exit condition:** the scoped behavior is truthful, bounded, and consistent with the confirmed service lane

### Phase D: Closure Wall

* **Run:** the full targeted proof wall for the active lane, not just the newest test
* **Fix:** only closure-blocking defects in the allowed file set
* **Exit condition:** the bounded wall is green and quarantined lanes remain quarantined

### Phase E: Checkpoint and Hard Stop

* **Record:** what closed, what remains non-live or deferred, and what stays quarantined
* **Stop:** do not open the next phase until that note exists

---

## Default Lane Assignment For Future Copilot Phases

### Copilot lane

- Own the bounded live implementation lane
- Keep edits inside the named file set only
- Run the proof wall and close only on evidence

### Claude Code lane

- Stay read-only by default
- Clarify route shape, DTO truth, auth scope, persistence behavior, and backend non-live constraints
- Return blocker lists and contract truth, not frontend design decisions

### Codex lane

- Stay read-only by default
- Produce proof plans, stale assertion quarantine lists, drift inventories, and RED→GREEN checklists
- Avoid architecture, product, or governance decisions

---

## Safe Parallel Execution Map For Next Phases

1. Planning group: Copilot drafts the bounded phase brief while Claude and Codex validate contract and proof assumptions read-only.
2. Truth group: Copilot inspects the writer lane while Claude maps backend truth and Codex isolates lawful proof sources.
3. Closure group: Copilot runs the full proof wall while Codex audits failures for brittleness vs real regressions.
4. Blocking rule: no later phase opens until the current phase has both a green closure wall and a checkpoint or hard stop note.

---

## Next Copilot Phase Order

This order is planning-only and does not lift the hard stop.

1. Entry decision phase: explicit go/no-go to leave the current hard stop.
2. If `go`: open the next bounded Copilot phase with the standard phase frame above.
3. After each future phase: close on evidence, write the checkpoint, and stop again before the next phase.
4. If `no-go`: remain at the current checkpoint and limit work to documentation, evidence refresh, or blocker clarification only.

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Rollback |
|----|------|----------|------------|------------|----------|
| R1 | Multi-agent work creates competing truths | High | Med | Single writer lane, read-only parallel lanes by default | Freeze the slice and re-charter ownership |
| R2 | Planning text is mistaken for execution approval | High | Low | Repeat hard-stop requirement in every future charter | Revert to checkpoint-only status |
| R3 | Parallel proof work widens into product decisions | Med | Med | Keep Claude/Codex outputs bounded to truth and proof only | Reassign decisions to the writer lane |
| R4 | Future phases skip closure notes and drift between slices | Med | Med | Require checkpoint or hard stop note before any new phase opens | Block the next phase until recorded |

---

## Git Strategy

1. `docs(workflow): add post-wave2 copilot multi-agent phase map`

---

## Dependencies

- [x] CP-W2-8 hard stop review recorded
- [x] Wave 2 frontend closure wall passed on evidence
- [x] Existing Copilot, Claude, and Codex operating split already proven on bounded slices

---

## Document Status (Slice 25.5)

- [x] Definition of Done defined
- [x] Operating rules defined
- [x] Standard phase frame defined
- [x] Parallel execution map defined
- [x] Hard-stop dependency preserved
- [x] Planning complete

---

# Slice 26: End-to-End Copilot Phase Completion Map (Assessor Vertical + OS Core)

> **Purpose:** Define every remaining Copilot phase from CP-W2-8 through
> Assessor vertical attestation, using the Slice 25.5 multi-agent model for
> every implementation phase. This is the master route map — each entry here
> becomes a charter when the preceding checkpoint is green and the human gate
> is open.
>
> **Classification:** Planning-only. Does not lift CP-W2-8 or authorize any
> implementation. Every phase below requires its own bounded charter and an
> explicit human go/no-go before `@tf-phase-orchestrator` is invoked.

---

* **Project:** TerraFusion OS — Assessor Vertical End-to-End Completion
* **Date:** 2026-03-18
* **Branch:** post-r3/w5f-registry-edge-cleanup (current)
* **Prereq:** CP-W2-8 explicit human go/no-go

---

## Definition of Done

> What must be true for this planning slice to be complete?

- [x] Every remaining phase from CP-W2-8 to Assessor vertical attestation is named
- [x] Agent assignment is explicit for every phase
- [x] Entry gate and proof command set is explicit for every phase
- [x] Hard-stop checkpoints are called out at each phase boundary
- [x] No planning text constitutes execution approval
- [x] Agent tooling slice (Slice 25.5 + README posture fixes) is classified honestly

---

## Honest Classification: Agent Tooling Slice

The `.github/agents/` scaffolding created in Slice 25.5 is classified as:

> **Bounded governance/tooling scaffolding** — not a product phase opening,
> not a Wave 3–5 authorization, and not a hard-stop lift.

It is subordinate to this plan. It does not change any proof posture claim.

---

## Phase Map

Each phase below follows the Slice 25.5 Phase A–E law:
`charter → parallel truth → implementation → closure wall → checkpoint + hard stop`

---

### GATE-0: Human Go/No-Go at CP-W2-8

| Field | Value |
|-------|-------|
| **Type** | Human decision gate |
| **Agent** | None (human only) |
| **Trigger** | Human states explicit `go` or `no-go` referencing CP-W2-8 |
| **If go** | Open Phase 1 via `@tf-phase-orchestrator` |
| **If no-go** | Remain at CP-W2-8; limit to docs/evidence only |
| **Checkpoint** | CP-W2-8 (current active) |

This gate cannot be opened by any agent command. No charter, no proof wall,
and no agent invocation substitutes for this explicit human decision.

---

### Phase 1: Forge F1 — Comparable Sales Rehost Proof

| Field | Value |
|-------|-------|
| **Goal** | Close ComparableSalesPanel + comparableSalesService proof lance |
| **Copilot role** | `@tf-phase-orchestrator` (governs) · `@tf-writer` (implements) |
| **Truth lane** | `@tf-contract-truth` recces `CostForgeController.cs` reachability |
| **Proof lane** | `@tf-proof-audit` designs RED→GREEN for ComparableSales surface |
| **Entry gate** | GATE-0 green + last proof wall still passing |
| **Allowed files** | `ComparableSalesPanel.tsx`, `comparableSalesService.ts`, `PropertyForge.tsx`, related tests |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W3-1 on close |

**Key proof points:**
- Parcel-bound populated state renders without fake data
- Benton snapshot filtering against current parcel context
- Selection/adjustment reachability or explicit backend blocker with evidence
- Suite launch lands on Forge tab correctly
- No fake replacement surface introduced

---

### Phase 2: Forge F2 — Income Valuation Rehost Proof

| Field | Value |
|-------|-------|
| **Goal** | Close IncomeApproach + IncomeValuationPanel proof lane |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-writer` |
| **Truth lane** | `@tf-contract-truth` recces `CostForgeController.cs` income endpoints |
| **Proof lane** | `@tf-proof-audit` designs RED→GREEN for IncomeValuation surface |
| **Entry gate** | Phase 1 closed (CP-W3-1 green) |
| **Allowed files** | `IncomeApproach.tsx`, `IncomeValuationPanel.tsx`, `incomeValuationService.ts`, related tests |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W3-2 on close |

**Key proof points:**
- Income sub-tab host renders correctly from Forge
- Calculation and valuation-record persistence/retrieval path proof
- Legacy standalone income surfaces confirmed archived-only or route cleanup applied
- No fake replacement surface introduced

---

### Phase 3: Wave 0 — Debt Inventory and Governance Pass

| Field | Value |
|-------|-------|
| **Goal** | Produce a quantified debt ledger; no bulk cleanup without explicit approval |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-contract-truth` (reads) · `@tf-writer` (ledger only) |
| **Proof lane** | `@tf-proof-audit` confirms zero @ts-ignore baseline holds after ledger commit |
| **Entry gate** | Phase 2 closed (CP-W3-2 green) |
| **Allowed files** | `.governance/workflow/debt-ledger.md` (new) · no source edits |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W0-1 on close |

**Inventory buckets (must be classified before any bulk edit):**

| Bucket | Current count | Action |
|--------|--------------|--------|
| `console.` usages | ~960 | Triage: test-only vs production vs noise |
| raw `any` references | ~1010 | Triage: governed, test-only, compat/gen, archived, deferred |
| `@ts-ignore` baseline | 0 | Preserve; block any regressions |

**Rule:** Codex may only touch Wave 0 items after the ledger is approved and the bucket is marked "mechanical" by a human.

---

### Phase 4: Wave 3A — Standalone Suite Homes Completion

| Field | Value |
|-------|-------|
| **Goal** | Every suite has a real, honest standalone home — no fake data in production paths |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-writer` |
| **Truth lane** | `@tf-contract-truth` verifies backend route reachability for each suite home |
| **Proof lane** | `@tf-proof-audit` designs RED→GREEN for each suite home surface |
| **Entry gate** | Phase 3 closed (CP-W0-1 green) |
| **Suites in scope** | TerraForge · TerraAtlas · TerraDais · TerraDossier · TerraGPT |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W3-3 on close |

**Definition of "honest" suite home:**
- Renders without hardcoded fixture data in the production code path
- Route is wired in the canonical route table (`/forge`, `/atlas`, `/dais`, `/dossier`, `/gpt`)
- Backend service is either confirmed reachable or an explicit blocker is recorded
- No `TODO: wire to real API` silently passing tests

---

### Phase 5: Wave 3B — Property Workbench Completeness

| Field | Value |
|-------|-------|
| **Goal** | Workbench Tier-0 surface is complete: context ribbon, suite compass, work modes |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-writer` |
| **Truth lane** | `@tf-contract-truth` verifies parcel service contracts and workbench tab harness |
| **Proof lane** | `@tf-proof-audit` verifies RED→GREEN for all Workbench surfaces |
| **Entry gate** | Phase 4 closed (CP-W3-3 green) |
| **Key surfaces** | `PropertyWorkbench.tsx` · `workbenchTabContext.tsx` · context ribbon · BadgeProvider API · Suite Compass widget |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W3-4 on close |

**Work mode coverage required:** overview · valuation · mapping · admin · case

---

### Phase 6: Wave 1 Completion — Auth Hardening Pass

| Field | Value |
|-------|-------|
| **Goal** | Eliminate all remaining hardcoded user/role placeholders across named surfaces |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-writer` |
| **Truth lane** | `@tf-contract-truth` audits auth contract (RBAC claims shape, session shape) |
| **Proof lane** | `@tf-proof-audit` audits Wave 1 auth bundle coverage |
| **Entry gate** | Phase 5 closed (CP-W3-4 green) |
| **Surfaces** | Any remaining hardcoded `countyId`/`userId`/`roles` usages not caught in the initial Wave 1 pass |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W1-C on close |

**Note:** Initial Wave 1 auth pass completed 2026-03-18. This phase closes remaining gaps discovered during Wave 3 suite home work.

---

### Phase 7: Wave 4A — TerraTrace Real Implementation

| Field | Value |
|-------|-------|
| **Goal** | TerraTrace append-only audit spine is a real implementation, not a stub |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-writer` |
| **Truth lane** | `@tf-contract-truth` inventories current TerraTrace backend: what is real vs stub |
| **Proof lane** | `@tf-proof-audit` designs proof wall for append-only constraint and county-scope isolation |
| **Entry gate** | Phase 6 closed (CP-W1-C green) |
| **Key rules** | Append-only: no in-place event updates · correlationId links invoke→result · county-scoped |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W4-1 on close |

**Required event types at close:**
`tool_invoked` · `tool_succeeded` · `tool_failed` · `mode_switched` ·
`permission_denied` · `artifact_created` · `artifact_published`

---

### Phase 8: Wave 4B — TerraPilot RBAC + Tool Allowlist First Pass

| Field | Value |
|-------|-------|
| **Goal** | TerraPilot tool allowlist + RBAC claims model is enforced, not placeholder |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-writer` |
| **Truth lane** | `@tf-contract-truth` audits current Pilot mode/tool model vs Constitution spec |
| **Proof lane** | `@tf-proof-audit` designs RED→GREEN for risk-level escalation paths |
| **Entry gate** | Phase 7 closed (CP-W4-1 green) |
| **Risk levels** | `read_only` · `write_low` · `write_high` (confirmation+reason) · `irreversible` (confirmation+reason+supervisor) |
| **PII rule** | No SSN/phone/email in trace payloads — test must assert redaction |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W4-2 on close |

---

### Phase 9: Wave 5A — Multi-Tenant County Isolation Gates

| Field | Value |
|-------|-------|
| **Goal** | Proof that no cross-county data leak is possible at the API boundary |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-writer` |
| **Truth lane** | `@tf-contract-truth` audits all controller routes for CountyId scope enforcement |
| **Proof lane** | `@tf-proof-audit` designs cross-county isolation gate tests |
| **Entry gate** | Phase 8 closed (CP-W4-2 green) |
| **Scope** | All `TerraFusion.API` controllers that return parcel/valuation/assessment data |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W5-1 on close |

**Isolation invariant:** A request authenticated to CountyId A must never return data owned by CountyId B.

---

### Phase 10: Wave 5B — Security Baseline (OWASP Top 10)

| Field | Value |
|-------|-------|
| **Goal** | No OWASP Top 10 violations in exposed surface area |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-contract-truth` (audit) · `@tf-writer` (remediations) |
| **Proof lane** | `@tf-proof-audit` designs proof wall against each applicable OWASP category |
| **Entry gate** | Phase 9 closed (CP-W5-1 green) |
| **Minimum categories** | A01 Broken Access Control · A02 Cryptographic Failures · A03 Injection · A05 Security Misconfiguration · A07 Auth Failures |
| **Proof commands** | `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Checkpoint** | CP-W5-2 on close |

---

### Phase 11: Assessor Vertical Attestation

| Field | Value |
|-------|-------|
| **Goal** | Every suite (Forge, Atlas, Dais, Dossier, GPT) attested as honest, functional, and isolated |
| **Copilot role** | `@tf-phase-orchestrator` · `@tf-contract-truth` · `@tf-proof-audit` (all read-only review) |
| **Entry gate** | Phases 1–10 all closed with green proof walls |
| **Output** | `ASSESSOR_VERTICAL_ATTESTATION.md` in `.governance/` |
| **Attestation criteria** | See table below |
| **Checkpoint** | CP-ASSESSOR-1 on close |

**Attestation checklist (all must be true):**

| Suite | Criteria |
|-------|----------|
| TerraForge | F1 + F2 proof lanes green · no fake valuation data · income + sales hosted |
| TerraAtlas | Standalone home honest · GIS layer routes confirmed reachable |
| TerraDais | Standalone home honest · admin workflow routes confirmed reachable |
| TerraDossier | Standalone home honest · evidence/document routes confirmed reachable |
| TerraGPT | GPT + RAG wiring closed on Wave 2 evidence · no prototype lanes in production |
| Property Workbench | All 5 suite tabs real-hosted · all work modes operational |
| TerraPilot | RBAC + tool allowlists enforced · PII redaction tested |
| TerraTrace | Append-only confirmed · county-scoped · correlationId chain tested |
| Auth | No hardcoded user/role in production code paths |
| Multi-tenancy | Cross-county isolation gate passing |
| Security | OWASP Top 10 baseline clear |

---

## Phases Not Yet Planned (Post-Assessor)

The following phases exist in the product roadmap but are **out of scope for
this planning slice**. They open only after CP-ASSESSOR-1 green + new
explicit human go/no-go:

| Future Phase | Description |
|-------------|-------------|
| TerraCanon IDE | God-mode self-development environment (Monaco + AI, replaces VS Code) |
| County 2 Onboarding | Benton → second Washington State county; multi-tenant onboarding flow |
| TerraClerk Vertical | County Clerk application vertical (reserved — do not enter Assessor code) |
| TerraTreasury Vertical | County Treasurer application vertical (reserved) |
| TerraAudit Vertical | County Auditor application vertical (reserved — "audit" ≠ TerraTrace) |
| TerraRecorder Vertical | County Recorder application vertical (reserved) |
| AI Swarm Scale | 1,008+ agent hierarchical coordination beyond current pilot architecture |

---

## Parallel Execution Rules (Slice 25.5 applies here)

1. `@tf-contract-truth` and `@tf-proof-audit` always run in **parallel** (Phase B)
2. `@tf-writer` always runs **alone** (Phase C / D fixes) — never alongside another writer
3. `@tf-checkpoint` always runs **last** in a phase, after proof wall is green
4. No phase may open while the previous phase is still at active checkpoint status
5. A new explicit human go/no-go is required before every `@tf-phase-orchestrator` Phase A

---

## Agent Assignment Summary

| Phase | Orchestrator | Truth | Proof | Writer | Checkpoint |
|-------|-------------|-------|-------|--------|------------|
| GATE-0 | — (human) | — | — | — | — |
| 1: Forge F1 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2: Forge F2 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3: Wave 0 Debt | ✅ | ✅ | ✅ | ledger only | ✅ |
| 4: Suite Homes | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5: Workbench | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6: Auth Close | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7: TerraTrace | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8: TerraPilot | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9: Multi-tenant | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10: Security | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11: Attestation | ✅ | ✅ | ✅ | — | ✅ |

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation |
|----|------|----------|------------|------------|
| R1 | Phase map treated as execution approval | High | Medium | Repeat hard-stop rule at every phase entry |
| R2 | Agent scaffolding promotes itself to governance authority | High | Low | README posture fix + explicit "complement not override" language in every agent file |
| R3 | Later phases begin before earlier proof walls close | High | Medium | Require explicit checkpoint ID before any new Phase A charter is opened |
| R4 | Post-Assessor verticals bleed into Assessor code | High | Low | Forbidden-path list in orchestrator + NEVER-TOUCH labels on vertical directories |
| R5 | Wave 0 debt cleanup starts without ledger approval | Med | Medium | Codex mechanical-only gate enforced after triage approval |
| R6 | TerraTrace append-only constraint implemented as delete+re-insert | High | Low | Proof wall test must assert no in-place event mutation |

---

## Document Status (Slice 26)

- [x] Definition of Done defined
- [x] Honest classification of agent tooling slice recorded
- [x] All 11 phases named with agent assignments and entry gates
- [x] Post-Assessor phases deferred explicitly
- [x] Parallel execution rules carried forward from Slice 25.5
- [x] Risk register complete
- [x] Hard-stop dependency preserved throughout
- [x] GATE-0 human go/no-go decision recorded in `progress.md` (2026-03-18)
- [x] Phase 1 Charter open (see below)

---

# Phase 1 Execution — Forge F1: Comparable Sales Rehost Proof

> **Status:** OPEN — proof wall must be built before any source edits
> **Charter authorized by:** GATE-0 decision, 2026-03-18
> **Checkpoint on close:** CP-W3-1

---

## Phase 1 Charter

**Objective:**
Prove Comparable Sales can be rehosted into its correct Forge-owned lane without
violating shell contracts, cross-suite ownership, or assessor workflow boundaries.

**Scope:**
- Comparable Sales rehost proof only
- Minimal files required for proof
- No opportunistic cleanup
- No unrelated UI modernization
- No auth redesign
- No persistence redesign outside the proof lane

**Allowed agents:**
- `@tf-phase-orchestrator`
- `@tf-contract-truth`
- `@tf-proof-audit`
- `@tf-writer`
- `@tf-checkpoint`

**Write authority:**
- `@tf-writer`: sole writer for source/test changes in this phase
- `@tf-checkpoint`: governance files only
- all others: read-only

**Required proof before edits:**
- current route ownership map
- current suite ownership map
- current shell launch behavior for Comparable Sales
- current regression surface list

**Required proof after edits:**
- Comparable Sales launches from the correct Forge-owned surface
- no cross-suite writes introduced
- no shell contract regression
- no Property Workbench regression
- tests and proof artifacts attached

**Exit checkpoint:** CP-W3-1 only. Hard stop reinstated immediately on closure.

---

## CP-W3-1 Proof Wall

> **This wall must be GREEN before Phase 1 is closed. tf-proof-audit owns this checklist.**

### Pre-change evidence (required before @tf-writer opens any file)

- [x] Current launch path captured — `PropertyForge.tsx` routes `?tab=sales` → `<SalesComparison />`
- [x] Current owner suite identified — **Forge** (SalesComparison sub-tab wrapper; no other suite touches it)
- [x] Current dependent routes/components listed — `ComparableSalesPanel` ← `SalesComparison` ← `PropertyForge`
- [x] Current failing or missing behaviors enumerated — **none found; all behaviors present and passing**

### Post-change evidence (required before @tf-checkpoint is invoked)

- [x] Route proof — `PropertyForge.tsx` wires `?tab=sales` and state hint to `SalesComparison`
- [x] Ownership proof — no cross-suite import; Forge exclusively owns `SalesComparison.tsx`
- [x] Shell contract proof — no QUARANTINE live imports in `frontend/apps/os-shell/src/**`
- [x] Regression proof — `ComparableSalesForgeHost.test.tsx` 5/5 ✅
- [x] Screenshot/log/test artifacts — test run captured above (585ms, 5/5)

### Pass conditions

- [x] Comparable Sales rehosted correctly ✅ (already correct — verification slice)
- [x] No unauthorized suite ownership drift ✅
- [x] No broken launch surfaces ✅
- [x] No broken Property Workbench flows ✅
- [x] `pnpm run type-check` — clean ✅
- [x] `node --test os-platform/core/tests/phase83-tools.test.mjs` — 56/56 ✅

### Fail conditions (any one = FAIL, no partial credit)

- ~~Any new cross-suite coupling~~ — none introduced ✅
- ~~Any shell contract drift~~ — none ✅
- ~~Any unbounded file expansion beyond charter allowed_files~~ — @tf-writer not invoked ✅
- ~~Any writer-lane violation~~ — none ✅
- ~~Any unexplained test regression~~ — none ✅

**Result: ALL PASS — Phase 1 classified as verification slice. No source edits required.**

---

## Recon Commands (run before @tf-writer opens)

```bash
# Ownership recon
git status --short
rg "Comparable Sales|ComparableSales|comparable sales" .
rg "property-workbench|Workbench" .
rg "Forge|TerraForge" .
rg "route|router|launch|surface" src .governance .github

# Then, after proof wall is green:
dotnet build
pnpm run type-check
pnpm test
```

**Rule:** If the proof lane is docs-first and no product files have changed yet, log that honestly. No confetti-driven fake green.

---

# Phase 4 Execution — Wave 3A: Standalone Suite Homes Completion

> **Status:** AWAITING FOUNDER GO
> **Entry gate:** CP-W0-1 closed ✅
> **Checkpoint on close:** CP-W3-3

---

## Phase 4 Charter

**Objective:**
Prove that every suite home (Forge, Atlas, Dais, Dossier, GPT) meets the "honest home"
definition: no hardcoded fixture data in production paths, canonical route wired, backend
service confirmed reachable or explicit blocker recorded, no silent TODO-wired-to-real-API.

**Known baseline (pre-execution recon, 2026-03-18):**
- Canonical routes wired in `Router.tsx`: `/forge` `/atlas` `/dais` `/dossier` `/gpt` ✅
- Suite home files exist: `ForgeSuiteHome.tsx` (111L) · `AtlasSuiteHome.tsx` (94L) · `DaisSuiteHome.tsx` (122L) · `DossierSuiteHome.tsx` (88L) · `GptSuiteHome.tsx` (300L)
- Fixture signal scan (hardcoded/fixture/TODO wire/mock data/fake): **0 hits** across all 5
- API signal scan (fetch/useQuery/axios/service): **0 hits** across all 5
- Interpretation: suite homes may be blank shells that render without error but make no real service calls — this is what Phase B must verify per suite

**Scope:**
- 5 suite home files listed above
- Their direct service modules (per lane: `forgeAPI.ts`, `atlasAPI.ts`, `daisAPI.ts`, `dossierAPI.ts`, `gptAPI.ts` if they exist)
- Their direct test files if new tests are needed
- No cross-suite changes
- No Property Workbench changes
- No auth redesign

**Forbidden in this phase:**
- `**/ARCHIVE/**`
- `specialized/**`, `applications/**`
- `os-platform/ai-systems/ai-swarm/**`
- Wave 0 debt cleanup (belongs to Phase 5+)
- Any workbench tab files

**Success criteria (per suite — all 5 must pass):**
1. Suite home renders without hardcoded fixture data in production code path
2. Canonical route is confirmed wired (already true, must remain true after any edits)
3. Backend service is confirmed reachable OR an explicit, named blocker is recorded in the proof wall
4. No `TODO: wire to real API` passing silently in any test for this suite

**Proof commands:**
```
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

**Closure artifact:** New `CP-W3-3` section in `progress.md` with per-suite honesty verdict.

---

## Multi-Agent Parallel Execution Model

```
Phase A  — Orchestrator reads charter, confirms scope, issues agent invocation plan
             │
             ▼
Phase B  — PARALLEL (10 subagents, 5 suite pairs)
             │
             ├── Suite: TerraForge ─────┬── @tf-contract-truth  (truth subagent F)
             │                          └── @tf-proof-audit     (proof subagent F)
             │
             ├── Suite: TerraAtlas ─────┬── @tf-contract-truth  (truth subagent A)
             │                          └── @tf-proof-audit     (proof subagent A)
             │
             ├── Suite: TerraDais ──────┬── @tf-contract-truth  (truth subagent D)
             │                          └── @tf-proof-audit     (proof subagent D)
             │
             ├── Suite: TerraDossier ───┬── @tf-contract-truth  (truth subagent O)
             │                          └── @tf-proof-audit     (proof subagent O)
             │
             └── Suite: TerraGPT ───────┬── @tf-contract-truth  (truth subagent G)
                                        └── @tf-proof-audit     (proof subagent G)
             │
             ▼
Phase B Sync — Orchestrator collects all 10 subagent reports
               Builds per-suite verdict table (HONEST | BLOCKER RECORDED | GAP FOUND)
               │
               ├── All 5 HONEST → skip Phase C, go directly to Phase E
               └── Any GAP FOUND → open Phase C for that specific suite only
             │
             ▼
Phase C  — SEQUENTIAL (one suite at a time)
             @tf-writer opens only when Phase B identifies a gap
             Writes only the allowed files for the failing suite
             Does not open next suite until current suite is GREEN
             │
             ▼
Phase D  — Re-verification pass (if Phase C made any writes)
             @tf-proof-audit re-runs the affected suite's proof criteria
             type-check + phase83 gates must pass before Phase E
             │
             ▼
Phase E  — @tf-checkpoint records CP-W3-3
             Hard stop reinstated immediately
             Phase 5 requires new explicit founder go
```

---

## Phase B — Subagent Invocation Specs

All 10 subagents run in a single parallel batch. They are read-only. They do not write files.

### @tf-contract-truth Subagent (per suite)

**Invocation (spawn one per suite):**

```
Agent: @tf-contract-truth
Task:  Suite <NAME> backend route reachability audit

Read these files:
  - frontend/apps/os-shell/src/pages/suites/<Name>SuiteHome.tsx
  - frontend/apps/os-shell/src/services/<suiteName>API.ts (if exists)
  - frontend/apps/os-shell/src/services/suites/<suiteName>Service.ts (if exists)
  - Backend controller: search for <SuiteName>Controller in backend/src/
  - Router.tsx (confirm canonical route is wired)

Report:
  1. Is the canonical /<slug> route wired in Router.tsx? YES/NO
  2. Does the suite home make any real service calls? List them or state NONE.
  3. Is there a backend controller for this suite? Name it or state MISSING.
  4. Are there any 'TODO: wire to real API' or silent fixture patterns? List or state NONE.
  5. VERDICT: HONEST | BLOCKER:<description> | GAP:<description>
```

### @tf-proof-audit Subagent (per suite)

**Invocation (spawn one per suite):**

```
Agent: @tf-proof-audit
Task:  Suite <NAME> proof wall design — RED→GREEN criteria

Read these files:
  - frontend/apps/os-shell/src/pages/suites/<Name>SuiteHome.tsx
  - frontend/apps/os-shell/src/__tests__/suites/ (relevant test files for this suite)
  - frontend/apps/os-shell/src/services/<suiteName>API.ts (if exists)

Report:
  1. Current test coverage for this suite home: list test files or state NONE.
  2. Does any existing test assert real service wiring? YES/NO, which.
  3. RED criteria: what specific assertion would expose a fake/blank shell?
  4. GREEN criteria: what must be true for this suite to pass the honesty definition?
  5. Does @tf-writer need to create/modify any file to close the gap? YES (list) / NO.
  6. VERDICT: PASS (already honest) | NEEDS_PROOF_TEST | NEEDS_WIRING | NEEDS_BOTH
```

---

## Phase B Sync — Per-Suite Verdict Table (to be filled during execution)

| Suite | Route wired | Backend confirmed | Service calls present | Silent fixture | `@tf-contract-truth` | `@tf-proof-audit` | Final verdict |
|-------|------------|------------------|-----------------------|---------------|----------------------|-------------------|---------------|
| TerraForge | ✅ (pre-recon) | TBD | TBD | TBD | TBD | TBD | TBD |
| TerraAtlas | ✅ (pre-recon) | TBD | TBD | TBD | TBD | TBD | TBD |
| TerraDais | ✅ (pre-recon) | TBD | TBD | TBD | TBD | TBD | TBD |
| TerraDossier | ✅ (pre-recon) | TBD | TBD | TBD | TBD | TBD | TBD |
| TerraGPT | ✅ (pre-recon) | TBD | TBD | TBD | TBD | TBD | TBD |

---

## CP-W3-3 Proof Wall

> **This wall must be GREEN before Phase 4 is closed. `@tf-proof-audit` owns this checklist.**
> **One row per suite. Any FAIL = phase does not close.**

### Per-suite honesty checklist

| Suite | Canonical route wired | No hardcoded fixture in prod | Backend confirmed / blocker recorded | No silent TODO | Tests honest | VERDICT |
|-------|-----------------------|------------------------------|--------------------------------------|----------------|--------------|---------|
| TerraForge | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TerraAtlas | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TerraDais | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TerraDossier | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| TerraGPT | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

### Gate commands (must pass before CP-W3-3 is recorded)

- [ ] `pnpm run type-check` — clean
- [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` — 56/56

### Fail conditions (any one = phase does not close)

- Any suite home with hardcoded fixture data in the production render path
- Any suite without a named backend controller OR a named blocker recorded in this proof wall
- Any test that silently asserts a fake service response as if it were real wiring
- Any new cross-suite import introduced by `@tf-writer`
- Any forbidden-path file touched
- type-check errors
- phase83 regression below 56/56

---

## Write Authority for Phase 4

| Agent | Authorized writes |
|-------|------------------|
| `@tf-writer` | `frontend/apps/os-shell/src/pages/suites/<Name>SuiteHome.tsx` (only if gap found) · matching service file · matching test file · no other files |
| `@tf-checkpoint` | `progress.md` (CP-W3-3 closure section only) |
| All other agents | Read-only. No file writes. |

**Rule:** `@tf-writer` does not open a file until `@tf-contract-truth` AND `@tf-proof-audit`
have both returned a non-PASS verdict for that specific suite. One suite at a time. No bulk edits.

---

# Phase 9 Execution — TerraPilot Muse Mode

> **Status:** CLOSED — bounded implementation + proof tightening landed 2026-03-18
> **Entry gate:** historical founder go recorded in `progress.md`
> **Checkpoint on close:** `CP-W9-1`

---

## Phase 9 Charter

**Objective:**
Document the bounded TerraPilot Muse Mode lane as it actually exists in repo truth:
a read-only, context-grounded Muse surface with trace emission, explicit no-mutation
boundaries, and Muse-only tool exposure.

**Known baseline (repo truth, 2026-03-18):**
- `frontend/apps/os-shell/src/services/pilotBridge.ts` exports the bounded `buildPilotContext` and `buildExplainRequest` helpers
- `frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx` renders the Muse shell, now emits canonical TerraTrace tool events, and enforces unauthenticated and no-parcel states
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx` loads only Muse/read-only tools via `listPilotTools('muse')` plus `filterMuseReadOnlyTools`
- `frontend/apps/os-shell/src/pages/PilotConsole.tsx` and `frontend/apps/os-shell/src/pages/PilotConsoleContent.tsx` now pin validate/invoke calls to `mode: 'muse'`
- `frontend/apps/os-shell/src/__tests__/auth/phase9-museMode.contract.test.ts`, `frontend/apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx`, `frontend/apps/os-shell/src/__tests__/pilot/TerraPilotPanel.muse.test.tsx`, and `frontend/apps/os-shell/src/__tests__/pilot/PilotConsole.museFilter.test.tsx` now prove the current Phase 9 boundary
- Numbering drift remains real: this block follows the live Slice 29 Phase 9 naming in `progress.md` and does not rewrite the older Slice 26 roadmap numbering

**Scope:**
- PilotBridge contract truth
- TerraPilotPanel Muse shell truth
- PropertyPilot / full-console Muse-only tool exposure
- Trace-emission and read-only boundary proof
- Related tests only
- No backend explain redesign
- No RBAC / allowlist reopening beyond read-only evidence

**Allowed agents:**
- `@tf-phase-orchestrator`
- `@tf-contract-truth`
- `@tf-proof-audit`
- `@tf-writer`
- `@tf-checkpoint`

**Write authority:**
- `@tf-writer`: sole writer for source/test changes in this phase if a bounded gap is found
- `@tf-checkpoint`: governance files only
- all others: read-only

**Allowed files:**
- `frontend/apps/os-shell/src/services/pilotBridge.ts`
- `frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx`
- `frontend/apps/os-shell/src/api/pilotApi.ts`
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx`
- `frontend/apps/os-shell/src/pages/PilotConsole.tsx`
- `frontend/apps/os-shell/src/pages/PilotConsoleContent.tsx`
- `frontend/apps/os-shell/src/__tests__/auth/phase9-museMode.contract.test.ts`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx`
- directly related files under `frontend/apps/os-shell/src/__tests__/pilot/**`

**Forbidden in this phase:**
- `**/ARCHIVE/**`
- `specialized/**`, `applications/**`
- `os-platform/ai-systems/ai-swarm/**`
- Multi-tenant / security / deployment work
- Broad Pilot UI redesign
- Write-capable Muse tools
- Runtime governance changes outside the named Muse shell lane

**Success criteria:**
1. `PilotBridge` remains the bounded source of actor/county/parcel context assembly for Muse Mode
2. `TerraPilotPanel` remains read-only and emits canonical TerraTrace tool events without invoking mutation paths
3. Muse surfaces expose only Muse/read-only tools and hide pilot-mode or write-capable tools
4. Auth/no-parcel states and explain UI states remain explicit and testable
5. Phase 9 proof surfaces remain green

**Proof commands:**
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
pnpm vitest run frontend/apps/os-shell/src/__tests__/auth/phase9-museMode.contract.test.ts frontend/apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx frontend/apps/os-shell/src/__tests__/pilot/TerraPilotPanel.muse.test.tsx frontend/apps/os-shell/src/__tests__/pilot/PilotConsole.museFilter.test.tsx
```

**Closure artifact:** `CP-W9-1` in `progress.md`, recording the bounded Muse-mode trace/proof tightening that landed in this phase.

---

## Multi-Agent Parallel Execution Model

```
Phase A  — Orchestrator reads charter, confirms live scope, issues lane plan
             │
             ▼
Phase B  — PARALLEL (6 subagents, 3 lane pairs; read-only)
             │
             ├── Lane PB (PilotBridge + Panel) ──┬── @tf-contract-truth (PB)
             │                                   └── @tf-proof-audit    (PB)
             │
             ├── Lane MS (Muse Surface Filter) ──┬── @tf-contract-truth (MS)
             │                                   └── @tf-proof-audit    (MS)
             │
             └── Lane TR (Trace + Read-Only) ────┬── @tf-contract-truth (TR)
                                                 └── @tf-proof-audit    (TR)
             │
             ▼
Phase B Sync — Orchestrator merges reports into one verdict table
               (PASS | BLOCKER RECORDED | GAP FOUND)
               │
               ├── All lanes PASS → treat as verification slice
               └── Any GAP FOUND → open Phase C only for the failing lane
             │
             ▼
Phase C  — SEQUENTIAL (single writer lane, only if needed)
             @tf-writer runs alone inside allowed files only
             │
             ▼
Phase D  — Re-verification
             @tf-proof-audit re-runs the affected proof lane
             │
             ▼
Phase E  — @tf-checkpoint records or confirms CP-W9-1
```

---

## Execution Outcome (2026-03-18)

- Phase B read-only lanes found three bounded gaps inside the allowed file set:
  - PB: `TerraPilotPanel` lacked runtime proof for auth/no-parcel/trace behavior and still relied on placeholder explain output
  - MS: standalone Muse console flows loaded Muse-only tools correctly but did not explicitly pin validate/invoke requests to `mode: 'muse'`
  - TR: `TerraPilotPanel` still used legacy `emitIntent` / `emitResult` instead of canonical TerraTrace tool helpers
- Phase C stayed inside strict single-writer isolation and applied only the bounded repair:
  - rewired `TerraPilotPanel.tsx` to `generateCorrelationId` + `emitToolInvoked` / `emitToolSucceeded` / `emitToolFailed`
  - pinned `PilotConsole.tsx` and `PilotConsoleContent.tsx` validate/invoke calls to `mode: 'muse'`
  - strengthened the Muse contract test and added runtime proof for the panel plus both console surfaces
- Phase D closure wall passed:
  - `pnpm vitest run ...phase9-museMode.contract.test.ts ...PropertyPilot.museFirst.test.tsx ...TerraPilotPanel.muse.test.tsx ...PilotConsole.museFilter.test.tsx` → `27/27 PASS`
  - `pnpm run type-check` → clean
  - `node --test os-platform/core/tests/phase83-tools.test.mjs` → `56/56 PASS`
- Backend explain integration remains explicitly deferred. This phase closed the Muse shell boundary, not the backend explain pipeline.

---

## Phase B — Subagent Invocation Specs

All 6 subagents run in one parallel batch. They are read-only and do not write files.

### @tf-contract-truth Subagent (per lane)

**Invocation template (spawn one per lane):**

```text
Agent: @tf-contract-truth
Task:  TerraPilot Muse lane <PB|MS|TR> contract truth audit

Read these files:
  - PB: frontend/apps/os-shell/src/services/pilotBridge.ts
        frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx
  - MS: frontend/apps/os-shell/src/api/pilotApi.ts
        frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx
        frontend/apps/os-shell/src/pages/PilotConsole.tsx
        frontend/apps/os-shell/src/pages/PilotConsoleContent.tsx
  - TR: frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx
        frontend/apps/os-shell/src/__tests__/auth/phase9-museMode.contract.test.ts

Report:
  1. Current source-of-truth contract for this lane (files + symbols)
  2. Current placeholder or stub behavior, if any
  3. Any read-only / mode / trace-boundary risk discovered (NONE or list)
  4. VERDICT: PASS | BLOCKER:<description> | GAP:<description>
```

### @tf-proof-audit Subagent (per lane)

**Invocation template (spawn one per lane):**

```text
Agent: @tf-proof-audit
Task:  TerraPilot Muse lane <PB|MS|TR> proof wall design (RED→GREEN)

Read these files:
  - frontend/apps/os-shell/src/__tests__/auth/phase9-museMode.contract.test.ts
  - frontend/apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx
  - relevant files under frontend/apps/os-shell/src/__tests__/pilot/
  - lane-specific source files from @tf-contract-truth output

Report:
  1. Current test coverage for lane (list files or NONE)
  2. Does current proof match the live Muse boundary? YES/NO, evidence
  3. RED criteria: assertion that would fail if Muse truth regressed
  4. GREEN criteria: explicit conditions to close the lane
  5. Does `@tf-writer` need to modify files? YES(list) / NO
  6. VERDICT: PASS | NEEDS_PROOF_TEST | NEEDS_WIRING | NEEDS_BOTH
```

---

## Phase B Sync — Lane Verdict Table

| Lane | Context truth | Muse-only filter | Read-only trace boundary | `@tf-contract-truth` | `@tf-proof-audit` | Final verdict |
|------|---------------|------------------|--------------------------|----------------------|-------------------|---------------|
| PB — PilotBridge + Panel | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ⚠️ NEEDS_BOTH | **PASS AFTER BOUNDED FIX ✅** |
| MS — Muse Surface Filter | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ⚠️ NEEDS_PROOF_TEST | **PASS AFTER BOUNDED FIX ✅** |
| TR — Trace + Read-Only | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ⚠️ NEEDS_BOTH | **PASS AFTER BOUNDED FIX ✅** |

---

## CP-W9-1 Proof Wall

> **This wall defines the bounded closure criteria for Phase 9.**
> **This wall is now closed on executed evidence, not a reconstructed placeholder.**

### Closure evidence

- [x] `PilotBridge` exports `buildPilotContext` and `buildExplainRequest`
- [x] `TerraPilotPanel` exposes auth/no-parcel/explain states
- [x] `TerraPilotPanel` uses `generateCorrelationId` plus canonical TerraTrace tool emitters
- [x] Muse surfaces load only Muse/read-only tools and standalone console validate/invoke paths pin `mode: 'muse'`
- [x] Runtime tests cover `TerraPilotPanel` auth/no-parcel/success/failure behavior
- [x] Runtime tests cover Muse-only filtering in `PilotConsole` and `PilotConsoleContent`
- [x] Targeted Phase 9 proof tests pass

### Gate commands

- [x] `pnpm run type-check`
- [x] `node --test os-platform/core/tests/phase83-tools.test.mjs`
- [x] `pnpm vitest run frontend/apps/os-shell/src/__tests__/auth/phase9-museMode.contract.test.ts frontend/apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx frontend/apps/os-shell/src/__tests__/pilot/TerraPilotPanel.muse.test.tsx frontend/apps/os-shell/src/__tests__/pilot/PilotConsole.museFilter.test.tsx`

### Fail conditions

- Any write-capable tool appears on a Muse surface
- Any direct mutation path is introduced into `TerraPilotPanel`
- Any actor/county/parcel bridge contract is removed or bypassed
- Any unauthorized file outside the allowed set is touched

**Result:** CLOSED — BOUNDED IMPLEMENTATION

---

## Write Authority for Phase 9

| Agent | Authorized writes |
|-------|------------------|
| `@tf-writer` | `frontend/apps/os-shell/src/services/pilotBridge.ts` · `frontend/apps/os-shell/src/components/pilot/TerraPilotPanel.tsx` · `frontend/apps/os-shell/src/api/pilotApi.ts` · `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyPilot.tsx` · `frontend/apps/os-shell/src/pages/PilotConsole.tsx` · `frontend/apps/os-shell/src/pages/PilotConsoleContent.tsx` · `frontend/apps/os-shell/src/__tests__/auth/phase9-museMode.contract.test.ts` · `frontend/apps/os-shell/src/__tests__/workbench/PropertyPilot.museFirst.test.tsx` · directly related files in `frontend/apps/os-shell/src/__tests__/pilot/**` |
| `@tf-checkpoint` | `progress.md` (`CP-W9-1` closure section only) |
| All other agents | Read-only. No file writes. |

**Rule:** `@tf-writer` runs alone. If a gap is found, only one Muse lane may be open at a time.

---

# Slice 34: Post-CP-W9 Codex Execution Plan

> **Purpose:** Turn the next realistic Codex work after `CP-W9-1` into bounded,
> evidence-first phases that separate governance truth, dirty-worktree
> classification, and any later product/backend repair.
>
> **Classification:** Planning-only. Does not authorize execution. Each phase
> below still requires an explicit human go/no-go before `@tf-writer` opens.
>
> **Strategy:** Reconcile workflow truth first, classify the current dirty tree
> second, then open exactly one writer lane at a time. Parallelism is read-only
> until a bounded lane is proven.

---

* **Project:** Post-CP-W9 Codex Closure + Triage
* **Date:** 2026-03-19
* **Branch:** post-r3/w5f-registry-edge-cleanup
* **Prereq:** `CP-W9-1` closed

---

## Definition of Done

- [x] Next Codex phases are named and ordered
- [x] Workflow/docs drift, Dais drift, backend Pilot drift, and local artifacts are separated into distinct lanes
- [x] Each future lane has an explicit allowed-file set
- [x] Each future lane has an explicit proof wall
- [x] Read-only parallel subagent work is defined before any writer lane opens
- [x] One-writer-per-lane isolation is preserved
- [x] No text here authorizes execution by itself

---

## Known Baseline (Repo Truth, 2026-03-19)

- Current `HEAD` is `55489dca4` (sync point for the latest workflow barrier check)
- Earlier Dais + backend Pilot dirty lanes are no longer dirty in working tree; they were absorbed in `862e8de61`
- Active docs/workflow paths needing explicit lane classification are:
  - `.governance/workflow/plan.md`
  - `.governance/workflow/progress.md` (for reconciliation closure notes)
  - `docs/superpowers/plans/2026-03-18-phase5-workbench-completeness.md` (untracked)
  - `docs/superpowers/plans/2026-03-18-phase9b-10-11-explain-hitl-sovereign.md` (untracked)
- Active repository-hygiene drift requiring explicit classification:
  - `.gitignore`
- Local-only artifacts exist and must never be batched with product-code closure:
  - `.claude/agents/`
  - `.claude/settings.json`
  - `.claude/settings.local.json`
  - `backend/tests/**/TestResults/`
- AGENTS default scope remains core-governance-first; any Dais or backend writer phase requires explicit authorization beyond this planning slice

---

## Hard Rules For The Next Lanes

1. Workflow truth is closed before product truth. No suite or backend writer lane opens while commit/hash/queue drift remains in workflow docs.
2. Dirty-tree classification is a separate phase. Do not silently fold docs, Dais, backend, and local artifacts into one cleanup commit.
3. Dais and backend Pilot remain separate writer lanes. They do not share a closure wall.
4. Local artifacts are hygiene-only. They never ride with Dais or backend product work.
5. Wave 0 mechanical cleanup stays blocked until a human marks a bucket "mechanical" after triage.

---

## Phase Map

### GATE-P0: Human Go/No-Go After `CP-W9-1`

| Field | Value |
|-------|-------|
| **Type** | Human decision gate |
| **Trigger** | Explicit `go` naming the next bounded phase below |
| **If go** | Open exactly one phase |
| **If no-go** | Stay at `CP-W9-B`; docs-only evidence refresh is allowed |
| **Checkpoint** | `CP-W9-B` (current closed baseline) |

This gate is phase-specific. Saying `go` for Phase A does not automatically open
Phase B or later phases.

---

### Phase A: Workflow Ledger Reconciliation

| Field | Value |
|-------|-------|
| **Goal** | Bring workflow truth back in line with repo truth after `CP-W9-1` closure |
| **Type** | Docs/governance only |
| **Entry gate** | `GATE-P0` explicit go for Phase A |
| **Allowed files** | `.governance/workflow/progress.md` · `.governance/workflow/plan.md` |
| **Forbidden files** | Any frontend/backend product file |
| **Proof commands** | `git log --oneline -5` · `git status --short` · `rg -n "^## Current Status|^## Next Steps|^## Known Debt / Follow-ups" .governance/workflow/progress.md` |
| **Closure artifact** | Updated `progress.md` + `plan.md` truth with current `HEAD` and current next-lane posture |
| **Checkpoint** | `CP-W9-A` |

**Success criteria:**
- top-level commit/hash truth matches `HEAD`
- active next-step posture matches repo reality
- no completed item is still written as open
- no new product phase is implied by docs wording

---

### Phase B: Dirty Worktree Triage

| Field | Value |
|-------|-------|
| **Goal** | Classify every current dirty path into one lawful future lane |
| **Type** | Docs/evidence only |
| **Entry gate** | Phase A closed |
| **Allowed files** | `.governance/workflow/dirty-worktree-triage.md` (new) · optional bounded `progress.md` note |
| **Forbidden files** | Product source edits |
| **Proof commands** | `git status --short` · `rg -n "WF-|DAIS-|PILOT-BE-|LOCAL-" .governance/workflow/dirty-worktree-triage.md` |
| **Closure artifact** | `dirty-worktree-triage.md` with one owner lane per dirty path |
| **Checkpoint** | `CP-TRIAGE-1` |

**Required lane buckets:**
- `WF-*` workflow/docs drift
- `GIT-*` repository-hygiene/config drift
- `DAIS-*` Dais frontend drift
- `PILOT-BE-*` backend Pilot drift
- `LOCAL-*` local artifacts / generated or machine-local residue

**Minimum docs split inside `WF-*`:**
- `WF-A` operator-governance docs
- `WF-B` Atlas/workbench closure note
- `WF-C` standalone workbench execution-plan doc

---

### Phase C: Dais Suite Reconciliation

| Field | Value |
|-------|-------|
| **Goal** | Close the Dais suite-home stats seam drift as one bounded frontend lane |
| **Type** | Product/frontend |
| **Entry gate** | Phase B closed + explicit authorization for Dais writer scope |
| **Allowed files** | `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx` · `frontend/apps/os-shell/src/pages/suites/useDaisSuiteStats.ts` · `frontend/apps/os-shell/src/pages/suites/daisOperationalStats.ts` · `frontend/apps/os-shell/src/components/dais/CertRollPanel.tsx` · `frontend/apps/os-shell/src/components/dais/ManagementDashboardPanel.tsx` · `frontend/apps/os-shell/src/components/dais/NoticeBatchQueuePanel.tsx` · `frontend/apps/os-shell/src/__tests__/suites/daisQueueRouting.contract.test.tsx` · `frontend/apps/os-shell/src/__tests__/suites/daisNoticeOperationsRouting.contract.test.tsx` · `frontend/apps/os-shell/src/__tests__/suites/daisCertOperationsRouting.contract.test.tsx` · `frontend/apps/os-shell/src/__tests__/suites/daisManagementDashboardRouting.contract.test.tsx` |
| **Forbidden files** | Backend files · unrelated suites · workflow docs except checkpoint closure |
| **Proof commands** | `pnpm -C frontend test -- --run apps/os-shell/src/__tests__/suites/daisQueueRouting.contract.test.tsx apps/os-shell/src/__tests__/suites/daisNoticeOperationsRouting.contract.test.tsx apps/os-shell/src/__tests__/suites/daisCertOperationsRouting.contract.test.tsx apps/os-shell/src/__tests__/suites/daisManagementDashboardRouting.contract.test.tsx` · `pnpm -C frontend test -- --run apps/os-shell/src/__tests__/workflows/workflowEntryPoints.contract.test.tsx apps/os-shell/src/__tests__/workflows/operatorJourneys.contract.test.tsx apps/os-shell/src/__tests__/integration/suiteHandoff.contract.test.tsx` · `pnpm -C frontend type-check` · `pnpm run type-check` · `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Closure artifact** | `CP-DAIS-1` in `progress.md` |
| **Checkpoint** | `CP-DAIS-1` |

**Success criteria:**
- `DaisSuiteHome` and the three Dais panels align on the `useDaisSuiteStats` / `DaisOperationalStats` seam
- the four routing contract tests are deterministic against that seam
- targeted Dais routing tests pass without async warning noise from incidental stats loading
- no cross-suite file expansion occurs

---

### Phase D: Backend Pilot Isolation

| Field | Value |
|-------|-------|
| **Goal** | Classify and, if authorized, close the bounded backend drift in `CoPilotController.cs` |
| **Type** | Product/backend |
| **Entry gate** | Phase B closed + explicit authorization for backend writer scope |
| **Allowed files** | `backend/src/TerraFusion.Consciousness/CoPilot/CoPilotController.cs` plus directly required backend tests only |
| **Forbidden files** | Frontend Dais files · workflow docs except checkpoint closure |
| **Proof commands** | backend-targeted test/build command set to be fixed during Phase B truth pass; minimum wall includes `dotnet build` |
| **Closure artifact** | `CP-PILOT-BE-1` in `progress.md` |
| **Checkpoint** | `CP-PILOT-BE-1` |

**Success criteria:**
- backend Pilot drift is isolated from Muse frontend closure work
- route/contract truth is documented
- no frontend coupling is introduced during backend repair

---

### Phase E: Wave 0 Mechanical Debt Sweep (Conditional Only)

| Field | Value |
|-------|-------|
| **Goal** | Execute a narrow mechanical debt bucket only after human approval |
| **Type** | Conditional cleanup |
| **Entry gate** | Phase B closed + human marks a bucket `mechanical` |
| **Allowed files** | Bucket-specific only |
| **Forbidden files** | Any non-approved debt bucket |
| **Proof commands** | bucket-specific + `pnpm run type-check` + `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| **Closure artifact** | bucket-specific checkpoint |
| **Checkpoint** | `CP-W0-M1` or later |

**Rule:** This phase remains blocked until triage and human authorization narrow the bucket.

---

## Multi-Agent Parallel Execution Model

```text
Phase A  — Workflow Ledger Reconciliation
             │
             ├── PARALLEL (6 subagents, 3 lane pairs; read-only)
             │    ├── Lane HT: hash / branch / commit truth
             │    ├── Lane QS: queue / next-step / checkpoint truth
             │    └── Lane KD: known debt / follow-up truth
             │
             └── SINGLE WRITER
                  @tf-writer updates workflow docs only

Phase B  — Dirty Worktree Triage
             │
             ├── PARALLEL (8 subagents, 4 lane pairs; read-only)
             │    ├── Lane WF: workflow/docs drift
             │    ├── Lane DAIS: Dais frontend drift
             │    ├── Lane PILOT-BE: backend Pilot drift
             │    └── Lane LOCAL: local artifacts / generated residue
             │
             └── SINGLE WRITER
                  @tf-writer writes one triage artifact only

Phase C  — Dais Suite Reconciliation
             │
             ├── PARALLEL (6 subagents, 3 lane pairs; read-only)
             │    ├── Lane UI: Dais panels + suite shell
             │    ├── Lane RT: routing contract tests
             │    └── Lane CT: component/data contract truth
             │
             └── SINGLE WRITER
                  @tf-writer closes Dais only

Phase D  — Backend Pilot Isolation
             │
             ├── PARALLEL (4 subagents, 2 lane pairs; read-only)
             │    ├── Lane API: controller route / contract truth
             │    └── Lane PR: proof wall / test surface truth
             │
             └── SINGLE WRITER
                  @tf-writer closes backend only
```

---

## Subagent Invocation Templates

### `@tf-contract-truth` Template

```text
Agent: @tf-contract-truth
Task:  Post-CP-W9 lane <HT|QS|KD|WF|DAIS|PILOT-BE|LOCAL|UI|RT|CT|API|PR> truth pass

Read only the files assigned to your lane.

Report:
  1. Current source-of-truth files
  2. Current drift or ambiguity discovered
  3. Narrowest lawful allowed-file set for a writer
  4. VERDICT: PASS | BLOCKER:<description> | GAP:<description>
```

### `@tf-proof-audit` Template

```text
Agent: @tf-proof-audit
Task:  Post-CP-W9 lane <HT|QS|KD|WF|DAIS|PILOT-BE|LOCAL|UI|RT|CT|API|PR> proof wall design

Read only the files assigned to your lane and any directly related tests.

Report:
  1. Current proof surface
  2. Missing proof, if any
  3. RED criteria
  4. GREEN criteria
  5. Recommended proof commands
  6. VERDICT: PASS | NEEDS_PROOF | NEEDS_WIRING | NEEDS_BOTH
```

---

## Initial Phase-B Lane Ledger (Pre-Execution)

| Lane | Current dirty paths | Writer lane? | Notes |
|------|---------------------|--------------|-------|
| `WF-A` | `.governance/workflow/plan.md`, `.governance/workflow/progress.md` | active docs lane | phase-A reconciliation + checkpoint notes |
| `WF-C` | `docs/superpowers/plans/2026-03-18-phase5-workbench-completeness.md`, `docs/superpowers/plans/2026-03-18-phase9b-10-11-explain-hitl-sovereign.md` | separate docs lane | planning docs only; do not silently bundle with frontend execution |
| `GIT-1` | `.gitignore` | separate hygiene lane | classify independently from governance and product lanes |
| `DAIS-1` | none (clean in working tree) | no | closed in commit `862e8de61`; reopen only on new drift |
| `PILOT-BE-1` | none (clean in working tree) | no | closed in commit `862e8de61`; reopen only on new drift |
| `LOCAL-1` | `.claude/**`, `backend/tests/**/TestResults/` | no product writer | hygiene only |

---

## Document Status (Slice 34)

- [x] Planning-only classification recorded
- [x] Next Codex phases defined
- [x] Dirty worktree lanes separated
- [x] Parallel subagent model defined
- [x] Single-writer rule preserved
- [x] Execution not authorized by this text

---

# Slice 35: Debt Sweep + TerraCanon IDE Charter + AI Swarm Scale Charter

> **Purpose:** Close the 5 known-debt items (WF-1, WF-2, WF-3, IV-1, IV-2) as bounded
> mechanical lanes, then charter Phase B (TerraCanon IDE) and Phase D (AI Swarm Scale)
> as post-assessor product initiatives with defined scope, file maps, and proof gates.
>
> **Classification:** Lane 1, Lane 2, and Lane 3 are CLOSED.
> This section is retained as execution history for Slice 35.
>
> **Full specification:** `docs/superpowers/plans/2026-03-19-slice35-debt-terracanon-aiswarm.md`

---

## Slice 35 Phase Map

### Lane 1: Debt Sweep (CLOSED)

| Phase | ID | Scope | Gate |
|-------|----|-------|------|
| WF-1 + WF-3 | `CP-35-A` | Backfill Slice 22/23 commit hashes + fix `react-dom/test-utils` act() imports | Closed (`CP-35-A`) |
| WF-2 Console Noise | `CP-35-B` | Remove/promote ~500 `console.*` calls in production code (724 → ≤ 200) | Closed (`CP-35-B`) |
| IV-1 + IV-2 Income | `CP-35-C` | Wire `saveIncomeValuationRecord` persistence + archive `IncomeForgeModule.tsx` orphan | Closed (`CP-35-C`) |

### Lane 2: TerraCanon IDE (CLOSED)

| Phase | ID | Scope | Gate |
|-------|----|-------|------|
| TerraCanon Recon | `CP-35-D` | 7 parallel read-only subagents → bounded charter artifact | Closed (`GATE-35-1` consumed) |
| TerraCanon Impl | `CP-35-E` | Monaco + file I/O + TerraPilot explain + TerraTrace audit; code execution sandbox Phase 3 only | Closed (`CP-35-E`) |

### Lane 3: AI Swarm Scale (CLOSED)

| Phase | ID | Scope | Gate |
|-------|----|-------|------|
| Swarm Recon | `CP-35-F` | 5 parallel read-only subagents → bounded charter artifact | Closed (`GATE-35-2` consumed) |
| Swarm Scale Impl | `CP-35-G` | TerraTrace coverage gaps + coordinator hardening + synthetic scale test | Closed (`CP-35-G`) |

---

## Slice 35 Multi-Agent Model (summary)

```text
Lane 1 — Debt Sweep
  Phase 35-A: SubAgents HT-A1 + HT-A2 + HT-B1 → @tf-writer (docs + test imports)
  Phase 35-B: SubAgents CN-A + CN-B + CN-C + CN-D → @tf-writer (console sweep)
  Phase 35-C: SubAgents IV-A1 + IV-A2 → @tf-writer (persistence + archive)

Lane 2 — TerraCanon IDE
  Phase 35-D: SubAgents TC-A through TC-G → @tf-charter (charter synthesis)
  Phase 35-E: @tf-writer per charter file map

Lane 3 — AI Swarm Scale
  Phase 35-F: SubAgents SW-A through SW-E → @tf-charter (charter synthesis)
  Phase 35-G: @tf-writer per charter file map
```

---

## Slice 35 Write Authority

| Agent | Phase | Authorized writes |
|-------|-------|------------------|
| `@tf-writer` | 35-A | `progress.md` Slice 22/23 hash fields · `__tests__/**` act() imports |
| `@tf-writer` | 35-B | Production `.ts`/`.tsx` in `frontend/apps/os-shell/src/` (not `__tests__/`) |
| `@tf-writer` | 35-C | `IncomeApproach.tsx` · `IncomeValuationPanel.tsx` · `incomeValuationService.ts` · targeted tests · `IncomeForgeModule.tsx` archive move |
| `@tf-charter` | 35-D | `docs/superpowers/plans/2026-03-19-terracanon-charter.md` |
| `@tf-charter` | 35-F | `docs/superpowers/plans/2026-03-19-aiswarm-charter.md` |
| `@tf-writer` | 35-E/G | Per respective charter file maps |
| All other agents | All | Read-only |

---

## Slice 35 Document Status

- [x] Debt sweep (Lane 1) delivered and sealed
- [x] TerraCanon (Lane 2) recon + implementation delivered and sealed
- [x] AI Swarm Scale (Lane 3) recon + implementation delivered and sealed
- [x] Multi-agent parallel model defined for all three lanes
- [x] Single-writer isolation preserved per phase
- [x] Security constraints explicit (sandbox, PII, county isolation)
- [x] Full specification in `docs/superpowers/plans/2026-03-19-slice35-debt-terracanon-aiswarm.md`
