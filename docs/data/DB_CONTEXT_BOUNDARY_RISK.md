# DB Context Boundary Risk Analysis

**Work Order:** WO-DATA-001R  
**Date:** 2026-06-13  
**Type:** READ-ONLY analysis (no schema/data mutations)

---

## Executive Summary

TerraFusion has **3 DbContext classes** targeting **2 databases** with **1 shared connection string fallback**. This creates cross-context contamination where LevyDbContext migrations are recorded in the main `terrafusion` database, entity types are duplicated across contexts, and the CurrentUseDbContext has never been migrated at all.

---

## 1. Context Inventory

### TerraFusionDbContext (Primary)

| Property | Value |
|---|---|
| **Location** | `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` |
| **DbSet count** | 220 |
| **Target database** | `terrafusion` |
| **Migration count (source)** | 99 |
| **Migration count (DB)** | 107 (includes 4 Levy cross-context) |
| **Schemas used** | public, legacy_pacs_raw, truth_pacs, canonical_tf, gis_tf, sync, sync_atlas, sync_bridge, sync_mapping, doctrine |
| **Registration in Program.cs** | Registered **10 times** (5 SQLite + 5 Npgsql pairs across conditional blocks). Only the last registration wins at runtime. |

### LevyDbContext

| Property | Value |
|---|---|
| **Location** | `backend/src/TerraFusion.Levy/Data/LevyDbContext.cs` |
| **DbSet count** | 9 |
| **Target database** | `terrafusion_levy` (when `LevyDatabase` conn string is set) |
| **Fallback database** | `terrafusion` (when `LevyDatabase` is NOT set — uses `DefaultConnection`) |
| **Migration count (source)** | 4 |
| **Migration count (DB, terrafusion_levy)** | 4 |
| **Migration count (DB, terrafusion, contamination)** | 4 |

### CurrentUseDbContext

| Property | Value |
|---|---|
| **Location** | `backend/src/TerraFusion.CurrentUse/Data/CurrentUseDbContext.cs` |
| **DbSet count** | 4 |
| **Target database** | Not configured — no registration found in Program.cs |
| **Migration count (source)** | 1 (`20260522_InitialCreate`) |
| **Migration count (DB)** | 0 — never migrated, no `currentuse` schema exists |

---

## 2. Entity Overlap Analysis

### Shared entity: `LevyCertification`

`LevyCertification` is registered as a DbSet in **both** contexts:

- `TerraFusionDbContext`: `public DbSet<LevyCertification> LevyCertifications { get; set; }`
- `LevyDbContext`: `public DbSet<LevyCertification> LevyCertifications => Set<LevyCertification>();`

**Risk:** If both contexts target the same database (via DefaultConnection fallback), EF will attempt to manage the same table from two independent migration chains. The table will be created by whichever context's migration runs first; the second will either fail or skip silently depending on `IF NOT EXISTS` guards.

### Naming collision: PacsLevy* vs Levy*

TerraFusionDbContext has PACS-sourced levy entities that are structurally distinct from LevyDbContext's entities:

| TerraFusionDbContext | LevyDbContext | Same table? |
|---|---|---|
| `PacsLevyRate` | `LevyRate` | No — different entities, different tables |
| `PacsLevyCertificationData` | `LevyCertification` | No — different entities |
| `PacsLevyCertificationHighestLawful` | — | No counterpart |
| `PacsLevyCertificationConstitutionalLimit` | — | No counterpart |
| `PacsLevyCertificationAggregateLimit` | — | No counterpart |
| `TaxLevy` | `LevyMeasure` | No — different entities |
| — | `District` | No counterpart in main |
| — | `DistrictParcel` | No counterpart in main |
| — | `LevyScenario` | No counterpart in main |
| — | `RevenueProjection` | No counterpart in main |
| — | `ReferenceSource` | No counterpart in main |
| — | `BankedCapacity` | No counterpart in main |

**Risk:** LOW for naming. The PacsLevy* entities are PACS-sourced raw data; the Levy* entities are TerraFusion-native levy management. They serve different purposes and map to different tables. The exception is `LevyCertification` which appears in both (see above).

---

## 3. Cross-Context Contamination Detail

### How it happens

```
Program.cs line 2469-2474:

builder.Services.AddDbContext<LevyDbContext>(options =>
{
  var levyConn = Environment.GetEnvironmentVariable("LEVY_DATABASE_URL")
                ?? builder.Configuration.GetConnectionString("LevyDatabase")
                ?? builder.Configuration.GetConnectionString("DefaultConnection")
                ?? Environment.GetEnvironmentVariable("DATABASE_URL");
```

When `LEVY_DATABASE_URL` and `LevyDatabase` connection strings are both absent, LevyDbContext falls through to `DefaultConnection`, which points to the `terrafusion` database.

### What it created

In the `terrafusion` database:
1. **4 entries in `__EFMigrationsHistory`** — the Levy migration IDs are recorded as applied
2. **Levy tables in `public` schema** — `Districts`, `LevyMeasures`, `LevyScenarios`, `RevenueProjections`, `LevyRates`, `DistrictParcels`, `ReferenceSources`, `LevyCertifications`, `BankedCapacities`
3. **Same tables also exist in `terrafusion_levy`** — the intended target database

### Impact on TerraFusionDbContext

- EF's `__EFMigrationsHistory` table is shared per-database, not per-context. The 4 Levy entries inflate TerraFusionDbContext's apparent migration count from 103 to 107.
- `dotnet ef migrations list --context TerraFusionDbContext` will show these 4 Levy migrations as "applied" even though they belong to LevyDbContext.
- Future `dotnet ef migrations add` on TerraFusionDbContext will see the Levy tables as "unmanaged" and may try to drop them in a new migration.

---

## 4. init-db.sql Overlap

`scripts/init-db.sql` creates tables via raw SQL that may overlap with EF-managed entities:

| SQL Table | Schema | EF Counterpart? |
|---|---|---|
| `auth.users` | auth | Potentially overlaps with GovernmentUsers |
| `core.properties` | core | Potentially overlaps with Properties (public schema) |
| `public.notebooks` | public | No clear EF counterpart |
| `ai.conversations` | ai | No clear EF counterpart |
| `ai.messages` | ai | No clear EF counterpart |
| `analytics.events` | analytics | No clear EF counterpart |

**Risk:** MEDIUM. If `init-db.sql` is run on the same database as EF migrations, the `auth.users` and `core.properties` tables will either conflict or create schema-isolated duplicates. The `auth`, `core`, and `analytics` schemas were NOT created by EF migrations — they come only from `init-db.sql`.

**Recommendation:** Audit whether `init-db.sql` tables are actively used. If so, decide whether they should be EF-managed (add to TerraFusionDbContext) or SQL-script-managed (exclude from EF). Currently they are SQL-script-managed but undocumented.

---

## 5. CurrentUseDbContext Risk

### Current state

- 1 migration file exists: `20260522_InitialCreate.cs`
- No `currentuse` schema exists in any database
- Not registered in `Program.cs` — the context is defined but never wired into DI
- 4 entities: `Classification`, `InterestRate`, `Removal`, `CurrentUseAuditEntry`

### Risks

1. **No target database decision** — Will CurrentUse share `terrafusion` (new schema) or get its own database?
2. **Migration naming** — Uses non-standard timestamp format (`20260522` vs EF convention `20260522HHMMSS`). May cause EF tooling errors.
3. **No DI registration** — Any code referencing `CurrentUseDbContext` will fail at runtime with DI resolution errors.

### Recommendation

CurrentUseDbContext should either be:
- **Promoted:** Add DI registration in Program.cs with explicit `currentuse` schema in `terrafusion` database
- **Deferred:** Leave as-is until current-use functionality is actively developed

No action needed for reconciliation — it's inert.

---

## 6. Risk Summary Matrix

| Risk | Severity | Likelihood | Impact |
|---|---|---|---|
| Levy cross-context migration history pollution | MEDIUM | Already occurred | Confuses EF tooling; inflates migration count |
| `LevyCertification` entity in both contexts | HIGH | On next migration | Duplicate table management; potential DROP |
| init-db.sql / EF overlap | MEDIUM | On fresh deploy | Schema conflicts if both run |
| CurrentUse never migrated | LOW | When feature is built | Must decide target DB first |
| TerraFusionDbContext registered 10 times | LOW | Always | Only last registration wins; cosmetic noise |
| Source-only migrations blocking `database update` | HIGH | On next EF update | Chain break; cannot apply without reconciliation |

---

## 7. Remediation Checklist (for WO-DATA-002)

1. [ ] **Set `LevyDatabase` connection string** in all appsettings — prevent future Levy→terrafusion fallback
2. [ ] **Delete 4 Levy entries from `terrafusion.__EFMigrationsHistory`** — removes cross-context contamination
3. [ ] **Decide Levy table fate in `terrafusion`** — either DROP the duplicate Levy tables from `terrafusion.public` (keeping only `terrafusion_levy`) or keep them and remove from `terrafusion_levy`
4. [ ] **Audit `LevyCertification` dual registration** — remove from one context
5. [ ] **Audit init-db.sql tables** — decide EF-managed vs SQL-managed
6. [ ] **Register or defer CurrentUseDbContext** — explicit decision
7. [ ] **Collapse TerraFusionDbContext registrations** — reduce from 10 to 1 conditional block

---

**Classification:** Development Infrastructure Analysis  
**Depends on:** WO-DATA-001  
**Next:** WO-DATA-002 (execute remediation after operator decision on reconciliation path)
