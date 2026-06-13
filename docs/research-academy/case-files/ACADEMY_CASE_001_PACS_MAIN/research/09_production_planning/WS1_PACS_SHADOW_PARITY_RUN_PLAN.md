# WS-1 PACS Shadow / Parity Run — Preparation Plan (step 3)

**Case:** ACADEMY_CASE_001_PACS_MAIN · 2026-06-12 · **Engine:** `Forge:Engine = Shadow` (no authoritative swap)
**Invariant:** parity is a GATE, not a source. PACS is the comparison baseline; the TF value is never
replaced by it (`ParityComparer` is read-only). Run produces evidence only.

This plan readies steps 4–5. It does **not** open gates, invent tolerances, or run against data —
it fixes the methodology so the run is push-button once (1) `TfParcel.Neighborhood` lands and (2) the
Assessor sets tolerances.

---

## 1. Sample selection methodology (pick the shadow set)
Deterministic, stratified — no cherry-picking:
- **Strata:** by property class (residential, commercial/income, vacant land) × supplement status
  (non-supplemented vs supplemented — supplemented stratum feeds **RP-5**).
- **Size:** N per stratum agreed with the Assessor (default proposal: ≥ 100 residential, ≥ 30 each
  commercial/vacant, ≥ 30 supplemented) — final N is a county sign-off.
- **Selection:** deterministic (ordered by parcel id, fixed stride/seed recorded in evidence) so the
  sample is reproducible. Record the exact parcel-id list with the run.
- **County scope:** single county per run (sovereign isolation); Benton first.

## 2. Comparison method per RP (TF source → PACS baseline → ParityComparer)
Baseline source is the **internal** TruthPacs clone + SourceXref (the PACS-faithful layer already in
the model) — not live legacy PACS. Confirmed present 2026-06-13.

| RP | TF value (shadow) | Baseline (internal TruthPacs / Sync) | Tolerance |
|----|---|---|---|
| RP-1 Cost | `CostApproachCalculator` RCNLD (improvement portion) | `TruthPacsImprvCurrent.ImprvVal` | per-class (§3) |
| RP-2 Land | `LandApproachCalculator` land value | `TruthPacsLandCurrent.LandSegMarketVal`/`LandSegAgValue` | per-class (§3) |
| RP-3 Reconciled | `ValuationEngine` `IndicatedValue` (`ParcelValuation`) | `TruthPacsAssessmentCurrent` (+ `TruthPacsWashPropOwnerVal`) | per-class (§3) |
| RP-5 Supplement round-trip | active-supplement TF value via `SourceXref` lineage | `SourceXref.SourceKeyJson` `{prop_id,prop_val_yr,sup_num}` | exact lineage (no history loss) — §6 |
| RP-6 Income | `IncomeApproachCalculator` value | **external** county income study | per-class (§3) |
| RP-4 Ratio study (informational) | `SalesRatioCalculator` median/COD/PRD + `CalibrationGate` | `TruthPacsSale` / county published study | informational |

Each per-parcel comparison runs through `ParityComparer.Compare(tfValue, pacsValue, tolerance)` →
delta, delta-fraction, within/outside flag. No TF value is mutated.

## 3. Assessor tolerance INTAKE (to be filled by the Assessor — not invented)
G1 cannot honestly close until these are set. Capture verbatim from the county:
| RP | Property class | Tolerance (± %) | Min sample pass rate | Source/sign-off |
|----|---|---|---|---|
| RP-1 | residential | **TBD** | **TBD** | |
| RP-1 | commercial | **TBD** | **TBD** | |
| RP-2 | (per class) | **TBD** | **TBD** | |
| RP-3 | (per class) | **TBD** | **TBD** | |
| RP-6 | income | **TBD** | **TBD** | |
> Tolerances + pass rates are a county decision (e.g. residential ±X%, complex commercial wider).
> A parcel outside tolerance is a review item, not an auto-fail; G1 requires the sample to pass at
> the agreed rate.

## 4. Evidence capture schema
Per-parcel row: `{ runId, county, parcelId, rp, propertyClass, tfValue, pacsValue, delta, deltaFraction,
withinTolerance, toleranceUsed, engineVersion, referenceSetVersions, sampleSeed, timestamp }`.
Per-RP summary: `{ rp, n, withinCount, passRate, agreedRate, gatePass }`. Store under the case-file
evidence path; record command + environment + sample id list (reproducibility).

## 5. Run procedure (step 4, when unblocked)
1. Confirm `Forge:Engine = Shadow`; assert no write to `TfAssessment` value columns.
2. Select sample (§1); assemble each parcel (`ParcelValuationAssembler`); value via engine (shadow);
   persist `ParcelValuation` (audit-stamped).
3. For each parcel + RP, pull the PACS baseline (read-only) and run `ParityComparer` with the §3 tolerance.
4. Emit the §4 evidence; compute per-RP pass rates.
5. Run `CalibrationGate` on the qualified-sales study (RP-4 informational).

## 6. RP-5 supplement round-trip (the confirmed gate)
For each supplemented parcel: resolve the **active-supplement** TF value through `SourceXref`
`(prop_id, year, sup_num)` lineage; confirm it equals the PACS active-supplement `property_val` and
that prior supplement history is intact (no RK-3 loss). This is exact-match lineage, not a tolerance.

## 7. G1 evaluation rule (step 5)
- All gating RPs (RP-1/2/3/5/6) pass at the agreed per-class rate **and** RP-5 lineage is exact → G1
  **candidate**; discuss authoritative cutover (class-by-class, shadow→limited enablement).
- Any gating RP fails → **narrow correction slice only** (do not broaden); re-run the affected stratum.

---

## Blocked-on (external/Sync — not Forge)
1. `TfParcel.Neighborhood` landed (→ `SYNC_HANDOFF_TfParcel_Neighborhood.md`) — RP-2/RP-3 land path.
2. Assessor tolerances + pass rates (§3) — G1 honesty.
3. Baseline confirmation: approve TruthPacs clone + `SourceXref` as the comparison source (internal —
   present in the model, not live legacy PACS) + agree the sample scope; supply the external RP-6 income study.
When 1–3 are in hand, §5 is a single reproducible run; no further Forge code is required to start it.
