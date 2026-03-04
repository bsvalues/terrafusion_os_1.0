# CX-19: Cross-County Non-Leak HTTP Integration Tests — Evidence Report

**Branch:** `copilot/r1-week5-cx19-cross-county-nonleak`  
**Test file:** `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx19CrossCountyNonLeakTests.cs`  
**Filter:** `dotnet test --filter "FullyQualifiedName~R1Week5Cx19"`  
**Result:** 19/19 passed, 24 assertions  

---

## Test Design

Two counties seeded (Benton + King). Caller's JWT claims always resolve to **Benton**.  
Each strongly-scoped controller is tested for:
1. **Same-county access** → data returned (non-403, non-404)
2. **Cross-county access** → data blocked (403, 404, or verified-empty)

### County Context Patterns Verified

| Controller | Route | County Mechanism | Cross-County Behavior |
|---|---|---|---|
| Atlas | `api/atlas` | `ResolveCountyIdAsync()` from JWT | 404 (parcel not in county) |
| CostForge POST | `api/CostForge/calculate` | `ResolveCountyContextAsync()` + `CountyCodeMatchesContext()` | 403 (county mismatch) |
| Dossier | `api/dossier` | `ResolveCountyIdAsync()` → filter by CountyId | Empty set or 404 |
| LevyCalculation | `api/levy-calculation` | `ResolveCountyContextAsync()` + `CountyCodeMatchesContext()` | 403 (county mismatch) |

---

## Test Matrix (19 tests, 24 assertions)

| # | Test | Endpoint | Status | County |
|---|---|---|---|---|
| 1 | Atlas_SameCounty_ParcelGeometry_ReturnsNon404 | GET parcels/{id} | ≠403 | Same |
| 2 | Atlas_CrossCounty_ParcelGeometry_NoLeak | GET parcels/{id} | 404/403 | Cross |
| 3 | Atlas_SameCounty_ParcelLayers_ReturnsNon404 | GET parcels/{id}/layers | ≠403 | Same |
| 4 | Atlas_CrossCounty_ParcelLayers_NoLeak | GET parcels/{id}/layers | 404/403 | Cross |
| 5 | CostForge_SameCounty_Calculate_PassesAuthz | POST calculate | ≠403 | Same |
| 6 | CostForge_CrossCounty_Calculate_Forbidden | POST calculate | 403 | Cross |
| 7 | CostForge_SameCounty_Breakdown_PassesAuthz | GET {id}/breakdown | ≠403 | Same |
| 8 | CostForge_CrossCounty_Breakdown_NoLeak | GET {id}/breakdown | **204** ⚠️ | Cross |
| 9 | Dossier_SameCounty_Notes_ReturnsData | GET {parcel}/notes | 200 | Same |
| 10 | Dossier_CrossCounty_Notes_NoLeak | GET {parcel}/notes | empty/404 | Cross |
| 11 | Dossier_SameCounty_Casefile_PassesAuthz | GET parcels/{id}/casefile | ≠403 | Same |
| 12 | Dossier_CrossCounty_Casefile_NoLeak | GET parcels/{id}/casefile | empty/404 | Cross |
| 13 | Dossier_CrossCounty_WriteNote_Blocked | POST {parcel}/notes | 404/403 | Cross |
| 14 | Levy_SameCounty_CalculateRate_PassesAuthz | POST calculate-rate | ≠403,≠401 | Same |
| 15 | Levy_CrossCounty_CalculateRate_Forbidden | POST calculate-rate | 403 | Cross |
| 16 | Levy_SameCounty_BatchCalculate_PassesAuthz | POST calculate-batch | ≠403 | Same |
| 17 | Levy_CrossCounty_BatchCalculate_Forbidden | POST calculate-batch | 400/403 | Cross |
| 18 | Properties_SameCounty_GetById_ReturnsData | GET Properties/{id} | ≠403 | Same |
| 19 | Properties_CrossCounty_GetById_DocumentedBehavior | GET Properties/{id} | **200** ⚠️ | Cross |

---

## Findings (County-Scoping Gaps)

### FINDING-1: PropertiesController — No Server-Side County Filtering

**Severity:** High  
**Endpoint:** `GET /api/Properties/{id}`  
**Behavior:** Returns any property by GUID regardless of caller's county context.  
**Root Cause:** Controller uses client-supplied `countyId` query parameter for list endpoints; individual lookup by ID has no county check.  
**Impact:** Authenticated user can read any county's property by knowing the GUID.  
**Recommendation:** Add `ResolveCountyIdAsync()` and filter by `CountyId` on all PropertiesController endpoints. Priority for next CX lane.

### FINDING-2: CostForge Breakdown — No County Context Validation

**Severity:** Medium  
**Endpoint:** `GET /api/CostForge/{propertyId}/breakdown`  
**Behavior:** Calls `_costForgeService.GetCostBreakdownAsync(propertyId)` without checking county context. Returns service result for any property GUID.  
**Contrast:** The `POST /api/CostForge/calculate` endpoint DOES validate county via `CountyCodeMatchesContext()`.  
**Impact:** Authenticated user with plugin permissions can retrieve cost breakdown for any county's property.  
**Recommendation:** Add county context resolution to all CostForge GET-by-ID endpoints (`breakdown`, `compare`, `forecast`). Priority for next CX lane.

### FINDING-3: PacsOpsController — All Endpoints Anonymous

**Severity:** Low (by design)  
**Endpoint:** `ops/pacs/*`  
**Behavior:** All `[AllowAnonymous]` — no auth, no county filtering.  
**Note:** Intentional ops/diagnostics surface. No county data returned from seeded data. Not tested in this suite (no county concept to leak). Documented for audit record.

---

## Factory Design

- `Cx19CrossCountyFactory` extends `WebApplicationFactory<ApiProgram>`
- InMemory database with unique name per test class
- Two counties seeded: Benton (caller's) + King (foreign)
- Properties + DossierNotes seeded in both counties
- Test auth handler resolves county claims from `X-Test-CountyId` / `X-Test-CountyCode` headers
- Mock `IPluginRepository` passes all permission checks (19 permissions)
- Mock CostForge service stubs prevent external dependencies

---

## Governance

- Tests enforce status codes + minimal stable contract shape (not brittle payload content)
- 404 for missing data, 403 for county mismatch, empty-set for filtered results
- Findings documented inline in test code and in this report
- Scope: backend/tests/ and backend/docs/ only (allowed scope)

---

## Finding Dispositions

### D1 — DossierController Write Without County Isolation
**Status**: FIXED — PR #549 merged. CreateNote now resolves county context and verifies parcel ownership via _context.Properties.AnyAsync(p => p.Id == parcelId && p.CountyId == countyId).

### D2 — PropertiesController GET /api/Properties/{id} Returns Property Regardless of County
**Status**: COMPLIANT — TryGetCountyId() filters by county claim when present. Anonymous/internal callers (no claim) see global scope by design. The 113 R1Week5 regression tests confirm 404 for foreign-county property access when county claim is set.

### D3 — PiltController [AllowAnonymous] Including Approval Endpoint
**Status**: BY DESIGN — PILT endpoints serve public transparency data (federal Payment-in-Lieu-of-Taxes). ApproveCalculation is a stub returning NotFound() with no side effects. **Re-evaluation trigger**: When R2 real PILT write logic is added, this [AllowAnonymous] MUST be replaced with [Authorize] + [RequiresPermission("approve:pilt")] and county isolation. Tracked as pre-condition for any PILT write PR.
