# WO-P8-MGMT-004 — Frontend Deployment Authorization Packet

**Work Order:** WO-P8-MGMT-004
**Program:** P8-MGMT — Management Dashboard (roadmap Phase 8)
**Date:** 2026-07-01
**Mode:** Planning / authorization packet only. **No deployment, no provisioning, no secrets, no runtime change.**
**Status:** COMPLETE — packet ready for operator decision
**Authority Boundary:** This document stops at SW-01. It does NOT deploy. It is the pre-authorization
review the operator reads before authorizing WO-P8-MGMT-005 (frontend deployment execution).

---

## 0. Purpose

WO-P8-MGMT-002 proved the existing dashboards render live Azure demo data from a local frontend.
WO-P8-MGMT-003 made the API-base convention single-config clean (`syncDoctrine.ts` now rides the
proxy). This packet is everything an operator needs to decide **whether and how** to make the
frontend reachable on the Benton demo — without crossing SW-01 here.

**Build nothing new.** The surfaces exist. This is a deployment/reachability decision.

---

## 1. What Is Being Deployed

The `frontend/apps/os-shell` SPA (Vite build → `native-shell/ui/dist`), served so these existing
routes are reachable against the live Azure API:

| Route | Surface | Data source (anonymous, live today) |
|-------|---------|-------------------------------------|
| `/workbench/sync-doctrine` | Sync Doctrine Console | `/api/sync/doctrine/state` (200, real) |
| `/workbench/sync-readiness` | Sync Readiness Console | probe-on-click |
| `/dais` | Assessor Management Dashboard | Dais endpoints (auth) → honest `unavailable` when absent |

No new components. No backend change. The API (`app-terrafusion-benton-demo`) is already deployed
(WO-DEPLOY-BENTON-003C).

---

## 2. Two Deployment Options (operator picks)

### Option A — Same-origin: API serves the SPA (recommended)
The .NET API already serves static files from `native-shell/ui/dist`. Build the SPA and include it
in the API deploy so the SPA and API share one origin.

| Property | Value |
|----------|-------|
| `VITE_API_URL` | **unset** — relative `/api` resolves same-origin (per `apiBase.ts` Invariant B) |
| CORS | none needed (same origin) |
| Reachability | `https://app-terrafusion-benton-demo.azurewebsites.net/` serves the SPA |
| Build | `cd frontend && npm run build` → outputs to `../native-shell/ui/dist`; include in API publish |
| Pro | Simplest; no CORS; no second resource; matches the intended production model |
| Con | Couples SPA + API deploy cadence |

### Option B — Separate static host (Azure Static Web App / Storage) proxied to the API
Host the SPA separately; point it at the API.

| Property | Value |
|----------|-------|
| `VITE_API_URL` | `https://app-terrafusion-benton-demo.azurewebsites.net` (origin) — single config works post-003 |
| CORS | API must add the static host origin to `AllowedOrigins` (SW-10 — auth/security posture) |
| Reachability | a second public URL |
| Pro | Independent deploy cadence |
| Con | New cloud resource (SW-01), CORS change (SW-10), second surface to secure |

**Recommendation: Option A.** No CORS, no new resource, no `VITE_API_URL` — the cleanest crossing of
SW-01 with the least additional surface. Option B additionally trips SW-10 (CORS) and a second SW-01
(new resource).

---

## 3. Settings & Secrets Required (names only — no values)

For **Option A** (same-origin), the SPA needs **no new runtime settings** beyond what the API already
has. Build-time env for the frontend:

| Key | Value | Secret? |
|-----|-------|---------|
| `VITE_API_URL` | *(unset for same-origin)* | no |
| `VITE_USE_MOCK_DATA` | `false` | no |
| `VITE_DATA_MODE` | `live` | no |
| `VITE_MAPBOX_TOKEN` | *(optional; Atlas map — omit to disable map)* | yes if set |

The demo currently runs with `VITE_DEV_PREVIEW_BYPASS_AUTH=true` for local preview. For a **public**
deploy, auth posture is an **SW-10 decision** (see §5) — do NOT ship dev auth-bypass to a public
surface without an explicit auth decision.

No DB passwords, JWT/HMAC keys, or connection strings are introduced by the frontend deploy — those
already live in the API's App Settings (WO-DEPLOY-BENTON-003C). **This packet exposes no secret values.**

---

## 4. Health / Readiness Expectations For The Served SPA

| Check | Expectation |
|-------|-------------|
| `GET /` | 200, serves `index.html` (SPA shell) |
| SPA deep-link (`/workbench/sync-doctrine`) | 200 via SPA fallback (API static-file middleware must serve `index.html` for unknown non-`/api` routes) |
| `GET /api/sync/doctrine/state` | 200 (already live, anonymous) |
| `GET /api/system/health` | 200, honest `Degraded` (ModuleLoader absent on Azure — expected) |
| Console render | OPERATIONAL, `tf_parcel 84,418`, `tf_sale 90,386` (live, not fixtures) |

**Gap to verify during execution (not now):** confirm the API's static-file/SPA-fallback middleware
serves `index.html` for client routes on Azure (locally this is Vite's job; in production it is the
API's). This is the main deployment risk and belongs in WO-P8-MGMT-005 smoke steps.

---

## 5. Honesty Gate (must hold on the deployed surface)

- Source badges present; `unavailable`/`partial` shown where data/auth missing (verified WO-002).
- No fabricated numbers; no stale `89,247`; no stub agent counts; no randomized metrics.
- The four UI guardrail dashboards (AISwarmDashboard, AIAgentMonitoringDashboard, EliteAIDashboard,
  TerraFusionEliteRealtimeDashboard) remain guardrails — they must not start emitting counts.
- `syncDoctrine` numbers trace to live `/api/sync/doctrine/state` (post-003 conformance).

---

## 6. Stop Walls Crossed By Actual Deployment (why this packet stops here)

| Wall | Triggered by | This packet |
|------|--------------|-------------|
| **SW-01** | Building + publishing the SPA to the public App Service; making routes publicly reachable | **NOT crossed** — packet only |
| **SW-10** | Option B CORS allow-list change; OR shipping a real auth posture instead of dev bypass | **NOT crossed** — flagged for decision |
| **SW-04** | Promoting this demo to county-facing production | **NOT crossed** — out of scope |

Actual deployment = **WO-P8-MGMT-005**, which requires explicit operator authorization referencing
SW-01 (and an auth-posture decision under SW-10 if the surface is public).

---

## 7. Exact Authorization The Operator Must Give

To proceed to WO-P8-MGMT-005 (execution), the operator states:

1. **Option A or Option B** (recommend A).
2. **Auth posture** for the public surface (SW-10): keep it demo-gated / behind a login / IP-restricted?
   Do NOT ship `VITE_DEV_PREVIEW_BYPASS_AUTH=true` to an open public URL without saying so explicitly.
3. **"authorized, go"** for SW-01 (frontend deploy to the Benton demo).

Until then the operator loop stops here.

---

## 8. Evidence / Provenance

- Reachability proof: `docs/data/WO_P8_MGMT_002_REACHABILITY_PROOF.md`
- Conformance fix (single-config): `docs/data/WO_P8_MGMT_003_SYNC_DOCTRINE_CONFORMANCE.md` (PR #1125)
- API-base contract: `frontend/apps/os-shell/src/lib/apiBase.ts` (Invariant B — same-origin needs no `VITE_API_URL`)
- Build target: `frontend/vite.config.ts` (`outDir: ../native-shell/ui/dist`)
- Live API: `app-terrafusion-benton-demo.azurewebsites.net` (WO-DEPLOY-BENTON-003C)

---

**WO-P8-MGMT-004: COMPLETE.** Next legal action is **WO-P8-MGMT-005 (frontend deployment execution)**
— **STOP: SW-01** (and SW-10 auth posture). Requires explicit operator authorization.
