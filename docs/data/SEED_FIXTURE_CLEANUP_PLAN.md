# WO-DATA-003: Seed/Fixture Cleanup Plan

**Date**: 2026-06-15
**Status**: PROPOSED — no changes made; operator approval required before execution
**Prerequisite**: SEED_FIXTURE_PROVENANCE_AUDIT.md + SEED_FIXTURE_POLICY.md

---

## 1. Summary

This plan classifies every seed/fixture path and recommends a specific action. No cleanup has been executed — this is documentation only.

---

## 2. Immediate Guards (Block contamination of terrafusion_dev_clean)

### 2.1 Environment Flag Documentation

**Action**: Document that `TF_SKIP_DEV_SEEDERS=true` is REQUIRED when running the API against `terrafusion_dev_clean`.

**Where**: README, appsettings docs, docker-compose comments.

**Risk if not done**: First `dotnet run` in Development mode will insert ~125 fabricated rows.

### 2.2 Docker Compose Guard

**Action**: Add `TF_SKIP_DEV_SEEDERS: "true"` to backend service environment in `backend/docker-compose.yml`.

**Current state**: NOT set — docker-compose starts in Development mode and WILL auto-seed.

**Priority**: HIGH — prevents accidental contamination via `docker-compose up`.

---

## 3. File-Level Cleanup Recommendations

### 3.1 No Action Required (Keep As-Is)

| File | Reason |
|------|--------|
| `backend/src/TerraFusion.Data/Services/Doctrine/*Seeder*.cs` | Category A — governance rules |
| `backend/src/TerraFusion.Data/Services/PacsImprvAttr/ImprvAttrDictionaryRefreshHostedService.cs` | Category A — in-memory dictionary |
| `backend/src/TerraFusion.API/Seeds/PacsDataSeeder.cs` | Category C — real import infra, CLI-only |
| `backend/src/TerraFusion.API/Seeds/PacsCanonicalizer.cs` | Category C — real import infra |
| `backend/init-scripts/01-pgvector.sql` | Category A — extension only |
| `config/postgresql/setup-replication.sql` | Category A — infra only |
| `frontend/apps/os-shell/src/data/fixtures/*` | Category D — frontend only |
| `frontend/apps/os-shell/src/__mocks__/*` | Category D — frontend only |
| `frontend/apps/os-shell/src/__tests__/fixtures/*` | Category D — frontend only |
| `frontend/components-enhanced/demo/*` | Category D — frontend only |

### 3.2 Document as Fabricated (Add Warning Headers)

These files contain fabricated data that could be mistaken for real Benton County data.

| File | Recommended Action |
|------|-------------------|
| `scripts/production/initial-benton-import.sql` | Add header: `-- WARNING: FABRICATED DEMO DATA — NOT real Harris PACS export` |
| `scripts/init-db.sql` | Add header: `-- WARNING: FABRICATED SCHEMA + SAMPLE DATA — superseded by EF Core migrations` |
| `database/migrations/002_BentonCountyData.sql` | Add header: `-- WARNING: FABRICATED DEMO DATA — NOT real county data` |
| `database/migrations/001_InitialSchema.sql` | Add header: `-- WARNING: FABRICATED — superseded by EF Core migrations` |
| `database/init/01-marketplace-platform.sql` | Add header: `-- WARNING: FABRICATED — sample marketplace data` |
| `scripts/seed-benton-database.sh` | Add header: `# WARNING: Seeds FABRICATED data — do NOT run against terrafusion_dev_clean` |

### 3.3 Document as Demo-Only (Add Warning Headers)

| File | Recommended Action |
|------|-------------------|
| `data/databases/county-databases/*.sql` (10 files) | Add header: `-- WARNING: FABRICATED DEMO DATA — generated for sales demos, NOT real county data` |

### 3.4 Review Before Use

| File | Issue | Recommended Action |
|------|-------|-------------------|
| `backend/src/TerraFusion.Levy/Migrations/Levy_Schema_And_Seed.sql` | Contains Levy schema DDL + __EFMigrationsHistory INSERT | Verify this is not auto-executed; Levy context was removed in WO-DATA-002A |
| `backend/ai-models/.../data-migration-plan.sql` | Contains example INSERT statements | Label as planning document, not executable |
| `backend/migration_schema.sql` | Schema snapshot with __EFMigrationsHistory INSERT | Label as reference snapshot |

### 3.5 Dev Seeder Code — Keep But Guard

These seeders should NOT be deleted (they serve development workflows). They should be guarded.

| File | Current Guard | Recommended |
|------|-------------|-------------|
| `backend/src/TerraFusion.API/Seeds/DatabaseSeeder.cs` | `TF_SKIP_DEV_SEEDERS` | Sufficient |
| `backend/src/TerraFusion.API/Seeds/DevPropertySeeder.cs` | `TF_SKIP_DEV_SEEDERS` + `TF_RUN_DEV_PROPERTY_PROJECTION` | Sufficient |
| `backend/src/TerraFusion.API/Seeds/DevGovernmentUserSeeder.cs` | `TF_SKIP_DEV_SEEDERS` (implicit via Program.cs block) | Sufficient |
| `backend/src/TerraFusion.API/Seeds/SaleRecordSeeder.cs` | `TF_SKIP_DEV_SEEDERS` (implicit via Program.cs block) | Sufficient |
| `backend/src/TerraFusion.AI/Seeds/GPTConfigurationSeeder.cs` | `shouldSkipStartupSeeders` | Sufficient |

---

## 4. Architectural Recommendation: Split Skip Flag

**Current**: `TF_SKIP_DEV_SEEDERS=true` disables BOTH fabricated seeders AND doctrine hosted services.

**Problem**: To protect `terrafusion_dev_clean` from fabricated data, you must also disable governance rule seeding.

**Proposed (future WO)**: Refactor `Program.cs` so doctrine hosted services are registered unconditionally (they're idempotent and safe). Only gate the dev-fabricated seeders behind `TF_SKIP_DEV_SEEDERS`.

**Scope**: This is a code change beyond WO-DATA-003's docs-only mandate. Defer to a future WO or handle as part of WO-DATA-004 prep.

---

## 5. Changes Made by WO-DATA-003

| Change | File | Type |
|--------|------|------|
| Created | `docs/data/SEED_FIXTURE_PROVENANCE_AUDIT.md` | New doc |
| Created | `docs/data/SEED_FIXTURE_POLICY.md` | New doc |
| Created | `docs/data/SEED_FIXTURE_CLEANUP_PLAN.md` | New doc (this file) |
| **No source code changes** | — | — |
| **No SQL executed** | — | — |
| **No DB mutations** | — | — |

---

## 6. Verification Checklist

- [ ] `terrafusion_dev_clean` has 231 tables, 0 data rows (unchanged from WO-DATA-002B)
- [ ] No source code was modified
- [ ] No seed scripts were executed
- [ ] No migrations were created or applied
- [ ] PR is docs-only (3 new .md files)

---

## 7. Gate for WO-DATA-004

WO-DATA-004 (CAMA/PACS Import Contract Proof) **CAN proceed** once:

1. This audit is reviewed and accepted by operator
2. `TF_SKIP_DEV_SEEDERS=true` is documented as required for clean DB startup
3. The operator decides whether to split the skip flag (§4) before or after WO-DATA-004

WO-DATA-004 will use ONLY the Sync drain pipeline (PacsDataSeeder via `--seed-pacs` or the lane-specific drain endpoints) against real Harris PACS data. No fabricated seeders will be involved.

---

No mutations performed. Planning document only.
