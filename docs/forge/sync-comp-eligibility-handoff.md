# Forge ↔ TerraFusion Sync Comp Eligibility Handoff

**Slice:** SCOPE-1 (docs-only — Forge side of the
boundary-correction policy. Documents what Forge can rely on
from Sync for comp data, and what Forge owns that Sync MUST NOT
implement.).
**Lifecycle layer:** Cross-product handoff contract.
**Status:** policy locked; no Forge comp surface code in this
slice.
**Authoritative cross-reference:** `docs/sync/sync-boundary-policy.md`.

## Why this slice

`GET /api/sync/comps/eligible` was built during C37–C39 as a
**proof endpoint** demonstrating that the canonical sale
qualification chain produces real, county-isolated, paginated,
PII-free Qualified rows. That goal was met. The endpoint is
useful and stays callable.

But comp **selection, scoring, ranking, and consumer-facing
APIs** are not Sync's job — they are Forge's. SCOPE-1 writes
that boundary down so the next round of comp work lands in Forge
on top of Sync canonical data, not inside Sync.

## What Forge can rely on from Sync (read-only)

### Canonical sale qualifications

`CanonicalSaleQualifications` is the authoritative shape Forge
consumes for sale-based comp work.

- **Composite PK:** `(CountyId, ChgOfOwnerId)`.
- **County isolation:** every row carries `CountyId`. Forge MUST
  filter by `CountyId` from the principal's claim, never accept
  it from a request body.
- **Decision domain:** `ComputedDecision ∈ { Qualified,
  Excluded, Inconclusive }` per the C36 transform's 5-status →
  3-status mapping.
- **Eligibility filter (C37 / C8-A):** Forge's comp pool is
  `ComputedDecision = Qualified`. The exclusion AND-rule on
  `wac_cd` + `sl_ratio_type_cd` is already applied upstream of
  this column.
- **Provenance:** every row carries `SourceWorkbookId` and
  `SourceWorkbookLockedAt`, identifying the Mapping Workbook
  that produced it. Forge SHOULD surface these in any
  evidence-grade comp output (defensibility, appeal packets).
- **PII-free by construction:** no grantor, no grantee, no
  parcel-owner data on this canonical row. Forge MUST NOT
  enrich Sync canonical data with PII inside Sync; PII joining
  is a Forge-side concern subject to Forge's own access policy.
- **Audit:** `CreatedAt` / `CreatedBy` / `UpdatedAt` /
  `UpdatedBy` are auto-populated and immutable from outside.
  Forge MUST NOT modify them.

### Read endpoints (transitional, Sync-hosted)

The following Sync endpoints are available today. Forge MAY
consume them in the short term while a Forge-native comp API is
designed and built.

- `GET /api/sync/comps/eligible` — paginated read of Qualified
  canonical sales for a county.
  - Default `pageSize=100`, max `500`.
  - Ordering: deterministic by `ChgOfOwnerId ASC` (and
    workbook-pin filter when `workbookId` is supplied).
  - Pagination envelope: `Items`, `Page`, `PageSize`,
    `TotalCount`, `TotalPages`, `HasNextPage`, `HasPreviousPage`.
  - HTTP caching: strong ETag (`comps:e`-prefixed), `private,
    max-age`, `stale-while-revalidate=120`, `Vary:
    Authorization`, `If-None-Match` → 304, HEAD support.
- `GET /api/sync/comps/stale` — per-row staleness diagnostic.
- `GET /api/sync/comps/stale/summary` — per-group staleness
  summary (max 100 groups, truncates rather than throws).
- `GET /api/sync/active-workbook` — current authoritative
  workbook pointer for the county.

### Workbook-pin opt-in

Forge MAY pass `?workbookId=<guid>` to any of the above to pin a
read against a specific historical Mapping Workbook (audit /
reproducibility / appeal scenarios). Without `workbookId`, the
C42 resolver uses the active pointer; if no pointer exists and
no explicit id is supplied, the read fails closed with the
locked operator message.

### Freshness signal

Forge can detect "is the comp pool I'm about to use stale?" via
`GET /api/sync/comps/stale/summary` and the active-workbook
pointer. The mechanical reconciliation invariants between
top-line / per-group / per-row diagnostics are guaranteed by
Sync. Forge does not need to (and should not) reimplement
staleness detection.

## What Forge owns (Sync MUST NOT implement)

### Comp selection

Picking which canonical sales become comps for a given subject
parcel is Forge's job. This includes:
- Subject-to-comp similarity scoring (location, neighborhood,
  improvement type, size, age, condition, time of sale).
- Comp pool radius / temporal window policy.
- Per-county comp-rule overlays (e.g. neighborhood-only,
  improvement-type-strict, recency cutoffs).

### Comp scoring / ranking / weighting

The Benton Method math (PRD/PRB cycles, percent-of-BIV feature
contributions, decile equity loops, market-calibrated cost
adjustments) is Forge-owned. Sync emits the canonical row; Forge
decides what it is worth.

### Consumer-facing comp API

The long-term API a Studio / Dais / Dossier client calls to get
"comps for parcel X" is a **Forge API**, not a Sync API. It
will:
- Be backed by Sync canonical data (Forge reads from
  `CanonicalSaleQualifications`, optionally pinned by
  workbookId).
- Apply Forge's selection / scoring / ranking layer.
- Carry Forge's own auth, caching, and pagination contracts
  (which MAY mirror the Sync C45 cache pattern but are
  Forge-defined).
- Surface Sync provenance fields (`SourceWorkbookId`,
  `SourceWorkbookLockedAt`) in evidence-grade responses.

The existing `GET /api/sync/comps/eligible` endpoint stays
available as an admin / diagnostic / transitional surface, but
it is **not** the consumer-facing comp API.

### Ratio-study workflow

IAAO ratio statistics, sample selection, stratification,
narrative output — Forge / Dossier territory. Sync provides the
canonical sales pool with provenance; ratio studies are a layer
above that.

### Valuation logic

Cost-approach math, market-approach math, income-approach math,
the Benton Method, depreciation curves, calibration runs —
Forge. Sync emits canonical rows and does not interpret them.

## Migration / consumption guidance for Forge

When Forge stands up its own comp surface:

1. **Read from `CanonicalSaleQualifications` directly** for
   server-side comp pool construction (not via the Sync HTTP
   endpoint, which is intended for diagnostic / cross-process
   reads).
2. **Always filter by `CountyId`** from the authenticated
   principal. Sovereign-county isolation is non-negotiable.
3. **Always filter by `ComputedDecision = Qualified`** for the
   default comp pool. Any deviation (e.g. including
   Inconclusive for diagnostics) MUST be an explicit Forge
   policy decision, not a silent default.
4. **Surface `SourceWorkbookId` and `SourceWorkbookLockedAt` in
   evidence outputs.** Defensibility requires the appraiser /
   appeal record to point at the Mapping Workbook that
   produced the comps used.
5. **Honor pinning.** Forge consumer APIs SHOULD accept an
   optional `workbookId` for reproducibility; default to the
   Sync active pointer when omitted.
6. **Detect staleness before publishing.** Forge SHOULD call
   the Sync stale-summary endpoint (or run the equivalent
   predicate server-side) and either block or warn before
   publishing a comp set drawn against a non-active workbook.

## Non-goals for SCOPE-1

- **No Forge comp API code.** This document is the contract,
  not the implementation slice.
- **No deprecation of `GET /api/sync/comps/eligible`.** It
  remains callable as an admin / transitional surface.
- **No new Sync comp features.** SCOPE-1 closes the door on
  comp-product expansion inside Sync.

## Open questions (deferred to Forge bring-up slices)

- Whether Forge consumes `CanonicalSaleQualifications` via
  direct EF Core access (same DB) or via a dedicated read API
  (separation of concerns vs. coupling tradeoff).
- Forge's auth / role model for comp reads (public-records
  visibility tier, internal appraiser tier, supervisor tier).
- How Forge surfaces "this comp pool is stale" UX — covered
  jointly with TerraFlow under remediation workflow.
