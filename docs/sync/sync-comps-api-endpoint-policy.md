# Sync Comps API Endpoint Policy

**Slice:** C38-A (docs-only — defines the HTTP endpoint contract for
exposing the C37-B `ISalesCompEligibilityReader` to authenticated
TerraFusion API clients. C38-B will land the controller action +
DTO + integration tests. This slice writes the contract, not the
code.).
**Lifecycle layer:** API (TerraFusion.Kernel) read surface. Sits
downstream of the C37-B reader and upstream of the future Forge
sales-comp surface, the Studio comp-pool inspector, and the Dais
comp explorer.
**Status:** policy locked; implementation deferred to C38-B.

## Why this slice

The C37 family closed the canonical write + comp-eligibility filter
+ live-PACS proof tool. But the operator's daily workflow needs a
**callable endpoint** — Forge / Studio / Dais consume comp pools
through HTTP, not by calling EF services in-process.

Per the locked sequence:

```
C37-A ✓ comp-eligibility filter policy
C37-B ✓ reader + SQL view + fixture proof
C37-C ✓ live-PACS proof tool
C37-D ✓ tool CLI parser tests
C38-A   sync comps API endpoint policy           ← THIS SLICE
C38-B   controller + DTO + integration tests
```

C38-B is the slice that gives Forge a real HTTP surface to call.

## Provenance

- **C37-A — Sales Comp-Eligibility Filter Policy.** Defines the
  selection rule, county scope, workbook-pin opt-in, and the
  Hard Guards. C38-A inherits all of them; the HTTP endpoint
  exposes the same contract over a wire.
- **C37-B — `ISalesCompEligibilityReader`.** The service this
  endpoint wraps. C38-B's controller action delegates entirely to
  this reader — no parallel selection logic, no second filter.
- **C8-A / C36 / C35-A.** The upstream chain that produces the
  rows this endpoint surfaces.
- **CLAUDE.md** — JWT bearer auth, role-based access control,
  sovereign-county isolation, FISMA audit invariant.
- **`backend/src/TerraFusion.API/Controllers/SyncController.cs`**.
  The existing `/api/sync` controller. C38-B adds an action to
  this controller (NOT a new controller) so the sync surface stays
  consolidated.

## Purpose

Define the HTTP contract for the **comp-eligible sales** read
surface:

```
GET /api/sync/comps/eligible?countyId={guid}&workbookId={guid?}
```

The endpoint returns the comp pool for a county per the C37-A
selection rule. **No additional logic.** The controller action is
a thin adapter: validate inputs → call the reader → project to a
DTO → return.

## Hard guards

These guards lock the contract for C38-B. C38-B may not relax them.

### 1. **Pure projection of the C37-B reader.**

The controller action calls
`ISalesCompEligibilityReader.ReadAsync(countyId, workbookId, ct)`
and returns the result. No additional filtering, no joining, no
aggregation, no enrichment. If a future consumer needs more, that
consumer's slice writes its own policy.

### 2. **Authenticated; no anonymous access.**

The action requires a valid JWT bearer token via the existing
`[Authorize]` attribute pattern. Anonymous callers receive
`401 Unauthorized`. This is consistent with every other
`/api/sync/*` action.

### 3. **County isolation enforced server-side, not by the
   client.**

The query parameter `countyId` is required. The controller MUST
verify the authenticated principal has access to that county
before delegating to the reader. Cross-county access by an
unauthorized principal returns `403 Forbidden` with no row data.

This guard mirrors CLAUDE.md's sovereign-county isolation
invariant: a client cannot ask for comps from a county they don't
have access to. The reader itself doesn't know about the
principal — the guard lives in the controller.

### 4. **Read-only — `GET` only.**

`POST` / `PUT` / `PATCH` / `DELETE` against this route return
`405 Method Not Allowed`. The endpoint is a pure read; there is
no comp-pool mutation surface (and never will be on this slice —
C36 owns the canonical write).

### 5. **No PII.**

The DTO projects only the C37-B `CompEligibleSale` shape (sale
id, source/canonical wac + ratio values, sale date / price
snapshot, workbook provenance). PII (grantor / grantee / address
/ owner) is forbidden in the DTO and forbidden in any future
extension of this endpoint.

### 6. **Empty result is `200 OK` with `[]`, not `404`.**

Per C37-A: zero comps is a valid state. The endpoint returns
`200 OK` with an empty JSON array `[]` when the county has no
qualified rows. `404 Not Found` is reserved for "the route /
controller doesn't exist."

### 7. **Workbook-pin opt-in mirrors C37-A Hard Guard 7.**

`workbookId` is an optional query parameter. When omitted, the
endpoint returns all Qualified rows for the county regardless of
which workbook produced them. When supplied, the endpoint
restricts to that workbook lock-version. There is no implicit
"most recent workbook" default — that would silently mask
workbook drift.

`Guid.Empty` for `workbookId` is treated the same as omission
(consistent with the reader implementation). Malformed Guid
strings return `400 Bad Request` with a verbatim parser message.

### 8. **Idempotent — same request, same response (modulo
   canonical writes elsewhere).**

The endpoint is idempotent at the HTTP level. Identical query
parameters return identical row sets unless C36 has rewritten
canonical rows in the meantime (which is itself idempotent per
sale per (CountyId, ChgOfOwnerId)). No randomization, no time
windowing, no operator-context state.

### 9. **Audit at the consumer level only.**

The controller may log the query (request + result count) at
`Information` level for operational telemetry. This is
operational logging, NOT FISMA audit logging — comp-pool reads
are not state mutations, so they don't write to `AuditLogs`. If
a future compliance review wants comp-pool read auditing, that's
a separate slice with its own policy.

### 10. **No collateral mutation.**

The endpoint does not write to `CanonicalSaleQualifications`,
does not bump `UpdatedAt` on any row, does not increment any
counter. Read = read.

## Endpoint shape

### Route + verbs

```
GET /api/sync/comps/eligible
GET /api/sync/comps/eligible?countyId={guid}
GET /api/sync/comps/eligible?countyId={guid}&workbookId={guid}
```

All other verbs against this route → `405 Method Not Allowed`.

### Query parameters

| Name         | Type | Required | Notes                                        |
|--------------|------|----------|----------------------------------------------|
| `countyId`   | Guid | yes      | Sovereign-county scope. Must match the auth principal's county access. |
| `workbookId` | Guid | no       | Opt-in pin. Omit / empty Guid for "all qualified rows for this county." |

### Response (200 OK)

```json
[
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
]
```

Field shapes mirror the C37-B `CompEligibleSale` record, JSON-cased
per the existing API convention. Order is deterministic
`chgOfOwnerId` ascending (inherited from the reader).

### Error responses

| Status | When                                          |
|--------|-----------------------------------------------|
| 400    | `countyId` missing, malformed, or `Guid.Empty`. Malformed `workbookId`. |
| 401    | No bearer token / invalid bearer token.       |
| 403    | Authenticated principal lacks access to the requested `countyId`. |
| 405    | Verb is not `GET`.                            |

The 400 body is the existing `ProblemDetails` shape used elsewhere
in the API. The 403 body says "forbidden" without leaking whether
the county exists or has rows.

### Suggested DTO

```csharp
namespace TerraFusion.Core.DTOs.Sync;

public sealed record CompEligibleSaleDto(
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

This is the **canonical wire shape**. C38-B implements it; future
consumers (Forge / Studio / Dais) bind to it. Renaming or
removing fields is a breaking change requiring its own slice.

## C38-B success gates

C38-B is accepted only when ALL of:

1. `CompEligibleSaleDto` shipped at the path above.
2. `SyncController.GetEligibleComps` action shipped at the route
   above, registered with `[HttpGet("comps/eligible")]`.
3. Action requires authentication (`[Authorize]` or equivalent).
4. County-isolation guard implemented and tested.
5. Tests landed:
   - 200 OK with deterministic ordering for a Qualified-only
     county.
   - 200 OK with empty array for a county with zero Qualified
     rows.
   - 200 OK with workbook-pin filtering.
   - 400 for missing / malformed / empty `countyId`.
   - 400 for malformed `workbookId`.
   - 401 for unauthenticated request.
   - 403 for cross-county access (authenticated principal whose
     county claim doesn't match `countyId`).
   - 405 for `POST` / `PUT` / `DELETE` on the same route.
   - Read-only: pre/post snapshot of
     `CanonicalSaleQualifications` / `Properties` / `AuditLogs` is
     identical for the called county.
6. Full Sync test suite green (regression gate, current baseline
   865 / 865).
7. No new EF queries beyond those the reader already issues.

## Forbidden semantics (no scope creep)

C38 is the **read-side HTTP exposure** of the comp-eligibility
filter. It is NOT:

- a comp-pricing endpoint (no `/comps/price`)
- a comp-similarity endpoint (no `/comps/similar`)
- a ratio-study endpoint (no `/comps/ratio-study`)
- a workbook-management endpoint (no workbook CRUD)
- a sale-detail endpoint (no joining in `Properties` / PACS data)
- a paginated endpoint (this slice; pagination is C39+ if the
  comp pool grows large enough to need it)
- a streaming / SignalR / change-feed endpoint (C39+ if needed)
- an aggregation endpoint (no `count`, no `groupBy`)
- a write endpoint of any kind

If a future slice wants any of those, it writes its own policy
doc and references this one as input.

## What this slice does NOT change

- Does not modify `CanonicalSaleQualifications` schema.
- Does not modify the C36 writer / runner.
- Does not modify the C37-B reader.
- Does not modify the C37-C tool.
- Does not modify PACS.
- Does not introduce a new audit table.
- Does not introduce a new operator-facing UI.
- Does not change `SyncController`'s existing actions.

## Open questions deferred to C38-B / later

- **Pagination.** The current C37-B reader returns the full
  Qualified set for a county. At Benton scale (~89k parcels →
  some-thousands of qualifying sales) this is fine for an HTTP
  response. If a future county exceeds the natural HTTP
  payload size, pagination lands in C39 with its own contract.
  Do NOT pre-paginate in C38-B — keep the response shape clean
  for the Forge consumer.
- **Caching headers.** C38-B may set `Cache-Control: no-store`
  to keep things simple. If operational telemetry shows the
  endpoint is being hit at high frequency for the same
  workbook lock-version, a `Cache-Control: max-age=N` (with
  invalidation on workbook re-lock) is a future optimization
  slice.
- **OpenAPI annotation.** C38-B should add the standard XML doc
  comments + Swashbuckle attributes per the existing controller
  conventions, but a formal OpenAPI lock is its own slice.

## Glossary (slice-local)

- **Comp pool** — the set of comp-eligible sales for a county at
  request time (C37-A definition; this endpoint surfaces it).
- **Workbook-pin** — optional query parameter restricting the
  pool to canonical rows produced by a specific workbook
  lock-version.
- **Cross-county access** — an authenticated principal asking
  for a county their auth claims don't authorize. The
  controller MUST refuse with 403 before delegating to the
  reader.
