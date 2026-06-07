# County Studio R1 Forge Dev Smoke

Generated: 2026-06-07T15:57:14.591Z

Status: `FORGE_DEV_SMOKE_FRONTEND_STARTED_BACKEND_PORT_BLOCKED`

## Command Invoked

```bash
pnpm run dev:county-studio:real-benton
```

Working directory:

```text
C:\Users\bsval\.codex-worktrees\county-studio-r1-packet-payloads
```

Smoke log:

```text
C:\Users\bsval\AppData\Local\Temp\county-studio-r1-forge-dev-smoke-20260607-085321.log
```

## Result

The real Benton Forge dev command reached the live dev stage:

```text
pnpm run proof:county-studio:benton-real-dev-server-readiness:db
REAL_DEV_DATA_AVAILABLE

pnpm run proof:county-studio:real-dev-activation
REAL_DEV_ACTIVATION_READY

Vite emitted:
http://localhost:5174/
```

The full dev command still cannot be accepted as a clean launch because local runtime ports were already occupied:

```text
Governed pilot runtime: EADDRINUSE 127.0.0.1:4317
TerraFusion API runtime: failed to bind http://127.0.0.1:5046
```

So this smoke proves the readiness drift is reconciled, but it does not claim a clean full dev server startup.

## Mode Flags

Configured by the run command:

- `TF_COUNTY_STUDIO_DEV_DATA_MODE=real-benton`
- `TF_COUNTY_STUDIO_PRODUCTION_PROOF=false`
- `TF_COUNTY_STUDIO_OPERATIONAL_PROOF=false`

Applied to frontend stage: `true`

Applied to clean full dev server: `false`

Reason: the command reached the `cross-env ... pnpm run dev` stage and Vite started, but the governed pilot/API runtime exited on port conflicts.

## Posture After Smoke

- forgeDevAllowed=true
- realDevServerAllowed=true
- realDevActivationAllowed=true
- countyStudioMode=REAL_BENTON_FORGE_DEV
- dataTruthStatus=DATA_TRUTH_FAIL
- geometryStatus=SYNC_DERIVED_GEOMETRY
- riskObjectStatus=DEV_DERIVED_FROM_REAL_INPUTS
- ownerSupnumStatus=NOT_REQUIRED_FOR_FORGE_DEV
- productionProofAllowed=false
- operationalProofAllowed=false

## Startup Errors

- Governed pilot runtime: `EADDRINUSE 127.0.0.1:4317`
- TerraFusion API runtime: `Failed to bind to address http://127.0.0.1:5046`

## Interpretation

The prior readiness-blocked smoke evidence was stale after the live DB adapter was refreshed. Current live readiness and activation pass, so County Studio Forge dev mode is allowed again.

The smoke still does not prove a clean full dev launch because the local runtime had occupied pilot/API ports. This is runtime environment drift, not a County Studio UI failure.

This is not production proof.

This is not operational proof.

## Boundaries

- This smoke did not touch County Studio UI.
- This smoke did not mutate TerraFusion Sync.
- This smoke did not change DB seeding.
- This smoke did not weaken gates.
- This smoke did not set `productionProofAllowed=true`.
- This smoke did not set `operationalProofAllowed=true`.
- This smoke did not hide `DATA_TRUTH_FAIL`.
