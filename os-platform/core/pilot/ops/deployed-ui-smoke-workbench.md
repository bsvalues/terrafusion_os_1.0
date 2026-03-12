# Deployed UI Smoke — Property Workbench (9 Tabs)

**Purpose:** Provide direct deployed-environment evidence that the Property Workbench renders and routes across all **9 canonical tabs**.

**Closes / Advances:**
- `production-readiness-accounting.md` → Non-Blocking Debt: "9-tab workbench in deployed env" (health endpoint ≠ UI proof)

**Canonical Tabs (Order is contractual):**
1) Summary  
2) Forge  
3) Atlas  
4) Dais  
5) Clerk  
6) Treasury  
7) Audit  
8) Dossier  
9) Pilot  

---

## Targets

| Environment | Base URL | Build / Release Identifier | Date (UTC) | Operator |
|------------|----------|----------------------------|------------|----------|
| Staging | https://staging.terrafusionmarket.com | SHA `b4a5570ba1` · deployed 2026-03-11T19:43:30Z · Caddy+Kestrel · Vite SPA `index-6f5bf1f0.js` | 2026-03-12T00:07:16Z | Codex + Playwright authenticated browser smoke |
| Production (optional) |  |  |  |  |

---

## Execution Protocol

**Rules:**
- Evidence must be from the deployed target (no localhost).
- Each tab must be validated by **(A)** click navigation and **(B)** direct deep-link route load (where applicable).
- Record any auth step once; do not re-auth for each tab unless required by session expiry.

**For each tab, capture:**
- Timestamp
- Route (URL path)
- Result: PASS/FAIL
- Evidence: screenshot filename or console log snippet (if any)
- Notes: perf issues, partial loads, API failures, auth redirects, UI errors

---

## Evidence Run Log

### Staging

**Method:** Two-layer verification:
1. **Layer 1 — HTTP route probe** (`Invoke-WebRequest`, prior run): verified the staging workbench routes return HTTP 200 + SPA shell (`<div id="root">` + Vite module script). This proved server-side routing before browser evidence existed.
2. **Layer 2 — Authenticated browser render** (Playwright Chromium, 2026-03-12T00:07Z): authenticated on `/login` with a synthetic non-secret `@terrafusionmarket.com` identity, confirmed `POST /api/auth/login` returned HTTP 200, confirmed the app exited `/login`, then executed click-nav and deep-link smoke across all 9 tabs with screenshots.

**Staging health response headers (public, no auth):**
- `X-Release-Sha: b4a5570ba14908e9282e3e85b5e2bd15ccf62c3c`
- `X-Release-Environment: staging`
- `X-Release-Deployed-At: 2026-03-11T19:43:30Z`
- `X-Correlation-Id: tf-01fa733a3a6044b7bdcc4bc5b0f3b888`
- `Server: Caddy, Caddy, Kestrel`
- `GET /health` → `{"status":"Healthy","environment":"Production","version":"1.0.0","service":"TerraFusion OS API - Basic Mode"}`

**Auth smoke:** `POST /api/auth/login` → HTTP 200; login page accepted the synthetic non-secret browser run and redirected out of `/login` to `/canon`, after which protected routes rendered normally. Login evidence screenshot: `staging-login-page.png`.

**Local screenshot artifacts:** `C:\Users\bsval\AppData\Local\Temp\tf-ui-smoke-699\staging-*.png`

#### Layer 1: Route Probe Results (HTTP-level, no auth)

| # | Tab | HTTP Status | SPA Shell | Route | Timestamp | Route Result | Evidence | Notes |
|---|-----|-------------|-----------|-------|-----------|--------------|----------|-------|
| 1 | Summary | 200 | ✅ | /property/10001/summary | 2026-03-11T23:10:09Z | ROUTE PASS | HTTP 200, root=True, len=2346 | Server routes to SPA correctly |
| 2 | Forge | 200 | ✅ | /property/10001/forge | 2026-03-11T23:10:10Z | ROUTE PASS | HTTP 200, root=True, len=2346 | |
| 3 | Atlas | 200 | ✅ | /property/10001/atlas | 2026-03-11T23:10:12Z | ROUTE PASS | HTTP 200, root=True, len=2346 | |
| 4 | Dais | 200 | ✅ | /property/10001/dais | 2026-03-11T23:10:13Z | ROUTE PASS | HTTP 200, root=True, len=2346 | |
| 5 | Clerk | 200 | ✅ | /property/10001/clerk | 2026-03-11T23:10:14Z | ROUTE PASS | HTTP 200, root=True, len=2346 | |
| 6 | Treasury | 200 | ✅ | /property/10001/treasury | 2026-03-11T23:10:14Z | ROUTE PASS | HTTP 200, root=True, len=2346 | |
| 7 | Audit | 200 | ✅ | /property/10001/audit | 2026-03-11T23:10:17Z | ROUTE PASS | HTTP 200, root=True, len=2346 | |
| 8 | Dossier | 200 | ✅ | /property/10001/dossier | 2026-03-11T23:10:18Z | ROUTE PASS | HTTP 200, root=True, len=2346 | |
| 9 | Pilot | 200 | ✅ | /property/10001/pilot | 2026-03-11T23:10:18Z | ROUTE PASS | HTTP 200, root=True, len=2346 | |

#### Layer 2: Authenticated Browser Render Results

| # | Tab | Click Nav | Deep Link | Route | Click Time (UTC) | Deep Link Time (UTC) | Result | Evidence | Notes |
|---|-----|-----------|-----------|-------|------------------|----------------------|--------|----------|-------|
| 1 | Summary | ✅ | ✅ | /property/10001 | 2026-03-12T00:07:01.769Z | 2026-03-12T00:07:12.033Z | PASS | `staging-summary-click.png`, `staging-summary-deeplink.png` | Marker: `Parcel ID`, `Assessed Value` |
| 2 | Forge | ✅ | ✅ | /property/10001/forge | 2026-03-12T00:07:04.344Z | 2026-03-12T00:07:12.378Z | PASS | `staging-forge-click.png`, `staging-forge-deeplink.png` | Marker: `data-testid=property-forge-tab` |
| 3 | Atlas | ✅ | ✅ | /property/10001/atlas | 2026-03-12T00:07:05.288Z | 2026-03-12T00:07:13.013Z | PASS | `staging-atlas-click.png`, `staging-atlas-deeplink.png` | Marker: `data-testid=property-atlas-tab` |
| 4 | Dais | ✅ | ✅ | /property/10001/dais | 2026-03-12T00:07:05.920Z | 2026-03-12T00:07:13.641Z | PASS | `staging-dais-click.png`, `staging-dais-deeplink.png` | Marker: `data-testid=property-dais-tab` |
| 5 | Clerk | ✅ | ✅ | /property/10001/clerk | 2026-03-12T00:07:06.695Z | 2026-03-12T00:07:14.234Z | PASS | `staging-clerk-click.png`, `staging-clerk-deeplink.png` | Marker: `TerraClerk` |
| 6 | Treasury | ✅ | ✅ | /property/10001/treasury | 2026-03-12T00:07:07.517Z | 2026-03-12T00:07:14.806Z | PASS | `staging-treasury-click.png`, `staging-treasury-deeplink.png` | Marker: `TerraTreasury` |
| 7 | Audit | ✅ | ✅ | /property/10001/audit | 2026-03-12T00:07:08.871Z | 2026-03-12T00:07:15.331Z | PASS | `staging-audit-click.png`, `staging-audit-deeplink.png` | Marker: `TerraAudit` |
| 8 | Dossier | ✅ | ✅ | /property/10001/dossier | 2026-03-12T00:07:09.729Z | 2026-03-12T00:07:15.794Z | PASS | `staging-dossier-click.png`, `staging-dossier-deeplink.png` | Marker: `data-testid=property-dossier-tab` |
| 9 | Pilot | ✅ | ✅ | /property/10001/pilot | 2026-03-12T00:07:10.713Z | 2026-03-12T00:07:16.274Z | PASS | `staging-pilot-click.png`, `staging-pilot-deeplink.png` | Marker: `data-testid=property-pilot-tab` |

### Production (optional)

| # | Tab | Click Nav | Deep Link | Route | Timestamp | Result | Evidence | Notes |
|---|-----|----------:|----------:|-------|----------|--------|----------|------|
| 1 | Summary |  |  |  |  |  |  |  |
| 2 | Forge |  |  |  |  |  |  |  |
| 3 | Atlas |  |  |  |  |  |  |  |
| 4 | Dais |  |  |  |  |  |  |  |
| 5 | Clerk |  |  |  |  |  |  |  |
| 6 | Treasury |  |  |  |  |  |  |  |
| 7 | Audit |  |  |  |  |  |  |  |
| 8 | Dossier |  |  |  |  |  |  |  |
| 9 | Pilot |  |  |  |  |  |  |  |

---

## Outcome

- Staging: ☑ **PASS** — Authenticated browser smoke PASS. Click-nav PASS `9/9`; deep-link PASS `9/9`; deployed staging workbench render verified on SHA `b4a5570ba1`.
- Production: ☐ PASS ☐ FAIL (not run this session)

**What is proven:**
- Deployed SHA matches release-path-verified SHA (`b4a5570ba1`)
- Health endpoint healthy (`TerraFusion OS API - Basic Mode`)
- `/login` accepted the synthetic non-secret staging smoke login (`POST /api/auth/login` → HTTP 200)
- Protected workbench routes rendered after auth instead of redirecting back to login
- All 9 canonical tabs rendered from both click-nav and direct deep-link routes with screenshot evidence
- Layer 1 route probe remains true: the staging routes correctly serve the Vite SPA shell

**What is not covered by this evidence:**
- In-tab governed tool execution beyond initial render
- Production browser smoke (not run this session)

**Observations:** Background browser console noise included repeated HTTP 403/404 resource failures during the run. Those responses did not block authentication, route transition, or tab render, so they are noted here but treated as out-of-scope for this specific debt item.

---

## Cross-References

- `production-readiness-accounting.md` — non-blocking debt item 1 (CLOSED 2026-03-12 by this authenticated staging smoke)
- PR #694 — truth audit that changed CLOSED → PARTIALLY CLOSED
- PR #695 — truth-lint tripwire test guarding against re-overclaim
- PR #696 — portable regex upgrade for that tripwire
