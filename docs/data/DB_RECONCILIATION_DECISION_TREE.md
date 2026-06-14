# DB Reconciliation Decision Tree

**Work Order:** WO-DATA-001R  
**Date:** 2026-06-13  
**Type:** Decision framework (no schema/data mutations)

---

## Purpose

Provides a decision tree with 6 reconciliation paths for the migration divergence documented in WO-DATA-001. Each path includes: when valid, risk level, required proof, forbidden shortcuts, rollback strategy, and recommendation.

---

## Prerequisite Decisions

### Decision 0: Is PostgreSQL accepting TCP connections?

```
PostgreSQL TCP on port 5432?
├── YES → proceed to Decision 1
└── NO  → STOP. Fix PostgreSQL first.
            Check: pg_hba.conf listen_addresses, postgresql.conf port,
            Windows service postgresql-x64-17 status, firewall rules.
            No reconciliation work can proceed without DB access.
```

**Current status (2026-06-13):** Service `postgresql-x64-17` is Running but refusing TCP connections. This must be resolved first.

### Decision 1: Backup before anything

```
Do you have a fresh pg_dump of BOTH databases?
├── YES → proceed to Decision 2
└── NO  → RUN THESE FIRST (PowerShell):
            $env:PGPASSWORD = "<password>"
            & "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
              -h localhost -p 5432 -U postgres -d terrafusion -Fc `
              -f "terrafusion_backup_20260613.dump"
            & "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
              -h localhost -p 5432 -U postgres -d terrafusion_levy -Fc `
              -f "terrafusion_levy_backup_20260613.dump"
            Remove-Item Env:\PGPASSWORD
            Then proceed to Decision 2.
```

---

## Decision 2: Choose Reconciliation Path

```
A) Restore missing DB-only migration source files into main
B) Mark local DB as contaminated, rebuild clean dev DB from source
C) Create a new clean dev DB under explicit name, archive old DB     ← RECOMMENDED
D) Manually edit __EFMigrationsHistory to force alignment
E) Split Levy/CurrentUse migration histories explicitly
F) Create a formal baseline migration (snapshot reset)
```

Note: Path E (Levy/CurrentUse split) is a prerequisite cleanup step for most other paths. It can be combined with any of A-D or F.

---

## Path A: Restore Missing DB-Only Migration Files Into Source

### When valid
- You intend to merge `feat/ws1-forge-cost-reference` to main soon
- You want to preserve the full migration chain history
- You can identify all 19 DB-only migrations and recover their source files

### Risk level: MEDIUM

### Steps
1. Merge `feat/ws1-forge-cost-reference` to main (brings 10 of 15 feature migrations)
2. For remaining 5 unknown DB-only migrations:
   - Query `__EFMigrationsHistory` for exact MigrationIds
   - Search all remote branches: `git log --all --oneline -- 'backend/src/TerraFusion.Data/Migrations/*<partial>*'`
   - Recover source files via `git show <branch>:<path>`
3. For the 11 source-only migrations:
   - Verify which are already represented in the DB by equivalent schema
   - Mark as applied if schema equivalent: `INSERT INTO "__EFMigrationsHistory"` with empty Up/Down
   - Or remove source files if superseded
4. Run `dotnet ef migrations list` and verify all entries show "Applied"
5. Run `dotnet ef migrations add VerifyClean` — Up() and Down() must be empty

### Required proof
- [ ] All 107 DB MigrationIds enumerated (live query)
- [ ] All 19 DB-only source files recovered or accounted for
- [ ] All 11 source-only verified against live DB schema
- [ ] `dotnet ef migrations add VerifyClean` produces empty migration

### Forbidden shortcuts
- Do NOT delete source-only migrations without verifying the DB has equivalent schema
- Do NOT insert into `__EFMigrationsHistory` without confirming the migration's schema changes exist
- Do NOT run `dotnet ef database update` until chain is fully aligned

### Rollback strategy
- Restore from pg_dump backup
- `git reset --hard` to pre-merge state

### Recommendation: NOT RECOMMENDED
Too many unknowns (5 unidentified DB-only, 11 source-only needing per-migration analysis). High effort with moderate risk of chain corruption.

---

## Path B: Mark Local DB as Contaminated, Rebuild Clean Dev DB From Source

### When valid
- The local DB is a dev artifact, not a production system
- PACS is the source of truth for all property data (can re-drain)
- You want a clean EF chain without historical baggage

### Risk level: LOW

### Steps
1. **Rename** the contaminated DB: `ALTER DATABASE terrafusion RENAME TO terrafusion_contaminated_20260613;`
2. **Create** new DB: `CREATE DATABASE terrafusion;`
3. **Set LevyDatabase connection string** in appsettings.Development.local.json BEFORE running migrations
4. **Run all 99 source migrations**: `dotnet ef database update --context TerraFusionDbContext`
5. **Run Levy migrations separately**: `dotnet ef database update --context LevyDbContext`
6. **Verify**: `dotnet ef migrations list` shows 99 Applied, 0 Pending
7. **Re-drain PACS data** into clean DB (separate work order)

### Required proof
- [ ] pg_dump of old `terrafusion` completed before rename
- [ ] New `terrafusion` has exactly 99 entries in `__EFMigrationsHistory`
- [ ] `terrafusion_levy` has exactly 4 entries (no contamination in new DB)
- [ ] `dotnet ef migrations add VerifyClean` produces empty migration
- [ ] Application starts and connects successfully

### Forbidden shortcuts
- Do NOT drop the old database — rename and archive it
- Do NOT skip setting LevyDatabase connection string (will re-contaminate)
- Do NOT run init-db.sql until deciding which tables are needed

### Rollback strategy
- Rename `terrafusion_contaminated_20260613` back to `terrafusion`
- Drop the new (failed) `terrafusion`

### Recommendation: GOOD — simple, low risk, but requires re-draining all PACS data

---

## Path C: Create New Clean Dev DB Under Explicit Name, Archive Old DB

### When valid
- Same as Path B, plus you want to keep the old DB accessible for comparison without renaming
- Preferred when you want both databases available simultaneously during transition

### Risk level: LOW (RECOMMENDED)

### Steps
1. **Create** new DB with explicit name: `CREATE DATABASE terrafusion_dev_clean;`
2. **Update connection strings** in `appsettings.Development.local.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=terrafusion_dev_clean;Username=postgres;Password=devpassword123;Port=5432",
       "LevyDatabase": "Host=localhost;Database=terrafusion_levy;Username=postgres;Password=devpassword123;Port=5432"
     }
   }
   ```
3. **Run all 99 source migrations**: `dotnet ef database update --context TerraFusionDbContext --startup-project TerraFusion.API`
4. **Run Levy migrations**: `dotnet ef database update --context LevyDbContext --startup-project TerraFusion.API`
5. **Verify chain**: `dotnet ef migrations list` — 99 Applied for TerraFusion, 4 Applied for Levy
6. **Verify snapshot**: `dotnet ef migrations add VerifyClean` — must produce empty Up()/Down()
7. **Archive old DB**: leave `terrafusion` untouched for forensic reference
8. **Re-drain PACS data** into clean DB (WO-DATA-002A+)
9. **Decide init-db.sql fate**: run selectively or skip (depending on which tables are needed)
10. **Decide CurrentUse**: register or defer

### Required proof
- [ ] pg_dump of old `terrafusion` for permanent archive
- [ ] New DB has exactly 99 entries in `__EFMigrationsHistory`
- [ ] No Levy entries in new DB's `__EFMigrationsHistory` (only 99 TF entries)
- [ ] `terrafusion_levy.__EFMigrationsHistory` has exactly 4 entries
- [ ] `dotnet ef migrations add VerifyClean` produces empty migration
- [ ] Application starts and connects to clean DB
- [ ] Both old and new DBs accessible for comparison queries

### Forbidden shortcuts
- Do NOT drop old `terrafusion` — keep as archive
- Do NOT skip `LevyDatabase` connection string (contamination prevention)
- Do NOT run `dotnet ef database update` until appsettings point to clean DB
- Do NOT assume init-db.sql tables are needed — verify first

### Rollback strategy
- Revert `appsettings.Development.local.json` to point back to old `terrafusion`
- Drop `terrafusion_dev_clean` if migration chain failed
- Old DB is untouched and immediately usable

### Recommendation: **RECOMMENDED**

This is the safest path for a solo-dev project:
- Old DB preserved for forensic comparison (no data loss)
- Clean EF chain from source (no divergence)
- Levy contamination prevented by explicit connection string
- Both databases available simultaneously during transition
- PACS re-drain is a known, repeatable operation
- init-db.sql and CurrentUse get explicit, conscious decisions

---

## Path D: Manually Edit __EFMigrationsHistory

### When valid
- You understand the exact schema equivalence between DB state and source expectations
- You have full proof that every manual edit preserves chain integrity
- You want to avoid any data re-seeding

### Risk level: **HIGH**

**Manual edits to `__EFMigrationsHistory` are HIGH RISK and NOT recommended unless backed by full schema equivalence proof.**

### Steps
1. **Delete 4 Levy entries** from `terrafusion.__EFMigrationsHistory` (reduces 107 → 103)
2. **For each of the 15 DB-only feature branch entries:**
   - Verify the migration's schema changes exist in the DB
   - Decide: keep entry (add source file) or delete entry (if schema was superseded)
3. **For each of the 11 source-only entries:**
   - Verify the migration's schema changes exist in the DB
   - If equivalent schema exists: INSERT the MigrationId into `__EFMigrationsHistory`
   - If schema is missing: the migration needs to actually run
4. **Rebuild model snapshot**: `dotnet ef migrations add SnapshotFix`
5. **Verify**: Up() and Down() must be empty

### Required proof
- [ ] Full 107-entry DB migration list (live query)
- [ ] Per-migration schema equivalence verification for every INSERT/DELETE
- [ ] `dotnet ef migrations add SnapshotFix` produces empty migration
- [ ] No DROP or CREATE TABLE operations triggered by snapshot diff

### Forbidden shortcuts
- Do NOT INSERT entries without verifying schema equivalence
- Do NOT DELETE entries without verifying the migration is truly foreign
- Do NOT batch-delete "all entries after date X" — verify each individually
- Do NOT assume timestamp order implies dependency order

### Rollback strategy
- Restore from pg_dump backup (only option — manual edits are hard to reverse)

### Recommendation: **NOT RECOMMENDED**
Requires per-migration schema equivalence proof for 30 entries (19 DB-only + 11 source-only). One incorrect edit breaks the chain. The pg_dump rollback is all-or-nothing. Path C is faster and safer.

---

## Path E: Split Levy/CurrentUse Migration Histories Explicitly

### When valid
- Always valid as a prerequisite step for any other path
- Required before any future migration work

### Risk level: LOW (cleanup only)

### Steps
1. **Set `LevyDatabase` connection string** in all appsettings files:
   ```json
   "LevyDatabase": "Host=localhost;Database=terrafusion_levy;Username=postgres;Password=devpassword123;Port=5432"
   ```
2. **Replace fallback chain** in Program.cs LevyDbContext registration:
   ```csharp
   // FROM:
   ?? builder.Configuration.GetConnectionString("DefaultConnection")
   // TO:
   ?? throw new InvalidOperationException("LevyDatabase connection string required")
   ```
3. **Delete 4 Levy entries** from `terrafusion.__EFMigrationsHistory`:
   ```sql
   DELETE FROM "__EFMigrationsHistory"
   WHERE "MigrationId" IN (
     '20260418045322_InitialLevy',
     '20260418050107_AddLevyCertificationAndBankedCapacity',
     '20260427190328_SeedLevyData',
     '20260427190440_AddReferenceSources'
   );
   ```
4. **Remove `LevyCertification` from TerraFusionDbContext** (keep only in LevyDbContext)
5. **Decide CurrentUse target**: register with explicit connection or defer
6. **Verify Levy isolation**: `dotnet ef migrations list --context LevyDbContext` shows 4 Applied, no cross-contamination

### Required proof
- [ ] `terrafusion.__EFMigrationsHistory` no longer contains Levy entries
- [ ] `terrafusion_levy.__EFMigrationsHistory` still has 4 entries
- [ ] LevyDbContext fails to start if `LevyDatabase` connection string is missing (fail-loud)
- [ ] `LevyCertification` is only in LevyDbContext

### Forbidden shortcuts
- Do NOT just set the connection string without removing the fallback — future missing configs will re-contaminate
- Do NOT remove Levy tables from `terrafusion` in this step — that's a separate decision

### Rollback strategy
- Re-insert 4 Levy entries into `terrafusion.__EFMigrationsHistory`
- Revert Program.cs connection string change
- Low risk — easily reversible

### Recommendation: **ALWAYS DO THIS** — combine with any other path

---

## Path F: Create a Formal Baseline Migration (Snapshot Reset)

### When valid
- You want to keep using the existing `terrafusion` database
- You don't want to re-drain PACS data
- You're willing to lose per-migration rollback history

### Risk level: MEDIUM

### Steps
1. **Capture live schema**: `pg_dump --schema-only -d terrafusion > terrafusion_schema.sql`
2. **Delete ALL entries** from `__EFMigrationsHistory` (after backup)
3. **Delete ALL source migration files** (keep snapshot):
   ```bash
   rm backend/src/TerraFusion.Data/Migrations/2*.cs
   rm backend/src/TerraFusion.Data/Migrations/2*.Designer.cs
   ```
4. **Generate baseline migration**:
   ```bash
   dotnet ef migrations add BaselineReset_20260613 --context TerraFusionDbContext
   ```
5. **Edit generated migration**: empty the Up() and Down() methods (DB already has all tables)
6. **Mark as applied**:
   ```sql
   INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
   VALUES ('20260613000000_BaselineReset_20260613', '8.0.0');
   ```
7. **Verify**: `dotnet ef migrations list` shows 1 Applied migration
8. **Verify snapshot**: `dotnet ef migrations add VerifyClean` — must produce empty Up()/Down()

### Required proof
- [ ] pg_dump backup of full DB before any changes
- [ ] pg_dump --schema-only for schema comparison after baseline
- [ ] Generated baseline snapshot matches live DB (empty verify migration)
- [ ] Application starts and operates normally

### Forbidden shortcuts
- Do NOT delete migration history without a pg_dump backup
- Do NOT skip editing the baseline Up()/Down() to be empty (it will try to CREATE all tables)
- Do NOT forget to clean Levy contamination (combine with Path E)

### Rollback strategy
- Restore pg_dump backup
- Restore migration source files from git: `git checkout HEAD -- backend/src/TerraFusion.Data/Migrations/`

### Recommendation: ACCEPTABLE
Works well for solo-dev with no production deployment. However, Path C is preferred because it doesn't require editing generated migrations or manually inserting into `__EFMigrationsHistory`.

---

## Common Cleanup (All Paths)

### Levy Tables in `terrafusion`

```
After contamination cleanup (Path E), decide:
├── DROP Levy tables from terrafusion.public
│   (Districts, LevyMeasures, LevyScenarios, etc.)
│   Rationale: terrafusion_levy is authoritative
└── Keep both copies (accept duplication)
    Warning: data will diverge between copies
```

**Recommendation:** DROP from `terrafusion.public` after confirming `terrafusion_levy` has the authoritative data.

### init-db.sql Tables

```
For each init-db.sql table:
├── Actively used at runtime?
│   ├── YES → Formalize: either add to TerraFusionDbContext (EF-managed)
│   │         or document as SQL-managed (but not both)
│   └── NO  → Remove from init-db.sql; DROP from DB if safe
```

### CurrentUse Decision

```
Is current-use functionality being actively developed?
├── YES → Register in Program.cs with explicit connection string
│         ├── Schema in terrafusion (currentuse schema)
│         └── Separate database (terrafusion_currentuse)
└── NO  → Leave unregistered. No action until feature dev begins.
```

---

## Success Criteria (All Paths)

After reconciliation, ALL of these must be true:

1. `dotnet ef migrations list --context TerraFusionDbContext` shows only TerraFusionDbContext migrations, all as "Applied"
2. `dotnet ef migrations add VerifyClean` generates an empty Up() and Down() — model snapshot matches live DB
3. No Levy migration IDs in `terrafusion.__EFMigrationsHistory`
4. `LevyDatabase` connection string is set in all appsettings
5. LevyDbContext registration uses fail-loud (no DefaultConnection fallback)
6. `dotnet build TerraFusion.sln` succeeds with 0 errors
7. All existing tests pass (no regressions)
8. Application starts and connects to the correct database

---

## Estimated Effort

| Path | Effort | Risk | Best For | Combine With |
|---|---|---|---|---|
| **A: Restore Files** | ~4 hours | MEDIUM | Multi-dev teams needing full history | E |
| **B: Rebuild In-Place** | ~2 hours + re-drain | LOW | Quick cleanup, don't need old DB | E |
| **C: New Clean DB** | ~2 hours + re-drain | **LOW** | **Solo dev, forensic comparison needed** | **E** |
| **D: Edit History** | ~4 hours | **HIGH** | Experts with full schema proof | E |
| **E: Split Contexts** | ~1 hour | LOW | Always — prerequisite for all paths | Any |
| **F: Baseline Reset** | ~2 hours | MEDIUM | Keep existing DB, accept history loss | E |

---

## Final Recommendation

**Execute Path E (Levy/CurrentUse split) + Path C (new clean dev DB).**

1. Fix PostgreSQL TCP connectivity
2. pg_dump both databases
3. Set `LevyDatabase` connection string (Path E, step 1)
4. Replace Levy fallback chain with fail-loud (Path E, step 2)
5. Create `terrafusion_dev_clean` database (Path C, step 1)
6. Update appsettings to point to clean DB (Path C, step 2)
7. Run source migrations against clean DB (Path C, steps 3-4)
8. Verify chain and snapshot (Path C, steps 5-6)
9. Archive old `terrafusion` (untouched, available for queries)
10. Re-drain PACS data (separate work order)

This sequence costs ~3 hours plus PACS re-drain time. Risk is LOW. Both old and new databases remain accessible throughout. No manual edits to `__EFMigrationsHistory`. No migration file recovery needed. No schema equivalence proof required.

---

**Classification:** Development Infrastructure Decision Framework  
**Depends on:** WO-DATA-001 (PR #1006, merged), WO-DATA-001R (divergence + context boundary reports)  
**Next:** WO-DATA-002A — Clean Dev DB Bootstrap Plan
