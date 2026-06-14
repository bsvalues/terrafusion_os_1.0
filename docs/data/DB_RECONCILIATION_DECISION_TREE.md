# DB Reconciliation Decision Tree

**Work Order:** WO-DATA-001R  
**Date:** 2026-06-13  
**Type:** Decision framework (no schema/data mutations)

---

## Purpose

This document provides a decision tree for the operator to choose a reconciliation path for the migration divergence documented in WO-DATA-001 and WO-DATA-001R. Each decision point has a clear question, the available options, and the consequences of each choice.

---

## Decision 0: Is PostgreSQL accepting connections?

```
PostgreSQL TCP on port 5432?
├── YES → proceed to Decision 1
└── NO  → STOP. Fix PostgreSQL first.
            Check: pg_hba.conf, listen_addresses, service status.
            No reconciliation work can proceed without DB access.
```

**Current status:** PostgreSQL Windows service is running but refusing TCP connections. This must be resolved before any reconciliation work.

---

## Decision 1: Backup before anything

```
Do you have a fresh pg_dump of both databases?
├── YES → proceed to Decision 2
└── NO  → RUN THESE FIRST:
            pg_dump -h localhost -U postgres -d terrafusion -Fc > terrafusion_backup_$(date +%Y%m%d).dump
            pg_dump -h localhost -U postgres -d terrafusion_levy -Fc > terrafusion_levy_backup_$(date +%Y%m%d).dump
            Then proceed to Decision 2.
```

---

## Decision 2: Choose reconciliation approach

```
Which approach fits your situation?

A) SNAPSHOT RESET (recommended for solo-dev)
   - Collapse all 107 applied migrations into a single baseline
   - Fresh start for migration chain going forward
   - Lose per-migration rollback history
   - Fastest to execute (~1 hour)
   → Go to Path A

B) CHAIN REPAIR
   - Recover all 19 DB-only migration source files
   - Insert or remove 11 source-only entries
   - Preserve full migration history
   - Highest effort (~4 hours)
   → Go to Path B

C) HYBRID (merge feature branch + cleanup)
   - Merge feat/ws1-forge-cost-reference to main first
   - Then handle remaining 5+11 divergent entries
   - Medium effort (~2 hours after merge)
   → Go to Path C
```

---

## Path A: Snapshot Reset

### Step A1: Enumerate exact DB state

```sql
-- Run against terrafusion database
SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
-- Save output as evidence artifact
```

### Step A2: Remove Levy contamination

```sql
-- Remove 4 Levy cross-context entries
DELETE FROM "__EFMigrationsHistory"
WHERE "MigrationId" IN (
  '20260418045322_InitialLevy',
  '20260418050107_AddLevyCertificationAndBankedCapacity',
  '20260427190328_SeedLevyData',
  '20260427190440_AddReferenceSources'
);
-- Verify: should now show 103 rows
SELECT COUNT(*) FROM "__EFMigrationsHistory";
```

### Step A3: Generate schema dump

```bash
pg_dump -h localhost -U postgres -d terrafusion --schema-only > terrafusion_schema_current.sql
```

### Step A4: Clear migration history

```sql
-- DANGEROUS: removes all migration tracking
-- Only do this if you have the pg_dump backup from Decision 1
DELETE FROM "__EFMigrationsHistory";
```

### Step A5: Create baseline migration

```bash
cd backend/src
# Remove all existing migration files (keep snapshot)
rm TerraFusion.Data/Migrations/2*.cs
rm TerraFusion.Data/Migrations/2*.Designer.cs

# Generate fresh snapshot + empty baseline
dotnet ef migrations add BaselineReset --project TerraFusion.Data --startup-project TerraFusion.API

# Edit the generated migration: empty Up() and Down() methods
# (the DB already has all tables — no schema changes needed)
```

### Step A6: Mark baseline as applied

```sql
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('YYYYMMDDHHMMSS_BaselineReset', '8.0.0');
```

### Step A7: Verify

```bash
dotnet ef migrations list --project TerraFusion.Data --startup-project TerraFusion.API
# Should show: BaselineReset (Applied)
```

### Step A8: Set LevyDatabase connection string

Add to all appsettings files:
```json
{
  "ConnectionStrings": {
    "LevyDatabase": "Host=localhost;Database=terrafusion_levy;Username=postgres;Password=devpassword123;Port=5432"
  }
}
```

---

## Path B: Chain Repair

### Step B1: Enumerate exact DB-only list

Same as Step A1 — query `__EFMigrationsHistory` and cross-reference with source files.

### Step B2: Recover feature branch migration files

```bash
# For each of the 10 known feature-branch migrations:
git show feat/ws1-forge-cost-reference:backend/src/TerraFusion.Data/Migrations/<file>.cs > backend/src/TerraFusion.Data/Migrations/<file>.cs
git show feat/ws1-forge-cost-reference:backend/src/TerraFusion.Data/Migrations/<file>.Designer.cs > backend/src/TerraFusion.Data/Migrations/<file>.Designer.cs
```

### Step B3: Investigate remaining 5 DB-only

```bash
# Search all remote branches for the missing migration files
git log --all --oneline -- 'backend/src/TerraFusion.Data/Migrations/*<partial_name>*'
```

### Step B4: Handle 11 source-only

For each source-only migration, decide:
```
Is this migration's schema change already in the DB (applied via a different path)?
├── YES → Insert into __EFMigrationsHistory as applied (empty Up/Down)
└── NO  → This migration needs to actually run
          ├── Safe to apply? → dotnet ef database update --target <migrationId>
          └── Conflicts? → Rewrite migration to be idempotent (IF NOT EXISTS)
```

### Step B5: Rebuild model snapshot

```bash
# After all source files are aligned:
dotnet ef migrations add SnapshotVerify --project TerraFusion.Data --startup-project TerraFusion.API
# If Up() is empty → snapshot matches DB → delete this migration
# If Up() has content → snapshot diverged → investigate
```

### Step B6: Clean Levy contamination

Same as Step A2.

### Step B7: Set LevyDatabase connection string

Same as Step A8.

---

## Path C: Hybrid

### Step C1: Merge feature branch

```bash
git checkout main
git merge feat/ws1-forge-cost-reference
# Resolve any conflicts in migration files
```

### Step C2: Recount divergence

After merge, main will have 109 source migrations (99 + 10 from feature branch). The divergence shrinks to:
- DB-only: 9 (4 Levy + 5 unknown)
- Source-only: 11 (unchanged — these were on main before the merge)

### Step C3: Handle remaining 9 DB-only

Same as Steps B3 (investigate 5 unknown) + A2 (remove 4 Levy).

### Step C4: Handle 11 source-only

Same as Step B4.

### Step C5: Verify and set Levy connection

Same as Steps B5 + A8.

---

## Common Cleanup (all paths)

### Levy duplicate tables in `terrafusion`

```
Do you want to keep Levy tables in BOTH databases?
├── YES → No action. Accept the duplication. Note: data may diverge between the two copies.
└── NO  → Which copy is authoritative?
          ├── terrafusion_levy → DROP the public.Districts, etc. from terrafusion
          └── terrafusion → DROP from terrafusion_levy and remove LevyDbContext
```

**Recommendation:** Keep `terrafusion_levy` as authoritative. Drop the duplicate Levy tables from `terrafusion.public`. Set `LevyDatabase` connection string to prevent future contamination.

### LevyCertification dual registration

```
LevyCertification exists in both TerraFusionDbContext and LevyDbContext.
├── Remove from TerraFusionDbContext → Levy operations use LevyDbContext exclusively
└── Remove from LevyDbContext → All entities managed by one context (simpler, but Levy loses independence)
```

**Recommendation:** Remove from TerraFusionDbContext. LevyCertification belongs with the Levy domain.

### init-db.sql audit

```
For each init-db.sql table (auth.users, core.properties, public.notebooks, ai.*, analytics.*):
├── Table is actively used at runtime → Move to EF management (add entity + migration) OR keep as SQL-managed (document explicitly)
└── Table is NOT used → DROP and remove from init-db.sql
```

### CurrentUseDbContext decision

```
Is current-use functionality being actively developed?
├── YES → Register in Program.cs with explicit schema. Decide target DB.
│         ├── Same database (terrafusion, schema=currentuse) → Add connection + migration
│         └── Separate database (terrafusion_currentuse) → Add connection string + migration
└── NO  → Leave as-is. No action until feature development begins.
```

---

## Success Criteria

After reconciliation, all of these must be true:

1. `dotnet ef migrations list --context TerraFusionDbContext` shows only TerraFusionDbContext migrations, all as "Applied"
2. `dotnet ef migrations add VerifyClean` generates an empty Up() and Down() — model snapshot matches live DB
3. No Levy migration IDs in `terrafusion.__EFMigrationsHistory`
4. `LevyDatabase` connection string is set in all appsettings
5. `dotnet build TerraFusion.sln` succeeds with 0 errors
6. All existing tests pass (no regressions)

---

## Estimated Effort

| Path | Effort | Risk | Best for |
|---|---|---|---|
| A: Snapshot Reset | ~1 hour | LOW | Solo dev, no production deploy |
| B: Chain Repair | ~4 hours | MEDIUM | Multi-dev team, production history needed |
| C: Hybrid | ~2 hours (after merge) | MEDIUM | Feature branch merge is planned anyway |

---

**Classification:** Development Infrastructure Decision Framework  
**Depends on:** WO-DATA-001, WO-DATA-001R (divergence + context boundary reports)  
**Next:** Operator chooses path → WO-DATA-002 executes it
