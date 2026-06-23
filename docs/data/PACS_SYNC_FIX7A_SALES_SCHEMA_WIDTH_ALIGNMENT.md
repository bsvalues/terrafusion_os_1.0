# WO-DATA-004B-FIX7A — Sales Raw Schema Width Alignment

**Work Order:** WO-DATA-004B-FIX7A
**Date:** 2026-06-18
**Worktree:** `C:\Users\bsval\tf-fix4-owner` (migration generated and applied here)
**Branch:** `docs/wo-data-004b-fix2a-pacs-copy-evidence` (evidence branch)
**Status:** COMPLETE — migration applied, schema aligned

---

## Mission

Generate and apply the missing EF migration that aligns `legacy_pacs_raw.sale` WAC/ratio
code column widths with existing EF configuration. Unblocks WO-DATA-004B-FIX7B (retry
controlled sales drain).

No sales drain was run. No other lanes touched.

---

## Root Cause (from FIX7)

`legacy_pacs_raw.sale.WacCd` was `varchar(8)` in the database. PACS `wac_cd` values are
Washington State RCW/WAC exemption codes up to 19+ characters. The EF configuration
(`LegacyPacsRawSaleConfiguration.cs`) already had the correct widths from SYNC-POP-2
finding #6, but no EF migration had been generated to apply those widths to the DB.

A migration file `20260504000000_WidenLegacyPacsRawSaleCodeColumns.cs` existed in the
Migrations folder but had no companion `.Designer.cs` file — EF Core cannot load or apply
a migration without its Designer file. The model snapshot had already been updated to
reflect the wider columns (varchar(32)/varchar(10)), so the schema gap was invisible to
normal `dotnet ef migrations list`.

---

## Pre-Migration Column Widths

Confirmed from `information_schema.columns` before migration:

| Column | Pre-Width | EF Config MaxLength | Gap |
|---|---|---|---|
| `WacCd` | `varchar(8)` | 32 | ❌ Overflowing PACS data |
| `SlCountyRatioCd` | `varchar(8)` | 10 | ⚠️ Behind config |
| `SlRatioTypeCd` | `varchar(8)` | 8 | ✅ Matches |

---

## Migration Generated

**Migration:** `20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment`
**Files created:**
- `Migrations/20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment.cs`
- `Migrations/20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment.Designer.cs`

**Technique:** Temporarily reverted the `LegacyPacsRawSale` entity in the model snapshot
to `varchar(8)` for `WacCd` and `SlCountyRatioCd`, ran `dotnet ef migrations add`, which
detected the delta and generated the correct `AlterColumn` Up migration. EF auto-restored
the snapshot to the correct widths as part of the generation.

**Command:**

```bash
dotnet ef migrations add AddLegacyPacsRawSaleCodeWidthAlignment \
  --project src/TerraFusion.Data/TerraFusion.Data.csproj \
  --startup-project src/TerraFusion.API/TerraFusion.API.csproj \
  --context TerraFusionDbContext
```

### Migration Scope Inspection

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AlterColumn<string>(
        name: "WacCd",
        schema: "legacy_pacs_raw",
        table: "sale",
        type: "character varying(32)",
        maxLength: 32,
        nullable: true,
        oldClrType: typeof(string),
        oldType: "character varying(8)",
        oldMaxLength: 8,
        oldNullable: true);

    migrationBuilder.AlterColumn<string>(
        name: "SlCountyRatioCd",
        schema: "legacy_pacs_raw",
        table: "sale",
        type: "character varying(10)",
        maxLength: 10,
        nullable: true,
        oldClrType: typeof(string),
        oldType: "character varying(8)",
        oldMaxLength: 8,
        oldNullable: true);
}
```

**Scope verdict:** CLEAN — 2 AlterColumn operations only. No table creates. No drops.
No unrelated columns. No other schemas touched.

---

## Migration Applied

**Command:**

```bash
dotnet ef database update AddLegacyPacsRawSaleCodeWidthAlignment \
  --project src/TerraFusion.Data/TerraFusion.Data.csproj \
  --startup-project src/TerraFusion.API/TerraFusion.API.csproj \
  --context TerraFusionDbContext
```

**Output:** `Applying migration '20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment'. Done.`

---

## Post-Migration Column Widths

Confirmed from `information_schema.columns` after migration:

| Column | Post-Width | EF Config MaxLength | Status |
|---|---|---|---|
| `WacCd` | `varchar(32)` | 32 | ✅ Aligned |
| `SlCountyRatioCd` | `varchar(10)` | 10 | ✅ Aligned |
| `SlRatioTypeCd` | `varchar(8)` | 8 | ✅ Unchanged |

---

## Migration List — No Pending

```
...
20260616060820_AddForgeCostReference
20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment
```

All migrations applied. Pending count = 0.

---

## Build Verification

`dotnet build src/TerraFusion.Data/TerraFusion.Data.csproj` → **0 errors, 0 warnings** ✅

Full API build (MSB3021 file lock errors expected — running API holds DLLs on port 5046;
these are not compile errors). `TerraFusion.Data` builds clean independently.

---

## Orphaned Migration File

`20260504000000_WidenLegacyPacsRawSaleCodeColumns.cs` remains in the Migrations folder.
It has no `.Designer.cs` and will not be applied by EF. It is historical evidence of
SYNC-POP-2 finding #6. It does not interfere with the new migration or migration chain.
No action required.

---

## Sales Drain Not Rerun

Per work order rules: "Do not run the sales drain after the migration."
FIX7B (retry controlled sales drain) is the next work order and requires separate operator approval.

---

## Source Integrity

| Check | Status |
|---|---|
| `tf_mssql_data` Docker volume: NOT mutated | ✅ |
| Original PACS source: NOT touched | ✅ |
| `terrafusion_dev_clean`: only schema widened, 0 data rows changed | ✅ |
| `__EFMigrationsHistory`: 1 new row added by EF database update | ✅ Normal |
| No manual INSERT/UPDATE/DELETE/TRUNCATE/DROP | ✅ |
| No fake dev seeders ran | ✅ |
| No sales drain run | ✅ |

---

## Files Changed

| File | Change |
|---|---|
| `src/TerraFusion.Data/Migrations/20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment.cs` | New — migration Up/Down |
| `src/TerraFusion.Data/Migrations/20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment.Designer.cs` | New — EF Designer snapshot |
| `src/TerraFusion.Data/Migrations/TerraFusionDbContextModelSnapshot.cs` | Updated by EF — WacCd/SlCountyRatioCd widths confirmed at varchar(32)/varchar(10) |

---

## Final Report

| Field | Value |
|---|---|
| RESULT | **COMPLETE** |
| FILES_CHANGED | 3 (2 new migration files + model snapshot updated by EF) |
| PRE_WIDTHS | `WacCd` varchar(8), `SlCountyRatioCd` varchar(8), `SlRatioTypeCd` varchar(8) |
| EF_CONFIG_WIDTHS | `WacCd` 32, `SlCountyRatioCd` 10, `SlRatioTypeCd` 8 |
| MIGRATION | `20260618172539_AddLegacyPacsRawSaleCodeWidthAlignment` |
| MIGRATION_SCOPE | 2 AlterColumn only — `WacCd` varchar(8)→32, `SlCountyRatioCd` varchar(8)→10 |
| POST_WIDTHS | `WacCd` varchar(32), `SlCountyRatioCd` varchar(10), `SlRatioTypeCd` varchar(8) |
| DB_APPLY_STATUS | Applied — Done |
| PENDING_MIGRATIONS | 0 |
| SALES_DRAIN_RERUN | No — stopped per work order |
| PR_OR_LOCAL_ARTIFACT | Local branch `docs/wo-data-004b-fix2a-pacs-copy-evidence`, this file |
| NEXT_WORK_ORDER | WO-DATA-004B-FIX7B — Retry Controlled Sales Drain (awaiting operator approval) |
