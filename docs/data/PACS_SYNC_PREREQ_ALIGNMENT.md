# WO-DATA-004B-P1: Import Prerequisite Alignment

**Date**: 2026-06-15
**Database**: `terrafusion_dev_clean` (Docker PG16, port 5432)
**Status**: COMPLETE — alignment only, zero imports, zero drains
**Prerequisite**: WO-DATA-004A merged as `9b8e4a239`

---

## 1. Summary of Resolved Blockers

| # | Blocker (from WO-DATA-004A) | Resolution | Status |
|---|----------------------------|------------|--------|
| 1 | MSSQL not running | `tf-benton-wo004-sql` exists (stopped), port 11433; compose `tf-mssql` on port 1433 available | DOCUMENTED |
| 2 | Port mismatch (config=1433, container=11433) | Decision: use compose-managed `tf-mssql` on port 1433 (matches committed config) | DECIDED |
| 3 | Doctrine tables empty | Flag split implemented — doctrine seeds independently of fake dev seeders | CODE CHANGED |
| 4 | TF_SKIP_DEV_SEEDERS coupling | Split into `TF_SKIP_DEV_SEEDERS` + `TF_SKIP_DOCTRINE_SEEDERS` | CODE CHANGED |
| 5 | Local override targets wrong DB | Guidance documented; template provided | DOCUMENTED |
| 6 | TF_DEV_PACS_PASSWORD confirmed | SA_PASSWORD present in container config; real password in local override | CONFIRMED |

---

## 2. PACS/MSSQL Target Decision

### Decision: Use compose-managed `tf-mssql` on port 1433

**Rationale**:
- Committed config (`appsettings.Development.json`) targets `localhost:1433`
- Local override targets `localhost:1433`
- compose file (`backend/docker-compose.pacs.yml`) defines `tf-mssql` on `127.0.0.1:1433`
- Using compose avoids changing any connection strings

**Existing container `tf-benton-wo004-sql`**:
- Maps to port 11433 (not 1433)
- Uses older `mssql/server:2019-latest` image
- Would require connection string override to use

**Action for P2**: Start compose service:
```powershell
$env:TF_PACS_SA_PASSWORD = "<sa-password-from-local-override>"
docker compose -f backend/docker-compose.pacs.yml up -d
```

**Volume decision**: `docker-compose.pacs.yml` uses `tf_mssql_data` (external, already exists). The existing `tf-benton-wo004-sql` container uses `tf_mssql_data_pacs`. These are DIFFERENT volumes. If PACS data lives on `tf_mssql_data_pacs`, P2 must either:
- A) Mount `tf_mssql_data_pacs` instead of `tf_mssql_data`, OR
- B) Start the existing `tf-benton-wo004-sql` container and update connection strings to port 11433

**Operator decision required at P2 start**: Which volume has the PACS databases?

---

## 3. Doctrine Seeder Flag Split

### Before (WO-DATA-004A finding)

One flag `TF_SKIP_DEV_SEEDERS` controlled everything:

| Service | Category | Gated by |
|---------|----------|----------|
| DoctrineRatioPolicySeederHostedService | A — governance | `TF_SKIP_DEV_SEEDERS` |
| DoctrinePropertyUniverseSeederHostedService | A — governance | `TF_SKIP_DEV_SEEDERS` |
| SalesQualificationCodesSeederHostedService | A — governance | `TF_SKIP_DEV_SEEDERS` |
| ImprvAttrDictionaryRefreshHostedService | A — governance | `TF_SKIP_DEV_SEEDERS` |
| GPTConfigurationSeeder | B — fabricated | `TF_SKIP_DEV_SEEDERS` |
| DatabaseSeeder.SeedDossierRuntimeDataAsync | B — fabricated | `TF_SKIP_DEV_SEEDERS` |
| DevPropertySeeder | B — fabricated | `TF_SKIP_DEV_SEEDERS` |
| DevGovernmentUserSeeder | B — fabricated | `TF_SKIP_DEV_SEEDERS` |
| SaleRecordSeeder | B — fabricated | `TF_SKIP_DEV_SEEDERS` |

### After (this PR)

Two independent flags:

| Service | Category | Now gated by |
|---------|----------|--------------|
| DoctrineRatioPolicySeederHostedService | A — governance | `TF_SKIP_DOCTRINE_SEEDERS` |
| DoctrinePropertyUniverseSeederHostedService | A — governance | `TF_SKIP_DOCTRINE_SEEDERS` |
| SalesQualificationCodesSeederHostedService | A — governance | `TF_SKIP_DOCTRINE_SEEDERS` |
| ImprvAttrDictionaryRefreshHostedService | A — governance | `TF_SKIP_DOCTRINE_SEEDERS` |
| GPTConfigurationSeeder | B — fabricated | `TF_SKIP_DEV_SEEDERS` |
| DatabaseSeeder.SeedDossierRuntimeDataAsync | B — fabricated | `TF_SKIP_DEV_SEEDERS` |
| DevPropertySeeder | B — fabricated | `TF_SKIP_DEV_SEEDERS` |
| DevGovernmentUserSeeder | B — fabricated | `TF_SKIP_DEV_SEEDERS` |
| SaleRecordSeeder | B — fabricated | `TF_SKIP_DEV_SEEDERS` |

### Import run configuration

For WO-DATA-004B-P2 (first drain):
```
TF_SKIP_DEV_SEEDERS=true        # blocks fake data
TF_SKIP_DOCTRINE_SEEDERS=        # unset → doctrine seeds on startup
```

This means:
- Doctrine rules seed automatically at API startup (6 universe + ~3 ratio + 3 sales-qual)
- PACS imprv_attr dictionary refreshes from PACS at startup (non-fatal if PACS unreachable)
- NO fabricated properties, users, sales, GPT configs, or dossier data

### Code changes

File: `backend/src/TerraFusion.API/Program.cs`

1. Added `ShouldSkipDoctrineSeeders()` static method (reads `TF_SKIP_DOCTRINE_SEEDERS`)
2. Added `shouldSkipDoctrineSeeders` variable alongside existing `shouldSkipStartupSeeders`
3. Changed 4 hosted service registrations from `!shouldSkipStartupSeeders` to `!shouldSkipDoctrineSeeders`:
   - Line ~1854: `DoctrineRatioPolicySeederHostedService`
   - Line ~1880: `DoctrinePropertyUniverseSeederHostedService`
   - Line ~1894: `SalesQualificationCodesSeederHostedService`
   - Line ~1934: `ImprvAttrDictionaryRefreshHostedService`

Build verified: 0 warnings, 0 errors.

---

## 4. Connection String Alignment

### Committed config (`appsettings.Development.json`)

| Name | Target | Port | Status |
|------|--------|------|--------|
| DefaultConnection | terrafusion_dev_clean | 5432 | CORRECT for import |
| LevyDatabase | terrafusion_levy | 5432 | Separate, no conflict |
| PacsConnection | pacs_oltp | 1433 | Correct IF compose container used |
| PacsSalesConnection | pacs_golive | 1433 | Correct IF compose container used |

### Local override (`appsettings.Development.local.json` — main checkout only)

| Name | Current Target | Correct Target for Import |
|------|---------------|--------------------------|
| DefaultConnection | `terrafusion` (WRONG) | `terrafusion_dev_clean` |
| PacsConnection | pacs_oltp:1433 | OK (matches compose) |
| PacsSalesConnection | pacs_oltp:1433 | OK (matches compose) |

### Guidance for P2

**Option A (recommended)**: Run API from the worktree (no local override → committed config applies → targets `terrafusion_dev_clean` automatically).

**Option B**: Update `appsettings.Development.local.json` in main checkout to target `terrafusion_dev_clean`. But this changes the shared checkout, which is quarantined per doctrine.

**Option C**: Copy local override into worktree with corrected DefaultConnection. This preserves the real PACS password.

---

## 5. Fake Dev Seeder Guard

### Current protection

With `TF_SKIP_DEV_SEEDERS=true`:
- DevPropertySeeder: BLOCKED (line ~3571 gate)
- DevGovernmentUserSeeder: BLOCKED (same gate)
- SaleRecordSeeder: BLOCKED (same gate)
- GPTConfigurationSeeder: BLOCKED (line ~2657 gate)
- DatabaseSeeder.SeedDossierRuntimeDataAsync: BLOCKED (line ~2688 gate)

### Additional guard: database name check

The committed config already targets `terrafusion_dev_clean`. The dev seeders check `Properties.Count() == 0` before inserting (DevPropertySeeder.SeedAsync). Even if the flag fails, seeders would only insert if the table is empty.

### Verification SQL (run before AND after API startup in P2)

```sql
SELECT COUNT(*) FROM public."Properties"
  WHERE "ParcelNumber" LIKE 'B-Reval%'
     OR "Address" LIKE '106 Oakmont%'
     OR "Address" LIKE '123 Main%';
-- Must return 0

SELECT COUNT(*) FROM public."GovernmentUsers"
  WHERE "Email" = 'admin@terrafusionmarket.com';
-- Must return 0

SELECT COUNT(*) FROM public."SaleRecords";
-- Must return 0
```

---

## 6. DB Clean State Verification

Verified at WO-DATA-004B-P1 time (2026-06-15):

```
Properties          | 0
GovernmentUsers     | 0
SaleRecords         | 0
Counties            | 0
parcel_spine        | 0
source_xref         | 0
doctrine_universe   | 0
doctrine_ratio      | 0
doctrine_sales_qual | 0
```

All layers empty. No contamination.

---

## 7. SyncSourceConnection Path

### Current state

`SyncSourceConnection` is a configuration entity that the drain pipeline reads to resolve PACS connection parameters. Current state: the drain endpoints read connection strings from `IConfiguration` (appsettings), not from a DB-stored `SyncSourceConnection` entity.

### Decision

No `SyncSourceConnection` DB record needed for P2. The drain pipeline resolves PACS connectivity from `appsettings` connection strings. Creating a DB record is a future concern (multi-county).

---

## 8. Docker Container Inventory

| Container | Image | Port | Status | Volume | Use for P2? |
|-----------|-------|------|--------|--------|-------------|
| terrafusion-postgres-dev | postgres:16 | 5432 | UP | — | YES (target DB) |
| tf-benton-wo004-sql | mssql/server:2019 | 11433→1433 | STOPPED | tf_mssql_data_pacs | MAYBE (if PACS data is here) |
| tf-mssql (compose) | mssql/server:2022 | 1433→1433 | NOT RUNNING | tf_mssql_data | MAYBE (if PACS data is here) |

### Docker volumes

| Volume | Purpose |
|--------|---------|
| tf_mssql_data | For compose-managed tf-mssql |
| tf_mssql_data_pacs | For tf-benton-wo004-sql (likely has PACS DBs) |
| pacs_baks | Backup volume |

---

## 9. Open Decisions for P2

| Decision | Owner | Options |
|----------|-------|---------|
| Which MSSQL volume has PACS data? | Operator | Check both; likely tf_mssql_data_pacs |
| Run API from worktree vs main checkout? | Operator | Worktree recommended (clean config) |
| PACS connectivity test before first drain | P2 agent | `GET /health` + PACS ping endpoint |

---

No mutations to terrafusion_dev_clean performed. Code change is Program.cs flag split only. Build verified clean.
