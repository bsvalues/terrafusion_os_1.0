# County Studio TerraAtlas Geometry Evidence

Generated: 2026-06-08T00:10:15.981Z
Status: TERRAATLAS_GIS_TRUTH_PARTIAL
Classification: PARTIAL_GIS_TRUTH
Parcel Geometry Status: SYNC_DERIVED_PARCEL_GEOMETRY
Full GIS Layer Truth Status: GIS_LAYER_TRUTH_NOT_PROVEN
Map Overlay Status: FALLBACK_MAP_OVERLAY
Attribute Overlay Status: UNPROVEN_ATTRIBUTE_OVERLAY
Risk Overlay Anchoring: NOT_GIS_ANCHORED

## Finding

County Studio uses real TerraAtlas sync-derived parcel geometry for Forge dev, but full GIS layer truth, GIS attributes, outlines, neighborhoods/segments/district layers, and risk overlay anchoring are not proven.

## Decisions

- realGeometryExists=true
- countyStudioUsesRealParcelGeometry=true
- countyStudioUsesRealTerraAtlasGeometry=false
- countyStudioUsesFullTerraAtlasGisLayerTruth=false
- fullGisLayerTruthProven=false
- riskOverlayGisAnchored=false
- atlasLayerAvailableNotWired=false
- geometryMisclassified=false
- productionProofAllowed=false
- operationalProofAllowed=false

## Geometry Counts

- parcelGeometry=80075
- canonicalParcel=3198979
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

Prove TerraAtlas-owned Benton neighborhoods, segments, reval areas, taxing districts, layer registry, outlines, per-parcel GIS attributes, and GIS-anchored overlays before full GIS or production proof.

## Boundaries

- This gate does not touch County Studio UI.
- This gate does not mutate TerraFusion Sync.
- This gate does not change DB seeding.
- This gate does not invent geometry.
- This gate does not weaken production or operational proof.
- This gate does not hide fallback if fallback is real.
