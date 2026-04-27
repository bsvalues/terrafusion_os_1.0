# SyncAtlas Profile

## Status

SyncAtlas is currently:

| Capability | State |
|---|---|
| Schema-backed | yes |
| Source connection-backed | yes |
| CLI runnable | yes |
| Docker SQL Server integration-tested | yes |
| Real local `pacs_training` operator-tested | **blocked** |

**B1.7 is blocked because `jcharrispacs/pacs_training` is not reachable on the operator machine.**
This is an environment availability issue, not a SyncAtlas code failure. See the
[B1.7 Resume Checklist](#b17-resume-checklist) below for how to complete B1.7
when the local SQL Server is back up.

## What SyncAtlas Does

SyncAtlas profiles a legacy SQL Server source database and persists a structural
atlas into the TerraFusion DB.

It discovers:

- Tables
- Columns (including PK/FK flags, nullability, types, default values)
- Views (with full definition body)
- Stored procedures (with full definition body)
- User-defined functions (scalar / inline-table / multi-statement-table)
- Triggers (with timing, events, and definition body)
- Constraints (primary key, unique, foreign key, check, default)

SyncAtlas does **not** import parcel data. It maps the *shape* of the legacy
database so later sync slices can bind PACS / CAMA source tables to TerraFusion's
canonical landing schema and operational tables.

## What SyncAtlas Does Not Do

SyncAtlas does **not**:

- Store source-system passwords in the repository.
- Pull PACS rows into production tables.
- Replace TerraFusion Sync.
- Expose an HTTP endpoint (B1.9 deferred to post-MVP).
- Prove the real local PACS training database unless run against `pacs_training`.

> **Synthetic PACS-shaped data may prove the CLI path, but it does not satisfy B1.7.**
> B1.7's purpose is specifically to demonstrate that SyncAtlas operates correctly
> against the actual local `jcharrispacs/pacs_training` source. Substituting
> synthetic data and calling B1.7 done would poison the proof chain.

## Architecture

```text
┌─────────────────────────────┐
│ SQL Server source           │
│ (e.g. jcharrispacs/pacs_*)  │
└──────────────┬──────────────┘
               │ Windows Integrated Auth (default)
               ▼
┌─────────────────────────────┐
│ SyncSourceConnection row    │  (TerraFusion DB; no plaintext passwords)
│ (CountyId, Server, Database) │
└──────────────┬──────────────┘
               │ resolved by
               ▼
┌─────────────────────────────┐
│ SqlServerMetadataReader     │  (reads sys.* catalog only — no source data)
└──────────────┬──────────────┘
               │ DTOs
               ▼
┌─────────────────────────────┐
│ AtlasProfiler orchestrator  │  (creates SyncBatch with Mode='profile')
└──────────────┬──────────────┘
               │ persists
               ▼
┌─────────────────────────────┐
│ SyncAtlas profile schema    │  (in TerraFusion DB)
│ — SyncProfileTables          │
│ — SyncProfileColumns         │
│ — SyncProfileViews           │
│ — SyncProfileProcedures      │
│ — SyncProfileFunctions       │
│ — SyncProfileTriggers        │
│ — SyncProfileConstraints     │
│ — SyncProfileCodes           │
└──────────────┬──────────────┘
               │
               ▼
   Operator-readable CLI summary
```

## CLI Usage

The CLI lives at `backend/tools/SyncAtlas/`. It is intentionally not in
`TerraFusion.sln` (matching the precedent set by `tools/CostForgePerfHarness`).

```bash
dotnet run --project backend/tools/SyncAtlas -- \
  --db "$TF_DB" \
  --county-id "$TF_COUNTY_ID" \
  --connection-id "$TF_SYNC_SOURCE_CONNECTION_ID" \
  --operator "$TF_OPERATOR"
```

Use environment variables (or a secret manager) to keep credentials out of shell
history and out of the repository.

## Arguments

| Argument | Required | Purpose |
|---|---:|---|
| `--db` | yes | TerraFusion PostgreSQL connection string |
| `--county-id` | yes | County scope for the profile run |
| `--connection-id` | yes | `SyncSourceConnection.Id` identifying the source database |
| `--operator` | no | Human or automation identity stamped on audit fields (default: `cli-operator`) |
| `--help`, `-h`, `/?` | no | Show usage and exit |

## Exit Codes

| Code | Meaning |
|---:|---|
| 0 | Profile completed successfully |
| 1 | Argument parse failure |
| 2 | Profile failed (cross-county, inactive connection, reader exception) |
| 3 | Cancelled by operator (Ctrl+C) |

## Source Connection Requirements

Before running SyncAtlas, the TerraFusion DB must contain:

1. A valid `Counties` row (the `CountyId` you pass).
2. A valid `SyncSourceConnections` row (the `ConnectionId` you pass) with:
   - `CountyId` matching the operator's county.
   - `IsActive = true`.
   - `Server`, `Database`, and `ConnectionType = 'SqlServer'` populated.
   - `AuthMode = 'WindowsIntegrated'` (default).
3. A reachable SQL Server source database, accessible via the credentials
   resolved at runtime (Windows Integrated by default).
4. **No plaintext source-system passwords stored in any repo file.** SqlAuth
   credentials must resolve from external secret storage at connection time.

For local Benton County testing:

```text
CountyId:        19190019-1919-1919-1919-191919191919
County name:     Benton County (FIPS 53005)
Expected source: jcharrispacs / pacs_training
```

## Output Format

SyncAtlas prints a one-page summary to stdout:

```text
sync-atlas: profiling connection <guid> for county <guid>...

─────────────────────────────────────────────
  Batch:        <guid>
  Status:       completed
  Started:      <ISO 8601 UTC>
  Completed:    <ISO 8601 UTC>
  Elapsed:      <duration>
─────────────────────────────────────────────
  Tables:       <count>
  Columns:      <count>
  Views:        <count>
  Procedures:   <count>
  UDFs:         <count>
  Triggers:     <count>
  Constraints:  <count>
─────────────────────────────────────────────
```

For a valid PACS-style source, **tables, columns, and constraints must be
non-zero**. Views, procedures, UDFs, and triggers may be zero if the source
database does not contain them (e.g., a stripped training extract). A successful
profile that returns zero tables is a strong signal something is wrong with the
source connection and warrants investigation.

## Persistence

SyncAtlas writes profile results into the schemas landed in B1.1 and B1.2:

| Table | Purpose | Slice |
|---|---|---|
| `SyncBatches` | One row per profile run; status, counts, started/completed timestamps | A |
| `SyncProfileTables` | One row per discovered table or view | B1.1 |
| `SyncProfileColumns` | One row per column (with PK/FK/nullability/type) | B1.1 |
| `SyncProfileViews` | One row per view (with definition body) | B1.1 |
| `SyncProfileProcedures` | One row per stored procedure (with definition body) | B1.1 |
| `SyncProfileFunctions` | One row per UDF (with definition body and FunctionType) | B1.1 |
| `SyncProfileTriggers` | One row per trigger (with timing, events, definition) | B1.1 |
| `SyncProfileConstraints` | One row per PK/UNIQUE/FK/CHECK/DEFAULT constraint | B1.1 |
| `SyncProfileCodes` | Code-table candidate columns (for later mapping) | B1.1 |
| `SyncSourceConnections` | Operator-defined source connection profiles | B1.2 |

The profile batch (`SyncBatches` row, `Mode = 'profile'`) is the root record.
All domain-specific metadata rows reference it via `SyncBatchId`. CountyId is
stamped on every row for sovereign-county isolation.

On success the orchestrator also updates the connection's
`LastSuccessfulConnectionAtUtc`. On failure it records
`LastConnectionErrorAtUtc` + a truncated `LastConnectionErrorMessage` (≤ 2048
chars).

## Proof Chain

| Slice | Commit | Proof |
|---|---|---|
| B1.1 | `9ad1c1e5d` | Profile schema landed; 9/9 wiring tests |
| B1.2 | `a010be064` | Source connection schema landed; 6/6 wiring tests (including `HasNoPasswordColumn`) |
| B1.3 | `e9e0c097f` | `SqlServerMetadataReader` landed; 13/13 SQL-shape tests |
| B1.4 | `4d9a26d6b` | `AtlasProfiler` orchestrator landed; 7/7 orchestration tests with fake reader |
| B1.5 | `f469f419e` | CLI runner landed; 13/13 argument-parser tests |
| B1.6 | `fbb29955d` | Docker SQL Server integration tests passed; **10/10 against live `azure-sql-edge` container** |
| **B1.7** | — | **Blocked: local `jcharrispacs/pacs_training` unavailable** |
| B1.8 | (this commit) | Documentation |

### B1.6 Docker proof note

B1.6 uses `mcr.microsoft.com/azure-sql-edge:latest` instead of the originally
specified `mcr.microsoft.com/mssql/server:2022-latest`. Same SQL engine surface,
same `sys.*` catalog views, but `mssql/server:2022` did not reach readiness
reliably on the operator's Docker host (multiple 22-minute `sqlcmd -Q "SELECT 1"`
loops with no progress). `azure-sql-edge` becomes ready in ~80 seconds. The
deviation is documented in the B1.6 commit message.

### B1.7 blocked state

When this slice was attempted, the operator's local environment showed:

- TerraFusion Postgres: ✅ up (`terrafusion-postgres-dev`, healthy)
- `Counties` row: ✅ Benton County present
- `SyncSourceConnections` table: ✅ exists, 0 rows
- `SyncBatches` table: ✅ exists, 0 rows
- `jcharrispacs/pacs_training` SQL Server: ❌ not reachable (no `sqlservr.exe` process; no SQL Server engine service installed on the host)

Without a reachable SQL Server source, the CLI cannot demonstrate the operator
workflow against real PACS data. **Substituting synthetic data does not satisfy
B1.7** — the slice exists specifically to prove behavior against the real local
source.

## B1.7 Resume Checklist

Resume B1.7 only when the real local SQL Server source (`jcharrispacs/pacs_training`
or equivalent) is available.

```bash
# 1. Confirm TerraFusion Postgres is up.
docker ps --filter "name=terrafusion-postgres-dev"

# 2. Confirm SQL Server is reachable.
#    Use whatever local tooling identifies your SQL Server engine:
#    - net start | grep -i sql      (Windows service)
#    - tasklist | grep sqlservr     (Windows process)
#    - docker ps | grep sql         (Docker-hosted)
#    Then verify the source database accepts a "SELECT 1" with the operator's
#    Windows credentials.

# 3. Confirm Benton County exists in TerraFusion DB.
#    CountyId: 19190019-1919-1919-1919-191919191919

# 4. Confirm or seed a SyncSourceConnection for pacs_training.
#    Required fields:
#      CountyId        = 19190019-1919-1919-1919-191919191919
#      Name            = "Benton PACS Training"
#      SourceSystem    = "PACS"
#      ConnectionType  = "SqlServer"
#      Server          = "jcharrispacs"  (or the host the SQL engine listens on)
#      Database        = "pacs_training"
#      AuthMode        = "WindowsIntegrated"
#      IsActive        = true
#    No password column exists by design.

# 5. Run SyncAtlas.
export TF_DB='Host=localhost;Port=5432;Database=terrafusion;Username=postgres'
export TF_COUNTY_ID='19190019-1919-1919-1919-191919191919'
export TF_SYNC_SOURCE_CONNECTION_ID='<guid from step 4>'
export TF_OPERATOR="${USER:-operator}"

mkdir -p backend/artifacts/sync-atlas

dotnet run --project backend/tools/SyncAtlas -- \
  --db "$TF_DB" \
  --county-id "$TF_COUNTY_ID" \
  --connection-id "$TF_SYNC_SOURCE_CONNECTION_ID" \
  --operator "$TF_OPERATOR" \
  | tee backend/artifacts/sync-atlas/b1.7-pacs-training-profile.txt

echo "exit=${PIPESTATUS[0]}"
```

PowerShell variant of the run step:

```powershell
dotnet run --project backend/tools/SyncAtlas -- `
  --db "$env:TF_DB" `
  --county-id "$env:TF_COUNTY_ID" `
  --connection-id "$env:TF_SYNC_SOURCE_CONNECTION_ID" `
  --operator "$env:TF_OPERATOR" `
  | Tee-Object backend/artifacts/sync-atlas/b1.7-pacs-training-profile.txt

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

### B1.7 success criteria

B1.7 is complete only when **all** of the following hold:

- SyncAtlas exits with code `0`.
- TerraFusion DB contains a `SyncBatches` row with `Mode = 'profile'`,
  `Status = 'completed'`, scoped to Benton County.
- `Tables`, `Columns`, and `Constraints` counts are all non-zero.
- The captured CLI output is saved to
  `backend/artifacts/sync-atlas/b1.7-pacs-training-profile.txt`.
- No source-system credentials appear in the captured artifacts.

If `Tables = 0` or `Columns = 0`, treat the run as a failure and do not mark
B1.7 complete — even if exit code was 0. A zero-row profile against `pacs_training`
indicates a misconfigured source connection.

## Non-Goals

B1.8 does not add:

- HTTP endpoints (B1.9 deferred post-MVP)
- UI surfaces
- Synthetic-PACS substitutions for B1.7
- Sync import behavior (separate slice)
- Cleanup of PACS / Harris / CAMA violator references (separate slice)

## Related Memory

- `feedback_sync_workbench.md` — Sync is a workbench for one assessor (SQL + Excel)
- `project_sync_workbench_spec.md` — 7-step workbench, A → A.5 → B1.1–B1.9 sequence, locked decisions
- `feedback_ef_migration_startup.md` — EF migrations must use TerraFusion.API as `--startup-project`
- `reference_pacs_proval_sources.md` — Where PACS source data lives on D:\ E:\
