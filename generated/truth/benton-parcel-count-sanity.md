# Benton Parcel Count Sanity

Generated: 2026-05-04T17:38:58.077Z
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
- Source mirror PacsParcel rows: 128950
- Properties minus PacsParcel rows: -162

## Endpoint Behavior

- Endpoint: `/api/counties/benton/parcels`
- Status: 200
- Returned total: 128788
- Applies county filter: yes
- Applies active filter: no
- Applies current-year filter: no
- Collapses parcel versions: yes

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

## Field Completeness

- Missing property use code rows: 33955
- Missing situs city rows: 28968
- Zero market value rows: 36840
- Zero assessed value rows: 36840
- Zero land value rows: 52084
- Zero improvement value rows: 53349
- Missing year built rows: 33026
- Missing neighborhood rows: 41204

## Top Property Types

| Property Type | Rows |
|---|---:|
R | 96716
P | 23592
MH | 8476
Residential | 2
Agricultural | 1
Commercial | 1

## Top Property Use Codes

| Use Code | Rows |
|---|---:|
11 | 56312
null | 33948
18 | 12244
83 | 3759
14 | 2993
69 | 2353
81 | 1912
12 | 1812
63 | 1499
59 | 1455
91 | 1029
65 | 871
48 | 650
62 | 612
13 | 572
66 | 543
76 | 475
58 | 466
39 | 457
53 | 450

## Top Situs Cities

| Situs City | Rows |
|---|---:|
KENNEWICK | 43846
RICHLAND | 29299
null | 28968
WEST RICHLAND | 8428
PROSSER | 7951
BENTON CITY | 6327
BENTON COUNTY | 871
NONE | 729
Kennewick | 691
GRANDVIEW | 478
PLYMOUTH | 473
PATERSON | 446
Richland | 119
SUNNYSIDE | 89
FINLEY | 8
PASCO | 7
Benton City | 7
prosser | 5
UNDETERMINED | 5
TRI CITIES | 5
Paterson | 4
VARIOUS | 4
WHITCOMB | 4
Plymouth | 2
FINLEY      BENTON COUNTY | 2

## Temporal Range

- Earliest LastUpdated: 2026-04-18 04:09:37.339662+00
- Latest LastUpdated: 2026-04-28 05:27:22.93376+00
- Earliest CreatedAt: 2026-04-05 02:04:17.337997+00
- Latest CreatedAt: 2026-04-28 05:27:22.933785+00
- Earliest UpdatedAt: 2026-04-18 04:09:37.339806+00
- Latest UpdatedAt: 2026-04-28 05:27:22.933792+00

## Blockers

- Benton parcel endpoint does not apply active/current parcel filtering.
- Properties table has 128788 Benton rows with unknown active/inactive status.
- Distinct active Benton parcel count 0 is outside expected range 1-100000.
- Distinct current-year Benton parcel count 128784 is outside expected maximum 100000.

## Warnings

- Runtime DB currently contains only Benton county property rows.
- Properties rows are close to source mirror PacsParcel rows: 128788 Properties vs 128950 PacsParcel.

## Trust Rule

Raw TerraFusion DB property row count is not an active Benton parcel count unless county, status/currentness, tax year, and uniqueness are proven.
