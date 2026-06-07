# County Studio R1 Forge Dev Smoke

Generated: 2026-06-07T19:46:58.1016756Z

Status: `FORGE_DEV_SMOKE_PASS`

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
cleanFullDevSmokePassed=true
observationWindowSeconds=141
stableSecondsObserved=75
requiredStableSeconds=60
```

## Preflight Chain

| Gate | Status | Passed |
| --- | --- | --- |
| Port preflight | `REAL_DEV_PORT_PREFLIGHT_PASS` | true |
| Backend health | `REAL_DEV_BACKEND_HEALTH_PASS` | true |
| Live DB readiness | `REAL_DEV_DATA_AVAILABLE` | true |
| Real-dev activation | `REAL_DEV_ACTIVATION_READY` | true |

## Runtime

```text
Vite URL: http://localhost:5174/
frontendListening=true
pilot4317Listening=true
api5046Listening=true
apiStartupOrReuse=started-local-5046
```

Backend health:

```text
http://localhost:5000/health = 200
http://localhost:5046/health = 200
```

DB readiness:

```text
loadBatchStage=exemption-fact-seal
loadBatchStatus=COMPLETED
exemptionFactRequiredForForgeDev=false
exemptionFactRequiredForProductionProof=true
exemptionFactRequiredForOperationalProof=true
```

Mode flags:

```text
TF_COUNTY_STUDIO_DEV_DATA_MODE=real-benton
TF_COUNTY_STUDIO_PRODUCTION_PROOF=false
TF_COUNTY_STUDIO_OPERATIONAL_PROOF=false
```

## Cleanup

The smoke-owned process tree was stopped after capture.

```text
port4317StillListening=false
port5046StillListening=false
```

## Startup Warnings

- Redis not configured - using NoOp cache.
- Port 5173 was already in use, so Vite selected 5174.
- Modules directory not found.
- UI directory not found.
- Harris PACS sync skipped for Benton because `pacscontract.v1` is read-only.
- System health degraded warning appeared in backend logs.

No startup error signal was observed by the smoke harness.

## Proof Posture

```text
forgeDevAllowed=true
realDevServerAllowed=true
realDevActivationAllowed=true
productionProofAllowed=false
operationalProofAllowed=false
cleanFullDevSmokePassed=true
```

## Boundaries

- This smoke update did not touch County Studio UI.
- This smoke update did not mutate TerraFusion Sync.
- This smoke update did not change DB seeding.
- This smoke update did not weaken gates.
- This smoke update did not set `productionProofAllowed=true`.
- This smoke update did not set `operationalProofAllowed=true`.
- This smoke update did not hide `DATA_TRUTH_FAIL`.
