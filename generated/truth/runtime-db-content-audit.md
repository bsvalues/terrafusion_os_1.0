# Runtime TerraFusion DB Content Audit

Generated: 2026-05-04T16:48:22.681Z
Runtime base URL: `http://localhost:5046`

## Status

- Result: FAIL
- Endpoint status: unreachable
- Expected Benton parcel count: -
- Benton classification: -
- Property rows match expected: no
- Distinct ParcelIds match expected: no
- Distinct ParcelNumbers match expected: no

## County Property Shape

| County | FIPS | Property Rows | Distinct ParcelIds | Distinct ParcelNumbers | Distinct PropertyIds | Duplicate ParcelId Groups | Duplicate ParcelNumber Groups | Max Rows Per ParcelId |
|---|---|---:|---:|---:|---:|---:|---:|---:|

## Blockers

- Runtime DB content endpoint did not return 200. Status: null.
- Runtime DB content endpoint failed: fetch failed
- Runtime DB content endpoint did not return JSON payload.

## Warnings

- none

## Trust Rule

This audit reads TerraFusion DB runtime tables only. It does not inspect upstream source systems or bridge credentials.
