# County Studio TerraAtlas Geometry Evidence

Generated: 2026-06-07T02:29:37.085Z
Status: TERRAATLAS_GEOMETRY_EVIDENCE_REAL_DEV_WIRED
Classification: SYNC_DERIVED_GEOMETRY

## Finding

County Studio geometry/map context is wired to a real TerraAtlas sync-derived geometry path for real dev; production GIS proof remains blocked pending canonical reconciliation.

## Decisions

- realGeometryExists=true
- countyStudioUsesRealTerraAtlasGeometry=true
- atlasLayerAvailableNotWired=false
- geometryMisclassified=false
- productionProofAllowed=false
- operationalProofAllowed=false

## Geometry Counts

- parcelGeometry=80075
- canonicalParcel=3199335
- geometryInventoryObservedCount=80075
- mapInventoryObservedCount=80075

## Active County Studio Geometry Path

- frontendFile: frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts
- countyStudioConsumer: frontend/apps/os-shell/src/pages/forge/county-studio/components/EmbeddedAtlasGisWorkspace.tsx
- hook: frontend/apps/os-shell/src/pages/forge/atlas-live/hooks/useAtlasMapData.ts
- apiRoute: fetchTerraAtlasParcelGeometryMapData -> GET /api/atlas-live/geometry/parcels
- backendServiceOrController: AtlasLiveGeometryController reads gis_tf.tf_parcel_geom as the County Studio bulk map feed
- dbTableOrView: gis_tf.tf_parcel_geom
- joinKey: countyId + parcelId/APN + layerId

## Candidate Tables / Views

| Candidate | Exists | Count |
| --- | --- | --- |
| gis_tf.tf_parcel_geom | true | 80075 |
| canonical_tf.tf_parcel | true | unknown |
| truth_arcgis parcel geometry | true | unknown |
| GeoForge compatibility tiles | true | unknown |

## Required Proof To Upgrade

Prove TerraAtlas-owned Benton parcel geometry, neighborhoods, segments, reval areas, taxing districts, layer registry, and map overlays by countyId/taxYear/studyId before production proof.

## Boundaries

- This gate does not touch County Studio UI.
- This gate does not mutate TerraFusion Sync.
- This gate does not change DB seeding.
- This gate does not invent geometry.
- This gate does not weaken production or operational proof.
- This gate does not hide fallback if fallback is real.
