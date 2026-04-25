# CostForge / terrabuild Deep Dive Audit — Master Defect List

**Date**: 2026-04-11  
**Auditor**: QA Agent (Copilot)  
**Scope**: Every screen, surface, page, API endpoint, layout, and data source in `packages/terrabuild`  
**Branch**: `feat/native-app-integrations` (PR #715)  
**Backend**: TerraFusion.API on port 5000  
**Frontend**: Vite dev server on port 5002  
**Binary Timestamp**: 2026-04-11 00:03:17 (STALE — controllers modified hours later)

---

## ROOT CAUSE #0: STALE BINARY (Critical — Affects Everything)

| Artifact | Timestamp |
|----------|-----------|
| **TerraFusion.API.dll** (running) | 2026-04-11 **00:03:17** |
| BenchmarkingController.cs | 2026-04-11 **11:10:15** |
| WhatIfScenariosController.cs | 2026-04-11 **11:10:36** |
| CostForgeController.cs | 2026-04-11 **11:11:06** |
| AnalyticsController.cs (API) | 2026-04-11 **13:28:34** |

The running .NET binary was compiled at midnight. All four critical controllers were modified AFTER the binary was built. **The API is running stale code.** Routes that exist in source (e.g., `building-types`, `regions`, benchmarking, what-if) return 404 because the running binary doesn't include them.

**Fix**: Rebuild and restart the API with `dotnet build && dotnet run`.

---

## CATEGORY A: Backend API Failures (24 broken endpoints)

### A1. Route 404s — Stale Binary (routes exist in source but not in running binary)

| Endpoint | HTTP | Status | Controller Line | Evidence |
|----------|------|--------|-----------------|----------|
| `/api/costforge/building-types` | GET | 404 | CostForgeController.cs:3098 | Route added after binary built |
| `/api/costforge/regions` | GET | 404 | CostForgeController.cs:3110 | Route added after binary built |
| `/api/benchmarking/counties` | GET | 404 | BenchmarkingController.cs:35 | Controller modified after build |
| `/api/benchmarking/statistical-data` | GET | 404 | BenchmarkingController.cs | Controller modified after build |
| `/api/benchmarking/regional-costs` | GET | 404 | BenchmarkingController.cs | Controller modified after build |
| `/api/benchmarking/hierarchical-costs` | GET | 404 | BenchmarkingController.cs | Controller modified after build |
| `/api/what-if-scenarios` | GET | 404 | WhatIfScenariosController.cs | Controller modified after build |
| `/api/what-if-scenarios` | POST | 404 | WhatIfScenariosController.cs | Controller modified after build |

**Frontend Impact**: BenchmarkingPage.tsx, WhatIfScenariosPage.tsx display "Error loading data" or empty state.

### A2. DI Container Crash (route exists in binary, but controller crashes on activation)

| Endpoint | HTTP | Status | Error |
|----------|------|--------|-------|
| `/api/analytics/trends` | GET | **500** | `System.InvalidOperationException: Unable to resolve service for type 'TerraFusion.API.Controllers.IAnalyticsOrchestrator'` |
| `/api/analytics/market` | GET | **500** | Same DI failure |
| `/api/analytics/regional-comparison` | GET | **500** | Same DI failure |
| `/api/analytics/building-type-comparison` | GET | **500** | Same DI failure |
| `/api/analytics/property/{parcelId}` | GET | **500** | Same DI failure |

**Root Cause**: `IAnalyticsOrchestrator` interface is NOT registered in `Program.cs`. The controller at `TerraFusion.API/Controllers/AnalyticsController.cs` declares a constructor dependency on `IAnalyticsOrchestrator`, but `builder.Services.AddScoped<IAnalyticsOrchestrator, ...>()` is never called.

**Frontend Impact**: AnalyticsPage.tsx shows "Endpoint provisioning" fallback for all 4 charts.

### A3. Route 404s — No Backend Implementation

| Endpoint | Frontend File | Usage |
|----------|--------------|-------|
| `/api/analytics/cost-breakdown` | AnalyticsPage.tsx | Attempted fetch |
| `/api/analytics/time-series` | AnalyticsPage.tsx | Attempted fetch |
| `/api/analytics/regional-costs` | AnalyticsPage.tsx | Attempted fetch |
| `/api/analytics/hierarchical-costs` | AnalyticsPage.tsx | Attempted fetch |
| `/api/analytics/statistical-correlations` | AnalyticsPage.tsx | Attempted fetch |
| `/api/cost-matrix` | Unknown | No controller |
| `/api/cost-factors` | Unknown | No controller |
| `/api/calculations` | Unknown | No controller |
| `/api/calculation-history` | Unknown | No controller |
| `/api/regions` | Unknown | No controller |
| `/api/reports` | ReportsPage.tsx | No controller |
| `/api/settings` | Unknown | No controller |
| `/api/user` | Auth flow | Intercepted by ErrorHandlerWrapper |
| `/api/endpoints` | Unknown | No controller |
| `/api/mcp/dashboard` | MCPDashboard | No controller |
| `/api/ai/openai-status` | AIToolsPage | No controller |
| `/api/ai/predict-cost` | AIToolsPage | No controller |

### A4. HTTP Method Mismatch

| Endpoint | Frontend Method | Backend Method | Status |
|----------|----------------|----------------|--------|
| `/api/costforge/valuations` | **GET** (DashboardPage.tsx) | **POST** only (CostForgeController.cs:1928) | 405 |

Note: `[HttpGet("valuations")]` EXISTS at line 1979 but may not be in the stale binary.

### A5. Permission/Auth Failures

| Endpoint | Status | Issue |
|----------|--------|-------|
| `/api/costforge/metrics` | 403 | Missing permission in dev token |
| `/api/aiswarm/status` | 403 | Missing permission |
| `/api/aimodules/status` | 403 | Missing permission |

### A6. Working Endpoints (Confirmed OK)

| Endpoint | Status | Response |
|----------|--------|----------|
| `/api/costforge/status` | 200 | System status JSON |
| `/api/costforge/cost-matrix/benton` | 200 | 55 cost matrix entries |
| `/api/costforge/depreciation-schedule` | 200 | Depreciation brackets |
| `/api/costforge/income-approach/cap-rates` | 200 | Cap rate data |
| `/api/costforge/income-approach/market-data/benton` | 200 | Market data |
| `/api/costforge/income-approach/expense-ratios` | 200 | Expense ratios |
| `/api/costforge/income-approach/location-premiums/benton` | 200 | Location premiums |
| `/api/costforge/sales-comparison/adjustment-factors` | 200 | Adjustment factors |
| `/api/costforge/sales-comparison/market-areas/benton` | 200 | Market areas |
| `/api/costforge/sales-comparison/confidence-thresholds` | 200 | Thresholds |
| `/api/costforge/valuation-lineage/depreciation-model` | 200 | Depr. model |
| `/api/costforge/valuation-lineage/land-rates/benton` | 200 | Land rates |
| `/api/costforge/valuation-lineage/site-improvements` | 200 | Site improvements |
| `/api/costforge/valuation-reconciliation/weight-guidelines` | 200 | Weight guidelines |
| `/api/costforge/analytics/montecarlo/history` | 200 | MC history |
| `/api/costforge/analytics/regression/history` | 200 | Regression history |
| `/api/costforge/analytics/spatial/history` | 200 | Spatial history |
| `/api/costforge/analytics/market/history` | 200 | Market history |
| `/api/costforge/analytics/rcw/history` | 200 | RCW history |
| `/api/costforge/analytics/levy/history` | 200 | Levy history |
| `/api/costforge/analytics/data-quality/history` | 200 | DQ history |
| `/api/costforge/analytics/etl/history` | 200 | ETL history |
| `/api/costforge/analytics/ml/history` | 200 | ML history |
| `/api/costforge/pipeline/history` | 200 | Pipeline history |
| `/api/swarm/status` | 200 | Swarm status |
| `/api/swarm/mcp-tools` | 200 | Tool listing |
| `/api/properties` | 200 | Property listing |

---

## CATEGORY B: BCBS Legacy Branding (User-Reported Critical)

### B1. Active BCBS Header

**File**: `packages/terrabuild/client/src/components/SimpleTopMenu.tsx` ~line 245  
**Code**: `<span className="font-bold">BCBS</span>`  
**Impact**: Rendered on **10 pages** through `TopNavbar.tsx → LayoutWrapper.tsx`

**Pages showing BCBS header**:
1. AIToolsPage (`/ai-tools`)
2. AnalyticsPage (`/analytics`)
3. ARVisualizationPage (`/ar-visualization`)
4. DataImportPage (`/data-import`)
5. documentation page (`/documentation`)
6. faq page (`/faq`)
7. GeoAssessmentPage (`/geo-assessment`)
8. MCPVisualizationsPage (`/visualizations`)
9. PropertyDetailsPage (`/properties/:id`)
10. tutorials page (`/tutorials`)

### B2. BCBS References in Code

| File | Type |
|------|------|
| `SimpleTopMenu.tsx` | Active UI element |
| `TopNavMenu.tsx` | Component file |
| `BCBSCostCalculatorAPI.tsx` | Component NAME still "BCBS" |
| `OsContext.tsx` | Reference |
| `DataConnectionsPage.tsx` | Reference |
| `documentation.tsx` | Reference |
| `faq.tsx` | Reference |
| `tutorials.tsx` | Reference |
| `App.tsx` | Import reference |

---

## CATEGORY C: Design Fragmentation (3 Incompatible Layout Systems)

### C1. Layout System Usage

| Layout | Header | Pages Using |
|--------|--------|-------------|
| **MainLayout** | TerraFusionHeader + Sidebar (correct CostForge branding) | 7 pages |
| **LayoutWrapper** | TopNavbar → SimpleTopMenu (**BCBS branding**) | 10 pages |
| **DashboardLayout** | Unknown header | 2 pages |
| **NONE** | No header/nav at all | **34 pages** |

### C2. Pages Using MainLayout (Correct)

1. CalculatorPage (`/calculator`)
2. DashboardPage (`/dashboard`)
3. EnhancedCalculatorPageV2 (`/calculator-v2`)
4. InfrastructureLifecyclePage (`/infrastructure-lifecycle`)
5. LandingPage (`/`)
6. PropertyBrowserPage (`/properties`)
7. WorkflowDashboardPage (`/workflow`)

### C3. Pages Using LayoutWrapper (BCBS — Wrong)

See B1 above — 10 pages.

### C4. Pages With No Layout Wrapper (34 pages)

These pages render with no consistent header, navigation, or branding:
- BenchmarkingPage, WhatIfScenariosPage, MCPOverviewPage, MCPDashboardPage
- EnhancedCalculatorPage (legacy), CostWizardPage, AICostWizardPage
- All demo pages (7+), data exploration pages, comparison pages
- AI swarm pages, visualization pages
- FTPSyncSchedulePage, ProjectDetailsPage, MapViewPage, etc.

---

## CATEGORY D: Dead/Fake/Static Pages

### D1. Pages With ZERO API Calls (Pure Static UI — No Data)

| Page | Lines | Issue |
|------|-------|-------|
| EnhancedCalculatorPage.tsx | 790 | Zero fetch/axios. Uses only `DataFlowContext` (local state) |
| AIToolsPage.tsx | ~200 | Static content, no API |
| AICostWizardPage.tsx | ~150 | Static content |
| ARVisualizationPage.tsx | ~300 | Static content |
| VisualizationsPage.tsx | 26 | Near-empty |
| DataConnectionsPage.tsx | ~200 | Static content |
| RegionalCostComparisonPage.tsx | ~150 | Static/hardcoded |
| GeoAssessmentPage.tsx | ~200 | Static content |

### D2. Pages With ALL-FAKE Data (Hardcoded/Generated)

| Page | Fake Data Type |
|------|---------------|
| DataExplorationDemo.tsx | `faker` library generates random data |
| WorkflowDashboardPage.tsx | `demoCategories`, `demoWorkflows` arrays |
| SupabaseTestPage.tsx | Supabase connection test |

### D3. Demo Pages With Hardcoded Data (Present As Real)

| Page | Hardcoded Items |
|------|----------------|
| BentonCountyDemoPage | 15 mock data items |
| ComparativeAnalysisDemo | 5 mock entries |
| CostTrendAnalysisDemo | 5 mock timeseries |
| DataExplorationDemo | 9 mock records |
| EnhancedCalculatorPageV2 | 5 hardcoded building types |
| PredictiveCostAnalysisDemo | 4 mock scenarios |
| StatisticalAnalysisDemo | 5 mock datasets |

---

## CATEGORY E: Express Server — Dead Code

**Files**: `packages/terrabuild/server/routes.ts` and related  
**Status**: Express server NEVER runs. DEPRECATED header added.  
**Evidence**: Port 5000 is occupied by .NET. Express would crash.  
**Impact**: 17 MCP agent definitions, Drizzle ORM schema, agent orchestrator — all dead code consuming cognitive overhead.

---

## CATEGORY F: Auth Mock System (Security Concern)

**File**: `App.tsx` — `ErrorHandlerWrapper` component  
**Behavior**: Intercepts `/api/user` and `/api/auth/user` requests and returns mock admin user data:
```typescript
{ id: 1, username: 'admin', role: 'admin' }
```
This bypasses real authentication in development, but the mock is hard-wired with no environment check.

---

## CATEGORY G: Frontend ↔ Backend Route Mismatches

### G1. AnalyticsPage.tsx calls routes that DON'T match any backend controller

| Frontend Call | Backend Reality |
|--------------|-----------------|
| `/api/analytics/cost-breakdown` | No route exists |
| `/api/analytics/time-series` | No route exists |
| `/api/analytics/regional-costs` | No route exists |
| `/api/analytics/hierarchical-costs` | No route exists |
| `/api/analytics/statistical-correlations` | No route exists |
| `/api/analytics/trends` | **Exists** but 500 (DI) |
| `/api/analytics/market` | **Exists** but 500 (DI) |
| `/api/analytics/regional-comparison` | **Exists** but 500 (DI) |
| `/api/analytics/building-type-comparison` | **Exists** but 500 (DI) |

### G2. BenchmarkingPage.tsx calls different routes than BenchmarkingController provides

| Frontend Call | Backend Route |
|--------------|---------------|
| `/api/costforge/building-types` | `api/benchmarking/counties` |
| `/api/costforge/regions` | `api/benchmarking/statistical-data` |
| N/A | `api/benchmarking/regional-costs` |
| N/A | `api/benchmarking/hierarchical-costs` |

The frontend calls CostForge routes for data that the BenchmarkingController was built to serve.

### G3. Two AnalyticsControllers Exist (Namespace Collision Risk)

| Location | Route Prefix | Endpoints |
|----------|-------------|-----------|
| `TerraFusion.API/Controllers/AnalyticsController.cs` | `api/[controller]` = `api/Analytics` | market, trends, regional-comparison, building-type-comparison, property/{parcelId} |
| `TerraFusion.AI/Controllers/AnalyticsController.cs` | `api/analytics` | summary, trends/{metric}, reports, aggregations, insights/{metric}, users/activity, system/usage |

Both resolve to `api/analytics/*` — potential route collision. The API controller crashes (DI), the AI controller may or may not work.

---

## CATEGORY H: Controller Inventory (154+ Controllers)

Notable controllers confirmed in the backend that have NO frontend surface:

- AtlasController (33 endpoints) — No atlas pages in terrabuild
- DaisController (49 endpoints) — No dais pages in terrabuild
- DossierController (36 endpoints) — No dossier pages in terrabuild
- CollaborationController (42 endpoints) — No collaboration pages
- GPTController (40 endpoints) — Limited frontend integration
- LevyController (multiple) — No levy pages
- ComplianceController — No compliance pages
- QuantumAnalyticsController — No pages

These may be intended for OS-level APIs, not the terrabuild CostForge frontend.

---

## SUMMARY: Severity Counts

| Severity | Count | Category |
|----------|-------|----------|
| **CRITICAL** | 1 | Stale binary — rebuild fixes 8+ endpoints |
| **CRITICAL** | 1 | DI container crash — AnalyticsController (5 endpoints dead) |
| **HIGH** | 1 | BCBS branding on 10 pages |
| **HIGH** | 1 | 34 pages with no layout wrapper |
| **HIGH** | 17 | Backend routes called by frontend that don't exist |
| **MEDIUM** | 1 | HTTP method mismatch (valuations GET vs POST) |
| **MEDIUM** | 3 | Permission failures (metrics, aiswarm, aimodules) |
| **MEDIUM** | 8 | Pages with zero API calls (pure static) |
| **MEDIUM** | 7 | Demo pages with hardcoded data presented as real |
| **LOW** | 1 | Express server dead code |
| **LOW** | 1 | Mock auth in ErrorHandlerWrapper |
| **LOW** | 2 | Duplicate AnalyticsController (namespace collision risk) |

---

## RECOMMENDED FIXES (Priority Order)

### P0 — Do Immediately
1. **Rebuild the API**: `cd backend && dotnet build && dotnet run` — instantly fixes 8+ endpoints (building-types, regions, benchmarking/*, what-if-scenarios)
2. **Register `IAnalyticsOrchestrator` in Program.cs** — fixes 5 analytics endpoints
3. **Remove BCBS branding** from SimpleTopMenu.tsx — user is furious about this

### P1 — This Sprint
4. **Unify layout system** — choose MainLayout, retire LayoutWrapper; wrap all 34 unwrapped pages
5. **Fix route mismatches** — align AnalyticsPage.tsx frontend calls with actual backend routes
6. **Resolve AnalyticsController duplication** — rename or merge the two controllers

### P2 — Next Sprint
7. **Remove or convert demo pages** — either connect to real data or clearly mark as "Demo"
8. **Wire remaining static pages** to backend APIs (AIToolsPage, AICostWizardPage, etc.)
9. **Remove Express dead code** — entire `server/` directory is unused
10. **Fix auth mock** — add proper environment check to ErrorHandlerWrapper

---

## APPENDIX: Full Route Map (26 Working Endpoints)

See "A6. Working Endpoints" above for the complete list of confirmed-working API routes.

---

*Generated by QA Audit Agent — 2026-04-11*  
*This is a QA document. Implementation belongs to Claude Code or assigned agent.*
