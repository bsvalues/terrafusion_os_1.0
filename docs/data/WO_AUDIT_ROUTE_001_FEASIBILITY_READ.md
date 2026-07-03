# WO-AUDIT-ROUTE-001 — Audit Data Feasibility Read (SW-03)

**Date:** 2026-07-02
**Authorization:** SW-03 (credentialed read-only) — "check if AuditLogs is populated".
**Risk executed:** R0 — SELECT/estimate-only against `terrafusion_benton_demo`. Credential in-memory from app setting
`ConnectionStrings__DefaultConnection`; never printed, logged, persisted, or committed. No writes.
**Purpose:** decide the SW-09 fix for the Dais `trail`/`search` 404 gap (`WO_AUDIT_DEPLOY_001_*`): serve real audit
history (Option A) vs honest-empty (Option C).

## Finding — no populated per-parcel audit-event data exists

| Table | Shape | Rows | Usable as `AuditEvent` source? |
|-------|-------|------|--------------------------------|
| `public.AuditEvents` | `Entity, EntityId, Action, DetailsJson, UserId, Timestamp, …` (domain audit) | **0** | Right shape, **but empty** |
| `public.AuditLogs` | `Type, RequestPath, RequestMethod, ResponseStatusCode, DurationMs, CorrelationId, …` (HTTP telemetry) | **~30,227,842** | **No** — request logs, no `parcelId`/`category`/`previousValue`/`newValue` |
| `public.SecurityEvents` | auth/security events | empty (est −1) | No — not per-parcel domain events |
| `public.AuditFindings` / `AuditReconciliations` | levy/roll audit (the existing `AuditController` surface) | empty (est −1) | No — different domain |

(Row figures: `AuditEvents` exact `COUNT(*)` = 0; `AuditLogs` from `pg_class.reltuples` estimate — an exact count
timed out at 60s, consistent with a ~30M-row telemetry table; the others show `reltuples = −1` = never analyzed / empty.)

### What this means
- `AuditEvents` is the **correctly-shaped** backing (`Entity='Parcel'`, `EntityId=parcelId`, `Action`, `DetailsJson`)
  for the Dais `AuditEvent` contract — but it holds **zero rows**.
- `AuditLogs`, despite 30M rows, is **HTTP-request telemetry** (Serilog-style), not a per-parcel domain trail, and
  cannot populate `AuditEvent` (`parcelId`, `category ∈ assessment|appeal|…`, `previousValue`/`newValue` absent).
- **Deeper root cause:** domain audit-event *capture is not wired* — nothing writes `AuditEvents`. This matches the
  documented AU-2 gap in `CLAUDE.md` (the `AuditableEntityInterceptor` is referenced but **not implemented**), so no
  create/update stamping or domain-event emission is occurring.

## Decision for the SW-09 fix (updated recommendation)
Because there is **no data to serve**, "Option A returning real history" is moot today. The correct, honest fix:

1. **Implement `GET /api/audit/trail` + `GET /api/audit/search` reading `AuditEvents`** (filter
   `Entity='Parcel' AND EntityId=parcelId`; map `Type`/`Action`/`DetailsJson` → `AuditEvent`). Today these return
   **`[]` honestly** (table empty); when audit capture is later wired, the same endpoints light up with no further
   frontend change. This is Option A-against-`AuditEvents` **and** converges with Option C (honest-empty now).
   - Mapping decisions required (→ SW-09): `Type` (int) → `category`; `previousValue`/`newValue` extracted from
     `DetailsJson`; `userName` resolved from `UserId`.
2. **Frontend honesty:** the callers currently `throw` on `!res.ok`; even with a 200-empty they should render a
   "No audit events recorded for this parcel" disclosure (matching the flags/appeals honest-empty pattern), not an
   error. Small frontend change bundled with the SW-09 fix.
3. **Separate, larger effort (not this WO):** wiring domain audit-event *writes* into `AuditEvents` (the AU-2
   interceptor). Until that lands, the trail is honestly empty — which is truthful, not broken.

## Disposition
Feasibility read **COMPLETE**. Verdict: **no populated audit-event data → fix = implement endpoints against the
(empty) `AuditEvents` table returning honest-empty + a UI disclosure.** Implementation is a code change → **SW-09**
(not crossed here). The audit-capture wiring (AU-2) is a distinct future effort.
