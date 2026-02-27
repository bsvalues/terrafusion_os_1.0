# Slice 7.4 — Start Menu Recent Parcels: Discovery

> Agent: 4 of 5 | Date: 2026-02-27 | Scope: Research-only
> Verified from source — all line numbers reference current codebase state.

## Objective

Assess the current state of "Recent Parcels" in the Start Menu and identify any
remaining gaps against the Slice 7.4 acceptance criteria:

- AC-1: Recent parcels section appears in Start Menu
- AC-2: Shows up to 5 most recent parcels
- AC-3: Clicking a parcel navigates to `/property/{parcelId}`
- AC-4: Empty state shows "No recent parcels" message
- AC-5: Parcels persist across sessions (localStorage)
- AC-6: Start Menu closes after parcel navigation

## Evidence: Current Codebase State

### 1. StartMenu Component

**File**: [StartMenu.tsx](frontend/apps/os-shell/src/shell/desktop/StartMenu.tsx)

The Start Menu already contains a fully implemented `RecentParcelsSection` component
(lines 431–510). It was absorbed from the old ShellHome surface. **Current behavior:**

- **Line 20**: Imports `useRecentParcels` from `../../context/parcelContext`
- **Line 429**: `const MAX_DISPLAYED_PARCELS = 5;` — already 5, not 3
- **Lines 442–458**: Gate component renders empty state: "No recent parcels" when list is empty
- **Lines 461–510**: `RecentParcelsList` inner component:
  - Uses `useNavigate()` to navigate to `/property/${parcelId}` (line 468)
  - Calls `close()` from `useStartMenuStore` after navigation (line 469)
  - Slices to `MAX_DISPLAYED_PARCELS` (5) at line 484
  - Each button has `aria-label={`Parcel ${parcelId}`}` (line 487)
  - Uses `TerraSphereIcon` with `MapPin` glyph for visual consistency (lines 493–497)
- **Line 633**: `<RecentParcelsSection />` rendered between `<RecentAppsSection />` and divider

**Verdict**: All 6 acceptance criteria are already satisfied in the component code.

### 2. Parcel Context Store

**File**: [parcelContext.ts](frontend/apps/os-shell/src/context/parcelContext.ts)

The Zustand-based `useParcelContextStore` provides full recent parcels infrastructure:

- **Line 63**: `MAX_RECENT_PARCELS = 10` — store cap (display cap is 5 in StartMenu)
- **Line 74**: `recentParcels: string[]` state field (MRU ordered)
- **Lines 100–112**: `recordRecent(parcelId)` action — dedupes, prepends, caps at MAX
- **Line 178–180**: `persistRecentsToSession()` — **uses `localStorage`** (not sessionStorage)
  ```typescript
  localStorage.setItem(RECENT_PARCELS_STORAGE_KEY, JSON.stringify(recents));
  ```
- **Lines 186–210**: `restoreRecentsFromSession()` — tries localStorage first, falls back
  to sessionStorage with migration path (lines 196–203 migrate session→local)
- **Line 308**: `getRecentParcels()` — imperative access for non-React code
- **Line 315**: `recordRecentParcel(parcelId)` — public imperative recorder
- **Line 323**: `selectRecentParcel(parcelId)` — selects from recents, sets context,
  emits TerraTrace audit event with `source: 'indicator_recent'`
- **Line 369**: `useRecentParcels()` — React hook returning `state.recentParcels`

**Verdict**: Persistence is already localStorage-based (AC-5 satisfied). The earlier
discovery doc that claimed sessionStorage was **incorrect** — it described the initial
state before the recent implementation work was completed.

### 3. Existing Tests

#### StartMenuRecentParcels.test.tsx (ALREADY EXISTS)
**File**: [StartMenuRecentParcels.test.tsx](frontend/apps/os-shell/src/shell/desktop/__tests__/StartMenuRecentParcels.test.tsx)

Comprehensive test suite with 8 test cases covering all 6 acceptance criteria:
- AC-1: `renders "Recent Parcels" heading when parcels exist` (line 87)
- AC-1: `renders parcel items inside the Start Menu` (line 96)
- AC-2: `shows up to 5 parcels when more than 5 are available` (line 108)
- AC-2: `shows all parcels when fewer than 5 are available` (line 127)
- AC-2: `displays parcels in MRU order` (line 137)
- AC-3: `clicking a parcel navigates to /property/{parcelId}` (line 156)
- AC-4: `shows "No recent parcels" when no parcels exist` (line 172)
- AC-5: `persists recent parcels to localStorage` (line 186)
- AC-5: `restores recent parcels from localStorage on load` (line 193)
- AC-6: `closes Start Menu when a parcel is clicked` (line 210)

#### parcelContext.recents.test.ts (ALREADY EXISTS)
**File**: [parcelContext.recents.test.ts](frontend/apps/os-shell/src/__tests__/parcelContext/parcelContext.recents.test.ts)

Additional comprehensive tests for the store layer:
- MRU ordering, deduplication, cap enforcement
- selectRecentParcel with TerraTrace audit event emission
- Persistence to storage, restoration on init
- Integration with setParcelContext / clearParcelContext

#### startMenuStore.recent.test.ts (ALREADY EXISTS)
**File**: [startMenuStore.recent.test.ts](frontend/apps/os-shell/src/stores/__tests__/startMenuStore.recent.test.ts)

Tests for the startMenuStore's recent *apps* (not parcels), but verifies:
- addRecentApp MRU behavior, deduplication, MAX_RECENT cap
- persistenceService integration
- clearRecentApps

### 4. Start Menu Layout (Current Render Order, lines 622–644)

```
<Panel> (380px × 540px, glassmorphism, role="menu")
  <SearchInput />                   — auto-focused text search
  <PinnedAppsGrid />                — 4-col grid of pinned modules
  <RecentAppsSection />             — horizontal scroll of recent modules (SC-6.1)
  <RecentParcelsSection />          — ★ recent parcels (Slice 7.4 target)
  <div />                           — 1px white/10 divider
  <AllAppsList />                   — vertical list filtered by search
  <UserProfile />                   — avatar, county, settings/shortcuts
</Panel>
```

### 5. ParcelContextIndicator (Related Component)

**File**: [ParcelContextIndicator.tsx](frontend/apps/os-shell/src/components/ParcelContext/ParcelContextIndicator.tsx)

A separate component (not in StartMenu) that also shows recent parcels:
- Line 80: `maxRecents` prop defaults to 5
- Line 82: Uses same `useRecentParcels()` hook
- Shows in a dropdown with `recentsOpen` toggle state
- Calls `selectRecentParcel()` which emits TerraTrace events

This demonstrates the recents infrastructure is used in multiple UI surfaces,
the StartMenu being one of them.

### 6. Navigation Flow

When a user clicks a recent parcel in the StartMenu:
1. `handleParcelClick(parcelId)` fires (line 467)
2. `navigate(`/property/${parcelId}`)` routes to Property Workbench (line 468)
3. `close()` sets `isOpen: false` and clears search (line 469)
4. The Property Workbench route handler calls `setFromRoute(parcelId)` which
   records the parcel to recents via `recordRecent()` (parcelContext.ts line 111)

## Gap Analysis

| AC# | Criterion | Current State | Status |
|-----|-----------|---------------|--------|
| AC-1 | Section appears in Start Menu | `RecentParcelsSection` at line 633 | ✅ DONE |
| AC-2 | Shows up to 5 most recent parcels | `MAX_DISPLAYED_PARCELS = 5` at line 429 | ✅ DONE |
| AC-3 | Click navigates to `/property/{parcelId}` | `navigate()` at line 468 | ✅ DONE |
| AC-4 | Empty state "No recent parcels" | Lines 449–457 | ✅ DONE |
| AC-5 | localStorage persistence | `localStorage.setItem` at line 179 | ✅ DONE |
| AC-6 | Start Menu closes after navigation | `close()` at line 469 | ✅ DONE |
| Tests | All ACs covered | `StartMenuRecentParcels.test.tsx` (8 test cases) | ✅ DONE |

## Conclusion

**All acceptance criteria for Slice 7.4 are already satisfied.** The implementation
was completed in a prior agent session. The code, tests, and persistence layer are
all in place. The prior discovery doc contained stale information (described
sessionStorage when localStorage was already in use, said 3 parcels when 5 was already
set, said no empty state when one existed, said no close-on-nav when it was already wired).

### Remaining Considerations (Nice-to-Have, NOT blockers)

1. **Label hydration**: Parcel items show `Parcel {parcelId}` — no address/owner.
   The `ParcelContextIndicator` has label hydration logic (`resolveParcelLabel`).
   Could enrich StartMenu items with human-readable labels (future slice).

2. **Test for recents persistence uses sessionStorage**: The `parcelContext.recents.test.ts`
   persistence test (line 182) checks `sessionStorage` not `localStorage`. This is a
   test-level inaccuracy — the production code correctly uses localStorage. The test
   may pass due to the migration fallback but should be updated for correctness.

3. **Keyboard navigation**: Recent parcels are navigable by click/touch. No explicit
   arrow-key navigation between parcel items (the Start Menu's keyboard nav focuses
   on `focusedSection` but `'recent'` refers to recent *apps*, not parcels).
