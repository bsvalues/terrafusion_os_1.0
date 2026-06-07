# County Studio Real Dev Port Preflight

Generated: 2026-06-07T20:01:31.982Z

Status: `REAL_DEV_PORT_PREFLIGHT_PASS`

## Required Ports

- governed pilot runtime: 4317 (TF_PILOT_PORT) — requiredForDev=true
- TerraFusion API runtime: 5046 (TF_API_PORT) — requiredForDev=true

## Occupied Ports

- None

## Reuse Existing Services

Supported by this command: false

pnpm run dev:county-studio:real-benton launches fresh governed pilot/API processes, so occupied required ports must be cleared or moved before this command can cleanly launch.

## Decisions

- portPreflightPassed=true
- productionProofAllowed=false
- operationalProofAllowed=false

## Boundaries

- This preflight does not touch County Studio UI.
- This preflight does not mutate TerraFusion Sync.
- This preflight does not change DB seeding.
- This preflight does not weaken gates.
- This preflight does not set productionProofAllowed=true.
- This preflight does not set operationalProofAllowed=true.
- This preflight does not hide DATA_TRUTH_FAIL.
