# Runtime Row Path Proof

Generated: 2026-05-02T01:05:14.505Z
Runtime base URL: `http://localhost:5046`

| County | Candidate Reason | Inventory Rows | Endpoint | Status | Runtime Rows | Payload County | County Echo | Benton Fallback | CostForge Tier | CostForge Mode | Result | Blockers |
|---|---|---:|---|---:|---:|---|---|---|---|---|---|---|
Benton | costforge_cf1_or_higher | 241 | `http://localhost:5046/api/counties/benton/parcels` | 200 | 50 | Benton County | yes | no | CF1_parcel_public_data | public_data_loaded | PASS | -

## Summary

- Candidates checked: 1
- Passed: 1
- Failed: 0
- Silent Benton fallbacks: 0
- Zero-row runtime responses: 0

## Scope Note

This proof does not repair endpoints, scrapers, databases, UI consumers, or CostForge logic. A failed result means the runtime row path is not proven for June 10 readiness.
