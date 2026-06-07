# County Studio R1 Forge Dev Smoke

Generated: 2026-06-07T16:25:22.844Z

Status: `FORGE_DEV_SMOKE_BLOCKED_BY_PORT_PREFLIGHT`

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
C:\Users\bsval\AppData\Local\Temp\county-studio-real-dev-port-preflight-smoke-20260607-092440.log
```

## Result

The command now fails fast at the port preflight:

```text
pnpm run proof:county-studio:real-dev-port-preflight
REAL_DEV_PORT_PREFLIGHT_BLOCKED
```

The command did not reach:

```text
pnpm run proof:county-studio:benton-real-dev-server-readiness:db
pnpm run proof:county-studio:real-dev-activation
cross-env ... pnpm run dev
```

So Vite, the governed pilot runtime, and the TerraFusion API runtime were not launched in this smoke.

## Occupied Ports

- governed pilot runtime: `4317` (`TF_PILOT_PORT`)
  - owner: `node` pid `50784`
  - path: `C:\Program Files\nodejs\node.exe`

- TerraFusion API runtime: `5046` (`TF_API_PORT`)
  - owner: `dotnet` pid `42020`
  - path: `C:\Program Files\dotnet\dotnet.exe`

## Interpretation

The real Benton Forge dev command no longer fails late with unclear bind errors. It now stops before runtime startup with exact occupied ports, owners, and remediation evidence.

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
