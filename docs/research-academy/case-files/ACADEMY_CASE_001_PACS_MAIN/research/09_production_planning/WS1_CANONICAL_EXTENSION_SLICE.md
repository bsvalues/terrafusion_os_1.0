# WS-1 Canonical-Extension Slice — Minimum Inputs for Faithful Valuation Assembly

**Case:** ACADEMY_CASE_001_PACS_MAIN · **Slice:** #2 unblocker (post WS-1 shadow) · 2026-06-12
**Goal:** provide the minimum missing canonical inputs so the (already-built, green) deterministic
engine can be driven from real parcels — **without** opening parity gates, inventing Assessor
tolerances, or flipping `Forge:Engine` to authoritative.

---

## Verified ground truth (what exists vs. what's missing)

| Need | Reality | Verdict |
|---|---|---|
| Improvement **area/size** (cost approach) | `TfImprovementFeature.Area` (decimal?) + `NumUnits` exist; per-component rows link to `TfImprovement` | **No schema gap** — derive size by aggregating feature `Area`. (Earlier "TfImprovement has no area" was true at the *improvement* level; area lives at the *feature* level.) |
| **Neighborhood** (land approach) | `TfParcel` has ParcelNumber/SitusAddress/PropertyType but **no neighborhood**; only legacy `Property.Neighborhood` carries it | **Real canonical addition** — add `TfParcel.Neighborhood`, projected from source |
| **Current-use/ag** flag (WA land) | `TfLand.LandSegUseCd`, `LandSegStateCd`, `IsHomesite`, `LandSegAgValue` exist | No gap — map from existing fields |
| **Sale qualification** (sales ratio) | `TfSale.SaleQualified` / `DorRatioQualified` / price / `SlDt` exist | No gap — map directly |
| **Property type** (reconciliation) | `TfParcel.PropertyType` exists | No gap |

**Net:** exactly **one** persisted canonical addition (`TfParcel.Neighborhood`); everything else is
read-side assembly over existing fields.

---

## Scope (in)

1. **Canonical addition (Sync-owned lane):**
   - Add nullable `string? Neighborhood` to `TfParcel` (canonical_tf.tf_parcel).
   - Project it in the C-series parcel projector from the source neighborhood (PACS / `Property.Neighborhood`),
     resolved through `source_xref` lineage like every other canonical field. Nullable for back-compat
     with rows projected before this slice; never required at read time.
   - EF migration: additive nullable column (reversible).

2. **Forge assembly mapper (Forge-lane, read-only over canonical):**
   - `ParcelValuationAssembler.Assemble(parcel, improvements+features, lands, sales, costSet, depSchedule, landSchedule, capRateSet, year)`
     → `ParcelValuationInput` (the `ApproachValue` list the engine already consumes):
     - **Cost:** improvement size = Σ `TfImprovementFeature.Area` for the improvement; class = `ImprvClassCd`;
       effective age = `year − EffectiveYearBuilt`; run `CostApproachCalculator`.
     - **Land:** neighborhood = `TfParcel.Neighborhood`; size = `TfLand.SizeSquareFeet`; current-use =
       `IsHomesite==false && LandSegUseCd` ∈ ag/current-use set; run `LandApproachCalculator`.
     - **Income:** only for income `PropertyType`; needs NOI input (out of scope here — flagged below).
     - **Sales:** map `TfSale` → `RatioSale` (qualification + `SlDt`/`SlPrice`); feed calibration, not per-parcel value.
   - Reference sets selected by **(CountyId, year)** via the existing catalogs.
   - Produce `ParcelValuationInput` → `ValuationEngine.Value(...)` → persist `ParcelValuation` (already audit-stamped).

3. **Invariants preserved (non-negotiable):**
   - **County isolation** — every canonical read is `CountyId`-scoped; `ForgeCountyGuard.EnsureSameCounty`
     on parcel vs. each reference set.
   - **Write-lane** — the assembler READS canonical and WRITES only `ParcelValuation` (Forge store);
     it never writes canonical entities and never touches supplement/notice/appeal (`ForgeWriteLane`).
   - **WS-3 audit inheritance** — `ParcelValuation` writes stay audit-stamped; no second audit path.
   - **Shadow only** — `Forge:Engine` stays Shadow; no authoritative value is written to `TfAssessment`.

## Scope (out — do NOT do in this slice)

- Do **not** open parity gates (RP-1/2/3/5/6) or invent Assessor tolerances.
- Do **not** set `Forge:Engine = Native/Authoritative`; no write to `TfAssessment` value columns.
- Do **not** put neighborhood on `TfLand` or any non-parcel entity.
- Do **not** modify the AI swarm / Consciousness; do **not** delete AI assist (stays advisory).
- **Income NOI source** is unresolved (no canonical NOI/rent-roll today) → income approach stays
  input-driven/optional; defining a canonical income input is a *separate* follow-on, not this slice.

---

## Cross-lane flag (decision needed before build)

This slice modifies a **Sync/CanonicalTf-owned** entity (`TfParcel`) and its **projector** — outside
the Forge write-lane. Per guardrails ("preserve write-lanes; do not touch terra-fusion-sync ownership
lightly"), the `TfParcel.Neighborhood` addition + projector change should be **confirmed with the Sync
lane owner** (or executed deliberately within it) before building. The Forge-side assembler is
unambiguously in-lane and can proceed independently against the (post-addition) canonical shape.

## Test plan (InMemory; no real PACS)

- A1 cost size aggregates `TfImprovementFeature.Area` across features of one improvement.
- A2 land reads `TfParcel.Neighborhood`; current-use mapped from `LandSegUseCd`/`IsHomesite`.
- A3 sales qualification maps from `TfSale` flags; disqualified excluded.
- A4 reference sets selected by (county, year); cross-county rejected (`ForgeCountyGuard`).
- A5 end-to-end: assembled parcel → `ValuationResult` → persisted `ParcelValuation` (audit-stamped),
  retrievable by parcel+year; value written nowhere else (write-lane intact).
- A6 missing inputs (no factor/neighborhood) → explicit `Found=false`, no silent value.

## Definition of done (this slice)
`TfParcel.Neighborhood` added + projected (Sync-lane, migration) · `ParcelValuationAssembler` green
(A1–A6) · engine runnable end-to-end in **shadow** on real canonical shape · county/write-lane/audit
invariants intact · parity + authoritative swap still closed. Then: Assessor tolerance decision → PACS
shadow/parity run → G1 decision.
