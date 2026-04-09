# TerraFusion Suite Home Module Taxonomy — Design Spec

**Date:** 2026-04-09
**Author:** Chief Appraiser + Dev Team deep dive
**Status:** APPROVED — ready for implementation
**Branch target:** `data/comparable-sales-year-date-index`

---

## Problem Statement

ForgeSuiteHome.tsx (and by extension the broader suite taxonomy) accumulated modules without a governing principle. The result:

- The three approaches to value (cost, sales comparison, income) were not the primary tier
- Workbench-scoped tools (parcel-level openers) were mixed onto the county-wide suite home
- Operational sub-panels (RatioStudyPanel, CompsPoolBrowser) were rendered directly on the suite home instead of living inside the tools that own them
- Secondary module list grew to 12 with no domain rationale for inclusion

This spec establishes the governing principle and the definitive module list for all four suite homes.

---

## Governing Principle

Two fundamentally different scopes exist in TerraFusion:

| Scope | Where it lives | What it does |
|---|---|---|
| **County-wide** | Suite home | Works on the entire county's data — all parcels, all sales, all assessments |
| **Parcel-scoped** | Property Workbench tabs | Works on one parcel in context, opened via parcel selection |

**Rule:** Suite home module cards MUST be county-wide tools. Workbench tab openers do NOT belong on suite home cards.

---

## TerraForge Suite Home

### Domain anchor: The Three Approaches to Value (USPAP / IAAO standard)

Every mass appraisal is built on three coordinate approaches:
1. **Cost Approach** — replacement cost minus depreciation
2. **Sales Comparison Approach** — market-derived adjustments from qualified sales
3. **Income Approach** — capitalized net operating income (commercial/income properties)

These three are PRIMARY. Everything else is diagnostic support or batch execution.

### PRIMARY modules (3)

| Module | Status | Scope | Rationale |
|---|---|---|---|
| **CostForge** | Active | County-wide | Cost approach tool — cost schedules, depreciation tables, land schedules |
| **CompsForge** | Active | County-wide | Sales comparison tool — adjustment grid studio, time trends, paired-sales analysis |
| **IncomeForge** | Queued | County-wide | Income approach tool — cap rates, NOI modeling, rent schedules (commercial) |

IncomeForge is queued because the county-wide income approach module is not yet fully built. The card renders with a queued badge. The existing "Income Valuation" workbench tab opener is NOT the same thing and is NOT elevated — it remains a workbench tab only.

### SECONDARY modules (5)

Supporting analytics and batch operations. County-wide scope only.

| Module | Status | Rationale |
|---|---|---|
| **Statistics Studio** | Active | IAAO ratio diagnostics — COD, PRD, PRB, assessment quality QC |
| **Batch Cost Runs** | Active | Mass execution of cost models across all parcels |
| **Regression Studio** | Queued | MRA regression with R² diagnostics for market modeling |
| **TerraGAMA** | Queued | Geospatial automated mass appraisal, spatial lag models |
| **Coefficient Preview** | Queued | Live preview of adjustment coefficients before table publication |

### OPERATIONAL PANELS (1)

Rendered directly below the module grids on the suite home:

| Panel | Keep? | Rationale |
|---|---|---|
| **SaleQualificationQueue** | YES | County-wide — pending sales requiring qualification review |
| **RatioStudyPanel** | REMOVE | Belongs inside Statistics Studio, not suite home |
| **CompsPoolBrowser** | REMOVE | Belongs inside CompsForge, not suite home |

### Removed from ForgeSuiteHome (all workbench-mode or wrong suite)

| Module | Reason for removal |
|---|---|
| Income Valuation | Workbench tab opener (parcel-scoped) |
| Comparable Sales | Workbench tab opener (parcel-scoped) |
| Reconciliation | Workbench tab opener (parcel-scoped) |
| Governed Run | Workbench sub-function (parcel-scoped) |
| Appeals | Wrong suite — belongs in TerraDais |
| Value Audit | Audit surface — belongs in workbench or standalone audit tool |
| Cost Manual | Reference material — not a module card |
| Value Audit Log | Audit log — not a module card |

---

## TerraDais Suite Home

### Domain anchor: Assessment lifecycle administration

Dais covers the official government workflow side: certification, appeals, levy, notices, and compliance tracking.

**Current state:** Appeals correctly in Dais. Management Dashboard, CertRollPanel, NoticeBatchQueuePanel rendered as operational panels. Structure is sound — no major taxonomy violations identified.

**One fix:** Verify "Appeals" module is removed from ForgeSuiteHome (it currently appears there as a workbench opener). TerraDais is the correct home.

---

## TerraAtlas Suite Home

### Domain anchor: Geographic / GIS

Atlas is the county-wide mapping and spatial analysis suite. All 10 current modules are either GIS workbench tools or county-wide spatial analytics (TerraGIS Pro, Geo Equity, Appraisal GIS queued).

**Current state:** No taxonomy violations. TerraGAMA appears in both Forge (analytical modeling) and potentially Atlas (geospatial). TerraGAMA's primary home is **Forge** (it is a valuation modeling tool, not a map viewer). If it appears in Atlas, that is a duplicate and should be removed from Atlas.

---

## TerraDossier Suite Home

### Domain anchor: Document management and evidence

Dossier covers documents, evidence packets, photos, chain of custody, and system integrations (PACS DataBridge, TerraSync, TerraFlow).

**Current state:** All 9 modules are correctly scoped. Defense Packets routes to TerraDais tab — this is correct (defense packets are Dais workflow but live in Dossier storage). No taxonomy violations.

---

## KPI Band (ForgeSuiteHome)

Current KPIs: Total Parcels, Avg Assessed, Assessed This Year, Pending, Completion %

These are correct for a county-wide valuation suite home. Source disclosure banner (snapshot/fixtures/live) stays. No changes to the KPI band.

---

## Implementation Scope

### File: `ForgeSuiteHome.tsx`

**Changes:**
1. `PRIMARY_MODULES` array: `[CostForge, CompsForge, IncomeForge]`
2. `SECONDARY_MODULES` array: `[StatisticsStudio, BatchCostRuns, RegressionStudio, TerraGAMA, CoefficientPreview]`
3. Remove render of `<RatioStudyPanel />`
4. Remove render of `<CompsPoolBrowser />`
5. Keep render of `<SaleQualificationQueue />`
6. Remove all 8 entries listed in the removal table from secondary (workbench openers, wrong-suite items, and reference/audit surfaces)

**No changes to:** KPI band, source disclosure, ParcelContextBanner, recent parcels queue, CSS/design tokens.

### Files NOT changing in this spec

- `AtlasSuiteHome.tsx` — structure sound (TerraGAMA audit is a future task)
- `DaisSuiteHome.tsx` — structure sound
- `DossierSuiteHome.tsx` — structure sound
- All CSS files
- All hook files (`useCountyStats`, `useDaisSuiteStats`)
- All sub-panel component files (panels themselves are not deleted — they'll be incorporated into their owning tool's page later)

---

## Success Criteria

1. ForgeSuiteHome renders exactly 3 primary cards and 5 secondary cards
2. No workbench-mode module openers appear on the Forge suite home
3. SaleQualificationQueue remains; RatioStudyPanel and CompsPoolBrowser do not render
4. TypeScript compiles clean after changes
5. IncomeForge card renders with queued badge (not broken — just marked as coming)
6. All other suite homes unchanged
