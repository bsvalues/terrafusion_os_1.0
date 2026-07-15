# WO-P8-MGMT-004 - Frontend Deployment Authorization Packet

**Work Order:** WO-P8-MGMT-004
**Program:** P8-MGMT - Management Dashboard (roadmap Phase 8)
**Date:** 2026-07-15 reconciliation of the 2026-07-01 packet
**Base:** `origin/main` at `a80ae07e6d2384dd9761d9995b84a53d1067c19e`
**Mode:** Planning / authorization packet only. **No deployment, provisioning, secrets, or runtime change.**
**Status:** COMPLETE - packet reconciled; deployment remains parked at SW-01
**Authority Boundary:** This document stops at SW-01. It does not deploy. It is the review an
operator reads before authorizing WO-P8-MGMT-005 (frontend deployment execution).

---

## 0. Purpose

WO-P8-MGMT-002 proved that the existing dashboards could render Azure demo data from a local
frontend on July 1, 2026. WO-P8-MGMT-003 made the API-base convention single-config clean for local
Vite proxying. This packet defines what an operator needs to decide whether and how to make the
frontend reachable on the Benton demo without crossing SW-01 here.

**Build nothing new.** The surfaces exist. This is a deployment/reachability decision. The prior
Azure observations are historical evidence; this reconciliation did not re-probe any live resource
and does not claim current Azure state.

---

## 1. What Would Be Deployed

The `frontend/apps/os-shell` SPA (Vite build to `native-shell/ui/dist`), served so these existing
routes are reachable against the selected API environment:

| Route | Surface | Expected source behavior |
|-------|---------|--------------------------|
| `/workbench/sync-doctrine` | Sync Doctrine Console | Relative `/api/sync/doctrine/state`; values must trace to the response used in deployment proof |
| `/workbench/sync-readiness` | Sync Readiness Console | Probe-on-click; no automatic claim without an operator probe |
| `/dais` | Assessor Management Dashboard | Authenticated Dais endpoints or honest `unavailable` / aggregate-fallback disclosure |

No new component or backend behavior is authorized by this packet.

---

## 2. Two Deployment Options

### Option A - Same-origin: API serves the SPA (recommended)

The .NET API already contains static-file and SPA-fallback behavior for `native-shell/ui/dist`.
Build the SPA and include it in the API artifact so the SPA and API share one origin.

| Property | Contract |
|----------|----------|
| Browser API base | Relative `/api`; `VITE_API_URL` omitted for the browser build |
| CORS | No new browser cross-origin API access required |
| Build output | `native-shell/ui/dist`, included in the API deployment artifact |
| Benefit | Matches the current canonical client and avoids a second public origin |
| Cost | Couples SPA and API release cadence; artifact assembly and deep-link fallback require proof |

### Option B - Separate static host with explicit path proxy

Host the SPA separately only if its hosting layer also routes `/api`, `/hubs`, `/health`, `/ops`,
and `/levy` to the API. WebSocket routing must be preserved for `/hubs` where used.

| Property | Contract |
|----------|----------|
| Browser API base | Still relative `/api`; current browser `apiBase` ignores `VITE_API_URL` |
| Routing | Static host, gateway, or reverse proxy must forward backend paths |
| CORS | Required only if a separately authorized implementation introduces direct cross-origin calls |
| Benefit | Independent SPA release cadence |
| Cost | New cloud/routing surface, additional failure modes, and explicit SW-01 authorization |

`VITE_API_URL=<api-origin>` is sufficient for the **local Vite proxy**, but it is not a runtime
redirect for an already-built browser bundle. A plain static host with no path proxy is therefore
**HOLD**. Changing browser clients to direct absolute API URLs is a separate implementation and
security review, not part of WO-P8-MGMT-005 as currently defined.

**Recommendation: Option A.** It matches the current source contract and has the smallest public
surface. Option B is eligible only after its route design is explicit.

---

## 3. Setting And Secret Names

Values are deliberately omitted. The selected deployment must disposition only the applicable names.

### Frontend build posture

- `VITE_API_URL` - local Vite proxy target; omit for same-origin browser serving.
- `VITE_USE_MOCK_DATA`
- `VITE_DATA_MODE`
- `VITE_ALLOW_NON_LIVE_MODE`
- `VITE_DEV_PREVIEW_BYPASS_AUTH`
- `VITE_ENFORCE_AUTH_IN_DEV`
- `VITE_COUNTY_ID`
- `VITE_COUNTY_NAME`
- `VITE_APP_ENV`
- `VITE_MAPBOX_TOKEN` - optional secret-bearing feature setting if the selected surface requires it.

### API / host posture

- `ASPNETCORE_ENVIRONMENT`
- `Cors__AllowedOrigins__<index>` (equivalent to `Cors:AllowedOrigins`)
- `JwtSettings__SecretKey`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- `JwtSettings__ExpirationMinutes`
- `DefaultCounty__Id`
- `DefaultCounty__Code`

The selected secret provider must supply secret values. This packet does not read or authorize any
value. A public or production-like host must not depend on the development-only
`/api/auth/dev-token` endpoint. Any change from the recorded auth posture triggers SW-10.

---

## 4. Health And Readiness Expectations

| Check | Expectation |
|-------|-------------|
| `GET /` | 200 and the expected `index.html` artifact |
| SPA deep links | `/dais`, `/workbench/sync-doctrine`, and `/workbench/sync-readiness` return the SPA rather than 404 |
| Static assets | Load without path-base, CSP, or mixed-content failures |
| `GET /healthz` | Liveness only; proves process routability, not dependency readiness |
| `GET /healthz/ready` | Capture result but preserve the Backend OE caveat: the current predicate does not prove PACS readiness because the PACS tag does not match the selected readiness tag |
| Relative API routes | Resolve through the selected same-origin or proxy contract |
| Console render | Values trace to captured API evidence; unavailable dependencies are disclosed |

The static SPA has no independent server-side health endpoint. Its proof is document, asset, deep-link,
and bounded API delivery. Feature health endpoints must not be substituted for platform readiness.

---

## 5. Honesty Gate

- Source badges remain present and `unavailable` / `partial` appears where data or auth is missing.
- No fabricated numbers, stale `89,247` count, stub agent counts, or randomized metrics appear.
- Guardrail dashboards remain guardrails; they do not start emitting unsupported counts.
- Dais aggregate fallback is not labeled as Dais-native evidence.
- Sync Doctrine values trace to the API response captured for the validation.
- Auth failures remain visible; a missing production auth flow is not hidden by preview bypass.
- Health and readiness claims use the semantics in section 4.

---

## 6. Decision And Stop Walls

| Decision | Conditions |
|----------|------------|
| **PASS TO AUTHORIZATION** | Host option, exact artifact SHA, resource, config names, auth posture, validation plan, and rollback target are explicit |
| **HOLD** | Routing, auth, readiness, rollback, current live state, or setting ownership is unresolved |
| **FAIL** | Scope requires secret disclosure, unauthorized cloud/data mutation, mock data presented as live, production/county launch, or unapproved client behavior changes |

| Wall | Triggered by | This packet |
|------|--------------|-------------|
| **SW-01** | Publishing the SPA, changing a cloud resource, or making routes publicly reachable | **NOT crossed** - packet only |
| **SW-10** | Changing auth policy, shipping preview bypass as public auth posture, or introducing direct cross-origin auth behavior | **NOT crossed** - requires an explicit decision if applicable |
| **SW-04** | Promoting the demo to county-facing production | **NOT crossed** - out of scope |

Current decision: **HOLD AT SW-01**. Completion of this packet is not deployment authorization.

---

## 7. Rollback And Evidence Requirements

Any later deployment authorization must name:

- the immutable frontend/API artifact or commit SHA;
- the prior known-good artifact or slot;
- the exact host and environment boundary;
- configuration names changed, without recording secret values;
- the rollback action and authorized executor;
- liveness, SPA route, static asset, API route, auth, honesty, and log checks;
- stop criteria and evidence location.

This is rollback planning only. No slot swap, artifact deployment, restart, or configuration rollback
was executed.

---

## 8. Exact Authorization Required

A sufficient bounded decision for WO-P8-MGMT-005 must identify the exact environment, resource,
artifact SHA, host option, allowed configuration-name changes, validation plan, rollback target, and
any auth-posture change:

```text
OWNER_DECISION: APPROVED
WORK_ORDER: WO-P8-MGMT-005 - Frontend Deployment Execution
AUTHORIZE: Deploy the specified Management Dashboard artifact SHA to the specified non-production
Azure resource using the selected host option, with only the listed configuration names, validation
steps, and rollback target.
BOUNDARY: SW-01 only; no county production launch, data mutation, PACS/county SQL access, secret
disclosure, DNS widening, or auth-policy change unless separately enumerated and authorized.
```

---

## 9. Evidence And Non-Claims

- Scope: `docs/data/WO_P8_MGMT_001_MANAGEMENT_DASHBOARD_SCOPE_PACKET.md`
- Historical reachability: `docs/data/WO_P8_MGMT_002_REACHABILITY_PROOF.md`
- Client conformance: `docs/data/WO_P8_MGMT_003_SYNC_DOCTRINE_CONFORMANCE.md`
- API-base source: `frontend/apps/os-shell/src/lib/apiBase.ts`
- Build/host source: `frontend/vite.config.ts`, `backend/src/TerraFusion.API/Program.cs`
- Health semantics: `docs/brain/workorders/evidence/WO-BACKEND-OE-004-HEALTH-READINESS-SEMANTICS-PROOF.md`
- Security boundary: `docs/brain/workorders/evidence/WO-BACKEND-OE-006-SECURITY-AUTH-COUNTY-ISOLATION-PROOF-MATRIX.md`

This packet does not claim current Azure reachability, production readiness, county readiness,
PACS-gated readiness, complete security proof, rollback execution proof, or permission to deploy.
No frontend, backend, runtime, CI, cloud, DNS, secret, county, or PACS state changed.

---

**WO-P8-MGMT-004: COMPLETE.** Next P8 action is **WO-P8-MGMT-005**, parked at **SW-01** (and
SW-10 if auth posture changes). Portfolio Operator may continue to another dependency-cleared lane
without treating the parked deployment as a portfolio-wide stop.
