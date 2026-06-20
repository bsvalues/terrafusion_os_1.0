# WO-DATA-004C-GEOM-005 — FIPS-Keyed ArcGIS Config Design
**Status:** DESIGN MEMO — no code changes approved yet  
**Date:** 2026-06-20  
**Operator:** Benton County Assessor  
**Prerequisite closed:** GEOM-004 decision memo (`6448a6fd9`)

---

## Problem: Current GUID-Keyed Config Failure Mode

The geometry drain (`DoctrineDrainController.DrainGeometry`) binds ArcGIS config lookup to the county's database primary key GUID:

```csharp
// Hardcoded sentinel that MUST match the DB county row's Id
private static readonly Guid KnownBentonCountyId =
    Guid.Parse("19190019-1919-1919-1919-191919191919");

// ArcGIS config keyed by that same GUID
var featureServiceUrl = arcGisConfig.Counties[KnownBentonCountyId].ParcelFeatureServiceUrl;
```

```json
"ArcGisFeatureServices": {
  "Counties": {
    "19190019-1919-1919-1919-191919191919": {
      "ParcelFeatureServiceUrl": "https://services7.arcgis.com/..."
    }
  }
}
```

**`ResolveOrCreateBentonCountyAsync` behavior:**

| DB state | Result |
|---|---|
| No Benton county row | Creates row with `Id = KnownBentonCountyId` → config lookup succeeds |
| Benton row exists (any prior seed) | Returns existing `Id` (e.g. `4ec6e187-...`) → GUID mismatch → HTTP 409, no ArcGIS call |

**Root cause:** `County.Id` is a volatile, seeding-dependent value. Any DB that was seeded before GEOM-002's sentinel was established will have the wrong GUID forever (FK constraints prevent reassignment). The config key is fixed in appsettings, creating an irreconcilable mismatch.

**Proven in GEOM-003 probe:** existing dev DB → HTTP 409 before ArcGIS. Workaround required probe-only edits to both controller and appsettings that were reverted immediately after.

---

## Proposed Fix: FIPS-Keyed Config

Replace the GUID binding with a stable jurisdiction identity. FIPS code `53005` (Benton County WA) is:
- Defined by the US Census Bureau
- Immutable across DB provisioning, seeding, or tenant migration
- Already stored on the county row (`FipsCode` column, written by `ResolveOrCreateBentonCountyAsync`)
- Naturally scoped to county without collisions (each county has exactly one FIPS code)

### New Config Shape

```json
"ArcGisFeatureServices": {
  "Counties": {
    "53005": {
      "ParcelFeatureServiceUrl": "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0",
      "ApnAttributeName": "geo_id",
      "ObjectIdAttributeName": "OBJECTID",
      "OutSpatialReferenceEpsg": 4326,
      "RequestTimeoutSeconds": 120
    }
  }
}
```

The key changes from the county GUID to the county FIPS code. All other shape is identical.

### New Controller Logic

```csharp
// Remove KnownBentonCountyId constant entirely.

// Resolve county (existing mechanism — unchanged)
var county = await ResolveOrCreateBentonCountyAsync(cancellationToken);

// Guard: FIPS must be set and must have an ArcGIS config entry
if (string.IsNullOrEmpty(county.FipsCode))
{
    return BadRequest(new { error = "County has no FipsCode — cannot resolve ArcGIS config." });
}

if (!arcGisConfig.Counties.TryGetValue(county.FipsCode, out var featureServiceConfig))
{
    return StatusCode(404, new {
        error = $"No ArcGIS config entry for FIPS={county.FipsCode}. Add an entry to ArcGisFeatureServices:Counties.",
        fipsCode = county.FipsCode
    });
}

var featureServiceUrl = featureServiceConfig.ParcelFeatureServiceUrl;
// proceed as before...
```

The mismatch guard (`if (bentonCountyId != KnownBentonCountyId) return StatusCode(409, ...)`) is **removed**. It is no longer needed — the county GUID is not consulted for config resolution.

---

## Lookup Order (New)

```
1. ResolveOrCreateBentonCountyAsync (unchanged)
   → finds county by FipsCode="53005" OR Name="Benton"+State="WA" OR creates with FipsCode="53005"
   
2. Confirm county.FipsCode is non-null
   → BadRequest(400) if null

3. arcGisConfig.Counties[county.FipsCode]
   → NotFound(404) if no entry for this FIPS

4. featureServiceConfig.ParcelFeatureServiceUrl, etc.
   → proceed to ArcGIS request with resultRecordCount + OBJECTID ASC
```

The county GUID (`County.Id`) is still used for FK relationships inside the drain (landing, truth promotion, canonical projection) — those do not change. Only the ArcGIS **config lookup** switches from GUID to FIPS.

---

## Benton County End-to-End Example

**Before (GUID-keyed, fragile):**
```
DB county: Id=4ec6e187-..., FipsCode=53005, Name=Benton, State=WA
Config key: 19190019-...
Result: 4ec6e187 ≠ 19190019 → HTTP 409
```

**After (FIPS-keyed, stable):**
```
DB county: Id=4ec6e187-..., FipsCode=53005, Name=Benton, State=WA
Config key: 53005
Lookup: config["53005"] → found
Result: proceeds to ArcGIS → resultRecordCount=N&orderByFields=OBJECTID+ASC
```

The county GUID no longer matters to ArcGIS config resolution.

---

## Migration / Backward Compatibility

This is a **breaking change** in appsettings structure. No dual-mode lookup is recommended (would add dead code complexity for a config pattern that no production environment yet depends on at scale).

**Required changes at deploy time:**

| File | Change |
|---|---|
| `appsettings.Development.json` | Rekey `ArcGisFeatureServices.Counties` from `19190019-...` to `53005` |
| `appsettings.json` (base) | Same if GUID key present |
| `appsettings.Production.json` | Same if GUID key present |
| `appsettings.BentonCounty.json` | Same if GUID key present |
| `appsettings.*.local.json` (gitignored) | Per-dev manual update |

Existing CI environments are dev-only — no deployed geometry config to migrate. Low migration cost.

---

## Tests Required

### New unit tests (additions)
| Test | Scenario | Expected |
|---|---|---|
| `DrainGeometry_FipsKeyedConfig_ResolvesArcGisUrl` | county has FipsCode=53005, config["53005"] exists | config resolved, ArcGIS fetch mocked |
| `DrainGeometry_MissingFipsInConfig_Returns404` | county has FipsCode=99999, no config entry for 99999 | HTTP 404 with fipsCode in body |
| `DrainGeometry_NullFipsCode_Returns400` | county row exists but FipsCode is null | HTTP 400 |
| `DrainGeometry_AnyCountyGuid_Passes` | county has arbitrary Id GUID, valid FipsCode | passes config lookup (proves GUID no longer matters) |

### Existing tests to update
| Test | Change |
|---|---|
| `DrainGeometry_MismatchedBentonCountyId_Returns409` | **Remove** — GUID mismatch guard no longer exists |
| Any test that mocks `KnownBentonCountyId` | Update to provide FipsCode + FIPS config entry instead |

Total test delta: +4 new, ~2 modified/removed. Net test count increases.

---

## Rollout Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Existing appsettings GUID key not updated at deploy | HIGH — drain returns 404 immediately | Checklist: update all appsettings files in the same PR |
| County row has null FipsCode | MEDIUM — drain returns 400 | `ResolveOrCreateBentonCountyAsync` always writes FipsCode on creation; risk is pre-existing rows missing it |
| Two counties sharing a FIPS code | LOW — FIPS codes are unique by definition | No mitigation needed |
| GEOM-003 evidence references GUID mismatch (HTTP 409) | NONE — evidence is historical; behavior intentionally changes | Note in PR description |
| Future county onboarding | LOW — new county = new FIPS entry in appsettings | Config-driven; no code change per county |

---

## Code Scope Estimate

| Layer | Files | Change size |
|---|---|---|
| Controller | `DoctrineDrainController.cs` | Remove 1 constant, replace 1 guard, replace 1 config lookup (~15 lines net) |
| Config | `appsettings.Development.json` | 1 key rename |
| Config | `appsettings.json` / `appsettings.Production.json` | 1 key rename each (if present) |
| Tests | `GeomSliceControlTests.cs` or `GeomSliceControlV2Tests.cs` | +4 new tests, ~2 modified |
| **Total** | ~4-5 files | Small PR, no EF migration, no DB schema change, no frontend change |

---

## Should This Precede TopN=500 Geometry Proof?

**Yes.** The reasoning:

1. TopN=500 on GUID-keyed config requires a fresh DB every time. That's a workaround, not a feature.
2. The FIPS refactor is a small, low-risk PR (~15 lines of controller logic, config key rename, 4 new tests).
3. After this lands, TopN=500 proof runs against any DB (fresh or existing) without probe-only config patches.
4. Multi-county expansion (39 WA counties) is config-only after this: add a FIPS entry per county, no code change.
5. The mismatch guard becoming a 404 (missing config) vs 409 (GUID mismatch) is semantically correct — the problem is config, not identity.

**Recommended sequence:**
```
GEOM-005  FIPS-keyed config PR (this work order)
GEOM-006  TopN=500 geometry proof (against any DB, fresh or existing)
GEOM-007  TopN=2500 geometry proof (if GEOM-006 passes)
GEOM-008  Full-corpus decision (after all prior gates + production tenant model defined)
```

---

## What This Memo Does NOT Approve

- No code changes in this memo
- No geometry execution
- No ArcGIS call
- No DB mutation
- Code changes require a new branch + PR + CI gate + operator authorization

Implementation begins only when the operator authorizes the GEOM-005 code PR.
