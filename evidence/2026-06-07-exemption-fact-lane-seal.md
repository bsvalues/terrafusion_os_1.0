# Exemption Fact Lane — SEAL (2026-06-07)

## Outcome
**Exemption Fact lane sealed for current-year 2025 active exemptions.** This covers current
operational exemption facts affecting taxable-value context. Full exemption history and
downstream DOR/tax-billing derivations remain out of scope.

```
truth_pacs.exemption_current   = 6,487 / 6,487 distinct = 1.0000x
canonical_tf.tf_exemption      = 5,643 / 5,643 distinct = 1.0000x  (spine-resolved)
dict_exemption_type            = 6 types populated from PACS exmpt_type
drain status                   = Succeeded, 9/9 gates PASS, 0 quarantine delta
```

## Scope (approved)
- Current-year only: **2025**. Source: `property_exemption`.
- Active rule: **MAX(sup_num) per (prop_id, exmpt_tax_yr)** — not sup=0.
- Canonical grain: **parcel + owner + tax year + exemption type**.
- Dictionary populated: `canonical_tf.dict_exemption_type` from PACS `exmpt_type`.
- Deferred: full 1994–2026 exemption history; DOR/tax-billing derivations.

## Required gates (co-founder) — results
```
 1 source active denominator   : 2025 active-supp rows = 6,487 (from 6,530 raw; 43 stale-supp filtered)
 2 truth count                 : truth_pacs.exemption_current = 6,487 @ 1.0000x  ✓
 3 canonical count             : canonical_tf.tf_exemption = 5,643 @ 1.0000x (spine-resolved)  ✓
 4 supplement preservation     : 126 non-zero active-supp facts preserved  ✓ (exact anchor)
 5 parcel resolution           : 5,643 resolved; 844 unresolved (parcels outside real-property spine) counted + gated  ✓
 6 owner link                  : SourceOwnerId retained on every canonical row  ✓
 7 type dictionary             : dict_exemption_type populated (6); canonical unbacked type codes = 0  ✓
 8 year doctrine               : TaxYr = exmpt_tax_yr; owner_tax_yr / effective_tax_yr retained as context  ✓
 9 value-impact sanity         : exemption_pct populated = 4,268; no fabricated exemption amounts  ✓
10 quarantine delta            : 0  ✓
```

### Canonical type distribution
```
EX 3,001 · SNR/DSBL 2,530 · DOR 75 · U500 37   (HOF + remainder fall in the 844 spine-unresolved)
```

### Unresolved note
6,487 truth − 5,643 canonical = **844** exemption facts whose parcel is outside the sealed
`tf_parcel` real-property spine (mobile-home / personal-property exemptions, head-of-family on
non-spine parcels). Counted and gated, not hidden — consistent with the parcel/assessment seals.

## Doctrine reinforced (third hard domain)
The active-supplement lesson held again: **126** of 6,486 2025 parcel-years carry a non-zero
active supplement; sup=0 would have landed stale exemption facts. Exemptions proven to be
**parcel-owner-year-type facts**, not owner-year or account-year benefit records.

## What was built
`legacy_pacs_raw.property_exemption` (landing) + `SqlServerPacsExemptionSource`
(active-supp grouped scan) + `PacsExemptionLandingService` (COPY) +
`truth_pacs.exemption_current` + `PacsExemptionCurrentTruthPromoter` (idempotent by
parcel-year) + `canonical_tf.tf_exemption` + `PacsExemptionCanonicalProjector` (parcel via
source_xref, owner-link, dict-backing gate) + `PacsExemptionDictPopulator`
(exmpt_type → dict_exemption_type) + `DrainExemption` + `exemption` lane + DI + EF migration
`20260607184906_AddExemptionFactLane`.

## Sealed-lane integrity (unchanged)
```
improvement 99,694 · land 87,767 · sale 29,608 · geometry 80,075 · owner 816,849 · assessment 95,455
```

## Classification
**SEALED — current-year (2025) active-supplement exemption facts, 1.0000× at truth.**
Benton Valuation Spine now includes exemptions. Remaining valuation-adjacent: full exemption
history (follow-on). Jurisdiction Spine (tax area/district) + Revenue Spine remain separate.

---

*Evidence collected 2026-06-07 against live Harris PACS. Migration `20260607184906_AddExemptionFactLane`.*
