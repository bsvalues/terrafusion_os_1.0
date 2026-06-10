# Benton Revenue Spine — Stage 0 Doctrine Discovery (read-only)

_Date: 2026-06-07 · Mission 2 · Read-only against live Harris PACS. No tables built, no schema
mutation, no drains. This is a discovery + proposed-boundary deliverable only._

---

## Proof-question answers (live PACS, 2025)

| # | Question | Finding |
|---|---|---|
| 1 | Current operational year | **`year` = 2025** on `bill` / `levy_bill` / `levy` (tax year). `bill.display_year` mirrors it. |
| 2 | Bill grain | **`bill_id`, one bill per (prop_id, year, levy-or-assessment)** — NOT per parcel-year. 2025: 1,417,646 bills over 88,999 parcels. `bill_type='L'` (levy/property-tax) = 1,104,507; `bill_type='A'` (assessment/fee) = 313,139. Bill header carries `current_amount_due`, `amount_paid`, `payment_status_type_cd`, `is_active`, `sup_num`, `rollback_id` (rebill lineage), `cnv_xref`. |
| 3 | Levy-bill grain | **`bill_id × levy` — 1:1 with `L` bills** (levy_bill 2025 = 1,104,507 = the L count). Each `levy_bill` carries `bill_id, levy_cd, year, tax_district_id, tax_area_id, taxable_val`. This is the bill→district/levy bridge. |
| 4 | Rate source | **`levy.levy_rate`** per (year, tax_district_id, levy_cd). 2025: 49 levy rows, 27 districts, 48 with a rate. Small, clean. |
| 5 | Payment grain | **`payment_id` = receipt-level.** Links to bills via `payment_transaction_assoc` (not a direct bill_id on payment). `void`, `void_date`, `void_reason`, `orig_payment_id` = reversal lineage. **Note:** `bill.amount_paid` is PACS's own maintained paid total per bill — so bill-level paid/balance is available WITHOUT walking payment transactions. |
| 6 | Active/current rule | **`is_active = 1`** (all 1,417,646 2025 bills are is_active=1 — multiplicity is real per-levy, not versioning). `sup_num` present (13,606 nonzero) + `rollback_id` for rebills. Active = is_active=1; supplement doctrine applies for versioned rebills. |
| 7 | Linkage to sealed Jurisdiction Spine | **Clean.** levy_bill 2025 references 26 distinct `tax_district_id` (⊆ sealed `tf_tax_district` = 37) and 55 `tax_area_id` (⊆ sealed `tf_tax_area` = 109). Revenue bills attach directly to the sealed jurisdiction dicts. |
| 8 | 2018 conversion artifacts | 2025 bills have **`cnv_xref` = 0** (native, no conversion). Conversion artifacts live only in historical years — irrelevant to a current-year MVP; relevant when history opens. |
| 9 | County Studio safe claims | Current-year **billed / paid / balance per PACS** (from bill header) + **levy/district breakdown** (from levy_bill) + **rate** (from levy). Read-only explanatory context. NOT a recomputed balance from raw payments (until void/reversal proven), NOT delinquency action, NOT treasurer operations. |
| 10 | Parcel/account/owner linkage | `bill.prop_id` (→ parcel spine), `bill.owner_id` (→ owner). Parcel-resolved via existing `source_xref`, same as every sealed lane. |
| 11 | Void/reversal/refund | `payment.voided/orig_payment_id`; `refund` table (separate). Deferred — bill header `amount_paid` already nets PACS's view. |
| 12 | Smallest safe current-year Revenue MVP | **Current-Year Tax Bill Explanation** (below). |

---

## The reframe that makes this safe

A PACS "bill" is **per-levy**, not per-parcel. A parcel's property tax = the SET of its `L` bills
(one per levy/district), each a `bill` header + one `levy_bill` line. The bill header already
carries `current_amount_due` and `amount_paid` (PACS-maintained). **So we can explain a parcel's
tax — billed, paid, balance, and the levy/district breakdown — entirely from `bill` + `levy_bill`,
without touching payment-transaction detail or recomputing balances.** That is the clean,
read-only MVP boundary.

---

## Proposed Current-Year Revenue MVP

### First lane (Stage 1): Current-Year Tax Bill Explanation
Canonical entities (justified):
```
canonical_tf.tf_tax_bill_line      -- bill ⋈ levy_bill, L bills, 2025 active, parcel-resolved
                                       (parcel, year, levy_cd, tax_district_id, tax_area_id,
                                        taxable_val, current_amount_due, amount_paid, balance,
                                        payment_status, bill_type) — grain = bill_id (~1.1M)
canonical_tf.tf_tax_bill_current   -- parcel-year rollup (sum due/paid/balance, bill_count)
canonical_tf.tf_levy_rate          -- levy.levy_rate per (year, tax_district_id, levy_cd) (~49)
```
Each ties to the sealed `tf_parcel` / `tf_tax_district` / `tf_tax_area`. Active rule: `is_active=1`
+ active supplement. Parcel-resolved via the spine xref (spine-resolved subset expected, like
assessment/jurisdiction).

### Deferred lanes
```
- Payment-transaction reconciliation (payment + payment_transaction_assoc + void/reversal):
  recompute balance from raw payments — only after void/reversal semantics proven.
- bill_type='A' assessment/fee bills (separate line type) — include in a follow-on.
- Fund (tf_fund) + distribution accounting — Treasurer territory.
- Delinquency / interest / penalty.
- Full bill/payment history (pre-2025, conversion artifacts).
```

### Runtime gates required (Stage 1)
```
1. source active denominator: bill 2025 is_active=1 bill_type='L' = 1,104,507 (+ A separate)
2. bill-line count = denominator @ 1.0000x (spine-resolved or explained delta)
3. supplement/active rule: is_active=1 honored; rollback/sup versioning collapsed
4. jurisdiction backing: every tax_district_id ∈ tf_tax_district; every tax_area_id ∈ tf_tax_area
5. parcel resolution: every bill-line resolves through the parcel spine; 0 empty CountyId
6. rollup integrity: tf_tax_bill_current totals = SUM of its tf_tax_bill_line rows
7. amount sanity: balance = current_amount_due − amount_paid; no fabricated amounts
8. revenue boundary: no payment-transaction recompute, no fund/distribution/delinquency
9. quarantine delta: 0 or explained
```

### County Studio claims allowed after Stage 1
```
ALLOWED:  "Per PACS, this parcel's 2025 tax is $X across N levies (district breakdown),
           $Y paid, $Z balance" — read-only explanatory context.
NOT YET:  recomputed-from-payments balance, delinquency status, payment receipts,
           fund/distribution, prior-year history, assessment ('A') bills.
```

---

## Boundary rules (hard)
```
Read-only. No billing/payment/delinquency mutation. No treasurer workflow.
No tax distribution accounting. No historical conversion claim until proven.
This is read-only revenue truth, not a Treasurer system.
```

## Recommended build sequence
```
0. Revenue Doctrine Discovery        ← THIS DOC (complete)
1. Current-Year Bill Header/Line Seal (tf_tax_bill_line + tf_tax_bill_current + tf_levy_rate)
2. (deferred) Payment Summary Seal — after void/reversal proven
3. (deferred) Parcel Revenue Read Model polish + 'A' bills
4. Revenue Seal Packet — explicitly read-only current-year revenue context
```

---

*Stage 0 discovery only. No code written, no schema changed. Awaiting go to build Stage 1.*
