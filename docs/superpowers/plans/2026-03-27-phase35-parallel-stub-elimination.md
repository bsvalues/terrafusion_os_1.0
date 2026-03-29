# TerraFusion OS — Phase 35: Multi-Agent Parallel Stub Elimination
**Date**: 2026-03-27  
**Status**: ACTIVE — ready for dispatch  
**Branch**: `fix/workbench-loading-aria` (merge to `main` via Gate Zero, then branch `feat/phase35-stub-elimination`)  
**Authority**: Co-founder, 2026-03-27

**Top-level strategy note:** This document is now a bounded execution wave under the 2026-03-28 GUI-canon plan set:
- [Full-Ecosystem Design Audit and Realization Plan](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\plans\2026-03-28-full-ecosystem-design-audit-and-realization.md)
- [Full-Ecosystem Demo GUI Canon](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\specs\2026-03-28-full-ecosystem-demo-gui-canon-design.md)
- [Full-Ecosystem Demo Surface Matrix](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-surface-matrix.md)

Phase 35 still governs stub-elimination execution, but lane closure now requires alignment to the matrix row, truth-state rules, and archetype obligations defined in those artifacts.

> **Execution model**: Historical parallel lane decomposition under current Copilot-owned execution. Agent assignments are hard. No lane may cross into another lane's file set. Runtime verification is REQUIRED before any lane is declared done.

---

## TRUE STATE INVENTORY (Runtime-Verified as of 2026-03-27 22:52 UTC)

| Fact | Evidence | Tier |
|------|----------|------|
| Backend LIVE at port 5000 | `curl http://localhost:5000/api/government/stats` → `totalParcels: 112059, dataSource: LIVE_DB` | ✅ Runtime |
| Frontend LIVE at port 5175 | Playwright screenshot: "Benton County, WA 112,059 parcels LIVE" | ✅ Runtime |
| Phase 34 all waves sealed | W1A, W1B, W1C, W2A, W2B, W3A, W3B, W3C, integration gauntlet | ✅ Runtime |
| Scoped vitest 370/370 | `npx vitest run src/__tests__/atlas/ forge/ admin/ suites/ shared/ hooks/` | ✅ Code |
| type-check EXIT 0 | `npx tsc --noEmit` in frontend/ | ✅ Code |
| Token ratchet 790 ≤ 790 | `pnpm tdc:ui:tokens:check` | ✅ Code |
| Production fixture surface | 13 files with FIXTURE/FixtureDataProvider/isFixture in `pages/` | ✅ Code audit |
| PR #706 open / Gate Zero deferred | GitHub PR `fix/workbench-loading-aria` → `main` | ⏸ Human gate |

---

## WORK SURFACE (what is NOT yet runtime-verified)

| Surface | File(s) | Failure Mode |
|---------|---------|--------------|
| Forge batch/calib/stats pages | `pages/forge/batch/BatchCostRun.tsx`, `CoefficientPreview.tsx`, `pages/forge/calib/SegmentDiscoveryDashboard.tsx`, `SegmentRevaluationDashboard.tsx`, `pages/forge/stati/*.tsx` (StatisticsStudio, VEIDashboard + components), `pages/suites/ForgeSuiteHome.tsx` | Show FixtureDataProvider banners; not wired to live endpoints |
| Atlas GeoEquity | `pages/atlas/GeoEquity*.tsx` | FixtureDataProvider banner |
| TerraQueue (Dais) | `pages/dais/TerraQueue*.tsx` | FixtureDataProvider; `/api/dais/queue` exists and returns data |
| Workbench tabs (PropertyForge, PropertyAtlas, PropertyDossier, PropertySummary) | `pages/workbench/PropertyForge.tsx`, `PropertyAtlas.tsx`, `PropertyDossier.tsx`, `PropertySummary.tsx` | Runtime: has fixture conditional; has not been screenshot with a real parcel |
| Management Dashboard fixture | `pages/dais/ManageDashboard*.tsx` | W3B proof-sealed but `fetchDashboardData` has fixture fallback — not runtime smoke proven |
| act() warning flood | `__tests__/.../floating-ui-workflows.integration.test.tsx` | Pre-existing; blocks full broad vitest run |

---

## GATE ZERO — PR #706 Merge Decision (Human, runs in parallel)

```bash
# Human: review, approve, merge PR #706 on GitHub
# Then Copilot rebases feat/phase35-stub-elimination onto main
git fetch origin
git checkout -b feat/phase35-stub-elimination origin/main
git cherry-pick a63fdfcd2..HEAD  # bring Phase 34 + parcel count fix forward
pnpm run type-check              # re-verify after rebase
```

**Does NOT block Lane work.** Lanes A–D can all run on `fix/workbench-loading-aria`.  
Gate Zero only "blesses" the result onto `main` once lanes close.

---

## WAVE MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   GATE ZERO (parallel, non-blocking)                        │
│                   Human: Merge PR #706 → main                               │
└─────────────────────────────────────────────────────────────────────────────┘
         │                                                            │
         ▼                                                            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│              WAVE 1 — Four independent lanes (fully parallel)                │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  LANE A      │  │  LANE B      │  │  LANE C      │  │  LANE D      │    │
│  │ Forge Batch/ │  │ Atlas        │  │ TerraQueue   │  │ Workbench    │    │
│  │ Calib/Stats  │  │ GeoEquity    │  │ Live Wiring  │  │ Tab Smoke    │    │
│  │ stub → live  │  │ stub → live  │  │ stub → live  │  │ (audit only) │    │
│  │ Owner:Copilot│  │ Owner:Copilot│  │ Owner:Copilot│  │ Owner:Audit  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   WAVE 2 — Runtime Smoke (after all Wave 1 lanes close)      │
│                                                                              │
│   Playwright: screenshot all 5 dock buttons → confirm LIVE data visible     │
│   Workbench: open a real parcel → navigate Forge/Atlas/Dais/Dossier tabs    │
│   Status: all DemoDataBanners gone from sprint surface                      │
│   Owner: Copilot  │  Subagent: tf-proof-audit                               │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   WAVE 3 — Integration Gate                                  │
│                                                                              │
│   1. pnpm vitest run (scoped: all known-green suites) — 0 regressions       │
│   2. dotnet build TerraFusion.sln — 0 errors, 0 warnings                   │
│   3. pnpm type-check (tsc --noEmit) — EXIT 0                                │
│   4. tdc:ui:tokens:check — ≤ 790                                            │
│   5. Playwright: full-app smoke, runtime verified screenshot set             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## RUNTIME VERIFICATION PROTOCOL (applies to ALL lanes)

> **Runtime-verified** = Playwright screenshot of the feature showing real data (not Loading/Error/Fixture banner) with console 0 errors.  
> **Code/test-verified** = Tests pass, types clean. Safe to inspect. NOT safe to bless.  
> No lane may be called DONE without runtime proof.

```javascript
// Template: after any Lane change, run this Playwright check
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = []; const fixture = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if(r.status()===404) fixture.push(r.url()); });
  
  await page.goto('http://localhost:5175/<path>', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  
  const hasBanner = await page.evaluate(() =>
    !!document.querySelector('[data-testid="demo-data-banner"]'));
  
  await page.screenshot({ path: 'C:/tmp/smoke-<lane>.png', fullPage: true });
  console.log('FIXTURE_BANNER:', hasBanner);
  console.log('404s:', fixture);
  console.log('ERRORS:', errors);
  await browser.close();
})();
```

**Acceptance requires**: `FIXTURE_BANNER: false`, `404s: []`, `ERRORS: []`

---

## LANE A — Forge Batch / Calibration / Statistics Stub Elimination

**Owner**: Copilot  
**Subagent**: `tf-writer` (implementation) + `tf-proof-audit` (gate)  
**File scope — allowed**:
```
frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx
frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx
frontend/apps/os-shell/src/pages/forge/calib/SegmentDiscoveryDashboard.tsx
frontend/apps/os-shell/src/pages/forge/calib/SegmentRevaluationDashboard.tsx
frontend/apps/os-shell/src/pages/forge/stati/StatisticsStudio.tsx
frontend/apps/os-shell/src/pages/forge/stati/VEIDashboard.tsx
frontend/apps/os-shell/src/pages/forge/stati/components/*.tsx  (if fixture)
frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx
frontend/apps/os-shell/src/hooks/  (new hooks only — useForgeStats, useBatchRun, etc.)
frontend/apps/os-shell/src/__tests__/forge/  (existing + new tests)
```
**File scope — forbidden**: All other directories. Backend is untouched.

**Backend endpoints available** (read-only, do not modify):
```
GET  /api/forge/*                    (ForgeController.cs)
GET  /api/market/*                   (MarketController.cs)
POST /api/forge/batch/cost-run       (if exists; verify with GET first)
GET  /api/forge/statistics           (if exists; verify with GET first)
GET  /api/cost-forge/*               (CostForgeController.cs)
```

**Verification step** (run before touching pages):
```bash
curl -s http://localhost:5000/api/forge/ | Select-Object -First 2
curl -s http://localhost:5000/api/market/ | Select-Object -First 2
```

**For each file**:
1. Read current fixture usage — identify what fake data it renders
2. Find the matching backend endpoint (or confirm endpoint doesn't exist)
   - If endpoint exists → replace fixture with live hook + `?? fixtureData` fallback
   - If endpoint doesn't exist → replace FixtureDataProvider with honest static label: `WorkbenchSourceBadge source='unavailable'` + explicit message
3. Add `DemoDataBanner` removal (don't show if `source='live'`)
4. Add/update the corresponding vitest contract test

**Acceptance**:
- [ ] `FIXTURE_BANNER: false` for each page (Playwright)
- [ ] Forge vitest: ≥ current pass count, 0 regressions
- [ ] type-check EXIT 0

---

## LANE B — Atlas GeoEquity Stub Elimination

**Owner**: Copilot  
**File scope — allowed**:
```
frontend/apps/os-shell/src/pages/atlas/GeoEquity*.tsx
frontend/apps/os-shell/src/pages/atlas/components/GeoEquity*.tsx  (if any)
frontend/apps/os-shell/src/hooks/useGeoEquity*.ts  (new hook if needed)
frontend/apps/os-shell/src/__tests__/atlas/  (existing + new)
```
**File scope — forbidden**: All other directories.

**Backend endpoints available**:
```
GET /api/atlas/*        (AtlasController.cs)
GET /api/atlas/gis/*    (AtlasGisController.cs)
GET /api/spatial-analytics/*  (SpatialAnalyticsController.cs)
```

**Step**:
1. Read `GeoEquity*.tsx` — identify fixture data shape
2. Find matching atlas endpoint
3. Wire live hook with `?? fixtureDefault` fallback
4. Playwright smoke screenshot of the Atlas → GeoEquity view

**Acceptance**:
- [ ] `FIXTURE_BANNER: false` (Playwright)
- [ ] Atlas vitest: ≥ 78/78 (current baseline), 0 regressions
- [ ] type-check EXIT 0

---

## LANE C — TerraQueue Live Wiring (Dais)

**Owner**: Copilot  
**File scope — allowed**:
```
frontend/apps/os-shell/src/pages/dais/TerraQueue*.tsx
frontend/apps/os-shell/src/hooks/useTerraQueue*.ts  (new hook)
frontend/apps/os-shell/src/__tests__/dais/  (existing + new)
```
**File scope — forbidden**: All other directories.

**Backend endpoint** (confirmed live in session):
```
GET /api/dais/queue       → DaisController.cs:1235 (returns queue summary)
GET /api/dais/queue/all   → DaisController.cs (returns full queue list)
```

**Step**:
1. Read TerraQueue.tsx — identify fixture shape
2. Wire to `/api/dais/queue` with proper `useQuery` hook
3. Handle empty state (0 items) honestly — not a loading state
4. Playwright: navigate to Dais → TerraQueue → confirm real queue data

**Acceptance**:
- [ ] `FIXTURE_BANNER: false` (Playwright)
- [ ] Shows real queue items (or explicit "0 items in queue" state)
- [ ] Dais vitest: ≥ 44/44 baseline, 0 regressions
- [ ] type-check EXIT 0

---

## LANE D — Workbench Tab Full-Stack Audit (Read-Only)

**Owner**: `tf-proof-audit`  
**No code changes.** This is a read/run/report lane.

**Goal**: Confirm each workbench tab launches without crash/fixture banner when opened with a real parcel ID.

**Real parcel IDs available** (from LIVE_DB):
```bash
# Get any real parcel ID from backend
curl -s "http://localhost:5000/api/properties?limit=1" | ConvertFrom-Json
```

**Playwright automation script**:
```javascript
// For each tab: Summary, Forge, Atlas, Dais, Dossier
const tabs = ['summary', 'forge', 'atlas', 'dais', 'dossier'];
for (const tab of tabs) {
  await page.goto(`http://localhost:5175/workbench/${PARCEL_ID}/${tab}`);
  await page.waitForTimeout(3000);
  const crashed = await page.evaluate(() => 
    !!document.querySelector('[data-testid="error-boundary"]'));
  const fixtured = await page.evaluate(() => 
    !!document.querySelector('[data-testid="demo-data-banner"]'));
  await page.screenshot({ path: `C:/tmp/workbench-${tab}.png` });
  console.log(`TAB ${tab}: crashed=${crashed}, fixtured=${fixtured}`);
}
```

**Report format** (tf-proof-audit delivers this, no code changes):
```
LANE D AUDIT REPORT — Workbench Tabs
Tab Summary:    crashed=false  fixtured=[true|false]  screenshot=workbench-summary.png
Tab Forge:      crashed=false  fixtured=[true|false]  screenshot=workbench-forge.png
Tab Atlas:      crashed=false  fixtured=[true|false]  screenshot=workbench-atlas.png
Tab Dais:       crashed=false  fixtured=[true|false]  screenshot=workbench-dais.png
Tab Dossier:    crashed=false  fixtured=[true|false]  screenshot=workbench-dossier.png
```

**Acceptance**:
- [ ] 0 crashed tabs
- [ ] Report delivered — fixtured values are actioned by Wave 2

---

## WAVE 2 — Dock Button + Full App Smoke (after Wave 1 closes)

**Owner**: Copilot + subagent Playwright  
**When**: All four Wave 1 lanes report acceptance criteria met.

**5 dock buttons to runtime-verify**:
| Button | Route | Expected |
|--------|-------|---------|
| Forge | `/suite/forge` or dock action | ForgeSuiteHome renders real data |
| Atlas | `/suite/atlas` | TerraAtlas renders county map |
| Dais | `/suite/dais` | TerraDais renders queue/cases |
| Dossier | `/suite/dossier` | TerraDossier renders document list |
| GPT | `/suite/gpt` | TerraGPT chat interface |

**Screenshot set required**:
1. Desktop idle (status bar shows 112,059)
2. Forge suite home
3. Atlas suite
4. Dais management surface
5. Workbench → Forge tab (with real parcel)  

All 5 must have: `FIXTURE_BANNER: false`, `console errors: 0`, data visible.

---

## WAVE 3 — Integration Gate (after Wave 2 smoke passes)

**Owner**: Copilot

```bash
# 1. Scoped vitest — all known-green suites
cd frontend && npx vitest run \
  src/__tests__/atlas/ \
  src/__tests__/forge/ \
  src/__tests__/admin/ \
  src/__tests__/suites/ \
  src/__tests__/shared/ \
  src/__tests__/home/ \
  src/__tests__/dais/ \
  src/hooks/__tests__/
# Expected: ≥ 370 pass + new tests from Lanes A/B/C, 0 failures

# 2. Backend build
dotnet build backend/TerraFusion.sln
# Expected: 0 errors, 0 warnings

# 3. Type gate
cd frontend && npx tsc --noEmit
# Expected: EXIT 0 (clean)

# 4. Token ratchet  
pnpm run tdc:ui:tokens:check
# Expected: ≤ 790 (no regression from Lane changes)

# 5. Backend PACS verify
curl -s "http://localhost:5000/api/government/stats"
# Expected: totalParcels=112059, dataSource=LIVE_DB
```

**Seal commit format**:
```
feat(phase35): stub elimination complete -- forge/atlas/dais/queue live wired

Evidence:
- Lane A: Forge batch/calib/stati: FIXTURE_BANNER false (screenshots: forge-*)
- Lane B: Atlas GeoEquity: FIXTURE_BANNER false (screenshot: atlas-geo.png)
- Lane C: TerraQueue: FIXTURE_BANNER false, /api/dais/queue real data
- Lane D: Workbench tabs: 5/5 no crash, fixtured=[see report]
- Wave 2: Dock smoke: 5/5 screenshot set clean
- Scoped vitest: [N]/[N] pass, 0 regressions
- type-check: EXIT 0
- tdc:ui:tokens:check: [N] ≤ 790
- Backend: 0 errors, 0 warnings

Government: FISMA compliance
AI-Collaboration: GitHub Copilot + tf-writer + tf-proof-audit
```

---

## AGENT ASSIGNMENT MATRIX

| Agent | Wave | Files owned | Output format |
|-------|------|-------------|---------------|
| `tf-proof-audit` | Wave 1 – Lane D | READ ONLY | Audit report (no code) |
| `tf-writer` (Copilot) | Wave 1 – Lanes A, B, C | Files per lane above | Code + vitest + type-check |
| `tf-proof-audit` | Wave 2 | READ/RUN | 5-screenshot smoke report |
| `tf-writer` (Copilot) | Wave 3 | None (runs gates only) | Gate evidence |

**Hard rules**:
- Lane A agent never touches Lane B/C/D files and vice versa.
- Lane D audit agent makes **zero file modifications** — read-only.
- tf-writer never writes code **outside its assigned file scope**.
- No lane calls itself done without Playwright runtime proof.
- A fixture banner still visible = lane FAIL. No exceptions.

---

## KNOWN RISKS AND MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Backend endpoint does not exist for a given fixture surface | Replace fixture with `WorkbenchSourceBadge source='unavailable'` + honest label — do NOT fake data from frontend |
| Workbench tab navigates to route that doesn't exist | `Lane D audit` discovers it. `Lane A/B/C writer` does NOT add routes (backend contracts only). New route = separate card. |
| act() warning flood blocks broad vitest run | Excluded from gate. Scoped suite is accepted evidence (370+). Flood is pre-existing tech debt, not Phase 35 work. |
| PR #706 merge conflicts after Lane work | Rebase `feat/phase35-stub-elimination` onto merged `main` after Gate Zero closes. Re-run type-check. |
| SENTINEL degraded (ModuleLoader FAIL) | Pre-existing — 0 active modules is expected when navigating to root desktop. Not a Phase 35 concern. |

---

## OPEN DEFER LIST (out of scope for Phase 35)

| Item | Why deferred |
|------|-------------|
| Floating-ui-workflows act() warnings | Pre-existing, not introduced by Phase 35 work |
| SignalR `/hubs/swarm` commenting out | TerraFusion.Consciousness sidecar startup is a separate card |
| Dossier `seed required` warning | Needs PACS seed with document tables — separate lane, future phase |
| County Clerk / Treasury / Audit / Recorder suite pages | Future verticals — not in Assessor's Office sprint |
| `PropertyClerk.tsx`, `PropertyTreasury.tsx` tabs | Placeholder by design — reserved future verticals |

---

## SAVE STATE — Phase 35 kickoff

```text
Branch:   fix/workbench-loading-aria (move to feat/phase35-stub-elimination post Gate Zero)
HEAD:     a63fdfcd2 — fix(stats): wire StageZeroState status bar to live useParcelCount hook
Tree:     Modified — ui-token-baseline.json, ui-token-compliance.contract.json (unstaged, runtime artifacts)

What is true now (runtime-verified):
  - Backend LIVE port 5000, 112,059 parcels, dataSource=LIVE_DB
  - Frontend LIVE port 5175, status bar shows live count
  - Phase 34 ALL waves sealed + integration gauntlet green
  - Scoped vitest 370/370 EXIT 0
  - type-check EXIT 0, ratchet 790/790

What is NOT yet true:
  - 13 production fixture files still show DemoDataBanner
  - Workbench tabs have NOT been runtime-smoke-screenshotted
  - PR #706 not merged (Gate Zero deferred)
  - Broad vitest run still blocked by act() warning flood

Next smallest step (agent dispatch order):
  1. Dispatch tf-proof-audit for Lane D simultaneously with tf-writer for Lanes A+B+C
  2. Wait for Lane D report — confirms crash surface before writers land
  3. Accept lane seals only with Playwright proof
  4. Run Wave 2 smoke only after all Wave 1 lanes sealed
  5. Run Wave 3 integration gate only after Wave 2 smoke passes
  6. Human: merge PR #706 → main → rebase phase35 branch

Unhandled risks carried forward:
  - See KNOWN RISKS table above
```
