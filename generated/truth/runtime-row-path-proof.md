# Runtime Row Path Proof

Generated: 2026-05-04T16:51:13.646Z
Runtime base URL: `http://localhost:5046`

| County | Candidate Reason | Inventory Rows | Endpoint | Status | Runtime Rows | Payload County | County Echo | Benton Fallback | CostForge Tier | CostForge Mode | DB Identity Trusted | Result | Blockers |
|---|---|---:|---|---:|---:|---|---|---|---|---|---|---|---|
Benton | costforge_cf1_or_higher | 241 | - | null | 0 | - | no | no | CF1_parcel_public_data | public_data_loaded | no | FAIL | Runtime DB identity proof is not trusted: Runtime DB identity endpoint did not return 200. Status: null.; Runtime DB identity endpoint failed: fetch failed; Runtime DB identity endpoint did not return JSON payload.<br>No runtime endpoint identified.<br>Runtime endpoint did not return 200. Status: null<br>Runtime returned zero rows.<br>Runtime did not echo selected county.

## Summary

- Candidates checked: 1
- Passed: 0
- Failed: 1
- Silent Benton fallbacks: 0
- Zero-row runtime responses: 1
- Runtime DB identity trusted: no
- Runtime DB: -
- Runtime provider: -

## Runtime DB Identity Blockers

- Runtime DB identity endpoint did not return 200. Status: null.
- Runtime DB identity endpoint failed: fetch failed
- Runtime DB identity endpoint did not return JSON payload.

## Scope Note

This proof does not repair endpoints, scrapers, databases, UI consumers, or CostForge logic. A failed result means the runtime row path is not proven for June 10 readiness.
