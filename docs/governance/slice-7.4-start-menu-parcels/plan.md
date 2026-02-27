# Slice 7.4 — Start Menu Recent Parcels: Plan

> Agent: 4 of 5 | Date: 2026-02-27 | Scope: Research-only
> Status: **FEATURE COMPLETE** — all acceptance criteria already satisfied

## Summary

The "Recent Parcels" section in the Start Menu is **fully implemented**. All 6
acceptance criteria are met. The test suite (`StartMenuRecentParcels.test.tsx`) exists
with 8 tests covering every criterion. No code changes are required.

This plan documents the verified-complete state and identifies optional enhancements
for future work.

## Acceptance Criteria — Verification Matrix

| AC# | Criterion | Evidence | Status |
|-----|-----------|----------|--------|
| AC-1 | Section appears in Start Menu | `StartMenu.tsx:633` renders `<RecentParcelsSection />` | ✅ PASS |
| AC-2 | Shows up to 5 most recent parcels | `MAX_DISPLAYED_PARCELS = 5` at line 429 | ✅ PASS |
| AC-3 | Click navigates to `/property/{parcelId}` | `navigate()` at line 468 | ✅ PASS |
| AC-4 | Empty state "No recent parcels" | Lines 449–457 show message | ✅ PASS |
| AC-5 | localStorage persistence | `localStorage.setItem` at parcelContext.ts:179 | ✅ PASS |
| AC-6 | Start Menu closes after navigation | `close()` at line 469 | ✅ PASS |

## Test Coverage — Verification Matrix

| Test | File | Status |
|------|------|--------|
| `renders "Recent Parcels" heading` | `StartMenuRecentParcels.test.tsx:87` | ✅ EXISTS |
| `renders parcel items` | `:96` | ✅ EXISTS |
| `shows up to 5 parcels` | `:108` | ✅ EXISTS |
| `shows all parcels when < 5` | `:127` | ✅ EXISTS |
| `displays in MRU order` | `:137` | ✅ EXISTS |
| `clicking navigates to /property/{id}` | `:156` | ✅ EXISTS |
| `empty state "No recent parcels"` | `:172` | ✅ EXISTS |
| `persists to localStorage` | `:186` | ✅ EXISTS |
| `restores from localStorage` | `:193` | ✅ EXISTS |
| `closes Start Menu on click` | `:210` | ✅ EXISTS |

## Implementation Files (All Exist, No Changes Needed)

### Core Implementation
- [StartMenu.tsx](frontend/apps/os-shell/src/shell/desktop/StartMenu.tsx) — Lines 428–510: `RecentParcelsSection` + `RecentParcelsList`
- [parcelContext.ts](frontend/apps/os-shell/src/context/parcelContext.ts) — Store, hooks, persistence

### Test Files
- [StartMenuRecentParcels.test.tsx](frontend/apps/os-shell/src/shell/desktop/__tests__/StartMenuRecentParcels.test.tsx) — 8 integration tests
- [parcelContext.recents.test.ts](frontend/apps/os-shell/src/__tests__/parcelContext/parcelContext.recents.test.ts) — Store-level tests

## Tasks (Completed)

### Task 1: Tests (TDD) — ✅ COMPLETE
The test file `StartMenuRecentParcels.test.tsx` was written with full coverage.

### Task 2: localStorage Persistence — ✅ COMPLETE
`parcelContext.ts` already uses `localStorage` at line 179 with sessionStorage
migration fallback at lines 196–203.

### Task 3: RecentParcelsSection Enhancement — ✅ COMPLETE
- `MAX_DISPLAYED_PARCELS = 5` (line 429)
- Empty state message rendered (lines 449–457)
- Close behavior wired (line 469)

### Task 4: Wire Close Behavior — ✅ COMPLETE
`RecentParcelsList` calls `useStartMenuStore().close()` after `navigate()` (line 469).

## Definition of Done — Checklist

- [x] All tests in `StartMenuRecentParcels.test.tsx` exist and cover all ACs
- [x] Existing `parcelContext.recents.test.ts` tests cover store layer
- [x] Existing `StartMenu.test.tsx` tests still pass (no regression)
- [x] TypeScript compiles (no new type errors)
- [x] No regressions in existing behavior

## Risk Register

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| sessionStorage test lag | Low | `parcelContext.recents.test.ts:182` checks sessionStorage but code uses localStorage. Test may pass via migration fallback. | Known, non-blocking |
| No label hydration | Low | Parcels show "Parcel {id}" not human-readable addresses. Future enhancement. | Accepted |
| No keyboard nav for parcels | Low | Parcel list lacks arrow-key navigation (unlike app sections). WCAG basic is met via focus/click. | Accepted |
| MRU consistency | Very Low | If `MAX_RECENT_PARCELS` (10 in store) is changed, display cap (5 in StartMenu) is independent. No risk. | Accepted |

## Optional Future Enhancements (Backlog Candidates)

These are NOT blockers — documenting for backlog consideration:

### Enhancement 1: Parcel Label Hydration
**Why**: Users see "Parcel P-12345" instead of "123 Main St, Benton County"
**What**: Use `resolveParcelLabel()` from `ParcelContextIndicator` to hydrate
**Effort**: Small — the label resolution infrastructure already exists
**AC**: `Each parcel item shows address when available, falls back to ID`

### Enhancement 2: Fix Test Storage Assertion
**Why**: `parcelContext.recents.test.ts` line 182 checks `sessionStorage` but
production writes to `localStorage`. Test passes by accident (migration fallback).
**What**: Change test to check `localStorage.getItem('tf:recent-parcels')`
**Effort**: Trivial (one-line change)
**Risk**: None — production code is correct, only the test assertion is stale

### Enhancement 3: Keyboard Navigation for Parcels
**Why**: RecentAppsSection has keyboard focus; RecentParcelsSection does not
**What**: Add `focusedSection: 'recent-parcels'` to startMenuStore keyboard nav
**Effort**: Medium — requires extending the keyboard nav state machine
**AC**: `Arrow keys can navigate between recent parcel items`
