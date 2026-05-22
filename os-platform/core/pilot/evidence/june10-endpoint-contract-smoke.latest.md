# June 10 Endpoint Contract Smoke

Generated: 2026-05-22T00:51:59.796Z

API base URL: https://terrafusionmarket.com
Passed: true

## Summary

- Required probes: 4
- Runtime probes: 4
- Failed runtime probes: 0
- Contract mismatches: 0
- Blockers: 0

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
health | GET | /health | 200 | true | {"status":"Healthy","timestamp":"2026-05-22T00:51:59.0501892Z","environment":"Production","version":"1.0.0","service":"TerraFusion OS API - Basic Mode","gitSha":"unknown"}
runtime_db_identity | GET | /api/runtime/truth/db-identity | 200 | true | {"apiBaseUrl":"http://terrafusionmarket.com","environment":"Production","contentRootPath":"/app","provider":"Microsoft.EntityFrameworkCore.Sqlite","connectionStringName":"DefaultConnection","serverRedacted":"configured-host-redacted","datab
benton_parcels | GET | /api/counties/benton/parcels?limit=5 | 200 | true | {"county":"Benton","countyId":"19190019-1919-1919-1919-191919191919","rowType":"parcels","runtimeTable":"Properties","semantics":{"countyScoped":true,"activeOnly":false,"duplicateParcelVersionsCollapsed":true,"currentParcelVersion":false,"s
access_policy | GET | /api/auth/access-policy | 200 | true | {"signupMode":"provisioned_access_only","publicSignupEnabled":false,"message":"TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled."}

## Contract Mismatches

- None

## Blockers

- None

## Interpretation

Endpoint contract smoke passed for the required June 10 runtime API probes.
