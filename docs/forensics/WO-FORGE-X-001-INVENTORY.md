# WO-FORGE-X-001 — Forge Implementation Inventory (source-side, on sovereign base)

> First step of the Forge pilot extraction. **Inventory + disposition only** — no code moved, no repo
> created, no credential needed. Inventories the proven Forge implementation on the sovereign base and
> assigns each surface a disposition. Architectural resolutions (EF coupling, boundary ownership) are
> **flagged for WO-FORGE-X-002/003**, not decided here.

**Date:** 2026-06-25 · **Source of truth:** `origin/main` @ `2ae013561` (Forge code) · **Contracts:** `forge.valuation@1.0.0` (frozen, WO-SR-002)
**Dispositions:** `RETAIN_IN_OS · EXTRACT_EXACT · REWRITE_FOR_SUITE · SHARE_AS_CONTRACT · MINE_PATTERN · DEFER · REJECT`

## 0. Headline correction (WO-SR-001 first-cut was wrong on one point)
WO-SR-001 §3 assumed `backend/src/TerraFusion.CostForge/**` → EXTRACT_EXACT. **It is theater** —
`UltimateCostForgeController` self-describes as *"Ultimate CostForge AI — Million-Agent Property
Intelligence… Government. Transcended… the pinnacle of property valuation consciousness"* (Quantum/
Consciousness/MillionAgent/Transcendence models + services). → **REJECT (fenced theater).** The real
Forge valuation is **distributed** across Core Forge entities + AI valuation services + API SalesForge +
CurrentUse. This is the load-bearing finding of the inventory.

## 1. Backend inventory
| Source path | Capability | Disposition | Shared dep | Tests | Notes |
|---|---|---|---|---|---|
| `backend/src/TerraFusion.CostForge/**` (33 .cs) | "Ultimate/Quantum/Consciousness/MillionAgent" | **REJECT** | — | — | fenced theater; do NOT copy |
| `backend/src/TerraFusion.Core/Entities/Forge/*` (17) — CostApproach, IncomeApproach, LandApproach, SalesRatio, CapRateSet, CostFactor(Set/Catalog), ParcelValuation(Assembler), ParityEvaluator, CalibrationGate, ForgeGovernance, LandScheduleSet, ForgeEngineMode | real Forge domain model | **EXTRACT** (EF-coupled → see §5) | forge.valuation | R2Wave25/35 | the genuine engine domain |
| `Core/Entities/{CostMatrix,Valuation,ValuationRecord,ValuationPipeline,ComparableSale,SaleComparableRecord,CalibrationMemo,CountyRatioCode,SaleRatioType}` | valuation/sales entities also read by others | **SHARE_AS_CONTRACT / DEFER type-cut** | canonical.parcel, forge.valuation | — | some consumed by Dais/Sync → keep canonical in OS; Forge-only → extract (decide X-002) |
| `backend/src/TerraFusion.AI/Services/{CostForgeService,CostForgeAIService,ICostForgeService,CostMatrixService,MassAppraisalService,PropertyValuationService,IPropertyValuationService}` | cost/mass-appraisal engines | **EXTRACT_EXACT** (type-level cut from AI proj) | forge.valuation | Unit.Tests forge | AI project also holds GPT/swarm — cut by type, not whole-project |
| `AI/AVM/{AiValuationService,AvmTrainingService}` · `AI/Valuation/{SaleRatioQueryBuilder,EquityMetricService,RollupService,BentonCustomMetricService}` · `AI/Agents/{ValuationAgent,ValuationAgentFactory}` · `AI/Types/ValuationAgentConfig` | AVM + ratio + valuation agents | **EXTRACT_EXACT** | forge.valuation | Perf.Tests | valuation-agent ≠ AI-swarm |
| `backend/src/TerraFusion.API/SalesForge/**` | sales-forge engine (OLS regression, ratio study, sale qualification) | **EXTRACT_EXACT** | forge.valuation | SalesForge.Tests | strongest-proven Forge code (real stats) |
| API forge controllers: `ForgeController, TerraForgeController, TerraForgeReportsController, CostForgeController, MassAppraisalController, ValuationController, PropertyValuationController, ValuationAgentController, SalesRatioStudyController, SalesReviewQueueController, SalesPipelineController, SalesAuditController, TfSalesController, CalibrationMemoController, CalibrationDiagnosticController, GeoForgeController` | Forge HTTP surface | **EXTRACT_EXACT** (controller-level cut) | forge.valuation, canonical.parcel, crosscut.audit | SalesForge.Tests | endpoints become suite-owned; OS routes to them via contract |
| `backend/src/TerraFusion.CurrentUse/**` (17) + `.Host` + `Data/CurrentUseDbContext.cs` (4 DbSets) + migration | current-use valuation | **EXTRACT_EXACT** (own DbContext = clean) | forge.valuation | CurrentUse.Tests (7) | cleanest lift; carries its own context |
| API `HarrisPACSIntegrationController`, `ProductionPACSIntegrationController` | PACS integration | **RETAIN_IN_OS** | — | — | PACS owner-fence → Sync |
| API `SystemOrchestrationController, AIOrchestrationController, EliteOperationsController, MultiCountyIntegration/FederationController, CodexCollaborationController, CollaborationController, CostForgeTestController` | OS orchestration / collab / test | **RETAIN_IN_OS** (or REJECT test/theater) | — | — | not Forge domain |

## 2. Frontend inventory (`frontend/apps/os-shell/src/pages/forge`, 307 files)
| Subdir (files) | Disposition | Notes |
|---|---|---|
| `cost`(17) `valuation`(5) `income`(5) `sales`(29) `regression`(14) `statistics`(31) `mass-appraisal`(2) `calibration`(2) `batch`(5) `market`(3) `comparison`(3) `property`(9) `charts`(8) `avm`(1) `scenarios`(1) `quality`(1) `parcel`(1) `economic`(1) `tax`(2) `anatomy`(1) `sketch`(1) `shared`(1) `hazard`(1) | **EXTRACT_EXACT** | core Forge UI — valuation/sales/AVM/ratio/cost |
| `geo`(64) `atlas-live`(16) | **DEFER (Atlas boundary)** | GIS-adjacent → likely Atlas-owned or shared; decide X-002 vs Atlas |
| `county-studio`(74) | **DEFER (ownership)** | County Studio (PR #879) — cross-cutting; may be OS surface or its own; decide X-002 |
| `current-use`(8) | **EXTRACT_EXACT** | pairs with backend CurrentUse |
| Workbench **Forge tab host** (in `pages/workbench`) | **RETAIN_IN_OS** | Tier-0; renders Forge via contract |

## 3. Test inventory
| Path | Disposition | Notes |
|---|---|---|
| `backend/tests/TerraFusion.SalesForge.Tests/*` (OlsRegression, RatioStudy, SaleQualification, ComparableSale, TerraForgeController, SalesAudit, + Mirrors engines) | **EXTRACT_EXACT** | real stats engine tests — go with SalesForge |
| `backend/tests/TerraFusion.CurrentUse.Tests/*` (7) | **EXTRACT_EXACT** | go with CurrentUse |
| `Unit.Tests/{R2Wave25 ForgeValuation, R2Wave35 ValuationPipeline, CanonicalTf/SalesRatioStudy*}` | **EXTRACT (type-level)** | Forge slices of the shared Unit test project |
| `Performance.Tests/{ConcurrentValuationLoad, PropertyValuationBenchmarks}` | **EXTRACT (type-level)** | valuation perf |

## 4. Shared-contract consumption + feeder provenance
- **Consumes (frozen v1.0.0):** `forge.valuation` · `canonical.parcel` · `shared.envelopes` · `crosscut.audit`. Forge **consumes**, never redefines.
- **Feeder provenance (out-of-session, unverifiable here):** `BSIncomeValuation`→income · `GeospatialAnalyzerBS`→sales/geo · `terra-forge-rebuild`(provisional) · `TerraFusion-Valuator-Pro-Studio`(provisional) · `WashingtonForge`(WA variant). Absorb only if a named gap is proven absent from the extracted base (owner decision §9).

## 5. Architectural decisions flagged for WO-FORGE-X-002 / X-003 (NOT decided here)
1. **EF coupling (the hard one):** `Core/Entities/Forge/*` are EF entities on `TerraFusionDbContext`. Forge extraction needs either a **Forge-owned DbContext slice** (like CurrentUse already has) or Forge consumes canonical contracts + its own persistence. → X-002 dependency inventory + X-003 bootstrap.
2. **Shared entities:** `CostMatrix/Valuation/ComparableSale/SaleComparableRecord` — determine per-entity whether read by Dais/Sync (→ stay canonical in OS) or Forge-only (→ extract). → X-002.
3. **`geo` + `atlas-live` (80 files) boundary:** Forge-owned or Atlas-owned/shared? → reconcile with Atlas inventory. → X-002.
4. **`county-studio` (74 files) ownership:** OS cross-cutting surface vs Forge vs own. → X-002.
5. **AI-project type-level cut:** extract only valuation/AVM/sales types; leave GPT/swarm/consciousness in OS. → X-003.
6. **Controller-level cut:** Forge controllers become suite-owned; OS composes via contract/module slot. → X-003.

## 6. What is proven vs unverifiable
- **Proven (paths/tests exist):** real Forge domain (Core/Entities/Forge), SalesForge stats engine (OLS/ratio/qualification with tests), CurrentUse (own context + 7 tests), 307-file Forge UI.
- **Unverifiable in-session:** build/test **greenness** (`dotnet` absent) — existence + structure verified, not green.

## 7. Status
**WO-FORGE-X-001 COMPLETE (inventory + disposition).** Load-bearing finding: CostForge project =
theater (REJECT); real Forge is distributed and largely EXTRACT_EXACT, with EF-coupling + two boundary
questions (geo/atlas-live, county-studio) deferred to **WO-FORGE-X-002** (exact source/dependency/
provenance disposition). No code moved; no credential required.
