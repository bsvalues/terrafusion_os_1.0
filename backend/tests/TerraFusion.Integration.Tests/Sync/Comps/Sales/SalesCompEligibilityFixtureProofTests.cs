using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Comps.Sales;
using TerraFusion.Sync.Workbench.Mapping;
using TerraFusion.Sync.Workbench.Transforms.Sales;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Comps.Sales;

/// <summary>
/// Slice C37-B end-to-end fixture proof. Drives the full chain
/// (workbook → C36 runner → CanonicalSaleQualifications → C37
/// filter → comp pool) against a synthetic fixture and emits an
/// evidence pair (JSON + Markdown) to
/// <c>os-platform/core/pilot/evidence/</c>.
///
/// <para>This is the C37-A "fixture proof" success gate. The evidence
/// pair is the auditable artifact a future operator (or co-founder
/// review) can read to confirm the WacCd-bug containment is
/// mechanically enforced: pre-conversion / unmapped / problematic
/// <c>wac_cd</c> codes never reach the comp pool.</para>
///
/// <para>Reconciliation rule (per C37-A Hard Guard / proof contract):
/// <list type="bullet">
/// <item><c>RowsRead = Qualified + Excluded + Inconclusive +
///   SkippedNoIdentifier</c></item>
/// <item><c>CompPoolSize = Qualified</c></item>
/// </list>
/// The test fails if these don't hold.
/// </para>
///
/// <para>The proof is hermetic: synthetic fixture, InMemory DB,
/// fake row reader. C37-C (deferred) will run a live-PACS variant
/// against workbook
/// <c>a767c8a2-5b8a-4846-af8b-c3496601e924</c>.</para>
/// </summary>
public class SalesCompEligibilityFixtureProofTests
{
    private const string Schema      = "dbo";
    private const string Table       = "sale";
    private const string WacColumn   = "wac_cd";
    private const string RatioColumn = "sl_ratio_type_cd";
    private const string OperatorId  = "c37-fixture-proof";

    private static TerraFusionDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    private sealed class FakeSalesRowReader : ISalesRowReader
    {
        private readonly List<SalesRow> _rows;

        public FakeSalesRowReader(IEnumerable<SalesRow> rows) => _rows = rows.ToList();

        public Task<IReadOnlyList<SalesRow>> ReadAsync(
            SyncSourceConnection connection,
            int maxRows,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SalesRow>>(_rows.Take(maxRows).ToList());
    }

    [Fact]
    public async Task FixtureProof_DemonstratesWacCdBugContainmentEndToEnd()
    {
        // ── Arrange: synthetic Mapped workbook + 9 PACS sale rows ──
        await using var db = CreateContext($"c37-proof-{Guid.NewGuid()}");

        var county = new County
        {
            Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005",
        };
        db.Counties.Add(county);

        var conn = new SyncSourceConnection
        {
            Id              = Guid.NewGuid(),
            CountyId        = county.Id,
            Name            = "Benton PACS OLTP",
            SourceSystem    = "PACS",
            ConnectionType  = "SqlServer",
            Server          = "localhost,1433",
            Database        = "pacs_oltp",
            AuthMode        = "SqlAuth",
            IsActive        = true,
        };
        db.SyncSourceConnections.Add(conn);

        var batch = new SyncBatch
        {
            CountyId = county.Id, SourceSystem = "PACS", Mode = "profile",
            Status = "completed",
            StartedAtUtc   = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 0,
        };
        db.SyncBatches.Add(batch);

        var lockedAt = new DateTime(2026, 4, 28, 21, 0, 0, DateTimeKind.Utc);
        var workbook = new SyncMappingWorkbook
        {
            CountyId = county.Id, SourceConnectionId = conn.Id,
            ProfileBatchId = batch.Id,
            Name = "c37-fixture-mapped-workbook",
            Status = "Mapped",
            UpdatedAt = lockedAt,
        };
        db.SyncMappingWorkbooks.Add(workbook);

        var wacCol = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = workbook.Id,
            SourceSchema = Schema, SourceTable = Table, SourceColumn = WacColumn,
            MappingLane = "Sales", ReviewStatus = "Mapped",
            CanonicalTarget = "canonical.SaleQualification",
        };
        var ratioCol = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = workbook.Id,
            SourceSchema = Schema, SourceTable = Table, SourceColumn = RatioColumn,
            MappingLane = "Sales", ReviewStatus = "Mapped",
            CanonicalTarget = "canonical.RatioStudyType",
        };
        db.SyncMappingColumns.AddRange(wacCol, ratioCol);

        // wac_cd: ArmsLengthSale (Mapped), 217(1) (Excluded). Ratio:
        // "00" Conventional (Mapped), "27" (Deferred → Inconclusive).
        db.SyncMappingCodeValues.AddRange(
            new SyncMappingCodeValue
            {
                CountyId = county.Id, MappingColumnId = wacCol.Id,
                SourceValue = "458-61A-203(1)",
                ReviewStatus = "Mapped",
                CanonicalValue = "ArmsLengthSale",
                IsExcluded = false, ObservedCount = 100,
            },
            new SyncMappingCodeValue
            {
                CountyId = county.Id, MappingColumnId = wacCol.Id,
                SourceValue = "458-61A-217(1)",
                ReviewStatus = "Excluded",
                CanonicalValue = null,
                IsExcluded = true, ObservedCount = 50,
            },
            new SyncMappingCodeValue
            {
                CountyId = county.Id, MappingColumnId = ratioCol.Id,
                SourceValue = "00",
                ReviewStatus = "Mapped",
                CanonicalValue = "Conventional",
                IsExcluded = false, ObservedCount = 100,
            },
            new SyncMappingCodeValue
            {
                CountyId = county.Id, MappingColumnId = ratioCol.Id,
                SourceValue = "27",
                ReviewStatus = "Deferred",
                CanonicalValue = null,
                IsExcluded = false, ObservedCount = 25,
            });
        await db.SaveChangesAsync();

        // 9 fixture sale rows covering the full decision matrix:
        //   3 Qualified, 2 Excluded, 1 Deferred, 1 Unknown,
        //   1 MissingCode, 1 SkippedNoIdentifier (null ChgOfOwnerId).
        var saleDate = new DateTime(2025, 6, 15, 0, 0, 0, DateTimeKind.Utc);
        var rows = new[]
        {
            // Qualified
            new SalesRow("CHG-100", "458-61A-203(1)", "00", 100, saleDate, 425000m),
            new SalesRow("CHG-101", "458-61A-203(1)", "00", 101, saleDate, 510000m),
            new SalesRow("CHG-102", "458-61A-203(1)", "00", 102, saleDate, 380000m),
            // Excluded — operator-tagged 217(1)
            new SalesRow("CHG-200", "458-61A-217(1)", "00", 200, saleDate, 999999m),
            new SalesRow("CHG-201", "458-61A-217(1)", "00", 201, saleDate, 1m),
            // Deferred ratio (Inconclusive)
            new SalesRow("CHG-300", "458-61A-203(1)", "27", 300, saleDate, 450000m),
            // Unknown wac_cd (Inconclusive — workbook silent, the
            // 2017-conversion-caveat surface)
            new SalesRow("CHG-400", "PRE-2017-CODE", "00", 400, saleDate, 425000m),
            // MissingCode wac_cd (Inconclusive)
            new SalesRow("CHG-500", null, "00", 500, saleDate, 425000m),
            // SkippedNoIdentifier — null ChgOfOwnerId, not persisted
            new SalesRow(null, "458-61A-203(1)", "00", null, saleDate, 425000m),
        };

        var runner = new SalesQualificationCanonicalRunner(
            db,
            new SyncMappingWorkbookReadModel(db),
            new FakeSalesRowReader(rows),
            new CanonicalSalesQualificationWriter(db));

        // ── Act 1: run the C36 write-side ──
        var runResult = await runner.RunAsync(
            county.Id, workbook.Id, conn.Id,
            maxSales: rows.Length, operatorId: OperatorId);

        // ── Act 2: query the C37 comp filter ──
        var reader = new SalesCompEligibilityReader(db);
        var compPool = await reader.ReadAsync(county.Id, sourceWorkbookId: workbook.Id);

        // ── Reconciliation rule (C37-A) ──
        runResult.RowsRead.Should().Be(9);
        runResult.QualifiedCount.Should().Be(3);
        runResult.ExcludedCount.Should().Be(2);
        runResult.InconclusiveCount.Should().Be(3); // deferred + unknown + missing
        runResult.SkippedNoIdentifierCount.Should().Be(1);
        (runResult.QualifiedCount + runResult.ExcludedCount +
         runResult.InconclusiveCount + runResult.SkippedNoIdentifierCount)
            .Should().Be(runResult.RowsRead, "reconciliation rule: counts must sum to RowsRead");

        compPool.Should().HaveCount(runResult.QualifiedCount,
            "comp pool size must equal Qualified count");
        compPool.Select(s => s.ChgOfOwnerId).Should().BeEquivalentTo(new[] { 100, 101, 102 });

        // The WacCd-bug containment assertion: no operator-tagged
        // 217(1) and no PRE-2017-CODE ever appears in the comp pool.
        compPool.Should().NotContain(s => s.WacCdSourceValue == "458-61A-217(1)");
        compPool.Should().NotContain(s => s.WacCdSourceValue == "PRE-2017-CODE");
        compPool.Should().NotContain(s => s.WacCdSourceValue == null);
        compPool.Should().OnlyContain(s => s.WacCdCanonicalValue == "ArmsLengthSale");
        compPool.Should().OnlyContain(s => s.SlRatioTypeCdCanonicalValue == "Conventional");

        // No collateral mutation: workbook unchanged.
        var postWb = await db.SyncMappingWorkbooks.AsNoTracking()
            .SingleAsync(w => w.Id == workbook.Id);
        postWb.Status.Should().Be("Mapped");
        postWb.UpdatedAt.Should().Be(lockedAt);

        // ── Emit evidence pair ──
        var evidenceDir = LocateEvidenceDir();
        Directory.CreateDirectory(evidenceDir);
        var stamp = DateTime.UtcNow.ToString("yyyyMMddTHHmmssZ");

        var jsonPath = Path.Combine(evidenceDir, $"c37-comp-eligibility-fixture-proof.{stamp}.json");
        var mdPath   = Path.Combine(evidenceDir, $"c37-comp-eligibility-fixture-proof.{stamp}.md");
        var latestJson = Path.Combine(evidenceDir, "c37-comp-eligibility-fixture-proof.latest.json");
        var latestMd   = Path.Combine(evidenceDir, "c37-comp-eligibility-fixture-proof.latest.md");

        var payload = new
        {
            slice = "C37-B",
            kind = "fixture-proof",
            generatedAtUtc = stamp,
            countyId = county.Id,
            countyName = county.Name,
            sourceWorkbookId = workbook.Id,
            sourceWorkbookLockedAt = lockedAt,
            run = new
            {
                rowsRead = runResult.RowsRead,
                qualified = runResult.QualifiedCount,
                excluded = runResult.ExcludedCount,
                inconclusive = runResult.InconclusiveCount,
                skippedNoIdentifier = runResult.SkippedNoIdentifierCount,
                rowsPersisted = runResult.RowsPersisted,
            },
            compPool = new
            {
                size = compPool.Count,
                ids = compPool.Select(s => s.ChgOfOwnerId).ToArray(),
            },
            reconciliation = new
            {
                rowsReadEqualsSumOfBuckets = runResult.RowsRead ==
                    runResult.QualifiedCount + runResult.ExcludedCount +
                    runResult.InconclusiveCount + runResult.SkippedNoIdentifierCount,
                compPoolEqualsQualified = compPool.Count == runResult.QualifiedCount,
            },
            wacCdContainment = new
            {
                operatorTaggedExcludedSamples = runResult.Entries
                    .Where(e => e.WacCode == "458-61A-217(1)")
                    .Select(e => new { e.ChgOfOwnerId, e.WacCode, e.TransformStatus, e.Persisted })
                    .ToArray(),
                workbookSilentInconclusiveSamples = runResult.Entries
                    .Where(e => e.WacCode == "PRE-2017-CODE" || e.WacCode == null)
                    .Select(e => new { e.ChgOfOwnerId, e.WacCode, e.TransformStatus, e.Persisted, e.SkipReason })
                    .ToArray(),
            },
        };

        var jsonOpts = new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        };
        var jsonText = JsonSerializer.Serialize(payload, jsonOpts);
        await File.WriteAllTextAsync(jsonPath, jsonText);
        await File.WriteAllTextAsync(latestJson, jsonText);

        var md = new StringBuilder();
        md.AppendLine("# C37-B Comp-Eligibility Fixture Proof");
        md.AppendLine();
        md.AppendLine($"- **Generated (UTC):** {stamp}");
        md.AppendLine($"- **County:** {county.Name} (`{county.Id}`)");
        md.AppendLine($"- **Source workbook:** `{workbook.Id}`");
        md.AppendLine($"- **Workbook locked at (UTC):** {lockedAt:O}");
        md.AppendLine();
        md.AppendLine("## C36 run counts");
        md.AppendLine();
        md.AppendLine($"- Rows read:           {runResult.RowsRead}");
        md.AppendLine($"- Qualified:           {runResult.QualifiedCount}");
        md.AppendLine($"- Excluded:            {runResult.ExcludedCount}");
        md.AppendLine($"- Inconclusive:        {runResult.InconclusiveCount}");
        md.AppendLine($"- SkippedNoIdentifier: {runResult.SkippedNoIdentifierCount}");
        md.AppendLine($"- Rows persisted:      {runResult.RowsPersisted}");
        md.AppendLine();
        md.AppendLine("## C37 comp pool");
        md.AppendLine();
        md.AppendLine($"- Comp pool size: **{compPool.Count}**");
        md.AppendLine($"- Comp-eligible ChgOfOwnerIds: {string.Join(", ", compPool.Select(s => s.ChgOfOwnerId))}");
        md.AppendLine();
        md.AppendLine("## Reconciliation (C37-A rule)");
        md.AppendLine();
        md.AppendLine($"- `RowsRead = Qualified + Excluded + Inconclusive + SkippedNoIdentifier` → " +
                      $"`{runResult.RowsRead} = {runResult.QualifiedCount} + {runResult.ExcludedCount} + " +
                      $"{runResult.InconclusiveCount} + {runResult.SkippedNoIdentifierCount}` " +
                      $"→ **{(payload.reconciliation.rowsReadEqualsSumOfBuckets ? "PASS" : "FAIL")}**");
        md.AppendLine($"- `CompPoolSize = Qualified` → `{compPool.Count} = {runResult.QualifiedCount}` " +
                      $"→ **{(payload.reconciliation.compPoolEqualsQualified ? "PASS" : "FAIL")}**");
        md.AppendLine();
        md.AppendLine("## WacCd-bug containment");
        md.AppendLine();
        md.AppendLine("Operator-tagged exclusions (e.g. `458-61A-217(1)`) and");
        md.AppendLine("workbook-silent codes (e.g. `PRE-2017-CODE`, null) are NOT in the comp pool:");
        md.AppendLine();
        md.AppendLine("| ChgOfOwnerId | wac_cd            | Transform status | Persisted | In comp pool |");
        md.AppendLine("|--------------|-------------------|------------------|-----------|--------------|");
        foreach (var e in runResult.Entries.OrderBy(e => e.ChgOfOwnerId ?? int.MaxValue))
        {
            var inPool = e.ChgOfOwnerId.HasValue &&
                compPool.Any(s => s.ChgOfOwnerId == e.ChgOfOwnerId.Value);
            md.AppendLine($"| {e.ChgOfOwnerId?.ToString() ?? "—"} | " +
                          $"{e.WacCode ?? "<null>"} | " +
                          $"{e.TransformStatus} | " +
                          $"{(e.Persisted ? "yes" : "no")} | " +
                          $"{(inPool ? "yes" : "no")} |");
        }
        md.AppendLine();
        md.AppendLine("All Excluded / Inconclusive / Skipped rows show `In comp pool = no`.");
        md.AppendLine("Only Qualified rows enter the pool. **WacCd-bug containment: enforced mechanically.**");

        var mdText = md.ToString();
        await File.WriteAllTextAsync(mdPath, mdText);
        await File.WriteAllTextAsync(latestMd, mdText);

        // Sanity: evidence files exist on disk.
        File.Exists(jsonPath).Should().BeTrue($"timestamped JSON should be at {jsonPath}");
        File.Exists(mdPath).Should().BeTrue($"timestamped Markdown should be at {mdPath}");
        File.Exists(latestJson).Should().BeTrue();
        File.Exists(latestMd).Should().BeTrue();
    }

    /// <summary>
    /// Walk up from the test bin directory to the repo root, then
    /// resolve <c>os-platform/core/pilot/evidence/</c>. Falls back to
    /// the per-test temp dir if the canonical path can't be located
    /// (e.g. running outside the repo).
    /// </summary>
    private static string LocateEvidenceDir()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        for (var i = 0; i < 10 && dir is not null; i++, dir = dir.Parent)
        {
            var candidate = Path.Combine(dir.FullName, "os-platform", "core", "pilot", "evidence");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }
        }
        return Path.Combine(Path.GetTempPath(), "c37-evidence");
    }
}
