# Suite UX Wiring Map

> **Phase 5:** Ecosystem UI Recovery  
> **Purpose:** Inventory all suites/apps, prioritize migration, wire into os-shell  
> **Last updated:** 2026-02-05

---

## Executive Summary

TerraFusion has **11 Gen2 modules** (active), **3 legacy modules** (deprecated), and dozens of standalone applications scattered across `applications/`. The canonical entry point is `os-shell` (Desktop Shell at `localhost:5173`).

**Problem:** Most modules launch as isolated micro-frontends on separate ports. Error handling, session, and navigation are inconsistent.

**Solution:** Wire all suites through `os-shell` with shared error UX (correlationId), risk gating, and nav contract.

---

## Module Inventory

### Gen2 Modules (Active - Desktop Shell Default)

| Module | Display Name | Category | Port | Entry Type | Status | Priority |
|--------|--------------|----------|------|------------|--------|----------|
| `terraforge` | TerraForge | assessment | 4201 | url | ✅ Active | **P1** |
| `gis-pro` | TerraGIS | mapping | 5178 | url | ✅ Active | P2 |
| `terra-dossier` | TerraDossier | records | 3007 | url | ✅ Active | P2 |
| `terra-flow` | TerraFlow | system | 5183 | url | ✅ Active | P3 |
| `terra-gama` | TerraGAMA | analytics | 5182 | url | ✅ Active | P3 |
| `terra-levy` | TerraLevy | tax | 5177 | url | ✅ Active | P2 |
| `terra-permit` | TerraPermit | assessment | 5181 | url | ✅ Active | P3 |
| `terra-pilt` | TerraPILT | tax | 5179 | url | ✅ Active | P3 |
| `terra-primeview` | TerraPrime | records | 5184 | url | ✅ Active | **P1** |

### Legacy Modules (Deprecated - Hidden by Default)

| Module | Display Name | Category | Port | Status | Action |
|--------|--------------|----------|------|--------|--------|
| `costforge-ai` | CostForge AI | assessment | 5176 | ⚠️ Legacy | Redirect to TerraForge |
| `income-valuation` | Income Valuation | assessment | 5180 | ⚠️ Legacy | Stub + banner |
| `webhub` | WebHub | system | 5185 | ⚠️ Legacy | Stub + banner |

### Archived (Hidden)

| Module | Display Name | Notes |
|--------|--------------|-------|
| `os-shell` | OS Shell (self-reference) | Entry point, not a launchable module |

---

## os-shell Routes (Current)

| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/` | DesktopShell | ✅ Working | Launches App.tsx → Desktop |
| `/monitoring` | Monitoring | ⚠️ Untested | Needs verification |
| `/marketplace` | TerraFusionMarketplace | ⚠️ Untested | Needs verification |
| `/experiments` | ExperimentsList | ⚠️ Untested | Research lab |
| `/experiments/create` | CreateExperiment | ⚠️ Untested | Research lab |
| `/elite-research` | EliteExperimentalResearch | ⚠️ Untested | Research lab |
| `/codex/preferences` | NotificationPreferences | ⚠️ Untested | Settings |
| `/gen2/terraforge` | TerraForgeGen2 | ⚠️ Untested | Gen2 route |
| `/gen2/dossier` | TerraDossierGen2 | ⚠️ Untested | Gen2 route |
| `/pilot` | PilotConsole | ✅ Working | Governance choke point |
| `/pilot/dashboard` | GovernanceDashboard | ⚠️ Untested | Metrics |
| `/pilot/api` | PilotApiDemo | ✅ Working | API demo |
| `/error-demo` | ErrorDisplayDemo | ✅ Working | Phase 1 verification |
| `/pilot-demo` | PilotDemo | ✅ Working | Phase 2 verification |

---

## Priority Ranking (MWUX Slice Order)

### P1: First Suite Rescue (This Week)

**TerraForge** or **TerraPrime** — both are high-value assessment workflows.

| Candidate | Why First | Risk |
|-----------|-----------|------|
| **TerraForge** | Core assessment tool, AI valuation | High complexity |
| **TerraPrime** | Property viewer, read-only, simpler | Lower complexity |

**Recommendation:** Start with **TerraPrime** (simpler, read-only, faster MWUX).

### P2: Core Workflow Suites (Next 2 weeks)

- TerraLevy (tax calculations)
- TerraDossier (document packets)
- TerraGIS (parcel mapping)

### P3: Supporting Suites (Following weeks)

- TerraFlow (workflow automation)
- TerraGAMA (market analytics)
- TerraPermit (permit tracking)
- TerraPILT (PILT calculations)

---

## First MWUX Slice: TerraPrime

### Target Workflow

1. User opens Shell → clicks TerraPrime icon
2. App loads property search interface
3. User searches for parcel (e.g., "123 Main St")
4. Property card displays with basic data
5. On error: correlationId + copy + trace hint

### Integration Points

| Layer | Current State | Target State |
|-------|---------------|--------------|
| Entry | iframe to `localhost:5184` | Embedded route or iframe with message bridge |
| Auth | Unknown | Shell session passthrough |
| Errors | Unknown | ErrorBoundary → ErrorDisplay |
| Trace | None | correlationId on all failures |

### Files to Create/Modify

1. `frontend/apps/os-shell/src/pages/suites/TerraPrime.tsx` — wrapper component
2. `frontend/apps/os-shell/src/Router.tsx` — add `/suites/terra-prime` route
3. `frontend/apps/os-shell/src/__tests__/suites/TerraPrime.test.tsx` — MWUX tests

---

## Legacy Redirect Plan

| Legacy Entry | Current Behavior | Target Behavior |
|--------------|------------------|-----------------|
| `localhost:5176` (CostForge) | Broken/orphaned | Redirect → `/suites/terraforge` |
| `localhost:5180` (Income Val) | Broken/orphaned | Banner: "Migrating to TerraForge" |
| `localhost:5185` (WebHub) | Unknown | Banner: "Use Shell" |

---

## Shell Navigation Contract

See: `SHELL_NAV_CONTRACT.md` (to be created)

Core principles:
- All suites load within shell chrome (sidebar + topbar)
- Deep links: `/suites/<suite-id>/<workflow>/<params>`
- Errors: All wrapped in ErrorBoundary, surface correlationId
- Auth: Session token passed via context or URL param
- Trace: All API calls include correlationId header

---

## Next Actions

1. [ ] Verify TerraPrime standalone health (`localhost:5184`)
2. [ ] Create `/suites/terra-prime` route in os-shell
3. [ ] Wire ErrorBoundary + correlationId pass-through
4. [ ] Add basic smoke test
5. [ ] PR: `feat(ui): wire TerraPrime MWUX slice into os-shell`

---

*Government. Transcended.*
