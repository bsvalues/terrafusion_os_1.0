# Runtime Row Path Proof

Generated: 2026-05-01T21:18:31.247Z
Runtime base URL: `http://localhost:5046`

| County | Candidate Reason | Inventory Rows | Endpoint | Status | Runtime Rows | Payload County | County Echo | Benton Fallback | CostForge Tier | CostForge Mode | Result | Blockers |
|---|---|---:|---|---:|---:|---|---|---|---|---|---|---|
Benton | costforge_cf1_or_higher | 276 | - | null | 0 | - | no | no | CF1_parcel_public_data | public_data_loaded | FAIL | No runtime endpoint identified.<br>Runtime endpoint did not return 200. Status: null<br>Runtime returned zero rows.<br>Runtime did not echo selected county.
Pacific | apparent_full_chain | 11 | - | null | 0 | - | no | no | CF0_no_runtime_data | not_available | FAIL | No runtime endpoint identified.<br>Runtime endpoint did not return 200. Status: null<br>Runtime returned zero rows.<br>Runtime did not echo selected county.
Franklin | scraper_api_candidate | 0 | - | null | 0 | - | no | no | CF0_no_runtime_data | not_available | FAIL | No runtime endpoint identified.<br>Runtime endpoint did not return 200. Status: null<br>Runtime returned zero rows.<br>Runtime did not echo selected county.
Walla Walla | scraper_only_candidate | 0 | - | null | 0 | - | no | no | CF0_no_runtime_data | not_available | FAIL | No runtime endpoint identified.<br>Runtime endpoint did not return 200. Status: null<br>Runtime returned zero rows.<br>Runtime did not echo selected county.

## Summary

- Candidates checked: 4
- Passed: 0
- Failed: 4
- Silent Benton fallbacks: 0
- Zero-row runtime responses: 4

## Scope Note

This proof does not repair endpoints, scrapers, databases, UI consumers, or CostForge logic. A failed result means the runtime row path is not proven for June 10 readiness.
