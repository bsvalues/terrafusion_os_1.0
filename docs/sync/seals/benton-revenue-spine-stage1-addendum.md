# Benton Seal Packet — Mission 2 Addendum: Revenue Spine Stage 1

_Date: 2026-06-07 · Amends: `benton-current-year-spine-seal-packet.md` (Mission 1, closed at `b5f8c529e`)._
_Source of truth: live Harris PACS (`pacs_oltp`) · Target: TerraFusion DB (`legacy_pacs_raw` → `canonical_tf`)._

---

## A. Purpose of this addendum

Mission 1's packet recorded the Revenue Spine as **deferred** (§6 Boundary Register, §9 Handoff
Statement). This addendum revises that single disposition: **Revenue Spine Stage 1 is now sealed.**
Nothing else in the Mission 1 packet changes — the valuation and jurisdiction spine seals stand
exactly as stated.

Revised disposition:

| Was (Mission 1) | Now (this addendum) |
|---|---|
| Revenue Spine — **deferred** (entire spine) | Revenue Spine **Stage 1 sealed**: current-year levy tax bill explanation. Payment transactions, 'A' assessment bills, fund/distribution, delinquency, and history **remain deferred**. |

---

## B. What Stage 1 seals

**Revenue Spine Stage 1 — Current-Year Levy Tax Bill Explanation** (commit `5845c5360`).

A bounded, read-only explanation model. County Studio may now truthfully say:

> Per PACS, this parcel has N active 2025 levy tax bill lines, attached to these districts and
> levy codes, with PACS-recorded due, paid, and balance amounts.

It does **not** make TerraFusion the Treasurer system: amounts are PACS-recorded verbatim; balance
is the recorded arithmetic `due − paid`, not a recomputation; no payment transactions are reconciled.

### Runtime proof (batch `1d22f9fb-5ce6-4c73-b643-005eb743ffbd`, 596s, 4 gates PASS, 0 quarantine)

```
landed L-bills:        1,104,507   (2025 / is_active=1 / bill_type='L', 1:1 levy_bill)
canonical bill lines:    990,665
canonical parcels:        79,767
rollup rows:              79,767   (SUM BillCount = 990,665 = line count)
levy rates:                   49
quarantine:                    0
district backing:           100%   (0 NULL TaxDistrictId)
rate backing:               100%   (0 NULL LevyRate)
due / paid / balance:   line ↔ rollup EXACT; balance identity due − paid holds
  due      308,949,578.44
  paid           3,602.19
  balance  308,945,976.25
```

### Honest exclusion (not a false 100%)

```
113,842 unresolved = 1,104,507 landed − 990,665 canonical
  = bills against prop_ids outside the real-property spine
    (mobile-home / personal-property / non-real-property billing universe)
  excluded, not hidden.
```

This preserves a **true** "100% of spine-resolved real-property revenue context" claim while
explicitly refusing a **false** "100% of all tax bills" claim.

---

## C. Revenue doctrine (recorded)

```
PACS bill rows are levy/assessment bill-line records, not parcel bills.

For Stage 1, current levy tax truth is:
  active 2025 bill_type='L' bill
  joined 1:1 to levy_bill
  parcel-resolved through the real-property spine
  district/rate-backed through sealed jurisdiction + levy rate tables

current_amount_due is PACS-recorded current billed amount.
amount_paid is PACS-recorded paid amount.
balance_amount = current_amount_due - amount_paid for this read model.

Payment transactions are not reconciled in Stage 1.
```

This sits alongside the Mission 1 **active-supplement** doctrine (the active bill is the PACS
`is_active = 1` row, carrying the same "never blindly the base row" principle into Revenue).

---

## D. Revised boundary register (Revenue rows only)

| Boundary | Disposition |
|---|---|
| Revenue Spine — current-year **levy** tax bill (due / paid / balance, district, rate) | **✅ Stage 1 sealed** (read-only, PACS verbatim) |
| Payment-transaction reconciliation (voids, reversals, refunds, receipts, installments, associations) | **Deferred** — Stage 2B |
| 'A' assessment bills | **Deferred** — Stage 2A (next recommended) |
| Fund / distribution | **Deferred** — Stage 3 |
| Delinquency / history | **Deferred** — Stage 4 |

All non-Stage-1 Revenue concerns remain out of the sealed canonical model: `tf_tax_bill_line`
carries no `fund_id` / `distribution_id` / `delinquency_id` / payment-transaction columns (boundary
gate BND verified at seal time).

---

## E. Recommended Revenue queue (not yet started)

```
1. [DONE] Seal packet addendum for Revenue Stage 1   ← this document
2. Revenue Stage 2A: 'A' assessment-bill doctrine discovery
     (structurally closest to the bill/levy_bill model — lowest new semantics)
3. Revenue Stage 2B: payment-transaction reconciliation
     (introduces voids / reversals / refunds / receipts / installments / accounting semantics)
4. Revenue Stage 3: fund / distribution
5. Revenue Stage 4: delinquency / history
```

Stage 2A is recommended before 2B because 'A' bills extend the already-proven bill model, whereas
payment transactions introduce a new accounting-semantics surface. No stage opens without an
explicit go.

---

## F. Evidence

- Seal commit: `5845c5360` (feat(sync): Benton Revenue Spine Stage 1 — current-year levy tax bill explanation seal)
- Evidence artifact: `evidence/2026-06-07-revenue-spine-stage1-seal.md`
- Registry: `docs/sync/seals/benton-lane-status.md` (Revenue lane row + spine boundary updated)
- Migration: `20260608002824_AddRevenueSpineStage1` (Up = 4 CreateTable, Down = 4 DropTable)

*Process discipline held: additive migration, explicit per-path staging (no concurrent-agent
contamination), no `--no-verify`, runtime gates green before sealing.*
