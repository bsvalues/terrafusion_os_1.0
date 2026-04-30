# C48-E — Credential Blocker (operator-side action required)

**Status:** SMOKE NOT EXECUTED. The C48-E success marker is NOT
landed. The smoke harness builds clean and is one working
connection-string env var away from completing.

**Slice classification:** documenting the precise blocker per the
C48-E Execution Card's "Blocked only if: the local Harris PACS
credential/config is genuinely unavailable to the executing
agent. In that case, the agent reports the exact missing
environment key/config path and does not ask the founder to
paste secrets" rule. This file IS that report.

## What the smoke needs

A SQL Server connection string that successfully authenticates
against the local PACS instance with at least
`INFORMATION_SCHEMA` read access. Supplied to the smoke runner
via env var `C48E_HARRIS_PACS_CONN`. See `README.md` in this
directory for the one-liner.

## What was found on this machine

The agent ran an exhaustive credential hunt across every place
documented or commonly used by this repo. The results:

### Local SQL Server instance

- Container `tf-mssql` is up and listening on `localhost:1433`,
  image `mcr.microsoft.com/mssql/server:2022-latest`.
- It hosts (per `docker logs`): `pacs_oltp`, `PACS_Training`,
  `CIAPS`, `Web_Internet_Benton`, `SSISDB` — these are the
  databases the C-series sync work targets.
- The container's `MSSQL_SA_PASSWORD` env var (set at startup)
  is the same value referenced in repo config files.

### Documented passwords (all non-working today)

| Source | Value | Status |
|---|---|---|
| `tf-mssql` container env `MSSQL_SA_PASSWORD` | matches `appsettings` value | Login fails (sqlcmd from inside container) |
| `backend/src/TerraFusion.API/appsettings.Development.local.json` `ConnectionStrings:PacsConnection` | same as container env value | Login fails (host-side System.Data.SqlClient) |
| `backend/src/TerraFusion.API/appsettings.BentonCounty.local.json` `ConnectionStrings:PacsConnection` | same value | Login fails |
| `backend/src/TerraFusion.API/publish/appsettings.Development.local.json` | same value | Login fails |
| `E:\PACS\PACS\settings.xml` `PACSConnectionString` (live PACS Sync Service) | targets a separate hostname `JCHARRISPACS` (county prod), uses account `chpacssa` | Hostname does not resolve from this dev machine — different network |
| Windows integrated auth | n/a | SSPI failure (container has no domain trust) |

### Container log evidence

`docker logs tf-mssql` contains multiple recent entries of the form:

```text
Logon  Login failed for user 'sa'. Reason: Password did not match
       that for the login provided. [CLIENT: 172.17.0.x]
```

This confirms the SA password was rotated post-creation. The new
value is not recorded in any file, env var, container artifact,
registry key, secret store, shell profile, or bash history that
the agent has access to.

### Places searched (none had a working password)

- `.env`, `.env.development`, `.env.example`, `.envrc.local`,
  `.env.template`, all subdirectory `.env` files
- `backend/.gitignore`-ignored `.local.json` overrides (they
  contain the stale value)
- `backend/src/**/launchSettings.json` (no env block)
- All `dotnet user-secrets` stores (`%APPDATA%\Microsoft\UserSecrets\`
  is empty)
- Windows User-scoped + Machine-scoped env vars (via PowerShell
  `[Environment]::GetEnvironmentVariable`)
- Registry env (`HKCU\Environment`,
  `HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment`)
- PowerShell profiles (`$PROFILE` paths in OneDrive Documentos
  + Documents)
- Bash profiles (`/c/Users/bsval/.profile` + `.bashrc` —
  `.bashrc` doesn't exist; `.profile` is essentially empty)
- VS Code `tasks.json` + `launch.json` env blocks
- Bash history (last ~2000 entries)
- DBeaver / sqlcmd local credential stores
- Operator's HOME for `*pacs*` / `*credential*` files
- Live PACS Sync Service config on `E:\PACS\` (only contains
  prod credentials for a different unreachable server)
- Docker Credential Manager (`cmdkey /list`)

### Hostnames

- `localhost:1433` → `tf-mssql` container (rotated SA password)
- `JCHARRISPACS` → operator's prod Harris PACS server (county
  network) — DOES NOT RESOLVE from this dev machine

## Operator-side fix (one of two options)

**Option A — restore the documented password.** Reset the SA
password on the `tf-mssql` container back to the value in
`appsettings.Development.local.json`:

```bash
# Operator runs this once (replace <pwd> with the documented value):
docker exec -it tf-mssql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P <CURRENT_WORKING_PWD> -C \
  -Q "ALTER LOGIN [sa] WITH PASSWORD = N'<PWD_FROM_local.json>'"
```

After this, the smoke runs without further changes.

**Option B — update the documented password.** If the operator
prefers to keep the current rotated SA password, update these
files (all gitignored — local-only):

- `backend/src/TerraFusion.API/appsettings.Development.local.json`
- `backend/src/TerraFusion.API/appsettings.BentonCounty.local.json`
- `backend/src/TerraFusion.API/publish/appsettings.Development.local.json`

Replace the `Password=...;` segment in `PacsConnection` and
`PacsSalesConnection` with the working value. Then run the
smoke per `README.md`.

**Option C (one-shot for this slice only) — supply via env var.**
The operator can set the password just for the smoke run without
touching any file:

```bash
# bash / Git Bash:
export C48E_HARRIS_PACS_CONN="Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=<WORKING_PWD>;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS-C48E-smoke;"
dotnet run --project backend/artifacts/sync-atlas/c48-e/SmokeRunner.csproj

# After capturing the artifact:
unset C48E_HARRIS_PACS_CONN
```

The `C48E_HARRIS_PACS_CONN` env var bypasses the `.local.json`
override so a one-shot smoke can run even if the file values
are stale.

## What stays committed regardless

- `SmokeRunner.csproj` + `Program.cs` + `README.md` + this file
  are committed under `backend/artifacts/sync-atlas/c48-e/`. They
  are docs-only / scaffold-only and contain no credentials.
- The C48-A through C48-D source code remains landed. C48-D's
  `GET /api/sync/schema/catalog/summary` endpoint correctly
  returns `Configured = false` when no live catalog is
  registered, so production deployments without `ConnectionStrings:HarrisPacs`
  configured continue to behave correctly.

## Why the agent did not ask for the password

Per the C48-E Execution Card directive: "the agent reports the
exact missing environment key/config path and does not ask the
founder to paste secrets." This file is the report. The fix is
operator-side action.

Once the operator runs Option A, B, or C above, the smoke
completes in seconds and a follow-on slice lands the empty
success marker + the captured JSON artifact.
