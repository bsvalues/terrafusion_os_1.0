# WO-AU2-5 — Deploy + Live End-to-End Audit-Trail Verification

**Date:** 2026-07-03
**Authorization:** SW-01 (deploy) granted by operator.
**Result:** Deploy **SUCCESS** (all platform verifications green) · Live e2e **FAIL with root cause proven** —
a latent FK defect that only a live e2e could catch. Fix requires a NEW schema migration → parked at SW-02
(proposed **WO-AU2-5B** below). The deployed system is safe and unchanged in behavior for users.

## What was deployed
The 10 open PRs had not merged yet, so a local **deploy-integration** branch (`au2-5-deploy-integration`) was built
from `origin/main` + `wo/audit-route-001-impl` (#1171 trail/search) + `wo/au2-1-audit-stamping` (#1174) +
`wo/au2-3-audit-emission` (#1176, includes AU2-2 migration via stack). Merges clean; Release `/warnaserror` 0-warn.
Session-precedent DLL-level deploy (MGMT-006): backed up then Kudu-VFS PUT **three managed DLLs** —
`TerraFusion.API.dll` (endpoints+emission), `TerraFusion.Data.dll` (interceptor+migration), `TerraFusion.Core.dll`
(entity) — then restarted. Full zip deploy deliberately avoided (would wipe `appsettings.BentonCounty.local.json` +
`ui-dist`). Backups in session scratchpad (`au25-backup-*.dll`).

## Platform verification — ALL GREEN
| Check | Result |
|---|---|
| `/health/ready` after restart | **200** (truthful readiness gate) |
| `/api/audit/trail` `/api/audit/search` (anon) | **404 → 401** — routes now exist, auth-walled |
| SPA `/` + `/api/sync/doctrine/state` | **200** — untouched |
| **AU2-2 migration auto-applied** | `AuditEvents.CountyId` present · `IX_AuditEvents_EntityId_Timestamp` present · top of `__EFMigrationsHistory` = `20260703002317_AU2_2_...` |

## Live e2e — FAIL, root cause proven
Sequence (minted operator token, in-memory): `GET /api/dais/exemptions/eligibility?county=Benton&parcelId=AU25-E2E-TEST`
(the least-mutating instrumented action — its only writes are audit rows) → **200 eligible** → then
`GET /api/audit/trail?parcelId=AU25-E2E-TEST` → **200 `[]`** (empty; search likewise).

**Root cause (deterministic, DB-verified):**
```
FK_AuditEvents_CollaborationUsers_UserId : AuditEvents.UserId → CollaborationUsers.Id (ON DELETE CASCADE)
CollaborationUsers row count = 0
⇒ every AuditEvents INSERT violates the FK → AuditEventWriter catches (by design, never throws) → trail empty
```
- `AuditEvent` was originally a **collaboration** entity; its `UserId` is FK'd to `CollaborationUsers`. The domain
  trail's actor is a JWT claim (GovernmentUser GUID or `"system"`) — those values can never satisfy that FK, and
  seeding shadow collaboration users per operator would be the wrong contract.
- **Why tests missed it:** AU2-3 unit tests run on EF InMemory, which does **not enforce FK constraints**. The
  live-Postgres e2e is precisely the layer that exposes this.
- Deployed behavior is **safe**: emission fails closed (logged, swallowed); `AuditLogs` telemetry still writes
  (step-1 200 proves the action + governed logging path work); trail endpoints return honest-empty.

## Proposed fix — WO-AU2-5B (needs SW-02: new schema migration)
1. Remove the `AuditEvent.User` navigation + `CollaborationUser.AuditEvents` collection (and the `ProjectId` FK if
   it constrains similarly) so `UserId` becomes a plain actor string — matching the trail contract.
2. EF migration dropping `FK_AuditEvents_CollaborationUsers_UserId` (and relationship metadata). Generate with API
   as `--startup-project`; inspect Up/Down (expect only FK drops).
3. Redeploy the two affected DLLs (Core/Data — and API if touched), restart, **re-run this exact e2e** → expect the
   `check_exemption_eligibility` event on the trail with `category=exemption`, actor GUID, CountyId=Benton.
4. Guard: consider a Postgres-backed (Testcontainers/SQLite-with-FKs) test for the writer to catch FK realities.

## Disposition
- Deploy + platform verification: **COMPLETE** (SW-01 executed as authorized).
- Trail-populates proof: **BLOCKED by the FK defect** — honest e2e verdict recorded, not massaged.
- **Awaiting operator authorization for WO-AU2-5B** (SW-02 migration + redeploy + re-verify).
