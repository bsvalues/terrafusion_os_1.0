# County Studio R1 Forge Dev Smoke

Generated: 2026-06-07T18:22:05.299Z

Status: `FORGE_DEV_SMOKE_PREFLIGHT_CHAIN_READY_FULL_DEV_NOT_RERUN`

## Command

```bash
pnpm run dev:county-studio:real-benton
```

Working directory:

```text
C:\Users\bsval\.codex-worktrees\county-studio-r1-packet-payloads
```

## Current Preflight Chain

| Gate | Status | Passed |
| --- | --- | --- |
| Port preflight | `REAL_DEV_PORT_PREFLIGHT_PASS` | true |
| Backend health | `REAL_DEV_BACKEND_HEALTH_PASS` | true |
| Live DB readiness | `REAL_DEV_DATA_AVAILABLE` | true |
| Real-dev activation | `REAL_DEV_ACTIVATION_READY` | true |

Backend health:

```text
healthEndpoint=http://localhost:5000/health
backendLaunchCommand=pnpm run dev:backend:api
backendStartedByDevCommand=false
```

## Interpretation

The backend health bootstrap gate removes the vague backend-health failure from the real Benton dev command. The current preflight chain is ready.

The long-running `cross-env ... pnpm run dev` stage was not rerun in this backend health bootstrap slice, so this artifact does not claim `cleanFullDevSmokePassed=true`.

## Proof Posture

```text
forgeDevAllowed=true
productionProofAllowed=false
operationalProofAllowed=false
```

## Boundaries

- This smoke update did not touch County Studio UI.
- This smoke update did not mutate TerraFusion Sync.
- This smoke update did not change DB seeding.
- This smoke update did not weaken gates.
- This smoke update did not set `productionProofAllowed=true`.
- This smoke update did not set `operationalProofAllowed=true`.
- This smoke update did not hide `DATA_TRUTH_FAIL`.
