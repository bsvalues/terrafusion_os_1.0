# WO-BACKEND-008 — Backend Operational Runbook

**Program:** P3 — Backend Operational Excellence
**Date:** 2026-07-02
**Mode:** Docs synthesis (R1). No code, no runtime change, no deployment.
**Audience:** The operator running / demoing / debugging the TerraFusion.API backend.
**Sources:** BACKEND-001..007 + live demo (`app-terrafusion-benton-demo.azurewebsites.net`).

---

## 0. What this is

A single operator-facing guide to "is the backend healthy, and what do its signals mean." It
consolidates the runtime truth established by BACKEND-001..006 so a curl check is enough to know the
real state — no operator memory required.

---

## 1. Health & Readiness — endpoints and what they mean

| Endpoint | Anonymous? | Healthy response | What it tells you |
|----------|-----------|------------------|-------------------|
| `GET /health` | yes | `{"status":"Healthy","service":"...Basic Mode","gitSha":"<sha>"}` | Process is up + **build provenance** (gitSha; real commit when CI-built — BACKEND-005). NOT a deep health check. |
| `GET /health/ready` | yes | **200** `{"status":"Ready",...}` OR **503** `{"status":"NotReady","message":"initializing"}` | **Readiness truth (BACKEND-004):** 200 only once the host has started; 503 while initializing. Use this for load-balancer/orchestrator readiness, not `/health`. |
| `GET /health/live` | yes | `{"status":"Live"}` | Liveness — the process is responding. |
| `GET /api/system/health` | yes | `{"status":"Degraded"\|"Healthy","systemComponents":{...}}` | **Honest component health.** On the demo it reports `Degraded` because `ModuleLoader:false` (modules dir absent on Azure — expected posture, not an error). |
| `GET /api/sync/doctrine/state` | yes | canonical/truth/raw/quarantine counts + `operational` | **The trustworthy data-truth surface.** `tf_parcel: 84,418` (84,388 active + 30 known dupes), `tf_sale: 90,386`. |
| `GET /ops/pacs/proof` | yes | contract proof | ⚠️ **Reads the dev SQLite (`terrafusion-dev.db`), not the Azure PG** (BACKEND-001 F4) — do NOT treat its "reachable" as proof of the real DB until fixed. |
| `GET /healthz`, `/healthz/proof`, `/api/health/detailed`, `/api/monitoring/*` | **no (401)** | — | Auth-gated; not for anonymous monitoring on the demo. |

**Quick operator check:**
```bash
curl -s https://app-terrafusion-benton-demo.azurewebsites.net/health          # up + gitSha
curl -s https://app-terrafusion-benton-demo.azurewebsites.net/health/ready     # 200 ready / 503 initializing
curl -s https://app-terrafusion-benton-demo.azurewebsites.net/api/system/health         # Degraded? which component?
curl -s https://app-terrafusion-benton-demo.azurewebsites.net/api/sync/doctrine/state    # real data counts
```

## 2. Reading the signals

- **`/health` says Healthy but `/api/system/health` says Degraded** — expected. `/health` is a shallow
  liveness/"Basic Mode" check; `/api/system/health` is the honest component view. `Degraded` +
  `ModuleLoader:false` on the demo = modules intentionally not deployed (API-only demo), not a fault.
- **`gitSha: "unknown"`** — the running binary was NOT built with a commit stamp (no `TF_GIT_SHA` and
  no `GITHUB_SHA` at build). A CI-built binary carries a real sha (BACKEND-005). If you see "unknown"
  on a deployed build, the deploy didn't come from CI.
- **`/health/ready` 503** — the instance is still starting; do not route traffic yet.
- **A `401`** on a data endpoint = the auth wall working (deny-by-default). Auth is required for
  everything except the health/doctrine/ops surface above.

## 3. Auth posture (BACKEND-006)

- JWT Bearer, strict validation; **deny-by-default** (`FallbackPolicy = RequireAuthenticatedUser`).
- **Dev-token (`/api/auth/dev-token`) is Development-only** — returns 401 in the BentonCounty/prod
  environment (verified). Never expect a token from it in a deployed environment.
- Production JWT secret comes from the `JwtSettings__SecretKey` env var (the API fails to start if it
  is missing in a non-Development environment). No hardcoded prod secret.
- **Do not** ship `VITE_DEV_PREVIEW_BYPASS_AUTH=true` or expose `/api/debug/*` mutation endpoints to a
  public surface (see the open hardening item in §5).

## 4. Common operational states

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `/health` 404 / Azure "Welcome" page | app not started / wrong startup command | set startup `dotnet TerraFusion.API.dll`; check container log |
| Startup crash: `Microsoft.Data.SqlClient` FileNotFound | Windows publish deployed to Linux | publish `--runtime linux-x64` |
| Startup blocked: `[SOVEREIGN VIOLATION] Manifest not found` | `sovereign.yaml` absent | bundle `sovereign.yaml` in the deploy |
| DB connecting to `localhost:terrafusion` | `appsettings.BentonCounty.json` localhost placeholder wins over env | provide `appsettings.BentonCounty.local.json` last-in-chain with the real connection |
| `/api/system/health` Degraded, ModuleLoader false | modules dir absent (API-only demo) | expected — no action |

(These are the exact issues resolved during WO-DEPLOY-BENTON-003C — see that evidence doc.)

## 5. Known open items (each a future WO, not a demo blocker)

- **`/ops/pacs/proof` config truth (F4)** — reports dev SQLite, not the Azure PG.
- **App Service health-check path** points at shallow `/health`; should point at `/health/ready`
  (deploy change, SW-01).
- **`CanonicalDebugController`** `[AllowAnonymous]` on mutation endpoints — protect with `[Authorize]`
  (WO-BACKEND-SEC-DEBUG-001, operator decision — affects the sync-workflow HTTP entry point).
- **`/api/service-registry`** empty on the demo; implies an absent multi-service topology.
- **LDAP/AD** production integration stubbed (fail-closed).

## 6. Release gate

Before a backend change reaches the demo, clear the **Release Gate** (WO-BACKEND-007 §3): all CI gates
green (incl. Warning + Fast Gate), runtime-truth criteria met, intended-diff verified, honest
disclosure, no unauthorized wall crossing.

---

**WO-BACKEND-008: COMPLETE (runbook).** With this + WO-BACKEND-007, the P3 Backend Operational
Excellence arc (001-008) is complete: audits (001-003), fixes (004-005), proof (006), gate + runbook
(007-008).
