# CX Lane: R1 Endpoint Contract Matrix

**Lane:** cx
**Date:** 2026-03-07
**Verified by:** Claude Code (CX lane agent)
**Command canon version:** r1-canon-2026-03-07

---

## R1 Live Endpoints

All endpoints verified against controller source at branch HEAD `6ff009ae4005635e4afb87e61f3fe2ce88b70545`.

### CostForge Endpoints

| Method | Route | Controller | Auth | County Isolation | Notes |
|---|---|---|---|---|---|
| POST | `/api/costforge/calculate` | CostForgeController | YES (`[Authorize]` + `[RequiresPermission("calculate:property-cost")]`) | YES | Single-property live calculation. Validates PropertyId or ParcelNumber exists in caller's county. Audit-logged. |
| GET | `/api/costforge/{propertyId}/breakdown` | CostForgeController | YES (`[RequiresPermission("read:cost-breakdown")]`) | YES | Cost breakdown for property. County-scoped via `PropertyExistsInCountyAsync`. |
| GET | `/api/costforge/compare/{propertyId1}/{propertyId2}` | CostForgeController | YES (`[RequiresPermission("read:cost-comparison")]`) | YES | Both properties must exist in caller's county. |
| GET | `/api/costforge/{propertyId}/forecast` | CostForgeController | YES (`[RequiresPermission("read:cost-forecast")]`) | YES | Years param clamped 1-20. |
| GET | `/api/costforge/factors/{region}` | CostForgeController | YES (`[RequiresPermission("read:cost-factors")]`) | NO (region-based) | Regional cost factors lookup. |
| GET | `/api/costforge/matrix` | CostForgeController | YES (`[RequiresPermission("read:cost-matrix")]`) | NO (query params) | Cost matrix by building type and region. |
| GET | `/api/costforge/status` | CostForgeController | YES (`[RequiresPermission("read:system-status")]`) | NO | System status. |
| GET | `/api/costforge/agents/status` | CostForgeController | YES (`[RequiresPermission("read:ai-agents")]`) | NO | AI agent swarm status. |
| GET | `/api/costforge/metrics` | CostForgeController | YES (`[RequiresPermission("read:performance-metrics")]`) | NO | Performance metrics. |
| POST | `/api/costforge/batch-calculate` | CostForgeController | YES (`[RequiresPermission("calculate:batch-valuation")]`) | YES | STUB -- returns "not yet implemented". |
| POST | `/api/costforge/agents/scale` | CostForgeController | YES (`[RequiresPermission("manage:ai-agents")]`) | NO | Scale AI agents (1-100,000). |
| POST | `/api/costforge/sync/harris-pacs` | CostForgeController | YES (`[RequiresPermission("sync:external-systems")]`) | YES | STUB -- returns "not yet implemented". |

### CostForge R2 Wave 1 Endpoints (USPAP Three-Approach Valuation)

| Method | Route | Controller | Auth | County Isolation | Notes |
|---|---|---|---|---|---|
| POST | `/api/costforge/approach/sales` | CostForgeController | YES (`[RequiresPermission("calculate:property-cost")]`) | YES | LIVE — SalesComparisonService.RunSalesApproach(). Typed DTO input, deterministic output. |
| POST | `/api/costforge/approach/income` | CostForgeController | YES (`[RequiresPermission("calculate:property-cost")]`) | YES | LIVE — IncomeApproachService.RunIncomeApproach(). Direct capitalization (NOI/CapRate). |
| POST | `/api/costforge/approach/cost` | CostForgeController | YES (`[RequiresPermission("calculate:property-cost")]`) | YES | LIVE — CostApproachService.CalculateCost(). Marshall-Swift with depreciation. |
| POST | `/api/costforge/approach/reconcile` | CostForgeController | YES (`[RequiresPermission("calculate:property-cost")]`) | YES | LIVE — ReconciliationService.RunReconciliation(). Property-type-weighted multi-approach. |
| GET | `/api/costforge/cost-matrix/{buildingType}/{region}` | CostForgeController | YES (`[RequiresPermission("read:cost-matrix")]`) | YES | LIVE — EF Core CostMatrices DbSet query. 21 entries seeded (7 types × 3 regions). |

### Property Endpoints

| Method | Route | Controller | Auth | County Isolation | Notes |
|---|---|---|---|---|---|
| GET | `/api/properties/{id}` | PropertyController | YES | YES | Property lookup by ID. |
| GET | `/api/properties/{parcelId}` | PropertyController | YES | YES | Property lookup by parcel ID. |

### Levy Calculation Endpoints

| Method | Route | Controller | Auth | County Isolation | Notes |
|---|---|---|---|---|---|
| POST | `/api/levy-calculation/calculate-rate` | LevyCalculationController | YES (Roles: LevyClerk, Assessor, Admin, Administrator) | YES | Calculates optimal levy rate. Persists to `TaxLevies` (CX-21). |

### DAIS (Assessment Workflow) Endpoints

| Method | Route | Controller | Auth | County Isolation | Notes |
|---|---|---|---|---|---|
| POST | `/api/dais/tasks/assign` | DaisController | YES (`[RequiresPermission("write:dais")]`) | YES | Task assignment with county claim. |
| GET | `/api/dais/certification/status` | DaisController | YES (`[RequiresPermission("read:dais")]`) | YES | LIVE — Real PropertyAssessments DB query for year. R2 enhanced. |
| POST | `/api/dais/packets/assemble` | DaisController | YES (`[RequiresPermission("write:dais")]`) | YES | BOE packet assembly with dossier payloadRef. |
| POST | `/api/dais/notices/draft` | DaisController | YES (`[RequiresPermission("write:dais")]`) | YES | Notice draft with tone/reason codes and payloadRef. |
| POST | `/api/dais/appeals/{caseId}/draft-response` | DaisController | YES (`[RequiresPermission("write:dais")]`) | YES | Appeal response with position and RCW citations. |
| GET | `/api/dais/exemptions/{county}/impact` | DaisController | YES (`[RequiresPermission("read:dais")]`) | YES | LIVE — Real TaxLevies DB query for exemption impact. R2 enhanced. |
| POST | `/api/dais/memos/generate` | DaisController | YES (`[RequiresPermission("write:dais")]`) | YES | Commissioner memo with dossier reference. |
| GET | `/api/dais/comps/{subjectId}/rationale` | DaisController | YES (`[RequiresPermission("read:dais")]`) | YES | LIVE — Real Properties DB lookup for subject. R2 enhanced. |
| POST | `/api/dais/redaction` | DaisController | YES (`[RequiresPermission("write:dais")]`) | YES | Trace redaction request with secure-blob payloadRef. |
| GET | `/api/dais/evidence/{dossierId}/synthesize` | DaisController | YES (`[RequiresPermission("read:dais")]`) | YES | Evidence synthesis with dossier sources. |
| GET | `/api/levy-calculation/history` | LevyCalculationController | YES (Roles) | YES | Levy history query with optional year/district filters. |
| POST | `/api/levy-calculation/calculate-batch` | LevyCalculationController | YES (Roles) | YES | Batch levy calculation (up to 100 measures). Persists results. |

### Dossier Endpoints

| Method | Route | Controller | Auth | County Isolation | Notes |
|---|---|---|---|---|---|
| GET | `/api/dossier/parcels/{parcelId}/casefile` | DossierController | YES (`[RequiresPermission("read:dossier")]`) | YES | Casefile summary with note counts and highlights. |
| GET | `/api/dossier/{parcelId}` | DossierController | YES (`[RequiresPermission("read:dossier")]`) | YES | Composed parcel dossier (property + CostForge + levies + notes). |
| GET | `/api/dossier/parcels/{parcelId}/details` | DossierController | YES (`[RequiresPermission("read:dossier")]`) | YES | Detailed dossier with selective includes, PII redaction, parameterized limits. |
| GET | `/api/dossier/parcels/{parcelId}/evidence` | DossierController | YES (`[RequiresPermission("read:dossier")]`) | YES | Evidence snapshot with SHA-256 content hash. |
| GET | `/api/dossier/{parcelId}/notes` | DossierController | YES (`[RequiresPermission("read:dossier")]`) | YES | List notes for parcel. |
| POST | `/api/dossier/{parcelId}/notes` | DossierController | YES (`[RequiresPermission("write:dossier")]`) | YES | Create append-only note. 2000-char limit. write-low. |
| GET | `/api/dossier/parcels/{parcelId}/assessment-history` | DossierController | YES (`[RequiresPermission("read:dossier")]`) | YES | LIVE — R2 Wave 4. Year-over-year assessment history with pct-change deltas. PropertyAssessments + Property join. |

### CostForge R2 Wave 4 Endpoints

| Method | Route | Controller | Auth | County Isolation | Notes |
|---|---|---|---|---|---|
| GET | `/api/costforge/{propertyId}/model-inputs` | CostForgeController | YES (`[RequiresPermission("read:cost-breakdown")]`) | YES | LIVE — R2 Wave 4. Explains model inputs: property attributes, USPAP approach weights, cost matrix factors, data quality. |

### Atlas Endpoints

| Method | Route | Controller | Auth | County Isolation | Notes |
|---|---|---|---|---|---|
| GET | `/api/atlas/parcels/{parcelId}` | AtlasController | YES (`[RequiresPermission("read:parcel")]`) | YES | Parcel geometry (R1: geometry fields null, `geometryAvailable=false`). |
| GET | `/api/atlas/parcels/{parcelId}/layers` | AtlasController | YES (`[RequiresPermission("read:parcel")]`) | YES | Available layer list for parcel. |
| GET | `/api/atlas/parcels/{parcelId}/nearby` | AtlasController | YES (`[RequiresPermission("read:parcel")]`) | YES | LIVE — R2 Wave 2. Nearby parcels by prefix heuristic + type filter. County-isolated. |
| GET | `/api/atlas/layers/{layerId}` | AtlasController | YES (`[RequiresPermission("read:parcel")]`) | NO | LIVE — R2 Wave 2. Layer metadata detail (static catalog). |

### Pilot Endpoints

| Method | Route | Controller | Auth | County Isolation | Notes |
|---|---|---|---|---|---|
| POST | `/pilot/invoke` | PilotController (CoPilot) | Governed path | N/A | AI CoPilot invocation. Governed by tool-risk policy. |
| GET | `/pilot/traces` | PilotController (CoPilot) | Governed path | N/A | Trace query for CoPilot operations. |
| GET | `/pilot/trace/:correlationId` | PilotController (CoPilot) | Governed path | N/A | Trace detail by correlation ID. |

---

## Endpoint Summary

| Category | Live | Stub | Total |
|---|---|---|---|
| CostForge (R1) | 10 | 2 | 12 |
| CostForge R2 Wave 1 | 5 | 0 | 5 |
| CostForge R2 Wave 4 | 1 | 0 | 1 |
| Property | 2 | 0 | 2 |
| Levy Calculation | 3 | 0 | 3 |
| DAIS (Assessment Workflow) | 10 | 0 | 10 |
| Dossier | 7 | 0 | 7 |
| Atlas | 4 | 0 | 4 |
| Pilot (CoPilot) | 3 | 0 | 3 |
| **Total** | **45** | **2** | **47** |

## Previously Excluded Controllers — Now Hardened

Both controllers that were excluded from the R1 contract have been hardened:

- **PropertyValuationController** -- `[Authorize]` + `[RequiresPermission]` added (CX-HARD-01 CLOSED March 7, 2026). Now included in contract.
- **PiltController** -- `[Authorize]` + `[RequiresPermission]` + county isolation via `IsCountyAuthorized()` added (CX-FAKE-01 CLOSED March 7, 2026). Now included in contract. Full PILT data persistence deferred to R2.
