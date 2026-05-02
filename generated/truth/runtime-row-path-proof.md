# Runtime Row Path Proof

Generated: 2026-05-02T15:33:05.710Z
Runtime base URL: `http://localhost:5046`

| County | Candidate Reason | Inventory Rows | Endpoint | Status | Runtime Rows | Payload County | County Echo | Benton Fallback | CostForge Tier | CostForge Mode | DB Identity Trusted | Result | Blockers |
|---|---|---:|---|---:|---:|---|---|---|---|---|---|---|---|
Benton | costforge_cf1_or_higher | 241 | `http://localhost:5046/api/counties/benton/parcels` | 200 | 50 | Benton County | yes | no | CF1_parcel_public_data | public_data_loaded | no | FAIL | Runtime DB identity proof is not trusted: Runtime Properties count 128788 does not match configured Benton parcel count 89447.

## Summary

- Candidates checked: 1
- Passed: 0
- Failed: 1
- Silent Benton fallbacks: 0
- Zero-row runtime responses: 0
- Runtime DB identity trusted: no
- Runtime DB: terrafusion
- Runtime provider: Npgsql.EntityFrameworkCore.PostgreSQL

## Runtime DB Identity Blockers

- Runtime Properties count 128788 does not match configured Benton parcel count 89447.

## Scope Note

This proof does not repair endpoints, scrapers, databases, UI consumers, or CostForge logic. A failed result means the runtime row path is not proven for June 10 readiness.
