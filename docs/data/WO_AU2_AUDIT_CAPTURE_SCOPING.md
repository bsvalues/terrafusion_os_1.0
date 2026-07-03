# AU-2 Audit-Capture — Scoping Packet (design only, not implementation)

**Date:** 2026-07-02
**Risk:** R1 — scoping/design document. No code, no DB, no walls crossed. Implementation of any sub-WO below
requires its own authorization (SW-09 code; one sub-WO is SW-02 schema migration).
**Why this exists:** `WO-AUDIT-ROUTE-001` implemented `/api/audit/trail` + `/api/audit/search` reading
`AuditEvents`, but that table is **empty** because domain audit-event capture is unwired. This packet scopes the
capture effort so it can be run as its own program.

## Current state (source-verified, read-only)
- **No `AuditableEntityInterceptor`** exists in `backend/src` (the CLAUDE.md AU-2 note calls it "referenced but not
  implemented" — confirmed: only bin/ DLL artifacts match).
- **Nothing writes `AuditEvents`.** No `_db.AuditEvents.Add` / `new AuditEvent(...)` in source. The only
  audit-ish writers are a **no-op stub** (`ProductionHelperModels.LogAuditEvent(...) { }`) and an unrelated
  Consciousness `IAuditLogger` (different DTO). `AuditEvents` count = 0 (per `WO_DATA_BENTON_QUARANTINE_001`).
- **52 entities** carry `CreatedBy`/`UpdatedBy`/`CreatedAt`/`UpdatedAt` fields that are currently **unstamped** —
  the forward contract CLAUDE.md describes for the missing interceptor.
- **Actor source exists:** `IRequestUserContextAccessor` (`HttpContextRequestUserContextAccessor`) yields the
  current user for HTTP requests. (It will resolve to no-user for background/ETL contexts — see risks.)
- **Consumer already built:** `AuditEvents` columns (`Entity, EntityId, UserId, Action, Type, DetailsJson,
  Timestamp`) map cleanly to the `AuditEvent` contract the trail/search endpoints emit. Wiring writes lights up the
  Dais audit tabs with **no further frontend change**.

## Two distinct capture needs (often conflated as "AU-2")
1. **Entity audit-field stamping** — auto-set `CreatedAt/By`, `UpdatedAt/By` on the 52 auditable entities. This is
   attribution metadata on the rows themselves (AU-3 content). Canonical mechanism: an EF Core
   `ISaveChangesInterceptor`.
2. **Domain audit-event emission** — write `AuditEvents` rows describing *what changed* (value change, appeal filed,
   exemption granted, …) — the trail/search feed (AU-2 event log). Mechanism choice is the main design decision.

These are related but separable; the trail/search UI depends on **#2**.

## Design options
### Stamping (#1)
- **`AuditableEntitySaveChangesInterceptor` implementing `ISaveChangesInterceptor`** + an `IAuditableEntity` marker
  interface on the 52 entities. On `Added` → set Created*; on `Modified` → set Updated*, sourced from
  `IRequestUserContextAccessor`. Register in `AddDbContext(... .AddInterceptors(...))`. Low-risk, well-trodden.

### Event emission (#2) — pick one
- **(a) Interceptor-driven (automatic):** the same interceptor emits an `AuditEvent` per tracked mutation. Broad
  coverage, but **noisy** and dangerous on bulk/ETL paths (a 1.87M-row drain would emit 1.87M audit rows).
- **(b) Explicit domain calls (curated):** an `IAuditEventWriter` invoked at meaningful actions (Dais/Workbench
  value change, appeal, exemption, cert step). Clean, maps directly to the `category` taxonomy, low volume.
- **(c) Hybrid (recommended):** explicit emission for user-facing domain actions (drives the trail); interceptor
  stamping for the Created/Updated metadata; **bulk/sync/ETL paths excluded** from event emission entirely.

## Key risks / decisions (for the operator)
- **Volume/perf:** must exclude the sync/drain/populate paths (legacy_pacs_raw, canonical projectors) from event
  emission — audit the *assessor's* actions, not the ETL. Option (b)/(c) handle this by construction.
- **Actor in background contexts:** the interceptor runs inside `SaveChanges`, which for hosted services/ETL has no
  `HttpContext` → user resolves to "system". Need an ambient accessor that returns "system"/job-id off-request.
- **Tenancy:** `AuditEvents` has **no `CountyId`** column. Decide: add one (recommended for county isolation on the
  trail, and lets `/api/audit/trail` enforce true county isolation instead of parcel-scope-only) — or derive.
- **Indexing:** trail/search filter `EntityId` + `Timestamp` → add an index `(EntityId, Timestamp desc)`.
- **No retroactive audit:** existing rows stay unstamped; capture is forward-only. State this honestly in the UI.
- **Compliance framing:** this is the FISMA **AU-2 (event capture)** + **AU-3 (record content)** control work —
  it is a real accreditation item, not cosmetic.

## Proposed sub-WOs (a small program, sequenced)
| WO | Scope | Risk |
|----|-------|------|
| **AU2-1** | `IAuditableEntity` marker + `AuditableEntitySaveChangesInterceptor` (stamping) + DI registration + unit tests | SW-09 code |
| **AU2-2** | `AuditEvents` schema: add `CountyId` + index `(EntityId, Timestamp)` via EF migration (API as `--startup-project`) | SW-02 schema migration |
| **AU2-3** | `IAuditEventWriter` + explicit emission at curated Dais/Workbench domain actions, mapping to the `category` taxonomy | SW-09 code |
| **AU2-4** | Exclusion policy: guarantee bulk/sync/ETL paths never emit domain audit events | SW-09 code |
| **AU2-5** | End-to-end verification: perform a domain action → `/api/audit/trail` returns the event; contract test | SW-09 test |

## Disposition
Scope **defined**; **not implemented**. Recommend running AU2-1…AU2-5 as a dedicated program with per-WO
authorization — the blast radius touches every write path and a schema migration, so it should not be a single
unilateral change. Until then, the trail/search endpoints correctly return honest-empty.
