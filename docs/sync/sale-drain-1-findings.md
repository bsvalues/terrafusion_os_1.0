# SALE-DRAIN-1 — Findings: Sale NoParcelXref Quarantine Drain

**Slice:** SALE-DRAIN-1 (post-ATTR-POP-2). Second use of the
4-stage drain pattern established in ATTR-DRAIN-1, applied to a
different lane. Drains `legacy_tf_unproven.sale` rows whose
underlying parcel had no canonical xref at sale-projection time.

**Status:** SHIPPED. **Drained 8 → 4** (50% reduction). The
residual 4 are doctrine-correct: their underlying parcel is
mobile-home-typed (`MH`), legitimately excluded from the real-
property spine per the doctrine's `truth-pacs-parcel-real-property-filter`
gate.

## The result

```
Inspect:                        8 quarantined NO_PARCEL_XREF
                                3 distinct prop_ids
                                4 distinct sale truth batches

Stage B (parcel chain):         3 prop_ids landed
                                  R=2, MH=1
                                2 promoted to spine (1 rejected non-real)
                                2 projected to canonical

Stage C (re-project sales):     4 truth batches re-projected
                                  Each: 3 considered, 2 projected, 1 quarantined

Outcome:
  totalQuarantineBefore:         8
  totalQuarantineAfter:          4   (-4, -50%)
  canonicalSalesBefore/After:    2 / 2  (delta 0; idempotency cleared
                                          and re-projected the same 2)
  residualByReason:              [{NO_PARCEL_XREF: 4}]
```

The 4 residual rows are 1 MH parcel × 4 truth batches it appears
in. Doctrine-correct. The dashboard's total quarantine count is
now **4 — down from 4,748 at the start of this session arc.**

## Why the residual 4 is signal, not failure

The doctrine-pure parcel pipeline filters real-property only.
The `truth-pacs-parcel-real-property-filter` gate excludes MH
(mobile home) and P (personal property) parcels from the spine.
A sale on an MH parcel exists in PACS — but by doctrine, it
doesn't have a `tf_parcel` to link to (since MH isn't in the
spine), so `tf_sale` projection quarantines it with reason
`NoParcelXref`.

This is preservation-not-loss. The truth_pacs.sale row exists.
The legacy_tf_unproven.sale row preserves the lineage. A future
slice that decides MH sales matter (e.g. for personal-property
assessment) can promote them; the data is intact.

The 4 rows are the 4 truth batches in which 1 MH-parcel sale
appeared. Same sale, different batch contexts. The dashboard
showing 4 isn't 4 different problems — it's 1 problem expressed
4 times due to the user's keyed-source closure pattern producing
overlapping truth batches.

## Files shipped

- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/sale-drain-1/run-drain`. Mirrors
  ATTR-DRAIN-1's 4-stage shape exactly:
  - **A. Inspect** — group quarantine by reason, count distinct
    prop_ids and truth batches
  - **B. Refresh upstream gate state** — re-land + spine + canonical
    the parcels for the quarantined prop_ids
  - **C. Re-project** — call sale canonical projector for each
    distinct truth batch in the quarantine
  - **D. Delta report** — totals, per-reason residual, canonical
    delta
- `docs/sync/sale-drain-1-findings.md`

No new core entities, no new sources, no new populator services.
The existing keyed parcel chain + canonical projectors handled
everything; the drain is pure orchestration.

## The 4-stage pattern is now provably reusable

Two lanes, same shape:

| Stage | ATTR-DRAIN-1 | SALE-DRAIN-1 |
|---|---|---|
| A. Inspect | imprv_attr by reason | sale by reason |
| B. Refresh gate state | dictionary + delete stale | re-land parcels |
| C. Re-process | re-run keyed imprv chain | re-project sale truth batches |
| D. Delta report | quarantine + features attributed | quarantine + canonical sales |

Future drains for any quarantine table can mirror this. The
idempotency contracts in the projectors (`prior*RowsRemoved`)
make the pattern composable — no need for special handling of
"already drained" state.

## Total quarantine reduction this session

```
Session start:   imprv_attr=4,740  sale=8   total=4,748
After ATTR-DRAIN-1: imprv_attr=7      sale=8   total=15
After ATTR-POP-2:   imprv_attr=0      sale=8   total=8  (re-projection
                                                          drained the 7 too)
After SALE-DRAIN-1: imprv_attr=0      sale=4   total=4   ← here
```

Total quarantine drop: **4,748 → 4 (99.92% reduction)**. The
residual 4 are doctrine-correct signal.

## What's deliberately NOT closed

- **The 4 MH-parcel sale quarantines.** They will stay until
  either:
  - The user authorizes MH parcels into the spine (a doctrine
    contract change, not a code change here)
  - A future slice introduces a personal-property pipeline
    (`tf_personal_parcel` or similar) for non-real-property
    sales to flow into
  Neither is in scope for SALE-DRAIN-1.
- **The dashboard's quarantine warning visualization.** Today
  it shows raw count. A future iteration could distinguish
  "doctrine-correct residual" (yellow/info) vs "actionable"
  (amber/warning) by reason. Out of scope.

## Re-open conditions for SALE-DRAIN-1

- New `LegacyTfUnprovenSale` rows accumulate beyond the
  doctrine-correct residual (e.g. a closure run produces real-
  property sales whose parcels weren't landed first). Re-running
  the drain endpoint would resolve.
- A new quarantine reason emerges in the sale lane (today only
  `NO_PARCEL_XREF`; future code might add reasons).
- The sale projector's idempotency contract changes such that
  re-projection no longer cleans prior canonical/quarantine —
  would surface in the perBatch deltas.

## Endpoint reference

```
POST /api/debug/sale-drain-1/run-drain
Content-Type: application/json

{
  "OperatorName": "sale-drain-1",   // optional
  "DryRun": false                    // optional; true = inspect only
}
```

Response includes inspection block, parcelStage block, perBatch
results, and outcome deltas.

## The one-line summary

**SALE-DRAIN-1: 8 → 4 quarantine drained (50%); residual 4 are
doctrine-correct MH-parcel exclusions. The 4-stage drain pattern
is now provably reusable across lanes. Total session quarantine
drop: 4,748 → 4 (99.92%).**
