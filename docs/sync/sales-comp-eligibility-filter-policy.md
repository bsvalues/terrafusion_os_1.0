# Sales Comp-Eligibility Filter Policy

**Slice:** C37-A (docs-only — defines the read-side filter contract
that the C36-populated canonical landing
(`CanonicalSaleQualifications`) feeds into. C37-B will land the
EF read service + a SQL view + the end-to-end proof script. This
slice writes the contract, not the code.).
**Lifecycle layer:** post-canonical-write read surface. Sits
downstream of the C35-B `CanonicalSaleQualifications` table that
C36 populates, and upstream of the future sales-comp / ratio
study / Forge sales surfaces.
**Status:** policy locked; implementation deferred to C37-B.

## Why this slice

The end-to-end Path 1 destination is the operator's
`project_benton_truth_pass.md` memory:

> "WacCd bug blocks all comps."

The whole chain — C32 → C36 — exists to put a **mechanically
provable filter** between PACS sales and the comp pool. C36 has
just landed: the canonical decision row is now written. C37-A
defines what "comp-eligible" means in canonical terms and
specifies the proof contract C37-B must satisfy.

Per the locked sequence:

```
C34   ✓ lock workbook
C35-A ✓ canonical landing schema design
C35-B ✓ schema + entity + migration
C36   ✓ SalesQualificationTransform write-side runner
C37-A   sales comp-eligibility filter policy           ← THIS SLICE
C37-B   read service + SQL view + end-to-end proof
```

C37-B is where evidence lands.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy.**
  Canonical sale identity is `(CountyId, ChgOfOwnerId)`. Comp
  eligibility is keyed off this identity.
- **C8-A — Sales Qualification Transform Policy.** Defines the
  AND-logic exclusion rule. C37-A inherits it without
  modification: the transform's `Qualified` decision is the
  comp-eligibility decision; this filter only restates it.
- **C13-A — Sales-lane Review Policy.** The 2017 conversion
  caveat lives there: pre-2017 wac_cd codes do NOT appear in the
  workbook unless the operator surfaced them. Sales referencing
  pre-conversion codes will land as `Inconclusive` in the
  canonical table and (per this filter) will NOT enter the comp
  pool. Documented here so the proof's exclusion counts are
  understood, not surprising.
- **C35-A — Canonical Sales Qualification Landing Schema Policy.**
  The 3-status (`Qualified` / `Excluded` / `Inconclusive`) shape
  is the input to this filter. Excluded and Inconclusive are
  both NOT comp-eligible; only Qualified passes.
- **C36 — Sales Qualification Canonical Write-Side Runner.**
  The slice that produced the canonical rows this filter reads.
- **Operator memory `project_benton_truth_pass.md`**:
  > "WacCd bug blocks all comps."
  The original failure mode this filter is intended to contain.
- **CLAUDE.md** — Sovereign-county isolation invariant, FISMA
  audit invariant, no PACS mutation.

## Purpose

Define the **read-side filter** that consumers (sales-comp,
ratio-study, Forge sales surface) call to get the set of
comp-eligible sales for a given county.

Comp eligibility is a single rule:

```
A sale is comp-eligible iff its row in CanonicalSaleQualifications has
  ComputedDecision = Qualified
```

That is the entire decision rule. No re-evaluation, no
secondary filtering, no scoring. The filter is a pure projection
of the canonical landing table's `ComputedDecision` column.

## Hard guards

These guards lock the contract for C37-B. C37-B may not
relax them.

### 1. **`Qualified`-only — Excluded and Inconclusive both fail closed.**

The filter selects ONLY rows where
`ComputedDecision = Qualified`. Both `Excluded` (operator-
explicit exclusion) and `Inconclusive` (workbook-gap or
data-gap on at least one axis) are NOT comp-eligible.

This is the WacCd-bug containment: a sale carrying a
problematic / pre-conversion / unmapped `wac_cd` will land as
`Excluded` (if operator-tagged) or `Inconclusive` (if the
workbook is silent on that code), and the filter excludes
both. The comp pool stays clean by construction — the bug
cannot leak into comps because the filter only admits
explicitly Qualified rows.

`Inconclusive` is intentionally kept out of comps even when
one axis was Qualified. C8-A's AND-logic rule says both axes
must consent; consumer code that treats Inconclusive as
"probably ok" would re-introduce the bug. **No consumer may
include Inconclusive rows.**

### 2. **County-scoped — `CountyId` is required input.**

Per CLAUDE.md sovereign-county isolation:

```
SELECT ... FROM CanonicalSaleQualifications
WHERE  CountyId         = @countyId
  AND  ComputedDecision = 'Qualified'
```

There is no "all counties" comp filter. Multi-county comp
queries require explicit per-county invocation.

### 3. **Read-only.**

The filter is a SELECT. C37-B may implement it as an EF read
service AND a SQL view; both must be read-only. The filter
NEVER mutates `CanonicalSaleQualifications` (the C36 writer is
the only writer) and NEVER mutates PACS (the C36 row reader
is the only reader, and that's read-only too).

### 4. **No workbook-side reads from the filter.**

C37-B's filter does NOT call `LoadMappedAsync` or query
`SyncMappingWorkbooks`. The canonical landing table is the
sole input. The workbook's lock-state is enforced upstream by
C36's writer (Draft / Approved / Archived workbooks fail
closed at `LoadMappedAsync` and never produce canonical rows
in the first place). The filter inherits that guarantee.

### 5. **No PII.**

The canonical landing row already excludes PII (no grantor /
grantee / address fields per C35-A's "Hard Guard 6"). The
filter inherits that exclusion. C37-B may not join in PII
columns from PACS, from `Properties`, or from `Owners`; if a
consumer needs property identifiers, that's a separate
slice with its own policy.

### 6. **Idempotent.**

Same `(CountyId, optional workbook pin)` input ⇒ same comp
pool output. The filter has no time-windowing, no
randomization, no operator-context state. It is a pure
projection.

### 7. **Workbook-pin is optional, not silent.**

Consumers that need to pin to a specific workbook lock-version
may pass an optional `SourceWorkbookId`. When supplied, the
filter adds:

```
AND SourceWorkbookId = @sourceWorkbookId
```

When NOT supplied, the filter returns all Qualified rows
regardless of which workbook produced them — useful when the
operator has re-locked the workbook and wants the latest
canonical decisions.

This is opt-in pinning. The filter does NOT default to "the
most recent workbook" because that would silently mask
workbook drift. If the consumer cares about pin, the consumer
asks for it explicitly.

### 8. **No collateral mutation.**

The filter does not write to `AuditLogs`, does not bump
`UpdatedAt` on the canonical row, does not increment any
counter. Read = read. Audit logging of comp-pool queries is a
separate concern handled by the consumer's own audit policy.

## Filter shape

### EF read service contract (C37-B-implements)

```csharp
public interface ISalesCompEligibilityReader
{
    /// <summary>
    /// Return the comp-eligible sales for a county. Optionally
    /// pinned to a specific Mapped workbook id.
    /// </summary>
    Task<IReadOnlyList<CompEligibleSale>> ReadAsync(
        Guid countyId,
        Guid? sourceWorkbookId,           // optional pin
        CancellationToken cancellationToken = default);
}

public sealed record CompEligibleSale(
    int       ChgOfOwnerId,
    string?   WacCdSourceValue,
    string?   WacCdCanonicalValue,
    string?   SlRatioTypeCdSourceValue,
    string?   SlRatioTypeCdCanonicalValue,
    DateTime? SaleDate,
    decimal?  SalePrice,
    Guid      SourceWorkbookId,
    DateTime  SourceWorkbookLockedAt);
```

### SQL view (C37-B-implements)

```sql
CREATE OR REPLACE VIEW vw_sales_comp_eligible AS
SELECT
    "CountyId",
    "ChgOfOwnerId",
    "WacCdSourceValue",
    "WacCdCanonicalValue",
    "SlRatioTypeCdSourceValue",
    "SlRatioTypeCdCanonicalValue",
    "SaleDate",
    "SalePrice",
    "SourceWorkbookId",
    "SourceWorkbookLockedAt"
FROM    "CanonicalSaleQualifications"
WHERE   "ComputedDecision" = 1;   -- Qualified
```

The view exists for ad-hoc analyst SQL (the operator's daily
dashboard pattern). It does NOT replace the EF reader; both
exist to give callers their natural surface.

The view is `WHERE ComputedDecision = 1` because the enum is
stored as int (per C35-B's EF configuration). The view is
locked to that mapping.

### Index already in place

C35-B's EF configuration adds:

```sql
CREATE INDEX IX_CanonicalSaleQualifications_County_Decision
  ON "CanonicalSaleQualifications" ("CountyId", "ComputedDecision");
```

This index covers the filter's two-column predicate. C37-B does
NOT add new indices.

## End-to-end proof contract (what C37-B must demonstrate)

C37-B's proof script must produce evidence that:

1. **The chain runs end-to-end.** Live (or fixture) PACS →
   C36 runner → CanonicalSaleQualifications → C37 filter →
   comp pool counts.

2. **The WacCd-bug containment is mechanical.** The proof must
   show, for the locked Mapped workbook
   `a767c8a2-5b8a-4846-af8b-c3496601e924`:
   - Total PACS sales read (bounded — C8-C-style TOP-N).
   - C36 decision counts (Qualified / Excluded / Inconclusive /
     SkippedNoIdentifier).
   - C37 comp-pool count (== Qualified count).
   - **Sample of excluded sales** with their `wac_cd` source
     values, demonstrating the operator-tagged
     `458-61A-217(1)`-style codes are excluded by the filter.
   - **Sample of inconclusive sales** with their `wac_cd`
     source values, demonstrating workbook-silent codes (the
     2017 conversion caveat surface) are excluded by the
     filter.

3. **The numbers reconcile.** For the proof to count as a pass:

   ```
   PACS rows read = Qualified + Excluded + Inconclusive + SkippedNoIdentifier
   Comp pool rows = Qualified
   ```

   No off-by-one, no duplicates, no silent drops.

4. **County isolation is intact.** The proof should run for
   Benton County only. The comp filter result must contain
   zero rows from any other CountyId.

5. **No collateral mutation.** Pre/post snapshots of (a) the
   workbook's `Status`, `UpdatedAt`, columns, code-values, (b)
   PACS row count via the source connection, (c) other
   canonical landing tables (`Owners`, `OwnershipEvents`,
   `LandSegments`, `ImprovementDetails`, `SyncRecords`) must
   match exactly. C36 already covers (a) and most of (c) with
   tests; the proof script re-asserts them at proof time.

6. **Evidence persisted.** The proof script writes a
   timestamped JSON + Markdown pair to:

   ```
   os-platform/core/pilot/evidence/
       c37-comp-eligibility-proof.<UTC-timestamp>.json
       c37-comp-eligibility-proof.<UTC-timestamp>.md
   ```

   The JSON is for downstream-script consumption; the Markdown
   is for human review. Both contain the same numbers, the
   same sample rows, and the same workbook-pin metadata.

7. **Re-runnability.** The proof script may be run twice in
   succession against the same PACS state and same workbook
   lock and produce identical comp-pool counts (idempotent
   per Hard Guard 6). The second run's evidence file may
   differ only in the timestamp and in `RowsPersisted` (which
   becomes `0 inserts + N upserts-in-place` per C36's
   idempotent re-write semantics — both still satisfy the
   reconciliation rule).

## C37-B success gates

C37-B is accepted only when ALL of:

1. `ISalesCompEligibilityReader` + `CompEligibleSale` shipped.
2. `vw_sales_comp_eligible` SQL view migration applied to live
   Postgres.
3. Tests landed:
   - Filter returns only `Qualified` rows.
   - Filter respects optional workbook pin.
   - Filter respects county isolation.
   - Filter is read-only (pre/post snapshot).
   - Workbook-silent codes (`Inconclusive`) are excluded.
   - Operator-tagged codes (`Excluded`) are excluded.
4. Proof script runs against fixture (synthetic Mapped
   workbook + synthetic sales) AND produces a valid evidence
   pair that satisfies the reconciliation rule.
5. Full Sync test suite green (regression gate, current
   baseline 825 / 825).
6. No workbook mutation, no PACS mutation, no collateral
   canonical landing mutation.

The "live PACS proof against workbook
`a767c8a2-5b8a-4846-af8b-c3496601e924`" is C37-C's territory
(if the operator wants a live-PACS proof beyond the fixture
proof). C37-B closes when fixture proof + tests are green.

## Forbidden semantics (no scope creep)

C37 is the **eligibility filter**, not:

- a comp-pricing surface (selecting eligible sales is not the
  same as scoring them or computing comp value)
- a sale-similarity scorer (lives in the future Forge surface;
  not in this slice)
- a ratio-study tool (ratio study uses these rows as input
  but lives in its own slice with its own policy)
- a workbook-drift detector (workbook drift surfaces in the
  C7-B read model; not here)
- a re-evaluation trigger (this filter never causes the C36
  writer to re-run)
- a comp-pool persistence surface (C37-B does NOT write a
  `CompPools` table; the filter is computed on read)

If a future slice wants any of those, it writes its own
policy doc and references this one as input.

## What this slice does NOT change

- Does not modify `CanonicalSaleQualifications` schema
  (C35-B's territory, locked).
- Does not modify the C36 writer or runner (C36's territory,
  locked).
- Does not modify the workbook (C7 / C32 / C34 territory).
- Does not modify PACS (read-only invariant; out of scope
  forever for this slice).
- Does not introduce a new audit table (FISMA audit lives in
  `AuditLogs`; comp-pool queries audit at the consumer
  level).
- Does not introduce a new operator-facing UI (Forge surface
  territory; later slice).

## Open questions deferred to C37-B

- **Workbook-pin default.** Hard Guard 7 says no implicit
  default. C37-B may need to surface a UI hint when no
  workbook is pinned and the canonical table contains rows
  from multiple workbook versions. Out of scope for this
  policy doc; flagged for the implementation slice.
- **Sale-snapshot freshness.** `SaleDate` and `SalePrice` on
  the canonical row are PACS-read-time snapshots; if PACS has
  since updated (e.g. price correction), the snapshot is
  stale. C37 does not refresh; consumers needing fresh
  PACS data go through a different surface. C37-B's evidence
  output should disclose this.
- **Empty-result semantics.** C37-B's reader returns an empty
  list for unknown county / no-Qualified-rows. It does NOT
  throw. This is consistent with C35-A's "consumer must
  treat Inconclusive as not-yet-evaluated" stance: zero
  comps is a valid state, not an exception.

## Glossary (slice-local)

- **Comp-eligible** — a canonical sale row whose
  `ComputedDecision = Qualified`.
- **Comp pool** — the set of comp-eligible sales for a county
  at a moment in time, as returned by the filter.
- **Workbook-pin** — optional input that restricts the filter
  to canonical rows produced by a specific
  `SourceWorkbookId`.
- **Reconciliation rule** — `RowsRead = Qualified + Excluded
  + Inconclusive + SkippedNoIdentifier` and `CompPoolSize =
  Qualified`. The proof's structural integrity check.
- **WacCd-bug containment** — the property that pre-conversion
  / unmapped / problematic `wac_cd` codes never enter the
  comp pool because they land as Excluded or Inconclusive in
  the canonical landing table and the filter rejects both.
