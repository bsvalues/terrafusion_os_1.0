# County Studio R1 Forge Dev Smoke

Generated: 2026-06-07T15:28:40.329Z

Status: `FORGE_DEV_SMOKE_BLOCKED_BY_REAL_DEV_READINESS`

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
C:\Users\bsval\AppData\Local\Temp\county-studio-r1-forge-dev-smoke-20260607-082434.log
```

## Result

The command was exercised, but the dev server did not start. The run stopped at the first preflight:

```text
pnpm run proof:county-studio:benton-real-dev-server-readiness:db
```

That preflight returned:

```text
REAL_DEV_SERVER_BLOCKED
realDevServerAllowed=false
productionProofAllowed=false
operationalProofAllowed=false
blockers=14
```

The `cross-env ... pnpm run dev` stage was not reached, so no Vite URL or bound port was emitted.

## Mode Flags

Configured by the run command:

- `TF_COUNTY_STUDIO_DEV_DATA_MODE=real-benton`
- `TF_COUNTY_STUDIO_PRODUCTION_PROOF=false`
- `TF_COUNTY_STUDIO_OPERATIONAL_PROOF=false`

Applied to dev server: `false`

Reason: the real-dev readiness DB preflight failed before the dev-server stage.

## Posture After Smoke

- forgeDevAllowed=false
- realDevActivationAllowed=true
- countyStudioMode=FORGE_DEV_BLOCKED
- dataTruthStatus=DATA_TRUTH_FAIL
- geometryStatus=SYNC_DERIVED_GEOMETRY
- riskObjectStatus=DEV_DERIVED_FROM_REAL_INPUTS
- ownerSupnumStatus=NOT_REQUIRED_FOR_FORGE_DEV
- productionProofAllowed=false
- operationalProofAllowed=false

## Readiness Blockers

- active drain process state: Drain process state is unknown.
- load_batch current stage: load_batch stage is UNKNOWN (UNKNOWN).
- landing table counts: Property landing rows are missing or unknown.
- truth table counts: Truth table counts are evaluated as partial until all expected Benton counts are reconciled.
- canonical parcel counts: Canonical parcel count is missing.
- owner truth count: Owner truth count is missing.
- account count: Account count is missing.
- supp association count: Supplement association count is missing.
- property landing count: Property landing count is missing.
- WPOV status: WPOV landing status is missing.
- WSDOR status: WSDOR truth status is missing.
- map data dependency status: Map dependency is classified UNKNOWN.
- ledger data dependency status: Ledger dependency is classified UNKNOWN.
- inspector data dependency status: Inspector dependency is classified UNKNOWN.

## Interpretation

The real Benton Forge dev run path was exercised and failed correctly before launching the dev server because the runtime DB evidence path no longer reports readable real-dev data.

This is not a County Studio UI failure.

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
