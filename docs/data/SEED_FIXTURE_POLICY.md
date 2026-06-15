# WO-DATA-003: Seed/Fixture Policy

**Date**: 2026-06-15
**Scope**: What is allowed to populate `terrafusion_dev_clean`
**Status**: LOCKED — operator-approved policy for DB data governance

---

## 1. Policy Summary

`terrafusion_dev_clean` must remain data-empty except for:
- EF Core migrations (schema only)
- Doctrine/governance reference rules (Category A)
- Real PACS data via Sync drains (WO-DATA-004, not before)

**All fabricated/demo/sample property data is FORBIDDEN.**

---

## 2. Allowed Data Sources

### 2.1 EF Core Migrations — ALLOWED

88 migrations applied during WO-DATA-002A. Schema-only. No data rows.

### 2.2 Doctrine Reference Seeders — ALLOWED

These seed governance rules (classification logic, ratio policies, qualification codes). They are NOT fake property data.

| Seeder | Tables | Data |
|--------|--------|------|
| DoctrinePropertyUniverseSeeder | doctrine_tf.tf_doctrine_property_universe | 6 universe classification rules |
| DoctrineRatioPolicySeeder | doctrine_tf.tf_doctrine_ratio_policy | County ratio policy rules |
| SalesQualificationCodesSeeder | doctrine_tf.tf_doctrine_sales_qualification_codes | 3 sales qualification codes |

**Conditions**:
- Must be idempotent (deterministic GUIDs, check-before-insert)
- Must not insert property/owner/sales/assessment rows
- Must be traceable (seeder class name in logs)

### 2.3 PACS/Sync Drains — ALLOWED only under WO-DATA-004

Real data from Harris PACS 9.0 via the Sync drain pipeline. Not before WO-DATA-004.

### 2.4 ImprvAttrDictionaryRefresh — ALLOWED

Reads from PACS into in-memory dictionary only. No DB writes to terrafusion_dev_clean. Non-fatal if PACS unreachable.

---

## 3. Forbidden Data Sources

### 3.1 Dev Property Seeders — FORBIDDEN

| Seeder | Reason |
|--------|--------|
| DevPropertySeeder | Seeds fake "106 Oakmont Ct" fixture + PACS mirror projection |
| DatabaseSeeder.SeedDossierRuntimeDataAsync | Seeds fake county + 3 fake properties (BENTON-001/002/003) |
| DatabaseSeeder.SeedBentonProperties | Seeds fake addresses ("123 Main St", "456 Columbia Dr", "789 Wine Country Rd") |
| DevGovernmentUserSeeder | Seeds fake admin user (admin@terrafusionmarket.com) |
| SaleRecordSeeder | Seeds 120 synthetic sale records with fake ratios and outliers |
| GPTConfigurationSeeder | Seeds AI model configs (not property data, but still fabricated) |

### 3.2 SQL Seed Files — FORBIDDEN

| File | Reason |
|------|--------|
| `scripts/production/initial-benton-import.sql` | 1000 fabricated parcels into `harris_import.pacs_parcels` |
| `scripts/init-db.sql` | Non-EF schema + sample data |
| `database/migrations/002_BentonCountyData.sql` | Fabricated Benton parcels |
| `database/migrations/001_InitialSchema.sql` | Sample INSERT rows |
| `database/init/01-marketplace-platform.sql` | Sample plugin data |
| `data/databases/county-databases/*.sql` | Demo county data (10 counties) |

### 3.3 Shell Seed Scripts — FORBIDDEN

| Script | Reason |
|--------|--------|
| `scripts/seed-benton-database.sh` | Runs .NET seeders; targets terrafusion_production |

---

## 4. Required Environment Guards

### 4.1 TF_SKIP_DEV_SEEDERS

**MUST be set to `true`** when starting the API against `terrafusion_dev_clean`.

```bash
# Required for clean DB protection
TF_SKIP_DEV_SEEDERS=true dotnet run --project backend/src/TerraFusion.API
```

**Problem**: This flag also disables doctrine hosted services. See §5 for resolution.

### 4.2 Recommended: Separate Doctrine Flag

The current `TF_SKIP_DEV_SEEDERS` is a blunt instrument — it disables both fabricated seeders AND doctrine hosted services.

**Recommended for WO-DATA-004 or future**: Split into two flags:
- `TF_SKIP_DEV_SEEDERS=true` — disables fabricated property/user/sale seeders
- Doctrine hosted services should NOT be gated by the dev-seeder flag

**Current workaround**: Set `TF_SKIP_DEV_SEEDERS=true`, then manually trigger doctrine seeders via API endpoints or a dedicated startup mode.

---

## 5. Decision Matrix

| Data Category | Allowed in terrafusion_dev_clean? | When? | Guard |
|--------------|----------------------------------|-------|-------|
| EF migrations (schema) | YES | WO-DATA-002A (done) | N/A |
| Doctrine rules | YES | Startup with hosted services | Separate from dev seeders |
| Real PACS data via Sync | YES | WO-DATA-004 only | Explicit drain command |
| Fabricated properties | **NO** | Never | TF_SKIP_DEV_SEEDERS=true |
| Fabricated users | **NO** | Never | TF_SKIP_DEV_SEEDERS=true |
| Fabricated sale records | **NO** | Never | TF_SKIP_DEV_SEEDERS=true |
| GPT model configs | **NO** | Never in clean DB | TF_SKIP_DEV_SEEDERS=true |
| Demo county SQL files | **NO** | Never | Don't execute |
| Frontend mocks | N/A | N/A | No DB impact |

---

## 6. Verification

After any API startup against `terrafusion_dev_clean`, verify:

```sql
-- Must return 0 for all governed tables
SELECT 'Properties' as tbl, COUNT(*) FROM public."Properties"
UNION ALL SELECT 'GovernmentUsers', COUNT(*) FROM public."GovernmentUsers"
UNION ALL SELECT 'SaleRecords', COUNT(*) FROM public."SaleRecords"
UNION ALL SELECT 'Counties', COUNT(*) FROM public."Counties";

-- Doctrine tables MAY have rows (governance rules = allowed)
SELECT 'doctrine_universe', COUNT(*) FROM doctrine_tf.tf_doctrine_property_universe
UNION ALL SELECT 'doctrine_ratio', COUNT(*) FROM doctrine_tf.tf_doctrine_ratio_policy
UNION ALL SELECT 'doctrine_sales_qual', COUNT(*) FROM doctrine_tf.tf_doctrine_sales_qualification_codes;
```

---

No mutations performed. Policy document only.
