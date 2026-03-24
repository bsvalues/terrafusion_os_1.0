# CP38 — Backend Auth & County-Seed Evidence

**Commit:** `d76b33977`
**Tag:** `cp38`
**Date:** 2026-03-23
**Result:** **1765 / 1765 backend tests passing**
**Status:** **0 failures**

---

## Backend Validation Evidence

### Cleared pre-existing failures

1. `Properties_GetById_MissingCountyClaim_Returns403`
   - Root cause: returned `BadRequest` instead of `Forbid`
   - Fix: `PropertiesController.TryResolveCountyId` — missing/unparseable `countyId` claim now returns `Forbid()` (HTTP 403), not `BadRequest(...)` (HTTP 400). A missing claim is an authorization failure, not a request validation failure.

2. `Authenticated_MissingCountyClaims_GetPropertyById_Returns403Or401`
   - Root cause: same authorization path issue
   - Fix: `PropertiesController` (same change as above — one call site covers both tests)

3. `Dais_AssessmentImpact_WithoutClaims_ReturnsForbid`
   - Root cause: `DaisController.RequireCountyAccessAsync` returned `Unauthorized(new { error = "..." })` (HTTP 401) when no county claim could be resolved
   - Fix: changed to `Forbid()` (HTTP 403) — semantically correct for an authenticated user missing a required claim

4. `Handler14_CertificationStatus_Benton`
   - Root cause: `GetCertificationStatus` calls `RequireCountyAccessAsync` which queries `_db.Counties` for the principal's `countyId`. Test DB was empty — county not seeded → `null` returned → `Forbid()`
   - Fix: `await SeedCounty(db, BentonCountyId)` added before controller invocation, matching the pattern used by all other county-isolated handler tests in the file

5. `Cert_AltStatus_ReturnsOk`
   - Root cause: same as above (`GetCertStatus` shares the same `RequireCountyAccessAsync` path)
   - Fix: `await SeedCounty(db, BentonCountyId)` added

---

## Scope

**Files changed (cp37 + cp38):**

| File | Change |
|------|--------|
| `src/TerraFusion.API/Controllers/PropertiesController.cs` | `BadRequest(...)` → `Forbid()` in `TryResolveCountyId` |
| `src/TerraFusion.API/Controllers/DaisController.cs` | `Unauthorized(...)` → `Forbid()` in `RequireCountyAccessAsync` |
| `tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx21DaisMarketplaceIsolationTests.cs` | G3-B test assertions updated 401 → 403; method names updated `Returns401` → `Returns403`; class header comment updated |
| `tests/TerraFusion.Unit.Tests/R2FullPlan/R2FullPlanHandlerAlignmentTests.cs` | Added `await SeedCounty(db, BentonCountyId)` to `Handler14_CertificationStatus_Benton` and `Cert_AltStatus_ReturnsOk` |

**No production behavior changed beyond the auth response code correction.**
The only semantic change is: missing county claim now consistently returns HTTP 403 instead of 400/401. This is correct — the caller is authenticated, the request is well-formed, but authorization is denied due to missing claim.

---

## Rollback

To revert to the state before cp37/cp38:

```
git revert d76b33977   # cp38 — county seed fix
git revert 4e6f94c5d   # cp37 — auth 400/401 → 403 fix
```

Or hard-reset to the cp36 tag:

```
git reset --hard cp36   # 9cb4881f4 — last known good before these changes
```

**Impacted controllers (rollback restores old behavior):**
- `PropertiesController.TryResolveCountyId` — reverts to `BadRequest`
- `DaisController.RequireCountyAccessAsync` — reverts to `Unauthorized(...)`

---

## Prior state

Before this work: **1760 / 1765** (5 pre-existing R14/R1Week5 failures, all county-auth related)
After this work: **1765 / 1765** (0 failures)
