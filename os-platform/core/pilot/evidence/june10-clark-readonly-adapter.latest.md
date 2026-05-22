# June 10 Clark Read-Only Adapter Verification

Generated: 2026-05-22T18:38:44.872Z

## Summary

- County: Clark
- Adapter ID: `clark-readonly-propertyfinder-arcgis-schema-v1`
- Adapter status: verified
- Runtime claim allowed: false
- DB mutation allowed: false
- Production rows written: 0

## Parcel Identity

- Proven: true
- Source field: Prop_id
- Semantics: Clark MapsOnline PropertyFinder Taxlots layer exposes Prop_id as the Property ID display field in public ArcGIS REST metadata.

## Fetch Plan

| Step | Method | Read-only | URL | Purpose |
|---|---|---:|---|---|
clark_property_finder_service_metadata | GET | true | https://gis.clark.wa.gov/arcgisfed2/rest/services/MapsOnline/PropertyFinder/MapServer | Fetch public ArcGIS REST PropertyFinder service metadata only.
clark_taxlots_layer_metadata | GET | true | https://gis.clark.wa.gov/arcgisfed2/rest/services/MapsOnline/PropertyFinder/MapServer/1 | Fetch public ArcGIS REST Taxlots layer schema metadata only; no feature query.

## Staging Shape

- Schema: `terrafusion-staging-parcel-source-v1`
- Mode: contract_only_no_rows_loaded
- Parcel ID field: Prop_id
- Owner field: Owner
- Address field: SitusAddrsFull
- Value fields: not available
- Mailing address fields: MailAddrs1, MailAddrs2, MailAddrs3
- School district field: SchoolDistrict

## Lineage Receipt

- Receipt version: june10-adapter-verification-v1
- Normalized artifact: `os-platform/core/pilot/evidence/june10-38-county-adapters/clark/normalized/clark-staging-source-contract.json`
- Normalized rows: 0
- Raw service_metadata: `os-platform/core/pilot/evidence/june10-38-county-adapters/clark/raw/clark-propertyfinder-service-metadata.json` (082878793a17ee4cd3c447a2eaf91789c916244e693e34f1ec9d2c4ae1fe1136)
- Raw taxlots_layer_metadata: `os-platform/core/pilot/evidence/june10-38-county-adapters/clark/raw/clark-taxlots-layer-metadata.json` (fba80c0495e5abaeee55776d7e8d1a7438ec0c2a67d4aa763402c6cd8b625df7)

## Blockers

- None

## Warnings

- Public Clark PropertyFinder Taxlots schema did not expose an assessed value field in metadata.
- Clark Taxlots layer description says the layer is under development and may change without notice.

## Rules

- This adapter verifies public Clark MapsOnline PropertyFinder schema metadata and staging contract only.
- It does not call ArcGIS query endpoints, fetch feature rows, or perform bulk extraction.
- It writes no TerraFusion production DB rows.
- Runtime claims remain blocked until separate load, API, and UI proof exist.
