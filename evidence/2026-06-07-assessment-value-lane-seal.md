# Assessment Value Lane — SEAL (2026-06-07)

## Outcome
**First Assessment Value Seal: current-year (2025) active-supplement assessed value, SEALED.**
`truth_pacs.assessment_current` = **95,455 rows / 95,455 distinct (PropId, AssessmentYear) = 1.0000× dup**.
`canonical_tf.tf_assessment` = **83,326 rows / 83,326 distinct (TfParcelId, AssessmentYear) = 1.0000× dup**.
Drain status **Succeeded**, 9/9 gates PASS, 0 failures, 0 quarantine delta.

This is a NEW lane (the audit found `property_val` landed only for classification, never as
assessment truth). It gives County Studio / TerraForge the current operational valuation truth
they need.

---

## Scope (locked: current-year active-supp narrow)
- `tax_yr` = **2025** (current operational assessment year; 2026 is in-progress with 0 supplements).
- **One live assessment row per parcel-year at the ACTIVE supplement = MAX(sup_num)**, NOT sup=0.
- Denominator: **95,455** distinct 2025 parcel-years.
- Full 1968–2026 history deliberately deferred to a follow-on "Assessment Value History" lane.

## Doctrine applied (the Owner sup_num lesson, now standing doctrine)
`property_val` is per-(year, supplement). The current assessed value for a parcel-year is the row
at the ACTIVE supplement, not `sup_num=0`. Of 95,455 2025 parcel-years, **1,041 carry a non-zero
active supplement** — taking sup=0 would land a stale assessed value for those. The source resolves
`MAX(sup_num)` per (prop_id, prop_val_yr) via one grouped scan + inner join.

> Pre-build "landed volume ≠ usable truth" check: the existing `legacy_pacs_raw.property_val`
> landing carried only classification (`property_use_cd`), 406K rows, 2026 only — none of the
> assessment values. The seal therefore landed the value columns fresh at the active supplement.

---

## Proof (live Harris PACS, runtime)
```
Assessment-S1  landing  : rows=95,455  dup=0
Assessment-Truth        : considered=95,455  promoted=95,455  prior=0
Assessment-Canonical    : considered=95,455  projected=83,326  unresolved=12,129
truth dup               : 95,455 / 95,455 = 1.0000x
canonical dup           : 83,326 / 83,326 = 1.0000x  (by TfParcelId, AssessmentYear)
non-zero active supp     : 1,041  (doctrine preserved)
assessed_val populated  : 95,455 / 95,455 (100%)
gates                   : 9 PASS, 0 FAIL
```

### Canonical coverage note
The 12,129 truth rows not projected to canonical are parcels whose `prop_id` has no `tf_parcel`
xref — i.e. parcels outside the sealed real-property spine (the spine promoted 83,326; mobile
homes / personal property / etc. are excluded by spine doctrine). This is consistent with the
parcel seal, not a data loss: the TRUTH layer holds all 95,455 at 1.0000×; the canonical layer
holds the spine-resolved subset.

---

## What was built
- Landing entity `legacy_pacs_raw.property_val` extended with 13 nullable assessment-value columns
  (classification landing leaves them NULL; the active-supplement assessment landing populates them).
- `SqlServerPacsAssessmentValueSource` — active-supplement current-year value query.
- `PacsAssessmentValueLandingService` — Npgsql binary COPY landing.
- `truth_pacs.assessment_current` (`TruthPacsAssessmentCurrent`) + `PacsAssessmentCurrentTruthPromoter`
  (idempotent clear-then-COPY by natural key (PropId, AssessmentYear)).
- `canonical_tf.tf_assessment` (`TfAssessment`) + `PacsAssessmentCanonicalProjector`
  (parcel resolved via existing `source_xref`; no parcel re-drain).
- `DrainAssessment` controller + `assessment` lane in `LaneStageOrder` + DI + EF migration
  `20260607173333_AddAssessmentValueLane`.

Values carried: assessed_val, appraised_val, market, land_hstd / land_non_hstd, imprv_hstd /
imprv_non_hstd, ag_use / ag_market, timber_use / timber_market, hscap_new / hscap_prev,
property_use_cd, + lineage.

---

## Sealed-lane integrity (unchanged)
```
improvement 99,694 · land 87,767 · sale 29,608 · geometry 80,075 · owner truth 816,849
```

## Classification
**SEALED — current-year (2025) active-supplement assessed value, 1.0000× at truth.**
The Benton Valuation Spine now includes current assessment value. Full assessment history
(1968–2026) is the next follow-on lane. Exemptions and tax-area/district remain (per the
domain coverage audit).

---

*Evidence collected 2026-06-07 against live Harris PACS. Migration `20260607173333_AddAssessmentValueLane`.*
