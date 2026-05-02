# Runtime Row Path Proof

Generated: 2026-05-01T23:48:04.309Z
Runtime base URL: `http://localhost:5046`

| County | Candidate Reason | Inventory Rows | Endpoint | Status | Runtime Rows | Payload County | County Echo | Benton Fallback | CostForge Tier | CostForge Mode | Result | Blockers |
|---|---|---:|---|---:|---:|---|---|---|---|---|---|---|
Benton | costforge_cf1_or_higher | 276 | `http://localhost:5046/api/counties/benton/parcels` | 200 | 50 | Benton County | yes | no | CF1_parcel_public_data | public_data_loaded | PASS | -
Pacific | apparent_full_chain | 11 | `http://localhost:5046/api/counties/pacific/parcels` | 404 | 0 | pacific | yes | no | CF0_no_runtime_data | not_available | FAIL | Runtime endpoint did not return 200. Status: 404<br>Runtime returned zero rows.
Franklin | scraper_api_candidate | 0 | `http://localhost:5046/api/counties/franklin/parcels` | 404 | 0 | franklin | yes | no | CF0_no_runtime_data | not_available | FAIL | Runtime endpoint did not return 200. Status: 404<br>Runtime returned zero rows.
Walla Walla | scraper_only_candidate | 0 | `http://localhost:5046/api/counties/walla-walla/parcels` | 404 | 0 | walla-walla | yes | no | CF0_no_runtime_data | not_available | FAIL | Runtime endpoint did not return 200. Status: 404<br>Runtime returned zero rows.

## Summary

- Candidates checked: 4
- Passed: 1
- Failed: 3
- Silent Benton fallbacks: 0
- Zero-row runtime responses: 3

## Scope Note

This proof does not repair endpoints, scrapers, databases, UI consumers, or CostForge logic. A failed result means the runtime row path is not proven for June 10 readiness.
