# CP-14 Isolation Proof

Date: 2026-03-19
Phase: Phase 1 — Security & Isolation Closure
Gate: G3 (Tenant Isolation Coverage)
Status: PENDING IMPLEMENTATION

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

## Current Assessment

Each controller must be inspected and patched. This is backend implementation work.
Implementation is a bounded handoff from Copilot lane → Backend Writer lane.

## Pass Conditions (G3)

- All critical county boundaries enforced in controller layer
- Service layer filter always applied — no bypass path
- `countyId` absence → 400, mismatch → 403
- DaisController sentinel GUID fallback removed
- MarketplaceController fully authorized

## Evidence Fields (to fill after implementation)

| Test | Expected | Actual | Status |
|---|---|---|---|
| PropertiesController missing countyId → 400 | 400 | — | PENDING |
| PropertiesController county mismatch → 403 | 403 | — | PENDING |
| DaisController no JWT → 401 | 401 | — | PENDING |
| DaisController no countyId claim → 401 | 401 | — | PENDING |
| DaisController county mismatch → 403 | 403 | — | PENDING |
| MarketplaceController unauthorized → 401 | 401 | — | PENDING |
| No sentinel GUID fallback present | absent | — | PENDING |

## Implementation Handoff

Scope: `TerraFusionPlatform/Controllers/PropertiesController.cs`, `DaisController.cs`, `MarketplaceController.cs`
Out-of-scope for Copilot lane: backend C# controller edits
These are in authorized scope for backend writer lane.
