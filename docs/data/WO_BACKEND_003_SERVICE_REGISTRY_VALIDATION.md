# WO-BACKEND-003 — Service Registry Validation

**Program:** P3 — Backend Operational Excellence
**Date:** 2026-07-01
**Mode:** Read-only validation (R0). No code change, no mutation, no secrets, no deployment.
**Sources:** `main` source + live deployed demo probe (`2026-07-01T17:36Z`).
**Authority Boundary:** SW-02/SW-03/SW-09 not crossed. Fixes deferred to a later authorized WO.

---

## 0. Headline

The "service registry" is a **local-dev process tracker**, not a runtime service-discovery
mechanism. On the deployed Benton demo it is **empty** (`{"services":{}}`), and the committed
`service-registry.json` describes a stopped localhost dev topology whose ports **diverge from the
ports documented in CLAUDE.md**. Not blocking for the single-service demo, but it is a doc-vs-reality
gap and a fragile resolution path.

---

## 1. Runtime (deployed demo)

`GET /api/service-registry` → **200**, body:
```json
{ "lastUpdated": "2026-07-01T17:36:56Z", "services": {} }
```
The deployed API serves an **empty** registry with a fresh timestamp. Cause: the controller resolves
the file by a relative walk that does not exist on Azure (see §3), so it returns an empty default.

## 2. Committed registry (`backend/service-registry.json`, LastUpdated 2026-06-26)

A local-dev process registry — every service `Status: "stopped"`, `Pid: null`, `Url: http://localhost:*`:

| Service | Registry port | CLAUDE.md documented port | Match? |
|---------|---------------|---------------------------|--------|
| api | 5046 | 5000 | ✗ |
| frontend | 3102 | 3000 | ✗ |
| shell | 3103 | — | — |
| desktop | 3104 | — | — |
| levy | 3202 | — | — |
| trends | 3203 | — | — |
| consciousness | 8080 | 3004 | ✗ |
| postgres | 5432 | 5432 | ✓ |

The registry is a snapshot of the **dev launcher's** process/port assignments (dynamic ports;
consistent with `TF_API_PORT=5046` in the dev workflow), **not** a production topology and **not** the
canonical ports in CLAUDE.md.

## 3. Fragile / inconsistent resolution (source)

Two different relative-path resolutions for the same file:

| Consumer | Path logic | File |
|----------|-----------|------|
| `ServiceRegistryController.cs:20` | `AppContext.BaseDirectory + "../../../../../service-registry.json"` (5 levels up) | serves `/api/service-registry` |
| `ServiceRegistry.cs:20` | `env.ContentRootPath + "../../service-registry.json"` (2 levels up) | seeding / `GetAvailablePort()` |

Neither relative walk resolves to a real file on the Azure App Service layout → empty registry at
runtime. The Vite dev server has its own third path (`serviceRegistryPlugin` in `vite.config.ts`
reads `../backend/service-registry.json`). **Three different resolution strategies** for one artifact.

## 4. Findings

- **F1** — No runtime service discovery on the demo; the registry is empty. Acceptable because the
  demo is a **single** service (the API), but the endpoint implies a multi-service topology that
  isn't there.
- **F2** — Committed registry ports (5046/3102/3103/3104/3202/3203/8080) **do not match** CLAUDE.md's
  documented ports (5000/3000/3002/3004). Documentation and the dev launcher disagree.
- **F3** — Three different file-resolution paths (controller 5-up, service 2-up, Vite plugin) →
  fragile; none resolve on Azure.
- **F4** — CLAUDE.md documents **Consul** for service discovery, but the implemented mechanism is a
  local JSON file. Consul is not present in the demo runtime (aspirational per the docs' own posture).

## 5. Recommendations (deferred — code = later authorized WO)

| Finding | Target | Fix |
|---------|--------|-----|
| F1 | WO-BACKEND-004/005 | Have `/api/service-registry` disclose "single-service runtime" honestly, or gate it off when no registry exists (don't imply an absent topology) |
| F2 | doc WO | Reconcile CLAUDE.md ports with the dev launcher's actual ports (5046/3102/…), or make the launcher use the documented ports |
| F3 | WO-BACKEND-005 (Config Contract) | Single canonical registry-path resolver; stop the 3-way divergence |
| F4 | doc WO | Mark Consul as aspirational in CLAUDE.md (matches the existing honesty posture for swarm/AI) |

**Nothing changed here (SW-09 not crossed).** All fixes are separately-authorized WOs.

---

## 6. Evidence Log

- Runtime: `GET /api/service-registry` → `{"services":{}}` (deployed demo)
- Committed: `backend/service-registry.json` (8 services, all stopped, localhost, dev ports)
- Source: `ServiceRegistryController.cs:20` (5-up walk), `ServiceRegistry.cs:20` (2-up walk),
  `frontend/vite.config.ts` `serviceRegistryPlugin` (dev-only third path)
- Port doc: `CLAUDE.md` Port Allocation section (5000/3000/3002/3004)

---

**WO-BACKEND-003: COMPLETE (read-only validation).** Next in program: **WO-BACKEND-004
(Health/Readiness Truth)** — that is a **code/runtime change (SW-09)** implementing the fixes from
BACKEND-001 F1–F3 and this WO's F1/F3; it requires explicit operator authorization.
