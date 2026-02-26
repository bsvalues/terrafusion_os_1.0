# TerraFusion OS — Demo Script for Daniel

**Prepared by**: Bill Spencer, Benton County Assessor
**Date**: February 25, 2026
**Purpose**: Walk Daniel through a live proof of the PACS integration in 10 minutes

---

## Prerequisites

- Docker Desktop running (WSL2 backend)
- .NET 8 SDK installed
- PowerShell 7+ (pwsh)
- Repository cloned: `git clone <repo> && cd terrafusion_os_1.0`

---

## Act 1: Restore the PACS Database (one-shot)

*Skip if tf-mssql container already running with pacs_oltp.*

```powershell
# Restore full PACS database from archived backups
# This extracts RAR archives, starts SQL Server, restores 16.8 GB backup
pwsh ops/dev/restore-pacs-from-archives.ps1 -SaPassword "TF_Pacs2026!"
```

**Expected output**: `PASS: 4/4 smoke checks passed`

**What it does**:
1. Extracts RAR archives using Docker (no local 7z/unrar needed)
2. Starts SQL Server 2019 container with backup dir mounted
3. Reads backup headers automatically
4. Restores `pacs_oltp` database (112,057 Benton County properties)
5. Runs 4 smoke tests

---

## Act 2: Deploy Contract Views

```powershell
# Copy the TerraFusion abstraction layer SQL into the container
docker cp ops/dev/pacs-contract-views.sql tf-mssql:/tmp/

# Execute it
docker exec tf-mssql /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "TF_Pacs2026!" -C `
  -i /tmp/pacs-contract-views.sql
```

**Expected output**:
```
Views created: 3/3
Procedures created: 1/1
Indexes created: 3/3
vw_TerraFusion_Property_Core rows:       112057
vw_TerraFusion_Property_Ownership rows:   246157
vw_TerraFusion_Assessment_History rows:    1507033
=== Deployment complete ===
```

**What it does**: Creates the three SQL views that translate raw Harris PACS
tables into the columns that `PacsSqlAdapter.cs` expects. Also creates a
health check stored procedure and three performance indexes.

---

## Act 3: Validate the Contract (18 checks)

```powershell
pwsh ops/dev/test-pacs-contract.ps1
```

**Expected output**:
```
=== TerraFusion pacscontract.v1 — Contract Proof ===

Container:
  [PASS] Docker container 'tf-mssql' is running
Database:
  [PASS] Connected to pacs_oltp
Views:
  [PASS] View 'vw_TerraFusion_Property_Core' exists
  [PASS] View 'vw_TerraFusion_Property_Ownership' exists
  [PASS] View 'vw_TerraFusion_Assessment_History' exists
Procedures:
  [PASS] sp_TerraFusion_HealthCheck exists
  [PASS] sp_TerraFusion_HealthCheck returns HEALTHY
Indexes:
  [PASS] Index 'IX_TerraFusion_Property_GeoID' exists
  [PASS] Index 'IX_TerraFusion_PropertyVal_PropYear' exists
  [PASS] Index 'IX_TerraFusion_Situs_Property' exists
Data:
  [PASS] Property Core view has rows (>100K)
  [PASS] Ownership view has rows (>200K)
  [PASS] Assessment History view has rows (>1M)
  [PASS] GetPropertyByIdAsync — returns columns for prop_id 10007
  [PASS] GetPropertyByGeoIdAsync — geo_id lookup works
  [PASS] GetOwnershipAsync — returns owner data
  [PASS] GetAssessmentHistoryAsync — returns history
  [PASS] GetChangedPropertiesAsync — delta sync query works

════════════════════════════════════════════
  pacscontract.v1 Proof: 18 PASS / 0 FAIL
════════════════════════════════════════════
```

These 18 checks mirror exactly what the .NET `PacsSqlAdapter.ValidateContractAsync()`
method checks internally. If this script passes, the backend will pass.

---

## Act 4: Start the .NET API and Hit the Proof Endpoint

```powershell
cd backend
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --project src/TerraFusion.API/TerraFusion.API.csproj
```

Wait for `Now listening on: http://localhost:5000`, then in a new terminal:

```powershell
# Health check
Invoke-WebRequest http://localhost:5000/health | Select-Object StatusCode, Content

# PACS contract proof (the money shot)
$r = Invoke-WebRequest http://localhost:5000/ops/pacs/proof
$r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**Expected**: `contractValid: true`, all views/indexes/procedures `ok`, zero errors.

---

## Act 5: Query a Real Parcel (SQL, to show what's under the hood)

```powershell
# Property 10007: Miller Gordon A & Glenda J, 106 8th Street, Prosser WA
docker exec tf-mssql /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "TF_Pacs2026!" -C -d pacs_oltp -Q "
  SELECT prop_id, geo_id, situs_addr, assessed_val, market_val, appr_year
  FROM vw_TerraFusion_Property_Core
  WHERE prop_id = 10007;

  SELECT owner_name, mail_addr_1, mail_city, mail_state, pct_ownership
  FROM vw_TerraFusion_Property_Ownership
  WHERE prop_id = 10007;

  SELECT TOP 5 prop_val_yr, assessed_val, market_val
  FROM vw_TerraFusion_Assessment_History
  WHERE prop_id = 10007
  ORDER BY prop_val_yr DESC;
"
```

**What Daniel sees**: A real Benton County property with 5 years of assessment
history, owner name and mailing address, assessed vs market value — all flowing
through the TerraFusion abstraction layer.

---

## Talking Points for the Demo

1. **"This is real data."** 112,057 Benton County properties from a Harris PACS
   backup. Not mock data. Not synthetic. Real parcels, real owners, real values.

2. **"The abstraction layer is the boundary."** Nobody queries Harris tables
   directly. Everything goes through three SQL views that normalize the schema.
   The sealed `PacsSqlAdapter` class is the only code that touches PACS.

3. **"Everything is deterministic and reproducible."** One PowerShell script
   restores the database. One SQL file deploys the views. One test script
   validates contract. `git clone → restore → deploy → prove` in under 20 min.

4. **"There's a second backup."** The `pacs_golive_manual-backup` (7 GB, April
   2023) is from the production CHPACS server and is 7.5 years newer than the
   currently restored backup. We haven't restored it yet because it expands to
   ~47 GB, but the data is there when we're ready.

5. **"The .NET backend was built from day one for this."** `PacsSqlAdapter`,
   `IPacsAdapter`, `PacsOpsController`, `PacsServiceRegistration` — all existed
   before the database was restored. We just proved the contract matches the
   real schema.

---

## After the Demo: What's Next

| Priority | Task | Why |
|----------|------|-----|
| 1 | Restore `pacs_golive` (April 2023) backup | 7.5 years more data |
| 2 | Run full backend test suite against live PACS | Prove integration at scale |
| 3 | Wire PACS data into frontend property views | Show parcels in the UI |
| 4 | Activate two-person CI gates | Branch protection for pair dev |
| 5 | Complete TerraForge cost approach module | First assessor-facing feature |

---

*"The best demo is the one where you can't tell the difference between the demo
and the real thing — because it is the real thing."*
