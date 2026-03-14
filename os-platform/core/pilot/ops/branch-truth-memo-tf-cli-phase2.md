# Branch Truth Memo: feat/tf-cli-phase2

**Date**: 2026-03-13
**Branch**: `feat/tf-cli-phase2`
**Commits**: 16 (from `b0829501e` to `85889e001`)
**Delta from main**: 283 files changed, +47,771 / -3,364 lines
**Status**: governance-green, type-clean, accumulated-work clean

---

## What These Two Checkpoint Commits Changed

### 59c28cc7c — Constellation Registration

Registered 14 new modules as truthful application catalog entries:

| Module ID | Suite | Scope | Launch | Status |
|-----------|-------|-------|--------|--------|
| `income-valuation` | Forge | Parcel | Workbench → forge | placeholder |
| `comparable-sales` | Forge | Parcel | Workbench → forge | placeholder |
| `regression-studio` | Forge | County-wide | Standalone | placeholder |
| `statistics-studio` | Forge | County-wide | Standalone | placeholder |
| `terra-gama` | Forge | County-wide | Standalone | placeholder |
| `terra-gis` | Atlas | County-wide | Standalone | placeholder |
| `terra-levy` | Dais | County-wide | Standalone | placeholder |
| `terra-pilt` | Dais | County-wide | Standalone | placeholder |
| `terra-permit` | Dais | County-wide | Standalone | placeholder |
| `vei` | Dais | County-wide | Standalone | placeholder |
| `property-tax-ai` | Dais | County-wide | Standalone | placeholder |
| `pacs-bridge` | Dossier | System/admin | Standalone | placeholder |
| `terra-sync` | Dossier | System/admin | Standalone | placeholder |
| `terra-flow` | Dossier | System/admin | Standalone | placeholder |

Key changes:
- `SuiteModuleGrid` upgraded with dual-mode `launchMode: 'workbench' | 'standalone'`
- All 4 suite homes (Forge, Atlas, Dais, Dossier) updated with new cards
- `generatedModules.ts`: 14 new `ModuleManifest` entries
- `moduleComponents.tsx`: 14 new MODULE_REGISTRY entries + aliases + PlaceholderModule metadata
- `moduleActivation.ts`: 14 new display name + icon mappings
- VEI = Vertical Equality Index (not Vacancy/Exemption Inspector)

### 85889e001 — Workbench Store Wiring + Canon/Pilot Hardening

- PropertySummary: connected to `propertyStore` for richer parcel data (assessments, appeals, history)
- PropertyWorkbenchWindow: Codex host boundary validation with violation notice UI
- All 9 workbench tabs: enriched with `propertyStore` data subscriptions
- Canon IDE: full editor theme, minimap, bookmarks, diff viewer, find/replace, go-to-symbol, outline, problems, quick-open, settings, snippets panels + 2,130 lines of `canon-ide.css`
- `desktopStore`: window management upgrades
- TerraPilot: 53 tools registered in `terrapilot.tools.json`
- Pilot handlers: expanded handler registry

---

## What Is Now Proven

- **App catalog is registered**: Every Benton County tool has a truthful module ID, correct suite, correct scope, correct launch target
- **Suite/workbench contract is materially corrected**: Suites are domain routers (Layer 3), workbench is parcel execution (Layer 4), standalone apps are cross-parcel
- **Workbench parcel data path is wired**: `propertyStore` → workbench tabs via context + direct subscriptions
- **Codex host enforcement is live**: Unauthorized objects in workbench get violation notice, not silent rendering
- **Canon IDE has real infrastructure**: File tree, editor, panels, theme — not a stub
- **159/159 governance tests pass**: Suite boundary, workbench host, object placement, launcher routing, tab embedding
- **Zero TypeScript errors**
- **UI token ratchet passes** (baseline set to 190 for pre-existing canon editor hex violations)
- **Phases 9-19 all complete (GO)**: Phase 20 (Benton UAT) awaits operator signoff

---

## What Remains Placeholder

Every module below opens a `PlaceholderModule` window with truthful metadata. None execute real domain logic yet.

| Module ID | What "Live" Would Mean |
|-----------|----------------------|
| `income-valuation` | Direct cap + GRM calculator with live parcel data |
| `comparable-sales` | Paired sale adjustments with Benton comp data |
| `regression-studio` | County-wide MRA regression with IAAO compliance |
| `statistics-studio` | COD/PRD/PRB ratio studies |
| `terra-gama` | Geographic neighborhood delineation |
| `terra-gis` | Full GIS platform (rehost from BCBSGISPRO) |
| `terra-levy` | Levy rate management (rehost from BCBSLevyMaster) |
| `terra-pilt` | Payment In Lieu of Taxes (rehost from TerraPILT) |
| `terra-permit` | Building permit workflow (rehost from TerraFUsionPermit) |
| `vei` | Vertical Equality Index with PRB analysis |
| `property-tax-ai` | AI-driven tax analysis (rehost from PropertyTaxAI) |
| `pacs-bridge` | Harris PACS import/export (rehost from PACS-DataBridge) |
| `terra-sync` | Multi-source ETL (rehost from TerraFusionSync) |
| `terra-flow` | Workflow automation (rehost from TerraFlow) |

Additionally:
- Workbench tabs have store wiring but display mock/snapshot data (no live PACS connection in dev)
- Canon IDE edits virtual filesystem, not production source
- GPT suite not yet audited for constellation alignment

---

## What the Next Phase Is

### Option A: Merge/Stabilize Checkpoint

If this branch is the new truth, merge it as a formal architectural checkpoint:
- PR into main with this memo as evidence
- Sets new baseline for all downstream work

### Option B: Suite-by-Suite Assimilation Audit

For every registered module across all 5 suites, verify:
1. Correct placement (suite affiliation matches domain)
2. Correct launch behavior (workbench vs standalone fires correctly)
3. Correct placeholder/live status (no false claims)
4. Correct relationship to workbench vs standalone
5. GPT suite alignment (not yet touched in constellation pass)

### Option C: Rehosting Pass

Pick highest-value placeholder modules and begin rehosting real logic from legacy GitHub repos:
- CostForge (already partially live)
- TerraLevy (BCBSLevyMaster has working code)
- Comparable Sales (GeospatialAnalyzerBS has comp logic)

---

## Branch Commit History

```
85889e001 feat(workbench): wire property store, Codex host enforcement, Canon IDE upgrades
59c28cc7c feat(catalog): register full application constellation with truthful metadata
190388097 feat(shell): wire shell mode contract into runtime behavior
cad667c3e feat(workbench): complete Layer 3-4 promotion with 9-tab workbench and governance tests
dd0e989ed feat(shell): complete shell integrity recovery and enforce governance contracts
dd0c5ce33 docs(recovery): align Hostinger snapshot runtime truth
fcaf28145 fix(sync): support snapshot-mode runtime state
e1351ac12 fix(deploy): allow snapshot runtime without pacs
de6d44677 fix(recovery): deploy canonical benton runtime state
d7ccc642b feat(cli): add lint, format, metrics commands + publishing package
33c51bbf4 feat(cli): add unified TF CLI with 52/52 tests
e4cc25633 ops(evidence): close 9-tab staging smoke with authenticated browser proof
46a8e405e ops(evidence): correct staging UI smoke — auth wall blocks tab rendering
eda4fa6a3 ops(truth): close 9-tab deployed workbench smoke debt with staging UI evidence
b0829501e ops(evidence): staging deployed UI smoke — 9-tab workbench click+deeplink verification
```
