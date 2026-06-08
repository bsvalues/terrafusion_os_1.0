# Benton Revenue Spine — Stage 3A Doctrine Discovery: Payment Transactions

_Date: 2026-06-07 · Read-only investigation against live Harris PACS (`pacs_oltp`). No tables built,
no schema mutated, no drain run, no payment summary created. Open the cash drawer with gloves and a
ledger camera — count, do not move._

---

## Summary verdict

The cash ledger is the classic Harris collection model: `payment` (tender/receipt event) ↔
`payment_transaction_assoc` ↔ `coll_transaction` (per-bill financial movements), with voids,
refunds, penalty/interest, receipts, batches, and tenders. **It reconciles cleanly at the base
grain:** `bill.amount_paid` equals `SUM(coll_transaction.base_amount_pd)` **exactly** (0 / 496 paid
2025 bills mismatched).

**Decisive consequence:** the *bill-grain net paid* truth is **already sealed** — the Stage 1 (L)
and Stage 2B (A) lanes expose `bill.amount_paid` / balance verbatim, and that figure is the
authoritative PACS net payment. No new canonical model is required to truthfully state per-parcel
current-year paid/balance.

**Boundary recommendation: DEFER the full cash ledger** (receipt history, tender detail,
void/reversal events, penalty/interest breakdown) as a separate Treasurer-grade artifact. Optionally
add a read-only **corpus reconciliation attestation gate** (verification, not a new lane) that proves
`bill.amount_paid == SUM(base_amount_pd)` at full scale. Do **not** build a payment-transaction
canonical model yet.

---

## The 12 proof questions

**1. Source payment tables?**
`payment` (tender/receipt event), `tender` / `tender_type` / `tender_credit_card` (tender detail),
`coll_transaction` (financial movements; `posted_coll_transaction` / `pending_coll_transaction`),
`payment_transaction_assoc` (payment↔transaction link + receipt + void), `refund_transaction_assoc`,
`overpayment_credit`, `batch_journal_collections` (batches), `transaction_type` / `fin_transaction_type`
(type codes). Plus conversion staging (`cnv_area_benton_payment_01212019`, `monitor_convert_payment_file*`).

**2. Payment grain?**
Three levels: `payment` = one tender/receipt event (one payee, one `receipt_num`, can pay many
bills); `coll_transaction` = one financial **movement** against one `trans_group` (bill) — the LINE
grain; `payment_transaction_assoc` = M:N link grouping transactions under a payment/receipt.

**3. How does `payment_transaction_assoc` relate payments to `bill_id`?**
It links `payment_id` ↔ `transaction_id` (NOT `bill_id` directly). The bill link is
`coll_transaction.trans_group_id = bill.bill_id` (in Harris, a bill IS a transaction-group). The
assoc also carries `prop_id`, `year`, `sup_num`, `treasurer_rcpt_number`, `voided`,
`void_transaction_id`.

**4. Are payments associated to both L and A bills?**
Yes. Transaction types are bill-class-specific: `CLB`/`PLB`/`ADJLB`/`RLB` for **levy** bills,
`CAB`/`PAB`/`ADJAB`/`RAB` for **assessment** bills (C=create, P=payment, ADJ=adjust, R=refund), plus
`CF`/`PF`/`ADJF`/`RF` for fees and `VOID`/`VOIDR` for void/void-refund. Both sealed bill universes
share one collection ledger.

**5. Fields for paid / tender / adjustment / refund / void / reversal / NSF / cancellation?**
`coll_transaction`: `base_amount` (charge), `base_amount_pd` (base paid), `penalty_amount_pd`,
`interest_amount_pd`, `bond_interest_pd`, `overage_amount_pd`, `underage_amount_pd`,
`other_amount_pd`. `payment`: `amount_due`, `amount_paid`, `voided`, `void_date`, `void_reason`,
`void_by_id`, `void_batch_id`, `orig_payment_id` (reversal link), `paid_under_protest`. Refunds via
R-type transactions + `refund_transaction_assoc`; overpayments via `overpayment_credit`.

**6. Authoritative sign convention?**
Charges (C-type) carry the obligation; payment movements accumulate into `base_amount_pd` such that
`SUM(base_amount_pd)` over a bill equals `bill.amount_paid` exactly (proven below). Voids/reversals
are already **netted** into `base_amount_pd` (the exact reconciliation could not hold otherwise).

**7. Are voided/reversed payments present?**
Yes, materially: **7,579** voided payments and **170,985** voided `payment_transaction_assoc` rows
across history, plus `VOID`/`VOIDR` transaction types. They are already absorbed into the net
`base_amount_pd`.

**8. Does `bill.amount_paid` equal the sum of associated transactions (after PACS rules)?**
**Yes — exactly, at the base grain.** Sample of 496 paid 2025 bills: **0** mismatch where
`bill.amount_paid <> SUM(base_amount_pd)`; **0** paid bills with no collection transactions. Adding
penalty+interest+bond+overage+other produces 46 differences — i.e. `amount_paid` tracks **base only**;
penalty/interest are separate paid components, not part of `amount_paid`.

**9. Receipt numbers / batches grouping multiple bill payments?**
Yes. `payment.receipt_num` / `receipt_secondary`, `payment_transaction_assoc.treasurer_rcpt_number`,
`batch_id`, and `batch_journal_collections`. One receipt routinely pays many bills (cross-bill
grouping is the norm).

**10. Current-year vs historical payment semantics?**
`payment` is all-history (**2,850,455** events). 2025 current-year payments are a native subset.
`bill.amount_paid` always reflects the bill's **current net** state regardless of when paid.

**11. 2018/2019 conversion artifacts?**
Yes — `cnv_area_benton_payment_01212019` (Jan-2019 conversion payment file) and
`monitor_convert_payment_file*` staging. Historical payments carry conversion lineage; current-year
2025 transactions are native. A history lane would have to handle conversion the way the
assessment/property lanes do; the current bill seals do not.

**12. Safe County Studio claim after reconciliation?**
> Per PACS, this parcel's current-year bill **net paid amount** (`bill.amount_paid`) reconciles
> exactly to the sum of its base collection-transaction paid amounts; balance = due − paid.

This is **already exposed** by Stage 1 / Stage 2B. NOT safe: receipt-level payment history,
tender/cash reconciliation, penalty/interest-paid breakdown, void/reversal audit, delinquency,
distribution/fund accounting, prior-year completeness.

---

## Decision gate

| Option | Verdict |
|---|---|
| Build a read-only payment **reconciliation** lane | ⚠️ **Not needed as a new model** — bill-grain net paid already sealed and reconciles exactly (0 mismatch). |
| Expose **receipt history** (per-receipt, per-tender, per-transaction) | ❌ **Defer** — introduces receipt/batch/tender/void/penalty-interest accounting semantics = Treasurer-grade. |
| **Defer cash ledger** | ✅ **Recommend** — the cash drawer is a Treasurer accounting surface; the bill seals already carry authoritative net paid. |
| Do not build yet | ✅ Consistent with above. |

**Optional, low-risk follow-on (verification, not a lane):** a corpus-wide **reconciliation
attestation** that proves `bill.amount_paid == SUM(coll_transaction.base_amount_pd)` across all 2025
active bills, emitted as a quality gate / evidence artifact. This strengthens the existing bill seals'
paid/balance claim without building any payment canonical model. Build only on explicit go.

**Deferred (Treasurer-grade, separate mission):** receipt/tender history, void/reversal audit trail,
penalty/interest/bond paid breakdown, overpayment/refund tracking, fund/distribution accounting,
delinquency, prior-year/history payment lanes.

---

*Discovery only. Nothing built, nothing migrated, nothing drained, no payment summary created.
Next action requires explicit go.*
