# June 10 Yakima Read-Only Adapter Verification

Generated: 2026-05-22T17:31:18.627Z

## Summary

- County: Yakima
- Adapter ID: `yakima-readonly-spatialest-config-v1`
- Adapter status: verified
- Runtime claim allowed: false
- DB mutation allowed: false
- Production rows written: 0

## Parcel Identity

- Proven: true
- Source field: parcel_number
- Semantics: Spatialest search config exposes Parcel # search and public result/schema fields expose parcel_number on the Yakima parcel layer.

## Fetch Plan

| Step | Method | Read-only | URL | Purpose |
|---|---|---:|---|---|
yakima_spatialest_page | GET | true | https://property.spatialest.com/wa/yakima | Fetch public Spatialest page HTML and extract data-props metadata only.

## Staging Shape

- Schema: `terrafusion-staging-parcel-source-v1`
- Mode: contract_only_no_rows_loaded
- Parcel ID field: parcel_number
- Owner field: owner_name
- Address field: line_1
- Value field: current_assessed_value
- Data timestamp: 05/22/2026
- Terms URL: https://www.schneidergis.com/legal-information/software-terms

## Lineage Receipt

- Receipt version: june10-adapter-verification-v1
- Normalized artifact: `os-platform/core/pilot/evidence/june10-38-county-adapters/yakima/normalized/yakima-staging-source-contract.json`
- Normalized rows: 0
- Raw page_metadata: `os-platform/core/pilot/evidence/june10-38-county-adapters/yakima/raw/yakima-spatialest-page-metadata.json` (f5ed04732cf20b497683ea6d7c47a87457437a8a8f0c5c3747524766a175e34f)
- Raw schema_metadata: `os-platform/core/pilot/evidence/june10-38-county-adapters/yakima/raw/yakima-spatialest-schema-metadata.json` (7abb48443eab5f7c30d95c9105e38f2a9891607cd3444119f832e2aaee606189)

## Blockers

- None

## Warnings

- Public config exposes Excel export permission, but this adapter does not download exports until terms are reviewed.

## Rules

- This adapter verifies public Spatialest metadata and staging contract only.
- It does not call search, property-card, export, image, or sales APIs.
- It writes no TerraFusion production DB rows.
- Runtime claims remain blocked until separate load, API, and UI proof exist.
