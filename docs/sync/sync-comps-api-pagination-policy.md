# Sync Comps API Pagination Policy

**Slice:** C39-A (docs-only — defines the pagination contract for
the C38-B `GET /api/sync/comps/eligible` endpoint. C39-B will land
the controller wiring + envelope DTO + tests. This slice writes the
contract, not the code.).
**Lifecycle layer:** API (TerraFusion.Kernel) read-surface
augmentation. Sits on top of the C38-B endpoint and the C37-B
reader. No new canonical write surface, no new SQL.
**Status:** policy locked; implementation deferred to C39-B.

## Why this slice

C38-B shipped the unpaginated read endpoint. The C38-A policy
explicitly deferred pagination as a "C39+ slice if comp pool size
demands it." Before any frontend / Forge / Studio / Dais consumer
binds to the endpoint, we lock the pagination contract so:

1. Consumers can't accidentally request an unbounded comp pool.
2. The wire shape is stable from day one — no breaking re-shape
   when a county's pool grows large enough to need cursoring.
3. The deterministic ordering inherited from C37-B is preserved
   across page boundaries.

Per the locked sequence:

```
C38-A ✓ comps API endpoint policy (deferred pagination)
C38-B ✓ comps API endpoint implementation
C39-A   sync comps API pagination policy            ← THIS SLICE
C39-B   pagination implementation + envelope DTO + tests
```

The goblin opened the comp window. Now we install the
take-a-number machine.

## Provenance

- **C37-A — Sales Comp-Eligibility Filter Policy.** Locks the
  selection rule (`ComputedDecision = Qualified`) and the
  Hard Guards. Pagination cannot bypass them.
- **C37-B — `ISalesCompEligibilityReader`.** Locks the ordering
  contract: rows return in `ChgOfOwnerId` ascending order. The
  reader's tests fail closed on any other ordering. C39 inherits
  this ordering verbatim.
- **C38-A — Sync Comps API Endpoint Policy.** Locks 10 Hard
  Guards (auth, county isolation, read-only, no PII, idempotent,
  workbook-pin opt-in, etc.). Pagination cannot relax any of
  them.
- **C38-B — `SyncController.GetEligibleComps`.** The action this
  slice extends.
- **CLAUDE.md** — sovereign-county isolation, FISMA audit
  invariant.

## Purpose

Define the pagination query-parameter shape, response envelope,
default / limit values, validation rules, and ordering invariant
for the C38-B endpoint:

```
GET /api/sync/comps/eligible?countyId={guid}&workbookId={guid?}&page={int?}&pageSize={int?}
```

Pagination is **purely additive** to C38-A. Every C38-A guarantee
still holds: same selection rule, same county isolation, same
auth, same workbook-pin semantics. The only thing C39 changes is
how rows reach the wire.

## Hard guards

These guards lock the contract for C39-B. C39-B may not relax
them.

### 1. **Pagination is server-bounded.**

The server MUST NOT return more than the configured maximum
page size in a single response, regardless of the client's
requested `pageSize`. The server MUST refuse — not silently
truncate — any `pageSize` exceeding the limit.

This protects against:
- Frontend bugs that ask for `pageSize=999999` and try to
  render the result.
- Forge / Dais consumers that mis-compute their pagination loop
  and DOS the API.
- Operators who run an ad-hoc query against a large county
  without realizing the response would saturate the wire.

### 2. **Defaults are conservative.**

When the client omits `page` or `pageSize`, the server applies
defaults that produce a reasonable first page without the
client having to reason about the parameter shape:

| Param      | Default | Maximum |
|------------|---------|---------|
| `page`     | `1`     | (none)  |
| `pageSize` | `100`   | `500`   |

`page` has no maximum because requesting a page beyond the
total simply returns an empty `items` array (per Hard Guard 6
below). The client doesn't need to know the total to ask
politely.

### 3. **Validation rejects with 400 — no silent normalization.**

Any of the following return `400 Bad Request` with a verbatim
`ProblemDetails` body naming the offending parameter:

- `page < 1`
- `pageSize < 1`
- `pageSize > 500`
- `page` or `pageSize` not parseable as a positive integer

The server does NOT normalize bad input. A client sending
`pageSize=0` is buggy; surfacing the bug at request time costs
less than masking it with a default.

### 4. **Ordering is locked: `ChgOfOwnerId` ASC.**

The reader's contract is `ChgOfOwnerId` ascending; tests fail
closed on any other ordering. C39 inherits this ordering
verbatim. Pagination MUST NOT introduce a different ordering
("`SaleDate DESC`" or "`SalePrice DESC`" etc.) because:

- Many canonical rows lack `SaleDate` / `SalePrice` snapshots
  (PACS data gaps land as nulls in the canonical row), so
  ordering by them would shuffle nulls non-deterministically
  across pages.
- The C37-B reader's `IX_CanonicalSaleQualifications_County_Decision`
  index is keyed on `(CountyId, ComputedDecision)`; ordering on
  another column would force a sort.
- Stable cursoring across pages requires a deterministic
  ordering on a NOT NULL column. `ChgOfOwnerId` is the only
  such column on the canonical row that's non-trivially
  ordered.

If a future slice wants alternative orderings (e.g. for a
ratio-study-style "newest sales first" view), that's a separate
slice with its own policy and its own endpoint or query
parameter.

### 5. **No cursor-based pagination this slice.**

C39 uses **offset/limit** pagination (`page`, `pageSize`), not
cursor-based pagination. Reasoning:

- Comp pools at Benton scale are bounded — Excluded /
  Inconclusive rows are the bulk of canonical rows; the
  Qualified pool is much smaller.
- Cursor pagination requires opaque cursor tokens, server-side
  cursor decoding, and tighter invariants around row stability.
  C37-B's idempotent canonical writes mean rows can be
  upserted between pages, which would invalidate a cursor
  silently.
- Offset/limit is the simplest contract that works for the
  current scale. If a future county exceeds the natural
  offset-limit cliff (typically tens of thousands of rows),
  cursor pagination lands in C40+ with its own policy.

### 6. **Empty result is `200 OK` with `items: []`.**

When the requested page is beyond the available rows
(`page * pageSize > totalCount`), the server returns the same
response envelope with `items: []`. The metadata fields still
populate accurately so the client can recognize the
"past-the-end" condition.

This mirrors C38-A Hard Guard 6: zero rows is a valid state,
not a 404.

### 7. **Total count is accurate, not approximate.**

`totalCount` reflects the exact number of rows that match the
filter (county + optional workbook pin + Qualified-only), as
seen by this server at request time. The server MUST NOT
return an approximate count (`"totalCount": 1000` when the
true count is 873). Approximate counts cause UI bugs and
ratio-study reconciliation failures.

If the underlying query becomes expensive enough that the
exact count is a problem, that's a future-slice optimization
(e.g. a separate `/api/sync/comps/eligible/count` endpoint with
its own caching policy). C39-B uses `Count()` against the same
query the page selects from.

### 8. **All C38-A guards still apply, unmodified.**

- Authentication required (`[Authorize]`).
- County isolation server-side (principal claim must match
  `countyId`).
- Read-only — `GET` only. Other verbs still 405.
- No PII in `items`.
- Idempotent — same request, same response.
- Workbook-pin opt-in. `workbookId` query param semantics
  unchanged.
- Audit at consumer level only (operational logging, no
  AuditLogs writes).
- No collateral mutation.

C39-B's tests MUST cover these guards across paginated
requests.

### 9. **Pagination metadata is plain integers / booleans.**

The envelope's metadata fields are:

| Field              | Type    | Notes                                  |
|--------------------|---------|----------------------------------------|
| `items`            | array   | `CompEligibleSaleDto[]` for the page   |
| `page`             | int     | Echoes the effective page (after default) |
| `pageSize`         | int     | Echoes the effective page size (after default) |
| `totalCount`       | int     | Exact total matching rows (Hard Guard 7) |
| `totalPages`       | int     | `ceil(totalCount / pageSize)`. Zero when `totalCount = 0`. |
| `hasNextPage`      | bool    | `page < totalPages`                    |
| `hasPreviousPage`  | bool    | `page > 1`                             |

All metadata fields are required on every successful response.
No optional fields, no nullable totals — keeps consumer
deserialization trivial.

### 10. **Backwards compatibility lane.**

C38-B currently returns a bare JSON array (`[]` or
`[CompEligibleSaleDto, …]`). C39-B switches the response to the
envelope shape. **This is a breaking change** for any
consumer that already binds to the bare array.

Mitigation:
- C38-B has been live for one slice. No frontend / Forge / Dais
  / Studio consumer is wired yet (per the operator's "Still
  parked" save state). The surface is internal.
- C39-B's commit message will call out the breaking change so
  the change log is unambiguous.
- The endpoint is at `/api/sync/comps/eligible`. If a future
  consumer needs the bare-array shape for migration purposes,
  that consumer's slice writes its own policy.

C39-B does NOT preserve the bare-array shape. The envelope is
the canonical wire shape going forward.

## Endpoint shape

### Route + verbs (unchanged from C38-A)

```
GET /api/sync/comps/eligible
GET /api/sync/comps/eligible?countyId={guid}
GET /api/sync/comps/eligible?countyId={guid}&workbookId={guid}
GET /api/sync/comps/eligible?countyId={guid}&page={int}&pageSize={int}
GET /api/sync/comps/eligible?countyId={guid}&workbookId={guid}&page={int}&pageSize={int}
```

All other verbs → `405 Method Not Allowed` (unchanged).

### Query parameters

| Name         | Type | Required | Default | Notes                                                                 |
|--------------|------|----------|---------|-----------------------------------------------------------------------|
| `countyId`   | Guid | yes      | n/a     | Sovereign-county scope. Matched against principal claim.              |
| `workbookId` | Guid | no       | none    | Opt-in pin. `Guid.Empty` / omission → no pin.                         |
| `page`       | int  | no       | `1`     | 1-based page index. Must be ≥ 1.                                      |
| `pageSize`   | int  | no       | `100`   | Rows per page. Must be ≥ 1 and ≤ `500`.                               |

### Response envelope (200 OK)

```json
{
  "items": [
    {
      "chgOfOwnerId": 1001,
      "wacCdSourceValue": "458-61A-203(1)",
      "wacCdCanonicalValue": "ArmsLengthSale",
      "slRatioTypeCdSourceValue": "00",
      "slRatioTypeCdCanonicalValue": "Conventional",
      "saleDate": "2025-06-15T00:00:00Z",
      "salePrice": 425000.00,
      "sourceWorkbookId": "a767c8a2-5b8a-4846-af8b-c3496601e924",
      "sourceWorkbookLockedAt": "2026-04-28T20:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 100,
  "totalCount": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

`items` shape mirrors the C38-B `CompEligibleSaleDto` field-for-
field. Pagination wraps it without modification.

### Empty pool example

```json
{
  "items": [],
  "page": 1,
  "pageSize": 100,
  "totalCount": 0,
  "totalPages": 0,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

### Past-the-end example

A county with `totalCount = 50`, requested with `page = 10`,
`pageSize = 100`:

```json
{
  "items": [],
  "page": 10,
  "pageSize": 100,
  "totalCount": 50,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": true
}
```

`hasPreviousPage = true` because `page > 1`. The client can use
this to detect they overshot.

### Error responses

| Status | When                                                                  |
|--------|-----------------------------------------------------------------------|
| 400    | `countyId` missing / malformed / `Guid.Empty`. `workbookId` malformed. `page < 1`. `pageSize < 1`. `pageSize > 500`. Unparseable integers. |
| 401    | No bearer token / invalid bearer token.                               |
| 403    | Authenticated principal lacks access to the requested `countyId`.     |
| 405    | Verb is not `GET`.                                                    |

All 400 bodies use the existing `ProblemDetails` shape and name
the offending parameter verbatim so client-side debugging is
straightforward.

### Suggested envelope DTO

```csharp
namespace TerraFusion.Core.DTOs.Sync;

public sealed record PagedCompEligibleSalesDto(
    IReadOnlyList<CompEligibleSaleDto> Items,
    int  Page,
    int  PageSize,
    int  TotalCount,
    int  TotalPages,
    bool HasNextPage,
    bool HasPreviousPage);
```

This is the **canonical wire shape**. C39-B implements it; future
consumers (Forge / Studio / Dais) bind to it. Renaming /
removing / re-typing fields is a breaking change requiring its
own slice.

## C39-B success gates

C39-B is accepted only when ALL of:

1. `PagedCompEligibleSalesDto` shipped at the path above.
2. `SyncController.GetEligibleComps` action signature updated to
   accept `[FromQuery] int? page, [FromQuery] int? pageSize`.
3. Reader interface either:
   - extended with a `ReadAsync(countyId, workbookId, page,
     pageSize, ct)` overload + `CountAsync(countyId, workbookId,
     ct)`, OR
   - kept narrow and the controller does the
     `Skip()/Take()/Count()` itself against an EF query (the
     C39-B slice card chooses).
4. Defaults applied server-side: omitted `page` → 1; omitted
   `pageSize` → 100.
5. Validation: `page < 1`, `pageSize < 1`, `pageSize > 500` all
   return 400 with the offending parameter named verbatim.
6. Tests landed (per the C39-A test matrix below).
7. Full Sync test suite green (regression gate, current
   baseline 865 / 865 + 11 controller = 876).
8. C38-B's existing 11 controller tests are updated to match
   the envelope shape (no test removed; envelope shape replaces
   bare-array assertions).
9. R2Wave44 SyncController regression still green (12 / 12).

## C39-B test matrix

The implementation slice MUST land tests covering:

1. **Default first page.** Omitted `page` and `pageSize` returns
   page 1 with up to 100 items, envelope metadata accurate.
2. **Explicit page and pageSize.** `page=2, pageSize=10` against
   a county with 25 Qualified rows returns rows 11–20, with
   `hasNextPage=true`, `hasPreviousPage=true`.
3. **Past-the-end page.** `page=99` returns
   `items=[], totalCount=N, hasPreviousPage=true,
   hasNextPage=false`. 200 OK, not 404.
4. **Page size at the limit.** `pageSize=500` accepted; returns
   up to 500 items.
5. **Page size over the limit.** `pageSize=501` → 400 with
   `pageSize` named in the body.
6. **Page < 1.** `page=0`, `page=-3` → 400 with `page` named in
   the body.
7. **Page size < 1.** `pageSize=0`, `pageSize=-1` → 400 with
   `pageSize` named in the body.
8. **County isolation preserved.** Cross-county request →
   403 (with paginated query params present); same shape as
   C38-B's existing 403 case.
9. **Workbook-pin preserved.** Pagination + workbook pin: rows
   filtered by both, totals reflect the pinned subset.
10. **Empty pool returns full envelope.** A county with zero
    Qualified rows returns `items=[], totalCount=0,
    totalPages=0, hasNextPage=false, hasPreviousPage=false`. 200,
    not 404.
11. **Deterministic ordering across pages.** Two adjacent pages
    requested back-to-back have non-overlapping `ChgOfOwnerId`
    sets, and the union is exactly the unpaginated comp pool
    (no skip, no duplicate). Tests this against ≥ 3 pages so
    the cursor-stability invariant is asserted.
12. **Read-only across paginated reads.** Pre/post DB snapshot
    (canonical rows, AuditLogs, anything mutable) is unchanged
    after multiple paginated requests.
13. **Default-form parity with C37-B reader.** A request without
    `page`/`pageSize` against a county with ≤ 100 Qualified
    rows returns the same row set the C37-B fixture proof
    produces (same `ChgOfOwnerId` order, same DTO field
    population) — plus the envelope metadata. This proves the
    pagination wrapper doesn't drift from the unpaginated
    contract.

The C38-B existing 11 tests are updated to match the envelope
shape. Net new test count: 13 minus tests-folded-into-13 =
roughly +6–8 net new tests, depending on how the existing
tests are updated.

## Forbidden semantics (no scope creep)

C39 is the **pagination layer** of the existing comp-eligibility
endpoint. It is NOT:

- a sort-control endpoint (no `?sortBy=`)
- a filter-control endpoint (no `?wacCd=`, `?priceMin=`)
- a column-projection endpoint (no `?fields=`)
- a streaming / chunked-transfer endpoint
- a cursor-based-pagination endpoint
- a comp-pricing / similarity / ranking endpoint
- a write endpoint of any kind

If a future slice wants any of those, it writes its own policy
doc and references this one as input.

## What this slice does NOT change

- Does not modify `CanonicalSaleQualifications` schema.
- Does not modify the C36 writer / runner.
- Does not modify the C37-B reader's existing
  `ReadAsync(countyId, workbookId, ct)` signature (C39-B may
  add a paginated overload, but the existing signature stays
  for the C37-C tool and the C37-B fixture proof, which both
  consume the unpaginated reader).
- Does not modify the C37-C tool. The tool reads the full pool
  (bounded by `--max-sales` at the PACS read side, not at the
  reader); pagination is irrelevant there.
- Does not modify PACS.
- Does not introduce a new audit table.
- Does not introduce a new operator-facing UI.

## Open questions deferred to C39-B / later

- **Reader pagination overload vs in-controller paging.** C39-B
  picks one. Both are acceptable; the trade-off is whether the
  reader's surface grows or stays narrow. Recommend extending
  the reader so EF can push `Skip/Take` into the SQL layer
  rather than materializing the full pool in the controller.
- **`Cache-Control` headers.** C38-A flagged this for later;
  still later. Pagination doesn't change the answer.
- **OpenAPI annotation.** Out of scope for this slice; tracked
  as a future formal-OpenAPI-lock slice.
- **Cursor pagination.** Out of scope. Future C40+ if the
  offset/limit model breaks down at scale.

## Glossary (slice-local)

- **Page** — a 1-based slice of the comp pool, returned as the
  `items` array in the envelope.
- **Page size** — number of rows per page; default 100, max
  500.
- **Past-the-end** — a request whose page index is beyond
  `totalPages`. Returns 200 with `items=[]` and accurate
  metadata.
- **Envelope** — the wrapper object containing `items` plus
  pagination metadata; the canonical wire shape after C39-B.
- **Bare-array shape** — the C38-B response shape (a JSON
  array of `CompEligibleSaleDto` directly). Replaced by the
  envelope in C39-B.
