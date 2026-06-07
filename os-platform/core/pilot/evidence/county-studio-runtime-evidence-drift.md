# County Studio Runtime Evidence Drift

Generated: 2026-06-07T15:57:14.591Z

Status: `RUNTIME_EVIDENCE_DRIFT_RECONCILED`

## Drift

The repo had two conflicting records:

```text
Prior consolidated evidence:
forgeDevAllowed=true

Prior live smoke:
REAL_DEV_SERVER_BLOCKED
realDevServerAllowed=false
runtime DB counts unknown/zero
```

That was not acceptable because a consolidated County Studio Forge-dev status must not pass on stale readiness evidence while the live real-dev preflight fails.

## Root Cause

Primary:

```text
The consolidated Forge dev status gate could report forgeDevAllowed=true from stored readiness evidence without forcing a live Benton DB readiness refresh.
```

Secondary:

```text
The live docker DB evidence path is slow enough that a short refresh window can leave readiness as unknown/blocked even when the DB is later readable.
```

Current runtime smoke blocker:

```text
Local port conflicts prevent a clean full dev launch:
- governed pilot runtime: 127.0.0.1:4317 already in use
- TerraFusion API runtime: http://127.0.0.1:5046 already in use
```

## Correction

The consolidated Forge-dev status now refreshes live Benton readiness by default before it reads readiness-dependent status.

```text
Default refresh command:
node os-platform/core/pilot/benton-real-dev-server-readiness.mjs --db-runtime docker

Default refresh timeout:
240000 ms
```

If live readiness fails or times out, stale readiness evidence cannot allow Forge dev.

## Current Live Status

```text
benton-real-dev-server-readiness:
REAL_DEV_DATA_AVAILABLE
realDevServerAllowed=true
blockers=0

county-studio-r1-forge-dev-status:
COUNTY_STUDIO_R1_FORGE_DEV_READY
forgeDevAllowed=true
liveReadinessRefresh.attempted=true
liveReadinessRefresh.exitCode=0

county-studio-r1-forge-dev-smoke:
FORGE_DEV_SMOKE_FRONTEND_STARTED_BACKEND_PORT_BLOCKED
frontend URL emitted: http://localhost:5174/
clean full dev launch: false
```

## Final Status

- countyStudioMode=REAL_BENTON_FORGE_DEV
- forgeDevAllowed=true
- realDevServerAllowed=true
- realDevActivationAllowed=true
- productionProofAllowed=false
- operationalProofAllowed=false
- cleanFullDevSmokePassed=false

## Rule

```text
No live DB readiness, no Forge dev ready claim.
```

## Boundaries

- No County Studio UI changed.
- No TerraFusion Sync behavior changed.
- No DB seeding changed.
- No proof gate weakened.
- `productionProofAllowed` remains false.
- `operationalProofAllowed` remains false.
