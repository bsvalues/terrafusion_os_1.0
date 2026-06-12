# WS-1 Evidence — Deterministic TF-Native Valuation Engine (Forge)

**Case:** ACADEMY_CASE_001_PACS_MAIN · **Workstream:** WS-1 · **Recorded:** 2026-06-12
**Doctrine:** D-VAL-1 (TF-native, deterministic, auditable, explainable, non-vendor-dependent)
**Branch:** `feat/ws1-forge-cost-reference` (stacked on WS-3 `feat/ws3-audit-interceptor`)

Reproduce: `cd backend/tests/TerraFusion.Integration.Tests && dotnet test --filter "FullyQualifiedName~Forge"`
→ **41/41 Forge** green (full regression incl. WS-3 + county isolation: **60/60**). .NET 8, EF InMemory.

## V-series acceptance + EI mapping

| Item | Coverage | Status |
|---|---|---|
| V1 deterministic repeatability | `ValuationEngineTests.engine_is_deterministic`; EI-1 50-run sweep | ✅ |
| V2 no AI-only value path | `authoritative_value_never_depends_on_ai` (throwing advisory never consulted) | ✅ |
| V3 cost approach | `CostApproachTests` C1–C6 (RCN−dep+land, obsolescence survivorship, audit) | ✅ |
| V4 land schedule + WA current-use | `LandApproachTests` L1–L5 (market, reduced current-use, explicit) | ✅ |
| V5 sales ratio (IAAO) | `SalesRatioTests` S1–S5 (median/COD/PRD, disqualified excluded, time-trend) | ✅ |
| V6 income NOI/cap | `IncomeApproachTests` I1–I5 (value, zero-rate guard, audit) | ✅ |
| V7 reconciliation rule | `ValuationEngineTests` V7/V7b (weights by property type) | ✅ |
| V8 explanation complete | `result_carries_a_complete_explanation` (breakdown sums to value) | ✅ |
| V9 auditable + persisted explanation | reference-data writes audit-stamped via WS-3 (F6/C6/I5); `ValuationResult` is serializable | ⚠️ partial — persisting `ValuationResult`+explanation to a queryable table is a follow-up |
| V10 county isolation | `ForgeGovernanceTests` + `CostReferenceDataTests.selection_is_county_scoped` | ✅ |
| V11 write-lane discipline | `ForgeGovernanceTests.forge_write_lane_allows_only_valuation_columns` | ✅ |
| V12 workbench-consumable | `result_is_workbench_consumable_json` | ✅ |
| V13 parity comparison (gate, not source) | `ParityAndRolloutTests` (delta + tolerance; TF value not replaced) | ✅ |
| V14 parity does not mutate truth | read-only `ParityComparer`; result unchanged | ✅ |
| EI-1 determinism | 50-run sweep | ✅ |
| EI-2 no vendor doctrine | no vendor `ReferenceDataOrigin`; all sets `IsVendorDependent==false` | ✅ (unit-level; CI dependency audit still recommended) |
| EI-3 explainability | every result carries a complete explanation (V8) | ✅ |
| EI-4 auditability | reference-data writes audit-stamped (WS-3 interceptor) | ✅ |

## Built (TF-owned, in `TerraFusion.Core/Entities/Forge`)

Reference data (county-scoped, versioned, TF provenance, `IAuditableEntity`): `CostFactorSet`,
`DepreciationSchedule`, `LandScheduleSet`, `CapRateSet` (+ line items). Deterministic calculators:
`CostApproachCalculator`, `LandApproachCalculator`, `SalesRatioCalculator`, `IncomeApproachCalculator`.
Reconciliation + engine: `ReconciliationRule`, `ValueReconciler`, `ValuationEngine`, `ValuationResult`,
`IValuationAdvisory` (advisory-only). Governance: `ForgeCountyGuard`, `ForgeWriteLane`. Parity + rollout:
`ParityComparer`, `ForgeEngineMode`/`ForgeEngineOptions` (shadow-first). EF migration:
`ForgeValuationReferenceData` (8 Forge tables; also created 3 orphaned `CompSet*` tables to keep the
model migration-consistent).

## Remaining to fully close WS-1 (honest)

These are integration/human-gated, not core math:
1. **Parity gates RP-1/2/3/5/6** — the comparison harness exists, but the gated parity *runs* vs a
   PACS shadow at **Assessor-agreed tolerances** are a county sign-off + need real data. **RP-5
   (supplement round-trip via SourceXref lineage)** is the confirmed migration-validation gate.
2. **`IValuationEngine.ValueParcel(parcelId, year)` data-loading** — wire the engine to load canonical
   inputs (`TfImprovement`/`TfLand`/`TfSale`) from `TerraFusionDbContext` and select reference sets by
   county/year. The deterministic core + governance are done; this is the assembly adapter.
3. **V9 full** — persist `ValuationResult`+explanation to a queryable store (retrievable by parcel+year),
   written through the Forge write-lane.
4. **CostForge project wiring** — expose the calculators via `IValuationApproach`/`IValuationEngine` in
   `TerraFusion.CostForge` and **demote `ICostForgeAI`/`UltimateCostForgeAI` to advisory-only** (keep,
   don't delete; never authoritative). Behind `Forge:Engine` = Shadow by default.

## Gate status
G1 (WS-1 cutover) is **not** cleared — it requires the parity runs above at agreed tolerances. The
engine that those gates measure is built, deterministic, explainable, audited, and vendor-free.
