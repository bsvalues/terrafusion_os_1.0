# Benton Revenue Spine — Stage 2A Doctrine Discovery: 'A' Assessment Bills

_Date: 2026-06-07 · Read-only investigation against live Harris PACS (`pacs_oltp`). No tables built,
no schema mutated, no drain run. Identify the animal in the second drawer — do not forklift it yet._

---

## Summary verdict

**'A' bills are special-assessment (non-ad-valorem) bills levied by special-assessment AGENCIES**
(weed, mosquito, conservation, horticultural pest, irrigation, diking). They share the `bill`
table and amount semantics with 'L' bills, but their jurisdiction/backing dimension is the
**special-assessment agency**, not a tax district + levy rate. They carry **no rate, no
tax_district_id, no levy_cd, no fund_id** — they are flat/calculated fees.

**Boundary recommendation: SEPARATE assessment-bill canonical lane** (not folded into
`tf_tax_bill_line`). They extend the *bill* model but on a different backing axis; merging them
would force NULL district/rate columns and break the L lane's 100% district-/rate-backing gates.

---

## The 12 proof questions

**1. What does `bill_type='A'` mean in Benton PACS?**
Special assessment (non-ad-valorem) bills. 2025 active A bills = **313,139** (vs 1,104,507 L).
Every one resolves to a special-assessment agency.

**2. What is the source bridge table (if not `levy_bill`)?**
`dbo.assessment_bill (year, agency_id, bill_id)` — the A-bill analogue of `levy_bill`. **1:1** with
the bill set: 313,139 active A bills ⋈ assessment_bill = 313,139. The agency definition lives in
`dbo.special_assessment_agency (agency_id, assessment_cd, assessment_type_cd, assessment_description,
resolution_num, …)` and the fee policy in `dbo.special_assessment (year, agency_id, fee_type_cd,
assessment_fee_amt, flat_fee, additional_fee_amt, recalculate_during_supplement, status_cd, …)`.

**3. What is the grain?**
One bill per **(prop_id, agency_id, year)** at the active supplement. A parcel carries multiple A
bills — one per agency it falls under. 313,139 bills over **79,078 distinct parcels** ⇒ ~4 agency
assessments per parcel on average.

**4. Does each A bill attach to parcel, account, assessment district, fee, or another entity?**
To a **parcel** (`bill.prop_id`, 0 NULL) AND to a **special-assessment agency** (via
`assessment_bill.agency_id`). The agency is the "jurisdiction"; the parcel is the subject. Also
carries `owner_id` and `sup_num` like L bills.

**5. Does it use `tax_area_id` / `tax_district_id` / `levy_cd` / `fund_id`, or a separate assessment code?**
**Separate code.** A bills do **not** use tax_district_id / levy_cd / fund_id at all. The
identifying code is `special_assessment_agency.assessment_cd` (e.g. `WEDBEN`, `MOSBEN`, `IRRCOL`).
This is the decisive structural difference from L bills.

**6. What amount fields are authoritative?**
The same `bill` columns as L: `initial_amount_due`, `current_amount_due`, `amount_paid`. (The fee
*policy* — `assessment_fee_amt` / `flat_fee` — lives in `special_assessment`, but the billed truth
is `bill.current_amount_due`, exactly as for L.)

**7. Does `amount_paid` mean the same thing as for L bills?**
Yes — PACS-recorded paid amount. Near-zero now (2025 not yet collected): e.g. MOSBEN due
$2,654,938.66 / paid $63.07; IRRCOL due $3,609,270.49 / paid $342.32 — same "current-year unpaid"
pattern proven in Stage 1.

**8. Cancellation / rebill / version / supplement rules?**
Active-supplement applies (1,667 of 313,139 at `sup_num > 0`). `rollback_id` populated on **0** of
the 2025 active set. `special_assessment.recalculate_during_supplement` governs supplement recalc.
Same `is_active=1` current-state filter as L.

**9. Can A bills be safely added to `tf_tax_bill_line`, or do they need a separate canonical table?**
**Separate table.** Structurally they fit the bill shape (prop_id, amounts, sup_num, 1:1 bridge),
but `tf_tax_bill_line` is a *levy* read model with non-null `TaxDistrictId` / `LevyCd` / `LevyRate`
and **100% district-/rate-backing gates**. A bills have none of those. Folding them in would inject
NULLs and falsify the L lane's gates. A dedicated `tf_assessment_bill_line` (agency-backed,
rate-free) keeps both models honest.

**10. How many A bills resolve to the real-property spine?**
**All of them.** 313,139 / 313,139 are on `prop_type_cd='R'` parcels (0 non-real, 0 null). 79,078
distinct parcels — essentially the same real-property spine as the L lane (79,767 parcels). Cleaner
than L, which had 113,842 off-spine MH/personal-property bills. Final canonical resolution via
`source_xref` to be proven at drain time, but there is **zero** non-real contamination to exclude.

**11. Current-year native, or conversion-affected?**
**Current-year native.** `cnv_xref` is NULL on **0** of the 313,139 — i.e. none are conversion
artifacts. Unlike the assessment/property history lanes, A bills are not entangled with the 2018
ProVal/Ascend conversion sentinels.

**12. What County Studio claim would be safe?**
> Per PACS, this parcel has N active 2025 special-assessment bills from these agencies
> (e.g. Noxious Weed, Mosquito, Conservation District, Columbia Irrigation), with PACS-recorded
> due / paid / balance amounts.

NOT safe: any claim about fee correctness, distribution to agencies, delinquency, or collection
status beyond the PACS-recorded paid amount.

---

## Agency profile (2025 active A bills)

| agency_cd | description | bills | due | paid |
|---|---|---|---:|---:|
| WEDBEN | Noxious Weed Control Board | 78,274 | 394,975.50 | 10.88 |
| BCD | Benton Conservation District | 77,067 | 394,685.90 | 9.83 |
| HORT | Horticultural Pest & Disease Control | 75,381 | 113,071.50 | 3.25 |
| MOSBEN | Mosquito | 71,241 | 2,654,938.66 | 63.07 |
| IRRCOL | Columbia Irrigation | 7,953 | 3,609,270.49 | 342.32 |
| IRRBEN | Benton Irrigation | 1,990 | 1,312,737.80 | 0.00 |
| WED001 | Weed District #1 | 649 | 18,698.61 | 0.00 |
| IRRKIO | Kiona Irrigation | 526 | 338,516.39 | 0.00 |
| DIK001 | Diking | 58 | 4,181.12 | 0.00 |

9 agencies; the four county-wide programs (weed / conservation / horticultural / mosquito) account
for ~302k of the 313k bills; irrigation/diking are parcel-subset programs.

---

## Proposed Stage 2A boundary (decision gate)

| Option | Verdict |
|---|---|
| Fold A into the existing `tf_tax_bill_line` (L) read model | ❌ **Reject** — breaks district/rate backing gates with NULLs; conflates levy ad-valorem with agency fees. |
| **Separate assessment-bill lane** | ✅ **Recommend** — own canonical model, own backing dimension (agency), own gates. |
| Defer entirely | Not necessary — semantics are clear and clean (1:1 bridge, 100% real-property, current-year native). |

**Recommended Stage 2B build scope (when approved):**
- `legacy_pacs_raw.assessment_bill_line` (landing: `bill ⋈ assessment_bill`, year=2025/active/type='A').
- `canonical_tf.tf_assessment_agency` (dict: agency_id, assessment_cd, assessment_type_cd, description).
- `canonical_tf.tf_assessment_bill_line` (parcel-resolved: prop_id→tf_parcel, agency_id, amounts,
  balance = due − paid, sup_num; **no** district/levy/rate columns).
- `canonical_tf.tf_assessment_bill_current` (per-parcel rollup: bill count, agency count, totals).
- Reuse Stage 1's Npgsql COPY landing + parcel-resolved COPY projection + set-based rollup pattern.
- Gates: landed=313,139; bridge 1:1; parcel-resolution honesty; **agency-backing 100%** (replaces
  district/rate backing); amount integrity line↔rollup; rollup integrity; boundary (no levy/fund);
  quarantine 0.

Still deferred beyond 2A/2B: payment-transaction reconciliation, fund/distribution, delinquency,
history. This stage remains **read-only PACS-recorded truth**, not a collections/disbursement system.

---

*Discovery only. Nothing built, nothing migrated, nothing drained. Next action requires explicit go.*
