# Shell Truth Packet — Phase 5A Truth Freeze

**Created**: 2026-03-15
**Snapshot Commit**: `b1204e4ef` (shell runtime fixes)
**Purpose**: Frozen record of shell runtime state after Phase 5 verification.

## Shell Runtime Behavior (Verified)

| Behavior | Expected | Actual | Status |
|----------|----------|--------|--------|
| Property Workbench sizing | Maximized (full viewport minus top bar + taskbar) | `maximized: true`, size = `vw × (vh - 44 - 48)` | PASS |
| Suite window sizing | Near-full-stage (large, movable, not maximized) | `suite-workspace` → 85% viewport, `maximized: false` | PASS |
| OS Feature window sizing | Standard application window | `os-feature-window` → 70% viewport | PASS |
| Window drag | Position persists on drag stop | `updateWindowPosition` called before snap | PASS |
| Title bar visibility | Below OS top bar (44px) | WindowManager container at `top-[44px]` | PASS |
| Dock zones | Home → Suites → Running Apps → Data Mode | Constitutional zones only | PASS |
| Dock click toggle | Click focused app → minimize | `focusWindow` toggles minimize when already active | PASS |
| Dock context menu (suites) | Right-click → Close/Minimize/Maximize | `onContextMenu` wired on DockSuiteButton | PASS |
| Dock context menu (apps) | Right-click → Close/Minimize/Maximize | TaskbarContextMenu renders for running apps | PASS |
| Suite registration (Codex) | 5 suites as `suite-workspace` | All 5 in MODULE_OBJECT_TYPES | PASS |
| OS Feature registration (Codex) | 3 features as `os-feature-window` | All 3 in MODULE_OBJECT_TYPES | PASS |
| Workbench tab registration (Codex) | 9 tabs as `parcel-scoped-app` | All 9 in MODULE_OBJECT_TYPES | PASS |
| Z-index hierarchy | Windows < Dock < System | window:30 < dock:1000 < startMenu:1010 | PASS |
| Module registry health | No dead/orphan entries | 46 entries, all intentional | PASS |

## Defect Ledger

All defects discovered during Phase 5 have been resolved:

| ID | File | Defect | Severity | Resolution | Commit |
|----|------|--------|----------|------------|--------|
| D-001 | `desktopStore.ts:178` | `tier0-workbench` returned `maximized: false` | Critical | Changed to `maximized: true` | Prior session |
| D-002 | `desktopStore.ts:178` | Workbench size used `vh - TASKBAR_HEIGHT` (missed top bar) | High | Changed to `vh - TOP_BAR_HEIGHT - TASKBAR_HEIGHT` | `b1204e4ef` |
| D-003 | `Window.tsx` handleDragStop | Position only saved when snap zone active; normal drags lost | High | Always call `updateWindowPosition` before snap | `b1204e4ef` |
| D-004 | `WindowManager.tsx` | Container at `top-0` — windows rendered behind 44px top bar | High | Changed to `top-[44px]` with adjusted height | `b1204e4ef` |
| D-005 | `desktopStore.ts` focusWindow | No toggle — clicking focused app did nothing | Medium | Added minimize toggle when already active | `b1204e4ef` |
| D-006 | `Taskbar.tsx` DockSuiteButton | No context menu on right-click | Medium | Added `onContextMenu` prop + TaskbarContextMenu | `b1204e4ef` |
| D-007 | `objectPlacement.ts` | ADR modules missing from MODULE_OBJECT_TYPES | Medium | Added statistics-studio, regression-studio, management-dashboard | `188b43cf0` |

## Phase 5 Sub-Phase Results

| Sub-Phase | Type | Result | Notes |
|-----------|------|--------|-------|
| 5A | Doc | Complete | This document |
| 5B | Code fix | Complete | D-001 through D-006 resolved |
| 5C | Verify | PASS | All 5 suites correctly classified |
| 5D | Verify | PASS | Dock is constitutional (3 zones) |
| 5E | Verify | PASS | All 3 OS features registered |
| 5F | Verify | PASS | All 9 workbench tabs registered |
| 5G | Verify | PASS | No dead entries remain (Phase 3 already cleaned) |
| 5H | Verify | PASS | Z-index hierarchy correct |

## Constitutional Compliance

- **Suites in suiteRegistry.ts**: 5/5 with `objectType: 'suite-workspace'`, `layer: 'layer-3-suite'`
- **OS Features in suiteRegistry.ts**: 3/3 with `objectType: 'os-feature-window'`, `layer: 'layer-5-application'`
- **OS Surfaces in suiteRegistry.ts**: 1/1 with `objectType: 'tier0-workbench'`, `layer: 'layer-4-workbench'`
- **Codex MODULE_OBJECT_TYPES**: 61 entries, all classified
- **PLACEMENT_POLICY**: 15 object types, all with drift-forbidden rules
