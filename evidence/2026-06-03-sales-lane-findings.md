# Sales Lane — Sweep Complete + Promotion-Gap Finding (2026-06-03)

## Sweep outcome (cursor sweep DONE, self-stopped on exhaustion)
- 39 cursor chunks, all Succeeded, dup held 1.0000× throughout (truth AND landing).
- Cursor exhausted at chg_of_owner_id=442,109.
- **Final state:** landing 75,678 pairs (1.0×); truth_pacs.sale = **28,401** (28,401 distinct, 1.0×);
  canonical_tf.tf_sale = 28,124.
- Qualification distribution in truth (all promoted rows qualify per doctrine):
  - both DOR+county qualified: 16,519
  - DOR-only qualified: 9,467
  - county-only qualified: 2,415

## Denominator analysis: 75,678 landed → 28,401 promoted (47,277 not promoted)
Of the 47,277 landed-not-promoted pairs, most are legitimately doctrine-excluded
(unqualified ratio codes: <NULL>=29,988, 200=11,291, 300=4,022, 400=570, 500=23, plus
legacy/other). Those are CORRECT exclusions — the DOR/county ratio doctrine intentionally
keeps only qualified sales.

## ⚠️ REAL PROMOTION GAP (not doctrine): SupNum=0 hardcode drops qualified sales
**766 landed pairs carry `SlCountyRatioCd='100'` (the canonical "qualified valid sale" code)
but are NOT in truth.** Diagnosed by evidence:
- All 766 sales carry `SupNum=0`.
- 0 of their 751 parcels have a landed prop_supp_assoc row matching (PropId, PropValYr, SupNum=0).
- BUT PACS source HAS the supp-assoc — e.g. parcel 10130, owner_tax_yr 2024 exists at **sup_num=10**
  (not 0). PACS prop_supp_assoc is keyed (prop_id, owner_tax_yr, sup_num); the current/active
  supplement for many parcel-years is a NON-ZERO sup_num.

**Root cause:** `SqlServerPacsSaleSource` hardcodes `CAST(0 AS smallint) AS sup_num` for every
landed sale (PACS dbo.sale has no sup_num; the source assumed 0). The sale-truth promoter then
joins sale→supp on matching SupNum. When the parcel-year's active supp is non-zero, SupNum 0≠N →
RejectedStaleSupNum/NoSuppPointer → the qualified sale silently fails to promote.

**Scope:** all 75,678 landed sales have SupNum=0; all 28,401 promoted matched a sup_num=0
supp-assoc. Sales whose parcel-year active supp is non-zero are dropped. At minimum the 766
'100'-coded pairs are provably-qualified-but-blocked; the true count of affected qualified sales
is likely higher (any qualified code whose parcel-year uses a non-zero supp).

## Why NOT sealed
Sealing now at 28,401 would falsely report doctrine-exclusion for sales that are actually blocked
by a SupNum-resolution bug. The qualified-sales denominator can't be trusted until the SupNum
join is corrected to use the parcel-year's ACTUAL active sup_num (from prop_supp_assoc /
property_val), not a hardcoded 0.

## Committed so far (all correct, keep)
- `7f635489f` sales truth natural-key idempotency
- `9d893f667` sales cursor advancement
- `83664a4a7` sales landing idempotency
These are all sound; the sweep proved them (1.0× end-to-end). The SupNum-resolution issue is a
SEPARATE, newly-surfaced correctness bug in the sale SOURCE, not in the idempotency/cursor work.

## Decision needed (do not seal until resolved)
Options:
(A) Fix the sale source to resolve the real active sup_num per (prop_id, owner_tax_yr) from
    prop_supp_assoc (max/active sup), re-land + re-promote, then seal against true qualified universe.
(B) Seal sales as "PARTIAL — 28,401 sup0-qualified promoted; SupNum-resolution gap documented"
    and defer the source fix.
(C) Investigate scope first (how many of the 47,277 are SupNum-blocked vs genuinely unqualified)
    before choosing.
