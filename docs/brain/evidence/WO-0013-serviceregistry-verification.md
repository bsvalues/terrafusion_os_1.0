# WO-0013 — ServiceRegistry Activation Verification (read-only)

**Date:** 2026-06-10 · **Verdict: PARTIALLY ACTIVE** — core register/serve/consume loop is live and tested; the platform-wide seeding path is broken by a path mismatch, so the discovery surface only ever contains `backend`.

## What was verified (evidence chain)

### ACTIVE — proven
1. **DI registration:** `builder.Services.AddSingleton<ServiceRegistry>()` — `backend/src/TerraFusion.API/Program.cs:1204`.
2. **Hosted consumer:** `builder.Services.AddHostedService<StartupOrchestrationService>()` — `Program.cs:1209`. `ExecuteAsync` calls `_registry.EnsureSeededAsync()` then, on `ApplicationStarted`, `RegisterServiceAsync("backend", port, pid)` with the port extracted from `ASPNETCORE_URLS` (`Services/StartupOrchestrationService.cs:33,52`).
3. **LIVE runtime artifact:** `backend/service-registry.json` exists, `LastUpdated: 2026-06-10T15:23:57Z` (TODAY), entry `backend` → port 5000, `Status: running`, `Pid: 29316`. The registration loop demonstrably executed this morning.
4. **Serving endpoint:** `GET /api/service-registry` (`Controllers/ServiceRegistryController.cs`, `[AllowAnonymous]`) returns the file verbatim; graceful `{Services:{}}` when missing.
5. **Frontend consumer:** `AppFrame.tsx:65` fetches `/api/service-registry` and resolves module launch targets (`running`+`Url` → iframe URL; `ShellRoute` fallback; else `notFound`).
6. **Tests:** `backend/tests/TerraFusion.Unit.Tests/Stage3/ServiceRegistryTests.cs` — 8 facts covering seeding (create/all-services/default-ports/idempotent) and registration (add/update/missing-file/seed-url). Referenced also by `R1Week5Cx22MultiCountyFederationTests.cs`. Not re-run this slice (read-only; suite previously green in Unit.Tests runs).

### GAPS — honest list
- **G1 (load-bearing): platform.json seed path mismatch.** `EnsureSeededAsync` derives the platform file as a SIBLING of the registry path → `backend/platform.json`, which does not exist; the canonical `platform.json` lives at REPO ROOT (verified: root file present with `ports` block listing 9 services: api, frontend, shell, desktop, levy, trends, consciousness, postgres, redis). Result: seeding warn-skips every boot; the registry is only ever populated by backend self-registration. Downstream: `AppFrame.resolveTarget()` returns `notFound` for every native app (e.g. `levy`), and `TerraLevyGen2.tsx`'s documented expectation ("service-registry entry for terra-levy points at :5177") is unmet by the live file.
- **G2: module-id alignment unverified.** platform.json keys (`levy`, `trends`, …) vs the `moduleId`s AppFrame queries — even with G1 fixed, key naming must be confirmed against `generatedModules.ts` ids. Static-only check here; runtime confirmation belongs to the fix WO.
- **G3: `GetAvailablePort()` has no production caller.** Implemented (OS-assigned port 0 bind) but only the orchestrator's URL-parse path runs in production. CLAUDE.md's "dynamic port allocation via ServiceRegistry.GetAvailablePort()" is forward-looking, not current behavior.

## Verdict detail
The gate question "is ServiceRegistry active?" — **YES for the backend self-registration + serving + frontend consumption loop** (live artifact from today proves it), **NO for platform-wide service discovery** (the advertised purpose of seeding), because of G1.

## Disposition (stop-condition honored)
Fixing G1 is a backend behavior change → **own work order, operator approval; NOT fixed in this read-only slice.** Recorded as drift **D-015** (P2, Build/API). Suggested fix shape (one of): pass the repo-root platform.json path explicitly from StartupOrchestrationService; or walk up to the first directory containing platform.json; plus a regression test seeding from a root-style layout. G2 verification rides along in that WO; G3 is documentation-honesty only (note in CLAUDE.md when convenient).

## Commands run (read-only)
- `grep -rln ServiceRegistry backend/src backend/tests` (4 src + 2 test files)
- Inspections: Program.cs:1204,1209 · ServiceRegistry.cs (EnsureSeededAsync 52-114, RegisterServiceAsync 121, GetServiceUrlAsync 175) · StartupOrchestrationService.cs 1-60 · ServiceRegistryController.cs 29-50 · AppFrame.tsx 55-95
- `cat backend/service-registry.json` (live artifact) · `node -e` platform.json ports enumeration
