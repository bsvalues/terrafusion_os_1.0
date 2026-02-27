# Slice 7.5 — Full Visual QA Discovery Document

**Agent**: 5 of 5 (Read-Only Audit)  
**Date**: 2026-02-27  
**Scope**: `frontend/apps/os-shell/src/` — Complete OS Shell UI

---

## 1. Complete Component Inventory

### 1.1 Desktop Layer

| Component | File | Status | Visual State | Notes |
|-----------|------|--------|--------------|-------|
| App (entry) | `App.tsx` | ✅ Working | Styled (design tokens) | Registers modules, installs IPC bridge, renders `<DesktopWithErrorBoundary />` |
| Router | `Router.tsx` | ✅ Working | N/A (logic) | 30+ routes defined, all lazy-loaded with Suspense + ErrorBoundary |
| Desktop | `shell/desktop/Desktop.tsx` | ✅ Working | Styled (tokens + glass) | Root orchestrator: background, icons, windows, taskbar, start menu, command palette, alt-tab, context menu, toast, sentinel |
| DesktopBackground | `shell/desktop/DesktopBackground.tsx` | ✅ Working | Styled (CSS ambient layer) | Uses CSSAmbientLayer — pure CSS mesh gradients, no WebGL |
| DesktopIconGrid | `shell/desktop/DesktopIconGrid.tsx` | ✅ Working | Styled | Derived from `desktopManifest.ts` (canonical). 3-column grid. Single/double-click UX. |
| DesktopIcon | `shell/desktop/DesktopIcon.tsx` | ✅ Working | Styled (TerraSphereIcon) | TerraSphere 3D wireframe icons, wiring status badges, hover/selection states |
| Window | `shell/desktop/Window.tsx` | ✅ Working | Styled (glass morphism) | react-rnd for drag/resize, title bar with min/max/close, macOS-style traffic lights, snap support, animation variants |
| WindowManager | `shell/desktop/WindowManager.tsx` | ✅ Working | Styled | Filters by desktop, sorts by z-index, wraps each window in ErrorBoundary |
| ModuleLoader | `shell/desktop/ModuleLoader.tsx` | ✅ Working | Styled | Resolves module → component via normalizeModuleId + MODULE_ENTRIES. NotFound state for unknown modules. |
| GenericModuleHost | `shell/desktop/GenericModuleHost.tsx` | ✅ Working | Styled | iframe host for external modules. Loading/Error overlays. Pointer-event fix during drag. |
| WindowErrorBoundary | `shell/desktop/WindowErrorBoundary.tsx` | ✅ Working | Styled | Per-window error isolation with reload/close buttons |
| DesktopErrorBoundary | `shell/desktop/DesktopErrorBoundary.tsx` | ✅ Working | Styled | Full-screen crash recovery UI with restart + clear-and-restart |
| DesktopContextMenu | `shell/desktop/DesktopContextMenu.tsx` | ✅ Working | Styled | Right-click context menu on desktop background |
| WindowContextMenu | `shell/desktop/WindowContextMenu.tsx` | ✅ Working | Styled | Right-click context menu on windows |
| AppContextMenu | `shell/desktop/AppContextMenu.tsx` | ✅ Working | Styled | Right-click context menu on app icons |
| SnapPreview | `shell/desktop/SnapPreview.tsx` | ✅ Working | Styled | Visual snap zone preview during drag |
| WindowPeek | `shell/desktop/WindowPeek.tsx` | ✅ Working | Styled | Hover preview on taskbar buttons (portal rendered) |
| AltTabSwitcher | `shell/desktop/AltTabSwitcher.tsx` | ✅ Working | Styled | Centered overlay with window cards, backdrop blur |
| VirtualDesktopSwitcher | `shell/desktop/VirtualDesktopSwitcher.tsx` | ✅ Working | Styled | Multi-desktop switching UI |
| Clock | `shell/desktop/Clock.tsx` | ✅ Working | Styled | System tray clock |
| NotificationBell | `shell/desktop/NotificationBell.tsx` | ✅ Working | Styled | System tray notification bell with badge |
| AIStatusPanel | `shell/desktop/AIStatusPanel.tsx` | ✅ Working | Styled | AI swarm health indicator |
| SystemHealthPanel | `shell/desktop/SystemHealthPanel.tsx` | ✅ Working | Styled | System health metrics |
| PluginManager | `shell/desktop/PluginManager.tsx` | ✅ Working | Styled | Plugin management window |
| RecentAppsSection | `shell/desktop/RecentAppsSection.tsx` | ✅ Working | Styled | Recent apps in start menu |
| WebGLBackground | `shell/desktop/WebGLBackground.tsx` | ⚠️ Unused | N/A | Exists but DesktopBackground uses CSSAmbientLayer instead |

### 1.2 Shell Layer

| Component | File | Status | Visual State | Notes |
|-----------|------|--------|--------------|-------|
| StartMenu | `shell/desktop/StartMenu.tsx` | ✅ Working | Styled (glass, i18n) | Search, pinned grid, all apps list, recent apps, wiring badges (OS/EXT/MF), running indicators |
| Taskbar (Dock) | `shell/desktop/Taskbar.tsx` | ✅ Working | Styled (macOS Tahoe dock) | Floating centered dock: TerraSphere home, running apps, system tray (clock, AI status, notifications, Sentinel, VD switcher, parcel context) |
| TaskbarWithNotifications | `shell/desktop/TaskbarWithNotifications.tsx` | ✅ Working | N/A (wrapper) | Connects Taskbar to notificationStore |
| CommandPalette | `shell/command-palette/CommandPalette.tsx` | ✅ Working | Styled (glass) | Ctrl+K fuzzy search. Module, settings, shortcuts, and navigation commands. TerraSphereIcon integration. |
| ShellHome | `shell/home/ShellHome.tsx` | ✅ Working | Styled (Tahoe-inspired) | Alternative tile-based launcher at `/home`. Suite cards with gradients, OS entrypoints, search, property search widget, PACS proof card |
| DesktopShell.tsx | `shell/DesktopShell.tsx` | ⚠️ Legacy | Unknown | Exists alongside Desktop.tsx — likely superseded |
| DesktopShell.backup.tsx | `shell/DesktopShell.backup.tsx` | ❌ Dead code | N/A | Backup file, not imported |
| DesktopShell.clean.tsx | `shell/DesktopShell.clean.tsx` | ❌ Dead code | N/A | Clean version, not imported |
| QuantumDesktopShell.tsx | `shell/QuantumDesktopShell.tsx` | ⚠️ Legacy | Unknown | Legacy quantum shell variant |
| SimplifiedQuantumDesktopShell.tsx | `shell/SimplifiedQuantumDesktopShell.tsx` | ⚠️ Legacy | Unknown | Simplified quantum variant |
| SystemTray.tsx | `shell/SystemTray.tsx` | ⚠️ Legacy | Unknown | Standalone system tray — Taskbar now has its own tray |
| ModuleLauncher.tsx | `shell/ModuleLauncher.tsx` | ⚠️ Legacy | Unknown | Standalone launcher — StartMenu/CommandPalette handle this now |
| Launcher (component) | `components/launcher/` | ✅ Working | Styled | Used in Desktop.tsx for module selection |

### 1.3 Suite Home Pages (inside desktop windows)

| Component | File | Status | Visual State | Sub-modules | Notes |
|-----------|------|--------|--------------|-------------|-------|
| ForgeSuiteHome | `pages/suites/ForgeSuiteHome.tsx` | ✅ Working | Styled (tokens) | 6 active: CostForge, CompsForge, IncomeForge, AppealForge, Reconciliation, ValueAudit | Full sidebar+content layout. Lazy-loaded sub-modules. |
| AtlasSuiteHome | `pages/suites/AtlasSuiteHome.tsx` | ✅ Working | Styled (tokens) | 7 active: TerraGIS, ParcelLens, LayerWorks, TerraSketch, TerraPrint, TerraExport, TerraQuery | Full sidebar+content layout |
| DaisSuiteHome | `pages/suites/DaisSuiteHome.tsx` | ✅ Working | Styled (tokens) | 6 active: Levy (API-wired), PILT (API-wired), Certification, Appeals, Permits, Calendar | Has real API integration for levy & PILT |
| DossierSuiteHome | `pages/suites/DossierSuiteHome.tsx` | ✅ Working | Styled (tokens) | 6 active: Documents, Evidence, Defense Packets, Chain of Custody, Photos, DeepSearch | Full sidebar+content layout |
| GptSuiteHome | `pages/suites/GptSuiteHome.tsx` | ✅ Working | Styled (tokens) | 6 active: Studio, Marketplace, Management, Builder, Analytics, RAG Datasets | Uses .catch() fallbacks for missing components |
| SuiteHome (generic) | `pages/suites/SuiteHome.tsx` | ⚠️ Stub | Styled (legacy colors) | N/A | Generic placeholder — largely superseded by individual suite homes |

### 1.4 Suite Sub-Modules (22 total)

| Module | File | Status | Notes |
|--------|------|--------|-------|
| CostForgeModule | `pages/suites/modules/CostForgeModule.tsx` | ✅ Working | Full implementation — real cost approach calculator with API integration, scenarios, regional comparison |
| CompsForgeModule | `pages/suites/modules/CompsForgeModule.tsx` | ✅ Working | Sales comparison with adjustments |
| IncomeForgeModule | `pages/suites/modules/IncomeForgeModule.tsx` | ✅ Working | Income approach with capitalization |
| AppealForgeModule | `pages/suites/modules/AppealForgeModule.tsx` | ✅ Working | BOE appeal defense builder |
| ReconciliationModule | `pages/suites/modules/ReconciliationModule.tsx` | ✅ Working | Three-approach reconciliation |
| ValueAuditModule | `pages/suites/modules/ValueAuditModule.tsx` | ✅ Working | FISMA-compliant audit trail |
| GISModule | `pages/suites/modules/GISModule.tsx` | ✅ Working | Layer management, parcel search, toggleable layers — real service integration |
| ParcelLensModule | `pages/suites/modules/ParcelLensModule.tsx` | ✅ Working | Detailed parcel inspection |
| LayerWorksModule | `pages/suites/modules/LayerWorksModule.tsx` | ✅ Working | Advanced layer management |
| TerraSketchModule | `pages/suites/modules/TerraSketchModule.tsx` | ✅ Working | Geometry editing |
| TerraPrintModule | `pages/suites/modules/TerraPrintModule.tsx` | ✅ Working | Map printing/PDF |
| TerraExportModule | `pages/suites/modules/TerraExportModule.tsx` | ✅ Working | GIS data export |
| TerraQueryModule | `pages/suites/modules/TerraQueryModule.tsx` | ✅ Working | Spatial queries |
| DocumentsModule | `pages/suites/modules/DocumentsModule.tsx` | ✅ Working | Full document management with service integration, type filtering, search |
| EvidenceModule | `pages/suites/modules/EvidenceModule.tsx` | ✅ Working | Evidence chain viewer |
| DefensePacketsModule | `pages/suites/modules/DefensePacketsModule.tsx` | ✅ Working | Appeal packet assembly |
| ChainOfCustodyModule | `pages/suites/modules/ChainOfCustodyModule.tsx` | ✅ Working | Hash-verified custody chain |
| PhotoManagerModule | `pages/suites/modules/PhotoManagerModule.tsx` | ✅ Working | Geotagged photos |
| DeepSearchModule | `pages/suites/modules/DeepSearchModule.tsx` | ✅ Working | Full-text search |
| GPTBuilderModule | `pages/suites/modules/GPTBuilderModule.tsx` | ✅ Working | Custom GPT config creator with templates, model selection, RAG toggle |
| GPTAnalyticsModule | `pages/suites/modules/GPTAnalyticsModule.tsx` | ✅ Working | Usage analytics |
| RAGDatasetsModule | `pages/suites/modules/RAGDatasetsModule.tsx` | ⚠️ Stub (API) | UI complete but 8 `TODO: Implement API call` markers |

### 1.5 OS Feature Standalone Pages

| Component | File | Status | Visual State | Notes |
|-----------|------|--------|--------------|-------|
| PilotHome | `pages/PilotHome.tsx` | ✅ Working | Styled (StandaloneHomeShell) | Wraps PilotConsoleContent in consistent chrome |
| PilotConsole | `pages/PilotConsole.tsx` | ✅ Working | Styled | Single choke point UI for tool invocation |
| TraceHome | `pages/TraceHome.tsx` | ✅ Working | Styled (StandaloneHomeShell) | Real telemetry metrics, 24h histogram, action stream, policy panel |
| CanonHome | `pages/CanonHome.tsx` | ✅ Working | Styled (StandaloneHomeShell) | Multi-workspace IDE shell (47 phases of iteration). Session-stable, cross-tab sync. |
| PropertyWorkbench | `pages/workbench/PropertyWorkbench.tsx` | ✅ Working | Styled | Tier-0 surface. 6-tab layout (Summary/Forge/Atlas/Dais/Dossier/Pilot). Audit envelope support. |

### 1.6 Config Layer

| File | Status | Notes |
|------|--------|-------|
| `config/suiteRegistry.ts` | ✅ Canonical | 5 suites (forge/atlas/dais/dossier/gpt), 3 OS features (pilot/trace/canon), 1 surface (workbench). All `status: 'live'`. |
| `config/desktopManifest.ts` | ✅ Derived | Derives desktop icons from suiteRegistry. Single source of truth enforced. |
| `config/moduleComponents.tsx` | ✅ Working | 18 modules in MODULE_REGISTRY + MODULE_ENTRIES. Lazy imports. MODULE_ALIASES map (30+ entries). |
| `config/modules.ts` | ✅ Working | Maps GENERATED_MODULES to ModuleDefinition. Filters by intent (gen2/legacy/archive). |
| `config/generatedModules.ts` | ✅ Working | Auto-generated from module manifests |
| `config/iconMap.ts` | ✅ Working | Lucide icon resolver |
| `config/features.ts` | ✅ Working | Feature flags |

### 1.7 Store Layer (17 stores)

| Store | File | Status | Notes |
|-------|------|--------|-------|
| desktopStore | `stores/desktopStore.ts` | ✅ Working | Window lifecycle, z-index, snap, virtual desktops. Zustand + devtools. |
| startMenuStore | `stores/startMenuStore.ts` | ✅ Working | Open/close, search, pinned/recent/all apps, keyboard nav. Zustand + devtools. |
| commandPaletteStore | `stores/commandPaletteStore.ts` | ✅ Working | Open/close, search, recent commands (persisted). Zustand + persist. |
| altTabStore | `stores/altTabStore.ts` | ✅ Working | Alt+Tab state (candidates, selected index). |
| moduleRegistryStore | `stores/moduleRegistryStore.ts` | ✅ Working | Module registration and launch. |
| moduleLoaderStore | `stores/moduleLoaderStore.ts` | ✅ Working | Module load lifecycle. |
| notificationStore | `stores/notificationStore.ts` | ✅ Working | Notification management. |
| themeStore | `stores/themeStore.ts` | ✅ Working | Theme state (dark/light/system). |
| settingsStore | `stores/settingsStore.ts` | ✅ Working | User preferences + keyboard shortcuts. |
| windowPeekStore | `stores/windowPeekStore.ts` | ✅ Working | Window peek hover state. |
| messageBusStore | `stores/messageBusStore.ts` | ✅ Working | Inter-module message bus. |
| metricsStore | `stores/metricsStore.ts` | ✅ Working | Performance metrics. |
| networkStore | `stores/networkStore.ts` | ✅ Working | Network/connectivity state. |
| pluginStore | `stores/pluginStore.ts` | ✅ Working | Plugin management state. |
| syncStore | `stores/syncStore.ts` | ✅ Working | Real-time sync state. |
| index.ts | `stores/index.ts` | ✅ Working | Barrel export. |

### 1.8 Orchestration

| File | Status | Notes |
|------|--------|-------|
| `orchestration/moduleActivation.ts` | ✅ Working | Single canonical launch pathway. Alias normalization → telemetry → window resolution → warm load. |

---

## 2. Route Audit

| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/` | App (Desktop) | ✅ Working | Primary OS surface — desktop with windows, taskbar, start menu |
| `/home` | ShellHome | ✅ Working | Alternative tile-based launcher with CSSAmbientLayer |
| `/desktop` | App (alias) | ✅ Working | Legacy alias for `/` |
| `/login` | LoginPage | ✅ Working | Auth redirect target (exempted from AuthGuard) |
| `/launchpad` | LegacyRedirect → `/` | ✅ Working | Legacy redirect with telemetry |
| `/property/:parcelId` | PropertyWorkbench | ✅ Working | Tier-0 surface with 6 tabs |
| `/property/:parcelId/forge` | PropertyForge | ✅ Working | Workbench forge tab |
| `/property/:parcelId/atlas` | PropertyAtlas | ✅ Working | Workbench atlas tab |
| `/property/:parcelId/dais` | PropertyDais | ✅ Working | Workbench dais tab |
| `/property/:parcelId/dossier` | PropertyDossier | ✅ Working | Workbench dossier tab |
| `/property/:parcelId/pilot` | PropertyPilot | ✅ Working | Workbench pilot tab |
| `/forge` | ForgeSuiteHome | ✅ Working | Standalone suite home (6 modules) |
| `/atlas` | AtlasSuiteHome | ✅ Working | Standalone suite home (7 modules) |
| `/dais` | DaisSuiteHome | ✅ Working | Standalone suite home (6 modules, API-wired) |
| `/dossier` | DossierSuiteHome | ✅ Working | Standalone suite home (6 modules) |
| `/gpt` | GptSuiteHome | ✅ Working | Standalone suite home (6 modules) |
| `/pilot` | PilotHome | ✅ Working | StandaloneHomeShell + PilotConsoleContent |
| `/pilot/legacy` | PilotConsole | ✅ Working | Legacy direct console |
| `/trace` | TraceHome | ✅ Working | StandaloneHomeShell + telemetry dashboard |
| `/canon` | CanonHome | ✅ Working | Multi-workspace IDE (47 phases of iteration) |
| `/pilot/dashboard` | GovernanceDashboard | ✅ Working | Role-gated metrics |
| `/pilot/api` | PilotApiDemo | ✅ Working | API demo |
| `/monitoring` | Monitoring | ✅ Working | System monitoring |
| `/marketplace` | TerraFusionMarketplace | ✅ Working | Plugin marketplace |
| `/experiments` | ExperimentsList | ✅ Working | Experiments listing |
| `/experiments/create` | CreateExperiment | ✅ Working | Experiment creation |
| `/elite-research` | EliteExperimentalResearchInterface | ✅ Working | Research interface |
| `/codex/preferences` | NotificationPreferences | ✅ Working | Notification settings |
| `/gen2/terraforge` | TerraForgeGen2 | ✅ Working | Gen2 module route |
| `/gen2/dossier` | TerraDossierGen2 | ✅ Working | Gen2 module route |
| `/suites/terra-prime/*` | TerraPrimeSuite | ✅ Working | Legacy property viewer |
| `/error-demo` | ErrorDisplayDemo | ✅ Working | Error display verification |
| `/pilot-demo` | PilotDemo | ✅ Working | Tool invocation demo |
| `/dev/legacy-metrics` | LegacyMetricsViewer | ✅ Working | Dev-only (guarded by `getViteEnv().DEV`) |
| `/modules/*` | LegacyRedirect → `/` | ✅ Working | Catch-all legacy redirect |

---

## 3. Visual Gaps Identified

### 3.1 Dead Code / Legacy Shell Files
The `shell/` directory contains **5 unused/legacy shell files** alongside the active Desktop.tsx:
- `DesktopShell.tsx` — superseded by Desktop.tsx
- `DesktopShell.backup.tsx` — backup file
- `DesktopShell.clean.tsx` — clean version
- `QuantumDesktopShell.tsx` — quantum variant
- `SimplifiedQuantumDesktopShell.tsx` — simplified variant
- `SystemTray.tsx` — standalone tray (Taskbar has its own)
- `ModuleLauncher.tsx` — standalone launcher (replaced by StartMenu/CommandPalette)

### 3.2 Wiring Status Badges Not Visible
In `DesktopIcon.tsx`, the wiring status badge uses `opacity-0 group-hover:opacity-100` but the parent `<div>` does NOT have the `group` class, so badges never appear on hover.

### 3.3 Command Palette Module Registry Stale
The command palette (`CommandPalette.tsx`) has a hardcoded module list (10 modules: costforge, terra-gaia, atlas-ai, etc.) that does not include constitutional suite homes (forge, atlas, dais, dossier, gpt). Users cannot launch suite homes from command palette.

### 3.4 CSS File Proliferation
The `styles/` directory contains **26 CSS files**, many seeming redundant or legacy:
- `quantum-desktop-shell.css` — likely for QuantumDesktopShell (dead code)
- `elite-quantum-dashboard.css` — "elite" prefix files
- `terrafusion-celebration.css` — celebratory animations
- `terrafusion-self-healing.css` — self-healing CSS
- `terrafusion-quantum-animations.css` — quantum animations
- Only 4 are imported in App.tsx: `terrafusion-tokens.css`, `terrafusion-brand.css`, `terrafusion-os.css`, `App.css`

### 3.5 SuiteHome Generic (Partial Stub)
`SuiteHome.tsx` has 3 `/* TODO */` comments for features (Recent Activity, Quick Actions, AI Insights) that are never rendered. This file is largely superseded by individual suite homes but still exists.

### 3.6 Start Menu Parcel Widget
Start menu imports `useRecentParcels` from parcel context but this is rendered in the `RecentAppsSection` — needs verification that parcel recent entries are displaying correctly.

---

## 4. Evidence Summary

**Files Read**: 40+ source files across all OS Shell layers  
**Components Cataloged**: 70+ (desktop, shell, pages, config, stores)  
**Routes Audited**: 33 routes  
**Test Files Found**: 38 test files in `shell/desktop/__tests__/` alone  
**Stores Cataloged**: 17 Zustand stores  
**Suite Sub-Modules**: 22 modules across 5 suites  
**TODO/FIXME Count**: 80+ matches (most in tests and non-shell files)  
