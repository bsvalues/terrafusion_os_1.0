# CP-14 Isolation Proof

Date: 2026-03-19
Phase: Phase 1 — Security & Isolation Closure
Gate: G3 (Tenant Isolation Coverage)
Status: FAILED AUDIT — backend implementation required

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

## Current Assessment (2026-03-19 audit)

Controller audit completed against current code:

- `backend/src/TerraFusion.API/Controllers/PropertiesController.cs`
	- class is `[Authorize]` but `GetProperties` accepts optional `Guid? countyId` and does not enforce claim match.
	- `GetPropertyByParcel`, `GetPropertyValuations`, `CreateValuation`, `GetPropertyStats` do not enforce county isolation at controller boundary.
	- required `countyId` + 400/403 behavior is not implemented.
- `backend/src/TerraFusion.API/Controllers/DaisController.cs`
	- class is `[Authorize]` but multiple endpoints are `[AllowAnonymous]`.
	- county resolution returns `Forbid()` when missing claim (403), not required 401 fail-closed behavior.
	- no sentinel GUID fallback observed (good), but claim-missing behavior still fails contract.
- `backend/src/TerraFusion.API/Controllers/MarketplaceController.cs`
	- no class-level `[Authorize]`.
	- still contains stub metrics helpers (`GetDownloadCount`, `GetRating`, `GetRatingCount`).

Result: G3 remains open; explicit code changes are required.

## Line-Level Evidence

- `PropertiesController`
	- `GetProperties` optional county query: `Guid? countyId = null` (line 28)
	- entrypoint missing mandatory claim/query reconciliation: `GetProperties` (line 24)
	- protected single-record path uses claim extraction: `TryGetCountyId` (line 64), but collection/stat endpoints do not
	- non-isolated endpoints needing contract review: `GetPropertyByParcel` (line 72), `GetPropertyValuations` (line 90), `CreateValuation` (line 105), `GetPropertyStats` (line 121)
- `DaisController`
	- class has `[Authorize]` (line 21) but many endpoints are `[AllowAnonymous]` (examples at lines 128, 145, 161, 179, 206)
	- claim resolver entrypoint: `ResolveCountyIdAsync` (line 55)
	- missing-claim path returns `Forbid()` (line 227) where phase contract requires 401 fail-closed
- `MarketplaceController`
	- class lacks `[Authorize]` between `[ApiController]` (line 10) and route (line 11)
	- stub metrics are still wired in plugin projection (lines 42-44)
	- stub helper implementations remain (`GetDownloadCount` line 150, `GetRating` line 160, `GetRatingCount` line 170)

## Pass Conditions (G3)

- All critical county boundaries enforced in controller layer
- Service layer filter always applied — no bypass path
- `countyId` absence → 400, mismatch → 403
- DaisController sentinel GUID fallback removed
- MarketplaceController fully authorized

## Evidence Fields (to fill after implementation)

| Test | Expected | Actual | Status |
|---|---|---|---|
| PropertiesController missing countyId → 400 | 400 | Optional `countyId` accepted | FAIL |
| PropertiesController county mismatch → 403 | 403 | Claim/request mismatch check missing | FAIL |
| DaisController no JWT → 401 | 401 | Class `[Authorize]` may challenge, but claim-missing path returns 403 | FAIL |
| DaisController no countyId claim → 401 | 401 | `ResolveCountyIdAsync` null → `Forbid()` (403) | FAIL |
| DaisController county mismatch → 403 | 403 | Partial (not explicitly asserted by controller tests) | PARTIAL |
| MarketplaceController unauthorized → 401 | 401 | No class-level `[Authorize]` | FAIL |
| No sentinel GUID fallback present | absent | No sentinel GUID fallback detected | PASS |

## Implementation Handoff

Scope: `backend/src/TerraFusion.API/Controllers/PropertiesController.cs`, `backend/src/TerraFusion.API/Controllers/DaisController.cs`, `backend/src/TerraFusion.API/Controllers/MarketplaceController.cs`
Out-of-scope for Copilot lane: backend C# controller edits
These are in authorized scope for backend writer lane.

Required backend tests to add in handoff:

- `PropertiesController`:
	- missing county claim/query returns 400
	- county mismatch returns 403
- `DaisController`:
	- missing county claim returns 401
	- county mismatch returns 403
- `MarketplaceController`:
	- unauthorized requests return 401

## Backend Patch Checklist (implementation lane)

- `PropertiesController`
	- require county context on all read/write endpoints (claim and/or query contract)
	- enforce: missing county context => 400
	- enforce: request county mismatch to claim => 403
	- ensure property/valuation/stats queries pass county filter to service methods
- `DaisController`
	- remove `[AllowAnonymous]` from governed write/read endpoints where county context is required
	- replace missing-claim `Forbid()` path with explicit 401 for absent county claim
	- preserve 403 semantics for claim/request mismatch
- `MarketplaceController`
	- add class-level `[Authorize]`
	- remove synthetic rating/download helpers and source values from governed module registry metadata
	- constrain submit/publish endpoints to internal-admin policy path only
