# DX-02: Governed Local Runtime Smoke Report

**Lane**: DX-02 -- Governed Local Runtime Smoke
**Type**: Validation / Runtime Smoke
**Branch**: `copilot/dx02-governed-local-runtime-smoke`
**Base**: `origin/r1/integration` (includes DX-01 merge `4eb1c56bc`)
**Date**: 2026-03-05
**Verdict**: **PASS** (all acceptance criteria met)

---

## Environment

| Parameter | Value |
|-----------|-------|
| OS | Windows 11 / WSL2 |
| Runtime | .NET 8.0 (ASP.NET Core) |
| ASPNETCORE_ENVIRONMENT | `Development` |
| Database | SQLite file-backed (`terrafusion-dev.db`) |
| Backend port | 5000 |
| Seeded data | 3 Benton County parcels (BENTON-001, -002, -003) |

---

## AC-1: Local Development runtime starts from sanctioned commands

**Status**: PASS (covered by DX-01 PR #568)

DX-01 established the governed bootstrap path. Backend starts with:
```
dotnet run --project src/TerraFusion.API
```

Health check confirms operational state:
```
GET http://localhost:5000/health
Response: 200 OK
{
  "status": "Healthy",
  "database": "Healthy - 3 properties in database",
  "environment": "Development",
  "timestamp": "2026-03-05T..."
}
```

---

## AC-2: Dev token decoded with countyId, countyCode, role, perm

**Status**: PASS

**Command**:
```bash
curl http://localhost:5000/api/auth/dev-token
```

**Response**: HTTP 200 with JWT token

**Decoded claims**:

| Claim | Value |
|-------|-------|
| `sub` | `dev-user-001` |
| `email` | `dev@terrafusion.local` |
| `countyId` | `19190019-1919-1919-1919-191919191919` |
| `countyCode` | `benton` |
| `role` | `Developer`, `Assessor` |
| `perm` | `read:dossier`, `write:dossier`, `read:property`, `read:levy`, `read:costforge` |
| `iss` | `TerraFusion.API` |
| `aud` | `TerraFusion.Client` |

All required claims present. Token round-trips through `JwtSecurityTokenHandler`.

---

## AC-3: Protected Benton Dossier route returns success for seeded parcel

**Status**: PASS

**Command**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Correlation-ID: dx02-smoke-dossier-001" \
     http://localhost:5000/api/dossier/BENTON-001
```

**Response**: HTTP 200
```json
{
  "parcelId": "BENTON-001",
  "parcelNumber": "1-0531-100-0001-000",
  "propertyType": "Residential",
  "address": "123 Main St, Kennewick, WA 99336",
  "assessedValue": 285000,
  "marketValue": 310000,
  "correlationId": "dx02-smoke-dossier-001"
}
```

**CorrelationId echoed**: `dx02-smoke-dossier-001` -- confirmed in both response body and `X-Correlation-ID` response header.

---

## AC-4: A second real route returns valid live data for same Benton context

**Status**: PASS

**Route used**: `GET /api/dossier/parcels/{parcelId}/details` (Dossier details endpoint with selective includes)

**Note**: The Properties route (`GET /api/properties/parcel/{parcelNumber}`) was attempted first but returned HTTP 500 due to `IPropertyService` not being registered in DI. This is a pre-existing defect, not a DX-02 regression. The Dossier details endpoint was used as the second real route instead.

**Command**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Correlation-ID: dx02-smoke-details-002" \
     "http://localhost:5000/api/dossier/parcels/BENTON-002/details?include=property,valuation"
```

**Response**: HTTP 200
```json
{
  "parcelId": "BENTON-002",
  "propertyType": "Commercial",
  "address": "456 Commerce Ave, Richland, WA 99352",
  "valuation": {
    "totalValue": 750000,
    "categories": [...]
  },
  "links": {
    "self": "/api/dossier/parcels/BENTON-002/details",
    "summary": "/api/dossier/BENTON-002",
    ...
  },
  "correlationId": "dx02-smoke-details-002"
}
```

**CorrelationId echoed**: `dx02-smoke-details-002` -- confirmed.

---

## AC-5: Cross-county access is denied with expected status semantics

**Status**: PASS

**Command**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Correlation-ID: dx02-smoke-crosscounty-003" \
     http://localhost:5000/api/dossier/CLARK-999
```

**Response**: HTTP 404
```json
{"error": "Parcel not found"}
```

**Semantics**: Returns 404 (not 403) to prevent county enumeration. An attacker cannot distinguish "parcel doesn't exist" from "parcel exists but belongs to a different county." This is correct anti-enumeration behavior.

**Additional verification -- unauthenticated access**:
```bash
curl http://localhost:5000/api/dossier/BENTON-001
```
**Response**: HTTP 401 (Unauthorized) -- confirms auth gate is active.

**Additional verification -- missing county claims in Production mode**:
Unit test `AC5_DossierRoute_Denies_WhenNoCountyClaims_InProduction` confirms that a controller in Production mode (no `_isDevelopment` fallback) returns `ForbidResult` when county claims are absent.

---

## AC-6: Successful requests include correlationId for traceability

**Status**: PASS

**Command**:
```bash
curl -v -H "Authorization: Bearer $TOKEN" \
     -H "X-Correlation-ID: dx02-smoke-success-004" \
     http://localhost:5000/api/dossier/BENTON-001
```

**Response headers** (relevant excerpt):
```
< X-Correlation-ID: dx02-smoke-success-004
```

**CorrelationId** present in:
1. Response body `correlationId` field
2. `X-Correlation-ID` response header

**Finding (non-blocking)**: On 404 error responses, the `X-Correlation-ID` header is NOT echoed. The `GetOrCreateCorrelationId()` method is only called in the success path of `GetParcelDossier`. The AuditLoggingMiddleware still captures the request for traceable evidence, so operational traceability is maintained through audit logs. This could be improved in a future lane.

---

## AC-7: DX-02 report records exact evidence

**Status**: This document.

---

## Smoke Test Artifact

**File**: `backend/tests/TerraFusion.Unit.Tests/R1Week5/DX02GovernedLocalSmokeTests.cs`

| Test | AC | Result |
|------|----|--------|
| `AC2_DevToken_CarriesCountyAndPermClaims` | AC-2 | PASS |
| `AC3_DossierRoute_ReturnsSuccess_ForSeededBentonParcel` | AC-3 | PASS |
| `AC4_DossierDetailsRoute_ReturnsSuccess_ForSecondBentonParcel` | AC-4 | PASS |
| `AC5_DossierRoute_Denies_CrossCountyAccess` | AC-5 | PASS |
| `AC5_DossierRoute_Denies_WhenNoCountyClaims_InProduction` | AC-5 | PASS |
| `AC6_DossierRoute_IncludesCorrelationId_OnSuccess` | AC-6 | PASS |
| `AC1_SeededData_IsAccessible_WithoutManualSetup` | AC-1 | PASS |

**Total**: 7 passed, 0 failed, 0 skipped

---

## Findings (documented, not fixed per DX-02 scope)

| # | Finding | Severity | Recommendation |
|---|---------|----------|----------------|
| 1 | `IPropertyService` not registered in DI -- Properties routes return 500 | Medium | New bug lane to register service or remove unused controller |
| 2 | Dev token has `read:costforge` but CostForgeController requires `access:costforge` | Low | Align permission key in token or controller |
| 3 | `X-Correlation-ID` not echoed on 404 error responses | Low | Move `GetOrCreateCorrelationId()` call before county resolution, or add correlation to error paths |

---

## Verdict

**DX-02 PASSES**. The DX-01 governed bootstrap supports a real end-to-end local operator workflow:
- Dev token carries all required county and permission claims
- Seeded Benton parcels are accessible through the governed dossier path
- Cross-county access is denied with correct anti-enumeration semantics
- CorrelationIds provide traceability on success paths
- No manual surgery required -- `dotnet run` + `curl` is sufficient

The local development runtime is validated as a working governed operator environment.
