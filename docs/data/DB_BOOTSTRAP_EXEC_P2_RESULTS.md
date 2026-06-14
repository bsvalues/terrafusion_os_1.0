# WO-DATA-002A-EXEC-P2: Clean Dev DB Bootstrap — Execution Results

**Date**: 2026-06-13 / 2026-06-14
**Branch**: `claude/wo-data-002a-exec-p2-clean-dev-db-bootstrap`
**Worktree**: `C:\Users\bsval\tf-wo-data-002a-exec-p2`
**Status**: BLOCKED — pre-existing migration chain defect at migration #28

---

## 1. Mission

Create `terrafusion_dev_clean` on Docker PG16 (port 5432), prevent Levy fallback contamination, apply all 99 source migrations, verify clean schema.

## 2. Prerequisites Verified (from P1)

| Gate | Result |
|------|--------|
| Docker PG16 reachable on 5432 | PASS — `terrafusion-postgres-dev` container up |
| Old `terrafusion` DB untouched | PASS — 0 tables, exists, not dropped |
| Native PG17 on 5433 untouched | PASS — no commands issued against port 5433 |

## 3. Databases Created

| Database | Purpose | State |
|----------|---------|-------|
| `terrafusion_dev_clean` | New clean dev DB | 27/99 migrations applied, 126 tables |
| `terrafusion_levy` | Isolated Levy target | Created, empty (0 tables) |

Extensions installed on `terrafusion_dev_clean`:
- `uuid-ossp` 1.1
- `vector` 0.8.2
- `plpgsql` 1.0

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

If no `LevyDatabase` is configured, `levyConn` is null → existing `string.IsNullOrWhiteSpace(levyConn)` guard at line 2483 routes to SQLite fallback. Levy migrations never touch DefaultConnection.

### 4b. Connection Strings (`appsettings.Development.json`)

- `DefaultConnection` database changed: `terrafusion` → `terrafusion_dev_clean`
- `LevyDatabase` added: targets `terrafusion_levy` on port 5432

`appsettings.Development.local.json` updated identically (NOT committed — contains real PACS SA password).

## 5. Migration Application

**Command used:**
```
dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API --context TerraFusionDbContext
```

**Result**: 27 of 99 migrations applied successfully, then FAILED.

### Applied Migrations (27)

| # | MigrationId | Status |
|---|-------------|--------|
| 1 | 20251027125937_InitialCreate | PASS |
| 2 | 20251105062912_GuidMigration_UserIdCountyId | PASS |
| 3 | 20260317074518_AddDaisEntities | PASS |
| 4 | 20260318153801_ActivateAiPersistence | PASS |
| 5 | 20260318175411_EnableNativeVectorColumn | PASS |
| 6 | 20260322214202_AddPacsEntities | PASS |
| 7 | 20260323005858_WidenPacsLegalDesc | PASS |
| 8 | 20260323013214_WidenLandDetailDecimals | PASS |
| 9 | 20260323050815_AddPacsOwnerVal | PASS |
| 10 | 20260323145606_AddPacsTaxAreaAssoc | PASS |
| 11 | 20260403233438_AddComparableSaleRawPacsCodes | PASS |
| 12 | 20260404043901_MapPacsValuationHoodCd | PASS |
| 13 | 20260404052159_RefactorQualification3Layer | PASS |
| 14 | 20260404065951_AddPacsFullSaleTable | PASS |
| 15 | 20260404150731_AddPacsLookupTables | PASS |
| 16 | 20260404160600_R2Wave41_ComparableSale_QualityImprvType | PASS |
| 17 | 20260404210406_AddReetWacCodesLookup | PASS |
| 18 | 20260405005422_FixImprvDetailDecimalOverflow | PASS |
| 19 | 20260405031430_FixPacsSaleDecimalOverflow | PASS |
| 20 | 20260405062618_AddPacsLevyTables | PASS |
| 21 | 20260406085642_AddComparableSalesYearDateIndex | PASS |
| 22 | 20260413150134_AddCalibrationWorkbench | PASS |
| 23 | 20260413182704_AddSaleRecordOutlierExclusion | PASS |
| 24 | 20260413234914_AddGisParcelGeometries | PASS |
| 25 | 20260414183858_AddCamaNeighborhoodAbsSubdv | PASS |
| 26 | 20260416191219_AddCityAndStratumToCama | PASS |
| 27 | 20260416200709_AddSecondaryFeaturePctToCostMatrix | PASS |

### Blocker: Migration #28

**Migration**: `20260418074714_AddPropertyAssessmentAuditFields`
**Error**: `42701: column "SecondaryFeaturePctOfBiv" of relation "CostMatrices" already exists`

**Root cause**: Pre-existing duplicate `AddColumn` in the migration chain.

- Migration #27 (`AddSecondaryFeaturePctToCostMatrix`) adds `SecondaryFeaturePctOfBiv` to `CostMatrices` — **succeeds**.
- Migration #28 (`AddPropertyAssessmentAuditFields`) ALSO contains `AddColumn<decimal>("SecondaryFeaturePctOfBiv", "CostMatrices")` at line 180 — **fails** because the column already exists.

This is NOT caused by P2 changes. It is a pre-existing defect in the source migration chain that would affect ANY clean database bootstrap.

**Why this wasn't caught before**: The existing `terrafusion` DB was built incrementally over time. If migration #28 was generated while `SecondaryFeaturePctOfBiv` was temporarily removed or if the model snapshot was stale when #28 was scaffolded, the duplicate would have been invisible during incremental development but fatal on a clean apply.

### Migration #28 Scope (beyond the duplicate column)

The blocked migration also contains these non-duplicate operations that have NOT been applied:
- Add audit fields to `PropertyAssessments` (CreatedAt, CreatedBy, UpdatedAt, UpdatedBy)
- Alter precision on `Properties` columns (MarketValue, LandValue, ImprovementValue → numeric(18,2))
- Add 11 new columns to `Properties` (LegalDescription, LotDepth, LotWidthFront, Neighborhood, PropertyUseCode, SitusCity, SitusState, SitusZip, TaxDistrictCode, TaxDistrictName, Zoning)
- Add columns to `pacs_levy_tax_area_assocs` (FundId)
- Add columns to `pacs_levy_rates` (EndYear, PrimaryFundNumber, VotedLevyAmount, VotedLevyRate)
- Add `PacsPropId` to `ComparableSales`
- Create 4 new tables: `pacs_levy_cert_agg_limits`, `pacs_levy_cert_const_limits`, `pacs_levy_cert_data`, `pacs_levy_cert_highest_lawful` (with indexes)

## 6. Verification Gates

| # | Gate | Result |
|---|------|--------|
| 1 | `terrafusion_dev_clean` exists on Docker PG16 | PASS |
| 2 | `terrafusion_levy` exists on Docker PG16 | PASS |
| 3 | Extensions (uuid-ossp, vector) installed | PASS |
| 4 | Old `terrafusion` DB untouched (0 tables) | PASS |
| 5 | Native PG17 on 5433 untouched | PASS — no commands issued |
| 6 | Levy fallback removed from Program.cs | PASS |
| 7 | LevyDatabase connection string added | PASS |
| 8 | All 99 migrations applied | **BLOCKED** — 27/99, defect at #28 |
| 9 | Backend builds clean | PASS — 0 warnings, 0 errors |

## 7. Operator Decision Required

The migration chain defect blocks completion of P2 gate 8. All resolution paths conflict with the approved P2 constraints:

| Option | Action | Blocked By |
|--------|--------|------------|
| A | Remove duplicate `AddColumn` from migration #28 | "Do not alter migration files" |
| B | Insert #28's MigrationId into `__EFMigrationsHistory` + apply remaining DDL manually | "Do not edit __EFMigrationsHistory" + "manual schema edits" NOT APPROVED |
| C | Generate a fixup migration that catches the duplicate | "Do not generate new migrations" |
| D | Drop `terrafusion_dev_clean` and re-bootstrap after fix | "Do not drop any database" |

**Recommended resolution** (requires operator approval to expand P2 scope):

**Option A** — edit migration #28 to wrap the duplicate `AddColumn` in an `IF NOT EXISTS` guard or simply remove lines 180-184. This is the smallest, most honest fix: the migration file has a bug, fix the bug. It does not change the migration's intended schema outcome (the column already exists from #27). All 72 remaining migrations can then apply normally.

Alternatively: if the operator prefers not to touch migration files, a new P3 work order can be created specifically for the migration chain repair, and P2 can be closed as "BLOCKED — 27/99, Levy fix delivered."

## 8. Files Changed (to commit)

| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/Program.cs` | Levy fallback removal (lines 2471-2472) |
| `backend/src/TerraFusion.API/appsettings.Development.json` | DefaultConnection → dev_clean, add LevyDatabase |
| `docs/data/DB_BOOTSTRAP_EXEC_P2_RESULTS.md` | This document |

**NOT committed** (local-only, contains real passwords):
- `backend/src/TerraFusion.API/appsettings.Development.local.json`

## 9. What P2 Delivered

Despite the migration blocker, P2 delivered concrete value:

1. **Levy contamination vector eliminated** — `DefaultConnection` fallback removed; Levy context now fails loud or falls back to SQLite, never touches the main DB.
2. **Clean dev DB created** — `terrafusion_dev_clean` with 126 tables from 27 migrations, proving the first ~27% of the migration chain is healthy.
3. **Levy DB isolated** — `terrafusion_levy` exists as dedicated target.
4. **Migration chain defect surfaced** — duplicate `AddColumn` at migration #28 documented with exact root cause and resolution options. This defect was invisible during incremental development and would block any future clean bootstrap.
5. **Connection strings updated** — dev environment now targets clean DB by default.
