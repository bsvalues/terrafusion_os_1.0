# CP-14 Isolation Proof

Date: 2026-03-19
Phase: Phase 1 — Security & Isolation Closure
Gate: G3 (Tenant Isolation Coverage)
Status: PASS — controller and service enforcement implemented

## Required Isolation Fixes (from Phase 1 roadmap)

### 1-A PropertiesController
- `countyId` must be mandatory (`[Required]` in query params or extracted from JWT claim)
- Service layer: filter always applied, not optional pass-through
- Return 400 if `countyId` absent from request
- Return 403 if `countyId` in request does not match JWT claim

### 1-B DaisController
- Fail-closed on missing JWT `countyId` claim → 401, no sentinel GUID fallback
- Remove sentinel GUID fallback path entirely
- Integration test: unauthenticated request → 401, claim-missing request → 401, county-mismatch → 403

### 1-C MarketplaceController Containment
- Add `[Authorize]` at class level
- Remove stub `GetDownloadCount()` / `GetRating()` / `GetRatingCount()` methods
- Wire to real module registry (`IModuleService`) for internal admin surface only
- No public publisher workflow — V1 is internal only

## Current Assessment (2026-03-19 implementation)

Controller and service fixes completed against current code:

- `backend/src/TerraFusion.API/Controllers/PropertiesController.cs`
	- all county-scoped entrypoints now require a valid `countyId` claim and return 400 when missing.
	- query county mismatch is rejected with 403.
	- parcel, valuations, create-valuation, and stats endpoints now pass county-scoped service methods.
- `backend/src/TerraFusion.API/Controllers/DaisController.cs`
	- anonymous carve-outs removed from governed HTTP actions.
	- missing county claim now fails closed with 401 via `RequireCountyAccessAsync`.
	- sentinel county fallback removed from county-scoped endpoints; route county mismatch returns 403.
- `backend/src/TerraFusion.API/Controllers/MarketplaceController.cs`
	- class-level admin authorization added.
	- stub metrics helpers removed; payload now surfaces registry-backed module metadata only.

Result: G3 closure conditions satisfied.

## Line-Level Evidence

- `PropertiesController`
	- claim/query reconciliation helper implemented: `TryResolveCountyId`.
	- county-scoped service methods now back parcel lookup, valuations, and stats.
- `DaisController`
	- claim enforcement helper implemented: `RequireCountyAccessAsync`.
	- all sentinel fallback assignments removed from county-scoped endpoints.
- `MarketplaceController`
	- class now carries `[Authorize(Roles = "Admin,SystemAdmin")]`.
	- plugin projection no longer injects synthetic rating/download values.

## Pass Conditions (G3)

- All critical county boundaries enforced in controller layer
- Service layer filter always applied — no bypass path
- `countyId` absence → 400, mismatch → 403
- DaisController sentinel GUID fallback removed
- MarketplaceController fully authorized

## Evidence Fields (to fill after implementation)

| Test | Expected | Actual | Status |
|---|---|---|---|
| PropertiesController missing countyId → 400 | 400 | `ControllerSecurityBoundaryTests` returned 400 | PASS |
| PropertiesController county mismatch → 403 | 403 | `ControllerSecurityBoundaryTests` returned 403 | PASS |
| DaisController no countyId claim → 401 | 401 | `ControllerSecurityBoundaryTests` returned 401 | PASS |
| DaisController county mismatch → 403 | 403 | `ControllerSecurityBoundaryTests` returned 403 | PASS |
| MarketplaceController unauthorized boundary configured | admin-only | `[Authorize(Roles = "Admin,SystemAdmin")]` verified in test | PASS |
| No sentinel GUID fallback present | absent | grep verified no sentinel fallback remains | PASS |

## Proof Command

- `dotnet test backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter FullyQualifiedName~ControllerSecurityBoundaryTests`
- Result: PASS (7/7)

## Implemented Change Set

- `PropertiesController`
	- county context required for collection, parcel, valuation, create-valuation, and stats endpoints
	- missing county claim => 400
	- request county mismatch => 403
	- county-scoped service overloads added for parcel, valuations, and stats
- `DaisController`
	- `RequireCountyAccessAsync` centralizes 401/403 behavior
	- anonymous overrides removed from governed actions
	- sentinel county fallback removed from county-scoped endpoints
- `MarketplaceController`
	- admin-only authorization added
	- synthetic rating/download helpers removed
	- registry-backed metadata retained without fake metrics
