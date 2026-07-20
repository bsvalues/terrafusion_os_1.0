# WO-FORGE-X-002 — Forge Exact Disposition, Dependency & Provenance

> Resolves the six decisions flagged by `WO-FORGE-X-001-INVENTORY.md` with source evidence, and
> produces the exact per-surface disposition + dependency inventory + provenance. **Decision-layer;
> no code moved, no repo, no credential.** Extraction/bootstrap remain gated on the Forge repo.

**Date:** 2026-06-25 · **Source of truth:** `origin/main` @ `2ae013561` · **Contracts:** frozen `forge.valuation`/`canonical.parcel`/`shared.envelopes`/`crosscut.audit` @ `v1.0.0`

## 1. The six decisions — RESOLVED (with evidence)
1. **EF coupling → Forge gets its own `ForgeDbContext` (REWRITE, not lift).** Forge engine entities
   (`CostFactorSet/CostFactor/CapRateSet/CapRate/ParcelValuation`, etc.) are `DbSet`s on the **shared
   `TerraFusionDbContext`** (no dedicated Forge configs, no Forge context). Extraction must carve a
   `ForgeDbContext` slice (the **`CurrentUse` pattern** — own context + migration — proves it viable).
2. **Shared parcel/sale DATA stays in OS/Sync (Forge reads via contract).** `CostMatrix` and
   `ComparableSale` are **populated by Sync/PACS** (`API/Services/PacsToTerraFusionSyncService.cs`,
   `API/Controllers/SyncController.cs`). They are **not Forge-owned** → RETAIN_IN_OS, exposed through
   `canonical.parcel`/`forge.valuation` contracts. **Forge owns the engines, not the shared data.**
3. **`forge/geo` (64) + `atlas-live` (16) → Forge** (`GeoForge`). Filenames are `GeoForge*`, panels
   `ValueStrataPanel/RatioCliffPanel/AssessmentRollPanel/AdjustmentWorkbenchPanel/QualDecisionPanel` —
   spatially-**rendered valuation**, not GIS-layer management. → EXTRACT to Forge, **consuming
   `atlas.gis@1.0.0`** for base geometry (confirm no Atlas-layer ownership at Atlas inventory).
4. **`forge/county-studio` (74) → Forge** (valuation studio). 51/74 files reference valuation terms;
   it is the ratio-study / assessment-quality risk-surface studio (PR #879). → EXTRACT to Forge,
   **consuming an OS county-context contract** (soft-flag: revisit if it grows county-governance scope).
5. **AI-project type-level cut → confirmed.** Extract valuation/AVM/sales types only; GPT/swarm/
   consciousness stay in OS.
6. **Controller-level cut → confirmed.** Forge controllers become suite-owned; OS composes via
   contract/module slot (Workbench Forge tab host stays OS).

## 2. Refined ownership line (the crux)
```text
OS / Sync spine owns:   shared parcel/sale DATA (CostMatrix, ComparableSale, + PACS-sync'd valuation
                        inputs) — populated by Sync, read by Forge via frozen contracts.
Forge owns:             the valuation ENGINES + their config/output domain:
                        Core/Entities/Forge/* (CostApproach/IncomeApproach/LandApproach/SalesRatio/
                        CapRateSet/CostFactorSet/ParityEvaluator/CalibrationGate/ForgeGovernance),
                        AI valuation services, API/SalesForge (OLS/ratio/qualification), CurrentUse,
                        the Forge UI — persisted in a NEW ForgeDbContext.
```

## 3. Exact disposition matrix
| Source path | Capability | Action | Dep (contract / retained) | Provenance | Cutover gate |
|---|---|---|---|---|---|
| `TerraFusion.CostForge/**` | theater | **REJECT** | — | — | — |
| `Core/Entities/Forge/*` (17) | engine domain | **REWRITE_FOR_SUITE** → `ForgeDbContext` | forge.valuation | `2ae013561` | ForgeDbContext builds + migration applies |
| `Core/Entities/{CostMatrix,ComparableSale}` | Sync-populated shared data | **RETAIN_IN_OS** (SHARE_AS_CONTRACT) | canonical.parcel/forge.valuation | `2ae013561` | Forge reads via contract, no direct entity ref |
| `Core/Entities/{ValuationRecord,SaleComparableRecord,CalibrationMemo,CountyRatioCode,SaleRatioType}` | valuation OUTPUTS | **EXTRACT** (lean Forge) — confirm per-entity X-003 | forge.valuation | `2ae013561` | no non-Forge reader found → move; else contract |
| `Core/Entities/{Valuation,ValuationPipeline}` | valuation record/pipeline | **DEFER per-entity** (shared readers?) | forge.valuation | `2ae013561` | X-003 reader scan decides move vs contract |
| `AI/Services/{CostForgeService,CostForgeAIService,ICostForgeService,CostMatrixService,MassAppraisalService,PropertyValuationService,IPropertyValuationService}` | engines | **EXTRACT_EXACT** (type-cut) | forge.valuation | `2ae013561` | compiles in Forge; GPT/swarm left in OS |
| `AI/AVM/*`, `AI/Valuation/*`, `AI/Agents/Valuation*`, `AI/Types/ValuationAgentConfig` | AVM/ratio/agents | **EXTRACT_EXACT** | forge.valuation | `2ae013561` | compiles |
| `API/SalesForge/**` | OLS/ratio/qualification stats | **EXTRACT_EXACT** | forge.valuation | `2ae013561` | SalesForge.Tests parity |
| Forge controllers (16, see X-001) | HTTP surface | **EXTRACT_EXACT** (controller-cut) | forge.valuation, canonical.parcel, crosscut.audit | `2ae013561` | OS module-slot resolves via contract |
| `TerraFusion.CurrentUse/**` (+`.Host`, `CurrentUseDbContext`, migration) | current-use | **EXTRACT_EXACT** | forge.valuation | `2ae013561` | own context migration applies; 7 tests green |
| `frontend/.../pages/forge/{cost,valuation,income,sales,regression,statistics,mass-appraisal,calibration,batch,market,comparison,property,charts,avm,current-use,...}` | Forge UI | **EXTRACT_EXACT** | Workbench tab contract | `2ae013561` | renders in Workbench via contract |
| `frontend/.../pages/forge/{geo,atlas-live}` (80) | GeoForge valuation map | **EXTRACT** (Forge) consuming `atlas.gis` | atlas.gis@1.0.0 | `2ae013561` | confirm no Atlas-layer ownership at Atlas inv |
| `frontend/.../pages/forge/county-studio` (74) | ratio-study/risk studio | **EXTRACT** (Forge) consuming county-context | forge.valuation + OS county-ctx | `2ae013561` | soft-flag governance scope |
| `pages/workbench` Forge tab host | Tier-0 host | **RETAIN_IN_OS** | forge tab contract | — | host renders Forge suite via contract |
| API `Harris/ProductionPACSIntegrationController` | PACS | **RETAIN_IN_OS** (fence→Sync) | — | — | — |
| API `System/AIOrchestration/EliteOps/MultiCounty*/Codex/Collaboration/CostForgeTest` | OS/orchestration/test | **RETAIN_IN_OS** / REJECT test | — | — | — |
| Tests `SalesForge.Tests/*`, `CurrentUse.Tests/*` | suite tests | **EXTRACT_EXACT** | — | `2ae013561` | run green in Forge repo |
| Tests `Unit.Tests/{R2Wave25,R2Wave35,CanonicalTf/SalesRatio*}`, `Performance.Tests/*valuation*` | forge slices | **EXTRACT (type-cut)** | — | `2ae013561` | move Forge slices; leave shared harness |

## 4. Forge dependency inventory (what Forge needs to stand alone)
- **Contracts (consume):** `forge.valuation@1.0.0` (I/O), `canonical.parcel@1.0.0` (parcel/sale read),
  `shared.envelopes@1.0.0`, `crosscut.audit@1.0.0`, `atlas.gis@1.0.0` (GeoForge base geometry).
- **Retained-in-OS reads (via contract, not entity):** `CostMatrix`, `ComparableSale` (Sync-populated).
- **New persistence:** `ForgeDbContext` (engine/config/output tables carved from `TerraFusionDbContext`) +
  `CurrentUseDbContext` (already isolated).
- **Framework:** .NET 8, EF Core 8, central `Directory.Packages.props` (copied).
- **NOT needed:** GPT/swarm/consciousness, PACS adapters, Dais/Levy, Atlas layer-management.

## 5. `ForgeDbContext` carve plan (architectural resolution → executed at X-003)
1. New `TerraFusion.Forge.Data/ForgeDbContext` with `DbSet`s for **Forge-owned** entities only
   (`Core/Entities/Forge/*` + confirmed valuation-output records). 2. Move their EF configuration
   (currently convention/inline) into Forge configs. 3. Generate the Forge baseline migration.
   4. Shared data (`CostMatrix`/`ComparableSale`) is **read via contract**, not mapped in ForgeDbContext.
   5. Parity: Forge valuation outputs identical to monorepo (golden). *(Executed at WO-FORGE-X-003/004,
   post repo-creation.)*

## 6. Provenance & open confirmations for X-003
- **Provenance base:** every EXTRACT row carries source SHA `2ae013561` (+ the WO that moves it).
- **Confirm at X-003 (per-entity reader scans):** `Valuation`, `ValuationPipeline`, `ValuationRecord`,
  `SaleComparableRecord`, `CalibrationMemo` — move to Forge only if **no non-Forge reader** (else contract).
- **Confirm at Atlas inventory:** `forge/geo`+`atlas-live` own nothing Atlas-layer.
- **Unverifiable in-session:** build/test greenness (no `dotnet`); feeder repos (out-of-session).

## 7. Status
**WO-FORGE-X-002 COMPLETE.** Six decisions resolved; exact disposition matrix + dependency inventory +
`ForgeDbContext` carve plan + provenance produced. Crux resolved: **Forge owns engines (new
ForgeDbContext); shared parcel/sale data stays OS/Sync, read via frozen contracts.** Next:
**WO-FORGE-X-003** (bootstrap Forge build + contract boundary + ForgeDbContext) — **execution-gated on
the Forge repo** (credential). No code moved here.
