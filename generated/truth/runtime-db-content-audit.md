# Runtime TerraFusion DB Content Audit

Generated: 2026-05-02T15:50:15.064Z
Runtime base URL: `http://localhost:5046`

## Status

- Result: FAIL
- Endpoint status: 200
- Expected Benton parcel count: 89447
- Benton classification: configured_count_matches_neither_rows_nor_distinct_parcels
- Property rows match expected: no
- Distinct ParcelIds match expected: no
- Distinct ParcelNumbers match expected: no

## County Property Shape

| County | FIPS | Property Rows | Distinct ParcelIds | Distinct ParcelNumbers | Distinct PropertyIds | Duplicate ParcelId Groups | Duplicate ParcelNumber Groups | Max Rows Per ParcelId |
|---|---|---:|---:|---:|---:|---:|---:|---:|
Benton County | 53005 | 128788 | 128788 | 128788 | 128788 | 0 | 0 | 1

## Blockers

- Configured Benton parcel count 89447 matches neither runtime property rows 128788 nor distinct parcel ids 128788.
- Runtime Benton property rows 128788 do not match configured parcel count 89447.

## Warnings

- none

## Trust Rule

This audit reads TerraFusion DB runtime tables only. It does not inspect upstream source systems or bridge credentials.
