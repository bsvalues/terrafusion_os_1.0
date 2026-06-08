# Benton Seal Packet — Mission 2 Addendum #3: Revenue Spine Stage 3A (Payment Doctrine)

_Date: 2026-06-07 · Amends: `benton-current-year-spine-seal-packet.md` (Mission 1),
`benton-revenue-spine-stage1-addendum.md` (#1), `benton-revenue-spine-stage2b-addendum.md` (#2)._
_Source of truth: live Harris PACS (`pacs_oltp`)._

---

## A. Purpose of this addendum

Addenda #1 and #2 sealed the two current-year bill read models (levy + special-assessment). This
addendum records the **payment-transaction doctrine discovery** (Stage 3A) and its consequence for
the handoff: the bill-grain **net paid** truth is already covered by the sealed bill models, and the
full cash ledger is deferred as Treasurer-grade.

This addendum changes **no seal** and builds **no model**. It records a doctrine finding and the
boundary it sets.

---

## B. What Stage 3A found (commit `1ce148235`)

The PACS cash ledger is the classic Harris collection model:

```
payment (tender/receipt event)
   ↔ payment_transaction_assoc (payment_id ↔ transaction_id; receipt#, voided)
   ↔ coll_transaction (per-bill financial movement; trans_group_id = bill_id)
```

with voids, refunds, penalty/interest, receipts, batches, and tenders. Payments cover **both** L and
A bills (`PLB`/`PAB` payment types; `CLB`/`CAB` create; `ADJ*` adjust; `R*` refund; `VOID`/`VOIDR`).

**The decisive proof:** `bill.amount_paid` reconciles **exactly** to `SUM(coll_transaction.base_amount_pd)`
at the bill grain — 0 / 496 paid 2025 bills mismatched, 0 paid bills without transactions. `amount_paid`
tracks the **base** component only (penalty/interest/bond are separate paid components). Voids are
material (7,579 voided payments, 170,985 voided assoc rows) but already netted into `base_amount_pd`.

---

## C. Payment doctrine (recorded)

```
PACS payments are collection transactions, not parcel-level paid facts.

The cash ledger grain:
  payment            = one tender/receipt event (one payee, one receipt#, many bills)
  coll_transaction   = one financial movement against one bill (trans_group_id = bill_id)
  payment_transaction_assoc = M:N link grouping transactions under a payment/receipt

Authoritative bill-grain net paid:
  bill.amount_paid == SUM(coll_transaction.base_amount_pd) over the bill   (proven exact)
  amount_paid tracks BASE only; penalty/interest/bond are separate paid components
  voids/reversals are already netted into base_amount_pd

Consequence:
  The sealed bill models (tf_tax_bill_line / tf_assessment_bill_line and their rollups)
  ALREADY carry PACS-authoritative current-year net paid + balance at the bill/parcel grain.
  No payment-transaction canonical model is required to state per-parcel paid/balance.

Deferred (Treasurer-grade): receipt/tender history, void/reversal audit trail,
penalty/interest/bond paid breakdown, overpayment/refund tracking, fund/distribution,
delinquency, prior-year history.
```

---

## D. Boundary disposition (revised Revenue rows)

| Boundary | Disposition |
|---|---|
| Bill-grain current-year **net paid / balance** (L and A) | **✅ Already sealed** via Stage 1 + Stage 2B (`bill.amount_paid` verbatim; reconciles exactly to `base_amount_pd`) |
| Corpus reconciliation **attestation** (verification, not a model) | **Optional** — Stage 3B, read-only evidence artifact (see §E if executed) |
| Receipt / tender history, void/reversal audit, penalty-interest breakdown | **Deferred** — Treasurer-grade cash ledger |
| Fund / distribution / delinquency / prior-year history | **Deferred** |

---

## E. Stage 3B reconciliation attestation — DONE (corpus, penny-exact)

Read-only corpus attestation executed (no schema change, no new table, no drain, no canonical model):

```
bill.amount_paid total (1,417,646 active 2025 bills)        = $32,941.46
SUM(coll_transaction.base_amount_pd) (1,418,142 txns)        = $32,941.46
Δ = $0.00 — penny-exact corpus-wide
```

Plus the Stage 3A per-bill sample: 0 / 496 paid bills mismatched, 0 paid bills without a collection
transaction. The Stage 3A doctrine is **confirmed at corpus scale** — `bill.amount_paid` is the
PACS-authoritative bill-grain net paid and the sealed bill models carry it verbatim. Evidence:
`evidence/2026-06-07-revenue-spine-stage3b-reconciliation-attestation.md`.

---

## F. Safe / unsafe County Studio claims (unchanged from #2, restated)

**Safe:** current-year levy + special-assessment bill lines by district/levy/rate and agency, with
PACS-recorded due / paid / balance rollups. (Paid is the PACS-authoritative bill-grain net, proven
to reconcile to the collection ledger base.)

**Unsafe:** receipt-level payment history, tender/cash reconciliation beyond the proven bill-grain
attestation, penalty/interest-paid breakdown, void/reversal audit, delinquency, distribution/fund
accounting, prior-year completeness.

---

## G. Evidence

- Stage 3A discovery: `docs/sync/benton-revenue-spine-stage3a-discovery.md` (`1ce148235`)
- Stage 3B attestation (optional): `evidence/2026-06-07-revenue-spine-stage3b-reconciliation-attestation.md`
- Bill seals: Stage 1 `5845c5360`, Stage 2B `82002975f`

*No seal changed, no model built. Doctrine-only addendum.*
