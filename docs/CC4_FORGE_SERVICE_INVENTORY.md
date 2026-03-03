# CC-4: TerraForge Service Inventory

> **Purpose:** Document all forge/costForge code in `frontend/apps/os-shell/src/` — endpoints, data paths, mock vs real, consumers.
> **Scope:** Read-only audit. No behavior changes.

## 1. Service Architecture

TerraForge has **two data paths** in the frontend:

### Path A: Client-Side Cost Engine (`forgeService.ts`)
- **File:** `services/forgeService.ts` (774 lines)
- **What:** Pure client-side calculation engine using Benton County PACS cost matrix data
- **Data source:** Static matrix extracted from Harris PACS 9.0 production tables
- **Math.random:** None — all calculations are deterministic
- **API calls:** None — this is a local data service
- **Lineage:** BCBSCOSTApp → TerraBuild → TerraFusionBuild → CostForge → TerraForge

### Path B: Backend REST API (`useCostForgeAPI.ts`)
- **File:** `hooks/useCostForgeAPI.ts` (357 lines)
- **What:** React hook wrapping `fetch()` calls to 12 `/api/costforge/*` backend endpoints
- **Auth:** JWT token from `getAuthToken()`
- **Base URL:** From `getViteEnv()` → `VITE_API_URL` (no hardcoded ports)
- **Correlation IDs:** Yes, propagated in request headers

### Path C: Pilot API (tool invocation)
- **File:** `pages/workbench/tabs/PropertyForge.tsx` (394 lines)
- **What:** Invokes `explain_model_results` via ToolRunner/RBAC
- **Pattern:** `invokeTool('explain_model_results', { parcelId })` through pilot surface
- **Role check:** Yes, RBAC Gate 5b enforced

## 2. Backend Endpoints

`useCostForgeAPI.ts` targets these endpoints (all prefixed `/api/costforge/`):

| Endpoint | Method | Status |
|----------|--------|--------|
| `/calculate` | POST | Real — `CostForgeController.cs` |
| `/breakdown/{propertyId}` | GET | Real |
| `/properties/{propertyId}` | GET | Real |
| `/properties` | GET | Real |
| `/compare` | POST | Real |
| `/regions` | GET | Real |
| `/building-types` | GET | Real |
| `/metrics` | GET | Real |
| `/status` | GET | Real |
| `/matrix` | GET | Real |
| `/batch-calculate` | POST | **Stub** — returns "not yet implemented" |
| `/harris-pacs/sync` | POST | **Stub** — returns "not yet implemented" |

## 3. Data Path by Consumer

### Uses forgeService.ts (Path A — client-side, real):

| Consumer | Lines | Notes |
|----------|-------|-------|
| `pages/suites/modules/CostForgeModule.tsx` | 878 | Main cost approach module |
| `pages/suites/modules/IncomeForgeModule.tsx` | 561 | Income approach calculations |
| `pages/suites/modules/CompsForgeModule.tsx` | 548 | Sales comparison approach |
| `pages/suites/modules/AppealForgeModule.tsx` | 646 | Appeal analysis |
| `pages/suites/modules/ValueAuditModule.tsx` | 380 | Value audit cross-check |
| `pages/suites/modules/ReconciliationModule.tsx` | 445 | Final value reconciliation |

### Uses useCostForgeAPI (Path B — backend REST, real):

| Consumer | Lines | MockData? | Notes |
|----------|-------|-----------|-------|
| `components/costforge/EnhancedCostCalculator.tsx` | 1390 | 1 Math.random (line 589) | Primary backend calculator |
| `components/costforge/CostForgeIntegrationPanel.tsx` | 745 | No | System status + metrics |

### Uses Pilot API (Path C — tool invocation):

| Consumer | Lines | Notes |
|----------|-------|-------|
| `pages/workbench/tabs/PropertyForge.tsx` | 394 | `invokeTool('explain_model_results')` |

## 4. Mock/Theatrical Components (candidates for future cleanup)

These files in `components/costforge/` use `Math.random()` for simulated data:

| File | Lines | Math.random Hits | Assessment |
|------|-------|-----------------|------------|
| `EnhancedDataVisualization.tsx` | 776 | **10** | Heavy mock — all chart data random |
| `CostForgeQuantumDashboard.tsx` | 313 | **4** | "Quantum" theatrical dashboard |
| `CostForgeCollaborationTools.tsx` | 480 | **1** | Mock collaboration events |
| `CostForgeExportSuite.tsx` | 264 | **0** | Mock export UI (no random, but no backend) |

**Not mock:**
- `CostForgeIntegrationPanel.tsx` — uses real useCostForgeAPI hook
- `EnhancedCostCalculator.tsx` — uses real useCostForgeAPI hook (1 Math.random for demo seed only)

## 5. Other Forge-Related Files

### Design mockups (likely theatrical):
| File | Lines | Notes |
|------|-------|-------|
| `design/TerraForgeDashboard.tsx` | 843 | Design comp |
| `design/TerraForgeCostAI.tsx` | 725 | Design comp |
| `design/TerraForgeComponents.tsx` | 374 | Design comp |
| `design/terraforge-styles.css` | 96 | Stylesheet |
| `design/CostForgeAIModule.tsx` | 259 | Design comp |
| `CostForgeAI.tsx` (src root) | 132 | AI integration mock |

### Dashboard module:
| File | Lines | Notes |
|------|-------|-------|
| `modules/dashboard/stores/costforgeStore.ts` | 203 | Zustand store |
| `modules/dashboard/store/costforgeStore.ts` | 131 | Duplicate store (different dir) |
| `modules/dashboard/components/CostforgeAnalysisWidget.tsx` | 124 | Dashboard widget |

### Tests:
| File | Lines | Notes |
|------|-------|-------|
| `__tests__/workbench/PropertyForge.test.tsx` | 262 | Workbench tab tests |
| `__tests__/integration/useCostForgeAPI.test.tsx` | 91 | API hook tests |
| `__tests__/integration/CostForgeIntegrationPanel.test.tsx` | 311 | Panel tests |
| `__tests__/e2e/costforge-workflows.spec.ts` | 375 | E2E workflow tests |
| `modules/dashboard/__tests__/CostforgeSimulation.test.tsx` | 221 | Simulation tests |

### Other:
| File | Lines | Notes |
|------|-------|-------|
| `pages/gen2/TerraForgeGen2.tsx` | 48 | Gen2 module wrapper |
| `pages/suites/ForgeSuiteHome.tsx` | 234 | Suite home page |
| `services/badges/forgeBadgeProvider.ts` | 39 | Badge contribution |
| `ui/metrics/CostforgeSavingsCard.tsx` | 10 | Metric card |

## 6. Summary

| Category | Files | Lines | Status |
|----------|-------|-------|--------|
| Core service (forgeService.ts) | 1 | 774 | **Real** — deterministic, PACS data |
| Backend API hook (useCostForgeAPI.ts) | 1 | 357 | **Real** — JWT, correlationId |
| Pilot integration (PropertyForge.tsx) | 1 | 394 | **Real** — RBAC-gated tool invoke |
| Suite modules (local calc) | 6 | 3,458 | **Real** — use forgeService |
| Components (backend wired) | 2 | 2,135 | **Real** — use useCostForgeAPI |
| Components (mock/theatrical) | 4 | 1,833 | **Mock** — Math.random, no backend |
| Design mockups | 5 | 2,297 | **Theatrical** — UI design comps |
| Dashboard module | 3 | 458 | **Mixed** — duplicate stores |
| Tests | 5 | 1,260 | Test code |
| Other (badges, gen2, etc) | 4 | 331 | Mixed |

**Total: 34 files, ~12,286 lines** — approximately 7,118 lines are real, 4,130 are mock/theatrical.
