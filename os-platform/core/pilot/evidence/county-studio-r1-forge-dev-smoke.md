# County Studio R1 Forge Dev Smoke

Generated: 2026-06-07T17:34:36.042Z

Status: `FORGE_DEV_SMOKE_CANONICAL_READY_BACKEND_HEALTH_BLOCKED`

## Previous Command

```bash
pnpm run dev:county-studio:real-benton
```

Working directory:

```text
C:\Users\bsval\.codex-worktrees\county-studio-r1-packet-payloads
```

Previous smoke log:

```text
C:\Users\bsval\AppData\Local\Temp\county-studio-port-conflict-resolution-smoke-20260607-095557.log
```

## Current Preflight Chain

| Gate | Status | Passed |
| --- | --- | --- |
| Port preflight | `REAL_DEV_PORT_PREFLIGHT_PASS` | true |
| Live DB readiness | `REAL_DEV_SERVER_BLOCKED` | false |
| Real-dev activation | `NOT_REACHED_IN_CURRENT_PREFLIGHT_CHAIN` | false |

## Canonical Parcel Readiness

The previous canonical blocker is resolved:

```text
canonical_tf.tf_parcel=3,198,979
canonicalParcelBlocksForgeDev=false
forgeDevRequiresCanonicalParcel=false
productionProofRequiresCanonicalParcel=true
```

Canonical parcel remains production-proof relevant, but it is not the current Forge-dev blocker.

## Current Blocker

The latest live readiness refresh is blocked by backend health:

```text
backend health: Backend health is not proven.
localhost:5000 and localhost:5046 are not responding.
```

So this is not a clean full dev-server smoke and does not claim production or operational proof.

## Boundaries

- This smoke update did not touch County Studio UI.
- This smoke update did not mutate TerraFusion Sync.
- This smoke update did not change DB seeding.
- This smoke update did not weaken gates.
- This smoke update did not set `productionProofAllowed=true`.
- This smoke update did not set `operationalProofAllowed=true`.
- This smoke update did not hide `DATA_TRUTH_FAIL`.
