# WO-DATA-004C-GEOM-004 — Geometry CountyId / Target Baseline Decision
**Status:** DECISION MEMO — no execution approved  
**Date:** 2026-06-20  
**Operator:** Benton County Assessor  
**Prerequisite closed:** GEOM-003 (bounded live probe, `b728113`)

---

## Problem Statement

The geometry drain (`DoctrineDrainController.DrainGeometry`) uses a sentinel GUID constant:

```csharp
private static readonly Guid KnownBentonCountyId =
    Guid.Parse("19190019-1919-1919-1919-191919191919");
```

The ArcGIS config is keyed by that same GUID:

```json
"ArcGisFeatureServices": {
  "Counties": {
    "19190019-1919-1919-1919-191919191919": {
      "ParcelFeatureServiceUrl": "https://services7.arcgis.com/..."
    }
  }
}
```

`ResolveOrCreateBentonCountyAsync` looks up Benton by FipsCode `53005`, then by Name+State, then creates a new row using `KnownBentonCountyId`. On a **fresh DB**, this guarantees the GUID matches. On an **existing DB** (dev, scale, any prior-seeded DB), the county row already exists with a different GUID, the mismatch guard fires HTTP 409, and geometry drain is dead before ArcGIS is ever contacted.

**Confirmed in GEOM-003 probe:**
- Dev DB Benton GUID: `4ec6e187-f053-4397-b87c-95d0ef9e99aa`
- Sentinel GUID: `19190019-1919-1919-1919-191919191919`
- Result: HTTP 409 guard fires; ArcGIS never reached
- FK constraint on `Properties.CountyId` blocks direct `UPDATE Counties SET Id = ...` on any DB where Properties rows exist

---

## Option Analysis

### Option A — Fresh Geometry-Proof DB with Canonical Sentinel CountyId

**Mechanism:** Provision a new PostgreSQL database (e.g. `terrafusion_geom_proof`) with no prior county rows. Run EF migrations. On first geometry drain, `ResolveOrCreateBentonCountyAsync` falls through to creation and inserts Benton with `Id = 19190019-1919-1919-1919-191919191919`. ArcGIS config key matches. Drain proceeds.

**Pros:**
- Zero FK risk — no existing rows to conflict with
- Proves code path exactly as it will run in production (fresh tenant DB scenario)
- Completely isolated from existing dev/scale data
- Reversible — fresh DB can be dropped without consequence

**Cons:**
- Requires maintaining a separate DB for geometry proof work
- Loses any previously seeded parcel/sync data that other lanes depend on
- If future work needs cross-lane joins (parcel ↔ geometry), data must be re-drained

**Risk:** Low — fresh DB is the safest surface for geometry proof.

---

### Option B — Controlled Migration/Normalization of Existing DB CountyId

**Mechanism:** For an existing DB, tombstone the existing Benton county row and insert a new one with the sentinel GUID, then re-FK all referencing tables.

**Steps would involve:**
1. Set `Properties.CountyId = NULL` for all Benton rows (if nullable) or to a temp placeholder county
2. Delete existing Benton county row (`4ec6e187-...`)
3. Insert new Benton county row with `Id = 19190019-1919-1919-1919-191919191919`
4. Re-point all FK references back to sentinel GUID
5. Re-run geometry drain

**Pros:**
- Preserves existing sync/parcel data
- Single DB for all lanes

**Cons:**
- High operational risk — FK chain across Properties, PropertyAssessments, TaxLevies, CountyDeployments, and any other CountyId-referencing tables
- Any missed FK reference produces a silent data integrity gap
- Requires a migration script that is itself a test artifact (must be audited, not just thrown at the DB)
- Non-reversible without a full backup restore
- Not appropriate without a dedicated migration work order

**Risk:** HIGH. Do not attempt without a separate WO and explicit operator approval.

---

### Option C — Config Strategy Keyed by FIPS Instead of GUID

**Mechanism:** Refactor the ArcGIS config lookup and the mismatch guard to use a stable jurisdiction identity (FIPS code `53005` or state-county composite `WA-Benton`) rather than the county row GUID.

**Current lookup:**
```csharp
// Gets GUID from DB, then looks up ArcGIS config by that GUID
var url = arcGisConfig.Counties[KnownBentonCountyId].ParcelFeatureServiceUrl;
```

**FIPS-keyed alternative:**
```csharp
// Gets FIPS from DB county row, then looks up ArcGIS config by FIPS
var url = arcGisConfig.Counties["53005"].ParcelFeatureServiceUrl;
```

**Config structure change:**
```json
"ArcGisFeatureServices": {
  "Counties": {
    "53005": {
      "ParcelFeatureServiceUrl": "https://services7.arcgis.com/..."
    }
  }
}
```

The mismatch guard becomes: confirm that the county returned by `ResolveOrCreateBentonCountyAsync` has `FipsCode == "53005"` and that an ArcGIS config entry exists for that FIPS code. No GUID comparison required.

**Pros:**
- FIPS codes are stable, official, and not subject to DB seeding variability
- Works against any DB (fresh or existing) as long as the county row has `FipsCode = '53005'`
- Eliminates the sentinel GUID entirely — no more `19190019-...` magic constant in source
- Scales cleanly to multi-county: each county keyed by its own FIPS code
- County GUID can change (e.g. after re-seeding) without breaking geometry config

**Cons:**
- Requires a code change to `DoctrineDrainController` and `appsettings.*.json`
- Requires a new PR and CI gate
- Should not be done in the tf-geom-002 worktree (already merged); needs a new branch
- Small risk of FIPS code missing from county row (mitigated: `ResolveOrCreateBentonCountyAsync` already writes `FipsCode = "53005"` on creation)

**Risk:** Low code risk, medium workflow risk (new PR required). Correct long-term architecture.

---

### Option D — Defer Geometry Beyond TopN=100 Until Production Tenant Model Is Clearer

**Mechanism:** Accept GEOM-003 as sufficient proof. Freeze all geometry scale work. Revisit when production tenant provisioning model is defined and GEOM-004's CountyId strategy is decided in the context of that model.

**Pros:**
- Zero risk
- No additional proof work needed before production tenant decisions

**Cons:**
- Delays full Benton geometry landing
- Does not resolve the structural GUID-keyed config issue

**Risk:** None to data. Opportunity cost only.

---

## FK Mutation Risk — Key Constraint

On any DB where `Properties` rows exist referencing a given `CountyId`, that GUID **cannot be changed in-place** without a full FK chain migration. The GEOM-003 probe confirmed this:

```
ERROR: update or delete on table "Counties" violates foreign key constraint
"FK_Properties_Counties_CountyId" on table "Properties"
```

Tables confirmed or expected to reference `CountyId`:
- `Properties`
- `PropertyAssessments`
- `TaxLevies`
- `CountyDeployments`
- `GovernmentUsers`
- Any `canonical_tf.*` tables seeded with the county row's GUID

**Do not normalize existing CountyIds in-place without a dedicated migration strategy.**

---

## Recommended Proof Size (If/When Execution Resumes)

| Phase | TopN | FullCorpus | Gate required before running |
|---|---|---|---|
| Next bounded proof | 500 | false | GEOM-004 decision accepted + target DB confirmed |
| Scale proof | 2,500 | false | 500-probe gate passed, operator authorized |
| Full corpus | null | true | All prior probes passed, production tenant model defined, operator explicitly authorized |

---

## Decision Record

**Operator recommendation (2026-06-20):**

> Near-term: Option A — use a fresh geometry-proof DB seeded with canonical sentinel CountyId.  
> Long-term: Option C — move ArcGIS config lookup to FIPS-keyed strategy.  
> Do not normalize existing CountyIds in-place.

**Implication of A + C:**
1. Next proof uses a fresh DB (`terrafusion_geom_proof` or equivalent). No migration needed.
2. A follow-on PR (new branch, not tf-geom-002) refactors the ArcGIS config lookup from GUID-keyed to FIPS-keyed. Once that lands, Option A's fresh-DB requirement is lifted for subsequent proofs.

---

## What This Memo Does NOT Approve

- No geometry execution of any kind
- No ArcGIS call
- No DB mutation
- No PACS access
- No production geometry import
- No geometry scale beyond TopN=100 already proven

This memo is a planning artifact only. Execution resumes only when the operator explicitly authorizes the next work order against an agreed target baseline.
