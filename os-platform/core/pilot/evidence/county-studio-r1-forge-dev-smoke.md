# County Studio R1 Forge Dev Smoke

Generated: 2026-06-07T17:01:28.435Z

Status: `FORGE_DEV_SMOKE_PORT_PREFLIGHT_PASS_DB_READINESS_BLOCKED`

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
C:\Users\bsval\AppData\Local\Temp\county-studio-port-conflict-resolution-smoke-20260607-095557.log
```

## Port Conflict Result

The prior occupied ports were identified and stopped:

- `4317` governed pilot runtime
  - pid: `50784`
  - command: `"C:\Program Files\nodejs\node.exe" os-platform/core/pilot/dev-pilot-runtime.mjs`
  - classification: `STALE_CONFLICTING_PROCESS`

- `5046` TerraFusion API runtime
  - pid: `42020`
  - command: `dotnet backend/src/TerraFusion.API/bin/Debug/net8.0/TerraFusion.API.dll --urls http://localhost:5046 --skip-dev-seeders`
  - classification: `STALE_CONFLICTING_PROCESS`

After resolution:

```text
REAL_DEV_PORT_PREFLIGHT_PASS
portPreflightPassed=true
occupiedPorts=[]
```

## Current Blocker

The command advanced past the port preflight, then stopped at DB readiness:

```text
REAL_DEV_SERVER_BLOCKED
canonical parcel counts: Canonical parcel count is missing.
canonicalParcel=0
```

The command did not reach:

```text
pnpm run proof:county-studio:real-dev-activation
cross-env ... pnpm run dev
```

So Vite, the governed pilot runtime, and the TerraFusion API runtime were not launched in this smoke.

## Interpretation

The local port conflict is resolved and no longer blocks the real Benton Forge dev command.

The next live blocker is DB readiness: canonical parcel count returned `0` during this smoke.

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
