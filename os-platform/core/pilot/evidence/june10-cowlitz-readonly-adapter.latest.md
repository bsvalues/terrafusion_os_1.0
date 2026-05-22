# June 10 Cowlitz Read-Only Adapter Verification

Generated: 2026-05-22T16:54:07.225Z

## Summary

- County: Cowlitz
- Adapter ID: `cowlitz-readonly-arcgis-metadata-v1`
- Adapter status: verified
- Runtime claim allowed: false
- DB mutation allowed: false
- Production rows written: 0

## Parcel Identity

- Proven: true
- Source field: PARCNO
- Semantics: PARCNO is the public ArcGIS parcel layer search field and exists in the parcel layer metadata.

## Fetch Plan

| Step | Method | Read-only | URL | Purpose |
|---|---|---:|---|---|
cowlitz_app_item | GET | true | https://gis.cowlitzwa.gov/ccportal/sharing/rest/content/items/848eadafa8ba4566a6a6370a4294c5e2?f=json | Fetch public ArcGIS item metadata.
cowlitz_app_data | GET | true | https://gis.cowlitzwa.gov/ccportal/sharing/rest/content/items/848eadafa8ba4566a6a6370a4294c5e2/data?f=json | Fetch public ArcGIS Web AppBuilder configuration.
cowlitz_parcel_layer_metadata | GET | true | https://gis.cowlitzwa.gov/ccserver/rest/services/Assessor/Parcels/MapServer/0?f=json | Fetch parcel layer field metadata only; no feature query.

## Staging Shape

- Schema: `terrafusion-staging-parcel-source-v1`
- Mode: contract_only_no_rows_loaded
- Parcel ID field: PARCNO
- Owner field: DEED_HOLDER_NAME
- Address fields: SITUS_STREET_NUMBER, SITUS_STREET_DIRECTION, SITUS_STREET_NAME, SITUS_STREET_SUFFIX, SITUS_STREET_UNIT, SITUS_CITY, SITUS_ZIP_CODE
- Value fields: LAND_ASSESSED_VALUE, IMPR_ASSESSED_VALUE

## Lineage Receipt

- Receipt version: june10-adapter-verification-v1
- Normalized artifact: `os-platform/core/pilot/evidence/june10-38-county-adapters/cowlitz/normalized/cowlitz-staging-source-contract.json`
- Normalized rows: 0
- Raw app_item: `os-platform/core/pilot/evidence/june10-38-county-adapters/cowlitz/raw/cowlitz-arcgis-app-item.json` (6566fa3c3d8f0a4f11f249a0153bdeb26d5ff8eeddfcbccc41d3b2bf29abe9fa)
- Raw app_data: `os-platform/core/pilot/evidence/june10-38-county-adapters/cowlitz/raw/cowlitz-arcgis-app-data.json` (30fbda7a56f9612b5dd09ae1f0188e18b5992b066038ead7e5dff6e91ec4d326)
- Raw parcel_layer_metadata: `os-platform/core/pilot/evidence/june10-38-county-adapters/cowlitz/raw/cowlitz-parcel-layer-metadata.json` (b9cec32982b138aba70f0b4e1698a6d288865a729b57dd87467a79672c4692cb)

## Blockers

- None

## Warnings

- License text warns against en masse owner/tax parcel dissemination without data share agreement.

## Rules

- This adapter verifies source metadata and staging contract only.
- It does not query parcel features or perform bulk extraction.
- It writes no TerraFusion production DB rows.
- Runtime claims remain blocked until separate load, API, and UI proof exist.
