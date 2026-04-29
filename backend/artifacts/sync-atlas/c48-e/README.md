# C48-E Live Endpoint Proof — Smoke Runner

Standalone .NET app that exercises the C48-C/C48-D code path
(`LivePacsSchemaSource` over `SqlInformationSchemaIntrospector`)
against the operator's local Harris PACS database.

Identical wire shape to the production endpoint
`GET /api/sync/schema/catalog/summary`, but bypasses the API boot
+ JWT auth path so the smoke can be run without a live API
instance.

## Hard guards (preserved from C48-A)

- **HG1 PII-free.** The introspector queries `INFORMATION_SCHEMA`
  only — no `SELECT *` against any user table. The artifact
  contains only counts + version stamp; no row data.
- **HG2 county-agnostic.** Schema-scoped to `dbo` (configurable);
  no per-county filter.
- **No mutation.** Read-only INFORMATION_SCHEMA queries. Zero
  side effects on PACS, TerraFusion DB, or any workbook artifact.

## Source / target binding

```text
Harris PACS 9.0  ────► smoke runner (LivePacsSchemaSource)  ────►  artifact
   (legacy source)                                                  (no DB write)
```

The runner reads FROM Harris PACS; it never writes ANYWHERE. No
TerraFusion DB connection at all.

## How to run

The runner reads connection metadata from environment variables.
The connection string itself is NOT committed — it's supplied at
invocation time so the password never ends up in a file.

### Required

| Env var | Purpose |
|---|---|
| `C48E_HARRIS_PACS_CONN` | Full SQL Server connection string for the legacy Harris PACS database. |

### Optional

| Env var | Default | Purpose |
|---|---|---|
| `C48E_PACS_RELEASE` | (unset) | Operator label for the PACS release (e.g. `"Harris PACS 9.0"`). Surfaces in the artifact's `pacsRelease` field. |
| `C48E_SOURCE_LABEL` | `harris-pacs-prod-c48e` | Provenance label stamped on catalog entries. |
| `C48E_SCHEMA_NAME` | `dbo` | SQL schema to introspect. |

### One-liner (bash / Git Bash)

```bash
C48E_HARRIS_PACS_CONN="Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=$TF_DEV_PACS_PASSWORD;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS-C48E-smoke;" \
C48E_PACS_RELEASE="Harris PACS 9.0" \
C48E_SOURCE_LABEL="benton-pacs-prod" \
dotnet run --project backend/artifacts/sync-atlas/c48-e/SmokeRunner.csproj
```

`$TF_DEV_PACS_PASSWORD` is the same env var
`appsettings.Development.json` references for `ConnectionStrings:PacsConnection`.
The runner expects the same SQL Server / database / sa account
the C-series Sync work has been using for months.

If `TF_DEV_PACS_PASSWORD` is not set in your shell, set it before
invoking the runner (the runner will not prompt).

### One-liner (PowerShell)

```powershell
$env:C48E_HARRIS_PACS_CONN = "Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=$env:TF_DEV_PACS_PASSWORD;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS-C48E-smoke;"
$env:C48E_PACS_RELEASE = "Harris PACS 9.0"
$env:C48E_SOURCE_LABEL = "benton-pacs-prod"
dotnet run --project backend\artifacts\sync-atlas\c48-e\SmokeRunner.csproj
```

## What you'll see on success

stdout writes a JSON payload matching `SchemaCatalogSummaryDto`
plus a small `proof` block:

```json
{
  "configured": true,
  "tableCount": 3954,
  "columnCount": 95656,
  "dictionaryCount": 0,
  "pacsRelease": "Harris PACS 9.0",
  "ingestedAtUtc": "2026-04-29T...",
  "proof": {
    "slice": "C48-E",
    "sourceLabel": "benton-pacs-prod",
    "schemaName": "dbo",
    "elapsedMs": 1234,
    "identityProof": "live-introspection-via-information-schema",
    "piiFreeProof": "introspector-queries-information-schema-only",
    "mutationProof": "no-writes-zero-side-effects"
  }
}
```

The same JSON is also written to a timestamped artifact:

```text
backend/artifacts/sync-atlas/c48-e/c48e-live-summary.<UTC>.json
```

Counts will differ depending on the live source. The proof is
**shape and nonzero metadata**, not an exact table count.
`dictionaryCount` is 0 in this slice — dictionary inference is
deferred to a follow-on slice per the C48-C non-goals.

## Marker commit on success

Per the C48-E Execution Card, after a successful run an empty
marker commit lands on `main`:

```bash
git commit --allow-empty -m "test(sync): Slice C48-E — prove live Harris PACS schema catalog endpoint. The schema goblin counted tables without reading taxpayer sandwiches."
```

The captured artifact JSON stays in `backend/artifacts/sync-atlas/c48-e/`
and is committed alongside.

## Troubleshooting

- **`Login failed for user 'sa'.`** — `TF_DEV_PACS_PASSWORD` is
  not set or has the wrong value. Verify with
  `echo "len: ${#TF_DEV_PACS_PASSWORD}"` (should be > 0). Do NOT
  print the password itself.
- **`No connection could be made because the target machine
  actively refused it.`** — SQL Server isn't running on
  `localhost:1433`. Start the local SQL Server service.
- **`Cannot open database "pacs_oltp" requested by the login.`** —
  The database name in the connection string doesn't exist. The
  C-series has been using `pacs_oltp` (per
  `appsettings.Development.json`); confirm that's still the live
  name on this machine.

## Out of scope

- Production DI registration in `TerraFusion.API.Program.cs` —
  already landed in C48-D. This runner does not touch it.
- Consumer migration — deferred to C48-F/onward when dictionary
  inference exists.
- Modifying any code under `backend/src/**` or `backend/tests/**`
  — forbidden by the C48-E Execution Card.
