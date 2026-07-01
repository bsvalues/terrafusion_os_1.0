# WO-BACKEND-001 — Backend Runtime Reality Audit

**Program:** P3 — Backend Operational Excellence
**Date:** 2026-07-01
**Mode:** Read-only audit (R0). No code change, no mutation, no secrets, no deployment.
**Sources:** Live probes of the deployed demo (`app-terrafusion-benton-demo.azurewebsites.net`,
snapshot `2026-07-01T17:25Z`) + source confirmation on `main`.
**Authority Boundary:** SW-02/SW-03 not crossed. Fixes are deferred to later WOs (BACKEND-004/005).

---

## 0. Purpose

Establish what the backend **actually reports at runtime** on the deployed Benton demo, and where
that diverges from what health surfaces and docs imply. Runtime truth, not aspiration.

---

## 1. Health / Readiness / Proof Surface (deployed demo)

| Endpoint | Code | Runtime body (key fields) |
|----------|------|---------------------------|
| `/health` | 200 | `status: Healthy`, `service: "TerraFusion OS API - Basic Mode"`, `environment: BentonCounty`, `gitSha: "unknown"` |
| `/health/ready` | 200 | `status: Ready`, `message: "TerraFusion OS is initializing"` |
| `/health/live` | 200 | `status: Live` |
| `/api/system/health` | 200 | **`status: Degraded`**, `ModuleLoader: false`, `moduleCount: 0`, warning "Unhealthy components: ModuleLoader" |
| `/api/systemorchestration/health` | 200 | **`isHealthy: false`**, `overallStatus: ""` (empty), `ModuleLoader: false` |
| `/ops/pacs/proof` | 200 | `enabled: true`, `pacs: ok`, `contractValid: true`, `dbName: "terrafusion-dev.db (EF Core)"`, `server: localhost`, `pacsOltp: reachable`, `manifestSha256: "speclock-not-found-in-runtime"` |
| `/ops/pacs/ping` | 200 | `pacs: ok`, `latency_ms: 0` |
| `/healthz` · `/healthz/ready` · `/healthz/proof` | **401** | auth-gated (ASP.NET health checks + SpecLock constitutional proof) |
| `/api/health/detailed` · `/api/health/metrics` | **401** | auth-gated |
| `/api/monitoring/health` · `/metrics` | **401** | auth-gated |
| `/api/systemorchestration/info` | **401** | auth-gated (holds hardcoded 1,008-agent / 89,247-parcel stubs) |

---

## 2. Reality Gaps (claim vs runtime) — the findings

### F1 — App Service liveness is wired to a health check that never reports failure
The App Service health-check path is `/health`, which returns a **static** `Healthy / "Basic Mode"`
(confirmed: `SimpleHealthController.cs`). Meanwhile the honest signal — `/api/system/health` — reports
**Degraded** (ModuleLoader failed, 0 modules). **A genuinely degraded instance would not be restarted**
because the probe watches the always-green endpoint, not the one that reflects degradation.

### F2 — Readiness is a constant, not a real gate
`/health/ready` hardcodes `Status = "Ready"` **and** `Message = "TerraFusion OS is initializing"`
(`SimpleHealthController.cs:50-52`). It returns `Ready` unconditionally — even while claiming to be
initializing. It does not gate on actual startup/DB/migration readiness.

### F3 — Two health surfaces disagree with no reconciliation
`/health` = Healthy; `/api/system/health` = Degraded; `/api/systemorchestration/health` =
`isHealthy: false` with `overallStatus: ""`. Three endpoints, three different verdicts, no single
source of truth. `overallStatus` is an empty string (contract gap).

### F4 — PACS proof reflects a dev SQLite, not the deployed runtime
`/ops/pacs/proof` returns green (`contractValid: true`, `pacsOltp: reachable`) but reports
`dbName: "terrafusion-dev.db (EF Core)"`, `server: localhost`. The demo actually runs on **Azure
PostgreSQL `terrafusion_benton_demo`**, and **has no PACS SQL Server**. The proof is validating the
EF Core dev default connection, not the real demo DB — a **misleading green**. `DbName`/`Server`
come from the readiness service's own connection status (`PacsOpsController.cs:94-95`), which is not
the Azure PG.

### F5 — No build provenance
`gitSha: "unknown"` — the deployed binary cannot be tied to a commit. The framework-dependent publish
did not stamp `GIT_SHA` (the Dockerfile.API build-arg path was not used for the zip deploy).

### F6 — Constitutional proof is not externally verifiable on the demo
`/healthz/proof` (SpecLock constitutional compliance) is **401**. Combined with
`manifestSha256: "speclock-not-found-in-runtime"` from the anonymous PACS proof, the SpecLock
manifest is **absent at runtime** and the proof endpoint cannot be checked without auth.

### F7 — Structural degradation is expected but unlabeled
`ModuleLoader: false`, `moduleCount: 0` because `/home/site/modules` is absent on Azure (seen in
startup logs). This is expected for the API-only demo, but nothing on the surface says "modules
intentionally not deployed" — it reads as an error rather than a known posture.

---

## 3. What Is Solid (runtime truth that holds)

- Process is up, single instance, `ASPNETCORE_ENVIRONMENT=BentonCounty`, HTTPS-only.
- DB connectivity to Azure PG is real (proven WO-P8-MGMT-002/003: `/api/sync/doctrine/state` returns
  live canonical counts). The `/api/system/health` "Degraded" verdict is **honest**.
- Auth wall is active (all sensitive endpoints 401).
- `/api/sync/doctrine/*` is the one **trustworthy** anonymous runtime-truth surface.

---

## 4. Recommendations (deferred to later WOs — NOT actioned here)

| Finding | Target WO | Fix (requires authorization; code = R2/R3) |
|---------|-----------|---------------------------------------------|
| F1, F3 | WO-BACKEND-004 Health/Readiness Truth | Point App Service health-check at a check that reflects Degraded; reconcile the 3 health surfaces to one truth; fill `overallStatus` |
| F2 | WO-BACKEND-004 | Make `/health/ready` gate on real init (DB reachable, migrations applied); drop the contradictory "initializing" message |
| F4 | WO-BACKEND-005 Runtime Config Contract | Make `/ops/pacs/proof` reflect the actual configured DB, or return `enabled:false` when no PACS is configured (do not report a dev SQLite as the runtime DB) |
| F5 | WO-BACKEND-005 | Stamp `GIT_SHA` into the deployed build |
| F6 | WO-BACKEND-006 Auth/Security Proof | Decide whether constitutional proof should be anonymously monitorable on the demo; document SpecLock manifest absence |
| F7 | WO-BACKEND-004 | Label intentional module-absence as posture, not failure |

**Nothing in this WO changes runtime behavior (SW-09) or auth (SW-10).** All fixes are later,
separately-authorized WOs.

---

## 5. Evidence Log

- Runtime probes: `/health`, `/health/ready`, `/health/live`, `/api/system/health`,
  `/api/systemorchestration/health`, `/ops/pacs/proof`, `/ops/pacs/ping` (bodies captured, §1)
- 401 set: `/healthz*`, `/api/health/detailed|metrics`, `/api/monitoring/*`, `/metrics`,
  `/api/systemorchestration/info`
- Source confirmation (main): `backend/src/TerraFusion.API/Controllers/SimpleHealthController.cs`
  (static Healthy/Ready/"initializing"), `.../Controllers/PacsOpsController.cs:94-98,148,373`
  (DbName/Server from readiness connection; `speclock-not-found-in-runtime`)
- Corroborating startup logs: ModuleLoader "Modules directory not found: /home/site/modules"
  (WO-DEPLOY-BENTON-003C session)

---

**WO-BACKEND-001: COMPLETE (read-only reality audit).** Next in program: WO-BACKEND-002 (Build
Warning Register — read-only inventory).
