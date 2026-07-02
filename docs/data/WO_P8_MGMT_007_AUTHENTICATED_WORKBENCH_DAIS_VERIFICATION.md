# WO-P8-MGMT-007 — Authenticated Workbench / Dais Surface Verification

**Program:** P8 — Management Dashboard (authenticated-surface verification lane)
**Date:** 2026-07-02
**Mode:** SW-10 authenticated read + SW-03 secret use (both explicitly authorized). GET-only. No writes,
no mutation, no deployment, no auth-policy change.
**Authorization:** Operator granted, choosing **auth method B — mint a JWT**. The JWT signing secret
(`JwtSettings__SecretKey`) was read in-memory from Azure app settings, used only to sign a short-lived
(15 min) HS256 token, and **never printed, logged, or committed**. The token was GET-only and has since
expired.
**Follows:** WO-P8-MGMT-007 (SCOPING) — this executes the pre-scoped 4-endpoint GET list.

---

## 0. Outcome (headline)

**SUCCESS — all 4 scoped endpoints are reachable and render for an authenticated operator.** Three
return 200 immediately; the fourth (`sync-readiness`) passes auth and renders its DTO once its required
workflow IDs are supplied. The verification also surfaced the **real authorization model** the frontend
must satisfy (module-permission gate + county isolation), and confirmed the demo simply has **no seeded
flags/appeals** (empty, not broken).

---

## 1. Results — the 4 scoped GET endpoints (authenticated)

| Endpoint | HTTP | Renders | What an operator sees |
|----------|------|---------|-----------------------|
| `GET /api/workbench/flags` | **200** | ✅ empty | `{"total":0,"page":1,"pageSize":25,"items":[]}` — supervisor flag queue is **empty** (none seeded), not an error |
| `GET /api/dais/appeals` | **200** | ✅ empty | `[]` — no appeals seeded in the demo |
| `GET /api/dais/cert/status?county=Benton&taxYear=2025` | **200** | ✅ **real data** | `{"county":"Benton","taxYear":2025,"rollStatus":"blocked","completionPct":0,"steps":[{"step":1,"name":"DATA_VALIDATION","status":"blocked",…}]}` — real certification-roll workflow state |
| `GET /api/workbench/sync-readiness` | **400 → 200** | ✅ (with IDs) | 400 `"countyId is required"` bare; with `?countyId=<guid>&sourceConnectionId=<guid>` → **200** readiness DTO (`reachability.status:"UNKNOWN"` for a non-existent source) |

**Verdict:** none of the four is broken or permanently 401. The MGMT-006 shell + a valid operator token
give a working authenticated surface. Empty payloads (flags, appeals) reflect **unseeded demo data**, and
are disclosed honestly by the API (empty arrays, not fabricated rows). `cert/status` returns genuine
workflow state; `sync-readiness` is contract-guarded on operator-workflow IDs.

---

## 2. The authorization model the frontend must satisfy (real finding)

Reaching these endpoints is **not** just "be authenticated." The verification token had to carry:

1. **A `perm` claim gate.** `WorkbenchFlagsController` GET is `[RequiresPermission("access:dais")]`, enforced
   by `ModuleAccessHandler` (exact case-insensitive match of a `perm` claim to the required key). Without a
   `perm: "access:dais"` claim the token authenticates but gets **403** (proven: a token without perms →
   403 on `/api/workbench/flags`).
2. **County isolation (Dais).** `DaisController` (`[Authorize]`) resolves county from a `countyId` (GUID)
   claim or a `countyCode` claim (matched to `Counties` by name/FIPS). Authenticated-but-no-county → 403.
   A `countyCode:"Benton"` claim resolved correctly server-side (appeals/cert returned 200).
3. **Role policies** exist (`RequireAssessor` = Assessor/Admin/SystemAdmin, `OSCoreAccess` = GovernmentUser/
   SystemAdministrator/Admin/SystemAdmin). The verification token carried these roles.

Implication for a real operator login: the issued token (`JwtTokenService`) must include the operator's
`perm` module claims and county context, or these panels 403/403-empty even for a valid user. This is the
correct deny-by-default posture — it just means "logged in" is necessary but not sufficient; module +
county entitlements are enforced.

---

## 3. `sync-readiness` contract (fully characterized)

`WorkbenchSyncReadinessController` GET requires **both** `countyId` and `sourceConnectionId` (GUIDs):
- no params → 400 `"countyId is required."`
- `countyId` only → 400 (then requires `sourceConnectionId`)
- both supplied → **200** with a readiness DTO: `{countyId, sourceConnectionId, workbookId, assembledAtUtc,
  reachability:{status:"UNKNOWN", headline:"Reachability pro…"}}`.

With **synthetic** GUIDs the DTO renders but `reachability.status = UNKNOWN` (the source connection doesn't
exist). Live reachability needs the operator's real `countyId` + a configured PACS `sourceConnectionId` —
IDs the UI supplies from a selected source. (Note: PACS is likely unreachable from Azure anyway — the
startup log shows a `Microsoft.Data.SqlClient` "server not found" for the PACS/MSSQL probe; the demo's
canonical data lives in Postgres.) The endpoint is **not broken** — it gracefully returns a DTO instead of
erroring on a missing source.

The real Benton `Counties.Id` GUID was not exposed by any endpoint probed (EliteDashboard/counties,
county-study, counties, system/status all returned data without the PK GUID) — not required for this
verification, and the UI obtains it from its bootstrap/county-context.

---

## 4. Method + secret handling (SW-03 discipline)

- **Token minted locally** with a dependency-free HS256 signer (Node `crypto`), claims: `sub`/nameidentifier,
  email, roles (Assessor/Admin/SystemAdmin/SystemAdministrator/GovernmentUser), `perm` (access:dais +
  sibling module perms), `countyCode:"Benton"`, `iss`/`aud` from settings, 15-min `exp`.
- **Secret** (`JwtSettings__SecretKey`, 64 chars) read in-memory from Azure app settings, used only to sign,
  **never printed/logged/committed**. Issuer `TerraFusion.API`, audience `TerraFusion.Client` (non-secret).
- **GET-only.** No POST/PUT/DELETE, no `/refresh`, `/drain`, `/route`, `/dismiss`, no status changes. Token
  expired after the run; the minter script lives only in the session scratchpad (contains no secret).

---

## 5. Findings summary

1. **The authenticated Workbench/Dais surface works** — 4/4 endpoints reachable; `cert/status` renders real
   roll-certification state; `flags`/`appeals` are honestly empty (unseeded demo); `sync-readiness` renders
   once given workflow IDs.
2. **Entitlements are enforced beyond authentication** — `perm:"access:dais"` module claim + county context
   are required; a bare authenticated token gets 403. Real operator tokens must carry these.
3. **`sync-readiness` reachability is UNKNOWN** for synthetic/absent sources; live PACS reachability is a
   separate question (PACS unreachable from Azure per the startup MSSQL error — canonical data is in PG).
4. Cross-ref: the Dais **audit-trail** panel remains a 404 route gap (WO-AUDIT-DEPLOY-001, task_3af9858f) —
   independent of auth, not retested here.

---

## 6. Evidence log

- Minted HS256 token (len ~1201) validated by the API (401 → 403 without perms → 200 with perms+county).
- `GET /api/workbench/flags` → 200 `total:0 items:[]`.
- `GET /api/dais/appeals` → 200 `[]`.
- `GET /api/dais/cert/status?county=Benton&taxYear=2025` → 200 `rollStatus:"blocked"` + steps.
- `GET /api/workbench/sync-readiness` → 400 `countyId is required`; `?countyId&sourceConnectionId` → 200 DTO
  `reachability.status:"UNKNOWN"`.
- Auth model: `WorkbenchFlagsController [RequiresPermission("access:dais")]`; `ModuleAccessHandler` perm-claim
  match; `DaisController` `ResolveCountyIdAsync` (countyId/countyCode claims).

---

**WO-P8-MGMT-007: COMPLETE.** The authenticated Workbench/Dais surface is verified reachable and rendering;
the real entitlement model (perm + county) is documented; `sync-readiness` is contract-characterized. No
writes, no secrets exposed, no walls crossed beyond the authorized SW-10/SW-03 read.
