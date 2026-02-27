# Slice 7.2 — Module Registry Cleanup: Research

**Date**: 2026-02-27 (REVISED — verified against current source)
**Agent**: Agent 2 of 5 (Governance Swarm)

---

## 1. Alias Resolution Chain (Full Pipeline)

### End-to-End Flow: Icon Click → Rendered Component

```
User clicks desktop icon "TerraForge"
  ↓ desktopManifest.ts maps suite.id ("forge") to desktop icon config
  ↓ Desktop icon onClick calls activateModule("forge", { source: "desktop" })
  ↓ moduleActivation.ts: activateModule()
    ↓ Step 1: normalizeModuleId("forge")  [from moduleComponents.tsx]
      ↓ MODULE_ALIASES["forge"] = "suite-forge"  →  canonical = "suite-forge"
    ↓ Step 2: isModuleRegistered("suite-forge")
      ↓ MODULE_REGISTRY.has("suite-forge") = true  →  proceed
    ↓ Step 3: telemetry.trackEvent("module.activate", ...)
    ↓ Step 4: findExistingWindow("suite-forge")
      ↓ desktopStore.windows.find(w => w.moduleId === "suite-forge")
      ↓ If found → focusWindow()  →  return
      ↓ If not found → continue
    ↓ Step 5: openWindow("suite-forge", "TerraForge", "🔨")
      ↓ getModuleDisplayName("suite-forge") = "TerraForge"
      ↓ getModuleIcon("suite-forge") = "🔨"
      ↓ desktopStore.openWindow() creates new DesktopWindow
    ↓ Step 6: notification + warmLoad
  
Window renders:
  ↓ Window component renders <ModuleLoader moduleId="suite-forge" />
  ↓ ModuleLoader.tsx:
    ↓ canonical = normalizeModuleId("suite-forge") → "suite-forge"
    ↓ Tries moduleRegistryStore.getModuleById("suite-forge") → undefined (not a gen2 module)
    ↓ Falls back: isModuleRegistered("suite-forge") → true (in MODULE_REGISTRY)
    ↓ Creates inline ModuleDefinition stub
    ↓ Renders <ModuleRenderer module={stub} />
  ↓ ModuleRenderer switch("suite-forge"):
    ↓ case 'suite-forge': → <ForgeSuiteHome />
```

### Alternate Path: Gen2 Module from Start Menu

```
User clicks "TerraLevy" in Start Menu
  ↓ Start menu uses MODULES array (from modules.ts, filtered gen2 from generatedModules.ts)
  ↓ MODULES entry: { id: "terra-levy", ... }
  ↓ activateModule("terra-levy", { source: "start_menu" })
  ↓ normalizeModuleId("terra-levy") → "terra-levy" (not in aliases, passes through)
  ↓ isModuleRegistered("terra-levy") → checks MODULE_REGISTRY (no) → checks MODULES array (yes) → true
  ↓ Window opens, ModuleLoader renders
  ↓ moduleRegistryStore.getModuleById("terra-levy") → found (gen2 module registered at startup)
  ↓ ModuleRenderer switch: no matching case → default → <GenericModuleHost />
```

---

## 2. Cross-Reference Matrix

### MODULE_REGISTRY vs All Renderable Paths

| Module ID | REGISTRY | ENTRIES | Renderer Case | displayName | icon | loaderStore REG | Status |
|-----------|:--------:|:-------:|:-------------:|:-----------:|:----:|:---------------:|--------|
| `federation-dashboard` | ✅ | ✅ | ✅ Full | ✅ `TerraDais` | ✅ `🏛️` | ✅ | **OK** |
| `costforge` | ✅ | ✅ | ✅ Full | ✅ `CostForge` | ✅ `💎` | ✅ | **OK** |
| `terra-gaia` | ✅ | ✅ | ✅ Full | ✅ `TerraGaia` | ✅ `🌍` | ✅ | **OK** |
| `levy-calculator` | ✅ | ❌ | ✅ Placeholder | ✅ `Levy Calculator` | ✅ `📊` | ✅ | **Asymmetric** |
| `gis-viewer` | ✅ | ❌ | ✅ Placeholder | ✅ `GIS Viewer` | ✅ `🗺️` | ✅ | **Asymmetric** |
| `document-manager` | ✅ | ❌ | ✅ Placeholder | ✅ `Documents` | ✅ `📁` | ✅ | **Asymmetric** |
| `reporting` | ✅ | ✅ | ✅ Full | ✅ `Analytics` | ✅ `📈` | ✅ | **OK** |
| `atlas-ai` | ✅ | ✅ | ✅ Full | ✅ `ATLAS` | ✅ `🤖` | ✅ | **OK** |
| `marketplace` | ✅ | ✅ | ✅ Full | ✅ `Marketplace` | ✅ `🏪` | ✅ | **OK** |
| `counties` | ✅ | ✅ | ✅ Full | ✅ `Counties Hub` | ✅ `🏛️` | ✅ | **OK** |
| `government-architecture` | ✅ | ✅ | ✅ Full | ✅ `Architecture` | ✅ `🏗️` | ✅ | **OK** |
| `settings` | ✅ | ✅ | ✅ Full | ✅ `Settings` | ✅ `⚙️` | ✅ | **OK** |
| `shortcuts-help` | ✅ | ✅ | ✅ Full | ✅ `Shortcuts & Help` | ✅ `⌨️` | ✅ | **OK** |
| `plugin-manager` | ✅ | ✅ | ✅ Full | ✅ `Plugin Manager` | ✅ `🧩` | ✅ | **OK** |
| `axiom-fs` | ✅ | ✅ | ✅ Full | ✅ `AxiomFS` | ✅ `📂` | ✅ | **OK** |
| `sovereign-dashboard` | ✅ | ✅ | ✅ Full | ✅ `Sovereign Dashboard` | ✅ `📊` | ✅ | **OK** |
| `suite-forge` | ✅ | ✅ | ✅ Full | ✅ `TerraForge` | ✅ `🔨` | ✅ | **OK** |
| `suite-atlas` | ✅ | ✅ | ✅ Full | ✅ `TerraAtlas` | ✅ `🗺️` | ✅ | **OK** |
| `suite-dais` | ✅ | ✅ | ✅ Full | ✅ `TerraDais` | ✅ `⚖️` | ✅ | **OK** |
| `suite-dossier` | ✅ | ✅ | ✅ Full | ✅ `TerraDossier` | ✅ `📋` | ✅ | **OK** |
| `suite-gpt` | ✅ | ✅ | ✅ Full | ✅ `TerraGPT` | ✅ `🧠` | ✅ | **OK** |

**Result**: All 21 MODULE_REGISTRY entries are fully covered across all layers. The displayNames and icons in moduleActivation.ts, and REGISTERED_MODULES in moduleLoaderStore.ts, are currently **in sync**.

### Alias Resolution — All 32 Validated

All 32 MODULE_ALIASES entries resolve to canonical IDs present in MODULE_REGISTRY. **No dead aliases.** Verified by existing test: `moduleRegistryConsistency.test.ts` L26–41.

---

## 3. DRY Violation Analysis

### The Core Problem

`moduleLoaderStore.ts` maintains **full copies** of two data structures from `moduleComponents.tsx`:

| Data Structure | moduleComponents.tsx | moduleLoaderStore.ts | Status |
|---------------|---------------------|---------------------|--------|
| `MODULE_ALIASES` | L23–59 (32 entries) | L52–94 (32 entries) | Currently synced |
| `MODULE_REGISTRY` → `REGISTERED_MODULES` | L80–99 (21 entries) | L96–120 (21 entries) | Currently synced |
| `normalizeModuleId()` | L66–69 | L202–204 | Duplicated logic |

Both files contain comments like `"kept in sync with moduleComponents.tsx"` — but this is a **manual discipline**, not a programmatic guarantee.

### Why Not Just Import?

The obvious fix (import from moduleComponents.tsx) risks **circular dependency**:
```
moduleLoaderStore.ts → moduleComponents.tsx → modules.ts → moduleRegistryStore.ts → desktopStore.ts
```

The `normalizeModuleId` and `MODULE_ALIASES` import would be safe (no circular path), but `isModuleRegistered` calls into MODULES which depends on the store layer. Needs careful analysis.

### Historical Evidence of Drift

The previous version of these governance docs (earlier today) recorded that moduleLoaderStore had only 11 REGISTERED_MODULES and 3 aliases, while the canonical source had 21 and 32 respectively. At some point, someone synced them up. This proves drift happens.

---

## 4. Naming Conflict: `federation-dashboard` vs `suite-dais`

Both produce window title `"TerraDais"`:
- `federation-dashboard` displayName = `'TerraDais'` (moduleActivation.ts L91)
- `suite-dais` displayName = `'TerraDais'` (moduleActivation.ts L108)

**Context**: `federation-dashboard` is a legacy module from `applications/federation-dashboard/FederationDashboard`. It pre-dates the constitutional suite system. When suites were added, `suite-dais` was created as the formal TerraDais suite home.

**Impact**: If a user opens both modules simultaneously, two windows would have the same title — confusing. No aliases point to `federation-dashboard`, so it's only reachable by exact canonical ID.

**Recommendation**: Rename `federation-dashboard` displayName to `'Federation Dashboard'` or `'TerraDais (Legacy)'` to disambiguate.

---

## 5. Legacy Module Identity: `terra-gaia` vs `suite-gpt`

| Property | `terra-gaia` | `suite-gpt` |
|----------|-------------|-------------|
| Registry | MODULE_REGISTRY | MODULE_REGISTRY |
| Component | TerraGaiaDashboard | GptSuiteHome |
| Aliases | `gaia` | `gpt`, `terragpt` |
| Display | TerraGaia | TerraGPT |

Per product identity (user memory): `TerraGaia → TerraGPT` (legacy name mapping).

**However, these are different implementations.** `terra-gaia` is the legacy AI chat interface; `suite-gpt` is the constitutional suite home page. They coexist intentionally. The `gaia` alias correctly points to the legacy component, not the suite home.

**Recommendation**: Document this as intentional coexistence. Consider adding a deprecation notice to `terra-gaia` when `suite-gpt` reaches feature parity.

---

## 6. Test Infrastructure Analysis

### Dual Runner Status

| Scope | Runner | Config |
|-------|--------|--------|
| `frontend/` tests | **Jest** | `frontend/package.json` `"test": "jest"` (L144) |
| Root `tests/` + `os-platform/core/` | **Vitest** | `vitest.config.ts` at project root |
| Frontend tests in `os-shell/` | **Jest** | Inherited from `frontend/package.json` |

### Test Files Related to Module Registry

| File | Runner | Annotations | Status |
|------|--------|-------------|--------|
| `config/__tests__/moduleRegistryConsistency.test.ts` | Jest | No runner annotation. Uses bare `describe/it/expect` | **OK** — Jest provides globals |
| `config/__tests__/registryConsistency.test.ts` | Jest | No annotation. Tests module entries + suite invariants | **OK** |
| `stores/__tests__/moduleRegistryStore.test.ts` | Jest | Has `@vitest-environment jsdom` (L2) but uses `jest.mock()`/`jest.fn()` | **BUG** — misleading annotation |
| `pages/suites/__tests__/suiteWindowLayout.test.tsx` | Jest | Uses `jest.mock` | **OK** |

### The `@vitest-environment` Misannotation

File: `stores/__tests__/moduleRegistryStore.test.ts` L1–2:
```ts
/**
 * @vitest-environment jsdom
```

This comment has no effect when running under Jest. It's either:
1. A leftover from an attempted Vitest migration, or
2. Aspirational (intending future migration)

**Impact**: None functional (Jest ignores it). But it's misleading to developers.

### Existing Test Coverage (moduleRegistryConsistency.test.ts)

5 test groups, all relevant to this slice:

1. **MODULE_ALIASES → MODULE_REGISTRY** (L24–65): Validates every alias resolves to a registered ID
2. **MODULE_REGISTRY → ModuleRenderer coverage** (L71–105): Validates every registry entry has a renderer
3. **moduleActivation displayNames/icons** (L110–175): Validates display name coverage (uses hardcoded expected list)
4. **moduleLoaderStore REGISTERED_MODULES sync** (L184–210): Validates store matches canonical registry
5. **Alias safety** (L216–234): No alias key shadows a canonical ID

**Gap**: Test group 3 uses a hardcoded `EXPECTED_DISPLAY_NAMES` map instead of dynamically reading from moduleActivation.ts (the maps are private). If a displayName changes, both the source AND the test must be updated.

---

## 7. Module ID Normalized Form Audit

### Current Conventions

| Convention | IDs | Count |
|-----------|-----|-------|
| Bare kebab-case | `costforge`, `terra-gaia`, `levy-calculator`, `gis-viewer`, `document-manager`, `reporting`, `atlas-ai`, `marketplace`, `counties`, `government-architecture`, `settings`, `shortcuts-help`, `plugin-manager`, `axiom-fs`, `sovereign-dashboard`, `federation-dashboard` | 16 |
| `suite-` prefixed | `suite-forge`, `suite-atlas`, `suite-dais`, `suite-dossier`, `suite-gpt` | 5 |

### Gen2 IDs (not in MODULE_REGISTRY)
| Convention | IDs |
|-----------|-----|
| `terra-` prefixed | `terra-dossier`, `terra-flow`, `terra-gama`, `terra-levy`, `terra-permit`, `terra-pilt`, `terra-primeview` |
| Bare | `gis-pro`, `terraforge`, `costforge-ai`, `income-valuation`, `webhub`, `os-shell` |

**No consistent convention.** This is historical — each module was added by different engineers/agents. The `suite-` prefix cleanly separates constitutional suites. Gen2 modules lean toward `terra-` prefix but not consistently.

---

## 8. displayNames vs MODULE_ENTRIES Sync

| MODULE_ENTRIES key | Has displayName | Has icon | Displayname value |
|-------------------|:--------------:|:--------:|-------------------|
| `federation-dashboard` | ✅ | ✅ | `TerraDais` ⚠️ (conflicts with suite-dais) |
| `costforge` | ✅ | ✅ | `CostForge` |
| `terra-gaia` | ✅ | ✅ | `TerraGaia` |
| `reporting` | ✅ | ✅ | `Analytics` |
| `atlas-ai` | ✅ | ✅ | `ATLAS` |
| `marketplace` | ✅ | ✅ | `Marketplace` |
| `counties` | ✅ | ✅ | `Counties Hub` |
| `government-architecture` | ✅ | ✅ | `Architecture` |
| `settings` | ✅ | ✅ | `Settings` |
| `shortcuts-help` | ✅ | ✅ | `Shortcuts & Help` |
| `plugin-manager` | ✅ | ✅ | `Plugin Manager` |
| `axiom-fs` | ✅ | ✅ | `AxiomFS` |
| `sovereign-dashboard` | ✅ | ✅ | `Sovereign Dashboard` |
| `suite-forge` | ✅ | ✅ | `TerraForge` |
| `suite-atlas` | ✅ | ✅ | `TerraAtlas` |
| `suite-dais` | ✅ | ✅ | `TerraDais` |
| `suite-dossier` | ✅ | ✅ | `TerraDossier` |
| `suite-gpt` | ✅ | ✅ | `TerraGPT` |

**All 18 MODULE_ENTRIES have matching displayNames and icons.** The 3 placeholders also have entries. **Full sync.**

---

## 9. Summary: Issues Ranked by Impact

| # | Issue | Severity | Impact | Effort |
|---|-------|----------|--------|--------|
| 1 | DRY violation: moduleLoaderStore duplicates aliases + registry | **HIGH** | Future drift risk (proven historical issue) | Medium |
| 2 | Duplicate display name: `federation-dashboard` = `suite-dais` = "TerraDais" | **MEDIUM** | User confusion if both windows open | Low |
| 3 | Test runner misannotation: `@vitest-environment` in Jest-only test | **LOW** | Developer confusion | Trivial |
| 4 | PlaceholderModule asymmetry (3 modules not in MODULE_ENTRIES) | **LOW** | API inconsistency (`getModuleEntry()` returns undefined) | Low |
| 5 | `terra-gaia` legacy overlap with `suite-gpt` | **INFO** | Technical debt, not a bug | Deferred |
| 6 | Inconsistent module ID naming conventions | **INFO** | No functional impact | Out of scope |
