# dev39 GPT county-claim fallback release smoke

- Target: dev39 only
- Production touched: no
- Database mutation: no
- Fake data introduced: no
- Release SHA: f9542230d88d-gpt-county-fallback-dev39
- Backend image: terrafusion-dev39-backend:gpt-county-fallback-f9542230d88d-20260531194756

## Root cause

GPT read endpoints used throwing GetCountyId() for authenticated tokens that may not carry CountyId, producing 500s instead of an honest unscoped/empty read state.

## Fix

- GET /api/gpt uses neutral county scope `0` when an authenticated token lacks CountyId, preserving system/public GPT visibility without inventing county data.
- GET /api/gpt/conversations returns an empty scoped conversation list when CountyId is unavailable.
- Write paths still require strict GetCountyId().

## Live smoke

- /health: 200, gitSha `f9542230d88d-gpt-county-fallback-dev39`
- /api/gpt: 200, body `[]`
- /api/gpt/conversations without valid auth: 401 protected. Local .tmp/dev39-operator-auth.env is currently rejected by /api/auth/login, so this protected route is code-regression covered and classified protected in the refreshed live matrix rather than live-auth-proven.

## Matrix refresh

- Matrix: j10-backend-endpoint-contract-matrix.wave10-gpt-county-fallback.json
- Triage: j10-endpoint-matrix-triage-wave10-gpt-county-fallback.latest.json
- Summary: live 113, broken 29, protected 853, mock 16, dead 13, unknown 257

## Posture

- Controlled Statewide Runtime Preview: READY_FOR_DEMO
- Full Application Capability: NOT_READY
- Production Readiness: NO_GO
- Full Statewide Certification: NO_GO

