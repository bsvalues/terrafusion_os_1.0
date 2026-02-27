# Slice 7.5 — Full Visual QA Research Document

**Agent**: 5 of 5 (Read-Only Audit)  
**Date**: 2026-02-27  
**Scope**: `frontend/apps/os-shell/src/` — Complete OS Shell UI

---

## 1. Component-by-Component Analysis

### 1.1 App.tsx (Entry Point)
- **Renders**: Yes — full-screen fixed container with `<DesktopWithErrorBoundary />`
- **Props**: None (root component)
- **Visual State**: Correct — CSS import order is documented and critical (tokens → brand → os → app)
- **Styling**: Design tokens via CSS custom properties, no raw hex/rgb values
- **Test Coverage**: Covered by `Desktop.test.tsx`, `DesktopIntegration.test.tsx`
- **Notes**: Registers modules from `config/modules.ts`, configures start menu apps with `entryType` for wiring badges

### 1.2 Router.tsx
- **Renders**: Yes — BrowserRouter with AuthProvider → ErrorBoundary → Suspense → AuthGuard → Routes
- **Props**: None
- **Visual State**: Loading fallback uses design tokens (not raw tailwind colors)
- **Test Coverage**: `NavigationTruth.test.tsx` validates route definitions
- **Notes**: Uses React Router v6 future flags (`v7_startTransition`, `v7_relativeSplatPath`). All route components are lazy-loaded.

### 1.3 Desktop.tsx (Root Orchestrator)
- **Renders**: Yes — complex multi-layer composition
- **Props**: `{ className?: string }`
- **Visual State**: Fully styled. Top system bar with glass effect (`backdrop-filter: saturate(180%) blur(20px)`). Shows "TerraFusion OS" + "Benton County · Tax Year 2026".
- **Test Coverage**: `Desktop.test.tsx`, `Desktop.altTab.test.tsx`, `DesktopIntegration.test.tsx`, `DesktopIdleStability.test.tsx`
- **Architecture**: Composes DesktopBackground (z:0), DesktopIconGrid, WindowManager (z:1-999), Taskbar (z:1000), StartMenu (z:1001), CommandPalette, AltTabSwitcher, WindowPeek, ToastContainer, SentinelPanel, DesktopContextMenu
- **Notes**: Global keyboard shortcuts via `useKeyboardShortcuts()`. Alt+Tab candidate building from window state. Click-outside closes start menu. IPC bridge installed for shell ↔ app communication.

### 1.4 DesktopIconGrid.tsx
- **Renders**: Yes — 3-column grid derived from `getDesktopIcons()`
- **Props**: `{ className?: string }`
- **Visual State**: Styled with Tailwind grid (`grid-cols-3 gap-x-1 gap-y-3 p-3`)
- **Test Coverage**: `DesktopIconGrid.canonical.test.tsx`, `DesktopIcons.test.tsx`
- **Notes**: Icons derived from canonical desktopManifest.ts (no hardcoding). Suite icons activate via `activateModule()`, OS features navigate via router. Currently shows: Forge, Atlas, Dais, Dossier, GPT, Pilot, Trace, Canon (8 icons in 3x3 grid with one empty slot).

### 1.5 Window.tsx
- **Renders**: Yes — full window chrome with react-rnd
- **Props**: `{ window: DesktopWindow; children?: ReactNode }`
- **Visual State**: Glass morphism, macOS-style traffic light buttons (minimize/maximize/close), title bar with TerraSphereIcon + title
- **Test Coverage**: `Window.test.tsx`, `WindowSnapping.test.tsx`, `WindowAnimations.test.tsx`
- **Constants**: MIN_WIDTH=400, MIN_HEIGHT=300, TITLE_BAR_HEIGHT=40
- **Notes**: WindowInteractionContext prevents iframe mouse stealing during drag/resize. Uses framer-motion for animation variants. Custom resize handle styles for reliable hit detection.

### 1.6 StartMenu.tsx
- **Renders**: Yes — overlay panel with search, pinned apps, all apps, recent apps
- **Props**: Consumes state from `useStartMenuStore`
- **Visual State**: Styled with glass effect via `@terrafusion/ui` Panel component + design tokens
- **Test Coverage**: `StartMenu.test.tsx`, `StartMenuKeyboardNav.test.tsx`, `StartMenuOpenIndicator.test.tsx`, `StartMenuOrchestrator.test.tsx`, `StartMenuRecentParcels.test.tsx`
- **Features**: i18n support, wiring badges (OS/EXT/MF), running indicators (green dot), TerraSphereIcon with category variants, keyboard nav
- **Notes**: Uses `activateModule()` for launches. Recent parcels integration via `useRecentParcels()`.

### 1.7 Taskbar.tsx (Dock)
- **Renders**: Yes — macOS Tahoe-inspired floating centered dock
- **Props**: Various (notifications, AI status, etc.)
- **Visual State**: Styled with glass effect, floating dock with centered layout
- **Test Coverage**: `Taskbar.test.tsx`, `TaskbarNotificationIntegration.test.tsx`
- **Layout**: [TerraSphere home] | [divider] | [Running apps] | [divider] | [System tray: Sentinel, VD switcher, AI status, notifications, parcel context, clock]
- **Notes**: Running app buttons show active/inactive indicator dots. DockAppButton has context menu, peek hover, and click-to-focus. Uses hardcoded demo notifications (2 entries) as fallback.

### 1.8 CommandPalette.tsx
- **Renders**: Yes — modal overlay with fuzzy search
- **Props**: `{ className?: string }`
- **Visual State**: Styled with glass effect via Panel
- **Test Coverage**: `shell/command-palette/__tests__/` (directory exists)
- **Commands**: 10 module commands (legacy IDs), settings tabs, shortcut toggles, navigation commands
- **Gap**: Does NOT include constitutional suite homes (forge/atlas/dais/dossier/gpt) — only legacy module IDs (costforge, terra-gaia, atlas-ai, etc.)

### 1.9 ShellHome.tsx
- **Renders**: Yes — macOS Tahoe-inspired landing page at `/home`
- **Props**: `{ className?: string }`
- **Visual State**: Fully styled with suite gradient cards, OS entrypoints, search bar + property search widget, system health panel, PACS proof card
- **Features**: Suite card navigation (workbench intent vs standalone), OS entrypoints (Pilot, Trace, Canon, TerraPrime), recent parcels, command palette integration
- **Notes**: Uses design tokens throughout. Suite gradients defined per-suite with token colors.

### 1.10 Suite Home Pages (Forge, Atlas, Dais, Dossier, GPT)
- **Render**: All 5 render correctly
- **Pattern**: Identical layout — Header (back button, suite icon, name/description) + Sidebar (module list) + Content area (lazy-loaded module)
- **Visual State**: All use design tokens (`hsl(var(--tf-*))` syntax). Consistent styling.
- **Sub-modules**: All declared as `status: 'active'`. Total: 6+7+6+6+6 = 31 modules across suites.

**Quality Assessment per Suite:**
| Suite | API Integration | Real Data | Mock Data |
|-------|----------------|-----------|-----------|
| Forge (CostForge) | ✅ API calls via `api` service + `forgeService` | Real Harris PACS 9.0 cost matrix (42 entries) | Some UI-only scenarios |
| Atlas (GIS) | ✅ Via `atlasService` | Layer definitions, parcel search | Map rendering is tabular (no actual map tile rendering) |
| Dais (Workflow) | ✅ Via `levyService` + `piltService` | Real Benton County levy rates | Certification/Appeals/Permits/Calendar are stub-level |
| Dossier (Docs) | ✅ Via `dossierService` | Document search, type filtering | Evidence/Chain modules use mock data |
| GPT (AI) | ⚠️ Partial | GPT Studio may import real component | 8 API TODO stubs in RAGDatasetsModule |

---

## 2. Design System Assessment

### 2.1 Token System
- **Primary file**: `styles/terrafusion-tokens.css` — defines all CSS custom properties
- **Import order**: Enforced in App.tsx with comments: tokens → brand → os → app
- **Token format**: HSL with channel splitting (`--tf-xxx-hs` for hue+sat, recombined with lightness)
- **Compliance**: All core shell components use `hsl(var(--tf-*))` syntax. No raw hex in desktop layer.

### 2.2 Component Library
- **Primitives**: shadcn/ui components in `components/ui/` (Button, Card, Badge, Input, Select, Table, etc.)
- **Brand components**: `ui/brand/TerraSphere.tsx`, `ui/brand/TerraSphereIcon.tsx` — 3D wireframe orb with category color variants
- **Material components**: `ui/materials/` — LiquidPanel, TactileButton (glass morphism primitives)
- **Layout**: `components/layout/` — Container, Grid, Stack with Storybook stories

### 2.3 Typography & Spacing
- Font size handled via design tokens. No hardcoded font sizes in core shell.
- Spacing uses Tailwind classes (`p-3`, `gap-2.5`, etc.) — consistent.

### 2.4 Color Consistency
- Suite colors defined in suiteRegistry: `--tf-suite-forge`, `--tf-suite-atlas`, `--tf-suite-dais`, `--tf-suite-dossier`, `--tf-suite-gpt`
- Window control colors: `--tf-wc-minimize`, `--tf-wc-maximize`, `--tf-wc-close` (macOS traffic light palette)
- All backgrounds use token references. No raw color values in core shell layer.

### 2.5 Storybook Coverage
Stories exist in `components/ui/` for: Alert, Tooltip, Calendar, Toggle, Toast, Button, Textarea, Accordion, Tabs, Badge, Table, Avatar, Switch, Skeleton, Sheet, Separator, Label, Select, ScrollArea, Menubar, Slider, AlertDialog, Sonner, AspectRatio
Also in `components/layout/` for: Container, Grid, Stack
And in `design-system/tokens/` for: Typography, Spacing, Motion, Colors

---

## 3. Test Coverage Map

### 3.1 Desktop Component Tests (38 files)

| Test File | Component Tested | Type |
|-----------|-----------------|------|
| Desktop.test.tsx | Desktop orchestrator | Unit |
| Desktop.altTab.test.tsx | Alt+Tab in Desktop context | Integration |
| DesktopIconGrid.canonical.test.tsx | Icon grid derives from registry | Contract |
| DesktopIcons.test.tsx | Individual icon rendering | Unit |
| DesktopIdleStability.test.tsx | Desktop doesn't crash at idle | Stability |
| DesktopIntegration.test.tsx | Full desktop integration | Integration |
| DesktopContextMenu.test.tsx | Right-click menu | Unit |
| DesktopErrorBoundary.test.tsx | Error recovery | Unit |
| StartMenu.test.tsx | Start menu rendering | Unit |
| StartMenuKeyboardNav.test.tsx | Keyboard navigation | Accessibility |
| StartMenuOpenIndicator.test.tsx | Running indicator dots | Unit |
| StartMenuOrchestrator.test.tsx | Module activation from start menu | Integration |
| StartMenuRecentParcels.test.tsx | Recent parcels in start menu | Unit |
| Taskbar.test.tsx | Dock rendering | Unit |
| TaskbarNotificationIntegration.test.tsx | Notification integration | Integration |
| Window.test.tsx | Window chrome | Unit |
| WindowAnimations.test.tsx | Open/close animations | Unit |
| WindowErrorBoundary.test.tsx | Per-window error isolation | Unit |
| WindowManager.test.tsx | Window manager | Unit |
| WindowManagerIntegration.test.tsx | Multi-window integration | Integration |
| WindowPeek.test.tsx | Hover preview | Unit |
| WindowPeekIntegration.test.tsx | Peek + taskbar integration | Integration |
| WindowSnapping.test.tsx | Edge/corner snapping | Unit |
| ModuleLoader.test.tsx | Module resolution | Unit |
| AIStatusPanel.test.tsx | AI status indicator | Unit |
| Clock.test.tsx | System clock | Unit |
| NotificationBell.test.tsx | Notification bell | Unit |
| SystemHealthPanel.test.tsx | System health | Unit |
| VirtualDesktopSwitcher.test.tsx | Virtual desktops | Unit |
| ContextMenu.test.tsx | Context menu primitive | Unit |
| AppContextMenu.test.tsx | App context menu | Unit |
| RecentAppsSection.test.tsx | Recent apps | Unit |
| ContextInjection.test.tsx | Context injection | Unit |
| ErrorBoundaryIntegration.test.tsx | Error cascade | Integration |
| NavigationTruth.test.tsx | Route ↔ component truth | Contract |
| Phase9Integration.test.tsx | Phase 9 integration | Integration |
| SystemTrayIntegration.test.tsx | System tray | Integration |
| AxiomFSWindow.integration.test.tsx | AxiomFS window | Integration |

### 3.2 Suite Tests
- `pages/suites/__tests__/suiteWindowLayout.test.tsx` — Tests suite home rendering inside windows

### 3.3 Store Tests
- `stores/altTabStore.test.ts` — Alt+Tab state machine
- `stores/__tests__/` directory exists (additional store tests)

### 3.4 Config Tests
- `config/__tests__/` directory exists

---

## 4. TODO/FIXME/HACK Inventory (Shell-Relevant)

| File | Line | Comment | Severity |
|------|------|---------|----------|
| `pages/suites/SuiteHome.tsx` | 94, 102, 110 | `/* TODO */` — 3 empty feature placeholders (Recent Activity, Quick Actions, AI Insights) | Low — file is superseded |
| `components/gpt/RAGDatasetManager.tsx` | 206, 261, 300, 330, 369, 403, 423, 441 | `TODO: Implement API call` × 8 | Medium — RAG module has no API wiring |
| `components/gpt/GPTManagementDashboard.tsx` | 158 | `TODO: Get current user ID from auth context` | Low — hardcoded fallback |
| `components/research/ResearchPortal.tsx` | 198 | `TODO: Get from auth context` — hardcoded researcher ID | Low |
| `components/codex/CodexAdminPanel.tsx` | 116 | `TODO: API call to save configuration` | Low |
| `components/validation/LayoutValidator.tsx` | 92 | `TODO: Implement z-index conflict detection` | Low |
| `fs/components/AxiomFSDetailPanel.tsx` | 51 | `TODO: Implement relation highlighting` | Low |

**Tests with TODOs:**
- `SystemGptAtlasPanel.test.tsx` — 14 TODO comments for unimplemented live data integration tests
- `launcher.behavior.test.tsx` — Search filtering not yet implemented
- `launcher.routing.test.tsx` — Multiple section organization not yet implemented

---

## 5. Accessibility Assessment

### 5.1 Strengths
- All interactive elements have `aria-label` attributes
- Desktop uses `role="region"` with `aria-live="polite"` for window manager
- Start menu search has `role="searchbox"` and proper aria labels
- Window controls have descriptive aria-labels ("Minimize", "Maximize", "Close")
- Alt+Tab uses `role="listbox"` with `aria-activedescendant`
- Desktop icons have `role="button"`, `tabIndex={0}`, `aria-pressed`/`aria-selected`
- Error boundaries use `role="alert"` for error states
- i18n support via `react-i18next` for Start Menu strings

### 5.2 Gaps
- **Keyboard trap potential**: Window drag/resize has no keyboard alternative (mouse-only via react-rnd)
- **Focus management**: When start menu closes, focus doesn't explicitly return to trigger
- **Color contrast**: Glass morphism backgrounds (`bg-white/5`, `bg-white/10`) may not meet WCAG 2.1 AA contrast ratios against dark backgrounds
- **Skip navigation**: No skip-to-content link for keyboard users
- **Screen reader**: WindowManager uses `aria-live="polite"` but window open/close events may not be announced

---

## 6. Performance Observations

- All route components are lazy-loaded with `React.lazy()` + `Suspense`
- CSS uses hardware-accelerated properties (backdrop-filter, transform)
- DesktopBackground uses pure CSS (CSSAmbientLayer) instead of WebGL — reliable, zero-lag
- Window animations use framer-motion with configurable timing
- Module loading uses Suspense boundaries inside each window
- _26 CSS files_ in styles/ but only 4 imported — rest is dead weight in the bundle (tree-shaking depends on build config)
