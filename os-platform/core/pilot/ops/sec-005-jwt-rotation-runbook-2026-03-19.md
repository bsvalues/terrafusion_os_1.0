# SEC-005 JWT Rotation Runbook

Date: 2026-03-19
Status: READY
Scope: Authoritative execution packet for closing `SEC-005-ROTATE` without reopening sealed Phase 20-25 proof

## Mission

Close the remaining hard blocker in the post-go-live checklist by rotating the live JWT signing secret on the authoritative Hostinger runtime path, proving the new signing key is active, and publishing a sanitized evidence bundle.

This runbook does not contain secrets and must not record secret values.

## Canonical Truth

- Current blocker source: `os-platform/core/pilot/ops/post-go-live-phase-execution-checklist.md`
- External infrastructure truth source: `os-platform/core/pilot/ops/hostinger-control-plane.md`
- Authoritative release lane: `.github/workflows/release-lane.yml`
- Authoritative runtime bundle description: `os-platform/core/pilot/ops/canonical-release-lane-truth-table.md`

## Authoritative Rotation Boundary

The live Benton operator surface is the Hostinger snapshot runtime. For this lane, the signing secret is authoritative only when all of the following are true:

1. The replacement secret is stored in the approved secret authority.
2. The active Hostinger runtime receives that secret through `APP_ROOT/app.env`.
3. The running backend resolves the signing key through `JwtSettings:SecretKey`.
4. Post-rotation auth issuance and validation succeed on the intended surfaces.

Per the current Hostinger control-plane canon, secrets belong only in:

- Hostinger account vault / password manager
- VPS-local `/opt/terrafusion/<env>/app.env`
- GitHub Environment Secrets

## Key Finding: Actual Signing Path

The current repo truth shows a variable-name split. Agent A must rotate the active signing path, not merely every similarly named JWT field.

### Live signing consumer

- `backend/src/TerraFusion.API/Services/JwtTokenService.cs`
  - reads `JwtSettings:SecretKey`
  - throws if missing
  - requires minimum length of 32 characters
- `backend/src/TerraFusion.API/Security/JwtAuthService.cs`
  - also reads `JwtSettings:SecretKey`
  - falls back to a random default only when unset, which is not acceptable for production proof

### Base config mapping

- `backend/src/TerraFusion.API/appsettings.json`
  - maps `JwtSettings.SecretKey` to `${TF_JWT_SECRET}`

### Non-authoritative or secondary JWT surfaces that must not be mistaken for closure by themselves

- `backend/src/TerraFusion.API/appsettings.Production.json`
  - exposes `Security.JwtSecret=${JWT_SECRET}`
- `backend/src/TerraFusion.API/appsettings.Staging.json`
  - exposes `Security.JwtSecret=${JWT_SECRET}`
- `backend/api-unified/appsettings.json`
  - exposes `JwtSettings.SecretKey=${JWT_SECRET_KEY}`
- `os-platform/core/pilot/phase25-county-replication-readiness-packet.mjs`
  - checks for `JWT_SECRET` in template validation

### Operational interpretation

For the current authoritative Hostinger deploy lane, `TF_JWT_SECRET` is the primary signing-key target unless runtime proof demonstrates that the deployed bundle aliases another variable name into `JwtSettings:SecretKey`.

If `JWT_SECRET` or `JWT_SECRET_KEY` are also present in `app.env`, that may be required for non-primary or legacy consumers, but their presence does not prove the live TerraFusion API signer was rotated.

## Authoritative Runtime Surfaces

### External secret authorities

- Hostinger vault / password manager
- GitHub environment secret store for the deploy lane

### Runtime injection surfaces

- `/opt/terrafusion/staging/app.env`
- `/opt/terrafusion/production/app.env`

### Release-lane proof points

- `.github/workflows/release-lane.yml` requires `APP_ROOT/app.env` to exist before deploy
- `ops/prod/runtime-compose.template.yml` injects `./app.env` and `./release.env` into the backend container
- `os-platform/core/pilot/ops/canonical-release-lane-truth-table.md` names VPS-local `app.env` as authoritative runtime input

## Evidence Bundle Requirements

Agent A is complete only when the following sanitized artifacts exist:

1. Rotation inventory
   - secret sources
   - deployment injection points
   - consumers that actually validate signatures
2. Rotation receipt
   - operator
   - UTC timestamp
   - target environments changed
   - secret authority updated
   - rollback authority identified
3. Environment update ledger
   - staging updated
   - production updated
   - service restart or redeploy recorded
4. Post-rotation verification log
   - signing key resolved from intended runtime path
   - auth issuance succeeded
   - auth validation succeeded
   - no random-default-key fallback remained
5. Blocker closure note
   - post-go-live checklist updated so `SEC-005-ROTATE` is no longer a hard blocker

All evidence must redact secret values.

## Required Operator Sequence

### Pass A1: Inventory before mutation

- Confirm current blocker line is still present in `os-platform/core/pilot/ops/post-go-live-phase-execution-checklist.md`.
- Record the active baseline SHA before touching secret material.
- Record every JWT variable name that appears in the authoritative runtime lane: `TF_JWT_SECRET`, `JWT_SECRET`, `JWT_SECRET_KEY`.
- Verify which of those names are actually consumed by the live TerraFusion API signer.
- Record whether staging and production share one secret or carry environment-specific values.

Safe repo-only inventory commands:

```powershell
rg -n "TF_JWT_SECRET|JWT_SECRET|JWT_SECRET_KEY|JwtSettings:SecretKey|Security:JwtSecret" backend os-platform/core/pilot .github/workflows ops/prod
rg -n "app.env|release.env" .github/workflows os-platform/core/pilot ops/prod
```

### Pass A2: Rotation execution

- Generate one new secret using the approved security authority and keep it out of shell history, repo files, and evidence artifacts.
- Update the authoritative secret store first.
- Update the active Hostinger runtime injection surface second.
- Redeploy or restart the affected environment using the canonical release lane.
- If staging and production are distinct authorities, complete staging first and production second.
- If rollback material is retained, store only the rollback procedure and retention policy in evidence, not the old value.

Do not treat local sample files, historical docs, or non-authoritative compose references as completion criteria.

### Pass A3: Post-rotation verification

- Prove the backend is no longer relying on an old or default signing key.
- Prove a token issued after rotation validates successfully on the target runtime.
- Prove the intended runtime remained healthy after rotation.
- Prove the public operator surface still works on the approved Hostinger scope.

Minimum verification assertions:

- `JwtSettings:SecretKey` is populated through the active runtime path.
- application logs do not show the random-default-key warning path.
- post-rotation auth smoke succeeds.
- the public health surface still reports the correct environment identity.

## Closure Rules

Agent A may mark `SEC-005-ROTATE` closed only when all of the following are true:

1. The authoritative Hostinger runtime has been updated.
2. The live TerraFusion API signer is proven to read the rotated key path.
3. Post-rotation auth verification passed.
4. The evidence bundle exists in sanitized form.
5. `os-platform/core/pilot/ops/post-go-live-phase-execution-checklist.md` is updated truthfully.

## Explicit Non-Goals

- Do not reopen sealed frontend contract-repair proof.
- Do not weaken auth validation or bypass signature checks to manufacture a pass.
- Do not claim closure based solely on repo grep, config cleanup, or a changed sample `.env` file.
- Do not record the new or old secret in markdown, JSON evidence, commit messages, terminal transcripts, or screenshots.