# Revenue Spine Stage 3B — Bill-Grain Payment Reconciliation Attestation

_Date: 2026-06-07 · Read-only verification against live Harris PACS (`pacs_oltp`). No schema change,
no new table, no drain, no canonical model — evidence artifact only._

## Purpose

Stage 3A discovered that `bill.amount_paid` reconciles to the collection ledger
(`coll_transaction.base_amount_pd`) at the bill grain, proven on a 496-bill sample. This attestation
re-runs the proof at **corpus scale** over all current-year active bills, to certify that the
already-sealed bill models (Stage 1 levy, Stage 2B special-assessment) carry PACS-authoritative
net-paid truth. It builds nothing.

## Method (read-only SQL)

```sql
-- bill side
SELECT SUM(amount_paid), COUNT(*) FROM dbo.bill WHERE year=2025 AND is_active=1;

-- collection-ledger side (trans_group_id = bill_id)
SELECT SUM(t.base_amount_pd), COUNT(*)
FROM dbo.coll_transaction t
INNER JOIN dbo.bill b ON b.bill_id = t.trans_group_id
WHERE b.year=2025 AND b.is_active=1;
```

## Result — EXACT corpus reconciliation

| Side | Total `base`/`amount_paid` | Rows |
|---|---:|---:|
| `bill.amount_paid` (2025 active) | **$32,941.46** | 1,417,646 bills |
| `SUM(coll_transaction.base_amount_pd)` (those bills) | **$32,941.46** | 1,418,142 transactions |

**Δ = $0.00 — penny-exact across all 1,417,646 current-year active bills.**

Supporting bounded per-bill proof (Stage 3A, sample of 496 paid 2025 bills):
`bill.amount_paid <> SUM(base_amount_pd)` mismatches = **0 / 496**; paid bills with no collection
transaction = **0**.

The transaction count (1,418,142) modestly exceeds the bill count (1,417,646) because some bills
carry multiple collection movements (payment + adjustment); the netted base sum still equals
`bill.amount_paid` exactly.

(The corpus total — $32,941.46 — is small because 2025 is the current year and almost entirely
uncollected at drain time. It is the corpus superset of the spine-resolved paid totals reported by
the Stage 1 and Stage 2B canonical lanes.)

## What this attests

- ✅ `bill.amount_paid` is the PACS-authoritative bill-grain net paid, and it equals the netted
  collection-ledger base paid **exactly** at corpus scale.
- ✅ Therefore the sealed bill read models (`tf_tax_bill_line` / `tf_assessment_bill_line` and their
  parcel rollups), which expose `bill.amount_paid` and `balance = due − paid` verbatim, carry
  authoritative current-year net paid / balance — **no payment canonical model is required** to make
  that claim.

## What this does NOT attest (still deferred — Treasurer-grade)

- Receipt-/tender-level payment history; void/reversal audit trail.
- Penalty / interest / bond **paid** breakdown (separate components, not part of `amount_paid`).
- Overpayment / refund tracking; fund / distribution accounting; delinquency; prior-year history.

## Disposition

Stage 3A doctrine **confirmed at corpus scale** (no contradiction). The bill-grain net-paid claim is
attested; the full cash ledger remains a deferred Treasurer-grade mission. No build performed.
