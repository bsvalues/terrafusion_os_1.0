# Runtime TerraFusion DB Identity

Generated: 2026-05-04T17:32:33.167Z
Runtime base URL: `http://localhost:5046`

## Status

- Result: FAIL
- Endpoint status: 200
- API base URL: http://localhost:5046
- Environment: Development
- Provider: Npgsql.EntityFrameworkCore.PostgreSQL
- Connection string name: DefaultConnection
- Server/host: configured-host-redacted
- Database: terrafusion
- Expected June 10 DB: terrafusion
- Expected runtime DB: yes
- Expected Benton parcel count: 89447
- Benton parcel count expected: no

## Config Expectation Sources

| Path | Key | Value | Matches Runtime Expectation |
|---|---|---:|---|
`backend/src/TerraFusion.API/appsettings.Development.json` | RuntimeTruth.ExpectedJune10Database | terrafusion | yes
`backend/src/TerraFusion.API/appsettings.Development.json` | BentonCounty.ParcelCount | 89447 | yes
`backend/src/TerraFusion.API/appsettings.BentonCounty.json` | County.PropertyCount | 89447 | yes

## Migration State

- Applied migrations: 82
- Pending migrations: 0
- Latest applied: 20260503153646_AddConversionEraToCanonicalTf

## Row Counts

- Counties: 1
- Properties: 128788
- ComparableSales: 259102
- CanonicalSaleQualifications: 0

## Blockers

- Runtime Properties count 128788 does not match configured Benton parcel count 89447.

## Warnings

- none

## Trust Rule

Runtime row counts are not trusted for June 10 readiness unless this proof passes. Product runtime must read TerraFusion DB through TerraFusion API; upstream source systems are outside this proof.
