# WO-DATA-004B-FIX8 — Controlled Geometry Drain Results

**Work Order:** WO-DATA-004B-FIX8
**Date:** 2026-06-18
**Worktree:** `C:\Users\bsval\tf-fix4-owner` (API runtime) / `C:\Users\bsval\tf-docs-fix3` (docs commit)
**Branch:** `docs/wo-data-004b-fix2a-pacs-copy-evidence` (evidence branch)
**Status:** BLOCKED — two hard blockers found in preflight; drain NOT run

---

## Mission

Run one tightly bounded controlled geometry pipeline drain after parcel, owner-wsdor,
improvement, land, and sales lanes are complete.

---

## Drain NOT Run

Per work order rules: "no code changes unless a hard blocker appears and you stop first."
Two hard blockers were found during preflight. The drain endpoint was NOT called.

---

## Preflight — Two Hard Blockers

### Blocker 1 — County ID Mismatch (Configuration Gap)

The ArcGIS feature service config in `appsettings.Development.json` maps county by Guid key:

```json
"ArcGisFeatureServices": {
  "Counties": {
    "19190019-1919-1919-1919-191919191919": {
      "ParcelFeatureServiceUrl": "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0",
      "ApnAttributeName": "geo_id",
      "ObjectIdAttributeName": "OBJECTID"
    }
  }
}
```

The Benton County record in `terrafusion_dev_clean` has:

```
Id:       4ec6e187-f053-4397-b87c-95d0ef9e99aa
Name:     Benton
FipsCode: 53005
```

`ArcGisFeatureServiceOptions.GetForCounty()` performs a case-insensitive Guid-string match.
`4ec6e187-f053-4397-b87c-95d0ef9e99aa` does NOT match `19190019-1919-1919-1919-191919191919`.

**Result:** `ArcGisRawLandingService.LandParcelGeomsAsync` would throw immediately:
```
ArcGisFeatureServiceConfigurationException: No ArcGIS feature-service configuration bound
for county 4ec6e187-f053-4397-b87c-95d0ef9e99aa.
```

The drain would fail at Stage D1 before writing a single row.

**Required fix:** Add a county mapping keyed by the actual Benton county Guid
(`4ec6e187-f053-4397-b87c-95d0ef9e99aa`) to `appsettings.Development.local.json` or the
committed appsettings. This is a config change requiring operator approval.

---

### Blocker 2 — No TopN Support; Full Import

The `DrainGeometry` controller method explicitly states (line 1518 comment):

```
/// FullCorpus/TopN are not used — the ArcGIS service pulls the full county feature set.
```

The `ArcGisRawLandingService.LandParcelGeomsAsync` calls:

```csharp
var features = await _client.FetchParcelsAsync(countyId, cancellationToken);
```

No pagination limit, no TopN, no `where` filter on row count. The client fetches all
features from the ArcGIS REST endpoint.

**ArcGIS service confirmed reachable:** `https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0`

**Feature count:** `{"count": 80175}` — **80,175 Benton County parcel geometries**.

The drain would unconditionally import all 80,175 features regardless of `TopN=100` in the
payload. This violates the "no full import" constraint from the work order.

**Required operator decision:**
- Accept full geometry import (80,175 features) as the geometry lane design
- OR defer geometry to a separate full-corpus approval

---

## ArcGIS Source — Confirmed Accessible

| Field | Value |
|---|---|
| URL | `https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0` |
| Service Name | ParcelsAndAssess |
| Feature Count | 80,175 |
| maxRecordCount | 2,000 (per page) |
| Reachable | ✅ Yes |
| Auth Required | No (public service) |

---

## Pre-Drain Counts (captured; drain NOT run)

| Table | Count | Status |
|---|---|---|
| `legacy_arcgis_raw.parcel_geom` | 0 | Clean |
| `truth_arcgis.parcel_geom_current` | 0 | Clean |
| `gis_tf.tf_parcel_geom` | 0 | Clean |
| `canonical_tf.tf_parcel` | 160 | From FIX3 + FIX7B parcel stubs |
| `canonical_tf.tf_sale` | 61 | FIX7B |
| `canonical_tf.tf_land` | 137 | FIX6 |
| `canonical_tf.tf_improvement` | 104 | FIX5 |
| `canonical_tf.tf_owner` | 84 | FIX4 |
| `legacy_tf_unproven.unresolved_imprv_attr` | 588 | FIX5 quarantine (unchanged) |
| `sync_bridge.load_batch` | 49 | FIX3–FIX7B |
| `sync_bridge.source_xref` | 645 | FIX3–FIX7B |
| `sync_bridge.promotion_gate_result` | 201 | FIX3–FIX7B |

All non-geometry canonical tables unchanged from FIX7B post-drain state. ✅

---

## API Runtime — Confirmed Healthy

API running from `C:\Users\bsval\tf-fix4-owner` Release binary on port 5046.
`TF_SKIP_DEV_SEEDERS=true` — dev seeders suppressed.
Health endpoint: `{"status":"Healthy","environment":"Development"}` ✅

---

## Geometry Endpoint — Found

`POST /api/sync/doctrine/drain/geometry` (line 1520 of `DoctrineDrainController.cs`)

Three-stage pipeline:
- Stage D1: `IArcGisRawLandingService.LandParcelGeomsAsync` → `legacy_arcgis_raw.parcel_geom`
- Stage D2: `IArcGisTruthPromotionService.PromoteCountyAsync` → `truth_arcgis.parcel_geom_current`
- Stage D3: `IArcGisCanonicalProjector.ProjectCountyAsync` → `gis_tf.tf_parcel_geom`

APN crosswalk resolves against `tf_parcel` rows at projection time. Independent of PACS lanes.

---

## Operator Decisions Required

Two decisions before FIX8 can proceed:

### Decision 1 — County Config Fix

Add to `appsettings.Development.local.json`:

```json
"ArcGisFeatureServices": {
  "Counties": {
    "4ec6e187-f053-4397-b87c-95d0ef9e99aa": {
      "ParcelFeatureServiceUrl": "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0",
      "ApnAttributeName": "geo_id",
      "ObjectIdAttributeName": "OBJECTID"
    }
  }
}
```

This is a config-only change (no code change). Requires operator approval.

### Decision 2 — Full Import Approval

The geometry lane has no TopN. A full drain imports all 80,175 ArcGIS features. Operator
must explicitly approve this before the drain runs. This is not a controlled 100-row slice.

---

## Sync State

| Lane | Status |
|---|---|
| parcel | DONE (FIX3: 100/100/100, 17 PASS) |
| owner-wsdor | DONE (FIX4: 199/199/283, 49 PASS) |
| improvement | DONE with quarantine (FIX5: 1004/104/416, 52 PASS / 1 FAIL-known / 588 quarantine) |
| land | DONE (FIX6: 137/137/137, 34 PASS, 0 quarantine) |
| sales | DONE (FIX7B: 100/61/61, 30 PASS / 1 WARN, 0 quarantine) |
| geometry | **BLOCKED — see Operator Decisions Required above** |

---

## Source Integrity

| Check | Status |
|---|---|
| Drain NOT called | ✅ |
| `tf_mssql_data` volume: untouched | ✅ |
| `pacs_oltp_verify`: untouched | ✅ |
| `terrafusion_dev_clean`: no changes this step | ✅ |
| No manual SQL mutation | ✅ |
| No fake dev seeders | ✅ |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **BLOCKED** |
| DB_TARGET | `terrafusion_dev_clean` — PostgreSQL PG16 Docker, port 5432 |
| GEOMETRY_SOURCE | ArcGIS REST — `services7.arcgis.com` — 80,175 features |
| ENDPOINT | `POST /api/sync/doctrine/drain/geometry` (found, NOT called) |
| TOPN | Not supported — drain pulls full county set |
| ROWS_LANDED | 0 (drain not run) |
| ROWS_PROMOTED | 0 |
| ROWS_CANONICALIZED | 0 |
| QUARANTINE_STATUS | 588 FIX5 carry-forward; 0 this step |
| GATE_STATUS | N/A — drain not run |
| NON_GEOMETRY_LANES | All unchanged (confirmed via pre-drain counts) |
| ERRORS | County ID mismatch + no TopN support |
| PR_OR_LOCAL_ARTIFACT | Local branch `docs/wo-data-004b-fix2a-pacs-copy-evidence`, this file |
| NEXT_WORK_ORDER | WO-DATA-004B-FIX8A — Geometry Config Fix + Full-Import Approval (requires operator decision) OR WO-DATA-004B-FINAL — skip geometry and produce slice summary |
