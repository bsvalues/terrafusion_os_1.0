# County Studio R1 Forge Dev Smoke

Generated: 2026-06-07T18:52:57.9356526Z

Status: `FORGE_DEV_SMOKE_DB_READINESS_BLOCKED`

## Command

```bash
pnpm run dev:county-studio:real-benton
```

Working directory:

```text
C:\Users\bsval\.codex-worktrees\county-studio-r1-packet-payloads
```

Result:

```text
exitCode=1
observationWindowSeconds=50
cleanFullDevSmokePassed=false
```

## Current Preflight Chain

| Gate | Status | Passed |
| --- | --- | --- |
| Port preflight | `REAL_DEV_PORT_PREFLIGHT_PASS` | true |
| Backend health | `REAL_DEV_BACKEND_HEALTH_PASS` | true |
| Live DB readiness | `REAL_DEV_SERVER_BLOCKED` | false |
| Real-dev activation | `NOT_REACHED` | false |

Backend health:

```text
healthEndpoint=http://localhost:5000/health
backendLaunchCommand=pnpm run dev:backend:api
backendStartedByDevCommand=false
```

## Blocker

The full real Benton Forge dev smoke did not reach the long-running dev server stage. The command stopped at:

```bash
pnpm run proof:county-studio:benton-real-dev-server-readiness:db
```

The live DB readiness gate reported:

```text
status=REAL_DEV_SERVER_BLOCKED
realDevServerAllowed=false
```

Current blockers:

```text
active drain process state: Drain process state is unknown.
load_batch current stage: load_batch stage is exemption-fact-seal (FAILED).
```

Observed DB evidence at the blocked gate:

```text
propertyLanding=1,190,834
truthParcel=83,326
canonicalParcel=3,198,979
ownerSupnumBackfillRequiredForForgeDev=false
loadBatchId=7063c26e-c2f3-4dfe-ae7c-afce6a48f9d5
```

## Dev Server State

The command exited before:

```bash
cross-env TF_COUNTY_STUDIO_DEV_DATA_MODE=real-benton TF_COUNTY_STUDIO_PRODUCTION_PROOF=false TF_COUNTY_STUDIO_OPERATIONAL_PROOF=false pnpm run dev
```

Therefore:

```text
frontendStarted=false
frontendBoundUrls=[]
backendStarted=false
pilot4317Listening=false
api5046Listening=false
```

## Interpretation

Ports and backend health are no longer the active smoke blocker. The active blocker is live DB readiness: the readiness gate now refuses to allow the full dev server while the drain state is unknown and the current `load_batch` stage is failed.

## Proof Posture

```text
forgeDevAllowed=false
realDevServerAllowed=false
realDevActivationAllowed=false
productionProofAllowed=false
operationalProofAllowed=false
cleanFullDevSmokePassed=false
```

## Boundaries

- This smoke update did not touch County Studio UI.
- This smoke update did not mutate TerraFusion Sync.
- This smoke update did not change DB seeding.
- This smoke update did not weaken gates.
- This smoke update did not set `productionProofAllowed=true`.
- This smoke update did not set `operationalProofAllowed=true`.
- This smoke update did not hide `DATA_TRUTH_FAIL`.
