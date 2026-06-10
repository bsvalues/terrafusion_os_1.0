# Block-C Contract — v1.9 (F5 Sales-Ratio-Study Read-Model + F1/F3/F4 Deferral)

**Status:** binding doctrine. Version `v1.9`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.8.md` (v1.8, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition)
docs/pacs/block-c-contract-v1.3.md           (v1.3 — nullable AttributeId FKs)
docs/pacs/block-c-contract-v1.4.md           (v1.4 — QuarantineReasons closed vocab)
docs/pacs/block-c-contract-v1.5.md           (v1.5 — attribute resolution semantics)
docs/pacs/block-c-contract-v1.6.md           (v1.6 — two-layer quarantine vocabulary)
docs/pacs/block-c-contract-v1.7.md           (v1.7 — E4c documented deferral; Block E close)
docs/pacs/block-c-contract-v1.8.md           (v1.8 — Block-D D1+D2+D3 + legacy retirement)
docs/pacs/block-c-contract-v1.9.md           (v1.9 — F5 sales-ratio-study read-model) ← this doc
```

## 0. What v1.9 is

A coordinated minor bump that records:

1. **F5** sales-ratio-study read-model: typed read surfaces over
   `canonical_tf.tf_sale` exposing the operator's three morning
   queries (Q1 valid count, Q2 by-year, Q3 aggregate price) as
   REST endpoints under
   `/api/counties/{countyId}/sales-ratio-study/...`.
2. **F1 / F3 / F4 deferral**: the queue-style sub-slices in
   `blocks-d-through-h-design.md` §F can't be implemented until
   the operator imports their morning-dashboard SQL into
   `docs/sync/operator-sql-regression/`. Tracked by
   **OPERATOR-SQL-IMPORT-1 (#726)**.
3. **F5 v1 simplification**: the original "neighborhood ratio
   study skeleton" name implied `hood_cd` grouping. v1.9 ships
   year-grouped aggregates only. Hood_cd grouping needs a
   `tf_parcel.DictNeighborhoodId` FK that does not exist in
   v1.8 — deferred to a future slice.

No v1.x-frozen shape is modified. No new entity, no schema
change, no migration. v1.9 is read-model + doctrine only.

## 0.5 Doctrine integrity disclosure (carry-forward)

Same pattern as v1.4 / v1.6 / v1.8: the original spine doc
(`blocks-d-through-h-design.md` §F) named F sub-slices using
operator-side terminology that didn't fully match what's in the
repo. Pre-F audit found:

```text
✓ docs/sync/operator-sql-regression/sales-ratio-queries.md
  Operator's Q1 / Q2 / Q3 sales-ratio queries (PACS-original +
  canonical-equivalent). Backed by OperatorSalesRegressionTests
  proving canonical = PACS aggregates. Maps cleanly to F5.

✗ Open-work / pending-appraisal / field-check / land-exception
  queries (F1 / F3 / F4) NOT in the repo today.
```

The "Bills stuff (daily dashboards)" mentioned in the user's
working memory (`project_benton_source_sets.md`) lives on the
operator's local drives and has not been imported into
TerraFusion. v1.9 names this gap explicitly via the deferred-
slice pattern (same shape as v1.7's E4c deferral).

OPERATOR-SQL-IMPORT-1 (#726) closes when at least three of
F1 / F3 / F4 receive their PACS-original + canonical-equivalent
SQL in `docs/sync/operator-sql-regression/`.

---

## 1. What changed since v1.8

```text
ADDED (new code surfaces):
  + ISalesRatioStudyReader interface  (TerraFusion.Core.Sync.SalesRatioStudy)
  + SalesByYearRow record
  + SalePriceAggregate record
  + SalesRatioStudyReader              (TerraFusion.Data.Services.CanonicalTf)
  + SalesRatioStudyController          (TerraFusion.API.Controllers)
  + DI registration (Scoped) in Program.cs

ADDED (closed-vocabulary value):
  + ISalesRatioStudyReader.DefaultFromDate = 2018-01-01 UTC
    (the locked operator-cutover date; pre-2018 sales used the
    old code vocabulary per the v1.0 PACS conversion caveat)

ADDED (REST endpoints):
  + GET /api/counties/{countyId}/sales-ratio-study/valid-sale-count
  + GET /api/counties/{countyId}/sales-ratio-study/by-year
  + GET /api/counties/{countyId}/sales-ratio-study/price-aggregate
  All require [Authorize] + matching countyId claim. Return 200
  on authorized, 403 on missing claim or cross-county mismatch,
  401 on unauthenticated (handled by [Authorize]).

NOT ADDED (deferred per OPERATOR-SQL-IMPORT-1):
  ⊘ F1 — open-work / pending-appraisal queue read-model
  ⊘ F3 — improvement field-check queue read-model
  ⊘ F4 — land-segment exception list read-model
  ⊘ F5 hood_cd grouping (needs tf_parcel FK that doesn't exist)

UNCHANGED:
  · all v1.x shapes — no entity, no migration, no schema change
  · canonical_tf.tf_sale (read-only consumer; F5 reads via
    AsNoTracking, no writes)
```

---

## 2. F5 read-model contract (frozen)

### 2.1 Scope

```text
- Single county per call. Multi-county aggregation out of scope.
- Aggregate-only. Per-row sale lookups stay on tf_sale via the
  existing read paths.
- 2018-01-01 default cutover (override via ?from= query param).
- Filters mirror operator-sql-regression/sales-ratio-queries.md
  exactly:
    SaleQualified == TRUE
    SlDt IS NOT NULL
    SlDt >= cutoff
  Q3 additionally: SlPrice IS NOT NULL
- No hood_cd grouping in v1.9. Future v1.x bump adds it after
  tf_parcel.DictNeighborhoodId FK lands.
```

### 2.2 Result types (frozen)

File: `backend/src/TerraFusion.Core/Sync/SalesRatioStudy/ISalesRatioStudyReader.cs`

```csharp
public sealed record SalesByYearRow
{
    public required int SaleYear { get; init; }
    public required int Count { get; init; }
}

public sealed record SalePriceAggregate
{
    public required int Count { get; init; }
    public required decimal? TotalPrice { get; init; }
    public required decimal? AveragePrice { get; init; }
}
```

`SalePriceAggregate` returns nulls for `TotalPrice` /
`AveragePrice` only when `Count == 0` (no qualifying rows). When
`Count > 0`, both are non-null.

### 2.3 Endpoint contract (frozen)

```text
GET /api/counties/{countyId:guid}/sales-ratio-study/valid-sale-count
    [?from=YYYY-MM-DD]

  Authentication:  [Authorize]
  Authorization:   countyId claim must match path countyId
                   Mismatch / missing → 403 (Forbid)
  Body:            { countyId, fromDate, validSaleCount }

GET /api/counties/{countyId:guid}/sales-ratio-study/by-year
    [?from=YYYY-MM-DD]

  Body:            { countyId, fromDate, rows: [ {SaleYear, Count}, ... ] }
  Order:           rows ordered by SaleYear DESC

GET /api/counties/{countyId:guid}/sales-ratio-study/price-aggregate
    [?from=YYYY-MM-DD]

  Body:            { countyId, fromDate, aggregate: SalePriceAggregate }
```

Read-only by contract: `AsNoTracking` on every query, no
`SaveChangesAsync`. No PII surfaced. Empty datasets return 200
with zero counts (NOT 404).

### 2.4 Equivalence to PACS

Per `docs/sync/operator-sql-regression/sales-ratio-queries.md`:
the operator's PACS-original Q1/Q2/Q3 produce the same numbers
the canonical equivalents do, and `OperatorSalesRegressionTests`
asserts this equivalence on a fixture. The F5 reader sits over
the canonical layer directly — no new equivalence proof needed
for this slice. Any future divergence between PACS-original and
canonical aggregates is a doctrine violation in the layer
between raw and canonical, not in F5.

---

## 3. F1 / F3 / F4 deferral (formal)

### 3.1 Reason

Operator-side morning-dashboard SQL is on local drives, not in
the repo. F1/F3/F4 implementations without that SQL would invent
filter semantics that may not match operator workflow.

### 3.2 Tracking

```text
Issue:   OPERATOR-SQL-IMPORT-1 (#726)
Title:   "import operator-side dashboard SQL for F1 / F3 / F4"
Closes:  when at least three of these land in
         docs/sync/operator-sql-regression/:
           open-work-queue.md           (F1)
           field-check-queue.md         (F3)
           land-exception-queue.md      (F4)
         (Optional) refinement to sales-ratio-queries.md
         if F2 needs a queue concept on top of Q1/Q2/Q3.

Each new doc must include both PACS-original and
canonical-equivalent SQL, mirroring the locked shape of the
existing sales-ratio-queries.md.
```

### 3.3 Resume rule

When OPERATOR-SQL-IMPORT-1 closes, F1/F3/F4 sequence as separate
slices, each with its own read-model contract bump (v1.10+). F5
does not become a precedent for the queue-style sub-slices —
they have different shapes (filtered lists, not aggregates).

---

## 4. F5 hood_cd grouping deferral (formal)

### 4.1 What's blocking

```text
- canonical_tf.dict_neighborhood exists (v1.1) but no consumer.
- canonical_tf.tf_parcel does NOT carry a DictNeighborhoodId
  FK in v1.8.
- F5 hood_cd grouping requires either:
  (a) Adding tf_parcel.DictNeighborhoodId nullable FK
      (additive, v1.x minor bump)
  (b) Reading raw PACS property_val.hood_cd directly
      (breaks doctrine — bypasses canonical)

Option (a) is the doctrinally correct path. v1.9 doesn't add it
to keep the F5 ship narrow.
```

### 4.2 Future slice

When operator dashboard work needs neighborhood-level ratio
studies, a future slice will:

```text
1. Add tf_parcel.DictNeighborhoodId nullable FK + EF
   relationship to canonical_tf.dict_neighborhood
2. Wire C-block projector(s) (or a dedicated slice) that
   resolves hood_cd from raw PACS property_val into
   canonical via dict_neighborhood lookup
3. Extend ISalesRatioStudyReader with hood_cd-grouped variants
4. Document in v1.10+ contract bump
```

The path is mechanical once steps 1-2 land. v1.9 does not
pre-commit to the extension's exact shape.

---

## 5. What v1.9 does NOT do

```text
✗ No new entity (no schema change, no migration)
✗ No new TfEntityType vocabulary value
✗ No new QuarantineReason
✗ No projector / writer service (read-only slice)
✗ No frontend / UI work (panel construction is downstream)
✗ No hood_cd grouping (deferred)
✗ No queue-style endpoints (F1/F3/F4 deferred)
✗ No PostGIS / NetTopologySuite
✗ No multi-county aggregation
✗ No retroactive change to operator-sql-regression/sales-ratio-queries.md
```

---

## 6. Test coverage added in v1.9

```text
SalesRatioStudyReaderTests (11 tests):
  Q1_CountsOnlyQualifiedPostCutoffSales
  Q1_RespectsExplicitFromDateOverride
  Q1_CountyIsolation_DoesNotMixCounties
  Q1_EmptyCounty_ReturnsZero
  Q2_GroupsByYear_DescendingOrder
  Q2_PreCutoff_NotIncluded
  Q2_Unqualified_NotIncluded
  Q3_AggregatesSumAndAverage
  Q3_NullPrice_NotIncluded
  Q3_EmptyResult_ReturnsZeroCountWithNullAggregates
  DefaultFromDate_IsLockedToCutoverConvention

Doctrine band totals:
  Pre-v1.9 (after Block D close):  510 / 510 green
  After F5:                        +11 → 521 (or higher with
                                     filter-expansion drift)
```

The controller's REST contract is exercised by integration tests
in `TerraFusion.Integration.Tests` per the existing controller
test pattern (no new controller-level unit tests added in this
slice — the controller is a thin adapter over the reader, and
the reader has full unit coverage).

---

## 7. Block F status after v1.9

```text
✓ F5    sales-ratio-study read-model (v1.9)
⊘ F1    deferred — OPERATOR-SQL-IMPORT-1 (#726)
⊘ F2    likely deferred — needs queue concept on top of Q1/Q2/Q3
⊘ F3    deferred — OPERATOR-SQL-IMPORT-1 (#726)
⊘ F4    deferred — OPERATOR-SQL-IMPORT-1 (#726)
⊘ F5+   hood_cd grouping deferred until tf_parcel FK lands

90-day spine:
  H ✓  E ✓  D ✓  F (partial — F5 only)  G (next user-facing block)

After OPERATOR-SQL-IMPORT-1 closes, F1/F2/F3/F4 sequence; until
then, Block G (ConversionEra provenance hardening) can open
since it's data-spine work, not user-facing.
```

---

## 8. v1.9 doctrine frog status

> The map goblin's mailbox now serves morning coffee. The
> ratio-study aggregate endpoints are live. The queue goblins
> wait at the gate for their paperwork (operator-side SQL
> import, tracked at #726). The doctrine is honest: F5 ships
> against its real spec; F1/F3/F4 wait for theirs.
