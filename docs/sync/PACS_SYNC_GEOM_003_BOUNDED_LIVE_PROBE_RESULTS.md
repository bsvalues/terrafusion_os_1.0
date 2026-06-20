# WO-DATA-004C-GEOM-003 — Bounded Live Probe Results
**Status:** ACCEPTED  
**Date:** 2026-06-20  
**Operator:** Benton County Assessor  
**Branch merged:** `feat/geometry-drain-002` → main (`5b7de60f2`, PR #1053, 40/40 CI green)

---

## What Was Proven

| Gate | Requirement | Observed | Result |
|---|---|---|---|
| 1 | TopN=100 + FullCorpus=false not rejected (guard passes) | HTTP 200, drain completed in 22.5s | PASS |
| 2 | ArcGIS HTTP request contains `resultRecordCount=100` | Observed in actual HttpClient log (below) | PASS |
| 3 | ArcGIS HTTP request contains `orderByFields=OBJECTID+ASC` | Observed in actual HttpClient log (below) | PASS |
| 4 | Features landed ≤ 100 | 99 landed / 99 promoted / 99 canonicalized / 0 quarantine | PASS |
| 5 | CountyId mismatch guard returns HTTP 409 before ArcGIS fetch | HTTP 409 response; ArcGIS never called | PASS |
| — | Internal gates | 13/13 PASS, 0 failures | PASS |

---

## Drain Response (Gate 1)

```
POST /api/sync/doctrine/drain/geometry
Body: {"topN": 100, "fullCorpus": false}

HTTP 200
{
  "lane": "geometry",
  "status": "Succeeded",
  "batchIds": [
    "5647270a-cdab-4174-a65e-09d6f4838c10",
    "a648d548-db99-45ef-a6eb-dc4ba333cbab",
    "979774df-4ac4-477a-bed1-68e547519ff2"
  ],
  "counts": {
    "rowsLanded": 99,
    "rowsPromotedToTruth": 99,
    "rowsCanonicalized": 99,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 22.4873408,
  "gateSummary": { "totals": [{ "status": "PASS", "count": 13 }], "recentFailures": [] },
  "quarantineDelta": { "before": 588, "after": 588, "delta": 0 }
}
```

## Actual ArcGIS HTTP Request (Gates 2 + 3)

Observed in `System.Net.Http.HttpClient.ArcGisFeatureService` log:

```
GET https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0/query
  ?f=geojson
  &where=1%3D1
  &outFields=*
  &outSR=4326
  &returnGeometry=true
  &resultRecordCount=100
  &orderByFields=OBJECTID+ASC
```

`resultRecordCount=100` ✓ — upper bound enforced in URL  
`orderByFields=OBJECTID+ASC` ✓ — deterministic ordering enforced in URL

## Landing Detail (Gate 4)

```
ArcGIS parcel_geom landing COMPLETED
  considered=99  landed=99  duplicates=0  areaSum=62,233,575.12

ArcGIS parcel_geom truth promotion COMPLETED
  tuples=99  promoted=99  invalid=0  priorRemoved=0

ArcGIS canonical projection COMPLETED
  considered=99  projected=99  apnResolved=10  apnUnresolved=89  priorRemoved=0
```

ArcGIS returned 99 features for `resultRecordCount=100` — the cap is an upper bound.  
`duplicates=0` — no prior landing collision.

## CountyId Mismatch Guard (Gate 5)

Tested before probe GUID alignment. With mismatched county GUID:

```
HTTP 409
{
  "error": "Benton CountyId mismatch: ArcGIS config requires 19190019-1919-1919-1919-191919191919,
            but the existing county row has Id=4ec6e187-f053-4397-b87c-95d0ef9e99aa.
            Geometry drain refused before ArcGIS fetch.",
  "requiredCountyId": "19190019-1919-1919-1919-191919191919",
  "actualCountyId":   "4ec6e187-f053-4397-b87c-95d0ef9e99aa"
}
```

Guard fires and ArcGIS is never contacted when the county GUID mismatches.

---

## What Was NOT Done

- No full-corpus geometry run
- No 500 / 2,500 geometry scale
- No production geometry import
- No commit of local passwords or DB credentials
- No commit of `.probe-run/` directory (removed locally after evidence capture)
- `tf-geom-002` worktree had temporary local-only config edits (probe GUID alignment); those edits were reverted before cleanup

## Probe Setup Notes

- EXE run without `ASPNETCORE_ENVIRONMENT=Development` connects to production config placeholder (`${TF_DB_HOST}:5432/terrafusion_production`). Must set env var in parent shell before `Start-Process`.
- Probe required temporary alignment of `KnownBentonCountyId` in the worktree controller + appsettings to match the dev DB's existing Benton county GUID (dev DB had county pre-seeded with a different ID). Both files reverted after probe. Production code on main (`5b7de60f2`) retains canonical sentinel GUID `19190019-1919-1919-1919-191919191919`.

---

## Next Decision Required

**WO-DATA-004C-GEOM-004 — Geometry CountyId / Target Baseline Decision**

Must decide whether geometry uses:

- **Option A:** Fresh geometry-proof DB with canonical sentinel `CountyId = 19190019-1919-1919-1919-191919191919`
- **Option B:** Controlled migration/normalization path for existing DB CountyId
- **Option C:** Config strategy keyed by FIPS instead of GUID

Geometry is locked beyond the 100-feature proof until this decision is made.
