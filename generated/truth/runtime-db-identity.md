# Runtime TerraFusion DB Identity

Generated: 2026-05-02T07:45:16.964Z
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
- Expected June 10 DB: -
- Expected runtime DB: no

## Migration State

- Applied migrations: 55
- Pending migrations: 0
- Latest applied: 20260501175030_AddSegmentInspectorDownstreamReceipts

## Row Counts

- Counties: 1
- Properties: 128788
- ComparableSales: 259102
- CanonicalSaleQualifications: 0

## Blockers

- Expected June 10 TerraFusion DB name is not configured. Set TF_EXPECTED_JUNE10_DB_NAME or RuntimeTruth:ExpectedJune10Database.

## Warnings

- none

## Trust Rule

Runtime row counts are not trusted for June 10 readiness unless this proof passes. Product runtime must read TerraFusion DB through TerraFusion API; upstream source systems are outside this proof.
