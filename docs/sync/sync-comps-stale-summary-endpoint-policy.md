# Sync Comps Stale-Row Summary Endpoint Policy

**Slice:** C44-A (docs-only — defines the contract for an
aggregation endpoint that surfaces stale-row counts grouped by
`(SourceWorkbookId, ComputedDecision)` per county. C44-B will
land the EF reader + controller action + tests. This slice writes
the contract, not the code.).
**Lifecycle layer:** API (TerraFusion.Kernel) read surface.
Aggregation projection over the existing
`CanonicalSaleQualifications` table; no new schema, no new write
surface, no canonical / PACS mutation.
**Status:** policy locked; implementation deferred to C44-B.

## Why this slice

C43-B shipped the per-row stale diagnostic at
`GET /api/sync/comps/stale`. It answers "**which** rows are
stale?" with paginated row detail. C43-A flagged a complementary
question:

> Operators may want "5 stale Qualified rows pointing at workbook
> X, 12 stale Excluded rows pointing at workbook Y" without
> paginating through the full set. That's a future C44+
> aggregation endpoint slice with its own contract.

C44-A fills that gap.

The use cases are operational and DASHBOARD-shaped:

1. **Pre-flight check before a C36 re-run.** Before triggering
   the `SalesCompProof` tool against a new active workbook, the
   operator wants a one-screen summary of how many rows would
   rotate, broken down by decision and prior workbook.
2. **Workbook lifecycle audit.** "We've accumulated rows from 4
   prior workbooks since 2026-01-01; how many of each are still
   on disk?" — answers in a single GET.
3. **Cross-version reconciliation hint.** A consumer reports
   "the comp pool dropped by N." The summary surfaces "N rows
   are stale on workbook W; that's likely the cause."
4. **Operations dashboard tile.** A future Workbench / Forge
   "Sync Health" panel can render the summary directly without
   paginating through detail rows.

Per the locked sequence:

```
C43-A ✓ stale-row diagnostic endpoint policy
C43-B ✓ per-row reader + controller + 14-test matrix
C44-A   stale-row summary endpoint policy            ← THIS SLICE
C44-B   summary reader + controller + tests
```

## Provenance

- **C35-A — Canonical landing schema.** Defines the row shape
  the aggregation reads.
- **C37-A — Comp-eligibility filter policy.** Inherits the
  read-only / county-isolated / no-PII / idempotent guards.
- **C38-A — Comps API endpoint policy.** Inherits the auth +
  county-isolation server-side pattern.
- **C40-A — Workbook lock-lifecycle + canonical staleness
  policy.** Defines "stale" precisely.
- **C41-A / B / C — Active-workbook pointer.** Provides the
  baseline workbook id the endpoint compares against when the
  caller omits `workbookId`.
- **C42-A — SalesCompProof CLI baseline-resolution pattern.**
  C44-B reuses the same explicit-or-pointer-or-400 logic.
- **C43-A — Stale-row diagnostic policy.** Sibling endpoint;
  C44 inherits its baseline-resolution rule, fail-closed
  message, and "stale" definition. C44 is NOT a replacement —
  both endpoints exist alongside each other.
- **CLAUDE.md** — sovereign-county isolation, FISMA audit.

## Purpose

Define the HTTP contract for the **stale-row aggregate
summary** read surface:

```
GET /api/sync/comps/stale/summary?countyId={guid}&workbookId={guid?}
```

Returns aggregate counts of stale rows for the county, grouped
by `(SourceWorkbookId, ComputedDecision)`, plus a single
top-line `totalStaleRows` count.

This is a **bounded** read — the result set is at most one row
per (prior workbook id, decision) pair, capped server-side
(Hard Guard 4 below). NOT paginated; the bound replaces
pagination.

## Hard guards

These guards lock the contract for C44-B. C44-B may not relax
them.

### 1. **Pure projection of `CanonicalSaleQualifications`.**

The endpoint runs ONE aggregation query: `WHERE CountyId =
@countyId AND SourceWorkbookId <> @baselineWorkbookId GROUP BY
SourceWorkbookId, ComputedDecision`. No joins to
`SyncMappingWorkbook`, no joins to PACS, no enrichment of the
prior-workbook id. The output's `sourceWorkbookId` is the
prior-workbook id verbatim.

### 2. **Authenticated; county-isolated server-side.**

Inherits the C38-A endpoint contract: `[Authorize]` required,
principal `countyId` claim must match the requested
`countyId`, cross-county callers receive 403.

### 3. **Read-only — `GET` only.**

Other verbs return `405 Method Not Allowed`. The endpoint does
NOT delete rows, does NOT trigger C36, does NOT mutate
`AuditLogs`.

### 4. **Server-bounded result set.**

The aggregation MUST cap returned groups at a server-side
maximum. The cap is **`100` groups**. Reasoning:

- Typical county: ≤ 5 prior workbooks × 3 decisions = 15
  groups. Way under cap.
- Worst-case for a long-running county over many years: still
  bounded by mapping-revision frequency × 3 decisions. 100
  groups represents ~33 prior workbooks — far beyond any
  realistic operator history.
- Without the cap, a corrupted canonical landing (e.g.
  `SourceWorkbookId` somehow randomized) could return
  unbounded result. Defense in depth.

When the result would exceed 100 groups, the response is
**still 200 OK** with the FIRST 100 groups (sorted by
descending `count`) plus a `truncated: true` flag and the
total group count. C44-B does NOT throw on overflow; it
truncates and signals.

### 5. **Baseline workbook MUST resolve.**

Resolution mirrors C43-A Hard Guard 4 verbatim:

- **Explicit `workbookId` (non-empty Guid)** → use directly.
- **Omitted / `Guid.Empty`** → consult the C41-B
  active-workbook pointer.
- **Omitted AND no pointer** → **400 Bad Request** with the
  locked message:

  > `Cannot summarize staleness for county <countyId>: no
  > workbookId supplied and no active-workbook pointer is
  > configured. Provide ?workbookId= or set the county active
  > workbook.`

The message structure mirrors C43-A's stale-row endpoint, with
"compute" → "summarize" so logs / consumer error handlers can
disambiguate which endpoint produced the failure.

### 6. **No PII.**

The DTO carries `SourceWorkbookId` (a Guid), `ComputedDecision`
(string), and `count` (int). No grantor / grantee / parcel /
sale snapshot. The summary is purely aggregate; per-sale detail
lives on the C43-B endpoint.

### 7. **Empty result is `200 OK`.**

A county with zero stale rows (every canonical row already
points at the baseline OR the county has no canonical rows at
all) returns `200 OK` with `groups: []` and
`totalStaleRows: 0`. NEVER `404`.

### 8. **Group ordering locked: `count` DESC, then
   `sourceWorkbookId` ASC.**

The list is sorted by descending count first (so the operator
sees the largest stale buckets at the top of the response).
Ties on count break by ascending `SourceWorkbookId` so the
ordering is deterministic across runs.

This is intentionally different from C39-B / C43-B's
`ChgOfOwnerId` ASC ordering: those endpoints return per-row
data where stable cursoring matters; this endpoint returns
aggregate data where the operator wants the biggest buckets
first.

### 9. **Idempotent.**

Same input ⇒ same output (modulo C36 writes between calls).

### 10. **Audit at consumer level only.**

Operational logging via `LogInformation` for telemetry. NO
`AuditLogs` writes — this is a read.

### 11. **No pagination, no `page`/`pageSize` params.**

The result is bounded (Hard Guard 4) so pagination is
unnecessary. Adding pagination later is a breaking change
requiring its own slice. C44-B MUST reject `?page=` or
`?pageSize=` with a 400 explicitly so future callers don't
silently get unpaginated data when they expect a page.

### 12. **No collateral mutation.**

Reading does not bump `UpdatedAt` on canonical rows, does not
touch the active-workbook pointer (only reads it), does not
increment any counter.

## Endpoint shape

### Route + verbs

```
GET /api/sync/comps/stale/summary
GET /api/sync/comps/stale/summary?countyId={guid}
GET /api/sync/comps/stale/summary?countyId={guid}&workbookId={guid}
```

All other verbs → `405 Method Not Allowed`.
`?page=` / `?pageSize=` → `400` (Hard Guard 11).

### Query parameters

| Name         | Type | Required | Notes                                                                 |
|--------------|------|----------|-----------------------------------------------------------------------|
| `countyId`   | Guid | yes      | Sovereign-county scope. Matched against principal claim.              |
| `workbookId` | Guid | no       | Baseline for staleness comparison. Hard Guard 5 governs resolution.   |

### Response (200 OK)

```json
{
  "countyId": "eb94de6d-973f-4997-b257-ae1eac352ac7",
  "baselineWorkbookId": "a767c8a2-5b8a-4846-af8b-c3496601e924",
  "baselineSource": "active-workbook-pointer",
  "totalStaleRows": 17,
  "groupCount": 3,
  "groups": [
    {
      "sourceWorkbookId": "11111111-2222-3333-4444-555555555555",
      "computedDecision": "Excluded",
      "count": 12
    },
    {
      "sourceWorkbookId": "11111111-2222-3333-4444-555555555555",
      "computedDecision": "Qualified",
      "count": 4
    },
    {
      "sourceWorkbookId": "99999999-aaaa-bbbb-cccc-dddddddddddd",
      "computedDecision": "Inconclusive",
      "count": 1
    }
  ],
  "truncated": false
}
```

### Suggested DTOs

```csharp
namespace TerraFusion.Core.DTOs.Sync;

public sealed record StaleSummaryGroupDto(
    Guid   SourceWorkbookId,
    string ComputedDecision,                        // wire-stable string
    int    Count);

public sealed record StaleSummaryDto(
    Guid                                  CountyId,
    Guid                                  BaselineWorkbookId,
    string                                BaselineSource,    // "explicit-query-param" | "active-workbook-pointer"
    int                                   TotalStaleRows,
    int                                   GroupCount,        // total groups before any truncation
    IReadOnlyList<StaleSummaryGroupDto>   Groups,
    bool                                  Truncated);        // true iff GroupCount > MaxGroups
```

The `Groups` array carries at most `MaxGroups = 100` entries.
`GroupCount` is the **total** number of distinct groups before
truncation; `Truncated` is `true` iff `GroupCount > 100`. This
lets the consumer detect overflow and (if needed) ask the
operator to investigate.

`ComputedDecision` is serialized as the enum's string name for
wire stability (matches C43-B).

### Error responses

| Status | When                                                                                                           |
|--------|----------------------------------------------------------------------------------------------------------------|
| 400    | `countyId` missing / malformed / `Guid.Empty`. `workbookId` malformed. Hard Guard 5 trigger. `?page=` / `?pageSize=` rejected (Hard Guard 11). |
| 401    | No bearer token / invalid bearer token.                                                                        |
| 403    | Authenticated principal lacks access to the requested `countyId`.                                              |
| 405    | Verb is not `GET`.                                                                                             |

## C44-B success gates

C44-B is accepted only when ALL of:

1. `StaleSummaryDto` + `StaleSummaryGroupDto` shipped at the
   path above.
2. `ISalesCompStaleSummaryReader` interface + implementation:
   - `Task<IReadOnlyList<StaleSummaryGroupRow>> GroupAsync(
     countyId, baselineWorkbookId, maxGroups, ct)`
   - `Task<int> GroupCountAsync(countyId,
     baselineWorkbookId, ct)` (so the controller can detect
     truncation cheaply without materializing all groups)
   - `Task<int> TotalStaleRowsAsync(countyId,
     baselineWorkbookId, ct)` (single-`COUNT(*)` query for the
     top-line)
3. Reader uses `AsNoTracking()`. Single-predicate filter +
   GROUP BY at the SQL layer — no joining, no client-side
   aggregation.
4. `SyncController.GetStaleCompsSummary` action shipped at
   `[HttpGet("comps/stale/summary")]` with `[Authorize]`.
   County-isolation guard via principal claim. 400 rejection
   for `?page=` / `?pageSize=` parameters.
5. Baseline resolution mirrors C43-B verbatim (refactor the
   existing logic into a shared private helper if it gets
   duplicated; keep both endpoints in lockstep).
6. Tests landed (full matrix below).
7. Full Sync Unit.Tests `Tests.Sync.` namespace regression
   green (current 67 / 67).
8. Full Sync Integration regression green (current 782 / 782).
9. R2Wave44 SyncController regression preserved (12 / 12).
10. Existing C43-B per-row endpoint behavior preserved
    (no shared-state regression in `SyncControllerStaleCompsTests`).

## C44-B test matrix

The implementation slice MUST land tests covering:

1. **200 happy path with explicit baseline** — county has rows
   on multiple prior workbooks; groups returned with correct
   counts.
2. **200 happy path with pointer-resolved baseline** —
   `baselineSource: "active-workbook-pointer"` echoes; same
   correctness as #1.
3. **400 when omitted AND no pointer** — exact locked message
   ("Cannot summarize staleness for county..." with all five
   substring components asserted).
4. **400 for empty `countyId`**.
5. **400 for `?page=` parameter** — Hard Guard 11.
6. **400 for `?pageSize=` parameter** — Hard Guard 11.
7. **403 for cross-county request**.
8. **403 for principal without `countyId` claim**.
9. **200 with empty groups when zero stale rows** —
   `groupCount: 0`, `totalStaleRows: 0`, `groups: []`,
   `truncated: false`.
10. **200 with empty groups when no canonical rows at all**.
11. **Group ordering: `count` DESC then `sourceWorkbookId`
    ASC** — verify with a deliberate tie-break scenario.
12. **`ComputedDecision` round-trips as wire string**
    (Qualified / Excluded / Inconclusive).
13. **`totalStaleRows` matches the sum of `groups[*].count`**
    when not truncated — invariant check.
14. **Truncation: when a county has > 100 groups,
    `truncated: true`, `groupCount: actual`, and `groups`
    carries the top-100 by count DESC**. Synthesize the
    scenario by seeding 101+ distinct workbook ids each with
    one stale row.
15. **Read-only contract** — pre/post DB snapshot equality
    across explicit + pointer + truncation reads.
16. **`baselineSource` echoes correctly across explicit /
    pointer / `Guid.Empty` paths** (mirrors the C43-B
    test).
17. **C43-B per-row total reconciliation** — for a given
    `(countyId, baselineWorkbookId)`, `summaryEndpoint.totalStaleRows
    == perRowEndpoint.totalCount`. Mechanically locks the two
    endpoints' agreement on stale-row count semantics.

## Forbidden semantics (no scope creep)

C44 is the **stale-row aggregate summary**. It is NOT:

- a refresh trigger (no POST that re-runs C36).
- a delete surface (no DELETE that purges stale rows).
- a per-row endpoint (that's C43-B).
- a sort-control endpoint (no `?sortBy=`; ordering is locked).
- a multi-county aggregation (county-scoped only).
- a workbook-A vs workbook-B comparison surface.
- a streaming / cursor endpoint.
- a paginated endpoint (Hard Guard 11).

If a future slice wants any of those, it writes its own policy
doc and references this one as input.

## What this slice does NOT change

- Does not modify `CanonicalSaleQualifications` schema.
- Does not modify the C36 writer / runner.
- Does not modify the C37-B comp-eligibility reader or its
  endpoint.
- Does not modify the C41 active-workbook pointer or its HTTP
  surface.
- Does not modify the C42-A `WorkbookIdResolver` (a similar
  helper may emerge in C44-B but it is the controller's
  concern, not the resolver's).
- Does not modify the C43-B stale-row reader / endpoint.
- Does not modify PACS.
- Does not introduce a new audit table or operator-facing UI.

## Open questions deferred to C44-B / later

- **Performance.** At Benton scale the GROUP BY is cheap. If
  a future county exceeds the 100-group cap routinely, C44-B
  may want a composite `(CountyId, SourceWorkbookId,
  ComputedDecision)` index — flagged for benchmarking in
  C44-B's slice card. Not added in this slice.
- **Workbook-name enrichment.** Operators may want
  `sourceWorkbookName` alongside the id for human readability.
  C44-A explicitly leaves the response Guid-only; a future
  slice can join workbook name with its own policy (likely
  with PII-free-name caveats since workbook names are
  operator-typed).
- **Time-window filter.** A future C45+ slice could let the
  operator restrict the summary to "rows decided since
  YYYY-MM-DD." Out of scope here.
- **Caching headers.** Stale-summary responses are
  deterministic for a given (countyId, baselineWorkbookId)
  until the next C36 write. `Cache-Control: max-age=N` keyed
  off the baseline workbook's `SourceWorkbookLockedAt` is a
  future optimization slice.

## Glossary (slice-local)

- **Stale row** — inherits the C40-A definition: a canonical
  row whose `SourceWorkbookId` differs from the baseline.
- **Baseline workbook** — inherits C43-A: explicit
  `workbookId` query param OR the C41-B active-workbook
  pointer.
- **Group** — one `(SourceWorkbookId, ComputedDecision)` pair
  with its row count.
- **Truncation** — when `GroupCount > 100`, the response
  carries only the top-100 groups by `count` DESC and signals
  `truncated: true`. Operator action: investigate the
  canonical landing for runaway workbook diversity.
- **Top-line** — `totalStaleRows`: the sum of all stale
  rows' counts, regardless of group cap (the cap applies to
  GROUP rows on the wire, not to the COUNT(*) total).
