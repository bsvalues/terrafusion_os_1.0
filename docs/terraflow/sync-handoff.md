# TerraFlow ↔ TerraFusion Sync Handoff

**Slice:** SCOPE-1 (docs-only — TerraFlow side of the
boundary-correction policy. Documents what TerraFlow can rely on
from Sync, and what TerraFlow owns that Sync MUST NOT
implement.).
**Lifecycle layer:** Cross-product handoff contract.
**Status:** policy locked; no TerraFlow engine code yet.
**Authoritative cross-reference:** `docs/sync/sync-boundary-policy.md`.

## Why this slice

The C-series proved the bridge works. Several review/lock/rerun
**workflow** behaviors were sketched inside Sync as part of
proving the data layer (Mapping Workbook lock semantics,
stale-row detection, active-workbook pointer rotation). Those
proofs are valuable and stay in Sync as data mechanisms — but
the **human-and-process workflow** layered on top of them
belongs to TerraFlow.

This document writes down the line so TerraFlow can be built on
solid Sync foundations without Sync continuing to drift into
workflow territory.

## What TerraFlow can rely on from Sync (read-only)

These are stable, county-isolated, FISMA-audited surfaces that
TerraFlow consumes. TerraFlow MUST treat them as read-only
(except for the explicitly-mutable pointer noted below) and MUST
NOT replicate their data into TerraFlow-owned tables.

### Canonical landing data

- `CanonicalSaleQualifications` — canonical sale qualification
  rows produced by the Sync transform from a Mapped workbook.
  Composite PK `(CountyId, ChgOfOwnerId)`. PII-free by
  construction.
- (Future lanes: canonical valuation, canonical improvement,
  canonical land. Same shape contract — Sync emits, TerraFlow
  consumes.)

### Provenance

- `SourceWorkbookId` on every canonical row — the workbook that
  produced this row.
- `SourceWorkbookLockedAt` — when that workbook was locked into
  Mapped status.
- `CreatedAt` / `CreatedBy` / `UpdatedAt` / `UpdatedBy` —
  FISMA-HIGH audit stamps populated by the
  `AuditableEntityInterceptor`. TerraFlow MUST NOT modify these.

### Active workbook pointer

- `SyncCountyActiveWorkbook` — per-county pointer to the
  workbook currently considered authoritative.
  - `GET /api/sync/active-workbook?countyId=...` — read.
  - `PUT /api/sync/active-workbook?countyId=&workbookId=` —
    promote. **TerraFlow may call this** as the system-of-record
    for "operator decided this workbook is now authoritative,"
    but the rotation rules (Mapped-only, county-scoped,
    fail-closed on cross-county) are Sync-enforced and not
    TerraFlow's to override.

### Stale diagnostics

- `GET /api/sync/comps/stale` — per-row stale detection.
- `GET /api/sync/comps/stale/summary` — per-group summary.
- Predicate: `WHERE CountyId = X AND SourceWorkbookId <>
  @baselineWorkbookId`. Baseline resolves via the C42 resolver
  (explicit query param > active pointer > fail-closed).

These tell TerraFlow **what is stale**. They do not tell
TerraFlow **what to do about it** — that is workflow.

### Proof / read endpoints

- `GET /api/sync/comps/eligible` — read-only proof endpoint for
  comp eligibility. TerraFlow MAY consume this for
  county-scoped, paginated reads of Qualified canonical sales.
  Long-term, Forge owns the consumer-facing comp API; the Sync
  endpoint stays as admin/diagnostic.

### HTTP cache contract (C45 family)

All Sync read endpoints emit:
- Strong, scope-prefixed `ETag` (e.g. `comps:e`, `comps:s`,
  `comps:ss`, `awb`).
- `Cache-Control: private, max-age=N` (with
  `stale-while-revalidate=120` on comp endpoints).
- `Vary: Authorization`.
- `If-None-Match` → 304 short-circuit.
- `If-Modified-Since` → 304 short-circuit.
- `If-Match` → 412 on mismatch (optimistic concurrency on the
  pointer endpoint).
- HEAD method support.

TerraFlow clients SHOULD send `If-None-Match` to avoid pulling
unchanged payloads. Cache-key invariance is preserved across
additive changes (e.g. workbook-name enrichment in C46/C47 did
NOT change the ETag seed).

## What TerraFlow owns (Sync MUST NOT implement)

These are workflow / orchestration / human-in-the-loop concerns.
They belong to TerraFlow. If a future Sync slice proposes any of
these, the slice is rejected on boundary grounds.

### Mapping Workbook review workflow

Sync owns the Mapping Workbook **data model**: Draft → Mapped
lifecycle, per-column mapping rows, lock semantics, idempotent
rerun on the canonical transform.

TerraFlow owns:
- **Review queues.** Which operator is reviewing which
  workbook's mapping decisions, in what order, with what
  priority.
- **Edit-flow UX.** The actual screens and interactions an
  operator uses to set / change a mapping.
- **Lock approval.** Whether locking a workbook into Mapped
  requires a supervisor sign-off, multiple operators, or a
  dictionary-coverage threshold.
- **SLAs and escalations.** Time-to-lock, idle-mapping alerts,
  reassignment.

### Stale-row remediation workflow

Sync detects staleness. Sync does not decide what happens next.

TerraFlow owns:
- **Rerun policy.** Whether to rerun the canonical transform
  immediately on workbook rotation, batch overnight, require
  approval, etc.
- **Operator routing.** Which person is responsible for
  resolving a stale group, with what priority.
- **Notification.** Email/in-app/calendar surfacing of stale
  rows.
- **Audit narrative.** "Workbook A was rotated to Workbook B on
  date X by operator Y because Z, affecting N rows" — the
  human-readable story across the rotation event.

### Approval chains

Sync's `PUT /api/sync/active-workbook` is a single-operator
mutation today. If a county needs supervisor sign-off for
pointer rotation, that approval chain lives in TerraFlow and
calls Sync's PUT only after approval is recorded.

### Task assignment / notifications / dashboards

- Per-operator task lists, prioritization, reassignment →
  TerraFlow.
- Email / SMS / in-app notification → TerraFlow.
- Operator-facing dashboards (real product UX, not Sync admin /
  diagnostic) → Studio / Dais, orchestrated via TerraFlow.

## Non-goals for SCOPE-1

- **No TerraFlow engine code.** This document is a contract,
  not a build slice.
- **No Sync deprecation.** All transitional Sync read surfaces
  remain callable.
- **No replication of canonical data into TerraFlow-owned
  tables.** TerraFlow reads from Sync canonical tables and from
  the Sync API; it does not maintain its own copies.

## Open questions (deferred to TerraFlow bring-up slices)

- Persistence model for TerraFlow review queues (separate DB?
  same DB, separate schema? in-memory + event log?).
- TerraFlow's own audit story (does it inherit the
  `AuditableEntityInterceptor` pattern, or define its own?).
- Cross-product event bus: does Sync emit "workbook locked" /
  "pointer rotated" events for TerraFlow to subscribe to, or
  does TerraFlow poll the existing read endpoints? SCOPE-1 does
  not decide this — it only fixes the boundary.
