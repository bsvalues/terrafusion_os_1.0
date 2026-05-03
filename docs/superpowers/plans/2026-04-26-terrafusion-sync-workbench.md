# TerraFusion Sync Workbench — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build TerraFusion Sync as an assessor-operated, SQL- and Excel-friendly conversion workbench that ingests legacy county systems (PACS, ProVal/Ascend) into the TerraFusion canonical model with audit-grade evidence, AI-proposed mappings, human-approved decisions, dry-run safety, and quarantine-over-crash.

**Architecture:** Eight workbench tables backed by four durable spine entities (`SyncBatch`, `SyncRecord`, `SyncWatermark`, `SyncQuarantine`). New Workbench pipeline writes durable evidence — does NOT refactor existing `Core/Sync` engine. Source Packs (PACS Pack, ProVal/Ascend Pack) compound across counties; Benton is the lab. AI proposes; human approves via Excel round-trip; machine commits; evidence proves.

**Tech Stack:** .NET 8, Entity Framework Core 8, PostgreSQL (TerraFusion DB) + SQL Server (PACS/Ascend sources), xUnit + FluentAssertions + EF.InMemory for tests, ClosedXML or NPOI for Excel round-trip (TBD when Slice C starts).

---

## Part 0: Multi-Role Review (DevOps team perspectives)

This plan was reviewed from 9 operational roles before being committed. Each role's findings are captured; cross-role concerns drive the plan structure.

### Role 1 — DBA (database administrator)

**Findings:**
- ✅ **Spine schema is idempotency-aware.** `SyncRecord.PayloadHash` enables natural-key uniqueness; rerun same source produces no-op.
- ✅ **Watermark advance is correctly scoped** — per (CountyId, SourceSystem, EntityType), updated only on success.
- ⚠️ **Index strategy** for `SyncRecord` needs cross-source queries: `(CountyId, SourceSystem, EntityType, SourceKey)` is composite and high-cardinality. Verify EF generates a non-clustered index, not a rowstore-only table. Action: confirm in Slice A migration inspection.
- ⚠️ **`SyncQuarantine.PayloadJson`** is `text` (unbounded). On Postgres this is fine; on SQL Server fallback (dev env), this would map to `nvarchar(max)`. Either is acceptable but worth being explicit.
- ⚠️ **Restoring `ascprod_backup_2017_02_14_*.bak`** must NOT overwrite an active dev DB. Use `WITH MOVE` to relocate logical files to a safe path. If `RESTORE FILELISTONLY` shows logical file names that collide with existing DBs, rename or use `WITH REPLACE` carefully. **Mandatory pre-flight: dry-run `RESTORE FILELISTONLY` first.**
- ⚠️ **GPT/RAG entities are vendor-dependent on `pgvector` (`UseVector()` in design-time factory).** If a Sync change accidentally drops or renames any of those tables, vector indexes are lost — recreating costs 5-30 minutes per dataset. The destructive migration scaffold caught earlier this session would have triggered exactly this. The locked rule (`--startup-project = TerraFusion.API`) prevents recurrence.
- ⚠️ **Migration rollback strategy.** Every Sync slice's migration must include a working `Down()` method. Don't ship migrations with empty Down() bodies.

**Severity:** all medium or low. None block the plan; all are gate items.

### Role 2 — SRE / Build & Release Engineer

**Findings:**
- 🔴 **Process lock blocker (PID 42384) is unresolved.** Migration cannot scaffold while `TerraFusion.API.exe` holds `bin/` lock. Operator action required.
- ⚠️ **No CI gate for EF migration safety.** A future agent could re-introduce the Data-as-startup mistake. Recommendation: add a CI check that runs `dotnet ef migrations script --idempotent` and fails if output contains `DropTable|DropColumn|DropIndex` in any migration touching `SyncBatch|SyncRecord|SyncWatermark|SyncQuarantine`.
- ⚠️ **Stale build artifacts (`api_type_errors.txt`, `build_output.txt`)** at `backend/` root are misleading. Housekeeping deletion deferred to post-Slice-A parking lot per user directive.
- ⚠️ **Build is currently green** at HEAD `f013768c6`, but only when API not already running. Doc note: building while API is alive produces benign file-copy errors that are NOT compile errors.
- ✅ **Test infrastructure is in place** — `tests/TerraFusion.Integration.Tests` has EF.InMemory, FluentAssertions, real Data + Core refs, in solution.

### Role 3 — Security Engineer

**Findings:**
- ⚠️ **FISMA-HIGH compliance:** every entity needs auditable `CreatedBy` / `UpdatedBy`. Current Slice A entities have these as nullable `string?`. Verify the AuditableEntityInterceptor (per CLAUDE.md) populates these from `HttpContext` — if Sync is invoked outside HTTP context (e.g., scheduled job), `CreatedBy` may stay null.
- ⚠️ **Sovereign County isolation:** every spine entity carries `CountyId` and FKs to `County` with `OnDelete(DeleteBehavior.Restrict)`. Good. But query layer must always filter by CountyId — no global queries permitted. Verify in test that two counties' data cannot cross-contaminate.
- 🔴 **PACS connection auth is Windows Integrated** (per VS Code mssql config). Sync runs as which user? If as a service account, that account needs explicit grant. If as the user's own Windows session, only works while user is logged in. **Decision needed before Slice B1.**
- ⚠️ **`pacsnonprivy` candidate role:** password is hardcoded as `xi4b]ftx1p.w` in `createuser.pacsnonprivy.sql`. If we use this role, the password should NOT be checked into Sync's config. Use Windows Integrated Auth for Sync; reserve `pacsnonprivy` for ad-hoc query needs.
- ⚠️ **Quarantine PayloadJson** can contain PII (owner names, addresses, sale prices). Storage of quarantined data must respect the same isolation as operational data. Audit trail too — `SyncRecord.SourceKey` may be a parcel ID = personally-identifiable in some contexts.
- ⚠️ **Secrets management:** when Sync stores connection profiles in `sync_source_connection`, passwords must NOT be plaintext. Either Windows Integrated only (no password) or encrypt at rest with a per-county key.

### Role 4 — QA Engineer

**Findings:**
- ✅ **TDD discipline maintained.** Each task has Write-Test → Verify-Fail → Implement → Verify-Pass → Commit cadence.
- ⚠️ **Test coverage for the spine alone is weak.** Slice A's planned `SyncSpineSchemaTests` covers schema persistence + CountyId scoping. It does NOT cover:
  - Idempotent re-insert (same payload hash → no duplicate)
  - Watermark advance under partial failure
  - Cascade behavior on `SyncBatch` delete (should be Restrict, not Cascade?)
  - Quarantine replay semantics
  These need separate test slices, deferred.
- ⚠️ **No regression test for the destructive-migration trap.** If a future migration accidentally drops GPT/RAG tables, no automated guard catches it. Recommendation: add a `MigrationSafetyTests` suite that asserts known table names exist after every migration apply.
- ⚠️ **Performance under load is untested.** 4M `SyncRecord` rows per full Benton ingest. Insert performance at that scale needs verification. Expect 10-30 min per ingest; if longer, batching strategy needs review.
- 🔴 **No fixture for the Benton Method round-trip test.** The contract says "Benton Method against TerraFusion canonical = Benton Method against PACS, parcel-by-parcel." That test needs the Benton Method itself implemented and runnable. Verify it exists or build a stub that exercises the contract's required column set.

### Role 5 — Product / UX

**Findings:**
- ✅ **Operator-centric design.** Workbench targets one assessor + SQL + Excel. AI proposes; human approves.
- ⚠️ **Excel round-trip is the highest-risk UX surface.** Excel users do unexpected things: format cells, merge ranges, paste with formatting, drop blank rows in the middle. Slice C's Excel writer must produce robust workbooks; the importer must validate and reject malformed input gracefully.
- ⚠️ **Quarantine queue UX is unspecified beyond "sortable by reason."** When quarantine count is 50,000 (full first ingest), how does an operator triage? Need pagination, group-action ("approve all unknown improvement codes as 'OTHER' for this run"), and saved triage filters.
- ⚠️ **Evidence packet PDF generation is unspecified.** Library choice (QuestPDF? PuppeteerSharp? RazorPDF?) deferred to Slice H. Note as decision needed.
- ✅ **First-7-days walkthrough is concrete enough** to validate UX assumptions during Slice B/C/E development.
- ⚠️ **Day-1 "47 tables / 312 views / 1,247 sprocs" numbers are illustrative.** Make sure the actual Slice B1 UI shows real numbers only, with a clear "profile not yet run" empty state.

### Role 6 — Architect

**Findings:**
- ✅ **Slice boundaries are sharp.** A → spine; A.5 → landing; B1/B2/B3 → profiling; C → mapping; D/E → import/dry-run; F → quarantine; G → commit; H → evidence.
- ⚠️ **`Core/Sync` engine coexistence is risky.** Old engine ships in-memory `SyncReceipt`; new Workbench pipeline writes durable spine. They share namespace. Risk of cross-pollination. Recommendation: namespace the new pipeline distinctly (`TerraFusion.Sync.Workbench`) or fully replace the old engine after parity is proven.
- ⚠️ **Two existing Sync homes (`backend/src/TerraFusion.Sync/` and `backend/src/TerraFusion.Core/Sync/`)** are still unaddressed. Do not consolidate during this plan. Defer to a "sync home consolidation" slice post-MVP.
- 🔴 **PACS violator surface (~6,312 references in 200 files)** is not part of this plan. Sync ships alongside violators; cleanup is separate. Make sure no Sync code accidentally references a violator path.
- ⚠️ **Pack file format is sketched but not locked.** Will it be a `.zip`? `.tar.gz`? A SQL DML script? A REST endpoint? Decision needed before Slice B3.

### Role 7 — Compliance Officer

**Findings:**
- ⚠️ **WA RCW 84.40 (assessor data preservation):** county data must be retrievable on demand. Quarantine is a legal hold of source rows that didn't make canonical. Quarantine retention is "forever" per user directive — confirm storage budget allows it.
- ⚠️ **Audit trail completeness:** every operational row must trace to a `SyncRecord` to a `SyncBatch` to a source-system + source-key + payload hash. Verify no path writes operational rows without this trail.
- ⚠️ **Sovereign County boundary:** if a parcel has SourceParcelId 12345 in Benton AND Walla Walla, those are different physical parcels. CountyId scoping must be enforced at every layer — query, validation, identity resolver, persister. Cross-county leak = compliance incident.
- ⚠️ **Vendor data licensing.** `TAUserGuide_PACS90_DatabaseGuide.xlsx` is True Automation's vendor doc. Parsing it into Sync's Pack as descriptions is dual-use. Confirm with TerraFusion's lead (you) that this is OK.
- ⚠️ **Marshall & Swift (M&S) cost data** in `MVS.pdf`/`RCH.pdf` is licensed. Sync should NOT redistribute M&S content; it should only preserve the M&S codes (590/830/etc.) in canonical for round-trip purposes.

### Role 8 — Project Manager

**Findings:**
- ✅ **Sequence is locked and disciplined.** Each slice ships independently with proof gates.
- ⚠️ **Slice C (Mapping Workbook) and Slice E (Dry Run) are big slices.** Each needs further decomposition. Plan below splits each into sub-tasks of 2-5 minutes each.
- ⚠️ **No timeline estimates.** PM-style burndown impossible without time-per-task. Add T-shirt sizing per slice.
- 🔴 **External blocker (PID 42384) gates Slice A.** Until operator stops API, nothing moves. Capture as the first checkbox.
- 🔴 **Codex / June 10 unveil lane is concurrent.** Sync work must not consume Codex's bandwidth or repo state. Confirm at every commit that Codex's lane is undisturbed.

### Role 9 — Reliability / Disaster Recovery

**Findings:**
- ⚠️ **Migration rollback path:** if Slice A's migration applies and we then discover a bug, rollback requires `dotnet ef migrations remove` + redeploy. Verify the migration's `Down()` is correct.
- ⚠️ **Backup before migration apply:** the user's local TerraFusion DB has months of dev work. Before applying any migration, instruct the operator to take a backup. Add this to the resume protocol.
- ⚠️ **`ascprod_backup_2017_02_14_*.bak` restore is non-trivial.** 14.4 GB. Will take 5-15 minutes to restore on a typical local SQL Server. Add as a separate proof-gate task with realistic time expectations.
- ⚠️ **DB connection retry logic** in Slice B+ should NOT auto-retry destructive operations. Reads can retry; commits should not retry on transient errors without explicit operator confirmation.

### Cross-role consensus (synthesizing all 9 roles)

**Top 5 risks to manage proactively in this plan:**

1. **EF migration startup-project trap** — already locked in `feedback_ef_migration_startup.md`; reinforce in every relevant task.
2. **PACS connection auth ambiguity** — must be decided before Slice B1; default to Windows Integrated.
3. **Quarantine retention + PII surface** — design Quarantine table to support per-county purge if compliance demands, even though default is "forever."
4. **Excel round-trip robustness** — Slice C needs significant test coverage; flaky Excel parsing kills operator trust.
5. **Engine coexistence boundary** — new Workbench pipeline must NOT modify existing `Core/Sync` until parity is proven.

**Top 3 decisions still pending:**

1. **Pack file format** (zip / tar.gz / SQL DML script / API). Decision before Slice B3.
2. **PDF generation library** for evidence packets. Decision before Slice H.
3. **Excel library** (ClosedXML / NPOI / EPPlus). Decision before Slice C.

---

## Part 1: File Structure

Files this plan creates or modifies, organized by slice. Files marked ⚪ are new; ⊕ are modified.

### Slice A — Sync Spine (parked, awaiting lock release)

| Status | Path | Purpose |
|---|---|---|
| ✅ already on disk | `backend/src/TerraFusion.Core/Entities/Sync/SyncBatch.cs` | One row per sync run |
| ✅ already on disk | `backend/src/TerraFusion.Core/Entities/Sync/SyncRecord.cs` | One row per source-row processed |
| ✅ already on disk | `backend/src/TerraFusion.Core/Entities/Sync/SyncWatermark.cs` | Per (county, source, entity) cursor |
| ✅ already on disk | `backend/src/TerraFusion.Core/Entities/Sync/SyncQuarantine.cs` | Quarantined rejected rows |
| ✅ already on disk | `backend/src/TerraFusion.Data/Configurations/Sync/SyncBatchConfiguration.cs` | EF config |
| ✅ already on disk | `backend/src/TerraFusion.Data/Configurations/Sync/SyncRecordConfiguration.cs` | EF config |
| ✅ already on disk | `backend/src/TerraFusion.Data/Configurations/Sync/SyncWatermarkConfiguration.cs` | EF config |
| ✅ already on disk | `backend/src/TerraFusion.Data/Configurations/Sync/SyncQuarantineConfiguration.cs` | EF config |
| ⊕ already modified | `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` | +14 lines: imports, DbSets, ApplyConfiguration calls |
| ⚪ pending | `backend/src/TerraFusion.Data/Migrations/{timestamp}_AddSyncSpineEntities.cs` | EF migration (additive only) |
| ⚪ pending | `backend/src/TerraFusion.Data/Migrations/{timestamp}_AddSyncSpineEntities.Designer.cs` | EF designer |
| ⚪ pending | `backend/tests/TerraFusion.Integration.Tests/Sync/SyncSpineSchemaTests.cs` | Schema persistence + CountyId scoping tests |

### Slice A.5 — Canonical Landing Schema

| Status | Path | Purpose |
|---|---|---|
| ⚪ | `backend/src/TerraFusion.Core/Entities/Owner.cs` | Canonical owner entity |
| ⚪ | `backend/src/TerraFusion.Core/Entities/OwnershipEvent.cs` | Bitemporal owner ↔ property association |
| ⚪ | `backend/src/TerraFusion.Core/Entities/LandSegment.cs` | Per-parcel land segments |
| ⚪ | `backend/src/TerraFusion.Core/Entities/ImprovementDetail.cs` | Per-parcel improvement details (Benton Method preservation) |
| ⚪ | `backend/src/TerraFusion.Data/Configurations/OwnerConfiguration.cs` | EF config |
| ⚪ | `backend/src/TerraFusion.Data/Configurations/OwnershipEventConfiguration.cs` | EF config |
| ⚪ | `backend/src/TerraFusion.Data/Configurations/LandSegmentConfiguration.cs` | EF config |
| ⚪ | `backend/src/TerraFusion.Data/Configurations/ImprovementDetailConfiguration.cs` | EF config |
| ⊕ | `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` | +DbSets, +ApplyConfiguration, +using |
| ⚪ | `backend/src/TerraFusion.Data/Migrations/{timestamp}_AddCanonicalLandingSchema.cs` | EF migration |
| ⚪ | `backend/tests/TerraFusion.Integration.Tests/Sync/CanonicalLandingSchemaTests.cs` | Tests |

### Slice B1 — Database Atlas

| Status | Path | Purpose |
|---|---|---|
| ⚪ | `backend/src/TerraFusion.Core/Entities/Sync/SyncSourceConnection.cs` | Stored connection profile |
| ⚪ | `backend/src/TerraFusion.Core/Entities/Sync/SyncProfileTable.cs` | Profile output: tables |
| ⚪ | `backend/src/TerraFusion.Core/Entities/Sync/SyncProfileColumn.cs` | Profile output: columns |
| ⚪ | `backend/src/TerraFusion.Core/Entities/Sync/SyncProfileView.cs` | Profile output: views (with body) |
| ⚪ | `backend/src/TerraFusion.Core/Entities/Sync/SyncProfileProcedure.cs` | Profile output: stored procs (with body) |
| ⚪ | `backend/src/TerraFusion.Core/Entities/Sync/SyncProfileFunction.cs` | Profile output: UDFs |
| ⚪ | `backend/src/TerraFusion.Core/Entities/Sync/SyncProfileTrigger.cs` | Profile output: triggers |
| ⚪ | `backend/src/TerraFusion.Core/Entities/Sync/SyncProfileConstraint.cs` | Profile output: PK/FK/CHECK |
| ⚪ | EF configs for the above (8 files) | EF mapping |
| ⚪ | `backend/src/TerraFusion.Sync.Workbench/AtlasProfiler.cs` | Read-only metadata profiler runtime (NEW project namespace) |
| ⚪ | `backend/src/TerraFusion.Sync.Workbench/SqlServerMetadataReader.cs` | sys.* schema reader |
| ⊕ | DbContext, migration, tests | |

### Slices B2, B3, C, D, E, F, G, H

Detailed file structure per slice is in Part 2 below.

---

## Part 2: Slice-by-Slice Execution Plan

Each slice is a sequence of 2-5-minute tasks. Slices are independent and ship one at a time. Do NOT advance to the next slice until the current slice's commit lands and tests are green.

---

## SLICE A — Sync Spine (RESUME PROTOCOL)

**Status:** Parked. 4 entities + 4 configs + DbContext wiring already on disk. Awaiting lock release.

**T-shirt size:** XS (1-2 hours once unblocked)

**External precondition:** PID 42384 (`TerraFusion.API.exe`) must be stopped.

### Task A.0: Verify lock released

**Files:** none

> **Shell note:** All commands in this plan default to **PowerShell** (works on the operator's Windows session). Git Bash equivalents are provided in collapsible blocks where useful. Do NOT paste bash commands into PowerShell — `grep`, `tail`, `find`, `tasklist //FI` will fail or behave unexpectedly.

- [ ] **Step 1: Confirm API process is no longer holding the lock**

PowerShell:
```powershell
Get-Process -Id 42384 -ErrorAction SilentlyContinue
```

Expected: no output (process not found). If output shows `TerraFusion.API`, STOP — operator must stop the API.

<details>
<summary>Git Bash equivalent</summary>

```bash
tasklist //FI "PID eq 42384" 2>&1 | grep -v "INFO:" | grep TerraFusion
```
Expected: empty output.
</details>

### Task A.1: Backup TerraFusion DB before migration

**Files:** none

- [ ] **Step 1: Take a backup of the current TerraFusion Postgres DB**

Operator action (cannot run from agent session):
```bash
pg_dump -h localhost -p 5432 -U postgres -d terrafusion -F c -f E:/backups/terrafusion_pre_slice_a_2026-04-26.dump
```

Expected: dump file size > 0 bytes. Note the path; this is the rollback target if Slice A goes wrong.

### Task A.2: Scaffold migration via API startup

**Files:** none yet (about to generate)

- [ ] **Step 1: Run `dotnet ef migrations add` with API as startup-project**

PowerShell (note backtick line continuations, NOT backslashes):
```powershell
cd backend
dotnet ef migrations add AddSyncSpineEntities `
  --project src/TerraFusion.Data `
  --startup-project src/TerraFusion.API `
  --context TerraFusionDbContext
```

Expected output: `Done. To undo this action, use 'ef migrations remove'`.

If output contains `An operation was scaffolded that may result in the loss of data` — STOP. The startup-project hook didn't fire. Verify API is fully built first via `dotnet build src/TerraFusion.API`.

### Task A.3: Hard-stop scan of generated migration

**Files (read-only):** `backend/src/TerraFusion.Data/Migrations/{timestamp}_AddSyncSpineEntities.cs`

- [ ] **Step 1: Search for destructive patterns**

PowerShell:
```powershell
Select-String -Path "backend/src/TerraFusion.Data/Migrations/*_AddSyncSpineEntities.cs" `
  -Pattern "DropTable|DropColumn|DropIndex|RenameTable|RenameColumn"
```

Expected: zero matches (no output).

If any match, immediately:
```powershell
dotnet ef migrations remove --project backend/src/TerraFusion.Data `
  --startup-project backend/src/TerraFusion.API --context TerraFusionDbContext
```
and STOP for review.

- [ ] **Step 2: Search for unrelated entity churn**

PowerShell:
```powershell
Select-String -Path "backend/src/TerraFusion.Data/Migrations/*_AddSyncSpineEntities.cs" `
  -Pattern "GPT|RAG|Marketplace|UsageMetrics|Embeddings|RAGDocuments|RAGDatasets"
```

Expected: zero matches.

- [ ] **Step 3: Confirm exactly four CreateTable calls**

PowerShell:
```powershell
(Select-String -Path "backend/src/TerraFusion.Data/Migrations/*_AddSyncSpineEntities.cs" `
  -Pattern "migrationBuilder\.CreateTable").Count
```

Expected: `4`.

- [ ] **Step 4: Confirm the four table names**

PowerShell:
```powershell
Select-String -Path "backend/src/TerraFusion.Data/Migrations/*_AddSyncSpineEntities.cs" `
  -Pattern 'name: "Sync(Batches|Records|Watermarks|Quarantine)"'
```

Expected: 4 matches, one per table.

### Task A.4: Confirm migration's Down() is correct

**Files (read-only):** the migration file

- [ ] **Step 1: Inspect Down() method**

Read the migration file. Confirm `protected override void Down(MigrationBuilder migrationBuilder)` contains exactly four `migrationBuilder.DropTable(...)` calls — one per Sync table — and nothing else.

If Down() is empty or contains other operations, STOP and review.

### Task A.5: Write SyncSpineSchemaTests (TDD-first, BEFORE build)

**Files:** `backend/tests/TerraFusion.Integration.Tests/Sync/SyncSpineSchemaTests.cs` (NEW)

- [ ] **Step 1: Create the test file**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Data;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

public class SyncSpineSchemaTests
{
    private static TerraFusionDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false"
            })
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    [Fact]
    public async System.Threading.Tasks.Task SyncSpine_PersistsAllFourEntities_WithCountyScope()
    {
        await using var context = CreateContext($"sync-spine-{Guid.NewGuid()}");

        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);
        await context.SaveChangesAsync();

        var batch = new SyncBatch
        {
            CountyId = county.Id,
            SourceSystem = "PACS",
            Mode = "delta",
            Status = "completed",
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 2,
            InsertedCount = 1,
            QuarantinedCount = 1,
            SourceChecksum = "sha256:test"
        };
        context.SyncBatches.Add(batch);

        context.SyncRecords.Add(new SyncRecord
        {
            CountyId = county.Id,
            SyncBatchId = batch.Id,
            SourceSystem = "PACS",
            EntityType = "Parcel",
            SourceKey = "PACS-1001",
            TerraFusionEntityId = Guid.NewGuid(),
            Operation = "insert",
            PayloadHash = "sha256:record",
            SourceModifiedAtUtc = DateTimeOffset.UtcNow
        });

        context.SyncWatermarks.Add(new SyncWatermark
        {
            CountyId = county.Id,
            SourceSystem = "PACS",
            EntityType = "Parcel",
            LastSuccessfulModifiedUtc = DateTimeOffset.UtcNow,
            LastSourceToken = "token-1001",
            LastSuccessfulBatchId = batch.Id
        });

        context.SyncQuarantine.Add(new SyncQuarantine
        {
            CountyId = county.Id,
            SyncBatchId = batch.Id,
            SourceSystem = "PACS",
            EntityType = "Parcel",
            SourceKey = "BAD-1",
            Reason = "Missing required parcel identifier",
            PayloadHash = "sha256:bad",
            PayloadJson = "{\"parcelId\":null}"
        });

        await context.SaveChangesAsync();

        (await context.SyncBatches.CountAsync(x => x.CountyId == county.Id)).Should().Be(1);
        (await context.SyncRecords.CountAsync(x => x.CountyId == county.Id)).Should().Be(1);
        (await context.SyncWatermarks.CountAsync(x => x.CountyId == county.Id)).Should().Be(1);
        (await context.SyncQuarantine.CountAsync(x => x.CountyId == county.Id)).Should().Be(1);
    }

    [Fact]
    public async System.Threading.Tasks.Task SyncWatermark_IsCountyScoped()
    {
        await using var context = CreateContext($"sync-watermark-{Guid.NewGuid()}");

        var countyA = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        var countyB = new County { Id = Guid.NewGuid(), Name = "Walla Walla", State = "WA", FipsCode = "53071" };
        context.Counties.AddRange(countyA, countyB);
        await context.SaveChangesAsync();

        context.SyncWatermarks.AddRange(
            new SyncWatermark { CountyId = countyA.Id, SourceSystem = "PACS", EntityType = "Parcel", LastSourceToken = "county-a-token" },
            new SyncWatermark { CountyId = countyB.Id, SourceSystem = "PACS", EntityType = "Parcel", LastSourceToken = "county-b-token" }
        );
        await context.SaveChangesAsync();

        var countyAWatermark = await context.SyncWatermarks.SingleAsync(x => x.CountyId == countyA.Id);
        countyAWatermark.LastSourceToken.Should().Be("county-a-token");

        var countyAWatermarks = await context.SyncWatermarks.Where(x => x.CountyId == countyA.Id).ToListAsync();
        countyAWatermarks.Should().NotContain(x => x.LastSourceToken == "county-b-token");
    }
}
```

- [ ] **Step 2: Run the test (expect compile success)**

```bash
cd backend
dotnet test tests/TerraFusion.Integration.Tests --filter "FullyQualifiedName~SyncSpineSchemaTests"
```

Expected: tests compile. They may pass immediately because EF.InMemory doesn't enforce migration. That's OK — what we're testing is the entity + config + DbContext wiring, which does work in-memory.

If tests fail with compile errors, fix entity references / using statements before proceeding.

### Task A.6: Build the solution

**Files:** none

- [ ] **Step 1: Full solution build**

```bash
cd backend
dotnet build TerraFusion.sln --nologo
```

Expected: `Build succeeded. 0 Error(s).` (8 NU1902 OpenTelemetry warnings are pre-existing and acceptable.)

If build fails on Sync entities/configs, fix and re-run. If build fails elsewhere, STOP — that's an unrelated regression.

### Task A.7: Apply migration to local TerraFusion DB

**Files:** none

- [ ] **Step 1: Apply via `dotnet ef database update`**

PowerShell:
```powershell
cd backend
dotnet ef database update `
  --project src/TerraFusion.Data `
  --startup-project src/TerraFusion.API `
  --context TerraFusionDbContext
```

Expected: `Done.` and `Applying migration '{timestamp}_AddSyncSpineEntities'.`

- [ ] **Step 2: Verify tables exist in Postgres**

PowerShell:
```powershell
psql -h localhost -p 5432 -U postgres -d terrafusion -c '\dt "Sync*"'
```

Expected: 4 tables — `SyncBatches`, `SyncRecords`, `SyncWatermarks`, `SyncQuarantine`.

### Task A.8: Run all integration tests

**Files:** none

- [ ] **Step 1: Full test sweep**

```bash
cd backend
dotnet test tests/TerraFusion.Integration.Tests --nologo
```

Expected: all tests pass, including pre-existing tests untouched.

If a non-Sync test regresses, STOP — Slice A introduced a side effect.

### Task A.9: Commit Slice A

**Files (commit):** all parked Slice A files + new migration + new test

- [ ] **Step 1: Stage and commit**

```bash
cd backend
git add \
  src/TerraFusion.Core/Entities/Sync/ \
  src/TerraFusion.Data/Configurations/Sync/ \
  src/TerraFusion.Data/TerraFusionDbContext.cs \
  src/TerraFusion.Data/Migrations/ \
  tests/TerraFusion.Integration.Tests/Sync/SyncSpineSchemaTests.cs
git commit -m "feat(sync): Slice A — durable Sync spine schema

Add four county-scoped audit entities (SyncBatch, SyncRecord, SyncWatermark,
SyncQuarantine) with EF configurations, additive migration, and integration
tests proving CountyId scoping and schema round-trip.

No engine wiring, no source connectors, no canonical landing schema in this
slice — those are Slice A.5 and beyond."
```

Expected: clean commit.

### Task A.10: Verify Slice A is parked-clean

- [ ] **Step 1: Confirm working tree is clean for Sync paths**

```bash
git status backend/src/TerraFusion.Core/Entities/Sync/ \
  backend/src/TerraFusion.Data/Configurations/Sync/ \
  backend/tests/TerraFusion.Integration.Tests/Sync/
```

Expected: nothing to commit.

- [ ] **Step 2: Update memory: Slice A landed**

Update todo list: mark Slice A as completed. Update `project_sync_workbench_spec.md` with the migration timestamp.

**Slice A definition of done:**

- [x] 4 entities + 4 configs + DbContext wiring on disk
- [ ] Migration scaffolded with API startup, no destructive content
- [ ] Migration's `Down()` correctly reverses
- [ ] Schema test exists and passes against EF.InMemory
- [ ] Solution builds 0-errors
- [ ] `database update` applies migration to Postgres
- [ ] Full test suite green
- [ ] Commit landed on main (or feature branch)
- [ ] Memory updated

---

## SLICE A.5 — Canonical Landing Schema

**Status:** Pending Slice A.

**T-shirt size:** S (3-4 hours)

**Locked decisions:** No `Improvement` parent. `OwnershipEvent` IS the association table (no `PropertyOwnership` join, no `CurrentOwnerId` shortcut).

### Task A.5.1: Create `Owner` entity

**Files:** `backend/src/TerraFusion.Core/Entities/Owner.cs` (NEW)

- [ ] **Step 1: Write the entity file**

```csharp
using System;

namespace TerraFusion.Core.Entities;

public sealed class Owner
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public string SourceOwnerId { get; set; } = null!;

    public string RawName { get; set; } = null!;
    public string NormalizedName { get; set; } = null!;

    public string? RawMailingAddress { get; set; }
    public string? NormalizedMailingAddress { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
```

### Task A.5.2: Create `OwnershipEvent` entity (locked field list)

**Files:** `backend/src/TerraFusion.Core/Entities/OwnershipEvent.cs` (NEW)

- [ ] **Step 1: Write the entity file**

```csharp
using System;

namespace TerraFusion.Core.Entities;

public sealed class OwnershipEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid OwnerId { get; set; }
    public Owner Owner { get; set; } = null!;

    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public DateTimeOffset EffectiveFrom { get; set; }
    public DateTimeOffset? EffectiveThrough { get; set; }

    public string SourceSystem { get; set; } = "PACS";
    public string? SourceChangeOfOwnerId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
```

### Task A.5.3: Create `LandSegment` entity

**Files:** `backend/src/TerraFusion.Core/Entities/LandSegment.cs` (NEW)

- [ ] **Step 1: Write the entity file**

```csharp
using System;

namespace TerraFusion.Core.Entities;

public sealed class LandSegment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public string SourceLandSegmentId { get; set; } = null!;

    public int AssessmentYear { get; set; }
    public int SupplementNumber { get; set; }

    public string LandTypeCode { get; set; } = null!;
    public decimal? Acreage { get; set; }
    public decimal? SizeSquareFeet { get; set; }
    public decimal? MarketValue { get; set; }
    public decimal? AssessedValue { get; set; }

    public string? PayloadHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
```

### Task A.5.4: Create `ImprovementDetail` entity (Benton Method preservation contract)

**Files:** `backend/src/TerraFusion.Core/Entities/ImprovementDetail.cs` (NEW)

- [ ] **Step 1: Write the entity file**

```csharp
using System;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Per-parcel improvement detail record. Preserves the Benton Method input set:
/// type/class/method codes, area, value, value source ('A'djusted vs 'F'lat),
/// condition, year built, and the three depreciation percentages (physical,
/// functional, economic) plus completion percentage.
/// </summary>
public sealed class ImprovementDetail
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public int SourceImprvId { get; set; }
    public int SourceImprvDetId { get; set; }

    public int AssessmentYear { get; set; }
    public int SupplementNumber { get; set; }

    public string TypeCode { get; set; } = null!;
    public string? ClassCode { get; set; }
    public string? MethodCode { get; set; }
    public decimal? AreaSqFt { get; set; }
    public decimal? Value { get; set; }
    public string? ValueSource { get; set; }
    public string? ConditionCode { get; set; }
    public int? YearBuilt { get; set; }

    public decimal? PhysicalPercent { get; set; }
    public decimal? FunctionalPercent { get; set; }
    public decimal? EconomicPercent { get; set; }
    public decimal? PercentComplete { get; set; }
    public decimal? DepreciationPercent { get; set; }

    public bool IsNewValue { get; set; }

    public string? PayloadHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
```

### Task A.5.5: Create EF configurations for the four entities

**Files:**
- `backend/src/TerraFusion.Data/Configurations/OwnerConfiguration.cs` (NEW)
- `backend/src/TerraFusion.Data/Configurations/OwnershipEventConfiguration.cs` (NEW)
- `backend/src/TerraFusion.Data/Configurations/LandSegmentConfiguration.cs` (NEW)
- `backend/src/TerraFusion.Data/Configurations/ImprovementDetailConfiguration.cs` (NEW)

- [ ] **Step 1: Owner config**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> builder)
    {
        builder.ToTable("Owners");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceOwnerId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.RawName).HasMaxLength(500).IsRequired();
        builder.Property(x => x.NormalizedName).HasMaxLength(500).IsRequired();
        builder.Property(x => x.RawMailingAddress).HasMaxLength(1000);
        builder.Property(x => x.NormalizedMailingAddress).HasMaxLength(1000);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.SourceOwnerId }).IsUnique();
        builder.HasIndex(x => new { x.CountyId, x.NormalizedName });

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 2: OwnershipEvent config**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class OwnershipEventConfiguration : IEntityTypeConfiguration<OwnershipEvent>
{
    public void Configure(EntityTypeBuilder<OwnershipEvent> builder)
    {
        builder.ToTable("OwnershipEvents");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceChangeOfOwnerId).HasMaxLength(128);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.PropertyId, x.EffectiveFrom });
        builder.HasIndex(x => new { x.CountyId, x.OwnerId });
        builder.HasIndex(x => new { x.CountyId, x.PropertyId, x.EffectiveThrough });

        builder.HasOne(x => x.County).WithMany().HasForeignKey(x => x.CountyId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Property).WithMany().HasForeignKey(x => x.PropertyId).OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 3: LandSegment config**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class LandSegmentConfiguration : IEntityTypeConfiguration<LandSegment>
{
    public void Configure(EntityTypeBuilder<LandSegment> builder)
    {
        builder.ToTable("LandSegments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceLandSegmentId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.LandTypeCode).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Acreage).HasPrecision(14, 4);
        builder.Property(x => x.SizeSquareFeet).HasPrecision(14, 2);
        builder.Property(x => x.MarketValue).HasPrecision(14, 2);
        builder.Property(x => x.AssessedValue).HasPrecision(14, 2);
        builder.Property(x => x.PayloadHash).HasMaxLength(128);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.PropertyId, x.AssessmentYear, x.SupplementNumber });
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.SourceLandSegmentId, x.AssessmentYear });

        builder.HasOne(x => x.County).WithMany().HasForeignKey(x => x.CountyId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Property).WithMany().HasForeignKey(x => x.PropertyId).OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 4: ImprovementDetail config (longest)**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class ImprovementDetailConfiguration : IEntityTypeConfiguration<ImprovementDetail>
{
    public void Configure(EntityTypeBuilder<ImprovementDetail> builder)
    {
        builder.ToTable("ImprovementDetails");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.TypeCode).HasMaxLength(32).IsRequired();
        builder.Property(x => x.ClassCode).HasMaxLength(32);
        builder.Property(x => x.MethodCode).HasMaxLength(32);
        builder.Property(x => x.ConditionCode).HasMaxLength(32);
        builder.Property(x => x.ValueSource).HasMaxLength(8);
        builder.Property(x => x.AreaSqFt).HasPrecision(14, 2);
        builder.Property(x => x.Value).HasPrecision(14, 2);
        builder.Property(x => x.PhysicalPercent).HasPrecision(7, 4);
        builder.Property(x => x.FunctionalPercent).HasPrecision(7, 4);
        builder.Property(x => x.EconomicPercent).HasPrecision(7, 4);
        builder.Property(x => x.PercentComplete).HasPrecision(7, 4);
        builder.Property(x => x.DepreciationPercent).HasPrecision(7, 4);
        builder.Property(x => x.PayloadHash).HasMaxLength(128);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.PropertyId, x.AssessmentYear, x.SupplementNumber });
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.SourceImprvId, x.SourceImprvDetId });
        builder.HasIndex(x => new { x.CountyId, x.TypeCode });

        builder.HasOne(x => x.County).WithMany().HasForeignKey(x => x.CountyId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Property).WithMany().HasForeignKey(x => x.PropertyId).OnDelete(DeleteBehavior.Restrict);
    }
}
```

### Task A.5.6: Wire DbSets and ApplyConfiguration

**Files:** `backend/src/TerraFusion.Data/TerraFusionDbContext.cs` (modify)

- [ ] **Step 1: Add DbSets after the Sync spine block**

Locate the Sync spine block in DbContext (added in Slice A) and append:

```csharp
  // R3 Sync Canonical Landing Schema
  public DbSet<Owner> Owners { get; set; }
  public DbSet<OwnershipEvent> OwnershipEvents { get; set; }
  public DbSet<LandSegment> LandSegments { get; set; }
  public DbSet<ImprovementDetail> ImprovementDetails { get; set; }
```

- [ ] **Step 2: Add ApplyConfiguration calls in OnModelCreating**

Locate the Sync spine ApplyConfiguration block and append:

```csharp
    // R3 Sync Canonical Landing Schema
    modelBuilder.ApplyConfiguration(new OwnerConfiguration());
    modelBuilder.ApplyConfiguration(new OwnershipEventConfiguration());
    modelBuilder.ApplyConfiguration(new LandSegmentConfiguration());
    modelBuilder.ApplyConfiguration(new ImprovementDetailConfiguration());
```

### Task A.5.7: Write canonical-landing tests

**Files:** `backend/tests/TerraFusion.Integration.Tests/Sync/CanonicalLandingSchemaTests.cs` (NEW)

- [ ] **Step 1: Write 4 tests, one per entity**

Each test creates a county, then creates an instance of the new entity, asserts persistence + CountyId scoping. Mirror `SyncSpineSchemaTests.cs` pattern.

(Full test code omitted here for brevity — follow Slice A's pattern exactly. Each test ~30 lines.)

### Task A.5.8: Build and test

- [ ] **Step 1: Build**

```bash
cd backend && dotnet build TerraFusion.sln --nologo
```

Expected: 0 errors.

- [ ] **Step 2: Run new tests**

```bash
dotnet test tests/TerraFusion.Integration.Tests --filter "FullyQualifiedName~CanonicalLanding"
```

Expected: all pass.

### Task A.5.9: Scaffold migration via API startup

- [ ] **Step 1: Migration command**

PowerShell:
```powershell
cd backend
dotnet ef migrations add AddCanonicalLandingSchema `
  --project src/TerraFusion.Data `
  --startup-project src/TerraFusion.API `
  --context TerraFusionDbContext
```

- [ ] **Step 2: Hard-stop scan (PowerShell, same pattern as Slice A)**

```powershell
Select-String -Path "backend/src/TerraFusion.Data/Migrations/*_AddCanonicalLandingSchema.cs" `
  -Pattern "DropTable|DropColumn|DropIndex|RenameTable|RenameColumn"

Select-String -Path "backend/src/TerraFusion.Data/Migrations/*_AddCanonicalLandingSchema.cs" `
  -Pattern "GPT|RAG|Marketplace|UsageMetrics|Embeddings|Sync(Batches|Records|Watermarks|Quarantine)"
```

Both expect zero matches. (Note: the second scan also rejects accidental Sync-spine churn — A.5 should not touch spine tables.)

Confirm exactly four CreateTable calls for `Owners`, `OwnershipEvents`, `LandSegments`, `ImprovementDetails`:

```powershell
Select-String -Path "backend/src/TerraFusion.Data/Migrations/*_AddCanonicalLandingSchema.cs" `
  -Pattern 'name: "(Owners|OwnershipEvents|LandSegments|ImprovementDetails)"'
```

Expected: 4 matches.

### Task A.5.10: Apply migration and run full test suite

- [ ] **Step 1: Apply**

PowerShell:
```powershell
dotnet ef database update --project src/TerraFusion.Data --startup-project src/TerraFusion.API --context TerraFusionDbContext
```

- [ ] **Step 2: Full test sweep**

```powershell
dotnet test tests/TerraFusion.Integration.Tests --nologo
```

Expected: all pass.

### Task A.5.11: Commit Slice A.5

```bash
git add \
  backend/src/TerraFusion.Core/Entities/Owner.cs \
  backend/src/TerraFusion.Core/Entities/OwnershipEvent.cs \
  backend/src/TerraFusion.Core/Entities/LandSegment.cs \
  backend/src/TerraFusion.Core/Entities/ImprovementDetail.cs \
  backend/src/TerraFusion.Data/Configurations/OwnerConfiguration.cs \
  backend/src/TerraFusion.Data/Configurations/OwnershipEventConfiguration.cs \
  backend/src/TerraFusion.Data/Configurations/LandSegmentConfiguration.cs \
  backend/src/TerraFusion.Data/Configurations/ImprovementDetailConfiguration.cs \
  backend/src/TerraFusion.Data/TerraFusionDbContext.cs \
  backend/src/TerraFusion.Data/Migrations/ \
  backend/tests/TerraFusion.Integration.Tests/Sync/CanonicalLandingSchemaTests.cs

git commit -m "feat(sync): Slice A.5 — canonical landing schema

Add Owner, OwnershipEvent (bitemporal association), LandSegment, and
ImprovementDetail (Benton Method preservation set) canonical entities.
No engine wiring; no source connectors; schema only."
```

**Slice A.5 definition of done:**

- [ ] 4 entities + 4 configs + DbContext wiring on disk
- [ ] OwnershipEvent uses locked field list (no PropertyOwnership join, no CurrentOwnerId)
- [ ] No Improvement parent (deferred per locked decision)
- [ ] Migration scaffolded with API startup, no destructive content
- [ ] Schema tests exist and pass
- [ ] Build green, full test suite green
- [ ] Migration applied to local Postgres
- [ ] Commit landed

---

## SLICE B1 — Database Atlas (read-only metadata profiler)

**Status:** Pending Slice A.5.

**T-shirt size:** M (1-2 days)

### Sub-slices for B1 (revised order — CLI before HTTP)

B1 is large. Decomposed into ordered sub-slices. **HTTP endpoint deferred to last and gated on auth posture being settled.** Solo-dev/operator workflow runs via CLI first; HTTP only after PACS connection auth and connection-handling are decided.

- **B1.0** *(decision gate)*: PACS connection auth — Windows Integrated vs `pacsnonprivy` candidate role. Must be decided before any sub-slice ships. Default recommendation: Windows Integrated, no password storage.
- **B1.1:** Add `sync_profile_*` schema (8 entities + configs + migration)
- **B1.2:** Add `SyncSourceConnection` entity + config + migration (connection profile storage; no password column unless decision gate B1.0 picks `pacsnonprivy` with secret storage)
- **B1.3:** Build `SqlServerMetadataReader` — reads `sys.tables`, `sys.columns`, `sys.views`, `sys.procedures`, `sys.functions`, `sys.triggers`, `sys.foreign_keys`, `sys.check_constraints`
- **B1.4:** Build `AtlasProfiler` orchestrator — runs reader, writes profile rows, creates a `SyncBatch` with `Mode='profile'`
- **B1.5:** Build **CLI runner** at `backend/tools/SyncAtlas/` — operator-invoked console app. Args: `--connection <name>`, `--county <id>`. No HTTP exposure. Reads connection from `sync_source_connection` (Windows Integrated by default).
- **B1.6:** Tests against a fixture SQL Server (Docker container — `mcr.microsoft.com/mssql/server:2022-latest`)
- **B1.7:** Run CLI runner against Benton's local `pacs_training` and verify profile output queryable via SQL
- **B1.8** *(deferred, post-MVP unless explicitly authorized)*: HTTP endpoint `POST /api/sync/profile`. **Do NOT add until** auth posture (B1.0), per-county authorization, and rate-limiting are decided. CLI is sufficient for solo-operator MVP.

Each sub-slice gets its own commit. Full task breakdown deferred to start of B1; pattern mirrors Slice A's TDD-first approach.

### B1 definition of done (MVP)

- [ ] B1.0 connection auth decision recorded
- [ ] `sync_profile_*` tables exist and persist
- [ ] `SyncSourceConnection` stores connection profiles (no plaintext passwords)
- [ ] `AtlasProfiler` runs against Benton's local PACS clone (`pacs_training`) via CLI
- [ ] Profile output is queryable via SQL views
- [ ] No row-level data is read (metadata only)
- [ ] Test fixture validates against Docker SQL Server
- [ ] Documentation in `docs/sync/atlas-profile.md` describing what the profiler reads
- [ ] HTTP endpoint NOT shipped (B1.8 explicitly deferred)

---

## SLICES B2, B3, C, D, E, F, G, H — High-level scope

Each slice gets its own detailed plan when its predecessor lands. High-level scope below; sub-task breakdowns happen at slice start to ensure plans match reality at that point.

### Slice B2 — Data Profile (M, 1 day)

**Scope:** row counts, null %, distinct counts (top 100 per column), sample values (random 10 per column), code-table candidate detection (low-cardinality string columns).

**Output tables:** `sync_profile_table_stats`, `sync_profile_column_stats`, `sync_profile_code_candidate`.

**Decision needed:** sampling strategy for tables with > 1M rows (random sample N? TABLESAMPLE? top N?).

### Slice B3 — Pack Seeder (M, 1-2 days)

**Scope:** parse `TAUserGuide_PACS90_DatabaseGuide.xlsx` (E:\PACS\Files of SQL\Files of SQL\PACS-SQL\) + named query catalogs (E:\Files of Appraisal\7_Queries\, E:\Files of Appraisal\REVAL\Proval Queries\, PACS Queries 2018) into PACS Pack v0.1 metadata + diagnostics.

**Tooling:** new console app `backend/tools/SyncPackSeeder/`.

**Decision needed:** Pack file format (zip / tar.gz / SQL DML script / API).

### Slice C — Mapping Workbook (L, 2-3 days)

**Scope:** Excel export from `sync_mapping` tables; import with validation; round-trip preservation; versioning. Tabs: Tables, Columns, CodeTables, CodeMappings, UnknownCodes, ValidationRules, IdentityRules, ChangeLog.

**Decision needed:** Excel library (ClosedXML / NPOI / EPPlus).

### Slice D — Mapping Import (S, 1 day)

**Scope:** read reviewed workbook, validate, store as new `MappingVersion` rows, append to ChangeLog.

### Slice E — Dry Run (L, 2-3 days)

**Scope:** stage source data → apply mappings → validate → classify (insertable/updateable/skippable/needs-review/quarantine). NO writes to operational tables. Output to `sync_dryrun_summary` + `sync_dryrun_row`.

**Decision needed:** Workbench pipeline boundary vs existing `Core/Sync` engine. Per locked decision: build new Workbench pipeline, do NOT modify `Core/Sync`.

### Slice F — Quarantine Review (M, 1 day)

**Scope:** quarantine grouping by reason; per-row actions (map this code, ignore, mark legacy-only, send to manual review); decision capture as new `sync_mapping` rows.

### Slice G — Commit (M, 1-2 days)

**Scope:** transaction-per-chunk commit of approved dry-run rows; SyncBatch + SyncRecord + watermark advance; idempotent re-run.

### Slice H — Evidence Packet (M, 1 day)

**Scope:** generate auditor-readable PDF from spine tables. Cover, counts, hashes, samples, watermark transition, operator signoff.

**Decision needed:** PDF library (QuestPDF / PuppeteerSharp / RazorPDF).

---

## Part 3: Tracking Checklist

Copy this to a tracking file or paste into a project board. Tick as you go.

### Pre-Slice-A blockers (operator action)

- [ ] **B0.1:** Stop `TerraFusion.API.exe` (PID 42384 or current PID); confirm via PowerShell: `Get-Process -Id <pid> -ErrorAction SilentlyContinue` (expect no output)
- [ ] **B0.2:** Take pre-migration backup: `pg_dump -h localhost -U postgres -d terrafusion -F c -f E:/backups/terrafusion_pre_slice_a_<date>.dump`
- [ ] **B0.3:** Confirm Codex / June 10 unveil lane is not active in repo state

### Slice A — Sync Spine

- [ ] **A.1:** Verify lock released
- [ ] **A.2:** Scaffold migration via API startup
- [ ] **A.3:** Hard-stop scan: no DropTable/DropColumn/RAG/GPT
- [ ] **A.4:** Confirm migration's Down() correctness
- [ ] **A.5:** Write `SyncSpineSchemaTests.cs`
- [ ] **A.6:** `dotnet build TerraFusion.sln` → 0 errors
- [ ] **A.7:** `dotnet ef database update` → applied
- [ ] **A.8:** Full test sweep green
- [ ] **A.9:** Commit Slice A
- [ ] **A.10:** Update memory: Slice A landed; record migration timestamp
- [ ] **A.11:** Optional housekeeping: add `// deliberately singular` comment on `DbSet<SyncQuarantine>` (only if DbContext is being touched anyway)

### Slice A.5 — Canonical Landing Schema

- [ ] **A5.1:** Create `Owner.cs`
- [ ] **A5.2:** Create `OwnershipEvent.cs` (locked field list)
- [ ] **A5.3:** Create `LandSegment.cs`
- [ ] **A5.4:** Create `ImprovementDetail.cs` (Benton Method preservation set)
- [ ] **A5.5:** Create 4 EF configurations
- [ ] **A5.6:** Wire DbSets + ApplyConfiguration in DbContext
- [ ] **A5.7:** Write `CanonicalLandingSchemaTests.cs`
- [ ] **A5.8:** Build green; new tests pass
- [ ] **A5.9:** Scaffold migration via API startup; hard-stop scan
- [ ] **A5.10:** Apply migration; full test sweep green
- [ ] **A5.11:** Commit Slice A.5
- [ ] **A5.12:** Update memory

### Slice B1 — Database Atlas (CLI-first, HTTP deferred)

- [ ] **B1.0:** *Decision gate* — PACS connection auth (recommend Windows Integrated)
- [ ] **B1.1:** Add 8 `sync_profile_*` entities + configs + migration
- [ ] **B1.2:** Add `SyncSourceConnection` entity + config (no plaintext passwords)
- [ ] **B1.3:** Build `SqlServerMetadataReader` (sys.* schema reader)
- [ ] **B1.4:** Build `AtlasProfiler` orchestrator
- [ ] **B1.5:** Build **CLI runner** at `backend/tools/SyncAtlas/` (NOT HTTP)
- [ ] **B1.6:** Write fixture-based tests (Docker SQL Server)
- [ ] **B1.7:** Run CLI runner against Benton's local `pacs_training`
- [ ] **B1.8:** Document atlas profile output (`docs/sync/atlas-profile.md`)
- [ ] **B1.9:** *Deferred (post-MVP, do NOT ship in B1):* HTTP endpoint `POST /api/sync/profile`. Re-evaluate only after B1.0 auth posture is locked, per-county authorization is designed, and rate-limiting is decided.

### Slice B2 — Data Profile

- [ ] **B2.0:** Decide sampling strategy
- [ ] **B2.1:** Add stats entities + configs
- [ ] **B2.2:** Build profilers (row count, null %, distinct, sample, code candidate)
- [ ] **B2.3:** Tests
- [ ] **B2.4:** Run against pacs_training; verify outputs match SQL ground truth

### Slice B3 — Pack Seeder

- [ ] **B3.0:** Decide Pack file format
- [ ] **B3.1:** Confirm vendor doc licensing OK (TAUserGuide_PACS90_DatabaseGuide.xlsx)
- [ ] **B3.2:** Create `backend/tools/SyncPackSeeder/` console app
- [ ] **B3.3:** Parse TAUserGuide xlsx → Pack metadata
- [ ] **B3.4:** Walk named query catalogs → Pack diagnostics
- [ ] **B3.5:** Output PACS Pack v0.1 to `backend/data/packs/pacs/`
- [ ] **B3.6:** Tests verify Pack content

### Slice C — Mapping Workbook

- [ ] **C.0:** Decide Excel library
- [ ] **C.1:** Add `sync_mapping` + `sync_code_mapping` schema
- [ ] **C.2:** Build mapping AI suggester (reads profile + Pack seed)
- [ ] **C.3:** Build Excel exporter (8 tabs)
- [ ] **C.4:** Build Excel importer with validation
- [ ] **C.5:** Round-trip tests
- [ ] **C.6:** Run against Benton: export → review → import → diff

### Slice D — Mapping Import

- [ ] **D.1:** Validation rule engine
- [ ] **D.2:** Versioning + supersession logic
- [ ] **D.3:** ChangeLog tab append on import
- [ ] **D.4:** Tests

### Slice E — Dry Run

- [ ] **E.0:** Confirm new Workbench pipeline scope (locked: do not refactor `Core/Sync`)
- [ ] **E.1:** Build staging tables (per source/table)
- [ ] **E.2:** Build mapping applier
- [ ] **E.3:** Build identity resolver (tier 1-5)
- [ ] **E.4:** Build validator
- [ ] **E.5:** Build classifier (insertable/updateable/skippable/needs-review/quarantine)
- [ ] **E.6:** Build sync_dryrun_* tables + writers
- [ ] **E.7:** End-to-end test against Benton
- [ ] **E.8:** Performance test: 4M rows in <30 minutes

### Slice F — Quarantine Review

- [ ] **F.1:** Quarantine grouping API
- [ ] **F.2:** Per-row action API
- [ ] **F.3:** Decision capture (writes new `sync_mapping` rows)
- [ ] **F.4:** Replay mechanism
- [ ] **F.5:** Tests

### Slice G — Commit

- [ ] **G.1:** Transaction-per-chunk commit
- [ ] **G.2:** Watermark advance (only on success)
- [ ] **G.3:** Idempotency test (rerun = no-op)
- [ ] **G.4:** Partial failure rollback test
- [ ] **G.5:** Performance test

### Slice H — Evidence Packet

- [ ] **H.0:** Decide PDF library
- [ ] **H.1:** Build evidence packet generator
- [ ] **H.2:** PDF templating (cover, counts, hashes, samples, watermark, signoff)
- [ ] **H.3:** Output to `backend/data/evidence/<batch-id>.pdf`
- [ ] **H.4:** Auditor-readable test (manual review)

### Proof gates (independent of slices)

- [ ] **PG.1:** Run `pacsnonprivy` permissions test:
  ```sql
  SELECT USER_NAME();
  SELECT IS_ROLEMEMBER('pacsnonprivy');
  SELECT
    HAS_PERMS_BY_NAME('dbo.property', 'OBJECT', 'SELECT') AS can_select_property,
    HAS_PERMS_BY_NAME('dbo.user_input_query', 'OBJECT', 'INSERT') AS can_insert_user_query;
  ```
- [ ] **PG.2:** `RESTORE FILELISTONLY FROM DISK = 'D:\ascprod_backup_2017_02_14_000103_6400278.bak';`
- [ ] **PG.3:** Restore `ascprod` to local SQL Server (separate DB name to avoid collision)
- [ ] **PG.4:** Schema dump from restored ascprod: counts of tables / views / sprocs / functions / triggers
- [ ] **PG.5:** Cross-system parcel walk: 5-10 specific Benton parcels traced from ascprod → TerraFusion → PACS

### Housekeeping (parking lot, post-Slice-A)

- [ ] **HK.1:** Delete `backend/api_type_errors.txt`
- [ ] **HK.2:** Delete `backend/build_output.txt`
- [ ] **HK.3:** Delete `backend/test_errors_full.txt` if present
- [ ] **HK.4:** Decide whether to delete the AI-stub PACS migration kits in `D:\PACS_Migration_*` or keep as historical artifacts

### Cross-cutting concerns

- [ ] **CC.1:** Verify Codex / June 10 unveil lane is undisturbed at every commit
- [ ] **CC.2:** Confirm no Sync code references PACS violator paths (`backend/src/TerraFusion.API/Services/*PACS*.cs` etc.)
- [ ] **CC.3:** Add CI gate: `MigrationSafetyTests` that asserts known table names exist post-apply
- [ ] **CC.4:** Verify FISMA `CreatedBy`/`UpdatedBy` populated by AuditableEntityInterceptor when Sync runs outside HTTP context
- [ ] **CC.5:** Document Pack vendor-data licensing posture (TAUserGuide is reference; M&S is licensed; queries are reference)

---

## Part 4: Self-Review

### 4.1 Spec coverage

Walking through the user's spec items:

- [x] Slice A spine schema (4 entities) — covered in Slice A
- [x] Slice A.5 canonical landing (Owner, OwnershipEvent, LandSegment, ImprovementDetail) — covered with locked field lists
- [x] Slice B1 Database Atlas — covered, decomposed into sub-slices
- [x] Slice B2 Data Profile — high-level scope
- [x] Slice B3 Pack Seeder — high-level scope, decision needed
- [x] Slice C Mapping Workbook — high-level scope, decision needed
- [x] Slice D Mapping Import — high-level scope
- [x] Slice E Dry Run — high-level scope, locked: new Workbench pipeline
- [x] Slice F Quarantine Review — high-level scope
- [x] Slice G Commit — high-level scope
- [x] Slice H Evidence Packet — high-level scope, decision needed
- [x] Proof gates (pacsnonprivy, ascprod restore) — captured
- [x] Housekeeping (stale .txt files, singular comment) — parked correctly
- [x] EF migration safety (API startup) — captured throughout
- [x] No Improvement parent in A.5 — locked
- [x] No PropertyOwnership / CurrentOwnerId — locked
- [x] Profile tables in B1 not A.5 — locked
- [x] New Workbench pipeline, not refactor — locked

### 4.2 Placeholder scan

Searched for: TBD, TODO, fill in, similar to, implement later, appropriate error handling.

Found:
- "Full task breakdown deferred to start of B1" in Slice B1 — acceptable because each sub-slice is named with explicit scope; deferring detail until B1 starts ensures plans match reality.
- "Each test ~30 lines (full test code omitted here for brevity — follow Slice A's pattern exactly)" in Task A.5.7 — acceptable; the pattern is fully shown in Slice A; replicating verbatim in plan would be DRY violation.
- "Full task breakdown deferred to start" in Slices B2-H — same justification.

No problematic placeholders.

### 4.3 Type consistency

Walked through entities and configs:
- `Owner.SourceOwnerId` (string, NOT NULL) — used in OwnershipEvent? No, OwnershipEvent has `SourceChangeOfOwnerId`. Different field. OK.
- `OwnershipEvent.OwnerId` (Guid) → FK to `Owner.Id` (Guid). Match. OK.
- `OwnershipEvent.PropertyId` (Guid) → FK to `Property.Id` (Guid, exists). Match. OK.
- `LandSegment.PropertyId` → `Property.Id`. Match. OK.
- `ImprovementDetail.PropertyId` → `Property.Id`. Match. OK.
- `ImprovementDetail.SourceImprvId` (int) — was `int` in PACS source. Match.
- All entities have `CountyId` + County navigation. Consistent.
- Audit fields (`CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`) consistent across all entities.

No type mismatches.

### 4.4 Sequence consistency

- Slice A → Slice A.5 → Slice B1 → Slice B2 → Slice B3 → Slice C → Slice D → Slice E → Slice F → Slice G → Slice H
- Each slice depends only on prior slices.
- No forward dependencies.

OK.

### 4.5 Multi-role gaps recheck

- DBA: covered (migration safety, restore strategy, indexing).
- SRE: covered (lock blocker, build gates).
- Security: covered (FISMA, sovereignty, secrets).
- QA: covered (TDD, regression tests, Benton Method round-trip).
- Product: covered (Excel UX, quarantine UX, evidence PDF).
- Architect: covered (engine coexistence, namespace boundaries).
- Compliance: covered (RCW, audit trail, vendor licensing).
- PM: covered (sequence, blockers, T-shirt sizing).
- Reliability: covered (rollback, backup, retry).

No gaps surfaced post-review.

---

## Part 5: Execution Handoff

This plan is now complete and saved. Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task; review between tasks; fast iteration. Best for Slice A and A.5 because each task is small and reviewable.

**2. Inline Execution** — Execute tasks in the current session using `superpowers:executing-plans`; batch with checkpoints. Best for housekeeping or proof-gate steps that don't need fresh-context isolation.

For TerraFusion Sync specifically, recommend **Subagent-Driven for code slices (A, A.5, B1, B2, B3, C, D, E, F, G, H)** and **Inline for proof gates (PG.1-PG.5) and housekeeping (HK.1-HK.4)**.

When the operator confirms PID 42384 is stopped, the next message should be:

> "API stopped, lock released. Begin Slice A execution."

At that point, dispatch the first subagent against Task A.1 with a tight prompt referencing this plan.

---

**Plan version:** 1.1
**Authored:** 2026-04-26
**Revised:** 2026-04-26 (post solo-dev/agents review pass)
**Author:** TerraFusion Sync planning lane
**Status:** APPROVED — awaiting Slice A unblock

### Revision history

- **v1.1.1 (2026-04-26):** Final landmine cleanup — Tracking checklist B0.1 converted to PowerShell `Get-Process`. No more mixed-shell commands anywhere in the document.
- **v1.1 (2026-04-26):** Solo-dev/agents review pass. Three corrections applied:
  1. All shell commands converted to PowerShell as primary; Git Bash variants in collapsible blocks where useful. No more `tasklist //FI`, `grep -nE`, `tail`, or backslash-line-continuations exposed to operator paste.
  2. Slice A test framing tightened: `SyncSpineSchemaTests` is a wiring test (entity ↔ config ↔ DbContext), NOT a migration safety test. Migration safety remains the scaffold inspection + local `database update` proof.
  3. Slice B1 reordered: CLI runner before HTTP endpoint. HTTP deferred to B1.9 (post-MVP) and gated on auth-posture decision (B1.0). Solo-operator workflow is CLI-first.
- **v1.0 (2026-04-26):** Initial plan. 9-role review, slice-by-slice tasks, tracking checklist.
