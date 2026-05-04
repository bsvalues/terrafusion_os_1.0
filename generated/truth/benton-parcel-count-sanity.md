# Benton Parcel Count Sanity

Generated: 2026-05-04T16:48:27.235Z
Runtime base URL: `http://localhost:5046`

## Status

- Result: FAIL
- Total Properties rows: 128788
- Benton rows by CountyId: 128788
- Distinct Benton parcel numbers: 128788
- Distinct active Benton parcel numbers: 0
- Distinct current-year Benton parcel numbers: 128784
- Current tax year: 2026
- Expected active parcel range: 1-100000

## Endpoint Behavior

- Endpoint: `/api/counties/benton/parcels`
- Status: unreachable
- Returned total: 0
- Applies county filter: no
- Applies active filter: no
- Applies current-year filter: no
- Collapses parcel versions: no

## Tax Years

| Tax Year | Rows | Distinct Parcels |
|---|---:|---:|
2025 | 4 | 4
2026 | 128784 | 128784

## Counties

| CountyId | County | Rows |
|---|---|---:|
19190019-1919-1919-1919-191919191919 | Benton County | 128788

## Status Rows

| Status | Rows |
|---|---:|
unknown | 128788

## Blockers

- Benton parcel endpoint did not echo Benton county identity.
- Benton parcel endpoint does not prove county filtering.
- Benton parcel endpoint does not apply active/current parcel filtering.
- Benton parcel endpoint does not collapse duplicate parcel versions.
- Properties table has 128788 Benton rows with unknown active/inactive status.
- Distinct active Benton parcel count 0 is outside expected range 1-100000.
- Distinct current-year Benton parcel count 128784 is outside expected maximum 100000.

## Warnings

- Runtime DB currently contains only Benton county property rows.

## Trust Rule

Raw TerraFusion DB property row count is not an active Benton parcel count unless county, status/currentness, tax year, and uniqueness are proven.
