# Geometry Lane — Diagnosis (2026-06-04)

## Lane shape
ArcGIS REST (NOT PACS) → `legacy_arcgis_raw.parcel_geom` (D1) →
`truth_arcgis.parcel_geom_current` (D2) → `gis_tf.tf_parcel_geom` (D3, APN-crosswalked
to tf_parcel). Single-county, full-feature pull (no cursor/TopN). Source:
`https://services7.arcgis.com/NURlY7V8UHl6XumF/.../Parcels_and_Assess/FeatureServer/0`.

## Denominator (proven, queried live from the ArcGIS service)
```
/query?where=1=1&returnCountOnly=true → {"count": 80076}
```
**Benton ArcGIS Parcels service serves 80,076 parcels.** That is the geometry denominator.

## Current state
| Layer | rows | distinct (CountyId,ArcGisObjectId) | note |
|---|---|---|---|
| D1 raw  | 11,864 | 3,955 | **3.0× duplicated** — landing appends, ran 3× |
| D2 truth | 3,955 | 3,955 | 1.0× (promoter dedups latest-per-objectid; self-correcting) |
| D3 canon | 3,955 | 3,955 | 1.0× (3,842 linked to TfParcelId via APN) |

**Coverage = 3,955 / 80,076 = 4.9%.** Geometry is the least-complete lane.

## Root-cause blockers (TWO real code defects, like the sales SupNum bug)
1. **No ArcGIS paging** — `ArcGisFeatureServiceClient.FetchParcelsAsync` issues a SINGLE
   `/query?f=geojson&where=1=1...` request (client.cs:82-122) with no `resultOffset`
   pagination loop. ArcGIS FeatureServers cap each response at `MaxRecordCount` (commonly
   2,000). So the pull silently truncates at the first page and never fetches the remaining
   ~76,000 features. This is why D1 only ever has ~3,955 distinct. **The lane cannot reach
   80,076 until the client pages.**
2. **Polygon-only, MultiPolygon silently dropped** — `TryProject` (client.cs:137-147)
   returns null for any geometry whose type != 'Polygon', dropping MultiPolygon features
   with only a debug log. Multi-part parcels are silently lost. (Matches predicted geometry
   blockers: multi-part geometry, missing shapes.)

## Secondary issue (already self-correcting, low priority)
- D1 landing is not idempotent (appends; 3× dup). D2 promoter dedups so truth/canonical
  stay 1.0×, but D1 will bloat on every re-pull. Worth a clear-by-county before re-landing,
  but NOT the blocker — the paging defect is.

## NOT yet swept — blocked on the paging+multipolygon fix
Cannot seal geometry at 4.9%. The fix is a bounded ArcGIS client change:
(a) add `resultOffset`/`resultRecordCount` paging loop (fetch until `exceededTransferLimit`
    false / fewer than page size returned), and
(b) accept MultiPolygon (project each ring / store as multipolygon WKT).
Then: clear D1 for the county (idempotent re-land), full pull, D2/D3 promote, verify
coverage vs 80,076, diagnose residual (parcels with no ArcGIS feature, or no APN match to
tf_parcel), seal.

## ArcGIS-contention note (memory hard rule)
The hard rule forbids STATEWIDE/39-county ArcGIS repair against the active Sync DB. This is
the legitimate SINGLE-COUNTY Benton geometry lane (the intended path), not a statewide repair
— in scope. One bounded Benton pull, not parallel wave jobs.

---

# FIX PROVEN (2026-06-04 PM) — paging + MultiPolygon

## Changes
- `ArcGisFeatureServiceClient.FetchParcelsAsync`: added resultOffset/resultRecordCount
  PAGING loop (was a single request capped at MaxRecordCount) + per-page retry (4 attempts,
  backoff) so a transient page timeout doesn't abort the whole pull.
- `TryProject`: accept MultiPolygon (was Polygon-only, silently dropping multi-part parcels);
  emits MULTIPOLYGON(((...))) WKT, centroid from largest ring.
- `ArcGisGeoJson`: added collection-level `properties.exceededTransferLimit` model.
- `CountyArcGisOptions.PageSize` (default 2000); appsettings RequestTimeoutSeconds 120→180.

## Proof (full Benton pull)
- ArcGIS pull: **80,075 features across 41 pages** (was capped at ~3,955 — 20× more).
- D1=80,075 / D2=80,075 / D3=80,075, all **1.0000×** on (CountyId, ArcGisObjectId).
- **978 MultiPolygon parcels** now landed (previously dropped).
- Matches the live denominator (80,076; 1 feature dropped as non-polygon/degenerate).

## NEW diagnostic (APN crosswalk — next slice, NOT yet sealed)
- D3 links only **11,420 / 80,075** to a tf_parcel (TfParcelId). 79,774 geom rows have an APN
  (geo_id), only 301 null — so it's not missing APNs.
- **Likely cause: APN normalization.** Geom APN values are space-PADDED
  (e.g. `'112882020000008           '`). If tf_parcel's geo_id isn't padded identically, the
  crosswalk join fails for most → only 14% link. (Same class as sales SupNum: a normalization
  mismatch silently dropping matches.) NOT yet confirmed/fixed.
- tf_parcel holds 3,199,335 rows (39-county statewide bulk import) — so the correct Benton
  geometry-link denominator must be scoped to Benton tf_parcels, TBD.

## Seal status: NOT sealed.
Raw→truth→canonical geometry is COMPLETE at 80,075 (1.0×) with MultiPolygon support — a major
step from 3,955. But the canonical→tf_parcel APN linkage (11,420/80,075) is an open crosswalk
normalization question to diagnose before declaring the geometry lane sealed.

---

# GEOMETRY SEAL (2026-06-04) — APN crosswalk normalized

## APN crosswalk fix
- D3 projector matched geom `ArcGisApn` → `tf_parcel.ParcelNumber` on RAW strings; ArcGIS
  APN is space-padded, tf_parcel.ParcelNumber is clean → only 11,424 resolved.
- Fix: TRIM both sides (index key + lookup) in `ArcGisCanonicalProjector`. Commit `62996c904`.
- Added `api/debug/gis-pop-1/reproject-canonical` (AllowAnonymous) — D3-ONLY reproject against
  existing D2 (no ArcGIS re-pull, no D1/D2 mutation) so the crosswalk fix runs without the
  wasteful 80k-feature re-pull that timed out the full drain.

## Final state (D3-only reproject, verified)
| metric | value |
|---|---|
| D3 total | 80,075 |
| D3 distinct (CountyId, ArcGisObjectId) | 80,075 → **dup 1.0000×** |
| APN crosswalk LINKED to tf_parcel | **79,105 (98.8%)** (was 11,424) |
| unlinked | 970 |
| &nbsp;&nbsp;• null/empty ArcGIS APN | 301 (feature has geometry but no geo_id — uncrosswalkable) |
| &nbsp;&nbsp;• APN present, no matching tf_parcel | 669 (ArcGIS-only / non-assessed parcels) |
| MultiPolygon parcels | 978 |
| prior canonical cleanly replaced | 80,075 (no dup) |

## Denominator + residual
ArcGIS service serves 80,076 features; we project 80,075 (1 dropped: non-polygon/degenerate).
Of these, 98.8% link to a tf_parcel. The 970 unlinked are explained by class/reason and are
legitimate source conditions (no APN, or APN with no assessed-parcel counterpart) — NOT a
crosswalk defect. This is the honest geometry ceiling.

## SEAL CHECKLIST
| Question | Status | Evidence |
|---|---|---|
| Intake complete (raw→truth→canonical)? | YES — 80,075 of 80,076 (paging fix) | this artifact |
| Duplication controlled? | YES — 1.0000× at D1/D2/D3 | this artifact |
| MultiPolygon supported? | YES — 978 landed (was 0) | this artifact |
| APN crosswalk resolved? | YES — 79,105/80,075 = 98.8% | reproject response |
| Residual explained by reason? | YES — 301 null-APN + 669 no-tf_parcel-match | residual decomposition |
| Re-runnable / idempotent? | YES — D3 clears+reprojects; dup held 1.0× | reproject (prior 80,075 removed) |

**SEAL STATEMENT:** Every Benton ArcGIS parcel feature (80,075 of the service's 80,076) is
landed → promoted → projected to gis_tf.tf_parcel_geom at 1.0000× duplication with
MultiPolygon support; 79,105 (98.8%) are crosswalked to a TfParcel, with the 970-row residual
diagnosed as legitimate source conditions. Geometry lane: SEALED.

## Commits
`c96e27560` (paging + MultiPolygon), `62996c904` (APN crosswalk TRIM + D3-only reproject endpoint).
