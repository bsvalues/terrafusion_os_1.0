# County Studio TerraAtlas Geometry Evidence

Generated: 2026-06-06T23:47:14.934Z
Status: TERRAATLAS_GEOMETRY_EVIDENCE_AVAILABLE_NOT_WIRED
Classification: ATLAS_LAYER_AVAILABLE_NOT_WIRED

## Finding

TerraAtlas parcel geometry is available but County Studio is still wired through the compatibility map feed.

## Decisions

- realGeometryExists=true
- countyStudioUsesRealTerraAtlasGeometry=false
- atlasLayerAvailableNotWired=true
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
- apiRoute: GET /launch-data/washington/counties/status.json + Atlas compatibility map routes
- backendServiceOrController: Atlas Live compatibility API
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

Wire County Studio embedded map context to TerraAtlas-owned geometry/layer service or prove the compatibility feed is backed by gis_tf.tf_parcel_geom with source-row lineage.

## Boundaries

- This gate does not touch County Studio UI.
- This gate does not mutate TerraFusion Sync.
- This gate does not change DB seeding.
- This gate does not invent geometry.
- This gate does not weaken production or operational proof.
- This gate does not hide fallback if fallback is real.
