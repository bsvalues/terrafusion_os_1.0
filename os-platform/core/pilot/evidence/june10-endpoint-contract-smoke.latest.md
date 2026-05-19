# June 10 Endpoint Contract Smoke

Generated: 2026-05-19T20:13:00.057Z

API base URL: http://localhost:5046
Passed: false

## Summary

- Required probes: 4
- Runtime probes: 4
- Failed runtime probes: 4
- Contract mismatches: 4
- Blockers: 5

## Runtime Probes

| ID | Method | Path | Status | Shape OK | Evidence |
|---|---|---|---:|---:|---|
health | GET | /health | error | false | fetch failed
runtime_db_identity | GET | /api/runtime/truth/db-identity | error | false | fetch failed
benton_parcels | GET | /api/counties/benton/parcels?limit=5 | error | false | fetch failed
access_policy | GET | /api/auth/access-policy | error | false | fetch failed

## Contract Mismatches

- **health** /health: expected status 200, got fetch failed
- **runtime_db_identity** /api/runtime/truth/db-identity: expected status 200, got fetch failed
- **benton_parcels** /api/counties/benton/parcels?limit=5: expected status 200, got fetch failed
- **access_policy** /api/auth/access-policy: expected status 200, got fetch failed

## Blockers

- **runtime_probe**: GET /health did not return 200. (fetch failed)
- **runtime_probe**: GET /api/runtime/truth/db-identity did not return 200. (fetch failed)
- **runtime_probe**: GET /api/counties/benton/parcels?limit=5 did not return 200. (fetch failed)
- **runtime_probe**: GET /api/auth/access-policy did not return 200. (fetch failed)
- **contract_shape**: One or more endpoint responses do not match the June 10 launch-control contract. (4 mismatch(es))

## Interpretation

Endpoint contract smoke is not passing; production readiness cannot claim all endpoints match contracts.
