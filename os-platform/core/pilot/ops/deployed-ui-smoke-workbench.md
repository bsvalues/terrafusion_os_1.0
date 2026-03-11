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
| Staging | https://staging.terrafusionmarket.com | SHA `b4a5570ba1` · deployed 2026-03-11T19:43:30Z · Caddy+Kestrel · Vite SPA `index-6f5bf1f0.js` | 2026-03-11T23:08:48Z | GitHub Copilot (Claude) + automated HTTP probe |
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
1. **Layer 1 — HTTP route probe** (`Invoke-WebRequest`): verified all 9 routes return HTTP 200 + SPA shell (`<div id="root">` + Vite module script). This proves server-side routing is correct.
2. **Layer 2 — Browser render** (`fetch_webpage` + VS Code Simple Browser): loaded `/property/10001` in a real browser/renderer. **Result: auth wall.** The SPA renders a login form ("Your session has expired. Please sign in to continue.") instead of the workbench tabs. Tab content is behind authentication.

**Staging health response headers (public, no auth):**
- `X-Release-Sha: b4a5570ba14908e9282e3e85b5e2bd15ccf62c3c`
- `X-Release-Environment: staging`
- `X-Release-Deployed-At: 2026-03-11T19:43:30Z`
- `X-Correlation-Id: tf-01fa733a3a6044b7bdcc4bc5b0f3b888`
- `Server: Caddy, Caddy, Kestrel`
- `GET /health` → `{"status":"Healthy","environment":"Production","version":"1.0.0","service":"TerraFusion OS API - Basic Mode"}`

**Workbench base route:** `GET /property/10001` → HTTP 200, SPA shell served (root div + Vite bundle `index-6f5bf1f0.js`, 2346 bytes). Browser render shows **login page**, not workbench tabs.

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

#### Layer 2: Browser Render Results (requires auth)

| # | Tab | Click Nav | Deep Link | Route | Timestamp | Result | Evidence | Notes |
|---|-----|-----------|-----------|-------|-----------|--------|----------|-------|
| 1 | Summary | ❌ | ❌ | /property/10001/summary | 2026-03-11T23:15:00Z | BLOCKED (auth) | Browser renders login form, not workbench | Auth wall: "Your session has expired. Please sign in to continue." |
| 2–9 | (all) | ❌ | ❌ | /property/10001/* | 2026-03-11T23:15:00Z | BLOCKED (auth) | Same login form on all routes | Cannot verify tab rendering without credentials |

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

- Staging: ☑ **PARTIAL** — Server routing PASS (all 9 routes serve SPA shell, HTTP 200). Tab rendering BLOCKED by auth wall. Cannot verify actual workbench tab content without staging credentials.
- Production: ☐ PASS ☐ FAIL (not run this session)

**What is proven:**
- Deployed SHA matches release-path-verified SHA (`b4a5570ba1`)
- Health endpoint healthy (`TerraFusion OS API - Basic Mode`)
- All 9 canonical routes correctly serve the Vite SPA shell (server-side catch-all routing works)
- SPA bundle present and loadable (`index-6f5bf1f0.js`)

**What is NOT proven:**
- Actual workbench tab panel rendering (auth-gated)
- Click navigation between tabs (auth-gated)
- Tab content loads with correct data (auth-gated)

**Blocker:** Staging requires authentication. To complete this smoke test, either:
1. Provide staging credentials for the browser session, OR
2. Configure a staging test user with session token for automated probe, OR
3. Temporarily disable auth on staging for the smoke run

---

## Cross-References

- `production-readiness-accounting.md` — non-blocking debt item 1 (PARTIALLY CLOSED: workbench 9-tab render unexercised)
- PR #694 — truth audit that changed CLOSED → PARTIALLY CLOSED
- PR #695 — truth-lint tripwire test guarding against re-overclaim
- PR #696 — portable regex upgrade for that tripwire
