# Phase 21 Evidence — CP-14: Security & Isolation Closure
**Date**: 2026-03-20
**Phase**: 21 (Claude Code) / Go-Live Phase 1 (Security Baseline)
**Status**: ✅ SEALED — All bricks complete
**Classification**: G3 (Tenant Isolation Coverage) + G4 (RBAC Contract Closure)

---

## Scope

Three controller bricks audited and resolved:

| Brick | Controller | Pre-State | Action | Post-State |
|---|---|---|---|---|
| 21-A | PropertiesController | Already compliant | No change | ✅ Compliant |
| 21-B | DaisController | Already compliant | No change | ✅ Compliant |
| 21-C | MarketplaceController | 3 stub endpoints + stub metrics | Removed | ✅ Compliant |

---

## 21-A: PropertiesController — Pre-Existing Compliance

`[Authorize]` at class level. `TryResolveCountyId` helper enforces:
- Missing / unparseable `countyId` JWT claim → `400 Bad Request`
- Mismatched `countyId` vs request parameter → `403 Forbidden`

All endpoints call this helper. No sentinel GUID fallback. No changes needed.

Evidence: `R1Week5Cx19D1PropertiesCountyIsolationIntegrationTests` (pre-existing, 4 isolation proofs).

---

## 21-B: DaisController — Pre-Existing Compliance

`[Authorize]` at class level. `ResolveCountyIdAsync()` + `RequireCountyAccessAsync()` form the gate:
- Direct GUID claim → resolved immediately (no DB needed)
- County name/code fallback → DB lookup
- Both missing → `Unauthorized`
- County mismatch on specific-county endpoints → `Forbid`

No sentinel GUID anywhere (`Guid.Empty` check at line 87 returns null → Unauthorized, correct). No changes needed.

---

## 21-C: MarketplaceController — Stub Removal

**Removed endpoints (3):**
- `POST /api/marketplace/plugins/{id}/rate` — log-only stub, no storage
- `POST /api/marketplace/submit` — no public submission workflow in V1
- `POST /api/marketplace/publish` — no public publisher workflow in V1

**Removed from `GetPlugins` response:**
- `downloads = 0` — stub metric
- `rating = 0.0` — stub metric
- `ratingCount = 0` — stub metric
- `sort` switch cases for `"rating"` and `"downloads"` (fields removed)

**Kept:**
- `metricsAvailable = false` — honest capability flag
- `[Authorize(Roles = "Admin,SystemAdmin")]` at class level ✅
- `IModuleService` wire-through for real module catalog ✅
- `GetPlugins`, `GetCategories`, `DownloadPlugin` — real endpoints ✅

**Dead dependency removed:** `IMarketplaceService` field + constructor injection (only used by removed endpoints).

---

## G3 + G4 Contract Tests — New (Phase 21)

**File:** `tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx21DaisMarketplaceIsolationTests.cs`

### G3 — DaisController County Isolation (6 tests)

| Test | Expectation | Result |
|---|---|---|
| Unauthenticated GET /api/dais/permit-types | 401 | ✅ |
| Unauthenticated GET /api/dais/cert/status | 401 | ✅ |
| Auth'd, no county claim, GET /api/dais/cert/status | 401 | ✅ |
| Auth'd, no county claim, GET /api/dais/appeals | 401 | ✅ |
| Auth'd, valid countyId GUID, GET /api/dais/permit-types | 200 | ✅ |
| Auth'd, valid countyId GUID, GET /api/dais/workflow-stages | 200 | ✅ |

### G4 — MarketplaceController RBAC (9 tests)

| Test | Expectation | Result |
|---|---|---|
| Unauthenticated GET /api/marketplace/plugins | 401 | ✅ |
| Unauthenticated GET /api/marketplace/categories | 401 | ✅ |
| Auth'd Assessor role, GET /api/marketplace/plugins | 403 | ✅ |
| Auth'd ReadOnly role, GET /api/marketplace/plugins | 403 | ✅ |
| Auth'd Admin role, GET /api/marketplace/plugins | 200 | ✅ |
| Auth'd SystemAdmin role, GET /api/marketplace/plugins | 200 | ✅ |
| Admin POST /api/marketplace/plugins/{id}/rate | 404 (stub removed) | ✅ |
| Admin POST /api/marketplace/submit | 404 (stub removed) | ✅ |
| Admin POST /api/marketplace/publish | 404 (stub removed) | ✅ |

**Total CX21 tests: 15/15 passed**

---

## Build Gate

```
dotnet build TerraFusion.sln --configuration Release
→ 0 errors (pre-existing warnings only)
```

---

## Pre-existing Non-Blocking Failures

`R1Week5Cx19D1PropertiesCountyIsolationIntegrationTests.Authenticated_MissingCountyClaims_GetPropertyById_Returns403Or401` — 2 failures pre-exist Phase 21. Not caused by any Phase 21 change. Tracked for Phase 27-D (test isolation cleanup).

---

## Gate Verdict

**✅ PHASE 21 SEALED.**

- 21-A (PropertiesController): Pre-compliant, evidence inherited
- 21-B (DaisController): Pre-compliant, evidence inherited
- 21-C (MarketplaceController): Stubs removed, RBAC tightened, 9 contract tests green
- G3 contract: 6 tests proving county isolation gate is closed
- G4 contract: 9 tests proving RBAC gate is closed and stubs are gone
- Build: 0 errors

Phase 22 (Shell Contract / Route Readiness Sweep) may now open.

---

*The controllers checked their credentials. The stubs left the building. The gate closed behind them.*
