# CP-24 / Phase 31 — Test Depth Sprint Seal
**Date**: 2026-03-21
**SHA**: `8d935d4ce`
**Classification**: Test Quality — Phase 31 Complete

---

## Scope

Phase 31: Shell Chrome Integration Contract + PropertySearch Depth
Delivered inline (single session), sequential execution (C → A → B → gate → seal).

---

## Evidence Chain

| Evidence | Result |
|----------|--------|
| Baseline (Task C) | 6168/6168 passed (492 files) |
| Task A — shellRoutedContent.contract.test.ts | **12/12 PASS** ✅ |
| Task B — PropertySearch.test.tsx | **6/6 PASS** ✅ |
| Full convergence gate | **6186/6186 PASS** ✅ (479 files, 15 skipped) |
| Net new tests | +18 (12 shell contract + 6 PropertySearch) |
| tsc --noEmit | **EXIT 0** ✅ |
| ESLint (--no-ignore on new files) | **0 errors, 0 warnings** ✅ |

---

## New Test Files

### `__tests__/shell/shellRoutedContent.contract.test.ts` (12 tests)
Static analysis contract proving the persistent-chrome `shell-routed-content` container is correctly structured:
- Exactly one `shell-routed-content` testid in Desktop.tsx (unique anchor)
- `overflow-auto` class (pages scroll without body scroll)
- `absolute top-12 bottom-12` taskbar-aware positioning
- Container lives in `isHome` ELSE branch (home stays clean)
- `isHome === pathname === '/'` canonical home check
- Desktop wraps routed content with `<Outlet />`
- Router declares all 5 OS suite routes: `/forge`, `/atlas`, `/dais`, `/dossier`, `/gpt`
- Router declares `/property` PropertySearch entry route

### `__tests__/pages/PropertySearch.test.tsx` (6 tests)
First-ever behavioral test suite for the PropertySearch surface (entry point for all parcel work):
- Root testid stable on mount
- Loading spinner during initial fetch
- Results render after successful API response
- Empty-state message when no parcels found
- Recent parcels strip when `useRecentParcels` is populated
- Click navigation to `/property/:geoId`

---

## Pre-existing Contract Coverage (no overlap)

| Existing Contract | Phase | Covers |
|-------------------|-------|--------|
| `shellChrome.contract.test.ts` | Phase 22 | Z-depth + window sizing |
| `DesktopRouteLandmarkContract.test.tsx` | Phase 25 | Route landmarks (content mounts) |
| `PropertyAtlas.test.tsx` | Phase 5.3 | Atlas tab tool invocations |
| `PropertyClerk.test.tsx` | Phase 5 | Clerk tab (6 tools) |
| `PropertyTreasury.test.tsx` | Phase 5 | Treasury tab (7 tools) |
| `PropertyAudit.test.tsx` | Phase 5 | Audit tab (5 tools) |

Phase 31 adds the **missing gap**: `shell-routed-content` structural contract + PropertySearch behavioral tests.

---

## Parallel Agent Plan (Executed Inline)

Original plan called for 3 parallel agents (A: shell chrome, B: PropertySearch, C: regression).
Executed inline per user direction:
1. Task C (baseline) → confirmed 6168
2. Task A (shell contract) → 12 tests written + green
3. Task B (PropertySearch) → 6 tests written + green
4. Convergence gate → 6186/6186
5. Seal → `8d935d4ce`

---

## Open Items (unchanged from CP-22)

| Item | Owner | Status |
|------|-------|--------|
| SEC-005-ROTATE | SRE | JWT rotation required before prod |
| SRE-O1-OPS | SRE | TF_* env vars to staging/prod |
| Phase 29 live TerraCanon | Dev | Policy-hold until 2026-03-25 |

---

## Decision

**SEALED** — Phase 31 complete. Test corpus: 6186. All gates green.
No new blockers introduced. Existing G10 CONDITIONAL status unchanged.
