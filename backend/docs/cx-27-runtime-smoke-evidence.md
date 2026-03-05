# CX-27: Runtime Smoke & Operator Validation — Evidence Report

## Ticket
**CX-27** — Runtime smoke testing + operator validation  
**Branch**: `r1/cx27-runtime-smoke-fixes`  
**Base**: `origin/r1/integration` at CX-26 merge (`3f8de6b02`)

## Purpose

Validate that every Dossier endpoint (CX-22 through CX-26) works against
a real running backend. Discover and fix deployment-grade issues that unit
tests cannot catch: DI wiring, auth chain, database configuration, error
response codes.

## Smoke Test Results

### Happy-Path Endpoints

| Endpoint | CX | Method | URL | Status | Result |
|----------|----|--------|-----|--------|--------|
| Summary | CX-22 | GET | `/api/dossier/{parcelId}` | **200** | Full `ParcelDossierDto` with countyName, property, correlationId |
| Notes | CX-22 | GET | `/api/dossier/{parcelId}/notes` | **200** | Empty list (no notes seeded) |
| Details | CX-23 | GET | `/api/dossier/parcels/{parcelId}/details` | **200** | Composed dossier with property, levies, notes sections |
| Casefile | CX-24 | GET | `/api/dossier/parcels/{parcelId}/casefile` | **200** | Casefile summary with correlationId |
| Evidence | CX-26 | GET | `/api/dossier/parcels/{parcelId}/evidence` | **200** | Full `EvidenceSnapshotDto` with SHA-256 hash |

### Error Paths

| Scenario | Status | Correct? |
|----------|--------|----------|
| No auth header | **401** | ✅ Unauthorized |
| Bad parcel format (`DROP TABLE`) | **400** | ✅ Rejected by regex |
| Nonexistent parcel | **404** | ✅ Not found |
| Cross-county (Yakima → Benton parcel) | **404** | ✅ Anti-enumeration |

### Evidence Hash Contract

Two requests to the evidence endpoint 2 seconds apart produced:
- Different `contentHash` (SHA-256 over serialized snapshot)
- Different `correlationId` (unique `dossier-` prefix)
- Different `snapshotTimestamp`

This confirms the point-in-time seal works correctly.

## Issues Found & Fixed

### 1. `[RequiresPermission]` ignored JWT `perm` claims (Design Gap)

**File**: `PluginPermissionHandler.cs`  
**Symptom**: All `[RequiresPermission("read:dossier")]` endpoints returned 403  
**Root Cause**: `PluginPermissionHandler` only checked `X-Plugin-Id` header +
plugin DB lookup. It had no fallback for JWT `perm` claims, meaning direct API
callers (non-plugin) could never pass the check.  
**Fix**: Added JWT `perm` claim check as primary path before plugin-ID fallback.
Uses `context.User.Claims` (already validated by JwtBearerHandler).

### 2. `ICostForgeAIService` not registered in DI (Missing Registration)

**File**: `Program.cs`  
**Symptom**: 500 Internal Server Error on any dossier endpoint  
**Root Cause**: `CostForgeService` constructor depends on `ICostForgeAIService`
but it was never registered in the DI container.  
**Fix**: Added `builder.Services.AddScoped<ICostForgeAIService, CostForgeAIService>()`

### 3. In-memory SQLite broken for web workloads (Deployment Finding)

**Symptom**: 500 with "no such table: Properties"  
**Root Cause**: `Data Source=:memory:` in `appsettings.Development.json` creates
a per-connection database. Each DI scope (request) gets a new empty database.
`EnsureCreatedAsync()` creates schema on one connection, but it's lost on the next.  
**Fix**: Override via env var with file-based SQLite:
`ConnectionStrings__DefaultConnection=Data Source=terrafusion-cx27.db`  
**Note**: This is a deployment configuration issue, not a code bug. The in-memory
setting may be intentional for isolated test runners but breaks dev-server usage.

### 4. `ASPNETCORE_ENVIRONMENT` defaults to Production (Deployment Finding)

**Symptom**: Wrong JWT signing key, wrong database connection string  
**Root Cause**: Without explicit `ASPNETCORE_ENVIRONMENT=Development`, the server
reads base `appsettings.json` (Production values).  
**Fix**: Set `$env:ASPNETCORE_ENVIRONMENT = "Development"` before startup.

## Files Modified

| File | Change |
|------|--------|
| `Security/PluginPermissionHandler.cs` | Added `perm` claim check (lines 24-36) |
| `Program.cs` | Added `ICostForgeAIService` DI registration (line 351) |

## Test Environment

- .NET 8, `localhost:5000`, Development mode
- SQLite file-based (`terrafusion-cx27.db`)
- JWT: HMAC-SHA256, `Terrafusion.API` issuer, claims include `countyId` + `perm`
- Benton County GUID: `19190019-1919-1919-1919-191919191919`

## Verdict

**All 5 dossier endpoints operational.** 9/9 test scenarios pass (5 happy, 4 error).
Two code fixes required (PluginPermissionHandler, Program.cs DI). Two deployment
findings documented for operator runbook.
