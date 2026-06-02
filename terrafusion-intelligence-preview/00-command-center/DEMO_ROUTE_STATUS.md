# Demo Route Status — Honest Audit

**Date**: 2026-06-02
**Auditor**: Pod 7 Reality Check

---

## Readiness Scale

| Level | Meaning |
|-------|---------|
| 0 | Idea only |
| 1 | Route exists |
| 2 | Content exists |
| 3 | Works end-to-end |
| 4 | Conference ready |
| 5 | People ask for access |

---

## Atlas Routes

### `/atlas` — Atlas Suite Home
- **Level: 3**
- Route exists: YES (pre-existing, 166 lines)
- Renders: YES — 7 GIS sub-module tiles (TerraGIS, ParcelLens, LayerWorks, TerraSketch, TerraPrint, TerraExport, TerraQuery)
- Has content: YES — tile grid with icons, descriptions, navigation
- Has data: NO — tiles link to individual modules, some modules are placeholders
- Has polish: MEDIUM — follows design system, consistent styling
- Conference ready: NOT YET — works as a navigation hub but doesn't tell a story by itself
- **Honest gap**: This is a module launcher, not a demo experience. A conference attendee clicking tiles will hit dead ends on some modules. Needs curation: show only the modules that work, or redirect to dossier/pulse demos.

### `/atlas/search` — Property Search
- **Level: 3**
- Route exists: YES (aliases to pre-existing PropertySearch, 236 lines)
- Renders: YES — parcel search with browse grid
- Has content: YES — search input, filters, parcel result cards
- Has data: DEPENDS — needs backend running to show real parcels. Without backend: empty state.
- Has polish: YES — production-quality component
- Conference ready: CONDITIONAL — works beautifully WITH backend running. Dead on arrival without it.
- **Honest gap**: No offline/demo-data fallback. If the backend is down, this shows nothing. Needs a demo data fixture or static parcel list for conference safety.

### `/atlas/dossier/demo` — Property Dossier
- **Level: 2**
- Route exists: YES (aliases to PropertyWorkbench)
- Renders: PARTIALLY — loads PropertyWorkbench shell, but with NO parcel context it shows an empty state
- Has content: YES — PropertyDossier tab is 537 lines with real API integration (property details, valuation signals, levy entries, notes, document management)
- Has data: NO — route doesn't specify a demo parcel ID. Navigating to `/atlas/dossier/demo` loads the workbench without a parcel. The user sees nothing useful.
- Has polish: YES (when data loads) — BentoGrid layout, currency formatting, valuation categories
- Conference ready: NO — **this is the biggest gap**. The route exists but doesn't work as a demo because there's no demo parcel wired in.
- **Honest gap**: Need to either (a) redirect to `/property/DEMO_PARCEL_ID/dossier` with a real Benton County parcel, or (b) create a standalone demo dossier with hardcoded data that doesn't require the backend. Option (b) is conference-safe.

### `/atlas/county-pulse/demo` — County Pulse Dashboard
- **Level: 2.5**
- Route exists: YES (new component, 475 lines)
- Renders: YES — full dashboard layout with sections
- Has content: YES — Growth Signals (4 metrics), Permit Activity (4 metrics), Development Activity table (5 corridors), Risk Watch (4 items), Top 5 Things to Watch, Now What? (three columns)
- Has data: YES — hardcoded Benton County demo data (no backend dependency)
- Has polish: MEDIUM — clean layout, proper design tokens, severity colors, trend indicators
- Conference ready: CLOSE — content is solid and realistic. Needs visual polish: no charts/sparklines yet (all text/numbers), no map visualization, no animated transitions.
- **Honest gap**: Numbers and tables, not charts and maps. A "pulse" dashboard should feel alive — right now it's an excellent static report. Adding 2-3 Recharts sparklines to the metric cards would cross it from "report" to "dashboard."

---

## Academy Routes

### `/academy` — Academy Home
- **Level: 2.5**
- Route exists: YES (new component, 333 lines)
- Renders: YES — header, search/filter bar, codex grid, Ask Academy hero card
- Has content: YES — 10 codex entries in grid with icons, summaries, category pills, difficulty badges
- Has data: YES — all entry metadata hardcoded (no backend dependency)
- Has polish: MEDIUM — follows design system, proper spacing, hover states, category colors
- Conference ready: CLOSE — grid looks professional. Missing: no "featured" or "most popular" signaling. All 10 entries look equal. Needs visual hierarchy — the first entry someone clicks should be obvious.
- **Honest gap**: The search works (filters by text and category), but the landing experience doesn't guide the user. A first-time visitor doesn't know where to start. Need a "Start here" spotlight on Senior Exemption Audit or a "Featured" section at top.

### `/academy/search` — Academy Search
- **Level: 2.5**
- Route exists: YES (same AcademyHome component with search focus)
- Renders: YES — identical to /academy
- Has content: YES — search and filter functional
- Has polish: MEDIUM
- Conference ready: SAME AS /academy — it's the same page. Not a separate experience.
- **Honest gap**: This is a router alias, not a distinct search page. Fine for conference — nobody will notice it's the same component. But if someone navigates directly to /academy/search expecting a different UX, they'll see the landing page.

### `/academy/codex/senior-exemption-audit` — Codex Entry
- **Level: 2.5**
- Route exists: YES (new component, 986 lines)
- Renders: YES — scrollable entry with 7 sections
- Has content: YES — all 10 entries fully written with Problem, Why It Matters, How Experts Think, Workflow, Tools, Common Mistakes, Now What?
- Has data: YES — all content hardcoded (no backend dependency)
- Has polish: MEDIUM — section cards with colored icons, proper typography, navigation footer
- Conference ready: CLOSE — **this is the strongest content asset**. The writing is professional-grade, specific to real assessment workflows, references real tools. An experienced assessor would recognize this as legitimate.
- **Honest gap**: Pure text — no inline examples, no screenshots, no "try it now" links to actual tools. The Tools section references TerraForge CostForge, AppealForge, etc. but doesn't link to them. Adding 2-3 clickable tool links per entry would make this feel integrated rather than encyclopedic.

### `/academy/ask` — Ask Academy
- **Level: 2**
- Route exists: YES (new component, 461 lines)
- Renders: YES — chat interface with suggested questions grid, message bubbles, typing indicator
- Has content: YES — 6 suggested questions, 6 pre-built expert responses (BOE, ratio study, exemption, sales validation, depreciation, new construction) plus a default response
- Has data: YES — local response engine, no AI/backend dependency
- Has polish: MEDIUM — chat bubbles, typing animation, markdown-like formatting
- Conference ready: NOT YET — the responses are good but the rendering is basic. Bold text parsing works, but the markdown rendering is naive (manual string splitting). A complex response with nested bullets will look messy.
- **Honest gap**: (1) Only 6 topic-matched responses — any question outside those 6 gets a generic default. At a conference, someone WILL ask something unexpected. (2) No conversation continuity — the bot doesn't reference prior messages. (3) The response rendering handles **bold** and bullet points but not everything. Need either proper markdown rendering or more carefully formatted responses.

---

## Summary Table

| Route | Level | Blocks to Level 4 |
|-------|-------|-------------------|
| `/atlas` | 3 | Curate visible modules, remove dead-end tiles |
| `/atlas/search` | 3 | Add demo data fallback for no-backend scenario |
| `/atlas/dossier/demo` | **2** | **Wire a demo parcel or build standalone demo dossier** |
| `/atlas/county-pulse/demo` | 2.5 | Add sparkline charts, visual hierarchy |
| `/academy` | 2.5 | Add "Start here" spotlight, visual hierarchy |
| `/academy/search` | 2.5 | (Same as /academy — acceptable) |
| `/academy/codex/:slug` | 2.5 | Add tool links, inline examples |
| `/academy/ask` | 2 | More response coverage, better markdown rendering |

---

## Asset Registry Statistics

From ASSET_REGISTRY.csv (32 scored assets):

| Readiness | Count | Percentage |
|-----------|-------|------------|
| Green (demo-ready) | 18 | 56% |
| Yellow (polish only) | 14 | 44% |
| Orange (too much work) | 0 | 0% |
| Red (post-conference) | 0 | 0% |

Note: Green/Yellow refers to the SOURCE ASSETS, not the demo routes. An asset can be Green (code exists and works) while the demo route using it is Level 2 (route exists but not conference-ready).

---

## Top 5 Remaining Risks

### 1. Atlas Dossier Demo Has No Data (CRITICAL)
`/atlas/dossier/demo` renders an empty PropertyWorkbench. This is the centerpiece of the Atlas story ("understand a property") and it shows nothing. Must either hardcode a demo parcel or build a standalone demo dossier with static data.

### 2. No Offline Fallback for Live Routes
PropertySearch, PropertyWorkbench, and all backend-dependent routes die without the .NET API. County Pulse and Academy work offline (hardcoded data), but Atlas routes do not. Conference Wi-Fi is unreliable.

### 3. Ask Academy Response Coverage Too Narrow
6 matched topics out of infinite possible questions. At a conference demo, if someone asks "How do I handle a mobile home assessment?" they get a generic response. Needs 10-15 more topic matchers to cover the obvious questions an assessor would ask.

### 4. No Visual Differentiation Between Atlas and Academy
Both use the same design system (which is correct) but there's no strong visual identity for each experience. Atlas should feel like "intelligence" (maps, data, cyan), Academy should feel like "knowledge" (books, wisdom, purple). The color differentiation exists in headers but not in the overall experience.

### 5. Demo Navigation — No Way to Get There
There's no demo landing page that says "Try Atlas → Try Academy → Try OS". The routes exist but there's no conference-specific entry point. An attendee handed a laptop would see the OS desktop, not the demo story. Need a `/demo` route or a modified ShellHome with Atlas + Academy tiles prominent.

---

## "Holy Crap" Audit Results

### Atlas: Can someone learn something unexpected in 30 seconds?
**NOT YET.** County Pulse can — the risk watch items and "Top 5 Things to Watch" are genuinely interesting. But the dossier (the centerpiece) shows nothing without a demo parcel. Fix the dossier, and Atlas passes this test.

### Academy: Can someone solve a real problem in 5 minutes?
**YES — for the codex.** The Senior Exemption Audit entry genuinely teaches someone how to run an exemption audit. The BOE Preparation entry is practical enough to use next Monday. Ask Academy needs more response coverage to pass this test for ad-hoc questions.

### OS: Can someone save time tomorrow?
**NOT TESTED.** We haven't built the OS handoff experience yet. The existing ShellHome and PilotConsole are operational but don't demonstrate the Atlas→Academy→OS intelligence pipeline.
