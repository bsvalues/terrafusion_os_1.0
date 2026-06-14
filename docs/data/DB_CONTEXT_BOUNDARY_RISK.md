# DB Context Boundary Risk Analysis

**Work Order:** WO-DATA-001R  
**Date:** 2026-06-13  
**Type:** READ-ONLY analysis (no schema/data mutations)

---

## Executive Summary

TerraFusion has **3 DbContext classes** targeting **2 databases** with **1 shared connection string fallback**. This creates cross-context contamination where LevyDbContext migrations are recorded in the main `terrafusion` database, entity types are duplicated across contexts, and the CurrentUseDbContext has never been migrated at all.

---

## 1. TerraFusionDbContext Authority Boundary

| Property | Value |
|---|---|
| **Location** | `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` |
| **DbSet count** | 220 |
| **Target database** | `terrafusion` |
| **Migration count (source)** | 99 |
| **Migration count (DB)** | 107 (includes 4 Levy cross-context) |
| **Schemas managed** | public, legacy_pacs_raw, truth_pacs, canonical_tf, gis_tf, sync, sync_atlas, sync_bridge, sync_mapping, doctrine |
| **Registration in Program.cs** | **10 times** (5 SQLite + 5 Npgsql conditional pairs — only last wins at runtime) |
| **Migration history table** | `terrafusion.public.__EFMigrationsHistory` |
| **Should share or separate DB?** | **Primary authority** — owns the `terrafusion` database exclusively |

### Authority violations
- 4 Levy migration entries in this context's `__EFMigrationsHistory` (cross-context contamination)
- `LevyCertification` entity registered in both this context and LevyDbContext
- init-db.sql creates tables in `auth`, `core`, `ai`, `analytics` schemas outside this context's management

---

## 2. LevyDbContext Authority Boundary

| Property | Value |
|---|---|
| **Location** | `backend/src/TerraFusion.Levy/Data/LevyDbContext.cs` |
| **DbSet count** | 9 |
| **Intended target database** | `terrafusion_levy` |
| **Actual target database** | `terrafusion_levy` (when LevyDatabase set) OR `terrafusion` (DefaultConnection fallback) |
| **Migration count (source)** | 4 |
| **Migration count (terrafusion_levy DB)** | 4 |
| **Migration count (terrafusion DB, contamination)** | 4 |
| **Schemas managed** | public (within terrafusion_levy) |
| **Registration in Program.cs** | Once — with 4-level fallback chain: `LEVY_DATABASE_URL` → `LevyDatabase` → `DefaultConnection` → `DATABASE_URL` |
| **Migration history table** | `terrafusion_levy.public.__EFMigrationsHistory` (intended) AND `terrafusion.public.__EFMigrationsHistory` (contamination) |
| **Should share or separate DB?** | **Separate** — `terrafusion_levy` is the intended target. DefaultConnection fallback must be removed. |

### Authority violations
- Migrations applied to BOTH `terrafusion` and `terrafusion_levy` databases
- `LevyCertification` entity dual-registered in both this context and TerraFusionDbContext
- Levy tables exist in both databases (structural duplicates)

### Connection string fallback chain (Program.cs lines 2469-2474)
```csharp
var levyConn = Environment.GetEnvironmentVariable("LEVY_DATABASE_URL")
            ?? builder.Configuration.GetConnectionString("LevyDatabase")
            ?? builder.Configuration.GetConnectionString("DefaultConnection")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL");
```

**The fallback to `DefaultConnection` is the root cause of all Levy contamination.** When neither `LEVY_DATABASE_URL` nor `LevyDatabase` is set in the environment or appsettings, LevyDbContext silently targets the main `terrafusion` database.

---

## 3. CurrentUseDbContext Authority Boundary

| Property | Value |
|---|---|
| **Location** | `backend/src/TerraFusion.CurrentUse/Data/CurrentUseDbContext.cs` |
| **DbSet count** | 4 (Classifications, InterestRates, Removals, AuditEntries) |
| **Target database** | **Not configured** — no registration in Program.cs |
| **Migration count (source)** | 1 (`20260522_InitialCreate`) |
| **Migration count (DB)** | 0 — never migrated, no `currentuse` schema exists |
| **Schemas managed** | None (never migrated) |
| **Registration in Program.cs** | **Not registered** — no DI wiring |
| **Migration history table** | None — no target DB decided |
| **Should share or separate DB?** | **Decision required.** Options: (a) `terrafusion` with `currentuse` schema, (b) separate `terrafusion_currentuse`, (c) defer until feature development begins |

### Authority violations
- Migration file uses non-standard timestamp format (`20260522` vs EF convention `20260522HHMMSS`)
- No DI registration means any attempt to inject CurrentUseDbContext fails at runtime

---

## 4. Share vs. Separate Database Decision

| Context | Recommended Target | Rationale |
|---|---|---|
| TerraFusionDbContext | `terrafusion` (exclusive) | 220 DbSets, primary application context, owns all 10+ schemas |
| LevyDbContext | `terrafusion_levy` (separate, explicit) | Already has its own database. The fallback path that contaminates `terrafusion` must be removed. Levy is a domain module with independent lifecycle. |
| CurrentUseDbContext | **Defer** — no runtime use yet | Only 4 entities, never migrated, not registered in DI. Decide when current-use functionality is actively developed. If sharing `terrafusion`, use a dedicated `currentuse` schema. |

---

## 5. Migration History Table Ownership

EF Core stores applied migrations in `__EFMigrationsHistory` — **one table per database, shared across all contexts targeting that database.**

| Database | Owns `__EFMigrationsHistory`? | Contexts Writing To It | Should Be Writing |
|---|---|---|---|
| `terrafusion` | Yes | TerraFusionDbContext + LevyDbContext (contamination) | TerraFusionDbContext only |
| `terrafusion_levy` | Yes | LevyDbContext | LevyDbContext only |
| N/A (CurrentUse) | No table exists | None | None until target DB decided |

### Current state
- `terrafusion.__EFMigrationsHistory` has **107 rows**: 103 from TerraFusionDbContext + 4 from LevyDbContext contamination
- `terrafusion_levy.__EFMigrationsHistory` has **4 rows**: all from LevyDbContext (correct)
- No CurrentUse migration history exists anywhere

### Problem
EF cannot distinguish which context applied a given migration entry. When `dotnet ef migrations list --context TerraFusionDbContext` queries `terrafusion.__EFMigrationsHistory`, it sees all 107 rows and treats the 4 Levy entries as TerraFusionDbContext migrations. This:
- Inflates the apparent migration count
- May cause `dotnet ef migrations add` to generate incorrect diffs (seeing Levy tables as "unmanaged" and trying to drop them)
- Makes `dotnet ef database update` unreliable (chain includes foreign context entries)

---

## 6. Risk of Context Cross-Contamination

| Risk | Severity | Current State | Trigger |
|---|---|---|---|
| Levy migrations applied to main DB | **ALREADY OCCURRED** | 4 Levy entries in `terrafusion.__EFMigrationsHistory` | Missing `LevyDatabase` connection string |
| LevyCertification managed by both contexts | HIGH | Entity registered in both DbContexts | Next `migrations add` on either context |
| init-db.sql creates tables in EF-managed DB | MEDIUM | 6 tables in auth/core/ai/analytics schemas | Fresh deploy where both init-db.sql and EF run |
| CurrentUse accidentally targets main DB | LOW | Not registered in DI (inert) | Someone registers it without explicit connection string |
| Future new contexts using DefaultConnection | MEDIUM | Only Levy has the fallback pattern | Copy-paste of Levy's registration pattern |

### Entity Overlap Detail

| Entity | TerraFusionDbContext? | LevyDbContext? | Same Table? | Risk |
|---|---|---|---|---|
| LevyCertification | Yes (DbSet) | Yes (DbSet) | Yes — both map to `LevyCertifications` | HIGH — dual management |
| PacsLevyRate | Yes | No | No — maps to different table than LevyRate | LOW — different entities |
| PacsLevyCertificationData | Yes | No | No — different from LevyCertification | LOW |
| District | No | Yes | N/A | None |
| LevyMeasure | No | Yes | N/A | None |
| LevyScenario | No | Yes | N/A | None |
| RevenueProjection | No | Yes | N/A | None |
| BankedCapacity | No | Yes | N/A | None |
| ReferenceSource | No | Yes | N/A | None |

---

## 7. Required Rule Before Future Migrations

After reconciliation (WO-DATA-002+), the following rules MUST be enforced:

### Rule 1: One Context → One Migration History

Each DbContext class must target exactly one database. That database's `__EFMigrationsHistory` must contain entries from that context only.

| Context | Target DB | Migration History |
|---|---|---|
| TerraFusionDbContext | `terrafusion` | `terrafusion.__EFMigrationsHistory` (TF entries only) |
| LevyDbContext | `terrafusion_levy` | `terrafusion_levy.__EFMigrationsHistory` (Levy entries only) |
| CurrentUseDbContext | TBD | Separate history when decided |

### Rule 2: One Explicit Target DB/Schema

Every DbContext registration in `Program.cs` must use an explicit, non-fallback connection string. No `?? DefaultConnection` chains.

```csharp
// WRONG — fallback contaminates main DB
var conn = config.GetConnectionString("LevyDatabase")
        ?? config.GetConnectionString("DefaultConnection");

// RIGHT — fail-loud if not configured
var conn = config.GetConnectionString("LevyDatabase")
        ?? throw new InvalidOperationException("LevyDatabase connection string is required");
```

### Rule 3: No Shared DefaultConnection Ambiguity

`DefaultConnection` must target exactly one database (`terrafusion`). No other context may fall back to it. If a context's connection string is missing, the application must fail at startup, not silently target the wrong database.

### Rule 4: Verify Before Migrate

Before running `dotnet ef migrations add` or `dotnet ef database update`:
1. Run `dotnet ef migrations list --context <ContextName>` and verify the list matches expectations
2. Check that `__EFMigrationsHistory` contains only entries from the target context
3. Verify the model snapshot matches the live DB schema

---

## 8. Remediation Checklist (for WO-DATA-002)

1. [ ] **Set `LevyDatabase` connection string** in all appsettings — prevent future Levy→terrafusion fallback
2. [ ] **Replace Levy fallback chain** — remove `?? DefaultConnection` from LevyDbContext registration; use fail-loud
3. [ ] **Remove 4 Levy entries from `terrafusion.__EFMigrationsHistory`** (SELECT-verify first, then DELETE)
4. [ ] **Decide Levy table fate in `terrafusion`** — DROP the duplicate Levy tables from `terrafusion.public` (keeping `terrafusion_levy` as authoritative)
5. [ ] **Remove `LevyCertification` from TerraFusionDbContext** — belongs to Levy domain only
6. [ ] **Audit init-db.sql tables** — decide EF-managed vs SQL-managed per table
7. [ ] **Register or defer CurrentUseDbContext** — explicit decision with explicit connection
8. [ ] **Collapse TerraFusionDbContext registrations** — reduce from 10 conditional pairs to 1 clear block

---

**Classification:** Development Infrastructure Analysis  
**Status:** BLOCKED FOR FORWARD MIGRATIONS  
**Depends on:** WO-DATA-001 (PR #1006, merged)  
**Next:** WO-DATA-002 (execute remediation after operator decision on reconciliation path)
