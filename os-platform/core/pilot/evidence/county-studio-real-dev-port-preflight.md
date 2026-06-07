# County Studio Real Dev Port Preflight

Generated: 2026-06-07T16:24:45.552Z

Status: `REAL_DEV_PORT_PREFLIGHT_BLOCKED`

## Required Ports

- governed pilot runtime: 4317 (TF_PILOT_PORT) — requiredForDev=true
- TerraFusion API runtime: 5046 (TF_API_PORT) — requiredForDev=true

## Occupied Ports

- governed pilot runtime: 4317 (TF_PILOT_PORT)
  - owner: node pid=50784
  - remediation: Stop the conflicting process using port 4317, or run the existing cleanup command if it owns this repo. Alternatively configure an unused TF_PILOT_PORT before launching if the service supports that port.
- TerraFusion API runtime: 5046 (TF_API_PORT)
  - owner: dotnet pid=42020
  - remediation: Stop the conflicting process using port 5046, or run the existing cleanup command if it owns this repo. Alternatively configure an unused TF_API_PORT before launching if the service supports that port.

## Reuse Existing Services

Supported by this command: false

pnpm run dev:county-studio:real-benton launches fresh governed pilot/API processes, so occupied required ports must be cleared or moved before this command can cleanly launch.

## Decisions

- portPreflightPassed=false
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
