# Sync Comps API Caching Headers Policy

**Slice:** C45-A (docs-only — defines the HTTP cache-control
contract for the comps API endpoint family. C45-B will land the
controller-level header emission + ETag computation + 304
short-circuit + tests. This slice writes the contract, not the
code.).
**Lifecycle layer:** API (TerraFusion.Kernel) HTTP-header surface.
No new schema, no new endpoint, no new write surface. Pure
response-shape augmentation on the existing comps endpoint family.
**Status:** policy locked; implementation deferred to C45-B.

## Why this slice

C39-A flagged caching as a future optimization:

> **`Cache-Control` headers.** C39-B may set `Cache-Control:
> no-store` to keep things simple. If operational telemetry shows
> the endpoint is being hit at high frequency for the same
> workbook lock-version, a `Cache-Control: max-age=N` (with
> invalidation on workbook re-lock) is a future optimization
> slice.

C44-A flagged the same for the summary endpoint:

> **Caching headers.** Stale-summary responses are deterministic
> for a given (countyId, baselineWorkbookId) until the next C36
> write. `Cache-Control: max-age=N` keyed off the baseline
> workbook's `SourceWorkbookLockedAt` is a future optimization
> slice.

Forge / Studio / Dais will pull comp pools and stale summaries
on every dashboard refresh. Without HTTP caching, every refresh
is a full DB read + JSON serialize. With caching keyed off the
baseline workbook's lock version, repeated reads inside a
workbook lock-window are essentially free.

C45-A locks the contract; C45-B implements it.

Per the locked sequence:

```
C44-A ✓ stale-row summary policy
C44-B ✓ stale-row summary endpoint + 17-test matrix
C45-A   comps API caching headers policy           ← THIS SLICE
C45-B   header emission + ETag + 304 short-circuit + tests
```

## Provenance

- **C37-A — Comp-eligibility filter policy.** Defines the
  read-only / county-isolated / no-PII / idempotent guards.
  Caching must not break any of them.
- **C38-A — Comps API endpoint policy.** Locks the auth +
  county-isolation pattern. Caching MUST be private (never
  shared) so a single shared cache cannot serve responses
  across operators.
- **C39-A — Pagination policy.** Defines the envelope shape;
  caching applies per (countyId, workbookId, page, pageSize)
  tuple.
- **C40-A — Workbook lock-lifecycle policy.** Defines
  `SourceWorkbookLockedAt` as a workbook-version stamp; this
  slice uses it as the cache-key seed.
- **C41-A / B / C — Active-workbook pointer.** The pointer
  endpoint has its own caching tier (operator promote/clear
  should reflect immediately).
- **C43-A / B — Stale per-row endpoint.** Inherits caching
  rules.
- **C44-A / B — Stale summary endpoint.** Inherits caching
  rules.
- **CLAUDE.md** — sovereign-county isolation, FISMA audit,
  JWT bearer auth.

## Purpose

Define the `Cache-Control`, `ETag`, `Last-Modified`, and `Vary`
header semantics for the comps API endpoint family:

```
GET /api/sync/comps/eligible        (C39-B)
GET /api/sync/comps/stale           (C43-B)
GET /api/sync/comps/stale/summary   (C44-B)
GET /api/sync/active-workbook       (C41-C)
```

The policy is **per-endpoint**: comp endpoints (the first three)
get a longer cache window because the canonical landing only
changes on C36 writes; the active-workbook pointer endpoint gets
a shorter window because operator promote/clear should reflect
immediately.

## Hard guards

These guards lock the contract for C45-B. C45-B may not relax
them.

### 1. **Caching is `private`, never `public`.**

Every cacheable response carries `Cache-Control: private, ...`.
Reasoning:

- Responses are county-scoped via principal claim (C38-A Hard
  Guard 3). A `public` cache could serve a Benton response to
  a Yakima principal if naively keyed only on URL.
- `Vary: Authorization` would mitigate but is brittle —
  bearer tokens differ per session, so identical-content
  responses across same-county-different-principal would not
  share cache hits.
- The expected consumers (Forge / Studio / Dais browser
  clients, SalesCompProof CLI) all have private caches; no
  CDN layer in scope for this slice.

C45-B MUST NOT emit `public` Cache-Control directives on any
endpoint in this family.

### 2. **Mutations and errors are `no-store`.**

- `PUT` / `DELETE` on `/api/sync/active-workbook` (C41-C):
  `Cache-Control: no-store`.
- 4xx / 5xx responses on any endpoint: `Cache-Control:
  no-store` (so a 401 / 403 / 500 is never cached).
- 401 / 403 / 405 short-circuits MUST NOT carry `ETag` /
  `Last-Modified` (don't help the client; risk of leaking
  resource existence).

### 3. **`Vary: Authorization` on every cacheable response.**

Belt-and-suspenders alongside `private`. Ensures intermediary
caches (if any are introduced later) key on the bearer token
and don't cross-contaminate principals.

C45-B MUST emit `Vary: Authorization` on every 200 / 304
response in the family.

### 4. **`max-age` is endpoint-specific and short.**

| Endpoint                                | `max-age` (sec) | Reasoning                                                                 |
|-----------------------------------------|-----------------|---------------------------------------------------------------------------|
| `GET /api/sync/comps/eligible`          | `60`            | Canonical rows change only on C36 writes; 60s is short enough that a fresh C36 run becomes visible quickly. |
| `GET /api/sync/comps/stale`             | `60`            | Same reasoning; stale set changes only on C36 writes.                     |
| `GET /api/sync/comps/stale/summary`     | `60`            | Same reasoning; summary is a derived projection of the same predicate.    |
| `GET /api/sync/active-workbook`         | `5`             | Operator promote/clear should reflect within seconds; longer max-age is operator-confusing. |

The 60s / 5s split is deliberate. C45-B MUST NOT pick longer
values without its own slice card; the operator's mental model
of "I just promoted a workbook; do my dashboards see it?"
demands the active-workbook endpoint feel fresh.

### 5. **`ETag` is derived from a deterministic seed; supports 304.**

Each cacheable response carries an `ETag` header. The seed is
endpoint-specific:

| Endpoint                                | ETag seed                                                            |
|-----------------------------------------|----------------------------------------------------------------------|
| `GET /api/sync/comps/eligible`          | `(countyId, effectiveWorkbookId-or-empty, page, pageSize, maxLockedAtUtc)` |
| `GET /api/sync/comps/stale`             | `(countyId, baselineWorkbookId, page, pageSize, maxLockedAtUtc)`     |
| `GET /api/sync/comps/stale/summary`     | `(countyId, baselineWorkbookId, totalStaleRows, groupCount, maxLockedAtUtc)` |
| `GET /api/sync/active-workbook`         | `(countyId, activeWorkbookId, setAtUtc)`                             |

`maxLockedAtUtc` is the maximum `SourceWorkbookLockedAt` across
the rows in scope (the locked-at timestamp on the canonical row
that the C36 writer rotates whenever the row is upserted).
This means **any C36 write that touches a row in scope
invalidates the ETag** — exactly the freshness signal the
operator needs.

The ETag value is the SHA-256 hex of the seed, prefixed with a
short stable scope identifier so different endpoints' ETags
can never collide (e.g. `"comps:e:<hash>"` for eligible,
`"comps:s:<hash>"` for stale per-row,
`"comps:ss:<hash>"` for stale summary,
`"awb:<hash>"` for active-workbook). The hash is opaque to
clients and can be rotated by C45-B if the seed shape changes
(documented as a breaking change with its own slice).

ETag values are **strong** (`ETag: "..."`). Weak ETags
(`W/"..."`) are NOT used in this family. Reasoning: the seed is
exact (no whitespace / encoding ambiguity), so strong is
defensible.

### 6. **304 Not Modified short-circuit.**

When the client sends `If-None-Match: "<previous ETag>"` and the
server-computed ETag matches, the response is `304 Not Modified`
with NO body, the same `Cache-Control` / `ETag` / `Vary`
headers, AND no `Last-Modified` / `Content-Length` body
fields. C45-B MUST short-circuit BEFORE materializing the page
contents (i.e. compute the ETag seed components first, then
short-circuit if the client's ETag matches).

This is the key cost saving: 304 short-circuits are essentially
free server-side (one count + one lock-time max query at most).

### 7. **`Last-Modified` mirrors the seed's lock-time.**

Each cacheable response also carries `Last-Modified` set to
the `maxLockedAtUtc` from the ETag seed. This is informational
(some clients prefer `Last-Modified` over `ETag`) but the ETag
is the authoritative cache key.

`If-Modified-Since` short-circuits to 304 with the same logic
as `If-None-Match` (compare to `maxLockedAtUtc`).

### 8. **County isolation must hold across cached responses.**

A 304 short-circuit MUST happen BEFORE cross-county checks
only if the client's bearer token has not changed (the
`Vary: Authorization` covers this). C45-B's order of operations
is:

1. Validate `countyId` query param shape (400 if bad).
2. Resolve principal claim; if county mismatch → 403 (no
   ETag, no cache headers per Hard Guard 2).
3. THEN compute ETag seed; check `If-None-Match`; 304 if match.
4. THEN materialize page / read rows; emit 200 with full
   headers.

Caching MUST NOT bypass the auth/isolation guards. C45-B's
implementation MUST place the 403 check before any ETag
computation.

### 9. **No `Pragma: no-cache` legacy headers.**

`Pragma` is HTTP/1.0 and conflicts with HTTP/1.1
`Cache-Control` semantics. C45-B uses `Cache-Control` only.
Legacy clients are out of scope (the API requires JWT bearer,
which is HTTP/1.1+).

### 10. **5xx errors are never cached.**

`500` / `502` / `503` / `504` responses carry
`Cache-Control: no-store`. Reasoning: caching a 500 turns a
transient outage into a permanent client-side breakage. This
is standard but worth locking explicitly.

### 11. **No `Expires` header.**

`Expires` is HTTP/1.0 and superseded by `max-age` in
`Cache-Control`. C45-B uses `max-age` only. Mixing `Expires`
and `Cache-Control` invites disagreement; we don't do it.

### 12. **Cacheable response body shape unchanged.**

C45-B does NOT change the JSON wire shape. The envelope DTOs
locked in C39-A / C43-A / C44-A still serialize identically.
Caching is a transport-layer concern; the body is the same.

## Endpoint shape changes

### Headers added on 200 responses

```
Cache-Control: private, max-age=<endpoint-specific>
ETag: "<scope>:<sha256-hex>"
Last-Modified: <maxLockedAtUtc as RFC1123>
Vary: Authorization
```

### Headers added on 304 responses

```
Cache-Control: private, max-age=<endpoint-specific>
ETag: "<scope>:<sha256-hex>"           // echoes the matched ETag
Vary: Authorization
```

(NO `Last-Modified` on 304 — the body is empty; the client
already knows.)

### Headers added on 4xx / 5xx / mutations

```
Cache-Control: no-store
```

(NO `ETag` / `Last-Modified` on these.)

## C45-B success gates

C45-B is accepted only when ALL of:

1. Header emission shipped on the four endpoints listed above.
2. ETag seed computation lives in a shared private helper on
   `SyncController` (or a small static helper class) so the
   four endpoints share the algorithm and can never drift.
3. SHA-256 hash + scope-prefix per Hard Guard 5.
4. 304 short-circuit on `If-None-Match` (and equivalent on
   `If-Modified-Since`) before any page materialization.
5. Order-of-operations guards Hard Guard 8: validation → auth
   → isolation → ETag → materialize.
6. Tests landed (full matrix below).
7. Full Sync Unit.Tests `Tests.Sync.` namespace regression
   green (current 87 / 87).
8. Full Sync Integration regression green (current 782 / 782).
9. Existing endpoint behavior preserved — body shape, status
   codes, and ordering all unchanged. Tests landed in C38-B /
   C39-B / C41-C / C43-B / C44-B keep passing.

## C45-B test matrix

The implementation slice MUST land tests covering:

1. **`Cache-Control: private, max-age=60`** on a 200 response
   from `/api/sync/comps/eligible`.
2. **`Cache-Control: private, max-age=60`** on a 200 from
   `/api/sync/comps/stale` and `/api/sync/comps/stale/summary`.
3. **`Cache-Control: private, max-age=5`** on a 200 from
   `/api/sync/active-workbook`.
4. **`Cache-Control: no-store`** on `PUT
   /api/sync/active-workbook` and `DELETE
   /api/sync/active-workbook`.
5. **`Cache-Control: no-store`** on a 4xx (e.g. 400 from
   bad `countyId`) and on simulated 5xx.
6. **`ETag`** present and stable across two identical 200
   requests when no canonical writes intervene.
7. **`ETag`** changes when a C36 write touches a row in scope
   (re-issue request → ETag differs).
8. **304 Not Modified** when client sends matching
   `If-None-Match`. Body is empty; `ETag` echoes; no
   `Last-Modified`.
9. **200 OK** when client sends a stale `If-None-Match`
   (mismatched ETag).
10. **`Vary: Authorization`** on every 200 / 304.
11. **No `Pragma`** header on any response (Hard Guard 9).
12. **No `Expires`** header on any response (Hard Guard 11).
13. **County isolation precedence**: cross-county 403 happens
    BEFORE ETag computation (verify by sending matching
    `If-None-Match` from a wrong-county principal — must still
    get 403, never 304).
14. **Endpoint scope-prefix in ETag**: the same county +
    workbook produces different ETag VALUES across the four
    endpoints (no collision possible).
15. **`Last-Modified`** matches the maximum
    `SourceWorkbookLockedAt` across the rows in scope (or
    `setAtUtc` for the active-workbook endpoint).
16. **Empty result still cacheable**: an empty `items: []`
    response carries `Cache-Control: private, max-age=N` and
    a deterministic ETag.
17. **`If-Modified-Since` short-circuit**: client sends a
    timestamp ≥ `maxLockedAtUtc` → 304.

## Forbidden semantics (no scope creep)

C45 is the **HTTP caching layer** of the existing comps API
family. It is NOT:

- a server-side cache (no in-memory response cache; no Redis;
  no MemoryCache). Caching is purely client-side / private
  HTTP cache. Server-side caching would be a separate slice
  (its own staleness invariants, its own warmup, its own
  invalidation policy).
- a CDN policy (no `public` directives; no Edge surface).
- a rate-limit policy (`X-RateLimit-*` headers are out of
  scope).
- a CORS policy (CORS is configured upstream).
- a content-negotiation policy (no `Accept` / `Content-Type`
  changes; the API still returns JSON only).
- a compression policy (gzip / br are pipeline concerns, not
  this slice's).

If a future slice wants any of those, it writes its own policy
doc and references this one as input.

## What this slice does NOT change

- Does not modify `CanonicalSaleQualifications` schema.
- Does not modify the C36 writer / runner.
- Does not modify the C37-B reader.
- Does not modify the C38-B / C39-B / C43-B / C44-B endpoints'
  body shapes.
- Does not modify the C41-C active-workbook endpoint's body
  shape.
- Does not modify PACS.
- Does not introduce a new audit table.
- Does not introduce a new operator-facing UI.
- Does not change auth / authorization / county-isolation
  semantics.

## Open questions deferred to C45-B / later

- **Per-county `max-age` tuning.** A future county with very
  high comp-pool churn might want a shorter window. Out of
  scope; flagged for the implementation slice to consider only
  if benchmarks demand.
- **Stale-while-revalidate.** The
  `Cache-Control: stale-while-revalidate=N` directive lets
  clients serve stale content while re-fetching in the
  background. Useful for dashboard latency. Out of scope for
  C45-A; future optimization slice.
- **Server-side caching layer.** If client-side caching isn't
  enough at scale, a future slice can add Redis / MemoryCache
  with explicit invalidation tied to C36 writes. Different
  policy doc, different invariants.
- **`If-Match` for mutations.** The active-workbook PUT could
  use `If-Match` to enforce "only promote if I think I have
  the current pointer." Useful for concurrency. Out of scope
  for C45-A; future slice.
- **HEAD requests.** The endpoints don't currently support
  HEAD; if a future client wants to probe ETag without a body,
  C45-B may add it (cheap; same headers, no body). Out of
  scope unless requested.

## Glossary (slice-local)

- **Strong ETag** — `ETag: "<value>"` (no `W/` prefix). The
  server guarantees byte-for-byte identical responses produce
  identical ETags.
- **Cache-key seed** — the tuple the ETag is hashed from.
  Endpoint-specific per Hard Guard 5.
- **Workbook lock-version** —
  `SourceWorkbookLockedAt` on the canonical row. Rotates on
  every C36 upsert that touches the row.
- **`maxLockedAtUtc`** — the maximum
  `SourceWorkbookLockedAt` across the rows in scope of a
  single response. Drives ETag invalidation: any C36 write to
  a row in scope advances this value.
- **304 Not Modified** — the cacheable-success short-circuit
  status. Body empty; same ETag / Cache-Control / Vary
  headers as the corresponding 200.
- **Endpoint scope-prefix** — short stable string (e.g.
  `comps:e`) prepended to each ETag so collisions across the
  four endpoints are structurally impossible.
