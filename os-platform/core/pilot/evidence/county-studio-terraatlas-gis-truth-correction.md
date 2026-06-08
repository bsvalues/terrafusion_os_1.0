# County Studio TerraAtlas GIS Truth Correction

Generated: 2026-06-08T00:06:00.000Z

Status: `PARTIAL_GIS_TRUTH`

## Corrected Posture

```text
parcelGeometryStatus=SYNC_DERIVED_PARCEL_GEOMETRY
fullGisLayerTruthStatus=GIS_LAYER_TRUTH_NOT_PROVEN
mapOverlayStatus=FALLBACK_MAP_OVERLAY
attributeOverlayStatus=UNPROVEN_ATTRIBUTE_OVERLAY
riskOverlayAnchoring=NOT_GIS_ANCHORED
productionProofAllowed=false
operationalProofAllowed=false
```

County Studio can read real TerraAtlas parcel geometry for Forge dev. That does not prove full TerraAtlas GIS layer truth.

## Proven

- `gis_tf.tf_parcel_geom` is readable.
- active parcel geometry count is 80,075.
- 79,105 active parcel geometries are crosswalked to `TfParcelId`.
- County Studio uses `GET /api/atlas-live/geometry/parcels`.
- The endpoint reads `gis_tf.tf_parcel_geom`.

## Not Proven

- full Atlas layer registry truth
- neighborhood layer geometry
- segment layer geometry
- reval area geometry
- taxing district geometry
- real outline layer source
- per-parcel valuation/GIS attributes in the map payload
- GIS-anchored risk overlay labels
- production GIS symbology or layer configuration

## Attribute Findings

`AtlasLiveGeometryController.cs` returns real parcel polygons but does not prove the map attributes:

| Attribute | Current posture |
| --- | --- |
| `outlines` | null |
| `assessedValue` | hardcoded/zero |
| `propertyClass` | null |
| `salePrice` | hardcoded/zero |
| `ratio` | null |
| `ratioDeviation` | null |
| `nbhdMedianRatio` | null |
| `neighborhoodCode` | query-scoped, not per-parcel sourced |

## Overlay Findings

- Risk overlay joins use `feature.properties.neighborhoodCode`, which is not trustworthy while `neighborhoodCode` is query-scoped.
- Visible red risk labels are absolutely positioned UI labels, not GIS-anchored geometry labels.
- Map overlays remain fallback or unproven for production GIS proof.

## Required Proof To Upgrade

To move beyond partial GIS truth, prove TerraAtlas-owned Benton neighborhoods, segments, reval areas, taxing districts, layer registry, outlines, per-parcel attributes, map overlays, and GIS-anchored risk labels by source table/view, join key, countyId, taxYear, and study context.

## Boundaries

- No UI changed.
- No GIS attributes invented.
- No Sync mutation.
- No DB seed mutation.
- Production proof remains blocked.
- Operational proof remains blocked.
