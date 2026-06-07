# County Studio Real Dev Backend Health

Generated: 2026-06-07T20:01:32.706Z

Status: `REAL_DEV_BACKEND_HEALTH_PASS`

## Decision

- backendHealthy=true
- backendStartedByDevCommand=false
- backendLaunchCommand=pnpm run dev:backend:api
- healthEndpoint=http://localhost:5000/health
- productionProofAllowed=false
- operationalProofAllowed=false

## Expected Backend Ports

- 5046
- 5000

## Health Checks

| Endpoint | OK | Status/Error |
| --- | --- | --- |
| http://localhost:5046/health | false | fetch failed |
| http://localhost:5046/api/health | false | fetch failed |
| http://localhost:5000/health | true | 200 |
| http://localhost:5000/api/health | false | 401 |

## Bootstrap

Backend API health is available for the real Benton dev readiness gate.

## Boundaries

- This backend health gate does not touch County Studio UI.
- This backend health gate does not mutate TerraFusion Sync.
- This backend health gate does not change DB seeding.
- This backend health gate does not weaken evidence gates.
- This backend health gate does not set productionProofAllowed=true.
- This backend health gate does not set operationalProofAllowed=true.
- This backend health gate does not hide DATA_TRUTH_FAIL.
