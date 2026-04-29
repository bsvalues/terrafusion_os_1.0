# Sync Comps Stale-Row Diagnostic Endpoint Policy

**Slice:** C43-A (docs-only — defines the contract for a
diagnostic HTTP endpoint that surfaces canonical sale-qualification
rows whose <c>SourceWorkbookId</c> differs from the operator-active
workbook (the per-county "stale" set per C40-A). C43-B will land
the EF read service + controller action + tests. This slice writes
the contract, not the code.).
**Lifecycle layer:** API (TerraFusion.Kernel) read surface. Sits
beside the C38-B/C39-B comp-eligibility endpoint and the C41-C
active-workbook pointer endpoint. No new schema; no new write
surface; pure diagnostic projection over the existing
`CanonicalSaleQualifications` table.
**Status:** policy locked; implementation deferred to C43-B.

## Why this slice

C40-A locked the workbook lifecycle and named "stale" precisely:

> A canonical row whose `SourceWorkbookId` differs from the
> operator-active workbook is **stale** — its decision was
> computed against a prior mapping ruleset.

C40-A also flagged that consumers MUST decide whether to
include or filter stale rows; the C39-B paginated comp-eligibility
endpoint defers that to the consumer via the optional `workbookId`
pin. But neither C40-A nor C41 gives the operator a way to ASK
"which sales are stale?" — that's the gap C43-A fills.

The use cases are operational:

1. **Planning a C36 re-run.** Before triggering the C37-C tool to
   refresh canonical decisions against a new workbook, the
   operator wants to know how many rows would actually rotate
   their `SourceWorkbookId`.
2. **Diagnosing a comp pool delta.** A consumer (Forge / Studio /
   Dais) reports "I expected N comps and got M." The operator
   wants to see whether the missing rows are stale (under the
   prior workbook's rules) vs Excluded / Inconclusive under the
   active workbook's rules.
3. **Auditing workbook supersession.** "Workbook A was active
   from 2026-04-01 to 2026-04-29; how many decisions did
   Workbook B rotate?" The endpoint answers this without any
   side effect on the canonical landing.

Per the locked sequence:

```
C40-A ✓ workbook lock-lifecycle + canonical staleness policy
C40-B ✓ supersession invariant tests
C41-A ✓ active-workbook pointer policy
C41-B ✓ pointer entity + service + migration + tests
C41-C ✓ pointer HTTP surface
C42-A ✓ SalesCompProof CLI consumes pointer
C43-A   stale-row diagnostic endpoint policy             ← THIS SLICE
C43-B   stale-row reader + controller action + tests
```

## Provenance

- **C35-A — Canonical sales-qualification landing schema.**
  Defines the row shape this endpoint reads. `SourceWorkbookId`
  is the staleness axis.
- **C37-A — Comp-eligibility filter policy.** Defines the
  read-only / county-isolated / no-PII / idempotent guards
  C43 inherits.
- **C38-A — Comps API endpoint policy.** Defines the
  authentication + county-isolation server-side pattern C43
  reuses.
- **C39-A — Comps API pagination policy.** Defines the envelope
  shape C43 reuses.
- **C40-A — Workbook lock-lifecycle + canonical staleness
  policy.** Defines "stale" precisely (Invariant 5: stale rows
  are under-evaluated, not wrong) and lists this diagnostic
  endpoint as a deferred future-slice option.
- **C41-A / C41-B / C41-C — Active-workbook pointer.** Provides
  the baseline workbook id the endpoint compares against when
  the caller omits `workbookId`.
- **CLAUDE.md** — sovereign-county isolation, FISMA audit.

## Purpose

Define the HTTP contract for the **stale-row diagnostic** read
surface:

```
GET /api/sync/comps/stale?countyId={guid}&workbookId={guid?}&page={int?}&pageSize={int?}
```

The endpoint returns canonical sale-qualification rows whose
`SourceWorkbookId` differs from the comparison workbook id (the
caller's `workbookId` if supplied, else the county active-workbook
pointer). Each returned row is "stale" in the C40-A sense.

This is a **diagnostic** endpoint — operationally useful for
re-run planning and audit, NOT a consumer surface for comp pools.
Consumers building comp pools MUST use the C39-B
`/api/sync/comps/eligible` endpoint with an explicit workbook pin;
this endpoint exists alongside it for diagnostic visibility.

## Hard guards

These guards lock the contract for C43-B. C43-B may not relax
them.

### 1. **Pure projection of `CanonicalSaleQualifications`.**

The endpoint runs ONE query against the canonical landing table
(plus optionally the C41-B pointer table for baseline
resolution). No joins to `Properties`, no joins to PACS, no
joins to `SyncMappingWorkbook`. The output's
`SourceWorkbookId` is the prior-workbook id verbatim from the
canonical row.

### 2. **Authenticated; county-isolated server-side.**

Inherits the C38-A endpoint contract: `[Authorize]` required,
principal `countyId` claim must match the requested
`countyId`, cross-county callers receive 403. Same shape as
the comps endpoint and the active-workbook endpoint.

### 3. **Read-only — `GET` only.**

`POST` / `PUT` / `PATCH` / `DELETE` against this route return
`405 Method Not Allowed`. The endpoint does NOT delete stale
rows, does NOT trigger C36 to refresh them, does NOT mutate
`AuditLogs`. Read = read.

### 4. **Baseline workbook MUST resolve.**

The endpoint computes staleness relative to a baseline
workbook id. The baseline resolves identically to C42-A's
`WorkbookIdResolver` rule:

- **Explicit `workbookId` query param** (when non-empty Guid)
  → use it as the baseline.
- **Omitted / `Guid.Empty`** → look up the C41-B
  active-workbook pointer for the county.
- **Omitted AND no pointer** → return `400 Bad Request` with
  the verbatim message:

  > `Cannot compute staleness for county <countyId>: no
  > workbookId supplied and no active-workbook pointer is
  > configured. Provide ?workbookId= or set the county
  > active workbook.`

This is a hard fail. The endpoint MUST NOT default to "any
workbook id from any canonical row" — that would silently
return non-deterministic staleness comparisons.

### 5. **No PII.**

The DTO carries the canonical row's PII-free fields plus
`SourceWorkbookId` and `SourceWorkbookLockedAt`. No grantor /
grantee / parcel join / address.

### 6. **Empty result is `200 OK` with `items: []`.**

A county with zero stale rows (every canonical row already
points at the baseline workbook) returns `200 OK` with the
full envelope, `items: []`, `totalCount: 0`. NEVER `404`.
Mirrors C38-A Hard Guard 6.

### 7. **Pagination shape mirrors C39-B verbatim.**

Same query params (`page`, `pageSize`), same defaults
(`page=1`, `pageSize=100`), same max (`pageSize=500`), same
validation rejections (400 for `page<1` / `pageSize<1` /
`pageSize>500`), same envelope shape. `PagedStaleSaleDto` is
a separate DTO type from `PagedCompEligibleSalesDto` because
the per-row shape differs (this endpoint always carries a
`ComputedDecision` since stale rows can be any decision).

### 8. **Ordering locked: `ChgOfOwnerId` ASC.**

Inherits C39-A Hard Guard 4 — same reasoning (NOT NULL,
indexed-friendly, deterministic across pages).

### 9. **Idempotent.**

Same request returns the same result set unless C36 has
rotated rows in the meantime. No randomization, no time
windowing.

### 10. **No PII / no row-level auth beyond county.**

If a future slice introduces row-level auth on canonical
rows (e.g. "this principal can only see sales for parcels
in their assessment district"), this endpoint will need its
own slice to plumb that policy. Out of scope for C43-A.

### 11. **Audit at consumer level only.**

Operational logging via `LogInformation` for telemetry. NO
`AuditLogs` writes — this is a read, not a state mutation.

### 12. **No collateral mutation.**

Reading does not bump `UpdatedAt` on canonical rows, does
not increment any counter, does not touch the active-workbook
pointer (only reads it).

## Endpoint shape

### Route + verbs

```
GET /api/sync/comps/stale
GET /api/sync/comps/stale?countyId={guid}
GET /api/sync/comps/stale?countyId={guid}&workbookId={guid}
GET /api/sync/comps/stale?countyId={guid}&page={int}&pageSize={int}
GET /api/sync/comps/stale?countyId={guid}&workbookId={guid}&page={int}&pageSize={int}
```

All other verbs → `405 Method Not Allowed`.

### Query parameters

| Name         | Type | Required | Default | Notes                                                                 |
|--------------|------|----------|---------|-----------------------------------------------------------------------|
| `countyId`   | Guid | yes      | n/a     | Sovereign-county scope. Matched against principal claim.              |
| `workbookId` | Guid | no       | resolved via active-workbook pointer | Baseline for staleness comparison. Hard Guard 4 governs resolution. |
| `page`       | int  | no       | `1`     | 1-based page index. Must be ≥ 1.                                      |
| `pageSize`   | int  | no       | `100`   | Rows per page. Must be ≥ 1 and ≤ `500`.                               |

### Response envelope (200 OK)

```json
{
  "items": [
    {
      "chgOfOwnerId": 1001,
      "computedDecision": "Qualified",
      "wacCdSourceValue": "458-61A-203(1)",
      "wacCdCanonicalValue": "ArmsLengthSale",
      "slRatioTypeCdSourceValue": "00",
      "slRatioTypeCdCanonicalValue": "Conventional",
      "saleDate": "2025-06-15T00:00:00Z",
      "salePrice": 425000.00,
      "sourceWorkbookId": "11111111-2222-3333-4444-555555555555",
      "sourceWorkbookLockedAt": "2026-03-15T20:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 100,
  "totalCount": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false,
  "baselineWorkbookId": "a767c8a2-5b8a-4846-af8b-c3496601e924",
  "baselineSource": "active-workbook-pointer"
}
```

The envelope adds two fields beyond the C39-B
`PagedCompEligibleSalesDto`:

- `baselineWorkbookId`: the workbook id used as the
  staleness baseline (echoes the resolution result so the
  consumer can audit which workbook was compared against).
- `baselineSource`: either `"explicit-query-param"` or
  `"active-workbook-pointer"` so the consumer knows whether
  the operator passed `workbookId` or the pointer was
  resolved.

### Per-row DTO

```csharp
namespace TerraFusion.Core.DTOs.Sync;

/// <summary>
/// Slice C43-B per-row shape for stale canonical sale rows.
/// Carries the canonical row's stale-relevant fields plus
/// SourceWorkbookId / SourceWorkbookLockedAt so the consumer can
/// reason about the row's provenance vs the baseline.
/// </summary>
public sealed record StaleSaleQualificationDto(
    int       ChgOfOwnerId,
    string    ComputedDecision,                  // enum-as-string for wire stability
    string?   WacCdSourceValue,
    string?   WacCdCanonicalValue,
    string?   SlRatioTypeCdSourceValue,
    string?   SlRatioTypeCdCanonicalValue,
    DateTime? SaleDate,
    decimal?  SalePrice,
    Guid      SourceWorkbookId,
    DateTime  SourceWorkbookLockedAt);

public sealed record PagedStaleSaleQualificationsDto(
    IReadOnlyList<StaleSaleQualificationDto> Items,
    int    Page,
    int    PageSize,
    int    TotalCount,
    int    TotalPages,
    bool   HasNextPage,
    bool   HasPreviousPage,
    Guid   BaselineWorkbookId,
    string BaselineSource);
```

`ComputedDecision` is serialized as the enum's string name
(`"Qualified"` / `"Excluded"` / `"Inconclusive"`) for wire
stability. C43-B uses a `JsonStringEnumConverter` or projects
to string in EF; the choice is C43-B's, but the wire shape is
locked.

### Error responses

| Status | When                                                                                |
|--------|-------------------------------------------------------------------------------------|
| 400    | `countyId` missing / malformed / `Guid.Empty`. `workbookId` malformed. `page`/`pageSize` validation. **`workbookId` omitted AND no active pointer (Hard Guard 4).** |
| 401    | No bearer token / invalid bearer token.                                             |
| 403    | Authenticated principal lacks access to the requested `countyId`.                   |
| 405    | Verb is not `GET`.                                                                  |

## C43-B success gates

C43-B is accepted only when ALL of:

1. `StaleSaleQualificationDto` + `PagedStaleSaleQualificationsDto`
   shipped at the path above.
2. `ISalesCompStaleReader` interface + implementation:
   - `Task<IReadOnlyList<StaleSaleQualificationDto>>
     ReadPageAsync(countyId, baselineWorkbookId, page, pageSize, ct)`
   - `Task<int> CountAsync(countyId, baselineWorkbookId, ct)`
   - Single SQL predicate:
     `WHERE CountyId = @countyId AND SourceWorkbookId <> @baselineWorkbookId`
3. Reader uses `AsNoTracking()` and the existing
   `IX_CanonSaleQual_County_Decision` index (or a future
   per-workbook index if C43-B finds the predicate is slow at
   scale). C43-B does NOT add a new index in this slice unless
   benchmarks demand it; if it does, the index addition is
   called out in the migration / commit.
4. `SyncController.GetStaleComps` action shipped at
   `[HttpGet("comps/stale")]` with `[Authorize]`. County-isolation
   guard via principal claim (mirrors `GetEligibleComps`).
5. Baseline resolution:
   - Explicit `workbookId` (non-empty Guid) → use directly.
   - Otherwise → consult `ISyncCountyActiveWorkbookService.GetAsync`.
   - No pointer → 400 with the locked Hard Guard 4 message.
6. Tests landed (full matrix below).
7. Full Sync Integration regression green (current baseline
   782 / 782).
8. Full Sync Unit.Tests regression green (current 48 / 48 in
   `Tests.Sync.` namespace).
9. C42-A SalesCompProof CLI behavior preserved (the resolver
   is a separate code path; this slice does not touch it).
10. `R2Wave44SyncControllerTests` regression preserved
    (12 / 12).

## C43-B test matrix

The implementation slice MUST land tests covering:

1. **200 happy path with explicit `workbookId`** — county has a
   mix of stale (pointing at older workbook) and current rows;
   only stale ones are returned.
2. **200 happy path with implicit pointer-resolved
   `workbookId`** — same setup but operator omits the param;
   pointer service is consulted; envelope's `baselineSource`
   is `"active-workbook-pointer"`.
3. **400 when omitted AND no pointer** — exact locked message.
4. **400 for empty `countyId`**.
5. **400 for malformed pagination params** (page<1, pageSize<1,
   pageSize>500) — three theory cases.
6. **403 for cross-county request** — same shape as
   `GetEligibleComps`.
7. **403 for principal without `countyId` claim**.
8. **200 with empty `items: []`** when every canonical row
   already points at the baseline.
9. **200 with empty `items: []`** when the county has zero
   canonical rows at all.
10. **Pagination round-trip** — three pages of stale rows;
    union equals unpaginated set; no duplicates; deterministic
    ChgOfOwnerId-asc ordering.
11. **`ComputedDecision` carried as string verbatim** —
    Qualified / Excluded / Inconclusive each round-trip
    correctly.
12. **Read-only contract** — pre/post DB snapshot equality
    after multiple reads with both explicit and pointer-resolved
    baselines.
13. **`baselineWorkbookId` echoes correctly** — request with
    explicit param has `baselineSource: "explicit-query-param"`
    and matching id; request without param has
    `baselineSource: "active-workbook-pointer"` and the
    pointer's id.
14. **Workbook from another county is invalid baseline** —
    C43-B may reject this with 400 OR treat it as "no rows
    match" (every row is stale relative to a foreign workbook).
    The slice card decides; this policy doc does NOT mandate.
    Recommendation: 400 if C43-B can validate cheaply; else
    "every row is stale" (which the consumer's UI can flag).

## Forbidden semantics (no scope creep)

C43 is the **stale-row diagnostic** projection. It is NOT:

- a refresh trigger (no POST that re-runs C36).
- a delete surface (no DELETE that purges stale rows).
- a sort-control endpoint (no `?sortBy=`).
- a filter-control endpoint (no `?decision=`, `?wacCd=`).
- a comp-pricing / similarity / ranking surface.
- a multi-county aggregation (county-scoped only).
- a workbook-comparison surface (compare workbook A vs B
  without going through canonical rows). That's a separate
  slice if needed.
- a streaming / cursor endpoint.

If a future slice wants any of those, it writes its own
policy doc and references this one as input.

## What this slice does NOT change

- Does not modify `CanonicalSaleQualifications` schema.
- Does not modify the C36 writer / runner.
- Does not modify the C37-B comp-eligibility reader.
- Does not modify the C38-B / C39-B comps endpoint.
- Does not modify the C41 active-workbook pointer or its HTTP
  surface.
- Does not modify the C42-A `WorkbookIdResolver` (a similar
  helper may emerge in C43-B but it is the controller's
  concern, not the resolver's; the SalesCompProof tool is
  unaffected).
- Does not modify PACS.
- Does not introduce a new audit table.
- Does not introduce a new operator-facing UI.

## Open questions deferred to C43-B / later

- **Cross-county baseline.** Test #14 above flags this. C43-B
  decides — recommend 400 with an explicit message ("workbook
  X is in county Y; cannot use as baseline for county Z"). Out
  of scope for C43-A.
- **Performance.** At Benton scale (~89k parcels → some-thousand
  qualifying sales) the predicate is cheap. If a future county
  has tens of thousands of stale rows, C43-B may want a
  composite index `(CountyId, SourceWorkbookId)` — flagged for
  benchmarking in C43-B's slice card.
- **Caching.** Stale-row counts can lag canonical writes by
  whatever caching window the consumer applies. C43-A inherits
  C39-A's "no caching headers this slice" stance; future
  caching is a separate slice.
- **Aggregation summaries.** Operators may want "5 stale
  Qualified rows pointing at workbook X, 12 stale Excluded
  rows pointing at workbook Y" without paginating through the
  full set. That's a future C44+ aggregation endpoint slice
  with its own contract.

## Glossary (slice-local)

- **Baseline workbook** — the workbook id staleness is computed
  relative to. Either the explicit `workbookId` query param OR
  the C41-B active-workbook pointer.
- **Stale row** — a row in `CanonicalSaleQualifications` whose
  `SourceWorkbookId` differs from the baseline. Inherits the
  C40-A definition without modification.
- **Re-run plan** — the operator's planned C36 invocation that
  would rotate stale rows. C43 does not trigger this; it just
  shows what would change.
- **Diagnostic surface** — endpoint primarily intended for
  operator visibility, not for consumer comp pools. Consumers
  building comp pools use C38-B / C39-B.
