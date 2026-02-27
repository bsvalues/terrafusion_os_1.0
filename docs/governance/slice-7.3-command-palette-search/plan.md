# Slice 7.3 — CommandPalette Parcel Search: Plan

> Agent 3 of 5 · Governance Cycle · 2026-02-27
> Scope: Research-only. No source modifications.

---

## Situation

The CommandPalette (`Ctrl+K`) has a **minimal digits-only shortcut** that creates a
"Go to Parcel" navigation command when the query is all digits. This is useful but
incomplete — users cannot search by address, owner name, or partial parcel number.

The backend provides `GET /api/properties?search=` and the frontend has
`atlasService.searchParcels()` (with offline fallback). The infrastructure is ready;
the gap is wiring these into the CommandPalette with proper UX.

---

## Phase 1: Test Infrastructure (TDD)

> Write tests FIRST, then implement to make them pass.

### Task 1.1: Parcel Direct-Nav Tests (Existing Behavior)

**File**: `frontend/apps/os-shell/src/shell/command-palette/__tests__/ParcelSearch.test.tsx`

Write tests that validate the **existing** digits-only behavior:

| # | Test Case | Acceptance Criterion |
|---|-----------|---------------------|
| 1 | Typing `"1234567890"` shows "Go to Parcel 1234567890" | Label text matches |
| 2 | Parcel command is the **first** result (index 0 in flatList) | `aria-selected="true"` on first option |
| 3 | `navigation` group header renders when parcel command present | `data-testid="command-palette-group-navigation"` exists |
| 4 | Pressing Enter navigates to `/property/12345` | `mockNavigate` called with correct path |
| 5 | Palette closes after Enter selection | `isOpen` is `false` |
| 6 | Clicking parcel result navigates | Same as #4 but via click |
| 7 | Non-numeric input (`"abc"`) hides parcel command | No "Go to Parcel" text |
| 8 | Mixed input (`"123abc"`) hides parcel command | No "Go to Parcel" text |
| 9 | Empty input hides parcel command | No navigation group |
| 10 | Whitespace-only input hides parcel command | No navigation group |
| 11 | Description is "Open property workbench for this parcel" | Text content verified |

**Mocks** (reuse existing patterns from `CommandPalette.test.tsx`):
- `react-router-dom` → `useNavigate` returns `mockNavigate`
- `orchestration/moduleActivation` → `activateModule` returns `mockActivateModule`
- `stores/settingsStore` → `useSettingsStore` returns keyboard shortcuts

**Definition of Done (Task 1.1)**:
- [ ] 11 tests written
- [ ] All 11 pass against current implementation (no code changes)
- [ ] TypeScript compiles with zero errors

---

### Task 1.2: API-Backed Search Tests (New Behavior)

**File**: `frontend/apps/os-shell/src/shell/command-palette/__tests__/ParcelApiSearch.test.tsx`

Write tests for the NEW search behavior:

| # | Test Case | Acceptance Criterion |
|---|-----------|---------------------|
| 1 | Typing `"clearwater"` (≥ 3 chars) calls search API after 300ms debounce | Mock API called with `search=clearwater` |
| 2 | Search results appear in `navigation` group | Result with address "3210 W Clearwater Ave" visible |
| 3 | Each result shows parcel number + address + owner | All three fields visible |
| 4 | Selecting a result navigates to `/property/{parcelNumber}` | `mockNavigate` called correctly |
| 5 | Selecting a result updates parcel context | `setParcelContext` called with correct data |
| 6 | Selecting a result records to recent commands | `addToRecent` called |
| 7 | Typing < 3 chars does NOT trigger API search | Mock API NOT called |
| 8 | API error shows graceful fallback (no crash, still shows local commands) | Error handled silently |
| 9 | Loading state shows "Searching…" while API in-flight | Loading indicator visible |
| 10 | Rapid typing debounces (only last query fires) | API called once for final query |
| 11 | Typing clears previous results before new ones arrive | Stale results not shown |
| 12 | Numeric input shows both "Go to Parcel" AND API results | Both commands visible |
| 13 | "N more results" link appears when `totalCount > 5` | Link text visible |

**Mock additions**:
- `services/atlasService` → `searchParcels` or a new `propertySearchApi`
- `context/parcelContext` → `setParcelContext`

**Definition of Done (Task 1.2)**:
- [ ] 13 tests written
- [ ] Tests initially FAIL (TDD red phase)
- [ ] TypeScript compiles with zero errors

---

## Phase 2: Implementation

### Task 2.1: Create `useParcelSearch` Hook

**File**: `frontend/apps/os-shell/src/shell/command-palette/useParcelSearch.ts`

```ts
interface UseParcelSearchResult {
  results: ParcelSearchResult[];
  isLoading: boolean;
  error: string | null;
}

interface ParcelSearchResult {
  parcelNumber: string;
  address: string;
  ownerName: string;
  assessedValue: number;
  countyName: string;
}
```

Responsibilities:
- Accept `query: string`, `enabled: boolean` (only when palette is open)
- Debounce 300ms
- Call `GET /api/properties?search={query}&pageSize=5` with auth header
- Fallback to `atlasService.searchParcels()` if properties API fails
- Return results, loading state, error
- Cancel in-flight requests on new query (`AbortController`)
- Clear results when palette closes

**Definition of Done (Task 2.1)**:
- [ ] Hook created with proper types
- [ ] Debounce works (300ms)
- [ ] AbortController cancels in-flight requests
- [ ] Auth header included
- [ ] Fallback to atlas service on error
- [ ] TypeScript compiles

### Task 2.2: Integrate Hook into CommandPalette

**File**: `frontend/apps/os-shell/src/shell/command-palette/CommandPalette.tsx`

Changes:
1. Import and call `useParcelSearch(query, isOpen)`
2. Convert `ParcelSearchResult[]` to `CommandItem[]` in a `useMemo`
3. Inject API results into `groups.navigation` alongside existing digits-only command
4. Show loading indicator in navigation group header when `isLoading`
5. Call `setParcelContext()` in each result's action
6. Call `addToRecent()` in each result's action
7. Add "Open Property Search" link when `totalCount > 5`

**Constraints**:
- Do NOT remove existing digits-only "Go to Parcel" (keep as power-user shortcut)
- API results appear BELOW the direct-nav command (when both present)
- No changes to other command categories

**Definition of Done (Task 2.2)**:
- [ ] API results appear in palette when query ≥ 3 chars
- [ ] Digits-only still works (backward compat)
- [ ] Loading state visible
- [ ] Error handled gracefully
- [ ] `setParcelContext()` called on selection
- [ ] All Task 1.1 tests still pass
- [ ] All Task 1.2 tests now pass

### Task 2.3: ARIA Combobox Enhancement (Best-Effort)

**File**: `frontend/apps/os-shell/src/shell/command-palette/CommandPalette.tsx`

Add:
- `role="combobox"` on input
- `aria-expanded={isOpen}` on input
- `aria-controls="tf-palette-listbox"` on input
- `id="tf-palette-listbox"` on listbox div
- `aria-activedescendant={flatList[selectedIndex]?.id}` on input
- `aria-autocomplete="list"` on input
- Unique `id` on each `CommandItemRow` button

**Definition of Done (Task 2.3)**:
- [ ] ARIA attributes added
- [ ] Passes axe/jest-axe audit
- [ ] Keyboard navigation still works

---

## Phase 3: Validation

### Task 3.1: Run All Tests

```bash
# Existing CommandPalette tests (regression)
pnpm vitest run frontend/apps/os-shell/src/shell/command-palette/__tests__/CommandPalette.test.tsx

# New parcel search tests
pnpm vitest run frontend/apps/os-shell/src/shell/command-palette/__tests__/ParcelSearch.test.tsx
pnpm vitest run frontend/apps/os-shell/src/shell/command-palette/__tests__/ParcelApiSearch.test.tsx

# Store tests
pnpm vitest run frontend/apps/os-shell/src/stores/__tests__/commandPaletteStore.test.ts
```

### Task 3.2: Type-Check

```bash
pnpm run type-check
```

### Task 3.3: Update Progress Doc

Update `progress.md` with final status of all tasks.

---

## Acceptance Criteria Summary

| ID | Criterion | Test File | Test #s |
|----|-----------|-----------|---------|
| AC-1 | Typing a parcel number shows "Go to Parcel" | ParcelSearch.test | 1, 2, 3 |
| AC-2 | Selecting parcel result navigates to `/property/{id}` | ParcelSearch.test | 4, 6 |
| AC-3 | Non-numeric input does not show "Go to Parcel" | ParcelSearch.test | 7, 8, 9, 10 |
| AC-4 | Palette closes after selection | ParcelSearch.test | 5 |
| AC-5 | Typing ≥ 3 chars triggers API search after 300ms | ParcelApiSearch.test | 1, 10 |
| AC-6 | API results show parcel#, address, owner | ParcelApiSearch.test | 2, 3 |
| AC-7 | Selecting API result updates parcel context | ParcelApiSearch.test | 5 |
| AC-8 | API error handled gracefully | ParcelApiSearch.test | 8 |
| AC-9 | Loading state shown | ParcelApiSearch.test | 9 |
| AC-10 | Numeric input shows both direct-nav AND API results | ParcelApiSearch.test | 12 |

---

## Definition of Done

1. ✅ All 11 direct-nav tests pass (ParcelSearch.test.tsx)
2. ✅ All 13 API search tests pass (ParcelApiSearch.test.tsx)
3. ✅ All existing CommandPalette tests still pass (regression)
4. ✅ `pnpm run type-check` passes
5. ✅ `useParcelSearch` hook created with debounce + abort + fallback
6. ✅ Parcel context updated on selection
7. ✅ ARIA combobox attributes added
8. ✅ Governance docs complete (discovery, research, plan, progress)
9. ✅ No forbidden paths modified (per AGENTS.md)

---

## Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-1 | Backend `/api/properties` returns different shape than expected | Medium | High | Use `atlasService.searchParcels()` fallback; type-guard response |
| R-2 | Auth token missing (unauthenticated user) | Low | Medium | 401 response handled by fallback path; palette still shows local commands |
| R-3 | API latency > 2s degrades UX | Medium | Medium | AbortController + loading state + cancel on new query |
| R-4 | Debounce causes "flicker" (results disappear then reappear) | Medium | Low | Show stale results with opacity hint until new results arrive |
| R-5 | ARIA changes break existing a11y tests | Low | Medium | Run axe audit before and after; compare violations |
| R-6 | `setParcelContext()` called but property doesn't exist in DB | Medium | Low | PropertyWorkbench already handles 404; shows error state |
| R-7 | Search results contain PII (owner names) in trace events | Low | High | Do NOT log owner names in TerraTrace events — only log parcelId |
| R-8 | Large result sets slow rendering | Low | Low | Limit to 5 results; no virtualization needed |

---

## Implementation Order

```
┌─────────────────┐
│ Task 1.1: Tests  │  (existing behavior — TDD green)
│ ParcelSearch     │
└────────┬────────┘
         │
┌────────▼────────┐
│ Task 1.2: Tests  │  (new behavior — TDD red)
│ ParcelApiSearch  │
└────────┬────────┘
         │
┌────────▼────────┐
│ Task 2.1: Hook   │  (useParcelSearch)
│ + API client     │
└────────┬────────┘
         │
┌────────▼────────┐
│ Task 2.2: Wire   │  (integrate into CommandPalette)
│ into palette     │
└────────┬────────┘
         │
┌────────▼────────┐
│ Task 2.3: ARIA   │  (combobox pattern)
│ enhancement      │
└────────┬────────┘
         │
┌────────▼────────┐
│ Task 3: Validate │  (all tests pass, type-check)
│ + progress doc   │
└────────┘
```
