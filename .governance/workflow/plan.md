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

## Document Status

- [ ] Definition of Done complete
- [ ] All phases defined
- [ ] All tasks have acceptance criteria
- [ ] Risk register complete
- [ ] Git strategy defined
- [ ] Dependencies verified
- [ ] Ready for execution
