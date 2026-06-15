# WO-DATA-003: Seed/Fixture Provenance Audit

**Date**: 2026-06-15
**Database**: `terrafusion_dev_clean` (Docker PG16, port 5432)
**Status**: COMPLETE — read-only audit, zero mutations
**Method**: Source-code analysis via grep/read; no scripts executed; no DB touched

---

## 1. Summary

| Metric | Value |
|--------|-------|
| Seed/fixture files audited | 46+ |
| Backend seeder classes | 8 |
| IHostedService auto-seeders | 4 (3 doctrine + 1 PACS dictionary) |
| Dev-only auto-seeders (Program.cs) | 5 (DevPropertySeeder, DevGovernmentUserSeeder, SaleRecordSeeder, GPTConfigurationSeeder, DatabaseSeeder.SeedDossierRuntimeDataAsync) |
| SQL files with INSERT outside QUARANTINE | 23 |
| Fabricated data files (county demo SQL) | 10 |
| Frontend mock/fixture files | ~15 (no DB impact) |
| Environment control flags | 2 (TF_SKIP_DEV_SEEDERS, TF_RUN_DEV_PROPERTY_PROJECTION) |
| **Auto-seed risk to terrafusion_dev_clean** | **MODERATE** |

---

## 2. Complete Inventory

### 2.1 Backend Seeder Classes (backend/src/TerraFusion.API/Seeds/)

| File | Class | Classification | Auto-Run | Data Type |
|------|-------|---------------|----------|-----------|
| `DatabaseSeeder.cs` | DatabaseSeeder | **B — Fabricated** | Via SeedDossierRuntimeDataAsync (Dev startup) | 3 fake Benton properties (BENTON-001/002/003), 1 fake county, fake addresses |
| `DevPropertySeeder.cs` | DevPropertySeeder | **B — Fabricated** | Dev startup if Properties empty AND TF_SKIP_DEV_SEEDERS not set | Projects PACS mirror → canonical Properties; seeds "106 Oakmont Ct" fixture with full detail rows |
| `DevGovernmentUserSeeder.cs` | DevGovernmentUserSeeder | **B — Fabricated** | Dev startup (same block as DevPropertySeeder) | 1 fake admin user (admin@terrafusionmarket.com) |
| `SaleRecordSeeder.cs` | SaleRecordSeeder | **B — Fabricated** | Dev startup (same block) | 120 synthetic sale records with fake parcel IDs, fake ratios, fake outliers |
| `PacsDataSeeder.cs` | PacsDataSeeder | **C — Real import** | NO — `--seed-pacs` CLI only | Full 13-table Harris PACS ETL pipeline |
| `PacsCanonicalizer.cs` | PacsCanonicalizer | **C — Real import** | NO — called by PacsDataSeeder | PACS mirror → canonical domain entities |

### 2.2 Backend AI Seeders (backend/src/TerraFusion.AI/Seeds/)

| File | Class | Classification | Auto-Run | Data Type |
|------|-------|---------------|----------|-----------|
| `GPTConfigurationSeeder.cs` | GPTConfigurationSeeder | **B — Fabricated** | Dev startup if shouldSkipStartupSeeders is false | GPT model configs (PropertyAssessmentGPT etc.) into AI tables |

### 2.3 Doctrine Hosted Services (backend/src/TerraFusion.Data/Services/Doctrine/)

| File | Class | Classification | Auto-Run | Data Type |
|------|-------|---------------|----------|-----------|
| `DoctrinePropertyUniverseSeeder.cs` + `*HostedService.cs` | DoctrinePropertyUniverseSeederHostedService | **A — Allowed governance** | YES — all environments | 6 universe classification rules (REAL_RESIDENTIAL, REAL_COMMERCIAL, etc.) |
| `DoctrineRatioPolicySeeder.cs` + `*HostedService.cs` | DoctrineRatioPolicySeederHostedService | **A — Allowed governance** | YES — all environments | County ratio policy rules |
| `SalesQualificationCodesSeeder.cs` + `*HostedService.cs` | SalesQualificationCodesSeederHostedService | **A — Allowed governance** | YES — all environments | 3 sales qualification code rules (DOR convention, legacy carryover, internal ratio) |

### 2.4 PACS Dictionary Hosted Service

| File | Class | Classification | Auto-Run | Data Type |
|------|-------|---------------|----------|-----------|
| `backend/.../PacsImprvAttr/ImprvAttrDictionaryRefreshHostedService.cs` | ImprvAttrDictionaryRefreshHostedService | **A — Allowed governance** | YES (guarded by shouldSkipStartupSeeders) | Reads PACS imprv_attr codes into in-memory dictionary; non-fatal if PACS unreachable |

### 2.5 Program.cs Auto-Seed Registration

**Location**: `backend/src/TerraFusion.API/Program.cs`

**Startup seed block (lines ~3562-3587)** — runs when `IsDevelopment() && !shouldSkipDevSeeders`:
1. `DevPropertySeeder.SeedAsync()` — projects from PACS mirror; inserts "106 Oakmont Ct" fixture
2. `DevPropertySeeder.EnsureFixturesAsync()` — seeds 3 fake properties via DatabaseSeeder
3. `DevGovernmentUserSeeder.SeedAsync()` — seeds 1 fake admin user
4. `SaleRecordSeeder.SeedAsync()` — seeds 120 synthetic sale records

**GPT seed block (lines ~2656-2680)** — runs when `!shouldSkipStartupSeeders`:
5. `GPTConfigurationSeeder.SeedAllGPTsAsync()` — seeds GPT model configs

**Dossier seed block (lines ~2687-2704)** — runs when `IsDevelopment() && !shouldSkipStartupSeeders`:
6. `DatabaseSeeder.SeedDossierRuntimeDataAsync()` — seeds Counties + 3 fake Properties

**Hosted services (lines ~1850-1937)** — registered when `!shouldSkipStartupSeeders`:
7. `DoctrineRatioPolicySeederHostedService`
8. `DoctrinePropertyUniverseSeederHostedService`
9. `SalesQualificationCodesSeederHostedService`
10. `ImprvAttrDictionaryRefreshHostedService`

### 2.6 SQL Files with INSERT Statements (outside QUARANTINE)

| File | Classification | Content |
|------|---------------|---------|
| `scripts/production/initial-benton-import.sql` | **B — Fabricated** | 20 fake parcels + DO block generating 980 more fake parcels into `harris_import.pacs_parcels` |
| `scripts/init-db.sql` | **B — Fabricated** | Creates non-EF schema (auth/core/analytics/ai), inserts sample properties, users, AI models |
| `database/migrations/002_BentonCountyData.sql` | **B — Fabricated** | INSERT 10+ sample Benton parcels, users, tax districts |
| `database/migrations/001_InitialSchema.sql` | **B — Fabricated** | Schema + sample INSERT rows |
| `database/migrations/001_harris_pacs_import.sql` | **B — Fabricated** | Harris import schema + sample rows |
| `database/init/01-marketplace-platform.sql` | **B — Fabricated** | Marketplace schema + sample plugin data |
| `database/schema/01_core_tables.sql` | **B — Fabricated** | Core schema + sample INSERT rows |
| `data/databases/county-databases/clark_data.sql` | **B — Fabricated** | Demo data for Clark County |
| `data/databases/county-databases/cowlitz_data.sql` | **B — Fabricated** | Demo data for Cowlitz County |
| `data/databases/county-databases/grant_data.sql` | **B — Fabricated** | Demo data for Grant County |
| `data/databases/county-databases/island_data.sql` | **B — Fabricated** | Demo data for Island County |
| `data/databases/county-databases/sanjuan_data.sql` | **B — Fabricated** | Demo data for San Juan County |
| `data/databases/county-databases/snohomish_data.sql` | **B — Fabricated** | Demo data for Snohomish County |
| `data/databases/county-databases/spokane_data.sql` | **B — Fabricated** | Demo data for Spokane County |
| `data/databases/county-databases/stevens_data.sql` | **B — Fabricated** | Demo data for Stevens County |
| `data/databases/county-databases/whatcom_data.sql` | **B — Fabricated** | Demo data for Whatcom County |
| `data/databases/county-databases/yakima_data.sql` | **B — Fabricated** | Demo data for Yakima County |
| `backend/src/TerraFusion.Levy/Migrations/Levy_Schema_And_Seed.sql` | **F — Review** | Levy schema DDL + EF migration history INSERT; no property data |
| `backend/src/TerraFusion.Levy/Migrations/InitialLevy.sql` | **F — Review** | Levy schema + EF migration history |
| `backend/init-scripts/01-pgvector.sql` | **A — Allowed** | `CREATE EXTENSION IF NOT EXISTS vector;` only |
| `config/postgresql/setup-replication.sql` | **A — Allowed** | Replication config only |
| `backend/ai-models/.../data-migration-plan.sql` | **F — Review** | Migration plan with INSERT examples |
| `backend/migration_schema.sql` | **F — Review** | Schema snapshot with INSERT into __EFMigrationsHistory |

### 2.7 Shell Scripts

| File | Classification | Risk |
|------|---------------|------|
| `scripts/seed-benton-database.sh` | **B — Fabricated** | Runs `dotnet run` + seeds via .NET; targets `terrafusion_production` DB name |
| `scripts/test-import.mjs` | **C — Real import** | Test harness for import |

### 2.8 Frontend Mocks/Fixtures (No DB Impact)

| Path | Classification |
|------|---------------|
| `frontend/apps/os-shell/src/data/fixtures/FixtureDataProvider.ts` | **D — Frontend only** |
| `frontend/apps/os-shell/src/__mocks__/` | **D — Frontend only** |
| `frontend/apps/os-shell/src/__tests__/fixtures/` | **D — Frontend only** |
| `frontend/apps/os-shell/src/pages/notice/fixtures/` | **D — Frontend only** |
| `frontend/components-enhanced/demo/` | **D — Frontend only** |
| `frontend/components-enhanced/county-demos/` | **D — Frontend only** |
| `frontend/apps/os-shell/src/testUtils/mockTelemetryStore.ts` | **D — Frontend only** |

---

## 3. Environment Control Flags

### 3.1 TF_SKIP_DEV_SEEDERS

**Controls**: All dev seeders (DevPropertySeeder, DevGovernmentUserSeeder, SaleRecordSeeder, GPTConfigurationSeeder, Dossier seed) AND all doctrine hosted services.

**Check location**: `Program.cs:164` — `ShouldSkipDevSeeders(args)` method.

**Accepts**: env var `TF_SKIP_DEV_SEEDERS` = "true"/"1"/"yes" OR CLI arg `--skip-dev-seeders`.

**Default**: NOT SET → seeders WILL run in Development.

**Docker compose**: NOT SET in any docker-compose file.

### 3.2 TF_RUN_DEV_PROPERTY_PROJECTION

**Controls**: Bulk PACS→Properties projection inside DevPropertySeeder.

**Default**: NOT SET → bulk projection disabled (only fixture seeding runs).

### 3.3 ASPNETCORE_ENVIRONMENT

**Controls**: Whether dev seed block executes at all.

**Docker compose**: Set to "Development" → dev seeders are ACTIVE.

---

## 4. Auto-Seed Risk Assessment

### CRITICAL PATH: What happens on `dotnet run` against terrafusion_dev_clean

If the API starts in Development mode WITHOUT `TF_SKIP_DEV_SEEDERS=true`:

1. **Doctrine hosted services run** → seed governance rules into doctrine_tf tables (ALLOWED)
2. **ImprvAttrDictionaryRefreshHostedService runs** → reads from PACS (non-fatal if unreachable; writes to in-memory dictionary only)
3. **GPTConfigurationSeeder runs** → inserts GPT model configs into AI tables (FABRICATED)
4. **DatabaseSeeder.SeedDossierRuntimeDataAsync runs** → inserts 1 fake county + 3 fake properties (FABRICATED)
5. **DevPropertySeeder.SeedAsync runs** → if Properties empty, seeds "106 Oakmont Ct" fixture (FABRICATED)
6. **DevPropertySeeder.EnsureFixturesAsync runs** → seeds 3 more fake properties via DatabaseSeeder (FABRICATED)
7. **DevGovernmentUserSeeder runs** → inserts 1 fake admin user (FABRICATED)
8. **SaleRecordSeeder runs** → inserts 120 synthetic sale records (FABRICATED)

**Total fabricated data if unguarded**: ~125+ rows across Properties, GovernmentUsers, SaleRecords, Counties, GPT config tables.

### MITIGATION

Set `TF_SKIP_DEV_SEEDERS=true` before starting the API. This disables ALL auto-seeders including doctrine hosted services.

**Trade-off**: Doctrine rules won't auto-seed either. They must be seeded via a separate mechanism (dedicated startup flag or manual API call).

---

## 5. Classification Legend

| Code | Meaning | Action |
|------|---------|--------|
| **A** | Allowed reference/doctrine seed | KEEP — governance rules, not fake parcel data |
| **B** | Fabricated sample/demo data | QUARANTINE — do not run against clean DB |
| **C** | Real import infrastructure | KEEP — do not run until WO-DATA-004 |
| **D** | Frontend mock only | KEEP — no DB impact |
| **E** | Dangerous auto-seed risk | GUARD — requires environment flag |
| **F** | Unknown / needs review | REVIEW — classify before use |

---

No mutations performed. No scripts executed. All analysis from source code reads.
