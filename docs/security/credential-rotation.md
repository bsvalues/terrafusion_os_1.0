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

Plaintext values are intentionally omitted from current HEAD. Use the commit
references and non-reversible verification fingerprints below for incident
response; recover exact historic values from git history only when a deployment
owner needs to compare a live secret in a controlled rotation workflow.

| Credential | Introduced (commit) | Removed (commit) | Risk window | Verification fingerprint |
|---|---|---|---|---|
| MSSQL `sa` password from legacy local default | `dc69db7c2` | `4428bf45c` | Always-burned | last-4 `026!` |
| Postgres `postgres` password literal | (pre-`974a1fb34`) | `974a1fb34`, `34d864778` (SEC-007 - SEC-010) | Always-burned | last-4 `gres` |
| Dev JWT signing key from `appsettings.json` | base | (still in `appsettings.json` for dev only) | Always-burned for any deployment that used the dev default | last-4 `on!!` |
| BentonCounty `Security:JwtSecret` historic literal | base | Removed by PR-7 (this PR) | Always-burned for any Benton-profile deployment that used this | last-4 `nce!` |
| BentonCounty `Security:EncryptionKey` historic literal | base | Removed by PR-7 (this PR) | Always-burned for any Benton-profile deployment that used this | last-4 `ity!` |

## Verification steps per deployment owner

1. **Identify what each environment is using today.**
   - For MSSQL `sa`: compare the deployed value against the historic value from the referenced commit in a controlled secret-handling session.
   - For Postgres `postgres`: same.
   - For JWT signing: verify token signatures against candidate keys in an isolated tool, or inspect the live runtime secret source. Decoding headers or claims alone does not prove which signing key was used.
   - For encryption: if any database column or audit-log entry was encrypted with the burned key, plan re-encryption.

2. **Rotate any environment that may have used a burned value.**
   - Generate a new strong secret (32+ bytes random).
   - Update the deployment's secret store (env var, Vault, Key Vault, etc.).
   - Restart the affected service.
   - Verify the application still works.

3. **Document the rotation** — every operator should append an entry to
   `docs/audits/credential-rotations.log` (create this file if absent):
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
