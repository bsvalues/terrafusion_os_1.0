# Daniel Go-Live Kit

**One directory. Four scripts. One proof bundle.**

## Quick Start

```powershell
cd ops/daniel-kit
pwsh 0_restore.ps1
pwsh 1_deploy_contract.ps1
pwsh 2_run_proof.ps1
pwsh 3_live_parcel_query.ps1
```

When done, send Bill the `proof-bundle/` folder. It contains:

| File | Contents |
|------|----------|
| `proof.json` | Machine-readable contract validation (from `/ops/pacs/proof`) |
| `contract-checks.log` | 18-check contract proof output |
| `environment.txt` | Docker state, image tags, volumes, DB name, timestamps |
| `parcel-sample.txt` | Live parcel query results (property, owner, history) |

## What Each Script Does

### `0_restore.ps1` — Restore PACS Database
Extracts Benton County PACS backup from archived RAR files, starts SQL Server
2019 in Docker, restores `pacs_oltp` (112,057 properties, 1,662 tables).
Takes 5-10 minutes depending on disk speed.

### `1_deploy_contract.ps1` — Deploy TerraFusion Views
Creates the three abstraction views, health check procedure, and three
performance indexes on top of the raw Harris PACS schema.

### `2_run_proof.ps1` — Validate Contract + Get API Proof
Runs the 18-check contract test, starts the .NET API, hits `/ops/pacs/proof`,
and writes `proof.json` + `contract-checks.log` + `environment.txt`.

### `3_live_parcel_query.ps1` — Query Real Parcels
Reads a real Benton County property through the TerraFusion views and writes
the results to `parcel-sample.txt`.

## Prerequisites

- Docker Desktop (WSL2 backend)
- .NET 8 SDK
- PowerShell 7+ (pwsh)
- ~20 GB free disk space

## If Something Fails

Every script exits with code 0 on success, 1 on failure. Check the
`proof-bundle/` directory for partial output. The `contract-checks.log`
will show exactly which check failed.
