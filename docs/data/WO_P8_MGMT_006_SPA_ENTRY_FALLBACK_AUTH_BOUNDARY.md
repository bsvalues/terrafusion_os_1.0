# WO-P8-MGMT-006 — SPA Entry / Fallback Auth Boundary

**Program:** P8 — Management Dashboard (frontend reachability lane)
**Date:** 2026-07-02
**Mode:** SW-09/SW-10 code change (authorized, bounded) + minimal API redeploy to verify.
**Authorization:** Operator granted, choosing the **anonymous SPA shell / protected APIs** model.
**Scope (as authorized):** decide+implement whether the SPA shell fallback may be served anonymously;
if approved, add anonymous access **only** to the static SPA entry/fallback path; **preserve API
deny-by-default authorization**; no data mutation, no secrets, no county go-live, no new dashboard, no
Pilot L3; rebuild/redeploy only what is necessary to verify `/`, `/workbench/sync-doctrine`,
`/workbench/sync-readiness`, `/dais` **shell** reachability; stop if authenticated data access, edge
auth, DNS, or production-launch decisions are required.

**Follows:** WO-P8-MGMT-005 (deployed the SPA; the `/`-and-deep-link 401 wall this WO resolves).

---

## 0. Outcome (headline)

**SUCCESS.** The SPA shell now loads anonymously at `/` and on every client route, while the API keeps
its deny-by-default authorization. One-line, surgical code change (`.AllowAnonymous()` on the SPA
fallback endpoint), deployed to the demo by overwriting **only** `TerraFusion.API.dll` (no config, DB
override, secrets, or `ui-dist` disturbed). Verified live.

---

## 1. The change (minimal, surgical)

`backend/src/TerraFusion.API/Program.cs` — the SPA fallback endpoint (`app.MapFallback(...)`, which
already returns `index.html` for non-`/api`/`/hubs` routes and 404s API/hub paths) gained
`.AllowAnonymous()`:

```csharp
app.MapFallback(async context => { /* serve index.html; 404 for /api and /hubs */ })
  // WO-P8-MGMT-006: SPA shell must load anonymously so the browser can boot the
  // app and run its own login flow. Exposes ONLY the static shell fallback — the
  // handler still 404s /api and /hubs, and every real API endpoint keeps the
  // deny-by-default FallbackPolicy (RequireAuthenticatedUser).
  .AllowAnonymous();
```

**Why this is safe / correctly scoped:**
- The fallback handler **already** returns 404 for `/api` and `/hubs`, so `AllowAnonymous` on it cannot
  expose any API or hub route.
- The global `FallbackPolicy = RequireAuthenticatedUser` on **real** endpoints is **unchanged** — every
  controller/data endpoint stays deny-by-default (verified below: protected routes still 401).
- Only the static shell HTML (`index.html`) becomes anonymously reachable — the standard SPA pattern:
  load the shell, then authenticate client-side against `/api/*`.

Build: `dotnet build …/TerraFusion.API.csproj -c Release /warnaserror` → **0 Warning(s), 0 Error(s)**
(passes the Warning Gate). Diff = Program.cs only (8 insertions, 1 deletion).

---

## 2. Deploy (minimal blast radius)

The change compiles into the managed `TerraFusion.API.dll` only (`.AllowAnonymous()` is an
already-referenced extension; no new dependency, no native lib). A full `wwwroot` zip-redeploy was
**deliberately avoided** because it would wipe `appsettings.BentonCounty.local.json` (the real Azure PG
connection — recreating it needs a secret = SW-03) and the MGMT-005 `ui-dist`. Instead:

1. Backed up the deployed `TerraFusion.API.dll` (11,026,944 B) for instant rollback.
2. Overwrote **only** `wwwroot/TerraFusion.API.dll` via Kudu VFS `PUT` (AAD token, `If-Match: *`) →
   HTTP 204; deployed size now 11,025,920 B (the new build).
3. Restarted. `appsettings.BentonCounty.local.json`, all app settings/secrets, `ui-dist`, and every
   other DLL untouched.

**Startup note:** a transient `BadImageFormatException` appeared once when an early restart raced the
mid-write DLL; the clean restart loaded the valid binary (`[FALLBACK] Configured … ui-dist/index.html
Exists: True`, `Application started`). A pre-existing `Microsoft.Data.SqlClient` "server not found"
error also logs on startup — a PACS/MSSQL probe unreachable from Azure (the demo's real DB is Postgres;
`/api/sync/doctrine/state` returns live JSON). **Not** caused by this change; noted, not introduced.

---

## 3. Verification (live, anonymous, post-deploy)

| Route | Result | Meaning |
|-------|--------|---------|
| `GET /` | **200** text/html | SPA shell now loads anonymously (`<title>TerraFusion OS - Government. Transcended.</title>`, `id="root"`, our hashed `/assets/*.js`) |
| `GET /workbench/sync-doctrine` | **200** text/html | Deep-link/refresh reachable — shell serves |
| `GET /workbench/sync-readiness` | **200** text/html | Reachable |
| `GET /dais` | **200** text/html | Reachable |
| `GET /api/health/detailed` | **401** | **API deny-by-default preserved** |
| `GET /healthz` | **401** | Preserved |
| `GET /api/sync/doctrine/state` | **200** JSON | Anonymous data surface still live (PG reachable) |
| `GET /index.html` | **200** | Static shell (unchanged) |
| `GET /health` | **200** | Process healthy after DLL swap |

**Model achieved:** anonymous SPA shell, protected APIs. The browser can now load the app at `/`,
survive a hard refresh on any route, and the app runs its own auth against the still-protected `/api/*`.

---

## 4. Scope boundary held (what was NOT done)

- **No auth-policy change beyond the shell fallback** — the API `FallbackPolicy` is unchanged; only the
  static shell fallback is anonymous.
- **No authenticated data verification** — whether `/dais` / Workbench **data** panels render requires a
  token (dev-token is `IsDevelopment()`-gated, 401 in this env — BACKEND-006). Explicitly out of scope;
  **stopped** at the shell-reachability line as authorized.
- **No secrets, no data mutation, no DNS/edge-auth, no county go-live, no production launch.**
- **No new dashboard, no Pilot L3.**

---

## 5. Deployed state (for the next operator)

Demo App Service now serves the os-shell SPA end-to-end same-origin: shell anonymous, data behind the
unchanged auth wall. Persistent artifacts: `wwwroot/TerraFusion.API.dll` (the MGMT-006 build),
`wwwroot/ui-dist/` (MGMT-005 SPA), app setting `TERRAFUSION_UI_DIST_PATH`. Rollback DLL backed up at
`%TEMP%/TerraFusion.API.dll.deployed-backup` (this box) if ever needed.

**Canonical landing:** the code change is PR'd to `main` so the CI release gate (Warning + Fast Gate +
tests, BACKEND-007) validates it and the next CI-built deploy carries a real `gitSha`. The demo
currently runs the branch build (verification deploy), as the scope authorized.

---

## 6. Evidence log

- `Program.cs` diff — `.AllowAnonymous()` on `MapFallback` (+ rationale comment); `git diff --stat` = 1 file.
- Build — `0 Warning(s) 0 Error(s)`, `/warnaserror`, Release.
- Deploy — Kudu VFS `PUT …/wwwroot/TerraFusion.API.dll` HTTP 204; size 11,026,944 → 11,025,920.
- Startup log — `[FALLBACK] Configured … Exists: True`, `Application started` (post clean restart).
- Reachability matrix — §3 (shell routes 200; protected 401; doctrine 200).

---

**WO-P8-MGMT-006: COMPLETE.** SPA shell reachable anonymously; API deny-by-default intact. The
MGMT-005 auth wall is resolved; the demo frontend is naturally usable. Remaining P8 items
(authenticated `/dais`/Workbench **data**, App Service `healthCheckPath` → `/health/ready`) stay behind
their own SW-10 / SW-01 authorizations.
