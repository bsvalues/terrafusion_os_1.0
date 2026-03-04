# R1 Week 4 Security Audit (CX-13)

Date: 2026-03-03 (America/Los_Angeles)  
Branch: `codex/r1-week4-ship`

## Scope

R1 backend contract endpoints and direct R1-adjacent routes:

- `POST /api/costforge/calculate`
- `POST /api/levy-calculation/calculate-rate`
- `POST /api/levy-calculation/calculate-batch`
- `GET /api/atlas/parcels/{parcelId}`
- `GET /api/atlas/parcels/{parcelId}/layers`
- `GET /api/dossier/{parcelId}/notes`
- `POST /api/dossier/{parcelId}/notes`
- `GET /api/dossier/parcels/{parcelId}/casefile`

Out-of-scope: non-R1 controller surfaces.

## Audit Method

1. Static scan of controller attributes (`[Authorize]`, `[RequiresPermission]`).
2. Query-path scan for county claim resolution and county filters in data access.
3. Rejection-path tests for cross-county and missing county context.

## Endpoint Verdicts

| Endpoint | Auth Gate | County Isolation Method | Verdict |
|---|---|---|---|
| `POST /api/costforge/calculate` | Controller `[Authorize]` + `[RequiresPermission("access:costforge")]`, action `[RequiresPermission("calculate:property-cost")]` | `ResolveCountyContextAsync()` from claims + request requires `CountyCode` or `Region` + `CountyCodeMatchesContext()` reject path + property lookup constrained to `p.CountyId == countyContext.CountyId` before valuation | PASS |
| `POST /api/levy-calculation/calculate-rate` | Controller `[Authorize(Roles = "LevyClerk,Assessor,Admin")]` | `ResolveCountyContextAsync()` from claims + required `request.CountyCode` + `CountyCodeMatchesContext()` reject path | PASS |
| `POST /api/levy-calculation/calculate-batch` | Controller `[Authorize(Roles = "LevyClerk,Assessor,Admin")]` | Same claim context resolution; every batch item must include `CountyCode` and match claim county context | PASS |
| `GET /api/atlas/parcels/{parcelId}` | Controller `[Authorize]`, action `[RequiresPermission("read:parcel")]` | `ResolveCountyIdAsync()` from claims + `Properties` query constrained to matching `CountyId` | PASS |
| `GET /api/atlas/parcels/{parcelId}/layers` | Controller `[Authorize]`, action `[RequiresPermission("read:parcel")]` | `ResolveCountyIdAsync()` + existence check constrained by `CountyId` | PASS |
| `GET /api/dossier/{parcelId}/notes` | Controller `[Authorize]`, action `[RequiresPermission("read:dossier")]` | `ResolveCountyIdAsync()` + notes query constrained by `CountyId` | PASS |
| `POST /api/dossier/{parcelId}/notes` | Controller `[Authorize]`, action `[RequiresPermission("write:dossier")]` | `ResolveCountyIdAsync()` + parcel existence check constrained by `CountyId`; persisted note carries claim-resolved `CountyId` | PASS |
| `GET /api/dossier/parcels/{parcelId}/casefile` | Controller `[Authorize]`, action `[RequiresPermission("read:dossier")]` | `ResolveCountyIdAsync()` + parcel and notes queries constrained by `CountyId` | PASS |

## Evidence (Code References)

- CostForge auth and county isolation:
  - `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` lines 22-23, 48, 198-258
- Levy auth and county isolation:
  - `backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs` lines 41, 55-198, 233-247, 344-354
- Atlas county isolation:
  - `backend/src/TerraFusion.API/Controllers/AtlasController.cs` lines 17, 31-65, 151-176, 200-217
- Dossier county isolation:
  - `backend/src/TerraFusion.API/Controllers/DossierController.cs` lines 17, 32-66, 146-170, 181-204, 241-255

## Evidence (Tests)

- Existing Week 3 guard suite:
  - `backend/tests/TerraFusion.Unit.Tests/R1Week3/AtlasDossierControllerGuardsTests.cs`
- New Week 4 guard suite:
  - `backend/tests/TerraFusion.Unit.Tests/R1Week4/SecurityIsolationAuditGuardsTests.cs`
  - Covers same-county success and rejection paths:
    - `CostForge_SameCountyRequest_ReturnsOk`
    - `CostForge_CrossCountyRequest_ReturnsForbid`
    - `CostForge_MissingCountyClaims_ReturnsForbid`
    - `CostForge_MissingCountyCodeAndRegion_ReturnsBadRequest`
    - `Levy_SameCountyRequest_ReturnsOk`
    - `Levy_CrossCountyRequest_ReturnsForbid`
    - `Levy_MissingCountyClaims_ReturnsForbid`

## Gate Output

Command:

```bash
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj -nologo -v minimal
```

Result:

- Passed: `773`
- Failed: `0`
- Skipped: `0`

## Exceptions

None in audited R1 scope.
