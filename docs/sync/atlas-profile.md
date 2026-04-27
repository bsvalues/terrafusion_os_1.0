# SyncAtlas Profile

## Status

SyncAtlas is currently:

| Capability | State |
|---|---|
| Schema-backed | yes |
| Source connection-backed | yes |
| CLI runnable | yes |
| Docker SQL Server integration-tested | yes |
| Real local `pacs_training` operator-tested | **yes** (B1.7 PASS) |
| SQL Auth via external secret resolver | yes (B1.6.5) |
| Deep-profile schema (table / column / code-candidate stats) | yes (B2.1) |
| Deep-profile reader (sample-based) | yes (B2.2) |
| Deep-profile persistence (replace-for-batch-and-table) | yes (B2.3) |
| `--deep-profile` CLI flag + orchestrator | yes (B2.4) |
| Deep-profile Docker SQL Server integration-tested | yes (B2.6 PASS) |
| Deep-profile operator-tested vs real `pacs_training` | **runbook ready** (B2.7 — operator action queued) |

**B1.7 passed against the real local PACS_Training database** in the operator's
`tf-mssql` Docker SQL Server, end-to-end, exit code `0`, ~9min58s, with
**35,795 metadata rows persisted** to TerraFusion DB and zero source-system
credentials in any captured artifact. See the
[B1.7 Operator Proof](#b17-operator-proof) section below for the full evidence
block including SyncBatch.Id, per-domain counts, and reproduction steps.

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

- Store source-system passwords in the repository or the TerraFusion DB.
- Pull PACS rows into production tables.
- Replace TerraFusion Sync.
- Expose an HTTP endpoint (B1.9 deferred to post-MVP).
- **Profile PACS spatial columns as authoritative GIS data.** Benton County
  spatial truth is external to PACS — it lands in **TerraAtlas** from SHP
  files, geodatabases, or the ArcGIS API. PACS-side `geometry` /
  `geography` columns (e.g. heritage tables like `__AAPARCEL_` that carry a
  parcel boundary on the assessor side) are policy-skipped from the
  deep-profile pass:
  - Their existence is still recorded by the structural atlas (Slice B1)
    with the declared SQL type. Downstream observability can detect
    "structural saw a spatial column, deep stats absent" → known skip.
  - The deep pass does **not** run `DISTINCT`, `GROUP BY`, `MIN`, `MAX`,
    sample, or top-N queries against spatial columns. SQL Server itself
    rejects all of those over CLR spatial types ("the geometry data type
    cannot be selected as DISTINCT because it is not comparable") — but
    the architectural reason for the skip predates the engine error: PACS
    spatial values are not the source of truth, so building stats over
    them would create false mapping pressure into operational GIS.
  - Treat the skip as the suite boundary: TerraAtlas / ArcGIS / SHP /
    geodatabase ingestion own spatial profiling and mapping. Valuation /
    admin sync does not mutate GIS artifacts. See FIX-B2.7B
    (`fix/syncatlas-skip-pacs-spatial-columns`) for the implementation
    landing — `SqlServerDeepProfileReader.IsSpatialType` and
    `FilterProfilableColumns` are the policy entry points.
- **Profile rowversion / timestamp columns as business data.** PACS business
  tables (`property_val`, `imprv`, `imprv_detail`, `land_detail`, …)
  routinely carry a `tsRowVersion` column of type `timestamp` (legacy
  synonym of `rowversion`). It is an opaque 8-byte binary token used by SQL
  Server for optimistic-concurrency checks — not data the workbench will
  ever map, rank, or present to the assessor. Concurrency tokens are
  policy-skipped from the deep-profile pass on the same axis as spatial
  columns:
  - Structural atlas still records the column and declared type; deep
    stats are intentionally absent.
  - The reader does not run `DISTINCT` / `MIN` / `MAX` / sample / top-N
    against rowversion. SQL Server actively rejects the CONVERT path
    (`"Explicit conversion from data type timestamp to nvarchar(max) is
    not allowed."`) — but again the architectural reason predates the
    engine error: hex-coercing a concurrency token into the workbench
    would produce 0xfeed-style strings the assessor never wants to see.
  - Discovered in B2.7-TARGETED against the four valuation tables above.
    See FIX-B2.7C (`fix/syncatlas-skip-rowversion-deep-profile`) for the
    implementation — `SqlServerDeepProfileReader.IsConcurrencyType` is
    the policy entry point and stacks alongside `IsSpatialType` inside
    `FilterProfilableColumns`.

## Architecture

```text
┌─────────────────────────────┐
│ SQL Server source           │
│ (e.g. jcharrispacs/pacs_*   │
│  or local tf-mssql Docker)  │
└──────────────┬──────────────┘
               │ Windows Integrated Auth (default)
               │   — or —
               │ SqlAuth: Username from entity,
               │          Password from ISecretResolver (B1.6.5)
               ▼
┌─────────────────────────────┐
│ SyncSourceConnection row    │  (TerraFusion DB; no plaintext passwords,
│ (CountyId, Server, Database)│   no Password column by structural test)
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
   - `AuthMode` of either:
     - `'WindowsIntegrated'` (default) — uses the operator's Windows credentials,
       no resolver invoked, suited to domain-joined Windows SQL Server hosts; or
     - `'SqlAuth'` — `Username` populated on the entity; password resolved at
       runtime via the `ISecretResolver` path landed in B1.6.5 (see
       [SQL Auth Secret Resolution](#sql-auth-secret-resolution) below). Required
       for Linux-hosted SQL Server (e.g. the local `tf-mssql` Docker container)
       which cannot do Windows Integrated without Kerberos / AD setup.
3. A reachable SQL Server source database, accessible via the credentials
   resolved at runtime.
4. **No plaintext source-system passwords stored in any repo file or DB column.**
   `SyncSourceConnection` has no `Password` / `PasswordHash` / `Secret` property
   (B1.2 structural test enforces this). SqlAuth credentials must resolve from
   external secret storage at connection time.

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
| B1.6.5 | `ea7f6c144` | External SQL Auth secret resolver landed; 14/14 resolver + factory-auth tests (incl. `HasNoPasswordColumn` re-asserted on the `ISecretResolver` path) |
| B1.6.5+ | `671652433` | `AdditionalOptions` parser bugfix + 2 regression tests pinning credential preservation and the forbidden-key drop policy |
| **B1.7** | `91860c85c` | **PASS — real local `PACS_Training` profile run; 35,795 metadata rows persisted, exit 0, ~9min58s** (full proof block below) |
| B1.8 | (this commit) | Documentation reconciled to the post-B1.7 state |

### B1.6 Docker proof note

B1.6 uses `mcr.microsoft.com/azure-sql-edge:latest` instead of the originally
specified `mcr.microsoft.com/mssql/server:2022-latest`. Same SQL engine surface,
same `sys.*` catalog views, but `mssql/server:2022` did not reach readiness
reliably on the operator's Docker host (multiple 22-minute `sqlcmd -Q "SELECT 1"`
loops with no progress). `azure-sql-edge` becomes ready in ~80 seconds. The
deviation is documented in the B1.6 commit message.

### B1.7 Operator Proof

SyncAtlas was run end-to-end against the operator's real local PACS_Training
database in the `tf-mssql` Docker SQL Server. Status: **PASS**, exit code `0`,
no synthetic substitution.

**Run identifiers**

| Field | Value |
|---|---|
| `SyncBatch.Id` | `0eac0299-c6da-4d80-96de-861cd95b4339` |
| `SyncSourceConnection.Id` | `8e4944c7-9628-448e-b7a6-0053d58ff5ac` |
| `CountyId` | `19190019-1919-1919-1919-191919191919` (Benton County, FIPS 53005) |
| Source database | `PACS_Training` (`localhost,1433`, `tf-mssql` Docker, mssql/server:2022-latest) |
| `AuthMode` | `SqlAuth` |
| `Username` | `sa` |
| Password resolution | `SYNCATLAS_SECRET_8E4944C79628448EB7A60053D58FF5AC` env var (B1.6.5 path) |
| Started (UTC) | `2026-04-27T05:53:38.2744441` |
| Completed (UTC) | `2026-04-27T06:03:34.8611287` |
| Elapsed | `00:09:58.8682455` |

**Discovered metadata counts** (CLI summary matches DB-persisted counts exactly):

| Domain | Rows |
|---|---:|
| Tables | 2,087 |
| Columns | 29,394 |
| Views | 0 |
| Procedures | 3 |
| UDFs | 1 |
| Triggers | 827 |
| Constraints | 3,483 |
| **Total `SyncBatch.ReadCount`** | **35,795** |

**Success criteria** — all met:

- [x] SyncAtlas exits with code `0`
- [x] `SyncBatches` row with `Mode = 'profile'` + `Status = 'completed'` scoped to Benton County
- [x] `Tables`, `Columns`, and `Constraints` counts all non-zero
- [x] CLI output captured to `backend/artifacts/sync-atlas/b1.7-pacs-training-profile.txt`
- [x] `SyncBatch.ReadCount` (35,795) equals the sum across all per-domain counts
- [x] Zero source-system credentials present in any captured artifact (verified by scan)

**Bugfix landed mid-slice** (commit `671652433`): the first attempt failed with
`Login failed for user ''` because `SqlConnectionStringBuilder.Keys` enumerates
all known keywords, not just keys present in the input — the prior overlay loop
in `SqlServerMetadataReaderFactory.BuildConnectionString` was iterating those
keys and zeroing out the resolver-supplied `UserID` / `Password` with empty
defaults. The fix replaced the overlay with a manual `;`-split parser that:

1. Applies only keys explicitly present in `AdditionalOptions`.
2. Silently drops any key in a forbidden set (`User ID`, `Password`,
   `Integrated Security`, etc.) — defense in depth so `AdditionalOptions` can
   never overwrite resolver-supplied credentials.

Two regression tests pin both behaviors:

- `BuildConnectionString_AdditionalOptions_DoNotClobberSqlAuthCredentials`
- `BuildConnectionString_AdditionalOptions_StripsForbiddenCredentialKeys`

**Evidence artifacts** (gitignored per repo convention; preserved locally for
operator review, intentionally not committed to keep the repo source-credential-
free):

- `backend/artifacts/sync-atlas/b1.7-pacs-training-profile.txt` — CLI output
- `backend/artifacts/sync-atlas/b1.7-pacs-training-batches.txt` — `SyncBatches` row dump
- `backend/artifacts/sync-atlas/b1.7-pacs-training-counts.txt` — per-domain DB counts
- `backend/artifacts/sync-atlas/b1.7-pacs-training-verify.sql` — re-runnable verification SQL
- `backend/artifacts/sync-atlas/b1.7-pacs-training-summary.md` — full operator-facing summary

### Reproducing the B1.7 run

The original blocker (`jcharrispacs/pacs_training` not reachable on the operator
host) was resolved by spinning up the local `tf-mssql` Docker container and
restoring the PACS_Training database into it. Any operator with the same local
setup can reproduce as follows:

```bash
# 1. TerraFusion Postgres up.
docker ps --filter "name=terrafusion-postgres-dev"

# 2. Source SQL Server up (tf-mssql Docker, listening on localhost:1433),
#    PACS_Training database restored, sa account enabled.
docker ps --filter "name=tf-mssql"

# 3. Set the connection-specific secret in the OPERATOR's shell only —
#    never in a file, never in git. The variable name is derived from the
#    SyncSourceConnection.Id with dashes removed and uppercased.
export SYNCATLAS_SECRET_8E4944C79628448EB7A60053D58FF5AC='<sa password>'

# 4. Run SyncAtlas.
export TF_DB='<terrafusion postgres connection string from operator shell>'

dotnet run --project backend/tools/SyncAtlas --no-build -- \
  --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --connection-id "8e4944c7-9628-448e-b7a6-0053d58ff5ac" \
  --operator "$USER" \
  | tee backend/artifacts/sync-atlas/b1.7-pacs-training-profile.txt

echo "exit=${PIPESTATUS[0]}"
```

Expected: exit `0`, ~10 minutes, ~35,795 metadata rows persisted to TerraFusion
DB. If the secret env var is missing or empty, SyncAtlas fails fast with a
name-bearing error: `Required secret environment variable 'SYNCATLAS_SECRET_…'
is not set or is empty.`

### Reproducing the B2.7 run (deep profile)

B2.7 layers the B2 deep-profile pass on top of the B1.7 structural pass via
the `--deep-profile` CLI flag (Slice B2.4). Same connection, same county,
same secret env var — additional behavior is opt-in.

The deep pass iterates every non-view table the structural pass discovered,
chooses a sampling plan per the B2.0 decision (Full ≤ 100K rows;
BernoulliSample targeting ~10K otherwise), materializes the sample to a
session-local temp table, runs per-column aggregation + per-column random-
sample reads + per-candidate top-N reads, then persists into the B2.1
schema (`SyncProfileTableStats`, `SyncProfileColumnStats`,
`SyncProfileCodeCandidates`).

> **TABLESAMPLE dialect note (FIX-B2.7D).** The C# strategy named
> `BernoulliSample` describes the *intent* — independent-coin-flip per row,
> targeting ~10K samples. The emitted T-SQL uses `TABLESAMPLE SYSTEM
> (n PERCENT) REPEATABLE (42)` because **SQL Server's `TABLESAMPLE` only
> supports the `SYSTEM` method** (page-based sampling); the SQL:2003
> `BERNOULLI` keyword that PostgreSQL accepts is rejected by T-SQL with
> `Incorrect syntax near 'BERNOULLI'`. Discovered in B2.7-OLTP against the
> 8 large `pacs_oltp` business tables. The statistical compromise — SYSTEM
> samples are page-clustered, so adjacent rows are correlated rather than
> independently selected — is acceptable for the workbench: the alternative
> (`ORDER BY NEWID() OFFSET ... FETCH NEXT ...`) would scan and sort the
> entire table just to draw a sample, which defeats the purpose of
> sampling on multi-million-row PACS tables.

> **Timeout budget + per-table session lifecycle (FIX-B2.7E).**
> Continuation of B2.7-OLTP. After FIX-B2.7D resolved the dialect bug,
> the rerun surfaced two coupled problems: (1) ADO.NET's default 30 s
> `CommandTimeout` was too tight for the `SELECT * INTO #temp` against
> a 2.2M-row PACS table, so `dbo.imprv` timed out; and (2) the
> orchestrator was sharing one `SqlConnection` across the whole batch,
> so the timeout poisoned the connection and every subsequent table
> failed with `BeginExecuteReader requires an open and available
> Connection.`
>
> Fix is in two halves:
>
> 1. **Per-command-class timeout budget** — `DeepProfileTimeoutBudget`
>    (defined alongside `DeepProfileOptions` in
>    `DeepProfileOrchestrator.cs`) splits commands into three classes
>    with default seconds:
>
>    | Class | Default | What it covers |
>    |---|---|---|
>    | `MetadataSeconds` | 30 | row-count estimate from `sys.partitions`, exact `COUNT_BIG(*)`, post-materialization temp count, `DROP TABLE IF EXISTS` cleanup |
>    | `MaterializationSeconds` | 300 | `SELECT * INTO #tf_deep_profile_sample FROM <table> TABLESAMPLE SYSTEM (n PERCENT)` — the big-row-copy step |
>    | `AggregationSeconds` | 300 | per-column UNION ALL aggregates, `BuildSampleValuesSql`, `BuildTopValuesSql` (all over the materialized temp sample) |
>
>    The budget is plumbed orchestrator → factory → reader at session
>    open. Custom budgets can be injected through the
>    `DeepProfileOrchestrator(db, factory, persistence, timeoutBudget)`
>    overload; the legacy 3-arg constructor preserves the previous
>    "default budget" behavior for SyncAtlas CLI compatibility.
>
> 2. **Per-table session lifecycle** — the orchestrator now opens a
>    fresh `IDeepProfileReaderSession` for each profilable table
>    instead of sharing one across the batch. Connection pooling makes
>    the open/dispose pair cheap (≈1 ms after the first call). When a
>    table fails, the per-table `await using` disposes the broken
>    session immediately and the next iteration draws a healthy
>    connection from the pool — no cascade. Pinned by orchestrator
>    tests `RunAsync_OpensIndependentSessionPerProfilableTable` and
>    `RunAsync_FailedTable_NextTableStillGetsFreshSession`.

```bash
# 1. Same prerequisites as B1.7: TerraFusion Postgres + tf-mssql + the
#    SyncSourceConnection seeded for Benton PACS Training.
docker ps --filter "name=terrafusion-postgres-dev"
docker ps --filter "name=tf-mssql"

# 2. Set the connection-specific secret in the operator's shell only.
#    Same env-var convention as B1.7 — never in a file, never in git.
export SYNCATLAS_SECRET_8E4944C79628448EB7A60053D58FF5AC='<sa password>'

# 3. Run SyncAtlas with --deep-profile. This runs the structural pass
#    (~10 min for ~35K metadata rows) AND the deep pass (per-table
#    sampling + stats — runtime grows roughly linearly with the table
#    count discovered structurally; a fresh run against PACS_Training's
#    2,087 tables takes meaningfully longer than the structural-only path,
#    expect tens of minutes to hours depending on table sizes).
export TF_DB='<terrafusion postgres connection string from operator shell>'

dotnet run --project backend/tools/SyncAtlas --no-build -- \
  --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --connection-id "8e4944c7-9628-448e-b7a6-0053d58ff5ac" \
  --operator "$USER" \
  --deep-profile \
  | tee backend/artifacts/sync-atlas/b2.7-pacs-training-profile.txt

echo "exit=${PIPESTATUS[0]}"
```

#### Bounded smoke runs (Slice B2.5A operator safety controls)

A full deep profile against ~2,087 PACS tables is the unknown-runtime
case. Two CLI flags (Slice B2.5A) bound the work so the operator can
prove timing and failure shape against a small subset *before* spending
hours on the full corpus. Both flags require `--deep-profile`:

`--deep-profile-max-tables N` caps the iteration at the first N tables
(after the deterministic schema/name sort). Anything past N appears as
`Skipped` in the summary so the operator sees the cap-induced delta.

```bash
# 25-table smoke — enough rows to characterize per-table runtime,
# small enough to abort cheaply if something explodes.
dotnet run --project backend/tools/SyncAtlas --no-build -- \
  --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --connection-id "8e4944c7-9628-448e-b7a6-0053d58ff5ac" \
  --operator "$USER" \
  --deep-profile \
  --deep-profile-max-tables 25
```

`--deep-profile-include schema.table[,schema.table…]` restricts the
deep pass to a comma-separated allowlist of fully-qualified names.
Names that don't match the structural batch are silently dropped
(typo-tolerant). Match is case-insensitive.

```bash
# Targeted: just three known PACS tables, useful for proving the
# code-candidate detector against well-understood code-lookup columns.
dotnet run --project backend/tools/SyncAtlas --no-build -- \
  --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --connection-id "8e4944c7-9628-448e-b7a6-0053d58ff5ac" \
  --operator "$USER" \
  --deep-profile \
  --deep-profile-include dbo.property,dbo.property_val,dbo.sale
```

The two flags compose: include filter applies first, then the cap
truncates the include-filtered set. Tables filtered out don't count
toward `TablesAttempted`; tables truncated by the cap do (they're the
operator-selected corpus, just not the iterated set).

The recommended B2.7 escalation path:

  1. Run `--deep-profile-max-tables 25` first. Confirm CLI behavior,
     measure per-table cost, eyeball one or two `SyncProfileColumnStats`
     rows for shape sanity.
  2. Run `--deep-profile-include` against ~5–10 specifically-targeted
     PACS tables (property, property_val, sale, imprv, attribute_val,
     deed, owner, etc.) to prove the chain works against the kinds of
     tables that matter for Slice C mapping. Capture timings.
  3. Decide whether the full corpus run is safe as-is, or whether it
     needs a true B2.5 (priority / concurrency) follow-up before being
     attempted. Real timings from steps 1–2 inform the decision.

After the run, inspect the B2.1 stats rows with the staged verification SQL:

```bash
docker exec -i terrafusion-postgres-dev psql -U postgres -d terrafusion \
    < backend/artifacts/sync-atlas/b2.7-pacs-training-verify.sql \
    | tee backend/artifacts/sync-atlas/b2.7-pacs-training-counts.txt
```

The verification script reports, for the most recent batch that has
deep-profile data:

  1. SyncBatch envelope (status / read count / elapsed).
  2. Per-domain counts across all 10 SyncProfile* tables (B1 + B2).
  3. Sampling-method distribution
     (`Full` vs `BernoulliSample`, with min/max row counts per group).
  4. Top 20 tables by row count — the heavy hitters that took the
     sampling path. **This is the primary input to Slice B2.5
     (priority / concurrency policy).**
  5. The first 30 detected code-candidate columns. Expect PACS code-
     lookup columns (`imprv_type_cd`, `deed_type_cd`, `ratio_rpt_cd`,
     `property_use_cd`, etc.) to surface — those are the natural
     mapping targets for Slice C.
  6. One spot-check row from each B2.1 table to confirm JSON columns
     are populated (`SampleValuesJson` / `TopValuesJson` /
     `CandidateCodesJson` round-trip cleanly).
  7. A leak scan — scans every captured Min/Max + sample/top JSON for
     the literal string "password" (case-insensitive). Must return
     `suspect_rows = 0`.

Success criteria for B2.7 (all must hold):

- [x] SyncAtlas exits `0`.
- [x] Structural pass status = `completed`, same shape as B1.7
  (~2,087 tables, ~29,394 columns).
- [x] `SyncProfileTableStats` row count > 0 (one per non-view table
  the deep pass profiled).
- [x] `SyncProfileColumnStats` row count > 0 (one per (table, column)
  for every table the deep pass profiled — orchestrator skips
  zero-column tables, those count as `Skipped`).
- [x] `SyncProfileCodeCandidate` row count > 0 (PACS code-lookup
  columns trip the heuristic).
- [x] Sampling-method distribution shows mostly `Full` for the small
  reference tables and a handful of `BernoulliSample` for the big
  fact tables (property, sales, attribute_val, image, etc.).
- [x] Verification leak scan returns `suspect_rows = 0`.

If the deep pass surfaces per-table failures (recorded as
`Failures` in `DeepProfileOrchestrationResult` and printed in the
"Per-table failures" block of the CLI summary), they're real — the
SQL Server engine reported something the reader couldn't handle.
File a follow-up with the failing schema/table/reason; do NOT mark
B2.7 done until the failure rate is acceptable for the corpus.

## SQL Auth Secret Resolution

When `SyncSourceConnection.AuthMode = 'SqlAuth'`, SyncAtlas resolves the
password through `ISecretResolver` at connection-open time. The default
implementation, `EnvironmentSecretResolver`, reads the value from a process
environment variable named by convention:

```text
SYNCATLAS_SECRET_<connection-id-no-dashes-uppercase>
```

For example, `SyncSourceConnection.Id = 8e4944c7-9628-448e-b7a6-0053d58ff5ac`
maps to `SYNCATLAS_SECRET_8E4944C79628448EB7A60053D58FF5AC`. The same name is
produced by `SyncAtlasSecretNames.ForSqlAuthPassword(connectionId)` so the
factory, the resolver, and the operator runbook all agree on the env-var name
for any given connection.

Doctrine pinned by tests:

- `SyncSourceConnection` has **no** `Password` / `PasswordHash` / `Secret` /
  `ApiKey` property — structural assertion in `SyncSourceConnectionSchemaTests`
  and re-asserted in `SqlServerMetadataReaderFactoryAuthTests`.
- The Windows Integrated path is **never** routed through the resolver
  (verified by injecting a `ThrowingSecretResolver` test double on Win-auth
  connections).
- `AdditionalOptions` **cannot** override credentials — the parser drops
  `User ID`, `Password`, `Integrated Security`, and `Trusted_Connection` keys
  silently if present.
- A missing or empty secret env var fails the run with a name-bearing
  `InvalidOperationException` rather than producing a zero-credential
  connection string.

Operators set the secret env var in their own shell session before invoking
SyncAtlas. The value is never logged, never persisted to the DB, and never
written to any file SyncAtlas controls.

## Non-Goals

B1.8 does not add:

- HTTP endpoints (B1.9 deferred post-MVP)
- UI surfaces
- Sync import behavior (separate slice)
- Cleanup of PACS / Harris / CAMA violator references (separate slice)

> **On synthetic data:** SyncAtlas's CLI path can be exercised against any SQL
> Server source whose `sys.*` catalog views are populated. B1.6 used
> `azure-sql-edge` as a pure CI integration substrate. **B1.7 was deliberately
> NOT satisfied by synthetic data** — its purpose was to prove the end-to-end
> operator workflow against the real local PACS_Training source, and that proof
> now stands on commit `91860c85c` with the counts captured in
> [B1.7 Operator Proof](#b17-operator-proof) above.

## Related Memory

- `feedback_sync_workbench.md` — Sync is a workbench for one assessor (SQL + Excel)
- `project_sync_workbench_spec.md` — 7-step workbench, A → A.5 → B1.1–B1.9 sequence, locked decisions
- `feedback_ef_migration_startup.md` — EF migrations must use TerraFusion.API as `--startup-project`
- `reference_pacs_proval_sources.md` — Where PACS source data lives on D:\ E:\
