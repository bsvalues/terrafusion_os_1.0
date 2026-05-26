# King Source Completeness Capture

Generated: 2026-05-26T16:17:18.195Z

## Verdict

- Requested source-only PINs: 1161
- Present in richer source artifact: 1161
- Loadable as runtime parcel shell: 1161
- Owner/address/value workflow complete: no
- Duplicate geometry rows: 0
- Placeholder review rows: 24
- Database writes attempted: no
- Production binding allowed: no
- Certification allowed: no

## Source

- URL: https://gisdata.kingcounty.gov/arcgis/rest/services/OpenDataPortal/property__parcel_area/MapServer/439
- Access: ArcGIS REST exact PIN query, returnGeometry=false, runtime shell fields only
- Fields captured: OBJECTID, PIN, MAJOR, MINOR, Shape_Length, Shape_Area
- Geometry captured: no
- Terms posture: public_arcgis_query_runtime_fields_only
- Placeholder polygons documented: yes
- Stacked geometry documented: yes
- PIN index unique: no

## Artifacts

- Raw artifact: os-platform/core/pilot/evidence/june10-king-source-completeness-capture/king-source-only-runtime-fields-raw.jsonl
- Raw SHA256: 9f72b9fa3bd633d8f383214f97011d4438cd48376c113f25c085a7b0473e6c6f
- Capture receipt: os-platform/core/pilot/evidence/june10-king-source-completeness-capture/king-source-completeness-capture-receipt.json

## Blockers

- King parcel_area source does not expose owner/address/value fields; parcel shell loadability does not prove full workflow completeness.
- 24 source-only PINs look like tract/placeholder identifiers and require explicit load policy.
