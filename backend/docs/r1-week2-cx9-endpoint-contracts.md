# CX-9: R1 Endpoint Contracts & API Surface Audit
> R1 Week 2 · Evidence Lock Document

## Purpose

Document every tool-backed REST endpoint in the TerraFusion API, its authorization posture,
county isolation enforcement, and request/response contract. This enables Week 2 integration
wiring: the frontend execution spine can call these endpoints with confidence.

---

## Endpoint Inventory (13 Controllers, ~90 Endpoints)

### 1. CostForge — `api/CostForge`

**Auth**: `[Authorize]` + `[RequiresPermission("access:costforge")]` (class-level)
**County Isolation**: Full (`ResolveCountyContextAsync` + property-in-county check)

| Method | Path | Permission | Request | Response | County |
|--------|------|-----------|---------|----------|--------|
| POST | `/calculate` | `calculate:property-cost` | `PropertyCostCalculationRequest` | `CostAnalysisDto` | Full |
| POST | `/batch-calculate` | `calculate:batch-valuation` | `BatchValuationRequestDto` | `BatchValuationResultDto` | Stub |
| GET | `/{propertyId}/breakdown` | `read:cost-breakdown` | — | `CostBreakdownDto` | Full |
| GET | `/compare/{id1}/{id2}` | `read:cost-comparison` | — | `CostComparisonDto` | Full |
| GET | `/{propertyId}/forecast` | `read:cost-forecast` | `?years=N` | `CostForecastDto` | Full |
| GET | `/factors/{region}` | `read:cost-factors` | — | `CostFactorDto[]` | None |
| GET | `/matrix` | `read:cost-matrix` | `?buildingType&region` | `CostMatrixDto` | None |
| GET | `/status` | `read:system-status` | — | `CostForgeStatusDto` | None |
| GET | `/agents/status` | `read:ai-agents` | — | `AIAgentStatusDto` | None |
| POST | `/agents/scale` | `manage:ai-agents` | `ScaleAgentsRequest` | `ActionResult` | None |
| GET | `/metrics` | `read:performance-metrics` | — | `PerformanceMetricsDto` | None |
| POST | `/sync/harris-pacs` | `sync:external-systems` | `HarrisSyncRequestDto` | `HarrisSyncResultDto` | Stub |

**CX-8 Fix**: `/calculate` now returns real parcel-variable data from DB (no longer hardcoded).

---

### 2. Properties — `api/Properties`

**Auth**: `[Authorize]` (class-level)
**County Isolation**: Partial (only `GET /{id}` enforces county context)

| Method | Path | Permission | Request | Response | County |
|--------|------|-----------|---------|----------|--------|
| GET | `/` | *(none)* | `?page&pageSize&search&countyId` | `PagedResult<PropertyDto>` | Optional param |
| GET | `/{id}` | `read:properties` | — | `PropertyDto` | `TryGetCountyId()` |
| GET | `/parcel/{parcelNumber}` | *(none)* | — | `PropertyDto` | None |
| GET | `/{id}/valuations` | *(none)* | — | `ValuationDto[]` | None |
| POST | `/{id}/valuations` | *(none)* | `CreateValuationDto` | `ValuationDto` | None |
| GET | `/stats` | *(none)* | — | `PropertyStatsDto` | None |

**Gaps**: 4/6 endpoints lack `[RequiresPermission]`; 5/6 skip county isolation.

---

### 3. LevyCalculation — `api/levy-calculation`

**Auth**: `[Authorize(Roles = "LevyClerk,Assessor,Admin")]`
**County Isolation**: Full (`ResolveCountyContextAsync` + `CountyCodeMatchesContext`)

| Method | Path | Permission | Request | Response | County |
|--------|------|-----------|---------|----------|--------|
| POST | `/calculate-rate` | *(role-gated)* | `LevyMeasureRequest` | `LevyCalculationResultDto` | Full |
| POST | `/calculate-batch` | *(role-gated)* | `List<LevyMeasureRequest>` | `BatchCalculationResultDto` | Full |
| GET | `/history` | *(role-gated)* | `?taxYear=N&districtId=X` | `List<LevyHistoryDto>` | Full |

**CX-21 contract bump** (added in PR #553):
- `GET /history` — new endpoint for county-isolated retrieval of persisted levy calculations
- `LevyCalculationResultDto` gained `TaxLevyId` (nullable `Guid?`) linking to the persisted `TaxLevy` record
- `LevyHistoryDto` — new DTO: `TaxLevyId`, `CountyId`, `TaxingDistrict`, `TaxRate`, `LevyAmount`, `TaxYear`, `Purpose`, `EffectiveDate`
- `BatchCalculationResultDto.Results[].TaxLevyId` — each batch result now includes its persisted record ID

**Cleanest controller**: Role-gated + county-isolated. Model for others.

---

### 4. Atlas — `api/atlas`

**Auth**: `[Authorize]`
**County Isolation**: Full (`ResolveCountyIdAsync`)

| Method | Path | Permission | Request | Response | County |
|--------|------|-----------|---------|----------|--------|
| GET | `/parcels/{parcelId}` | `read:parcel` | — | JSON (parcel metadata) | Full |
| GET | `/parcels/{parcelId}/layers` | `read:parcel` | — | JSON (layers, geometry=null R1) | Full |

**R1 Guardrail**: Geometry returns `null` with `geometryAvailable = false`.

---

### 5. Dossier — `api/dossier`

**Auth**: `[Authorize]`
**County Isolation**: Full (`ResolveCountyIdAsync` + parcel-exists check on writes)

| Method | Path | Permission | Request | Response | County |
|--------|------|-----------|---------|----------|--------|
| GET | `/{parcelId}/notes` | `read:dossier` | — | JSON (notes array) | Full |
| POST | `/{parcelId}/notes` | `write:dossier` | `CreateNoteRequest` | JSON (Created) | Full |
| GET | `/parcels/{parcelId}/casefile` | `read:dossier` | `?include=` | JSON (casefile) | Full |

---

### 6. Health Endpoints (3 controllers, public)

| Controller | Method | Path | Auth |
|------------|--------|------|------|
| `SimpleHealth` | GET | `/health` | Public |
| `SimpleHealth` | GET | `/health/ready` | Public |
| `SimpleHealth` | GET | `/health/live` | Public |
| `Health` | GET | `/api/Health` | Public |
| `Health` | GET | `/api/Health/detailed` | Public |
| `Health` | GET | `/api/Health/metrics` | Public |
| `SystemHealth` | GET | `/api/system/health` | `[AllowAnonymous]` |

**Note**: `/api/Health/detailed` exposes machine name, OS version, GC stats. Consider restricting.

---

### 7. Auth — `api/Auth`

**Auth**: Mixed (login/revoke are anonymous; refresh/logout/profile require auth)
**Rate Limited**: `[EnableRateLimiting("ApiPolicy")]`

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/login` | `[AllowAnonymous]` | `LoginRequest` | `LoginResponse` (JWT) |
| POST | `/refresh` | `[Authorize]` | `RefreshTokenRequest` | `LoginResponse` |
| POST | `/logout` | `[Authorize]` | — | OK |
| POST | `/revoke` | `[AllowAnonymous]` | `RefreshTokenRequest` | NoContent |
| GET | `/profile` | `[Authorize]` | — | `UserProfile` |

---

### 8. GPT — `api/GPT`

**Auth**: `[Authorize]` (class-level), 39 endpoints
**County Isolation**: Partial (claim-based `GetCountyId()` for some ops)

Covers: GPT configs (CRUD), conversations (CRUD + messaging),
RAG health/indexing, AI fleet management, policy evaluation, diagnostics.

**Gaps**: Zero `[RequiresPermission]` attributes. Admin operations (safe-mode toggle,
policy evaluation) unguarded beyond `[Authorize]`.

---

### 9. Modules — `api/Modules`

**Auth**: `[Authorize]` (class-level), 11 endpoints
**County Isolation**: None

CRUD + launch/stop/health check. Write operations (create/update/delete/launch/stop)
have no fine-grained permission gates.

---

### 10. Marketplace — `api/Marketplace`

**Auth**: None (entirely public), 6 endpoints
**County Isolation**: None

**Critical Gap**: submit, publish, download, rate — all unauthenticated.

---

### 11. PILT — `api/Pilt`

**Auth**: `[AllowAnonymous]` (class-level), 7 endpoints
**County Isolation**: None

Returns hardcoded stub data. Approval endpoint has zero auth — by-design posture (CX-19D3).

---

## Security Posture Summary

### County Isolation Matrix

| Grade | Controllers |
|-------|-------------|
| Full | CostForge, Atlas, Dossier, LevyCalculation |
| Partial | Properties (1/6), GPT (partial) |
| None | Modules, Marketplace, Pilt, Auth, Health |

### Permission Model

| Grade | Controllers |
|-------|-------------|
| `[RequiresPermission]` | CostForge (all 12 endpoints) |
| Role-gated | LevyCalculation, Auth |
| Permission on some | Properties (1/6), Atlas (2/2), Dossier (3/3) |
| `[Authorize]` only | GPT (39), Modules (11) |
| No auth at all | Marketplace (6), Pilt (7), Health (7) |

### R1 Integration Priority (for frontend wiring)

| Priority | Endpoint | Status |
|----------|----------|--------|
| P0 | `POST /api/CostForge/calculate` | Real data (CX-8 fixed) |
| P0 | `POST /api/levy-calculation/calculate-rate` | Real calculations |
| P0 | `GET /api/Properties/{id}` | County-isolated |
| P1 | `GET /api/atlas/parcels/{id}` | County-isolated (geometry stub) |
| P1 | `GET /api/dossier/{id}/notes` | County-isolated |
| P1 | `POST /api/Auth/login` | JWT issuance |
| P2 | `GET /api/GPT/*` | Needs permission gates |
| P2 | `GET /api/Modules/*` | Needs permission gates |

### Architectural Debt: County Context Code Duplication

`ResolveCountyContextAsync()` and ~8 helper methods are copy-pasted identically across
CostForge, LevyCalculation, Atlas, and Dossier controllers (~100 lines each).
Recommend extracting to shared `CountyContextResolver` service.

---

## Verification

This audit was performed by reading all controller files in:
`backend/src/TerraFusion.API/Controllers/`

All attribute decorators, route patterns, and DI dependencies were inspected directly
from source code.
