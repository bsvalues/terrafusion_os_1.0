# Slice 7.5 — Full Visual QA Remediation Plan

**Agent**: 5 of 5 (Read-Only Audit)  
**Date**: 2026-02-27  
**Scope**: `frontend/apps/os-shell/src/` — Complete OS Shell UI

---

## Priority Legend

| Level | Meaning | Action |
|-------|---------|--------|
| **P0** | Broken — user-facing bug or render failure | Fix immediately |
| **P1** | Stub — renders but shows placeholder/mock content | Implement real content |
| **P2** | Polish — works but needs styling, alignment, or UX fixes | Improve quality |
| **P3** | Nice-to-have — clean-up, optimization, consistency | When capacity allows |

---

## P0: Broken (Immediate Fixes)

### P0-1: Desktop Icon Wiring Badge Never Visible
**File**: `shell/desktop/DesktopIcon.tsx`  
**Issue**: Wiring status badges use `opacity-0 group-hover:opacity-100` CSS but the parent `<div>` element DOES NOT have the Tailwind `group` class. Badges are invisible on all hover states.  
**Impact**: Users cannot see whether an icon opens Workbench (WB), OS route (OS), or external (EXT).  
**Fix**: Add `group` class to the root `<div>` of DesktopIcon, OR change badge visibility to always-on with reduced opacity.  
**Evidence**: Line reads `className="flex flex-col items-center justify-center..."` — no `group`.

### P0-2: Command Palette Missing Suite Home Commands
**File**: `shell/command-palette/CommandPalette.tsx`  
**Issue**: The `useCommandRegistry()` hook only registers 10 legacy module IDs (costforge, terra-gaia, atlas-ai, etc.). Constitutional suite homes (forge, atlas, dais, dossier, gpt) are NOT in the command registry. Users cannot find/launch suites from Ctrl+K.  
**Impact**: Primary navigation path broken for suites.  
**Fix**: Add suite home commands to the module list in `useCommandRegistry()`, using either `suite-forge` canonical IDs or the alias normalization.

---

## P1: Stubs (Needs Real Implementation)

### P1-1: RAG Datasets Module — 8 Unimplemented API Calls
**File**: `pages/suites/modules/RAGDatasetsModule.tsx`  
**Issue**: Contains 8 `TODO: Implement API call` markers. UI renders but all CRUD operations are no-ops.  
**Impact**: TerraGPT RAG management is non-functional.  
**Fix**: Wire to backend RAG API endpoints when available.

### P1-2: Dais Sub-Modules (Certification, Appeals, Permits, Calendar)
**File**: `pages/suites/DaisSuiteHome.tsx`  
**Issue**: Levy and PILT modules have real API integration, but Certification, Appeals, Permits, and Calendar modules appear to be static/mock content with no backend wiring.  
**Impact**: 4 of 6 TerraDais modules are presentation-only.  
**Fix**: Wire to backend APIs as they become available.

### P1-3: GPT Management Dashboard — hardcoded user ID
**File**: `components/gpt/GPTManagementDashboard.tsx:158`  
**Issue**: `TODO: Get current user ID from auth context` — uses hardcoded fallback.  
**Fix**: Wire to auth context when auth system provides user identity.

### P1-4: Atlas GIS Module — No Map Tile Rendering
**File**: `pages/suites/modules/GISModule.tsx`  
**Issue**: GIS module renders layer toggles and parcel search tables but has NO actual map/tile rendering (no Leaflet, Mapbox, or OpenLayers). It's a data-table view of GIS data.  
**Impact**: Users expect a map from a GIS module.  
**Fix**: Integrate map tile library when ready.

---

## P2: Polish (Styling, Alignment, UX)

### P2-1: Dead Shell Files Cleanup
**Files**: 
- `shell/DesktopShell.tsx`
- `shell/DesktopShell.backup.tsx`  
- `shell/DesktopShell.clean.tsx`
- `shell/QuantumDesktopShell.tsx`
- `shell/SimplifiedQuantumDesktopShell.tsx`
- `shell/SystemTray.tsx`
- `shell/ModuleLauncher.tsx`

**Issue**: 7 legacy/unused shell files that create confusion about which is the actual shell entry point.  
**Fix**: Move to QUARANTINE or delete after confirming no imports reference them.

### P2-2: CSS File Proliferation
**Directory**: `styles/` (26 CSS files)  
**Issue**: Only 4 CSS files are imported by App.tsx. The remaining 22 are potentially dead CSS contributing to bundle bloat.  
**Files to audit**:
- `quantum-desktop-shell.css` — for dead QuantumDesktopShell
- `elite-quantum-dashboard.css` — "elite" prefix
- `terrafusion-celebration.css` — celebratory animations
- `terrafusion-self-healing.css` — self-healing CSS
- `terrafusion-quantum-animations.css` — quantum animations
- `terrafusion-quantum-excellence.css`
- Multiple `terrafusion-*-architecture.css` files

**Fix**: Trace imports, quarantine unused CSS files.

### P2-3: WebGLBackground.tsx Unused
**File**: `shell/desktop/WebGLBackground.tsx`  
**Issue**: DesktopBackground uses CSSAmbientLayer (pure CSS). WebGLBackground exists but is unused.  
**Fix**: Remove or quarantine.

### P2-4: Generic SuiteHome.tsx Has Empty TODOs
**File**: `pages/suites/SuiteHome.tsx`  
**Issue**: Contains 3 `/* TODO */` comments for planned features. File is superseded by individual suite homes.  
**Fix**: Keep as fallback for future office suites, but remove or implement the TODO sections.

### P2-5: Hardcoded Demo Parcel ID in desktopManifest
**File**: `config/desktopManifest.ts`  
**Issue**: Uses `const DEMO_PARCEL_ID = '1234567890'` for workbench routing on desktop icons. Clicking a suite desktop icon routes to `/property/1234567890/forge` — a fake parcel.  
**Fix**: Use last-viewed parcel from context, or route to suite standalone home instead.

### P2-6: Taskbar Demo Notifications
**File**: `shell/desktop/Taskbar.tsx`  
**Issue**: Contains hardcoded `defaultNotifications` array with 2 demo notifications ("Assessment Complete", "AI Analysis Ready"). These appear as fallback when no real notifications exist.  
**Fix**: Remove demo data or flag as demo-only.

### P2-7: Start Menu Search Filtering
**Evidence**: `launcher.behavior.test.tsx` line 373: `TODO: Search filtering not yet implemented - launcher ignores searchQuery currently`  
**Issue**: Start menu search input exists but may not filter results.  
**Fix**: Verify search filtering works in startMenuStore and fix if not.

---

## P3: Nice-to-Have (Clean-up & Optimization)

### P3-1: Accessibility — Skip Navigation Link
**Issue**: No skip-to-content link for keyboard users. Desktop shell traps keyboard in icon grid / taskbar without skip option.  
**Fix**: Add invisible skip link before desktop content.

### P3-2: Accessibility — Window Keyboard Resize
**Issue**: Windows can only be resized via mouse drag (react-rnd). No keyboard alternative.  
**Fix**: Add keyboard shortcuts for window resize (e.g., Ctrl+Arrow to resize active window).

### P3-3: Focus Management — Start Menu Close
**Issue**: When start menu closes, focus doesn't return to the TerraSphere button that opened it.  
**Fix**: Track trigger element and return focus on close.

### P3-4: WindowPeek Module Descriptions Stale
**File**: `shell/desktop/WindowPeek.tsx`  
**Issue**: `MODULE_DESCRIPTIONS` map only covers 12 legacy module IDs. Suite home descriptions (suite-forge, suite-atlas, etc.) are missing — falls back to generic "TerraFusion Module".  
**Fix**: Add suite home entries to MODULE_DESCRIPTIONS.

### P3-5: Command Palette — Constitutional Suite Commands
**File**: `shell/command-palette/CommandPalette.tsx`  
**Issue**: (Escalated copy of P0-2) — Also add navigation commands for OS features and workbench.  
**Fix**: Add all canonical routes (suites, features, workbench) to command registry.

### P3-6: Store Count Optimization
**Issue**: 17 Zustand stores. Some may be consolidatable (e.g., metricsStore + networkStore could merge into a system status store).  
**Fix**: Audit store usage and consolidate where logical. Low priority — stores are lightweight.

### P3-7: SystemGptAtlasPanel Tests — 14 Unimplemented
**File**: `features/gpt/components/__tests__/SystemGptAtlasPanel.test.tsx`  
**Issue**: 14 test stubs with `TODO: Implement when live data integration is complete`.  
**Fix**: Implement when live data hooks are wired.

---

## Summary Matrix

| Priority | Count | Key Theme |
|----------|-------|-----------|
| **P0** | 2 | Desktop icon badges invisible; Command palette missing suites |
| **P1** | 4 | RAG API stubs; Dais partial wiring; GPT auth; Atlas no map tiles |
| **P2** | 7 | Dead code cleanup; CSS proliferation; Demo data; Search filtering |
| **P3** | 7 | Accessibility; Focus management; Module descriptions; Test stubs |
| **Total** | **20** | |

---

## Recommended Slice Assignments

| Item | Best Slice | Rationale |
|------|-----------|-----------|
| P0-1 (icon badges) | **Slice 7.1** (Desktop Visual Polish) | Direct desktop UI fix |
| P0-2 (command palette) | **Slice 7.3** (Command Palette Search) | Command palette is that slice's scope |
| P2-1 (dead shell files) | **Slice 7.2** (Module Registry Cleanup) | Module/file registry hygiene |
| P2-2 (CSS proliferation) | **Slice 7.2** (Module Registry Cleanup) | File registry hygiene |
| P2-5 (demo parcel ID) | **Slice 7.4** (Start Menu Parcels) | Parcel context routing |
| P2-6 (demo notifications) | **Slice 7.1** (Desktop Visual Polish) | Desktop chrome polish |
| P2-7 (search filtering) | **Slice 7.3** (Command Palette Search) | Search functionality |
