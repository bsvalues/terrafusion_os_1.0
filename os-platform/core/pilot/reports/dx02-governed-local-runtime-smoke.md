# DX-02 Governed Local Runtime Smoke

## Scope
- Lane: `DX-02` only (no DX-01 replay)
- Baseline branch: `r1/integration`
- Baseline commit: `4eb1c56bcb92ef9dcad64cf35ca457289167b013` (PR #568 merge commit)
- Working branch: `copilot/dx02-governed-local-runtime-smoke`

## Runtime Smoke (Development)
- API startup context: `ASPNETCORE_ENVIRONMENT=Development`
- Dev auth token endpoint: `GET /api/auth/dev-token`

### Evidence
1. Dev token acquisition
- Status: `200`
- `countyId`: `19190019-1919-1919-1919-191919191919`
- `countyCode`: `benton`

2. Benton dossier route
- Request: `GET /api/dossier/BENTON-001`
- Status: `200`
- Correlation ID: `dossier-fb2c7e9e372b4f69b027579c0961bbc9`

3. Second real route
- Request: `GET /api/dossier/parcels/BENTON-001/evidence`
- Status: `200`
- Correlation ID: `dossier-f498aedf8f8a4bae8955550299b85c8e`
- `contentHash`: `a40cd4f3ad5fb1b7f1bda82b5afe2d173ea5e985540c076600dbb0d169d04b57`

4. Cross-county denial proof
- Data setup: `CLARK-001` exists in dev DB under county `19190019-1919-1919-1919-191919191920` (Clark)
- Request (Benton token): `GET /api/dossier/CLARK-001`
- Status: `404`
- Body: `{"error":"Parcel not found"}`
- Expected behavior: anti-enumeration denial for non-tenant parcel access

## Lane Gates
1. `pnpm run type-check`
- Result: PASS

2. `node --test os-platform/core/tests/phase83-tools.test.mjs`
- Result: PASS (`32/32`)

## Notes
- DX-01 was treated as closed; no DX-01 cherry-pick/replay was performed.
- Raw runtime artifacts were captured locally under `dx02_artifacts/` during execution (not part of PR diff).
