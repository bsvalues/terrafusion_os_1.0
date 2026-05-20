# June 10 Endpoint Contract Smoke

Generated: 2026-05-20T01:44:16.712Z

API base URL: http://localhost:5046
Passed: true

## Summary

- Required probes: 4
- Runtime probes: 4
- Failed runtime probes: 0
- Contract mismatches: 0
- Blockers: 0

## Auth

- Development token attempted: true
- Development token acquired: true
- Development token status: 200
- Development token redacted: true

## Runtime Probes

| ID | Method | Path | Status | Shape OK | Evidence |
|---|---|---|---:|---:|---|
health | GET | /health | 200 | true | {"status":"Healthy","timestamp":"2026-05-20T01:44:16.3820171Z","environment":"Development","version":"1.0.0","service":"TerraFusion OS API - Basic Mode","gitSha":"unknown"}
runtime_db_identity | GET | /api/runtime/truth/db-identity | 200 | true | {"apiBaseUrl":"http://localhost:5046","environment":"Development","contentRootPath":"C:\\Users\\bsval\\.config\\superpowers\\worktrees\\terrafusion_os_1.0\\june10-production-readiness-audit-gate\\backend\\src\\TerraFusion.API\\bin\\Debug\\n
benton_parcels | GET | /api/counties/benton/parcels?limit=5 | 200 | true | {"county":"Benton County","countyId":"19190019-1919-1919-1919-191919191919","rowType":"parcels","runtimeTable":"canonical_tf.tf_parcel","semantics":{"countyScoped":true,"activeOnly":true,"duplicateParcelVersionsCollapsed":true,"currentParce
access_policy | GET | /api/auth/access-policy | 200 | true | {"signupMode":"provisioned_access_only","publicSignupEnabled":false,"message":"TerraFusion access is provisioned by an administrator. Public self-signup is disabled."}

## Contract Mismatches

- None

## Blockers

- None

## Interpretation

Endpoint contract smoke passed for the required June 10 runtime API probes.
