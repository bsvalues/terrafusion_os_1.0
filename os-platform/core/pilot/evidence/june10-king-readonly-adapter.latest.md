# June 10 King Read-Only Adapter Verification

Generated: 2026-05-22T19:11:26.825Z

## Summary

- County: King
- Adapter ID: `king-readonly-parcel-area-arcgis-schema-v1`
- Adapter status: verified
- Runtime claim allowed: false
- DB mutation allowed: false
- Production rows written: 0

## Parcel Identity

- Proven: true
- Source field: PIN
- Component fields: MAJOR, MINOR
- Semantics: King County parcel_area metadata states parcel numbers may include leading zeros in PIN, Major, or Minor and exposes PIN plus MAJOR/MINOR fields.

## Fetch Plan

| Step | Method | Read-only | URL | Purpose |
|---|---|---:|---|---|
king_parcel_area_service_metadata | GET | true | https://gisdata.kingcounty.gov/arcgis/rest/services/OpenDataPortal/property__parcel_area/MapServer | Fetch public King County OpenDataPortal parcel service metadata only.
king_parcel_area_layer_metadata | GET | true | https://gisdata.kingcounty.gov/arcgis/rest/services/OpenDataPortal/property__parcel_area/MapServer/439 | Fetch public King County parcel_area layer schema metadata only; no feature query.

## Staging Shape

- Schema: `terrafusion-staging-parcel-source-v1`
- Mode: contract_only_no_rows_loaded
- Parcel ID field: PIN
- Parcel ID component fields: MAJOR, MINOR
- Owner field: not available
- Address field: not available
- Value fields: not available

## Lineage Receipt

- Receipt version: june10-adapter-verification-v1
- Normalized artifact: `os-platform/core/pilot/evidence/june10-38-county-adapters/king/normalized/king-staging-source-contract.json`
- Normalized rows: 0
- Raw service_metadata: `os-platform/core/pilot/evidence/june10-38-county-adapters/king/raw/king-parcel-area-service-metadata.json` (32ce1268d88f663831dfe7cd89082ab834ec96b9ffcdad4e416a95e6862918b7)
- Raw parcel_layer_metadata: `os-platform/core/pilot/evidence/june10-38-county-adapters/king/raw/king-parcel-area-layer-metadata.json` (b770d977feeba416e2eecdf408601387b7e1ba0422e1e0d4610c4f0ba135d5ac)

## Blockers

- None

## Warnings

- Public King parcel_area schema did not expose owner fields in metadata.
- Public King parcel_area schema did not expose situs address fields in metadata.
- Public King parcel_area schema did not expose an assessed value field in metadata.
- King parcel_area metadata notes placeholder/stacked polygon geometry; parcel counts require later semantic filtering.
- King parcel_area metadata says boundaries are general location only and not for survey purposes.

## Rules

- This adapter verifies public King County parcel_area schema metadata and staging contract only.
- It does not call ArcGIS query endpoints, fetch feature rows, or perform bulk extraction.
- It writes no TerraFusion production DB rows.
- Runtime claims remain blocked until separate load, API, and UI proof exist.
