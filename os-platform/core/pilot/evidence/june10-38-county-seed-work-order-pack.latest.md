# June 10 38-County Seed Work Order Pack

Generated: 2026-05-14T18:28:31.866Z

## Summary

- Work orders: 5
- Runtime claim allowed: false
- Source snapshot stage: 5
- Blocked: 0

## Doctrine

- TerraFusion DB is product runtime truth.
- Legacy/public source systems are acquisition inputs only.
- Product runtime claims require TerraFusion API proof over TerraFusion DB rows.
- No 38-county or 39-county runtime claim is allowed from source acquisition work orders.
- No official county-certified valuation claim is allowed from public-source seed data.

## Work Orders

| Work order | County | Stage | Receipt target | Next action |
|---|---|---|---|---|
`J10-SEED-DIRECT-SALES-SEARCH-YAKIMA` | Yakima | source_snapshot | `evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json` | capture_source_snapshot
`J10-SEED-MONTHLY-REPORT-PARCEL-HISTORY-DOUGLAS` | Douglas | source_snapshot | `evidence/june10-38-county-seed/douglas/source-snapshot-receipt.json` | capture_source_snapshot
`J10-SEED-MONTHLY-SALES-REPORT-KLICKITAT` | Klickitat | source_snapshot | `evidence/june10-38-county-seed/klickitat/source-snapshot-receipt.json` | capture_source_snapshot
`J10-SEED-PARCEL-TRANSFER-HISTORY-COWLITZ` | Cowlitz | source_snapshot | `evidence/june10-38-county-seed/cowlitz/source-snapshot-receipt.json` | capture_source_snapshot
`J10-SEED-PARCEL-TRANSFER-HISTORY-OPEN-DATA-EXPORT-KITSAP` | Kitsap | source_snapshot | `evidence/june10-38-county-seed/kitsap/source-snapshot-receipt.json` | capture_source_snapshot

## Required Receipt Fields

- `county`
- `countyToken`
- `state`
- `fips`
- `sourceSystem.url`
- `sourceSystem.systemName`
- `rawArtifacts[].path`
- `rawArtifacts[].sha256`
- `rawArtifacts[].capturedAtUtc`
- `noSecretValuesRecorded`
- `normalizedArtifacts[].schema`
- `normalizedArtifacts[].sha256`
- `target.terrafusionDbIdentity`
- `target.databaseRole`
- `target.schema`
- `target.tables[]`
- `counts.parcelRowsNormalized`
- `counts.parcelRowsLoaded`
- `counts.distinctParcelIdsLoaded`
- `workflowLabels`

## Stop Conditions

- Source content is sample, demo, or synthetic.
- Source identity cannot be tied to the named county.
- Raw artifact hash or capture timestamp is missing.
- Receipt would require storing a secret, cookie, bearer token, or password.
- Normalized schema is not TerraFusion-owned.
- TerraFusion DB target identity is missing before load claims.
- Loaded rows cannot be proven through TerraFusion API without fallback.
