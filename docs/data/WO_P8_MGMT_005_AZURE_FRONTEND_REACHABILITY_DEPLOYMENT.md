# WO-P8-MGMT-005 — Azure Frontend / Workbench Reachability Deployment

**Program:** P8 — Management Dashboard (frontend reachability lane)
**Date:** 2026-07-02
**Mode:** SW-01 deployment (authorized, bounded). Same-origin static deploy only.
**Authorization:** Operator granted SW-01 for this WO, bounded: deploy/configure os-shell so the
existing P8/Workbench surfaces are reachable against the Benton Azure demo API; use the fixed
API-base behavior from MGMT-003; verify `/workbench/sync-doctrine`, `/workbench/sync-readiness`,
`/dais`, Workbench entrypoints; capture smoke evidence. **Explicitly out of scope:** county go-live,
production launch, data mutation, secrets changes, auth-policy changes (except documenting an existing
401/auth boundary), new dashboard construction, fake data, Pilot L3 promotion. **Stop** if auth,
secrets, DNS, public-launch, or runtime-expansion decisions are required.

**Target:** `app-terrafusion-benton-demo` (RG `terrafusion-benton-demo`, Linux, `DOTNETCORE|8.0`).

---

## 0. Outcome (headline)

**PARTIAL SUCCESS + AUTH WALL.** The os-shell SPA was built from clean `main`, deployed same-origin,
and is **served by the demo API** (startup log confirms). The SPA shell and all its static assets are
**reachable anonymously**. But `/` and hard-navigated client routes return **401** because the SPA
`MapFallback` endpoint inherits the API's deny-by-default `FallbackPolicy = RequireAuthenticatedUser`.
Making the shell load at `/` and on deep-links requires `AllowAnonymous` on the fallback (or
`UseDefaultFiles`) **plus an API rebuild/redeploy** — a **code + auth-policy change (SW-09/SW-10)** that
this WO's scope excludes. **Stopped at that wall; surfaced as an operator decision.**

---

## 1. What was deployed (mechanism)

Chosen approach: **Option A (same-origin)** from the MGMT-004 packet — the API serves the built SPA, so
no CORS and no `VITE_API_URL` (relative `/api`, Invariant B). No `wwwroot` clobber, no API rebuild.

| Step | Action | Result |
|------|--------|--------|
| Build source | Clean main worktree `tf-worktrees/wo-ops-clean-main` (verified the shared forensic checkout's `syncDoctrine.ts` is **stale** vs main, so it could not be used) | os-shell built from correct main (MGMT-003 fix present) |
| Build | `pnpm build` (`tsc --noEmit && vite build`), `VITE_API_URL` unset | 0 errors; `native-shell/ui/dist` (264 files, 19 MB); `index.html` → `/assets/*` (base `/`); **no** `localhost`/`azurewebsites` baked into JS (relative `/api` confirmed) |
| Deploy | Kudu zip API `PUT …/api/zip/site/wwwroot/ui-dist/` via **AAD token** (SCM basic-auth publishing is disabled) | HTTP 200; files landed at `/home/site/wwwroot/ui-dist/` (new subfolder — API DLLs untouched) |
| Config | App setting `TERRAFUSION_UI_DIST_PATH=/home/site/wwwroot/ui-dist` (non-secret; set with `MSYS_NO_PATHCONV=1` after a first attempt mangled the path) | value confirmed exact |
| Restart | `az webapp restart` | API re-ran startup and picked up the UI path |

**Startup log proof (app container):**
```
[STARTUP] Looking for UI at: /home/site/wwwroot/ui-dist
[STARTUP] UI path exists: True
[STARTUP] Static files configured for: /home/site/wwwroot/ui-dist
...
Now listening on: http://[::]:8080
Application started.
```
This confirms the deployed binary **has** the SPA-serving code (`ResolveUiDistPath` →
`UseStaticFiles` + `MapFallback`, Program.cs) and resolved the deployed dist.

---

## 2. Reachability matrix (verified live, anonymous)

| Request | HTTP | Meaning |
|---------|------|---------|
| `GET /index.html` | **200** (text/html) | Our exact built SPA — `<title>TerraFusion OS - Government. Transcended.</title>`, `id="root"`, our hashed `/assets/*.js` |
| `GET /assets/index-*.js` | **200** (text/javascript) | Bundle served pre-auth by `UseStaticFiles` |
| `GET /terrasphere-favicon.svg` | **200** | Static asset served |
| `GET /api/sync/doctrine/state` | **200** | Anonymous data surface live same-origin (the sync-doctrine console's data source) |
| `GET /` | **401** | Non-file route → `MapFallback` endpoint → deny-by-default `FallbackPolicy` |
| `GET /workbench/sync-doctrine` | **401** | Same — client route, hard navigation blocked |
| `GET /workbench/sync-readiness` | **401** | Same |
| `GET /dais` | **401** | Same |

**Interpretation:** static files (existing physical files) are served **before** auth, so the SPA shell
and its assets are reachable. Any path that is *not* a physical file (`/`, deep-links, refresh on a
route) falls through to the SPA fallback endpoint, which — like every other endpoint under the API's
deny-by-default policy (proven correct in BACKEND-006) — requires authentication. A browser hitting `/`
therefore gets 401 **before** the shell can boot.

---

## 3. The wall (why this stops here)

For a SPA served by an authenticated API, the entry route (`/`) and client-side deep-links must serve
`index.html` **anonymously** so the shell can boot and run its own login flow. Today they don't. The fix
options all cross this WO's scope:

- **`app.MapFallback(...).AllowAnonymous()`** on the SPA fallback (Program.cs) — an **auth-policy change**
  (exposes the shell HTML publicly) **+ API rebuild/redeploy**. → SW-10 (+ SW-09).
- **`app.UseDefaultFiles()` before `UseStaticFiles()`** — fixes `/` → `index.html` at the static layer
  (pre-auth), but **not** deep-links/refresh (still hit the auth'd fallback), and still a **code change +
  redeploy**. → SW-09.
- Edge/platform rewrite — not available cleanly on Linux App Service and doesn't fix deep-links.

None is a pure deploy/config action. Per scope ("no auth-policy changes except documenting the boundary;
stop if auth … decisions are required"), **the change is not made here.**

**Operator decision required:** should the os-shell shell HTML be served **anonymously** (standard SPA,
login handled client-side against the auth'd API), or is the app intended to sit **entirely behind edge
auth** (in which case 401-at-`/` is by design and reachability is delivered by an authenticating front
door, not this API)? This is a genuine architecture call for a government surface, not a bug to silently
patch.

---

## 4. What this WO delivered vs. deferred

**Delivered (in scope, done):**
- os-shell built from clean main and **deployed same-origin** to the demo App Service.
- End-to-end deploy pipeline **proven**: clean-worktree build → Kudu AAD zip → app-setting → restart →
  API serves the dist (startup log).
- SPA shell + assets **reachable anonymously**; the anonymous `/api/sync/doctrine/state` data source the
  sync-doctrine console reads is live same-origin.
- The `/`-and-deep-link **401 boundary documented** with exact evidence.

**Deferred to operator decision (walls):**
- Anonymous SPA entry (`AllowAnonymous` on fallback / `UseDefaultFiles`) + API rebuild — **SW-09/SW-10**.
- Any authenticated verification of `/dais` and Workbench **data** surfaces (needs a token; dev-token is
  `IsDevelopment()`-gated and 401s in this environment — BACKEND-006) — **SW-10**.
- App Service `healthCheckPath` still points at shallow `/health` (should be `/health/ready`) — separate
  **SW-01** deploy item (noted in BACKEND-007/008), not touched here.

---

## 5. Deployed-state note (for the next operator)

The demo App Service now carries, persistently:
- `/home/site/wwwroot/ui-dist/` — the built os-shell SPA (264 files). API DLLs in `wwwroot` untouched.
- App setting `TERRAFUSION_UI_DIST_PATH=/home/site/wwwroot/ui-dist`.

This is the intended deployment artifact (not a temporary probe). It is safe: it adds a static surface
that is only reachable for existing files; every dynamic/data route remains under the unchanged
deny-by-default auth. To reach the shell today, load `/index.html` directly (200); `/` is 401 until the
anonymous-entry decision above is made.

---

## 6. Evidence log

- `az webapp show` — `kind app,linux`, `DOTNETCORE|8.0`, `startup dotnet TerraFusion.API.dll`,
  `WEBSITE_RUN_FROM_PACKAGE` unset (wwwroot writable), SCM basic-auth publishing `false` (→ AAD deploy).
- Build tail — `✓ built in 1m 11s`, `BUILD EXIT: 0`, `native-shell/ui/dist/index.html` (2319 bytes).
- Kudu `PUT …/api/zip/site/wwwroot/ui-dist/` → HTTP 200; VFS listing shows `index.html`, `assets`,
  `fonts`, `alpha.html`, `terrasphere-favicon.svg`.
- App container log — the three `[STARTUP]` UI lines above + `Application started`.
- curl matrix — §2 (index.html/assets 200 anonymous; `/`, `/workbench/*`, `/dais` 401; doctrine state 200).
- Browser screenshot **not captured** — the headless egress in this session cannot reach the public
  Azure host (returns `about:blank`); HTTP-level evidence above is more precise for the boundary.

---

**WO-P8-MGMT-005: DEPLOYED (partial reachability), STOPPED AT AUTH WALL.** The same-origin deploy
pipeline is proven and the SPA is served; anonymous SPA entry and authenticated Workbench/`/dais`
verification are behind an auth-policy/code decision (SW-09/SW-10) reserved for the operator.
