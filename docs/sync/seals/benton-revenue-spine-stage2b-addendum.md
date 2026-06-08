# Benton Seal Packet — Mission 2 Addendum #2: Revenue Spine Stage 2B

_Date: 2026-06-07 · Amends: `benton-current-year-spine-seal-packet.md` (Mission 1) and
`benton-revenue-spine-stage1-addendum.md` (Addendum #1)._
_Source of truth: live Harris PACS (`pacs_oltp`) · Target: TerraFusion DB (`legacy_pacs_raw` → `canonical_tf`)._

---

## A. Purpose of this addendum

Addendum #1 recorded **Revenue Spine Stage 1** (current-year levy tax bill) as sealed. This addendum
adds **Revenue Spine Stage 2B** (current-year special-assessment bill). Nothing prior changes.

Revised handoff claim:

| Was (Addendum #1) | Now (this addendum) |
|---|---|
| Current-year **levy tax bill** explanation sealed | Current-year **levy tax bill AND special-assessment bill** explanation sealed |

Still deferred: payment transactions · receipts · voids/reversals/refunds · fund/distribution
accounting · delinquency · prior-year history.

---

## B. What Stage 2B seals

**Revenue Spine Stage 2B — Current-Year Special-Assessment Bill** (commit `82002975f`).

A bounded, read-only, **agency-backed** explanation model — deliberately a *separate* lane from the
levy model, not a null-stuffed extension of it. County Studio may now truthfully say:

> Per PACS, this parcel has N active 2025 special-assessment bills from these agencies
> (Noxious Weed, Mosquito, Conservation District, Columbia Irrigation, …), with PACS-recorded
> due / paid / balance amounts.

### Runtime proof (batch `a66ea923-…`, 356s, 3 gates PASS, 0 quarantine)

```
landed A-bills:          313,139   (2025 / is_active=1 / bill_type='A', 1:1 assessment_bill)
canonical bill lines:    313,139
unresolved:                    0   (100% on real-property spine — cleaner than L)
distinct parcels:         79,078
agency dict:                  29   (9 actively billing)
rollup rows:              79,078   (SUM BillCount = 313,139 = line count)
agency-backed:              100%   (0 NULL AssessmentCd)
due / paid / balance:   line ↔ rollup EXACT; balance identity due − paid holds
  due       8,841,075.97   (reconciles to Stage-2A per-agency profile)
  paid            429.35
  balance   8,840,646.62
quarantine:                    0
```

---

## C. Revenue bill doctrine (recorded)

```
PACS bill rows are bill-line records, not parcel bills.

bill_type='L':
  joins 1:1 to levy_bill
  backed by tax district + levy code + levy rate
  canonical model: tf_tax_bill_line / tf_tax_bill_current

bill_type='A':
  joins 1:1 to assessment_bill
  backed by special-assessment agency
  no tax_district, levy_cd, levy_rate, fund, or taxable value claim
  canonical model: tf_assessment_bill_line / tf_assessment_bill_current

Payment transaction reconciliation is not implied by either seal.
```

**Architectural consequence (the key Stage 2B proof):** A bills are *not* malformed L bills — they
are agency-backed assessment charges. Keeping two canonical models (`tf_tax_bill_line` for
district/rate-backed levies, `tf_assessment_bill_line` for agency-backed assessments) prevents
null-stuffed rows and protects both seals' backing gates.

---

## D. Safe / unsafe County Studio claims (current revenue surface)

**Safe now:**
```
Per PACS, this parcel's current-year revenue context includes:
  levy tax bill lines by district / levy / rate,
  special-assessment bill lines by agency,
  PACS-recorded due, paid, and balance rollups.
```

**Still unsafe:**
```
receipt-level payment history
cash reconciliation
delinquency status
distribution accounting
treasurer workflow completeness
prior-year revenue completeness
```

---

## E. Revised boundary register (Revenue rows)

| Boundary | Disposition |
|---|---|
| Revenue — current-year **levy** tax bill (Stage 1) | **✅ Sealed** (`5845c5360`, read-only) |
| Revenue — current-year **special-assessment** bill (Stage 2B) | **✅ Sealed** (`82002975f`, read-only, agency-backed) |
| Payment-transaction reconciliation (receipts / voids / reversals / refunds / installments) | **Deferred** — Stage 3A discovery first |
| Fund / distribution accounting | **Deferred** |
| Delinquency / prior-year history | **Deferred** |

---

## F. Recommended Revenue queue (not yet started)

```
1. [DONE] Stage 2B packet addendum                  ← this document
2. Revenue Stage 3A: payment-transaction doctrine discovery only
     (the cash ledger — voids/reversals/refunds/receipts/installments/accounting)
3. Then decide: payment summary reconciliation, receipt history, or defer as Treasurer accounting
4. (later) fund / distribution
5. (later) delinquency / prior-year history
```

Payment transactions get discovery before any build, same discipline as Stage 0 and Stage 2A. No
stage opens without an explicit go.

---

## G. Evidence

- Seal commit: `82002975f`
- Evidence artifact: `evidence/2026-06-07-revenue-spine-stage2b-assessment-bill-seal.md`
- Discovery: `docs/sync/benton-revenue-spine-stage2a-discovery.md` (`640f7f266`)
- Registry: `docs/sync/seals/benton-lane-status.md`
- Migration: `20260608053127_AddRevenueSpineStage2BAssessmentBill` (Up = 4 CreateTable, Down = 4 DropTable)

*Process discipline held: separate honest lane (no null-stuffing), additive migration, explicit
per-path staging, no `--no-verify`, runtime gates green before sealing.*
