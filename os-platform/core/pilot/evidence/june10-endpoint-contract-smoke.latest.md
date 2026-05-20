# June 10 Endpoint Contract Smoke

Generated: 2026-05-20T21:05:39.501Z

API base URL: https://terrafusionmarket.com
Passed: false

## Summary

- Required probes: 4
- Runtime probes: 4
- Failed runtime probes: 1
- Contract mismatches: 1
- Blockers: 2

## Auth

- Development token attempted: true
- Development token acquired: false
- Development token status: 401
- Development token redacted: false
- Provisioned login attempted: true
- Provisioned login configured: true
- Provisioned login acquired: true
- Provisioned login status: 200
- Provisioned login token redacted: true
- Provisioned login credentials redacted: true

## Runtime Probes

| ID | Method | Path | Status | Shape OK | Evidence |
|---|---|---|---:|---:|---|
health | GET | /health | 200 | true | {"status":"Healthy","timestamp":"2026-05-20T21:05:38.1506219Z","environment":"Production","version":"1.0.0","service":"TerraFusion OS API - Basic Mode","gitSha":"b8b7a2adaf16af42971b3af6534a8bfedd162891"}
runtime_db_identity | GET | /api/runtime/truth/db-identity | 200 | true | {"apiBaseUrl":"http://terrafusionmarket.com","environment":"Production","contentRootPath":"/app","provider":"Microsoft.EntityFrameworkCore.Sqlite","connectionStringName":"DefaultConnection","serverRedacted":"configured-host-redacted","datab
benton_parcels | GET | /api/counties/benton/parcels?limit=5 | 500 | false | {"error":"Internal server error","correlationId":"tf-cc792cdb9e1a4e8283bd4e6cd211d175","message":"An unexpected error occurred. Reference the correlationId when reporting."}
access_policy | GET | /api/auth/access-policy | 200 | true | {"signupMode":"provisioned_access_only","publicSignupEnabled":false,"accessRequestUrl":"mailto:support@terrafusionmarket.com?subject=TerraFusion%20OS%20Provisioned%20Access%20Request","supportEmail":"support@terrafusionmarket.com","message"

## Contract Mismatches

- **benton_parcels** /api/counties/benton/parcels?limit=5: expected status 200, got 500

## Blockers

- **runtime_probe**: GET /api/counties/benton/parcels?limit=5 did not return 200. (status=500)
- **contract_shape**: One or more endpoint responses do not match the June 10 launch-control contract. (1 mismatch(es))

## Interpretation

Endpoint contract smoke is not passing; production readiness cannot claim all endpoints match contracts.
