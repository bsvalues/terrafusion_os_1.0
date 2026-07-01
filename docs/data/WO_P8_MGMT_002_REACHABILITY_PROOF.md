# WO-P8-MGMT-002 — Existing Dashboard Reachability Proof (Local os-shell → Azure API)

**Work Order:** WO-P8-MGMT-002
**Program:** P8 — Management Dashboard
**Date:** 2026-07-01
**Mode:** Local-first verification. No Azure frontend deployment, no new dashboard code, no data mutation.
**Status:** COMPLETE — reachability proven; blockers documented
**Authority Boundary:** SW-01 NOT crossed (no deploy). SW-02 NOT crossed (read-only). SW-03 NOT crossed.

---

## 0. Result

**The existing dashboards CAN render live Benton-demo Azure data from a local frontend.** Proven by
running `frontend/apps/os-shell` locally with the Vite dev-server proxying to the Azure API. One
console rendered real canonical counts (`tf_parcel: 84,418`), another rendered live system health,
and the assessor suite honestly disclosed unavailable/fallback state where data/auth is missing.

**But there is a real blocker to a clean single-config deployment:** the frontend has two
incompatible API-base conventions across its clients, and no single `VITE_API_URL` value satisfies
both at once. Details in §4. This is the key finding to resolve before WO-P8-MGMT-003 (deploy).

---

## 1. Method (no code changed)

Added a local launch profile (`.claude/launch.json`, dev tooling only — not committed to the repo)
that runs `npm run dev` in `frontend/` with `VITE_API_URL` pointed at the Azure demo. The Vite
config (`frontend/vite.config.ts`) proxies `/api`, `/health`, `/ops`, etc. to `VITE_API_URL`
server-side (`changeOrigin: true`), so the browser talks to `localhost` and Vite forwards to Azure
— **no CORS exposure for proxy-based clients.**

Two configurations were tested to isolate the API-base behavior:

| Run | `VITE_API_URL` | Purpose |
|-----|----------------|---------|
| A | `https://app-terrafusion-benton-demo.azurewebsites.net` | proxy target = Azure origin |
| B | `https://app-terrafusion-benton-demo.azurewebsites.net/api` | base includes `/api` |

Auth bypass for local preview (`VITE_DEV_PREVIEW_BYPASS_AUTH=true`) and live data
(`VITE_USE_MOCK_DATA=false`, `VITE_DATA_MODE=live`) were set so routes render without a login wall.

---

## 2. What Rendered (evidence)

### 2a. Sync Doctrine Console — `/workbench/sync-doctrine` — LIVE ✅ (Run B)
Rendered real Azure `/api/sync/doctrine/state` data:
- **OPERATIONAL — all canonical lanes have rows**
- Canonical rows total: **3,264,539**; Quarantine: **2,053,173**; Counties bound: **1**
- `tf_parcel: 84,418` · `tf_sale: 90,386` · `tf_owner: 97,062` · `tf_parcel_owner_link: 686,851`
  · `tf_improvement_feature: 1,351,892` · `tf_parcel_geom: 79,199`
- Real batch history with timestamps (canonical-tf-arcgis-projector 6/28, canonical-tf-projector
  6/27, truth-pacs-* promoters) — genuine provenance, not fixtures.
- Note: `tf_parcel: 84,418` = 84,388 active + 30 known WO-DUPE-001 rows. Consistent with prior WOs.

### 2b. System Health (Sentinel panel) — LIVE ✅ (Run A)
Rendered real Azure `/api/system/health`:
- SYSTEM STATUS: **degraded** (honest — not faked healthy)
- Components: ModuleLoader **FAIL**; LegacyIntegration / AISwarm / TerraFusionSync **OK** (1 FAIL · 3 OK · 4 TOTAL)
- Warnings: "Health status reported: Degraded", "No active modules loaded" — matches Azure exactly.

### 2c. Sync Readiness Console — `/workbench/sync-readiness` — RENDERS ✅
Read-only operator control surface. Probe-on-click (County id / PACS source connection id / Workbook
id + Load). No auto-refresh. Honest labeling; nothing to auto-populate without an operator probe.

### 2d. TerraDais Suite — `/dais` — HONEST DISCLOSURE ✅
With Dais API endpoints unreachable, the suite did NOT fabricate data. It displayed:
- Banner: *"County aggregate fallback active: TerraDais overview, certification, and notice panels
  are currently using county-wide provider aggregates, not TerraDais API metrics."*
- Zeros: Active Appeals **0**, Completion **0.0%**, Pending **0**, Levy Revenue **$0**
- Supervisory rollup: "0 pending", "0.0% certified", "0 active appeals"
This is the honesty contract holding under live-but-unavailable conditions — no stub numbers.

---

## 3. Honesty Verification

No fabricated data appeared anywhere. Confirmed absent: agent counts (1,008 / 50,000 / 1M), stale
"89,247" parcels, elite/quantum/realtime randomized metrics. The assessor suite explicitly
disclosed its fallback source rather than presenting aggregates as Dais metrics. The doctrine
console's numbers all trace to the live `/api/sync/doctrine/state` payload.

---

## 4. Blocker: Two Incompatible API-Base Conventions (the real gap)

The frontend has a canonical API-base contract AND a non-conforming client that bypasses it. No
single `VITE_API_URL` makes both work against Azure simultaneously.

### 4a. The canonical contract — `frontend/apps/os-shell/src/lib/apiBase.ts` ("Invariant B")
- In the **browser**, `getApiBase()` **always returns `/api`** and ignores `VITE_API_URL`; the Vite
  proxy forwards `/api/*` to the backend. Docstring: *"Hardcoded absolute URLs bypass the proxy,
  causing CORS issues and 404s."*
- Call sites pass **bare paths** (`/agents/events`); `buildApiUrl` prepends `/api` and **throws** if
  a caller includes `/api` (guard observed firing live on a `/api/workbench/flags` call site — a
  separate, opposite-direction violation).
- Conforming clients (SystemHealthPanel, agents, dais services) use relative `/api/...` → proxy.

### 4b. The non-conforming client — `frontend/apps/os-shell/src/api/syncDoctrine.ts`
- Reads `VITE_API_URL` directly (`API_BASE_URL = getViteEnv().VITE_API_URL || ''`) and builds
  `` `${API_BASE_URL}/sync/doctrine/state` `` — **no `/api` prefix, bypasses `apiBase`/`apiFetch`.**
- Consequence: it only resolves correctly when `VITE_API_URL` already ends in `/api`.

### 4c. The conflict (observed, not theorized)
| Config | Proxy-based clients (health, dais, agents) | syncDoctrine console |
|--------|--------------------------------------------|----------------------|
| Run A: `VITE_API_URL = origin` | **200 live** (proxy → `origin/api/...`) | **401** (`origin/sync/doctrine/state`, missing `/api`) |
| Run B: `VITE_API_URL = origin/api` | **401** (proxy → `origin/api/api/...` double-prefix) | **200 live** (`origin/api/sync/doctrine/state`) |

Exactly one class of client works per config. This is a pre-existing frontend inconsistency, exposed
(not caused) by pointing at a remote API.

---

## 5. Recommended Fix (for WO-P8-MGMT-003 — code change, out of scope here)

Make `syncDoctrine.ts` (and any other `VITE_API_URL`-direct clients, e.g. sync-readiness) use the
canonical `apiFetch`/`buildApiUrl` with bare paths (`apiFetch('/sync/doctrine/state')`). Then **all**
clients go through relative `/api` + the proxy, and a single `VITE_API_URL = <azure-origin>` (proxy
target) makes every surface reach Azure. In same-origin production (frontend served by the API) it
works with no `VITE_API_URL` at all — the intended model per `apiBase.ts`.

This is a small, well-scoped conformance change gated by the existing honesty + apiBase contract
tests. It is NOT authorized by this WO (SW / code-change boundary).

---

## 6. Blocked / Not Done (scope adherence)

- No Azure frontend deployment (SW-01 held).
- No new dashboard code; no fix applied to `syncDoctrine.ts` (documented for WO-P8-MGMT-003).
- No public launch, no data mutation, no WO-DATA-BENTON-DUPE-001B delete.
- No fabricated numbers; stale/stub figures explicitly excluded.

---

## 7. Evidence Log

- Local run: `frontend/apps/os-shell` via Vite proxy → `app-terrafusion-benton-demo.azurewebsites.net`
- Sync Doctrine Console live render (Run B): screenshot captured in session; canonical counts match
  live `/api/sync/doctrine/state` (tf_parcel 84,418 / tf_sale 90,386 / operational true)
- System health live render (Run A): matches `/api/system/health` (Degraded, ModuleLoader FAIL)
- TerraDais honest fallback (banner + zeros): screenshot captured in session
- Network traces: Run A syncDoctrine → `origin/sync/doctrine/state` 401; Run B proxy clients →
  `origin/api/api/...` 401; confirming the §4c conflict
- Source: `src/lib/apiBase.ts` (Invariant B), `src/api/syncDoctrine.ts` (non-conforming),
  `frontend/vite.config.ts` (proxy target = `VITE_API_URL`)

---

## 8. Decision Gate

Reachability is proven. Next operator decision:
- **WO-P8-MGMT-003 (deploy)** — should be preceded by (or bundled with) the §5 conformance fix so a
  single config lights up all surfaces. Deploying the frontend as-is would leave one client class
  broken regardless of `VITE_API_URL`. Crosses SW-01 (public demo reachability).

**WO-P8-MGMT-002: COMPLETE.**
