using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Mapping;

/// <summary>
/// Slice C14-B service tests. Mirrors the C9-B / C10-B / C11-B test
/// scaffolding patterns (InMemory provider, fresh database per test).
/// Pins every Hard Guard from the C14-A policy doc.
/// </summary>
public class SyncMappingWorkbookReviewProgressServiceTests
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
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();
        return new TerraFusionDbContext(options, configuration);
    }

    private sealed record Fixture(
        County County,
        SyncMappingWorkbook Workbook,
        SyncMappingColumn WacColumn,
        SyncMappingColumn RatioColumn,
        SyncMappingColumn UseColumn,
        SyncMappingColumn ImprvColumn);

    /// <summary>
    /// Seeds a 4-column workbook (sales×2 + valuation + improvement)
    /// with a small per-column code-value vocabulary. Default seeded
    /// state is mostly NeedsReview; individual tests then mutate the
    /// rows they care about before calling the service.
    /// </summary>
    private static async Task<Fixture> SeedFixtureAsync(
        TerraFusionDbContext db, string status = "Draft", string? countyName = "Benton")
    {
        var county = new County
        {
            Id = Guid.NewGuid(),
            Name = countyName!,
            State = "WA",
            FipsCode = countyName == "Benton" ? "53005" : "53077",
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

        var wb = new SyncMappingWorkbook
        {
            CountyId = county.Id,
            SourceConnectionId = conn.Id,
            ProfileBatchId = batch.Id,
            Name = "fixture-progress",
            Status = status,
        };
        db.SyncMappingWorkbooks.Add(wb);

        // Sales lane × 2
        var wac = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "sale", SourceColumn = "wac_cd",
            MappingLane = "Sales", ReviewStatus = "NeedsReview",
        };
        var ratio = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "sale", SourceColumn = "sl_ratio_type_cd",
            MappingLane = "Sales", ReviewStatus = "NeedsReview",
        };
        // Valuation lane
        var use = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "property_val", SourceColumn = "property_use_cd",
            MappingLane = "Valuation", ReviewStatus = "NeedsReview",
        };
        // Improvement lane
        var imprv = new SyncMappingColumn
        {
            CountyId = county.Id, WorkbookId = wb.Id,
            SourceSchema = "dbo", SourceTable = "imprv", SourceColumn = "imprv_state_cd",
            MappingLane = "Improvement", ReviewStatus = "NeedsReview",
        };
        db.SyncMappingColumns.AddRange(wac, ratio, use, imprv);

        // wac_cd: 4 code-values
        db.SyncMappingCodeValues.AddRange(
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = wac.Id, SourceValue = "458-61A-201",    ReviewStatus = "NeedsReview" },
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = wac.Id, SourceValue = "458-61A-203(1)", ReviewStatus = "NeedsReview" },
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = wac.Id, SourceValue = "458-61A-217(1)", ReviewStatus = "NeedsReview" },
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = wac.Id, SourceValue = "458-20-192",     ReviewStatus = "NeedsReview" });
        // ratio: 3
        db.SyncMappingCodeValues.AddRange(
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = ratio.Id, SourceValue = "00", ReviewStatus = "NeedsReview" },
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = ratio.Id, SourceValue = "1",  ReviewStatus = "NeedsReview" },
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = ratio.Id, SourceValue = "9",  ReviewStatus = "NeedsReview" });
        // use_cd: 2
        db.SyncMappingCodeValues.AddRange(
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = use.Id, SourceValue = "11", ReviewStatus = "NeedsReview" },
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = use.Id, SourceValue = "21", ReviewStatus = "NeedsReview" });
        // imprv: 1
        db.SyncMappingCodeValues.Add(
            new SyncMappingCodeValue { CountyId = county.Id, MappingColumnId = imprv.Id, SourceValue = "AVG", ReviewStatus = "NeedsReview" });

        await db.SaveChangesAsync();
        return new Fixture(county, wb, wac, ratio, use, imprv);
    }

    // ── Section 1: Workbook Summary ─────────────────────────────────────

    [Fact]
    public async Task Progress_ReportsWorkbookSummary()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        report.WorkbookId.Should().Be(fx.Workbook.Id);
        report.WorkbookName.Should().Be("fixture-progress");
        report.Status.Should().Be("Draft");
        report.CountyId.Should().Be(fx.County.Id);
        report.SourceConnectionId.Should().Be(fx.Workbook.SourceConnectionId);
        report.ProfileBatchId.Should().Be(fx.Workbook.ProfileBatchId);
        report.ColumnCount.Should().Be(4);
        report.CodeValueCount.Should().Be(10); // 4 + 3 + 2 + 1
    }

    // ── County scope ────────────────────────────────────────────────────

    [Fact]
    public async Task Progress_RejectsCrossCountyWorkbook()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);
        var otherCountyId = Guid.NewGuid();

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        Func<Task> act = () => sut.GetReportAsync(otherCountyId, fx.Workbook.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*not found for county {otherCountyId}*");
    }

    // ── Read-only contract (Hard Guard #1) ──────────────────────────────

    [Fact]
    public async Task Progress_DoesNotMutateWorkbookUpdatedAt()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);
        var preUpdatedAt = fx.Workbook.UpdatedAt;

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        var reloaded = await db.SyncMappingWorkbooks.AsNoTracking()
            .SingleAsync(w => w.Id == fx.Workbook.Id);
        reloaded.UpdatedAt.Should().Be(preUpdatedAt,
            "the progress report must be read-only — UpdatedAt must not bump");
        reloaded.UpdatedBy.Should().Be(fx.Workbook.UpdatedBy,
            "UpdatedBy must also not bump");
    }

    // ── Section 2: Status Counts ────────────────────────────────────────

    [Fact]
    public async Task Progress_CountsTerminalStatusesCorrectly()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        // Promote some code-values to terminal states.
        var values = await db.SyncMappingCodeValues
            .Where(v => v.MappingColumnId == fx.WacColumn.Id).OrderBy(v => v.SourceValue).ToListAsync();
        values[0].ReviewStatus = "Mapped";
        values[1].ReviewStatus = "Excluded";
        values[2].ReviewStatus = "Deferred";
        // Also promote the column itself.
        var wac = await db.SyncMappingColumns.SingleAsync(c => c.Id == fx.WacColumn.Id);
        wac.ReviewStatus = "Mapped";
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        report.CodeValueStatusCounts.Mapped.Should().Be(1);
        report.CodeValueStatusCounts.Excluded.Should().Be(1);
        report.CodeValueStatusCounts.Deferred.Should().Be(1);
        report.CodeValueStatusCounts.Terminal.Should().Be(3);
        report.ColumnStatusCounts.Mapped.Should().Be(1);
        report.ColumnStatusCounts.Terminal.Should().Be(1);
    }

    [Fact]
    public async Task Progress_CountsNonTerminalStatusesCorrectly()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        // Move one row to InProgress; leave others NeedsReview.
        var anchor = await db.SyncMappingCodeValues
            .FirstAsync(v => v.MappingColumnId == fx.RatioColumn.Id);
        anchor.ReviewStatus = "InProgress";
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        report.CodeValueStatusCounts.NeedsReview.Should().Be(9);  // 10 - 1 = 9
        report.CodeValueStatusCounts.InProgress.Should().Be(1);
        report.CodeValueStatusCounts.NonTerminal.Should().Be(10);  // 9 + 1
        report.CodeValueStatusCounts.Terminal.Should().Be(0);
    }

    // ── Section 3: Lane Breakdown ───────────────────────────────────────

    [Fact]
    public async Task Progress_GroupsByLane()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        // Promote one Sales code-value to terminal so Sales has 14% complete (1 of 7 = 14.3%).
        var ratioVal = await db.SyncMappingCodeValues
            .FirstAsync(v => v.MappingColumnId == fx.RatioColumn.Id);
        ratioVal.ReviewStatus = "Mapped";
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        report.LaneBreakdown.Should().HaveCount(3); // Sales, Valuation, Improvement

        var sales = report.LaneBreakdown.Single(l => l.Lane == "Sales");
        sales.Columns.Should().Be(2);
        sales.CodeValues.Should().Be(7); // 4 wac + 3 ratio
        sales.Terminal.Should().Be(1);
        sales.NonTerminal.Should().Be(6);
        sales.PercentComplete.Should().Be(14.3m);

        var valuation = report.LaneBreakdown.Single(l => l.Lane == "Valuation");
        valuation.Columns.Should().Be(1);
        valuation.CodeValues.Should().Be(2);
        valuation.PercentComplete.Should().Be(0.0m);
    }

    // ── Section 4: Top Blocking Columns ─────────────────────────────────

    [Fact]
    public async Task Progress_ListsTopBlockingColumns()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        // Promote every wac_cd code-value to terminal so wac_cd is
        // fully reviewed (NonTerminal=0) and must be omitted from
        // Top Blockers.
        foreach (var v in await db.SyncMappingCodeValues
            .Where(v => v.MappingColumnId == fx.WacColumn.Id).ToListAsync())
        {
            v.ReviewStatus = "Mapped";
        }
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        var sourceLabels = report.TopBlockingColumns
            .Select(b => $"{b.SourceSchema}.{b.SourceTable}.{b.SourceColumn}")
            .ToList();
        sourceLabels.Should().NotContain("dbo.sale.wac_cd",
            "fully-reviewed columns must be omitted from the Top Blockers list");

        // Ratio (3 NonTerminal) > use_cd (2) > imprv (1). Stable sort
        // by Source on ties (none here, but tested separately).
        report.TopBlockingColumns.Should().HaveCount(3);
        report.TopBlockingColumns[0].SourceColumn.Should().Be("sl_ratio_type_cd");
        report.TopBlockingColumns[0].NonTerminal.Should().Be(3);
        report.TopBlockingColumns[1].SourceColumn.Should().Be("property_use_cd");
        report.TopBlockingColumns[2].SourceColumn.Should().Be("imprv_state_cd");
    }

    // ── Section 5: Sales Review Focus ───────────────────────────────────

    [Fact]
    public async Task Progress_IncludesSalesFocus()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        report.SalesFocus.Should().HaveCount(2);
        report.SalesFocus[0].SourceColumn.Should().Be("wac_cd");
        report.SalesFocus[1].SourceColumn.Should().Be("sl_ratio_type_cd");

        var wacFocus = report.SalesFocus.Single(s => s.SourceColumn == "wac_cd");
        wacFocus.CodeValues.Should().Be(4);
        wacFocus.NonTerminal.Should().Be(4);
        wacFocus.PercentComplete.Should().Be(0.0m);
        wacFocus.ColumnReviewStatus.Should().Be("NeedsReview");
    }

    [Fact]
    public async Task Progress_OmitsSalesFocusRowWhenColumnAbsent()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        // Remove the ratio column entirely. The Sales Focus section
        // must omit it without erroring; wac_cd row still renders.
        var ratioValues = await db.SyncMappingCodeValues
            .Where(v => v.MappingColumnId == fx.RatioColumn.Id).ToListAsync();
        db.SyncMappingCodeValues.RemoveRange(ratioValues);
        var ratioCol = await db.SyncMappingColumns.SingleAsync(c => c.Id == fx.RatioColumn.Id);
        db.SyncMappingColumns.Remove(ratioCol);
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        report.SalesFocus.Should().HaveCount(1);
        report.SalesFocus[0].SourceColumn.Should().Be("wac_cd");
    }

    // ── Section 6: Lock Readiness ───────────────────────────────────────

    [Fact]
    public async Task Progress_ReportsReadyToLockFalseWhenAnyRowNonTerminal()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        report.LockReadiness.Status.Should().Be(SyncMappingReviewLockReadinessStatus.NotReady);
        report.LockReadiness.BlockingColumns.Should().Be(4);
        report.LockReadiness.BlockingCodeValues.Should().Be(10);
    }

    [Fact]
    public async Task Progress_ReportsReadyToLockTrueOnFullyTerminalFixture()
    {
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db);

        // Promote everything to a terminal status.
        foreach (var c in await db.SyncMappingColumns
            .Where(c => c.WorkbookId == fx.Workbook.Id).ToListAsync())
        {
            c.ReviewStatus = "Mapped";
        }
        foreach (var v in await db.SyncMappingCodeValues
            .Where(v => db.SyncMappingColumns.Where(c => c.WorkbookId == fx.Workbook.Id).Select(c => c.Id).Contains(v.MappingColumnId)).ToListAsync())
        {
            v.ReviewStatus = "Mapped";
        }
        await db.SaveChangesAsync();

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        report.LockReadiness.Status.Should().Be(SyncMappingReviewLockReadinessStatus.Ready);
        report.LockReadiness.BlockingColumns.Should().Be(0);
        report.LockReadiness.BlockingCodeValues.Should().Be(0);
    }

    [Fact]
    public async Task Progress_ReportsAlreadyLockedWhenStatusMapped()
    {
        // Fixture seeded with Status='Mapped' from the start. The
        // Lock Readiness section must not say "ready" or "not ready" —
        // it must say "already Mapped" and report zero blockers
        // regardless of per-row state.
        await using var db = CreateContext($"prog-{Guid.NewGuid()}");
        var fx = await SeedFixtureAsync(db, status: "Mapped");

        var sut = new SyncMappingWorkbookReviewProgressService(db);
        var report = await sut.GetReportAsync(fx.County.Id, fx.Workbook.Id);

        report.Status.Should().Be("Mapped");
        report.LockReadiness.Status.Should().Be(SyncMappingReviewLockReadinessStatus.AlreadyLocked);
        report.LockReadiness.BlockingColumns.Should().Be(0);
        report.LockReadiness.BlockingCodeValues.Should().Be(0);
    }
}
