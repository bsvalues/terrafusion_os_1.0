# Slice 7.2 — Module Registry Cleanup: Discovery

**Date**: 2026-02-27 (REVISED — verified against current source)
**Agent**: Agent 2 of 5 (Governance Swarm)
**Objective**: Audit the module registry system — identify dead aliases, orphaned entries, DRY violations, test runner confusion, and naming inconsistencies.

---

## 1. Registry Architecture (4 Layers + 1 Generated Manifest)

| # | File | Key Exports | Role |
|---|------|------------|------|
| 1 | `config/moduleComponents.tsx` | `MODULE_ALIASES` (Record), `MODULE_REGISTRY` (Set), `MODULE_ENTRIES` (Record), `ModuleRenderer` (switch), `normalizeModuleId()`, `isModuleRegistered()` | **Canonical source of truth** for rendering |
| 2 | `orchestration/moduleActivation.ts` | `activateModule()`, local `displayNames` map, local `icons` map, `getModuleDisplayName()`, `getModuleIcon()` | Window title/icon resolution + orchestration |
| 3 | `stores/moduleLoaderStore.ts` | Local `MODULE_ALIASES` (duplicate), local `REGISTERED_MODULES` (duplicate), `normalizeModuleId()` (duplicate) | Warm-load lifecycle store |
| 4 | `stores/moduleRegistryStore.ts` | `ModuleDefinition` type, dynamic `modules` Map | Runtime registry for gen2 modules |
| 5 | `config/generatedModules.ts` | `GENERATED_MODULES` (auto-generated from manifests) | External module definitions |

### Bridge Layer
| File | Purpose |
|------|---------|
| `config/modules.ts` | Maps `GENERATED_MODULES` → `ModuleDefinition[]` (filtering by intent: gen2/legacy/archive) |
| `config/suiteRegistry.ts` | `CONSTITUTIONAL_SUITES` (5), `OS_FEATURES` (3), `OS_SURFACES` (1) |
| `shell/desktop/ModuleLoader.tsx` | Bridges stores → rendering (tries moduleRegistryStore first, falls back to MODULE_REGISTRY) |

---

## 2. Complete Inventory (VERIFIED 2026-02-27)

### 2.1 MODULE_REGISTRY — 21 canonical IDs
Source: `config/moduleComponents.tsx` L80–99

```
federation-dashboard, costforge, terra-gaia, levy-calculator,
gis-viewer, document-manager, reporting, atlas-ai, marketplace,
counties, government-architecture, settings, shortcuts-help,
plugin-manager, axiom-fs, sovereign-dashboard,
suite-forge, suite-atlas, suite-dais, suite-dossier, suite-gpt
```

### 2.2 MODULE_ALIASES — 32 aliases
Source: `config/moduleComponents.tsx` L23–59

#### Legacy aliases (4)
| Alias | → Target |
|-------|----------|
| `terrabuild` | `costforge` |
| `terra-build` | `costforge` |
| `property` | `costforge` |
| `assessment` | `costforge` |

#### Short aliases (15)
| Alias | → Target |
|-------|----------|
| `gaia` | `terra-gaia` |
| `ai` | `atlas-ai` |
| `analytics` | `reporting` |
| `reports` | `reporting` |
| `levy` | `levy-calculator` |
| `gis` | `gis-viewer` |
| `map` | `gis-viewer` |
| `docs` | `document-manager` |
| `documents` | `document-manager` |
| `store` | `marketplace` |
| `apps` | `marketplace` |
| `config` | `settings` |
| `preferences` | `settings` |
| `help` | `shortcuts-help` |
| `shortcuts` | `shortcuts-help` |

#### Phase C3: Sovereign Dashboard aliases (3)
| Alias | → Target |
|-------|----------|
| `dashboard` | `sovereign-dashboard` |
| `doc-viewer` | `sovereign-dashboard` |
| `document-viewer` | `sovereign-dashboard` |

#### Constitutional Suite Home aliases (10)
| Alias | → Target |
|-------|----------|
| `forge` | `suite-forge` |
| `atlas` | `suite-atlas` |
| `dais` | `suite-dais` |
| `dossier` | `suite-dossier` |
| `gpt` | `suite-gpt` |
| `terraforge` | `suite-forge` |
| `terraatlas` | `suite-atlas` |
| `terradais` | `suite-dais` |
| `terradossier` | `suite-dossier` |
| `terragpt` | `suite-gpt` |

### 2.3 MODULE_ENTRIES — 18 lazy-loaded components
Source: `config/moduleComponents.tsx` L211–232

| Module ID | Component |
|-----------|-----------|
| `federation-dashboard` | `FederationDashboard` |
| `costforge` | `CostForgeQuantumDashboard` |
| `terra-gaia` | `TerraGaiaDashboard` |
| `reporting` | `AnalyticsDashboard` |
| `atlas-ai` | `ATLAS` |
| `marketplace` | `Marketplace` |
| `counties` | `CountiesHub` |
| `government-architecture` | `GovernmentArchitecture` |
| `settings` | `SettingsPanel` |
| `shortcuts-help` | `ShortcutsPanel` |
| `plugin-manager` | `PluginManager` |
| `axiom-fs` | `AxiomFSWindow` |
| `sovereign-dashboard` | `SovereignDashboardWindow` |
| `suite-forge` | `ForgeSuiteHome` |
| `suite-atlas` | `AtlasSuiteHome` |
| `suite-dais` | `DaisSuiteHome` |
| `suite-dossier` | `DossierSuiteHome` |
| `suite-gpt` | `GptSuiteHome` |

**Not in MODULE_ENTRIES (rendered as inline PlaceholderModules in ModuleRenderer switch):**
- `levy-calculator` (L407)
- `gis-viewer` (L415)
- `document-manager` (L423)

### 2.4 ModuleRenderer switch — 21 cases + default
Source: `config/moduleComponents.tsx` L374–577

All 21 MODULE_REGISTRY entries have matching switch cases. 3 are PlaceholderModules. Default routes to `GenericModuleHost`.

### 2.5 moduleActivation.ts displayNames — 21 entries (COMPLETE)
Source: `orchestration/moduleActivation.ts` L89–111

All 21 MODULE_REGISTRY entries covered. Verified against current source.

### 2.6 moduleActivation.ts icons — 21 entries (COMPLETE)
Source: `orchestration/moduleActivation.ts` L117–139

All 21 MODULE_REGISTRY entries covered.

### 2.7 moduleLoaderStore.ts REGISTERED_MODULES — 21 entries (SYNCED)
Source: `stores/moduleLoaderStore.ts` L96–120

Currently **in sync** with MODULE_REGISTRY. Same 21 entries.

### 2.8 moduleLoaderStore.ts MODULE_ALIASES — 32 entries (SYNCED)
Source: `stores/moduleLoaderStore.ts` L52–94

Currently **in sync** with moduleComponents.tsx MODULE_ALIASES. Same 32 entries.

### 2.9 CONSTITUTIONAL_SUITES — 5 suites
Source: `config/suiteRegistry.ts`

`forge`, `atlas`, `dais`, `dossier`, `gpt`

### 2.10 OS_FEATURES — 3 features
Source: `config/suiteRegistry.ts`

`pilot`, `trace`, `canon`

### 2.11 GENERATED_MODULES — 12 manifests
Source: `config/generatedModules.ts` (auto-generated)

| ID | Display Name | Intent | Status |
|----|-------------|--------|--------|
| `costforge-ai` | CostForge AI | legacy | legacy |
| `gis-pro` | TerraGIS | gen2 | active |
| `os-shell` | TerraFusion OS Shell | archive | active |
| `terra-dossier` | TerraDossier | gen2 | active |
| `terra-flow` | TerraFlow | gen2 | active |
| `terra-gama` | TerraGAMA | gen2 | active |
| `terra-levy` | TerraLevy | gen2 | active |
| `terra-permit` | TerraPermit | gen2 | active |
| `terra-pilt` | TerraPILT | gen2 | active |
| `terra-primeview` | TerraPrime | gen2 | active |
| `terraforge` | TerraForge | gen2 | active |
| `income-valuation` | Income Valuation | legacy | legacy |
| `webhub` | WebHub | legacy | legacy |

**Gen2 module IDs do NOT appear in MODULE_REGISTRY.** They are resolved via `isModuleRegistered()` which checks both MODULE_REGISTRY and the dynamic MODULES array. The ModuleRenderer `default` case routes them to `GenericModuleHost`.

---

## 3. Dead Alias Analysis

**All 32 aliases resolve to valid MODULE_REGISTRY entries. No dead aliases.**

However, 5 aliases point to **placeholder/stub modules**:
- `levy` → `levy-calculator` (PlaceholderModule)
- `gis`, `map` → `gis-viewer` (PlaceholderModule)
- `docs`, `documents` → `document-manager` (PlaceholderModule)

---

## 4. Key Findings

### FINDING-1: DRY Violation (CRITICAL for maintainability)
`moduleLoaderStore.ts` contains **full duplicates** of both `MODULE_ALIASES` (32 entries) and `REGISTERED_MODULES` (21 entries) from `moduleComponents.tsx`. The comment says "kept in sync" — but this is manual, not programmatic. Currently in sync, historically has drifted.

### FINDING-2: Duplicate Display Name
- `federation-dashboard` → displayName `'TerraDais'` (L91 of moduleActivation.ts)
- `suite-dais` → displayName `'TerraDais'` (L108 of moduleActivation.ts)
Two modules with the same window title. `federation-dashboard` was the original dais component; `suite-dais` is the constitutional suite home.

### FINDING-3: Legacy Module Identity Overlap
- `terra-gaia` (registered in MODULE_REGISTRY, renders TerraGaiaDashboard)
- `suite-gpt` (registered in MODULE_REGISTRY, renders GptSuiteHome)
Per product identity: TerraGaia → TerraGPT (legacy name). Both modules coexist with different implementations.

### FINDING-4: Test Runner Confusion
- `stores/__tests__/moduleRegistryStore.test.ts`: Has `@vitest-environment jsdom` annotation on L2 but uses `jest.mock()` and `jest.fn()` throughout
- `frontend/package.json` L144: `"test": "jest"` — frontend tests run under Jest
- Root `vitest.config.ts`: Only covers `tests/`, `os-platform/core/tests/`, NOT `frontend/apps/os-shell`
- **Verdict**: The `@vitest-environment` comment is vestigial. All frontend tests run under Jest.

### FINDING-5: Existing Consistency Test
`config/__tests__/moduleRegistryConsistency.test.ts` already exists with 5 test groups covering:
1. MODULE_ALIASES → MODULE_REGISTRY resolution
2. MODULE_REGISTRY → ModuleRenderer coverage
3. moduleActivation displayNames/icons coverage
4. moduleLoaderStore REGISTERED_MODULES sync
5. Alias safety (no alias shadows a canonical ID)

### FINDING-6: Module ID Inconsistencies
No consistent prefix convention:
- Bare kebab: `costforge`, `terra-gaia`, `reporting`, `atlas-ai` (16 IDs)
- `suite-` prefix: `suite-forge`, `suite-atlas`, etc. (5 IDs)
- Gen2 IDs: `terra-dossier`, `gis-pro`, `terraforge` (different naming conventions)

### FINDING-7: 3 Placeholder Asymmetry
`levy-calculator`, `gis-viewer`, `document-manager` are in MODULE_REGISTRY but NOT in MODULE_ENTRIES. They are rendered as inline PlaceholderModules in the ModuleRenderer switch statement. This is intentional but creates an asymmetry that `getModuleEntry()` returns `undefined` for registered modules.

---

## 5. Constraints

- Do NOT break existing desktop windows or navigation
- Do NOT remove aliases that may be used in deep links, bookmarks, or URL routes
- Do NOT modify `config/generatedModules.ts` (auto-generated)
- Do NOT modify `config/suiteRegistry.ts` (constitutional — requires governance review)
- All changes must have passing tests before merge
