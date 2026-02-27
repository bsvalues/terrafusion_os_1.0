# Slice 7.1 — Desktop Visual Polish: Plan

> **Agent**: 1 of 5 · **Slice**: 7.1 · **Date**: 2026-02-27
> **Scope**: Lane B (`frontend/apps/os-shell/**`)
> **Approach**: TDD — write failing tests FIRST, then implement

---

## Phase 0: Test Harness (TDD — Write First)

### Task 0.1: Suite Window Layout Tests

**File**: `frontend/apps/os-shell/src/pages/suites/__tests__/suiteWindowLayout.test.tsx` (NEW)

**Tests to write**:
1. Each suite home root element should NOT have `min-h-screen` class
2. Each suite home root element should have `h-full` and `flex flex-col` classes
3. The sidebar+content wrapper should have `flex-1` and `min-h-0`
4. Sidebar nav should have `overflow-y-auto` for independent scrolling
5. ModuleLoader should NOT have `overflow-auto` on its root div
6. Suite homes should render correctly inside a constrained container (e.g., 800×600 div)

**Acceptance**: All tests RED before implementation, GREEN after.

### Task 0.2: Window Default Size Test

**File**: `frontend/apps/os-shell/src/stores/__tests__/desktopStore.windowSize.test.ts` (NEW)

**Tests to write**:
1. `DEFAULT_WINDOW_SIZE` should be `{ width: 1024, height: 700 }`
2. A newly opened window should have size 1024×700
3. Minimum window size should remain 400×300

**Acceptance**: Tests RED before, GREEN after implementation.

### Task 0.3: Desktop Icon Wiring Badge Test

**File**: `frontend/apps/os-shell/src/shell/desktop/__tests__/DesktopIconBadge.test.tsx` (NEW)

**Tests to write**:
1. Desktop icon parent div should have `group` class when `wiringStatus` is set
2. Wiring badge should become visible on icon hover

**Acceptance**: Tests RED before, GREEN after.

### Task 0.4: Z-Index Ordering Test

**File**: `frontend/apps/os-shell/src/shell/desktop/__tests__/ZIndexOrdering.test.tsx` (NEW)

**Tests to write**:
1. Taskbar z-index should be higher than maximum possible window z-index (assert z-[1001] or similar)
2. Start Menu z-index should be higher than taskbar
3. Context menu z-index should be higher than start menu
4. Command palette z-index should be highest

**Acceptance**: Serves as regression guard for z-index architecture.

---

## Phase 1: Suite Home Layout Fix (Critical)

### Task 1.1: Replace `min-h-screen` with `h-full flex flex-col` on all Suite Homes

**Files** (6 files):
- `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx`
- `frontend/apps/os-shell/src/pages/suites/SuiteHome.tsx`

**Change per file**:
```diff
- <div className='min-h-screen' style={{ background: '...' }}>
+ <div className='h-full flex flex-col' style={{ background: '...' }}>
```

Additionally, for the sidebar+content flex wrapper:
```diff
- <div className='flex'>
+ <div className='flex flex-1 min-h-0'>
```

And for the sidebar nav (enable independent scrolling):
```diff
- <nav className='w-64 shrink-0 p-4 space-y-1'>
+ <nav className='w-64 shrink-0 p-4 space-y-1 overflow-y-auto'>
```

**Acceptance Criteria**:
- Suite homes fill their container (window or viewport) without demanding 100vh
- Content scrolls within the main area, sidebar stays visible
- Works in windowed (800×600+), maximized, and standalone route mode
- Task 0.1 tests pass

### Task 1.2: Remove Nested `overflow-auto` from ModuleLoader

**File**: `frontend/apps/os-shell/src/shell/desktop/ModuleLoader.tsx`

**Change**:
```diff
- <div className='w-full h-full overflow-auto'>
+ <div className='w-full h-full overflow-hidden'>
```

**Acceptance Criteria**:
- No double scrollbars between Window content area and ModuleLoader
- Suite content still scrolls via Window.tsx content area or suite's internal scroll regions
- Task 0.1 test #5 passes

---

## Phase 2: Window Size & Layout

### Task 2.1: Increase Default Window Size

**File**: `frontend/apps/os-shell/src/stores/desktopStore.ts`

**Change**:
```diff
- const DEFAULT_WINDOW_SIZE: Size = { width: 800, height: 600 };
+ const DEFAULT_WINDOW_SIZE: Size = { width: 1024, height: 700 };
```

**Acceptance Criteria**:
- New windows open at 1024×700
- Suite content has adequate space (usable area: ~1024×660 after title bar)
- Minimum size unchanged (400×300)
- Task 0.2 tests pass

---

## Phase 3: Desktop Icon Polish

### Task 3.1: Fix Wiring Badge Visibility

**File**: `frontend/apps/os-shell/src/shell/desktop/DesktopIcon.tsx`

**Change**: Add `group` class to the icon container div when `wiringStatus` is provided:
```diff
- className={`flex flex-col items-center justify-center w-[76px] h-[90px] ...`}
+ className={`group flex flex-col items-center justify-center w-[76px] h-[90px] ...`}
```

**Acceptance Criteria**:
- Wiring badge appears on hover
- No change when `wiringStatus` is not set
- Task 0.3 tests pass

### Task 3.2: Improve Icon Grid Spacing

**File**: `frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx`

**Change**: Even out column and row gaps:
```diff
- className='grid grid-cols-3 gap-x-1 gap-y-3 p-3'
+ className='grid grid-cols-3 gap-3 p-3'
```

**Acceptance Criteria**:
- Even spacing between icons both horizontally and vertically
- Visual verification: desktop icons form a balanced grid

---

## Phase 4: Z-Index Architecture Cleanup

### Task 4.1: Normalize Z-Index Scale

**Files**: Multiple desktop components

Proposed z-index scale (powers-of-10 tiers):

| Layer | Z-Value | Component |
|-------|---------|-----------|
| Desktop surface | 1 | Icons, background |
| Windows | 10–999 | Dynamic per-window |
| System chrome | 1000 | Taskbar |
| Overlays | 1010 | Start Menu |
| Context menus | 1020 | All context menus (unified) |
| Window peek | 1030 | WindowPeek |
| Snap preview | 1040 | SnapPreview |
| Top system bar | 1050 | DesktopTopSystemBar |
| Alt-Tab | 8000 | AltTabSwitcher |
| Command Palette | 9000 | CommandPalette |

**Changes**:
- Taskbar: `z-50` → `z-[1000]`
- Start Menu: `z-[60]` → `z-[1010]`
- DesktopContextMenu: `z-[100]` → `z-[1020]`
- AppContextMenu: `z-[100]` → `z-[1020]`
- ContextMenu: `z-[1000]` → `z-[1020]`
- Top system bar: `z-[980]` → `z-[1050]`
- SnapPreview: `z-[999]` → `z-[1040]`
- Window resize handles: `9999` → `990` (per-window, just below system chrome)

**Acceptance Criteria**:
- Task 0.4 tests pass
- No visual stacking regressions
- Alt-Tab, Command Palette always above everything
- Windows never overlap taskbar or system chrome

---

## Phase 5: Token Compliance (SuiteHome.tsx)

### Task 5.1: Replace Raw Tailwind Colors in Generic SuiteHome

**File**: `frontend/apps/os-shell/src/pages/suites/SuiteHome.tsx`

**Change**: Replace `slate-950`, `slate-900`, `text-red-400`, etc. with TerraFusion token equivalents:
```diff
- <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'>
+ <div className='h-full flex flex-col' style={{ background: 'hsl(var(--tf-bg))' }}>
```

**Acceptance Criteria**:
- No raw Tailwind color classes in SuiteHome.tsx
- ui-token violation count does not increase (ratchet: ≤ 199)

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | `h-full` breaks standalone route rendering (no explicit height chain from html→body→#root) | Medium | High | Verify `#root` has `h-screen` or equivalent; test both contexts |
| R2 | Removing ModuleLoader `overflow-auto` hides content that relies on it | Low | Medium | Suite homes will handle their own internal scrolling |
| R3 | Z-index changes break existing tests (38 test files) | Medium | Medium | Run full test suite after changes; update assertions about z-values |
| R4 | Larger default window size (1024×700) exceeds small screens | Low | Low | `bounds='parent'` on Rnd prevents window exceeding viewport |
| R5 | Wiring badge `group` class adds unintended hover color to icon | Low | Low | `group` class is benign; only activates `group-hover:` utilities |
| R6 | Task bar z-[1000] conflicts with something unforeseen | Low | Medium | Thorough visual QA |

---

## Definition of Done

### Per-task DoD:
- [ ] Corresponding TDD test written and initially RED
- [ ] Implementation makes test GREEN
- [ ] TypeScript compiles (`pnpm run type-check`)
- [ ] Existing tests pass (all 38+ test files)
- [ ] Visual verification in both windowed and standalone mode
- [ ] Token ratchet not violated (≤ 199)

### Slice DoD:
- [ ] All Phase 0–5 tasks complete
- [ ] Suite homes render correctly inside desktop windows (no min-h-screen overflow)
- [ ] No double scrollbars
- [ ] Desktop icons have visible wiring badges on hover
- [ ] Z-index stacking is consistent and documented
- [ ] No regression in existing test suite
- [ ] Pull request with evidence trail per commit format

---

## File Change Summary

| File | Change Type | Phase |
|------|-------------|-------|
| `pages/suites/ForgeSuiteHome.tsx` | Layout classes | 1.1 |
| `pages/suites/AtlasSuiteHome.tsx` | Layout classes | 1.1 |
| `pages/suites/DaisSuiteHome.tsx` | Layout classes | 1.1 |
| `pages/suites/DossierSuiteHome.tsx` | Layout classes | 1.1 |
| `pages/suites/GptSuiteHome.tsx` | Layout classes | 1.1 |
| `pages/suites/SuiteHome.tsx` | Layout + tokens | 1.1, 5.1 |
| `shell/desktop/ModuleLoader.tsx` | overflow change | 1.2 |
| `stores/desktopStore.ts` | Default size | 2.1 |
| `shell/desktop/DesktopIcon.tsx` | group class | 3.1 |
| `shell/desktop/DesktopIconGrid.tsx` | Grid gaps | 3.2 |
| `shell/desktop/Taskbar.tsx` | z-index | 4.1 |
| `shell/desktop/StartMenu.tsx` | z-index | 4.1 |
| `shell/desktop/Desktop.tsx` | z-index (top bar) | 4.1 |
| `shell/desktop/DesktopContextMenu.tsx` | z-index | 4.1 |
| `shell/desktop/AppContextMenu.tsx` | z-index | 4.1 |
| `shell/desktop/ContextMenu.tsx` | z-index | 4.1 |
| `shell/desktop/SnapPreview.tsx` | z-index | 4.1 |
| `shell/desktop/Window.tsx` | Resize handle z-index | 4.1 |
| **New test files** (4): | suiteWindowLayout, windowSize, iconBadge, zIndexOrdering | 0.x |

**Total**: ~18 existing files modified + 4 new test files = 22 files touched
