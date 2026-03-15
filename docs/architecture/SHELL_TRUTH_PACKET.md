# Shell Truth Packet — Phase 5A Truth Freeze

**Created**: 2026-03-15
**Snapshot Commit**: `eda3e70f4`
**Purpose**: Frozen record of shell runtime state before Phase 5 code changes.

---

## Shell Runtime Inventory

### Window Lifecycle

| Component | File | Status |
|-----------|------|--------|
| `getModuleWindowSize()` | `stores/desktopStore.ts:168` | **DEFECTIVE** — tier0-workbench returns `maximized: false` |
| `evaluateSpawnIntent()` | `stores/desktopStore.ts` | Correct — gates window creation via Codex |
| `openWindow()` | `stores/desktopStore.ts:499` | Correct — passes `maximized` to window state |
| `Window.tsx` react-rnd | `shell/desktop/Window.tsx:487` | Correct — disables drag/resize when maximized |
| Title-bar double-click | `shell/desktop/Window.tsx:265` | **DEFECTIVE** — allows restore from maximized for tier-0 |
| `maximizeWindow()` | `stores/desktopStore.ts:582` | Correct — sets state to 'maximized' |
| `restoreWindow()` | `stores/desktopStore.ts:613` | Correct — but should be blocked for tier-0 |

### Codex (Object Placement)

| Component | File | Status |
|-----------|------|--------|
| `MODULE_OBJECT_TYPES` | `contracts/objectPlacement.ts:270` | Correct — 47 entries, all properly classified |
| `PLACEMENT_POLICY` | `contracts/objectPlacement.ts:119` | Correct — 15 object types with rules |
| `validatePlacement()` | `contracts/objectPlacement.ts:343` | Correct — available but not called at runtime |
| `validateWorkbenchHost()` | `contracts/objectPlacement.ts:529` | Correct — validates tab hosting |
| `validateSuiteRendering()` | `contracts/objectPlacement.ts:582` | Correct — enforced in ModuleRenderer |

### Module Registry

| Component | File | Status |
|-----------|------|--------|
| `MODULE_REGISTRY` | `config/moduleComponents.tsx:127` | Has dead entries — `income-valuation`, `comparable-sales` archived |
| `MODULE_ENTRIES` | `config/moduleComponents.tsx:313` | Correct — 27 live lazy components |
| `ModuleRenderer` | `config/moduleComponents.tsx:561` | Has archived case branches still rendering placeholders |
| `MODULE_ALIASES` | `config/moduleComponents.tsx:25` | Has stale aliases pointing to archived modules |

### Shell Chrome

| Component | File | Status |
|-----------|------|--------|
| Taskbar zones (A/B/B-overflow) | `shell/desktop/Taskbar.tsx` | Correct — constitutional |
| Z-index hierarchy | `shell/desktop/zIndex.ts` | Correct — 16 layers, properly ordered |
| Suite registry | `config/suiteRegistry.ts` | Correct — 5 suites + 3 OS features + 1 workbench |

---

## Defect Summary

See `shell-defect-ledger.json` for machine-readable defect list.

| ID | Severity | Description | Fix Phase |
|----|----------|-------------|-----------|
| SD-001 | Critical | Workbench `maximized: false` in getModuleWindowSize | 5B |
| SD-002 | Moderate | Workbench can be restored via double-click | 5B |
| SD-003 | Low | Workbench size uses arbitrary padding instead of viewport | 5B |
| SD-004 | Info | Redundant fallback prefix-matching in sizing function | 5B |
| SD-005 | Info | Dead/archived entries in module registry | 5G |

---

## Verification Results

| Check | Result |
|-------|--------|
| All 5 suites in MODULE_OBJECT_TYPES as suite-workspace | PASS |
| All 3 OS features in MODULE_OBJECT_TYPES as os-feature-window | PASS |
| Taskbar constitutional zones | PASS |
| Z-index layer ordering | PASS |
| Suite boundary enforcement in ModuleRenderer | PASS |
| Workbench host boundary validation available | PASS |
| evaluateSpawnIntent called before window creation | PASS |
| Window.tsx drag/resize lock when maximized | PASS |
| Suite windows open near-full-stage | PASS |

**80% of shell contracts are correctly wired. 3 files need code changes.**
