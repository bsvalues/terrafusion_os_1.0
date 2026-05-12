# Credential Rotation — Git-History-Burned Secrets

## Overview

Several historic credentials existed as plaintext in tracked `appsettings*.json` files
and were rotated out of the tree in subsequent commits. Anyone with read access to the
git repository history has these values FOREVER. They must be rotated in every
deployment that may have ever used them.

This document is the authoritative list of burned credentials, the commits that
introduced and removed them, and the verification steps each deployment owner must
take.

## Burned credentials

| Credential | Introduced (commit) | Removed (commit) | Risk window | Last-4 chars |
|---|---|---|---|---|
| MSSQL `sa` password `TF_Pacs2026!` | `dc69db7c2` | `4428bf45c` | Always-burned | `26!` |
| Postgres `postgres` password literal `postgres` | (pre-`974a1fb34`) | `974a1fb34`, `34d864778` (SEC-007 — SEC-010) | Always-burned | `gres` |
| Dev JWT signing key `TerraFusion-Dev-Secret-Key-2026-Do-Not-Use-In-Production!!` | base | (still in `appsettings.json` for dev only) | Always-burned for any deployment that used the dev default | `n!!` |
| `TerraDivineJWT2025SecretKeyForProductionGovernmentCompliance!` (BentonCounty JwtSecret) | base | Removed by PR-7 (this PR) | Always-burned for any Benton-profile deployment that used this | `nce!` |
| `TerraEncryptionDivine2025GovernmentGradeSecurity!` (BentonCounty EncryptionKey) | base | Removed by PR-7 (this PR) | Always-burned for any Benton-profile deployment that used this | `ity!` |

## Verification steps per deployment owner

1. **Identify what each environment is using today.**
   - For MSSQL `sa`: check the actual deployed SA password vs the burned values.
   - For Postgres `postgres`: same.
   - For JWT signing: decode any existing JWT to check the `kid` or signing-key identity; rotate if it matches a burned value.
   - For encryption: if any database column or audit-log entry was encrypted with the burned key, plan re-encryption.

2. **Rotate any environment that may have used a burned value.**
   - Generate a new strong secret (32+ bytes random).
   - Update the deployment's secret store (env var, Vault, Key Vault, etc.).
   - Restart the affected service.
   - Verify the application still works.

3. **Document the rotation** — every operator should append an entry to
   `docs/audit/credential-rotations.log` (create this file if absent):
   ```
   2026-MM-DD operator: <name>
   environment: <env name>
   credential rotated: <credential name>
   verification: <how you confirmed the new value is in use>
   ```

## Going forward

- All new secrets MUST be `${VAR}` env-var-driven from day one.
- No plaintext secret values in tracked `appsettings*.json` files.
- The `Workbench:Evidence:HmacKey` placeholder pattern in `appsettings.json`
  (fail-closed, length-checked, gitignored override) is the model to emulate.
- Any future commit that introduces a literal secret value MUST be force-rotated
  the same day; treat as a security incident.
