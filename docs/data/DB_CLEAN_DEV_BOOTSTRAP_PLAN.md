# WO-DATA-002A: Clean Dev DB Bootstrap Plan

**Work Order:** WO-DATA-002A  
**Date:** 2026-06-14  
**Type:** PLAN ONLY — no database mutation  
**Prerequisite:** WO-DATA-001R (merged as PR #1008)  
**Reconciliation Path:** E+C (split context authority + clean dev DB from source)

---

## Executive Summary

This document defines the exact procedure for bootstrapping a new clean development database (`terrafusion_dev_clean`) from the 99 source migrations on `origin/main`. It addresses every prerequisite — PostgreSQL TCP connectivity, archive procedures, connection-string rules, context isolation, and verification gates — so that the actual execution (WO-DATA-002A-EXEC) can run as a deterministic script with a single operator approval gate.

**No database is created, modified, or destroyed by this plan.**

---

## 1. PostgreSQL TCP Blocker Diagnosis

### Symptom
PostgreSQL 17 Windows service is running (`postgresql-x64-17`) but refuses TCP connections on `localhost:5432`. The `dotnet ef` tooling and the API both require TCP to reach PostgreSQL.

### Diagnosis Steps (operator runs these)

```powershell
# 1. Confirm the service is running
Get-Service -Name "postgresql*"

# 2. Check which port PostgreSQL is listening on
netstat -an | findstr "5432"
# Expected: TCP 127.0.0.1:5432 LISTENING
# If missing: PostgreSQL is not listening on TCP at all

# 3. Check postgresql.conf for listen_addresses
# Default location on Windows:
Get-Content "C:\Program Files\PostgreSQL\17\data\postgresql.conf" | Select-String "listen_addresses"
# Expected: listen_addresses = 'localhost'
# If empty or '*': that's fine
# If commented out: uncomment and set to 'localhost'

# 4. Check pg_hba.conf for local TCP auth
Get-Content "C:\Program Files\PostgreSQL\17\data\pg_hba.conf" | Select-String "127.0.0.1"
# Expected: host all all 127.0.0.1/32 scram-sha-256
# If missing: add the line

# 5. Check Windows Firewall
netsh advfirewall firewall show rule name=all | findstr /i "5432"
# If a BLOCK rule exists for 5432: remove it

# 6. Quick connectivity test (after any config changes + service restart)
psql -h localhost -p 5432 -U postgres -c "SELECT version();"
```

### Common Fixes

| Cause | Fix | Restart Required |
|---|---|---|
| `listen_addresses` commented out or empty | Set to `'localhost'` in `postgresql.conf` | Yes |
| Missing pg_hba.conf TCP entry | Add `host all all 127.0.0.1/32 scram-sha-256` | Yes (or `pg_ctl reload`) |
| Windows Firewall blocking 5432 | Remove block rule or add allow rule | No |
| PostgreSQL installed but never configured for TCP | Full `listen_addresses` + `pg_hba.conf` edit | Yes |
| Port conflict (another process on 5432) | `netstat -an | findstr "5432"` to identify, kill or move | Depends |

### Service Restart Command
```powershell
Restart-Service -Name "postgresql-x64-17"
```

### Verification Gate
```powershell
# Must succeed before any subsequent step
psql -h localhost -p 5432 -U postgres -c "SELECT 1 AS tcp_ok;"
# Expected: tcp_ok = 1
```

**STOP if TCP test fails. Do not proceed to step 2.**

---

## 2. Old `terrafusion` DB Archive / pg_dump Plan

### Purpose
Archive the existing contaminated `terrafusion` database before creating the clean replacement. This preserves all real PACS-synced data for reference and rollback.

### Archive Commands
```powershell
# Create archive directory
mkdir C:\Users\bsval\tf-db-archives

# Full dump (custom format, compressed)
pg_dump -h localhost -p 5432 -U postgres -Fc -f "C:\Users\bsval\tf-db-archives\terrafusion_archive_20260614.dump" terrafusion

# Verify the dump is non-empty and readable
pg_restore --list "C:\Users\bsval\tf-db-archives\terrafusion_archive_20260614.dump" | Select-Object -First 10
```

### Archive Verification Gate
```powershell
# Dump file must exist and be > 1 MB (the DB has 276 tables with real data)
(Get-Item "C:\Users\bsval\tf-db-archives\terrafusion_archive_20260614.dump").Length / 1MB
# Expected: > 1 MB

# Count objects in the dump
pg_restore --list "C:\Users\bsval\tf-db-archives\terrafusion_archive_20260614.dump" | Measure-Object -Line
# Expected: > 200 lines (tables, sequences, indexes, etc.)
```

### Important
- Do NOT drop `terrafusion` yet. The clean DB uses a different name (`terrafusion_dev_clean`).
- The old database remains available for comparison queries throughout WO-DATA-002A-EXEC.
- Drop only after WO-DATA-002B verifies the clean DB is complete.

---

## 3. `terrafusion_levy` Archive Plan

### Purpose
Archive the separate Levy database that was correctly isolated but has its own 4-migration history.

### Archive Commands
```powershell
pg_dump -h localhost -p 5432 -U postgres -Fc -f "C:\Users\bsval\tf-db-archives\terrafusion_levy_archive_20260614.dump" terrafusion_levy

# Verify
pg_restore --list "C:\Users\bsval\tf-db-archives\terrafusion_levy_archive_20260614.dump" | Select-Object -First 5
```

### Note
The Levy database is not contaminated — it has the correct 4 Levy migrations in its own `__EFMigrationsHistory`. The archive is precautionary. The clean bootstrap will create a fresh `terrafusion_levy_clean` database with explicit connection string isolation (see section 5).

---

## 4. Explicit Connection-String Rules

### Current State (BROKEN)

**`appsettings.Development.json`** (line 11):
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=terrafusion;Username=postgres;Password=devpassword123;Port=5432"
}
```

No `LevyDatabase` or `CurrentUseDatabase` keys exist. This causes LevyDbContext to fall back to `DefaultConnection` (the main DB).

### Required State (CLEAN)

**`appsettings.Development.json`** must define three explicit connection strings:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=terrafusion_dev_clean;Username=postgres;Password=devpassword123;Port=5432",
  "LevyDatabase": "Host=localhost;Database=terrafusion_levy_clean;Username=postgres;Password=devpassword123;Port=5432",
  "CurrentUseDatabase": "Host=localhost;Database=terrafusion_dev_clean;Username=postgres;Password=devpassword123;Port=5432"
}
```

### Connection-String Rules (LOCKED)

| Rule | Rationale |
|---|---|
| `DefaultConnection` points to `terrafusion_dev_clean` | Clean DB from source migrations |
| `LevyDatabase` is ALWAYS explicit — never omitted | Prevents fallback to DefaultConnection (the contamination source) |
| `CurrentUseDatabase` targets the main DB's `currentuse` schema | CurrentUseDbContext uses `HasDefaultSchema("currentuse")` — schema isolation, not DB isolation |
| Password uses env var in non-dev environments | `devpassword123` only in Development; `${TF_DB_PASSWORD}` in BentonCounty/Production |
| `appsettings.Development.local.json` overrides committed values | ALWAYS check `.local.json` before diagnosing connection issues (lesson from SYNC-COMPLETE-3) |

### BentonCounty Variant

**`appsettings.BentonCounty.json`** should also be updated:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=terrafusion_dev_clean;Username=postgres;Password=${TF_DB_PASSWORD};Port=5432",
  "LevyDatabase": "Host=localhost;Database=terrafusion_levy_clean;Username=postgres;Password=${TF_DB_PASSWORD};Port=5432",
  "CurrentUseDatabase": "Host=localhost;Database=terrafusion_dev_clean;Username=postgres;Password=${TF_DB_PASSWORD};Port=5432"
}
```

---

## 5. LevyDatabase No-Fallback Requirement

### The Contamination Source

**`Program.cs` lines 2471-2474:**
```csharp
var levyConn = Environment.GetEnvironmentVariable("LEVY_DATABASE_URL")
              ?? builder.Configuration.GetConnectionString("LevyDatabase")
              ?? builder.Configuration.GetConnectionString("DefaultConnection")  // ← THIS
              ?? Environment.GetEnvironmentVariable("DATABASE_URL");
```

When `LevyDatabase` is not set, LevyDbContext resolves to `DefaultConnection` (the main `terrafusion` database). This caused 4 Levy migrations to appear in `terrafusion.__EFMigrationsHistory`.

### Required Code Change

Replace the fallback chain with a fail-loud pattern:

```csharp
// BEFORE (fallback to DefaultConnection — contamination source)
var levyConn = Environment.GetEnvironmentVariable("LEVY_DATABASE_URL")
              ?? builder.Configuration.GetConnectionString("LevyDatabase")
              ?? builder.Configuration.GetConnectionString("DefaultConnection")
              ?? Environment.GetEnvironmentVariable("DATABASE_URL");

// AFTER (fail-loud — no silent fallback to main DB)
var levyConn = Environment.GetEnvironmentVariable("LEVY_DATABASE_URL")
              ?? builder.Configuration.GetConnectionString("LevyDatabase");

if (string.IsNullOrWhiteSpace(levyConn))
{
    Console.WriteLine("[LevyDb] WARNING: No LevyDatabase connection configured. Using SQLite fallback (levy-dev.db).");
    options.UseSqlite("Data Source=levy-dev.db");
    return;
}
```

### Rationale
- SQLite fallback is safe (isolated file, no cross-context contamination)
- DefaultConnection fallback is dangerous (shares __EFMigrationsHistory with TerraFusionDbContext)
- The existing code already has SQLite fallback at lines 2483-2487; we just need to remove the `DefaultConnection` step from the chain

### Scope
This is a **one-line deletion** in Program.cs (remove the `?? builder.Configuration.GetConnectionString("DefaultConnection")` line). It's a code change, but it's a prerequisite for clean bootstrap — without it, the contamination will recur on first startup.

### Decision Point
**Operator decides**: Should this code change land in the WO-DATA-002A-EXEC PR (alongside the connection-string updates), or as a separate prerequisite PR?

---

## 6. CurrentUse Target Decision

### Current State
- `CurrentUseDbContext` is defined in `TerraFusion.CurrentUse/Data/CurrentUseDbContext.cs`
- It uses `modelBuilder.HasDefaultSchema("currentuse")` — its tables go in a `currentuse` schema
- It has 4 DbSets: Classifications, InterestRates, Removals, CurrentUseAuditEntry
- It has 1 migration file: `20260522_InitialCreate`
- It is **NOT registered in Program.cs** — no `AddDbContext<CurrentUseDbContext>` call exists
- It has **never been migrated** — no `currentuse` schema exists in any database

### Decision Required

| Option | Description | Risk |
|---|---|---|
| **A. Same DB, own schema** | CurrentUseDbContext targets `terrafusion_dev_clean` with schema `currentuse`. Connection string = DefaultConnection. | LOW — schema isolation is clean; 4 tables in their own schema. Simplest. |
| **B. Separate DB** | New `terrafusion_currentuse` database. Dedicated connection string. | MEDIUM — adds operational complexity for 4 tables that are tightly coupled to property data. |

### Recommendation
**Option A** (same DB, own schema). CurrentUse entities reference parcel data from the main context. Schema isolation via `HasDefaultSchema("currentuse")` is sufficient. A dedicated database for 4 tables adds unnecessary operational overhead.

### Required Registration (Program.cs)

```csharp
// Register CurrentUseDbContext — same DB, schema-isolated
builder.Services.AddDbContext<CurrentUseDbContext>(options =>
{
    var connStr = builder.Configuration.GetConnectionString("CurrentUseDatabase")
                ?? builder.Configuration.GetConnectionString("DefaultConnection");

    if (!string.IsNullOrWhiteSpace(connStr) && connStr.Contains("Host="))
    {
        options.UseNpgsql(connStr);
    }
    else
    {
        options.UseSqlite("Data Source=currentuse-dev.db");
    }
});
```

### Decision Point
**Operator decides**: Option A (recommended) or Option B?

---

## 7. Clean DB Name: `terrafusion_dev_clean`

### Naming Convention

| Database | Purpose | Source |
|---|---|---|
| `terrafusion` | Old contaminated dev DB (107 applied, 19 DB-only, 4 Levy cross-context) | ARCHIVED — do not use |
| `terrafusion_dev_clean` | New clean dev DB from 99 source migrations | WO-DATA-002A-EXEC creates this |
| `terrafusion_levy_clean` | New clean Levy DB (if using separate DB; skip if Levy stays SQLite for dev) | WO-DATA-002A-EXEC creates this |
| `terrafusion_os` | Docker compose DB name (unchanged) | Docker |
| `terrafusion_production` | Production DB name (unchanged) | Production |

### Why Not Just `terrafusion`?
The old `terrafusion` database stays intact for comparison. Running both side-by-side allows verification queries:
```sql
-- Compare migration histories
SELECT 'old' AS db, COUNT(*) FROM terrafusion."__EFMigrationsHistory"
UNION ALL
SELECT 'clean' AS db, COUNT(*) FROM terrafusion_dev_clean."__EFMigrationsHistory";
```

After WO-DATA-002B confirms the clean DB is complete, the old `terrafusion` can be renamed to `terrafusion_archived_20260614` and the clean DB can optionally be renamed to `terrafusion` (if connection strings are updated).

### Database Creation Command
```sql
-- Run via psql as postgres superuser
CREATE DATABASE terrafusion_dev_clean OWNER postgres;
-- Optional: create Levy DB if not using SQLite fallback
CREATE DATABASE terrafusion_levy_clean OWNER postgres;
```

---

## 8. Source Migration Application Command Plan

### Prerequisites Checklist (all must be TRUE)

- [ ] PostgreSQL TCP connectivity confirmed (step 1)
- [ ] Old `terrafusion` archived (step 2)
- [ ] Old `terrafusion_levy` archived (step 3)
- [ ] `appsettings.Development.json` updated with clean connection strings (step 4)
- [ ] LevyDbContext fallback removed from Program.cs (step 5)
- [ ] CurrentUse target decision made (step 6)
- [ ] `terrafusion_dev_clean` database created (step 7)
- [ ] Operator approval received

### Extension Installation
```sql
-- Connect to terrafusion_dev_clean
\c terrafusion_dev_clean
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgvector if needed:
-- CREATE EXTENSION IF NOT EXISTS vector;
```

### Do NOT Run init-db.sql
`scripts/init-db.sql` creates `auth`, `core`, `analytics`, `ai` schemas with tables that overlap EF-managed entities. The EF migrations create all required tables. Running init-db.sql on the clean DB would create conflicts.

**Rule**: EF migrations are the sole schema authority for `terrafusion_dev_clean`. No ad-hoc SQL schema creation.

### Migration Application (TerraFusionDbContext — 99 migrations)

```powershell
cd C:\Users\bsval\terrafusion_os_1.0\backend

# Verify migration count before applying
dotnet ef migrations list `
  --project src/TerraFusion.Data `
  --startup-project src/TerraFusion.API `
  --no-build `
  | Measure-Object -Line
# Expected: 99 migrations listed as "Pending"

# Apply all 99 migrations
dotnet ef database update `
  --project src/TerraFusion.Data `
  --startup-project src/TerraFusion.API `
  --verbose
# Expected: "Applying migration '20251027125937_InitialCreate'."
# ...
# "Applying migration '20260509184340_SyncComplete2V2StageLevelResume'."
# "Done."
```

### Migration Application (LevyDbContext — if using PostgreSQL)

```powershell
# Only if operator chose PostgreSQL for Levy (not SQLite fallback)
# Verify LevyDatabase connection string is set BEFORE running

dotnet ef database update `
  --project src/TerraFusion.Levy `
  --startup-project src/TerraFusion.API `
  --context LevyDbContext `
  --verbose
# Expected: 4 Levy migrations applied to terrafusion_levy_clean
```

### Migration Application (CurrentUseDbContext — if registered)

```powershell
# Only after CurrentUseDbContext is registered in Program.cs (step 6)

dotnet ef database update `
  --project src/TerraFusion.CurrentUse `
  --startup-project src/TerraFusion.API `
  --context CurrentUseDbContext `
  --verbose
# Expected: 1 migration applied, 'currentuse' schema created in terrafusion_dev_clean
```

### Critical Warning
The `--startup-project` MUST be `src/TerraFusion.API` for all three contexts. Using `src/TerraFusion.Data` as startup-project produces destructive DROP TABLE scaffolds for GPT/RAG entities (documented in feedback memory `feedback_ef_migration_startup.md`).

---

## 9. Verification Gates

### Gate 1: Migration History Count
```sql
-- Connect to terrafusion_dev_clean
SELECT COUNT(*) AS applied_count FROM "__EFMigrationsHistory";
-- Expected: 99

-- Verify NO Levy migrations leaked into the main DB
SELECT "MigrationId" FROM "__EFMigrationsHistory"
WHERE "MigrationId" LIKE '%Levy%' OR "MigrationId" LIKE '%levy%';
-- Expected: 0 rows
```

### Gate 2: Schema Inventory
```sql
SELECT table_schema, COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_catalog = 'terrafusion_dev_clean'
GROUP BY table_schema
ORDER BY table_count DESC;
-- Expected: public (100+), sync (48), canonical_tf (17), legacy_pacs_raw (12),
-- truth_pacs (7), sync_atlas (13), sync_bridge (9), sync_mapping (4),
-- doctrine (4), gis_tf (1)
-- NOT expected: auth, core, analytics (those come from init-db.sql, NOT EF)
```

### Gate 3: No Cross-Context Contamination
```sql
-- Levy migrations must NOT be in the main DB history
SELECT COUNT(*) AS levy_in_main
FROM terrafusion_dev_clean."__EFMigrationsHistory"
WHERE "MigrationId" LIKE '%Levy%';
-- Expected: 0

-- If Levy DB exists, verify its own history
SELECT COUNT(*) AS levy_own
FROM terrafusion_levy_clean."__EFMigrationsHistory";
-- Expected: 4 (if PostgreSQL) or N/A (if SQLite)
```

### Gate 4: Model Snapshot Consistency
```powershell
# Generate a migration without applying it — should produce empty migration
dotnet ef migrations add VerifyClean `
  --project src/TerraFusion.Data `
  --startup-project src/TerraFusion.API

# Check if the migration Up() method is empty
# If empty: snapshot matches schema — PASS
# If non-empty: snapshot drift detected — investigate before proceeding

# Remove the verification migration regardless
dotnet ef migrations remove `
  --project src/TerraFusion.Data `
  --startup-project src/TerraFusion.API
```

### Gate 5: Application Startup
```powershell
# Start the API against the clean DB
cd C:\Users\bsval\terrafusion_os_1.0\backend
dotnet run --project src/TerraFusion.API --no-build

# Health check
curl http://localhost:5000/health
# Expected: 200 OK

# Levy health check
curl http://localhost:5000/levy/health
# Expected: 200 OK with provider = Npgsql (or Sqlite if using fallback)
```

### Gate 6: Comparison Query (old vs. clean)
```sql
-- Migration count comparison
SELECT 'old' AS db, COUNT(*) AS migrations FROM terrafusion."__EFMigrationsHistory"
UNION ALL
SELECT 'clean' AS db, COUNT(*) FROM terrafusion_dev_clean."__EFMigrationsHistory";
-- Expected: old = 107, clean = 99

-- Table count comparison
SELECT 'old' AS db, COUNT(*) AS tables
FROM information_schema.tables
WHERE table_catalog = 'terrafusion' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'clean' AS db, COUNT(*)
FROM information_schema.tables
WHERE table_catalog = 'terrafusion_dev_clean' AND table_type = 'BASE TABLE';
-- Expected: old > clean (old has init-db.sql tables + DB-only migration tables)
```

---

## 10. Stop / Approval Point Before Mutation

### Execution Sequence Summary

```
PHASE 1 — PREREQUISITES (no DB mutation)
  ├── 1.1  Fix PostgreSQL TCP (operator)
  ├── 1.2  Verify TCP connectivity (automated gate)
  ├── 1.3  Archive old terrafusion DB (pg_dump)
  ├── 1.4  Archive old terrafusion_levy DB (pg_dump)
  └── 1.5  Verify archives are valid (size + object count)

══════════════════════════════════════════════
   ⛔ STOP — OPERATOR APPROVAL REQUIRED ⛔
   Present: archive paths, sizes, connection
   string diff, code change diff (Levy fallback
   removal). Operator reviews and approves.
══════════════════════════════════════════════

PHASE 2 — CODE CHANGES (PR, no DB mutation)
  ├── 2.1  Update appsettings.Development.json (3 connection strings)
  ├── 2.2  Update appsettings.BentonCounty.json (3 connection strings)
  ├── 2.3  Remove Levy DefaultConnection fallback from Program.cs
  ├── 2.4  Register CurrentUseDbContext in Program.cs (per operator decision)
  ├── 2.5  Commit, push, open PR
  └── 2.6  Merge code changes PR

══════════════════════════════════════════════
   ⛔ STOP — OPERATOR APPROVAL REQUIRED ⛔
   Code changes merged. Verify build is green.
   Confirm ready to create databases.
══════════════════════════════════════════════

PHASE 3 — DATABASE CREATION (mutates PostgreSQL)
  ├── 3.1  CREATE DATABASE terrafusion_dev_clean
  ├── 3.2  CREATE DATABASE terrafusion_levy_clean (if applicable)
  ├── 3.3  Install uuid-ossp extension
  ├── 3.4  Apply 99 TerraFusionDbContext migrations
  ├── 3.5  Apply 4 LevyDbContext migrations (if PostgreSQL)
  ├── 3.6  Apply 1 CurrentUseDbContext migration (if registered)
  └── 3.7  Run all 6 verification gates

══════════════════════════════════════════════
   ⛔ STOP — OPERATOR APPROVAL REQUIRED ⛔
   All gates green. Confirm clean DB is the
   new default. Old DB stays for comparison
   until WO-DATA-002B completes.
══════════════════════════════════════════════

PHASE 4 — POST-CREATION (WO-DATA-002B takes over)
  ├── 4.1  Domain coverage / CountyId audit
  ├── 4.2  Row count comparison (old vs. clean)
  └── 4.3  Old DB archival decision
```

### Approval Artifacts for Each Gate

**Gate 1 (after Phase 1):**
- Archive file paths and sizes
- TCP connectivity proof (`SELECT 1 AS tcp_ok`)
- Connection string diff (old → new)
- Code change diff (Levy fallback removal)

**Gate 2 (after Phase 2):**
- PR link (merged, checks green)
- Build verification (`dotnet build` succeeds)
- No runtime errors on startup with SQLite fallback

**Gate 3 (after Phase 3):**
- All 6 verification gate results
- Migration count: 99 (clean) vs 107 (old)
- Zero Levy cross-context leakage
- Application starts and health checks pass

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| PostgreSQL TCP fix breaks other services | Test PACS MSSQL connectivity after PostgreSQL config change |
| Migration chain corruption (missing file, reordered timestamp) | Run `dotnet ef migrations list` before `update` — verify 99 pending |
| Model snapshot drift produces non-empty VerifyClean migration | Investigate before proceeding; may indicate stale snapshot |
| init-db.sql accidentally run on clean DB | Rule: EF migrations are sole schema authority. Document in CLAUDE.md |
| appsettings.Development.local.json overrides committed values | ALWAYS check `.local.json` first (lesson from SYNC-COMPLETE-3) |
| Old `terrafusion` DB accidentally used after switch | Keep both DBs alive; name difference (`_dev_clean`) makes accidental use unlikely |

---

## Out of Scope

- **PACS re-drain**: WO-DATA-004 scope. Clean DB will have empty sync tables until drains run.
- **Doctrine re-seed**: Hosted service seeds doctrine rules on startup. Will populate automatically.
- **Production DB changes**: This plan targets local dev only. Production uses `terrafusion_production` (unchanged).
- **Docker compose updates**: Docker uses `terrafusion_os` (unchanged). Docker-specific clean bootstrap is a separate concern.

---

**Classification:** Development Infrastructure Plan  
**Next Work Order:** WO-DATA-002A-EXEC (executes this plan with operator approval at each gate)
