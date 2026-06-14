# WO-DATA-002A-EXEC-P2: Clean Dev DB Bootstrap — Execution Results

**Date**: 2026-06-13 / 2026-06-14
**Branch**: `claude/wo-data-002a-exec-p2-clean-dev-db-bootstrap`
**Worktree**: `C:\Users\bsval\tf-wo-data-002a-exec-p2`
**Status**: COMPLETE — all 88 TerraFusionDbContext migrations applied

---

## 1. Mission

Create `terrafusion_dev_clean` on Docker PG16 (port 5432), prevent Levy fallback contamination, apply all TerraFusionDbContext migrations, verify clean schema.

## 2. Prerequisites Verified (from P1)

| Gate | Result |
|------|--------|
| Docker PG16 reachable on 5432 | PASS |
| Old `terrafusion` DB untouched | PASS — 0 tables, exists, not dropped |
| Native PG17 on 5433 untouched | PASS — no commands issued against port 5433 |

## 3. Databases

| Database | Purpose | Final State |
|----------|---------|-------------|
| `terrafusion_dev_clean` | New clean dev DB | 88 migrations applied, 171 tables |
| `terrafusion_levy` | Isolated Levy target | Created, empty (0 tables) |
| `terrafusion` | Old DB (untouched) | 0 tables — verified untouched |
| `tfpr_dev` | TFPR (untouched) | Not touched |

Extensions on `terrafusion_dev_clean`: `uuid-ossp` 1.1, `vector` 0.8.2, `plpgsql` 1.0

## 4. Code Changes

### 4a. Levy Fallback Removal (`Program.cs:2469-2475`)

**Before** (contamination vector):
```csharp
var levyConn = Environment.GetEnvironmentVariable("LEVY_DATABASE_URL")
              ?? builder.Configuration.GetConnectionString("LevyDatabase")
              ?? builder.Configuration.GetConnectionString("DefaultConnection")
              ?? Environment.GetEnvironmentVariable("DATABASE_URL");
```

**After** (fail-loud):
```csharp
var levyConn = Environment.GetEnvironmentVariable("LEVY_DATABASE_URL")
              ?? builder.Configuration.GetConnectionString("LevyDatabase");
```

If no `LevyDatabase` is configured, `levyConn` is null and the existing `string.IsNullOrWhiteSpace(levyConn)` guard routes to SQLite fallback. Levy migrations never touch DefaultConnection.

### 4b. Connection Strings (`appsettings.Development.json`)

- `DefaultConnection` database changed: `terrafusion` -> `terrafusion_dev_clean`
- `LevyDatabase` added: targets `terrafusion_levy` on port 5432

`appsettings.Development.local.json` updated identically (NOT committed — contains real PACS SA password).

### 4c. Surgical Migration Chain Repair (`20260418074714_AddPropertyAssessmentAuditFields.cs`)

**Defect**: Pre-existing duplicate `AddColumn<decimal>("SecondaryFeaturePctOfBiv", "CostMatrices")` in migration #28. Migration #27 (`AddSecondaryFeaturePctToCostMatrix`) already adds this column. When applied incrementally during development the duplicate was invisible; on clean bootstrap it fails with `42701: column already exists`.

**Fix (operator-approved surgical repair)**:
- **Up()**: Removed duplicate `AddColumn<decimal>("SecondaryFeaturePctOfBiv", ...)` (was lines 180-184)
- **Down()**: Removed matching `DropColumn("SecondaryFeaturePctOfBiv", "CostMatrices")` (was lines 406-408)
- Migration #27 NOT edited (it owns the column)
- Model snapshot NOT edited (not required)
- No new migration created

After this fix, the remaining 61 migrations (#28-#88) applied without error.

## 5. Migration Application

**Phase 1** (before fix): Migrations #1-#27 applied, blocked at #28.

**Phase 2** (after surgical fix): Migrations #28-#88 applied.

**Final state**: 88/88 TerraFusionDbContext migrations applied. Zero pending.

Last migration: `20260509184340_SyncComplete2V2StageLevelResume`

### Migration Count Clarification

The migration folder contains additional `.cs` files that are NOT TerraFusionDbContext migrations:
- 7 LevyDbContext migrations (`20260315000001` through `20260315000007`) — no Designer files, correctly skipped by EF
- 3 orphaned migrations (`AddExperiments`, `AddExperimentRuns`, `AddNotificationPreferences`) — no Designer files

EF correctly applies only the 88 migrations that have Designer files binding them to TerraFusionDbContext.

### `AddPacsLevyTables` is NOT Levy contamination

Migration `20260405062618_AddPacsLevyTables` is in namespace `TerraFusion.Data.Migrations` with a TerraFusionDbContext Designer file. It creates PACS levy lookup tables (`pacs_levy_rates`, etc.) as part of the main schema. This is correct — these are data tables, not LevyDbContext schema.

## 6. Verification Gates

| # | Gate | Result |
|---|------|--------|
| 1 | `terrafusion_dev_clean` exists on Docker PG16 | PASS |
| 2 | `terrafusion_levy` exists on Docker PG16 | PASS |
| 3 | Extensions (uuid-ossp, vector) installed | PASS |
| 4 | Old `terrafusion` DB untouched (0 tables) | PASS |
| 5 | Native PG17 on 5433 untouched | PASS |
| 6 | Levy fallback removed from Program.cs | PASS |
| 7 | LevyDatabase connection string added | PASS |
| 8 | All TerraFusionDbContext migrations applied | PASS — 88/88 |
| 9 | No pending migrations | PASS — `dotnet ef migrations list` shows none pending |
| 10 | No LevyDbContext contamination in `__EFMigrationsHistory` | PASS (see section 5 note) |
| 11 | Backend builds clean | PASS — 0 warnings, 0 errors |
| 12 | `git diff --check` clean | PASS |
| 13 | Table count in `terrafusion_dev_clean` | 171 tables |

## 7. Files Changed

### Committed (commit 1: `a10ba9852`)

| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/Program.cs` | Levy fallback removal |
| `backend/src/TerraFusion.API/appsettings.Development.json` | DefaultConnection -> dev_clean, add LevyDatabase |
| `docs/data/DB_BOOTSTRAP_EXEC_P2_RESULTS.md` | Initial results doc (blocked state) |

### Committed (commit 2: this commit)

| File | Change |
|------|--------|
| `backend/src/TerraFusion.Data/Migrations/20260418074714_AddPropertyAssessmentAuditFields.cs` | Remove duplicate AddColumn/DropColumn for SecondaryFeaturePctOfBiv |
| `docs/data/DB_BOOTSTRAP_EXEC_P2_RESULTS.md` | Updated to final COMPLETE state |

### NOT committed (local-only, contains real passwords)

- `backend/src/TerraFusion.API/appsettings.Development.local.json`

## 8. What P2 Delivered

1. **Levy contamination vector eliminated** — `DefaultConnection` fallback removed; Levy context now fails loud or falls back to SQLite
2. **Clean dev DB bootstrapped** — `terrafusion_dev_clean` with 171 tables from 88 migrations, full TerraFusionDbContext schema
3. **Levy DB isolated** — `terrafusion_levy` exists as dedicated target
4. **Migration chain defect fixed** — duplicate `AddColumn` at migration #28 surgically removed; future clean bootstraps will succeed
5. **Connection strings updated** — dev environment targets clean DB by default
