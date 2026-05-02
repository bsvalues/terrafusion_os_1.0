using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;
using TerraFusion.Sync.Workbench.Transforms.Sales;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Transforms.Sales;

/// <summary>
/// Slice BENTON-SYNC-7-B integration tests for
/// <see cref="SqlSalesQualificationCoverageRunner"/>. Pins the
/// smoke-logic acceptance gates from the BENTON-SYNC-7-A test matrix:
/// clean verdict, forward-coverage gap detection, decision drift
/// detection, bounded-run inconclusive backward gap, no canonical
/// mutation.
/// </summary>
public class SqlSalesQualificationCoverageRunnerTests
{
    private const string Schema = "dbo";
    private const string Table = "sale";
    private const string WacColumn = "wac_cd";
    private const string RatioColumn = "sl_ratio_type_cd";

    private static TerraFusionDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
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

    private static async Task<(County county, SyncSourceConnection conn, SyncBatch batch)>
        SeedScopeAsync(TerraFusionDbContext db, string countyName = "Benton")
    {
        var county = new County
        {
            Id = Guid.NewGuid(),
            Name = countyName,
            State = "WA",
            FipsCode = "53005",
        };
        db.Counties.Add(county);

        var conn = new SyncSourceConnection
        {
            Id = Guid.NewGuid(),
            CountyId = county.Id,
            Name = $"{countyName} PACS OLTP",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "localhost,1433",
            Database = "pacs_oltp",
            AuthMode = "SqlAuth",
            IsActive = true,
        };
        db.SyncSourceConnections.Add(conn);

        var batch = new SyncBatch
        {
            CountyId = county.Id,
            SourceSystem = "PACS",
            Mode = "profile",
            Status = "completed",
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 0,
        };
        db.SyncBatches.Add(batch);

        await db.SaveChangesAsync();
        return (county, conn, batch);
    }

    private static async Task<Guid> SeedMappedWorkbookAsync(
        TerraFusionDbContext db,
        Guid countyId,
        Guid connectionId,
        Guid batchId)
    {
        var wb = new SyncMappingWorkbook
        {
            CountyId = countyId,
            SourceConnectionId = connectionId,
            ProfileBatchId = batchId,
            Name = $"sales-coverage-{Guid.NewGuid():N}",
            Status = "Mapped",
            UpdatedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
        };
        db.SyncMappingWorkbooks.Add(wb);

        var wacCol = new SyncMappingColumn
        {
            CountyId = countyId,
            WorkbookId = wb.Id,
            SourceSchema = Schema,
            SourceTable = Table,
            SourceColumn = WacColumn,
            MappingLane = "Sales",
            ReviewStatus = "Mapped",
            CanonicalTarget = "canonical.SaleQualification",
        };
        var ratioCol = new SyncMappingColumn
        {
            CountyId = countyId,
            WorkbookId = wb.Id,
            SourceSchema = Schema,
            SourceTable = Table,
            SourceColumn = RatioColumn,
            MappingLane = "Sales",
            ReviewStatus = "Mapped",
            CanonicalTarget = "canonical.RatioStudyType",
        };
        db.SyncMappingColumns.AddRange(wacCol, ratioCol);

        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId,
            MappingColumnId = wacCol.Id,
            SourceValue = "458-61A-203(1)",
            ReviewStatus = "Mapped",
            CanonicalValue = "ArmsLengthSale",
            IsExcluded = false,
            ObservedCount = 100,
        });
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId,
            MappingColumnId = ratioCol.Id,
            SourceValue = "00",
            ReviewStatus = "Mapped",
            CanonicalValue = "Conventional",
            IsExcluded = false,
            ObservedCount = 100,
        });

        await db.SaveChangesAsync();
        return wb.Id;
    }

    private static void AddCanonicalRow(
        TerraFusionDbContext db,
        Guid countyId,
        int chgOfOwnerId,
        CanonicalSaleQualificationDecision decision,
        Guid workbookId)
    {
        db.Set<CanonicalSaleQualification>().Add(new CanonicalSaleQualification
        {
            CountyId = countyId,
            ChgOfOwnerId = chgOfOwnerId,
            ComputedDecision = decision,
            WacCdSourceValue = "458-61A-203(1)",
            WacCdCanonicalValue = "ArmsLengthSale",
            WacCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SlRatioTypeCdSourceValue = "00",
            SlRatioTypeCdCanonicalValue = "Conventional",
            SlRatioTypeCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SourceWorkbookId = workbookId,
            SourceWorkbookLockedAt = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
            CreatedBy = "test-seed",
            UpdatedBy = "test-seed",
        });
    }

    private sealed class FakeSalesRowReader : ISalesRowReader
    {
        private readonly List<SalesRow> _rows;
        public FakeSalesRowReader(IEnumerable<SalesRow> rows) => _rows = rows.ToList();
        public Task<IReadOnlyList<SalesRow>> ReadAsync(
            SyncSourceConnection connection, int maxRows, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<SalesRow>>(_rows.Take(maxRows).ToList());
    }

    private static SqlSalesQualificationCoverageRunner CreateSut(
        TerraFusionDbContext db, ISalesRowReader reader) =>
        new(db, new SyncMappingWorkbookReadModel(db), reader);

    // ── Smoke logic tests (BENTON-SYNC-7-A test matrix) ──────────────

    [Fact]
    public async Task Run_AllRowsAccountedFor_ProducesCleanVerdict()
    {
        await using var db = CreateContext($"7b-clean-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var rows = new[]
        {
            new SalesRow("1", "458-61A-203(1)", "00", 1, null, null),
            new SalesRow("2", "458-61A-203(1)", "00", 2, null, null),
        };
        AddCanonicalRow(db, county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wbId);
        AddCanonicalRow(db, county.Id, 2, CanonicalSaleQualificationDecision.Qualified, wbId);
        await db.SaveChangesAsync();

        var report = await CreateSut(db, new FakeSalesRowReader(rows))
            .RunAsync(county.Id, wbId, conn.Id, maxSales: null);

        report.Verdict.IsClean.Should().BeTrue();
        report.ForwardCoverageGap.Count.Should().Be(0);
        report.BackwardTraceabilityGap.Count.Should().Be(0);
        report.DecisionDrift.Count.Should().Be(0);
        report.BackwardTraceabilityGap.IsConclusive.Should().BeTrue(
            "unbounded run is conclusive on backward traceability");
    }

    [Fact]
    public async Task Run_PacsRowMissingCanonical_RecordsForwardGap()
    {
        await using var db = CreateContext($"7b-forward-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var rows = new[]
        {
            new SalesRow("1", "458-61A-203(1)", "00", 1, null, null),
            new SalesRow("2", "458-61A-203(1)", "00", 2, null, null),  // no canonical row
        };
        AddCanonicalRow(db, county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wbId);
        await db.SaveChangesAsync();

        var report = await CreateSut(db, new FakeSalesRowReader(rows))
            .RunAsync(county.Id, wbId, conn.Id, maxSales: null);

        report.Verdict.IsClean.Should().BeFalse();
        report.ForwardCoverageGap.Count.Should().Be(1);
        report.ForwardCoverageGap.Sample.Should().ContainSingle(e => e.ChgOfOwnerId == 2);
        report.ForwardCoverageGap.Sample[0].FreshStatus.Should().Be("Qualified");
        report.ForwardCoverageGap.Sample[0].CanonicalStatus.Should().BeNull(
            "no canonical row exists for this ChgOfOwnerId");
    }

    [Fact]
    public async Task Run_CanonicalDecisionDiffersFromFresh_RecordsDrift()
    {
        await using var db = CreateContext($"7b-drift-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var rows = new[]
        {
            new SalesRow("1", "458-61A-203(1)", "00", 1, null, null),  // fresh: Qualified
        };
        // Canonical says Excluded; fresh transform would say Qualified → drift
        AddCanonicalRow(db, county.Id, 1, CanonicalSaleQualificationDecision.Excluded, wbId);
        await db.SaveChangesAsync();

        var report = await CreateSut(db, new FakeSalesRowReader(rows))
            .RunAsync(county.Id, wbId, conn.Id, maxSales: null);

        report.Verdict.IsClean.Should().BeFalse();
        report.DecisionDrift.Count.Should().Be(1);
        report.DecisionDrift.Sample[0].ChgOfOwnerId.Should().Be(1);
        report.DecisionDrift.Sample[0].CanonicalStatus.Should().Be("Excluded");
        report.DecisionDrift.Sample[0].FreshStatus.Should().Be("Qualified");
        report.ForwardCoverageGap.Count.Should().Be(0,
            "drift is recorded as drift, not as forward gap");
    }

    [Fact]
    public async Task Run_CanonicalRowMissingPacs_RecordsBackwardGap()
    {
        await using var db = CreateContext($"7b-backward-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var rows = new[]
        {
            new SalesRow("1", "458-61A-203(1)", "00", 1, null, null),
        };
        AddCanonicalRow(db, county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wbId);
        AddCanonicalRow(db, county.Id, 99, CanonicalSaleQualificationDecision.Qualified, wbId);  // not in PACS scope
        await db.SaveChangesAsync();

        var report = await CreateSut(db, new FakeSalesRowReader(rows))
            .RunAsync(county.Id, wbId, conn.Id, maxSales: null);

        report.BackwardTraceabilityGap.Count.Should().Be(1);
        report.BackwardTraceabilityGap.Sample[0].ChgOfOwnerId.Should().Be(99);
        report.BackwardTraceabilityGap.IsConclusive.Should().BeTrue(
            "unbounded run conclusive on backward traceability");
    }

    [Fact]
    public async Task Run_BoundedRun_BackwardGapMarkedInconclusive()
    {
        await using var db = CreateContext($"7b-bounded-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var rows = new[]
        {
            new SalesRow("1", "458-61A-203(1)", "00", 1, null, null),
        };
        AddCanonicalRow(db, county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wbId);
        AddCanonicalRow(db, county.Id, 99, CanonicalSaleQualificationDecision.Qualified, wbId);
        await db.SaveChangesAsync();

        var report = await CreateSut(db, new FakeSalesRowReader(rows))
            .RunAsync(county.Id, wbId, conn.Id, maxSales: 1);

        report.BackwardTraceabilityGap.IsConclusive.Should().BeFalse(
            "BENTON-SYNC-7-A: bounded scans MUST mark backward gap as inconclusive");
        report.PacsScope.MaxSalesApplied.Should().Be(1);
    }

    // ── Hard-guard tests ─────────────────────────────────────────────

    [Fact]
    public async Task Run_DoesNotMutateCanonicalLandingTable()
    {
        await using var db = CreateContext($"7b-no-mutation-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);
        AddCanonicalRow(db, county.Id, 1, CanonicalSaleQualificationDecision.Qualified, wbId);
        await db.SaveChangesAsync();

        var beforeCount = await db.Set<CanonicalSaleQualification>().CountAsync();

        var rows = new[] { new SalesRow("2", "458-61A-203(1)", "00", 2, null, null) };
        await CreateSut(db, new FakeSalesRowReader(rows))
            .RunAsync(county.Id, wbId, conn.Id, maxSales: null);

        var afterCount = await db.Set<CanonicalSaleQualification>().CountAsync();
        afterCount.Should().Be(beforeCount,
            "BENTON-SYNC-7-A HG3: smoke MUST NOT write to CanonicalSaleQualifications " +
            "even when a forward gap is detected");
    }

    [Fact]
    public async Task Run_NotMappedWorkbook_FailsClosed()
    {
        await using var db = CreateContext($"7b-not-mapped-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        var wb = new SyncMappingWorkbook
        {
            CountyId = county.Id,
            SourceConnectionId = conn.Id,
            ProfileBatchId = batch.Id,
            Name = "draft-not-yet-mapped",
            Status = "Draft",
            UpdatedAt = DateTime.UtcNow,
        };
        db.SyncMappingWorkbooks.Add(wb);
        await db.SaveChangesAsync();

        var rows = new[] { new SalesRow("1", "x", "y", 1, null, null) };
        var act = async () => await CreateSut(db, new FakeSalesRowReader(rows))
            .RunAsync(county.Id, wb.Id, conn.Id, maxSales: null);

        await act.Should().ThrowAsync<InvalidOperationException>(
            "BENTON-SYNC-7-A HG7 fail-closed: non-Mapped workbook MUST throw before " +
            "any PACS or canonical read");
    }
}
