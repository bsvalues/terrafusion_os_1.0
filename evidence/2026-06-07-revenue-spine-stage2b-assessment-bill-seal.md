# Revenue Spine Stage 2B — Current-Year Special-Assessment Bill Seal

_Sealed 2026-06-07. Benton County PACS (`pacs_oltp`) → TerraFusion (`terrafusion`)._

## Mission scope (approved)

Stage 2A discovery recommended a **separate** assessment-bill lane (not folding A bills into the L
`tf_tax_bill_line` read model). Approved and built here. Scope: current-year (2025) active
**special-assessment** ('A') bills as PACS records them — agency-backed, rate-free, read-only.

This is the non-ad-valorem counterpart to the Stage 1 levy lane. It explains, per parcel, which
special-assessment agencies (weed, mosquito, conservation, irrigation, diking) bill the parcel, with
PACS-recorded due / paid / balance. It is **not** a collections/disbursement system: amounts are
verbatim from PACS; balance is the recorded arithmetic `due − paid`.

## Grain & doctrine

- **Universe:** `dbo.bill` where `year = 2025 AND is_active = 1 AND bill_type = 'A'`. 1:1 with
  `dbo.assessment_bill (year, agency_id, bill_id)`.
- **Backing dimension is the special-assessment AGENCY** (`special_assessment_agency`), not a tax
  district / levy_cd / levy_rate / fund. A bills are flat/calculated agency fees, not ad-valorem.
- **Active-supplement doctrine** carried forward (`is_active = 1`); 1,667 of 313,139 at `sup_num > 0`.
- **Boundary held:** `tf_assessment_bill_line` carries **no** `tax_district_id`, `levy_cd`,
  `levy_rate`, `fund_id`, or `taxable_val` columns — keeping the L lane's gates pure and the
  assessment lane honest about what it is.

## Pipeline

```
dbo.special_assessment_agency → canonical_tf.tf_assessment_agency        (dict)
dbo.bill ⋈ dbo.assessment_bill (2025/active/A)
   → legacy_pacs_raw.assessment_bill_line     (Npgsql binary COPY landing)
   → canonical_tf.tf_assessment_bill_line     (parcel-resolved COPY projection;
                                               agency-backed; balance = due − paid)
   → canonical_tf.tf_assessment_bill_current  (set-based per-parcel rollup)
```

Parcel resolution via `sync_bridge.source_xref` (prop_id → tf_parcel), identical to all prior lanes.

## Runtime proof (drain batch `a66ea923-36d2-4618-8650-bd205b30746e`, 356.1s)

Drain response: `status=Succeeded`, `rowsLanded=313,139`, `rowsCanonicalized=313,139`,
`rowsQuarantinedThisLane=0`, `gateSummary: PASS×3`.

| # | Gate | Result | Verdict |
|---|------|--------|---------|
| G1 | Landed A-bill denominator | `legacy_pacs_raw.assessment_bill_line` = **313,139** | ✅ = 2025 active A-bill count |
| G2 | Agency dictionary | `tf_assessment_agency` = **29** (full superset; 9 carry 2025 bills) | ✅ |
| G3 | Bill-line projected (parcel-resolved) | `tf_assessment_bill_line` = **313,139**; distinct parcels = **79,078** | ✅ matches Stage-2A discovery exactly |
| G4 | Parcel-resolution coverage | unresolved = 313,139 − 313,139 = **0** | ✅ 100% on the real-property spine (cleaner than L) |
| G5 | Agency backing | `AssessmentCd IS NULL` = **0**; agency-backed = **313,139** | ✅ 100% |
| G6 | Rollup integrity | `tf_assessment_bill_current` = **79,078** = distinct parcels; `SUM(BillCount)` = **313,139** = line count | ✅ every line rolled up exactly once |
| G7 | Amount integrity (line ↔ rollup, exact) | due **8,841,075.97** = **8,841,075.97**; paid **429.35** = **429.35**; balance **8,840,646.62** = **8,840,646.62** | ✅ exact |
| G7b | Balance identity | due − paid = 8,841,075.97 − 429.35 = **8,840,646.62** = recorded balance | ✅ |
| G7c | Agency cross-check | line due total = sum of Stage-2A per-agency due profile ($8,841,075.97) | ✅ reconciles |
| G8 | Quarantine | `quarantineDelta = 0` (394,361 → 394,361) | ✅ none |
| BND | Boundary | no `tax_district_id` / `levy_cd` / `levy_rate` / `fund_id` / `taxable_val` columns | ✅ held |

(Low `paid` total — $429.35 — is correct: 2025 special assessments are largely uncollected at drain
time; PACS-recorded verbatim, not reconciled against payment transactions.)

## Agency distribution (2025, from canonical)

The 9 billing agencies, in Stage-2A profile order: Noxious Weed (78,274), Benton Conservation
(77,067), Horticultural Pest (75,381), Mosquito (71,241), Columbia Irrigation (7,953), Benton
Irrigation (1,990), Weed District #1 (649), Kiona Irrigation (526), Diking (58). The four county-wide
programs account for ~302k of 313k bills; irrigation/diking are parcel-subset programs.

## What this seals / does NOT seal

- **Sealed:** current-year (2025) special-assessment bill state per parcel, as PACS records it —
  which agencies bill the parcel, due / paid / balance. Read-only explanation model, separate from
  the levy lane.
- **Not sealed (deferred):** payment-transaction reconciliation (Stage 2C/3), fund / distribution to
  agencies, delinquency, prior-year / history, fee-recomputation from `special_assessment` policy.

## Key facts

- Migration `20260608053127_AddRevenueSpineStage2BAssessmentBill` (Up = 4 CreateTable:
  `assessment_bill_line`, `tf_assessment_agency`, `tf_assessment_bill_line`,
  `tf_assessment_bill_current`; Down = 4 DropTable — no unrelated drops).
- Same Npgsql binary COPY landing + parcel-resolved COPY projection + set-based rollup pattern as
  Stage 1; PACS numerics read type-flexibly (`Convert.To*`).
- Agency dict deduped by `agency_id` (unique CountyId+AgencyId).
