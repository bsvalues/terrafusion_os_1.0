# WO-AUDIT-DEPLOY-001 — Dais Audit Trail/Search Route-Contract Investigation

**Date:** 2026-07-02
**Risk executed:** R0 — read-only (source analysis + anonymous GET probes). No writes, no code change, no DB creds used.
**Stops at:** the fix is a code change → **SW-09** (not crossed here). This packet is the diagnosis + options only.
**Supersedes:** the read-only portion of spawned task `task_3af9858f`.

## TL;DR
The two Dais audit UI surfaces call `/api/audit/trail` and `/api/audit/search`, which **do not exist as routes**.
`AuditController` owns `api/audit` but implements a *different* (levy/roll-compliance) audit surface. The 404 is a
**route-contract gap in code**, not a deployment problem — so the "DEPLOY" in the WO name is a misnomer; this is
**WO-AUDIT-ROUTE-001** in substance (a code fix, SW-09).

## The mismatch (source-verified)

### Frontend expects (callers)
| Surface | Call | Returns |
|---------|------|---------|
| `components/dais/AuditTab.tsx:43` | `GET /api/audit/trail?parcelId=<id>` | `AuditEvent[]` |
| `pages/dais/AuditTrailPage.tsx:35` | `GET /api/audit/search?parcelId&startDate&endDate&userId&category&action` | `AuditEvent[]` |

`AuditEvent` (from `AuditTab.tsx`):
```ts
{ eventId, parcelId, timestamp, userId, userName, action,
  category: 'assessment'|'appeal'|'permit'|'exemption'|'document'|'field'|'system',
  details, previousValue?, newValue? }
```
Both callers do `if (!res.ok) throw` — so a 404 makes the tab **throw an error**, not show an honest-empty state.

### Backend actually exposes (`AuditController`, `[Route("api/audit")]`, `[Authorize]`)
```
GET  roll-summary        POST findings         GET compliance-report
GET  levy-compliance     POST reconciliation
```
No `trail`, no `search`. It is a levy/roll-certification audit surface — unrelated to a per-parcel event trail.
No other controller claims `api/audit` (`LevyAuditController`, `SalesAuditController`, `UserAuditController` use
other routes).

## Live proof — route-miss vs auth-wall (anonymous GET, demo)
```
404  GET /api/audit/trail?parcelId=X          ← route does not exist
404  GET /api/audit/search?parcelId=X         ← route does not exist
401  GET /api/audit/roll-summary              ← route exists, auth required
401  GET /api/audit/compliance-report         ← route exists, auth required
```
The 404-vs-401 contrast is the proof: `trail`/`search` produce **no route match** (404), whereas real
`AuditController` actions produce an **auth wall** (401). This is not a deploy/auth issue — the actions are absent.

## Adjacent finding — a parcel-activity endpoint DOES exist (different shape)
`frontend/apps/os-shell/src/services/api/activityApi.ts` calls `GET /api/properties/parcel/{geoId}/activity`
(PropertiesController). Live probe:
```
200  GET /api/properties/parcel/12345/activity   →  {"items":[],"total":0}
```
So a working parcel-scoped activity endpoint exists (anonymous, honest-empty `{items,total}` envelope) — but its
shape (`{items,total}`) differs from the Dais contract (`AuditEvent[]`), and the Dais tabs do **not** call it.
Whether its item schema carries audit semantics (category/action/previousValue/newValue) is unknown from HTTP alone.

## Fix options (each is a code change → SW-09; none applied)

- **Option A — implement the endpoints.** Add `GET /api/audit/trail` + `GET /api/audit/search` to `AuditController`
  returning `AuditEvent[]` from a per-parcel audit source. *Feasibility gate:* requires a populated per-parcel audit
  event store (e.g. `AuditLogs`). Confirming that data exists is a **credentialed DB read** (separate authorization)
  — deliberately not done in this read-only WO.
- **Option B — repoint the frontend** to `/api/properties/parcel/{id}/activity`, adapting to the `{items,total}`
  envelope and mapping item→`AuditEvent`. Frontend-only; valid *only if* that endpoint's items carry the audit
  fields. Needs a schema check first.
- **Option C — honest-empty stub.** Make `trail`/`search` return `[]` (or repoint callers to tolerate empty) plus a
  "no audit events / unavailable" disclosure, so the tabs stop throwing on 404 — the smallest honest change,
  matching the flags/appeals honest-empty pattern already used elsewhere in Dais.

## Recommended sequence (for operator decision)
1. **Credentialed read (SW-03):** determine whether any per-parcel audit event data exists — `AuditLogs` population
   + the `/activity` endpoint's item schema. This decides A vs C.
2. **Then the code fix (SW-09):** Option A if real audit data exists; otherwise Option C to stop the 404-throw and
   disclose honestly. Option B only if the activity endpoint already carries audit semantics.
3. **Rename** the WO to reflect reality — it is a route/contract code gap (`WO-AUDIT-ROUTE-001`), not a deploy gap.

## Disposition
Investigation **COMPLETE** (read-only). Root cause proven: `/api/audit/{trail,search}` are unimplemented routes; the
Dais audit tabs 404-and-throw. No code changed. Next step requires SW-03 (feasibility read) then SW-09 (code) —
both await explicit authorization.
