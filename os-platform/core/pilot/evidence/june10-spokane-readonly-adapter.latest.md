# June 10 Spokane Read-Only Adapter Verification

Generated: 2026-05-22T17:55:29.398Z

## Summary

- County: Spokane
- Adapter ID: `spokane-readonly-scout-arcgis-schema-v1`
- Adapter status: verified
- Runtime claim allowed: false
- DB mutation allowed: false
- Production rows written: 0

## Parcel Identity

- Proven: true
- Source field: PID_NUM
- Semantics: Spokane SCOUT Queries Parcels layer exposes PID_NUM with alias Parcel Number in public ArcGIS REST schema metadata.

## Fetch Plan

| Step | Method | Read-only | URL | Purpose |
|---|---|---:|---|---|
spokane_scout_service_directory | GET | true | https://gismo.spokanecounty.org/arcgis/rest/services/SCOUT/Queries/MapServer | Fetch public ArcGIS REST service directory metadata only.
spokane_scout_layers_directory | GET | true | https://gismo.spokanecounty.org/arcgis/rest/services/SCOUT/Queries/MapServer/layers | Fetch public ArcGIS REST layer schema metadata only; no feature query.

## Staging Shape

- Schema: `terrafusion-staging-parcel-source-v1`
- Mode: contract_only_no_rows_loaded
- Parcel ID field: PID_NUM
- Owner field: owner_name
- Address fields: site_address, site_state, site_zip
- Value fields: not available
- Tax year field: tax_year
- Status field: seg_status

## Lineage Receipt

- Receipt version: june10-adapter-verification-v1
- Normalized artifact: `os-platform/core/pilot/evidence/june10-38-county-adapters/spokane/normalized/spokane-staging-source-contract.json`
- Normalized rows: 0
- Raw service_metadata: `os-platform/core/pilot/evidence/june10-38-county-adapters/spokane/raw/spokane-scout-service-metadata.json` (bedfa0dd4478a8ccfea0088dda4b4a0224b275a9c3cbf2578de59bc54cc10fd6)
- Raw parcel_layer_metadata: `os-platform/core/pilot/evidence/june10-38-county-adapters/spokane/raw/spokane-scout-parcel-layer-metadata.json` (d179ac66b8f6f7aaf61c81025d4efaa2bcb044342225091e81fb7190a3709673)

## Blockers

- None

## Warnings

- Public SCOUT Parcels schema did not expose an assessed value field in metadata.

## Rules

- This adapter verifies public Spokane SCOUT schema metadata and staging contract only.
- It does not call ArcGIS query endpoints, fetch feature rows, or perform bulk extraction.
- It writes no TerraFusion production DB rows.
- Runtime claims remain blocked until separate load, API, and UI proof exist.
