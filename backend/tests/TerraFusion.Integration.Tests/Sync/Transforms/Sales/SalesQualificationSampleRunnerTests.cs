using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;
using TerraFusion.Sync.Workbench.Transforms.Sales;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Transforms.Sales;

/// <summary>
/// Slice C8-C tests: <see cref="SalesQualificationSampleRunner"/>
/// runs end-to-end through fakes for the PACS read side
/// (<see cref="ISalesRowReader"/>) and the real C7 read model + EF
/// Core InMemory provider for the workbook side. Pattern matches
/// C7/C8-B — fresh database name per test, synthetic Mapped workbooks.
/// </summary>
public class SalesQualificationSampleRunnerTests
{
    private const string Schema      = "dbo";
    private const string Table       = "sale";
    private const string WacColumn   = "wac_cd";
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
            Id = Guid.NewGuid(), Name = countyName, State = "WA",
            FipsCode = countyName == "Benton" ? "53005" : "53011",
        };
        db.Counties.Add(county);

        var conn = new SyncSourceConnection
        {
            Id              = Guid.NewGuid(),
            CountyId        = county.Id,
            Name            = $"{countyName} PACS OLTP",
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
            CountyId       = county.Id, SourceSystem = "PACS",
            Mode           = "profile", Status = "completed",
            StartedAtUtc   = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount      = 0,
        };
        db.SyncBatches.Add(batch);

        await db.SaveChangesAsync();
        return (county, conn, batch);
    }

    private static async Task<Guid> SeedSimpleMappedWorkbookAsync(
        TerraFusionDbContext db, Guid countyId, Guid connectionId, Guid batchId,
        string status = "Mapped",
        string name = "wb")
    {
        var wb = new SyncMappingWorkbook
        {
            CountyId           = countyId,
            SourceConnectionId = connectionId,
            ProfileBatchId     = batchId,
            Name               = name,
            Status             = status,
        };
        db.SyncMappingWorkbooks.Add(wb);

        var wacCol = new SyncMappingColumn
        {
            CountyId        = countyId,
            WorkbookId      = wb.Id,
            SourceSchema    = Schema,
            SourceTable     = Table,
            SourceColumn    = WacColumn,
            MappingLane     = "Sales",
            ReviewStatus    = "Mapped",
            CanonicalTarget = "canonical.SaleQualification",
        };
        var ratioCol = new SyncMappingColumn
        {
            CountyId        = countyId,
            WorkbookId      = wb.Id,
            SourceSchema    = Schema,
            SourceTable     = Table,
            SourceColumn    = RatioColumn,
            MappingLane     = "Sales",
            ReviewStatus    = "Mapped",
            CanonicalTarget = "canonical.RatioStudyType",
        };
        db.SyncMappingColumns.AddRange(wacCol, ratioCol);

        // Seed a tiny vocabulary: one operator-mapped per axis, one
        // operator-excluded WAC, one operator-deferred ratio.
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId, MappingColumnId = wacCol.Id,
            SourceValue = "458-61A-203(1)",
            ReviewStatus = "Mapped",
            CanonicalValue = "ArmsLengthSale",
            IsExcluded = false,
            ObservedCount = 100,
        });
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId, MappingColumnId = wacCol.Id,
            SourceValue = "458-61A-217(1)",
            ReviewStatus = "Excluded",
            CanonicalValue = null,
            IsExcluded = true,
            ObservedCount = 50,
        });
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId, MappingColumnId = ratioCol.Id,
            SourceValue = "00",
            ReviewStatus = "Mapped",
            CanonicalValue = "Conventional",
            IsExcluded = false,
            ObservedCount = 100,
        });
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId, MappingColumnId = ratioCol.Id,
            SourceValue = "27",
            ReviewStatus = "Deferred",
            CanonicalValue = null,
            IsExcluded = false,
            ObservedCount = 25,
        });

        await db.SaveChangesAsync();
        return wb.Id;
    }

    /// <summary>
    /// Records every ReadAsync call so tests can assert the
    /// <c>maxRows</c> bound was honored and that PACS was never
    /// consulted on a Draft-workbook fail-closed path.
    /// </summary>
    private sealed class FakeSalesRowReader : ISalesRowReader
    {
        private readonly List<SalesRow> _rows;
        public List<int> MaxRowsRequested { get; } = new();
        public int CallCount { get; private set; }

        public FakeSalesRowReader(IEnumerable<SalesRow> rows)
        {
            _rows = rows.ToList();
        }

        public Task<IReadOnlyList<SalesRow>> ReadAsync(
            SyncSourceConnection connection,
            int maxRows,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            MaxRowsRequested.Add(maxRows);
            // Honor the same TOP-N semantics the live reader does.
            return Task.FromResult<IReadOnlyList<SalesRow>>(_rows.Take(maxRows).ToList());
        }
    }

    private static SalesQualificationSampleRunner CreateSut(
        TerraFusionDbContext db,
        ISalesRowReader salesReader)
        => new SalesQualificationSampleRunner(db, new SyncMappingWorkbookReadModel(db), salesReader);

    // ── Required: status guard ──────────────────────────────────────────

    [Fact]
    public async Task RunAsync_RejectsDraftWorkbookViaReadModel()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id,
            status: "Draft");

        var fakeReader = new FakeSalesRowReader(new[]
        {
            new SalesRow("S-1", "458-61A-203(1)", "00"),
        });
        var sut = CreateSut(db, fakeReader);

        Func<Task> act = () => sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 100);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Status='Draft'*Status='Mapped'*");

        // PACS was never consulted — fail-closed path doesn't query
        // sales when the workbook isn't Mapped.
        fakeReader.CallCount.Should().Be(0);
    }

    // ── Required: bounded read ──────────────────────────────────────────

    [Fact]
    public async Task RunAsync_LimitsRowsByMaxSales()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        // Fake source has 10 rows; runner asks for 3 → reader returns 3.
        var rows = Enumerable.Range(1, 10)
            .Select(i => new SalesRow($"S-{i}", "458-61A-203(1)", "00"))
            .ToList();
        var fakeReader = new FakeSalesRowReader(rows);
        var sut = CreateSut(db, fakeReader);

        var result = await sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 3);

        result.RowsRead.Should().Be(3);
        result.Sample.Should().HaveCount(3);
        fakeReader.MaxRowsRequested.Should().ContainSingle().Which.Should().Be(3);
    }

    // ── Required: status counts ─────────────────────────────────────────

    [Fact]
    public async Task RunAsync_ProducesStatusCounts()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        // Mix: 2 Qualified, 1 Excluded (WAC excluded), 1 Deferred
        // (ratio deferred), 1 Unknown (WAC not in workbook), 1 Missing
        // (WAC blank).
        var rows = new[]
        {
            new SalesRow("S-1",  "458-61A-203(1)", "00"),  // Qualified
            new SalesRow("S-2",  "458-61A-203(1)", "00"),  // Qualified
            new SalesRow("S-3",  "458-61A-217(1)", "00"),  // Excluded
            new SalesRow("S-4",  "458-61A-203(1)", "27"),  // Deferred
            new SalesRow("S-5",  "999-UNKNOWN",    "00"),  // Unknown
            new SalesRow("S-6",  null,             "00"),  // MissingCode
        };
        var sut = CreateSut(db, new FakeSalesRowReader(rows));

        var result = await sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 100);

        result.RowsRead.Should().Be(6);
        result.QualifiedCount.Should().Be(2);
        result.ExcludedCount.Should().Be(1);
        result.DeferredCount.Should().Be(1);
        result.UnknownCount.Should().Be(1);
        result.MissingCodeCount.Should().Be(1);
        // Aggregate sanity: counts sum to RowsRead.
        (result.QualifiedCount + result.ExcludedCount + result.DeferredCount +
         result.UnknownCount + result.MissingCodeCount)
            .Should().Be(result.RowsRead);
    }

    // ── Required: read-only contract ─────────────────────────────────────

    [Fact]
    public async Task RunAsync_DoesNotMutateWorkbook()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var preWb       = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wbId);
        var preColumns  = await db.SyncMappingColumns.AsNoTracking().Where(c => c.WorkbookId == wbId).ToListAsync();
        var preColIds   = preColumns.Select(c => c.Id).ToList();
        var preValues   = await db.SyncMappingCodeValues.AsNoTracking()
            .Where(v => preColIds.Contains(v.MappingColumnId)).ToListAsync();

        var rows = new[]
        {
            new SalesRow("S-1", "458-61A-203(1)", "00"),
            new SalesRow("S-2", "458-61A-217(1)", "00"),
            new SalesRow("S-3", "458-61A-203(1)", "27"),
            new SalesRow("S-4", "999-UNKNOWN",    "00"),
            new SalesRow("S-5", null,             null),
        };
        var sut = CreateSut(db, new FakeSalesRowReader(rows));
        await sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 5);

        var postWb     = await db.SyncMappingWorkbooks.AsNoTracking().SingleAsync(w => w.Id == wbId);
        var postValues = await db.SyncMappingCodeValues.AsNoTracking()
            .Where(v => preColIds.Contains(v.MappingColumnId)).ToListAsync();

        postWb.Status.Should().Be(preWb.Status);
        postWb.UpdatedAt.Should().Be(preWb.UpdatedAt);
        postValues.Should().HaveCount(preValues.Count);
        foreach (var pre in preValues)
        {
            var post = postValues.Single(v => v.Id == pre.Id);
            post.IsExcluded.Should().Be(pre.IsExcluded);
            post.ReviewStatus.Should().Be(pre.ReviewStatus);
            post.CanonicalValue.Should().Be(pre.CanonicalValue);
        }
    }

    // ── Required: no canonical writes ────────────────────────────────────

    [Fact]
    public async Task RunAsync_DoesNotWriteCanonicalRows()
    {
        // The runner must never write to the canonical landing tables
        // (Owners / OwnershipEvents / LandSegments / ImprovementDetails)
        // or to SyncRecords. Snapshot pre + post rowcounts and assert
        // unchanged.
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var preOwners      = await db.Owners.CountAsync();
        var preOwnership   = await db.OwnershipEvents.CountAsync();
        var preLandSegs    = await db.LandSegments.CountAsync();
        var preImprDetails = await db.ImprovementDetails.CountAsync();
        var preSyncRecords = await db.SyncRecords.CountAsync();

        var rows = new[]
        {
            new SalesRow("S-1", "458-61A-203(1)", "00"),
            new SalesRow("S-2", "458-61A-217(1)", "00"),
            new SalesRow("S-3", null,             "999-UNKNOWN"),
        };
        var sut = CreateSut(db, new FakeSalesRowReader(rows));
        await sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 3);

        (await db.Owners.CountAsync()).Should().Be(preOwners);
        (await db.OwnershipEvents.CountAsync()).Should().Be(preOwnership);
        (await db.LandSegments.CountAsync()).Should().Be(preLandSegs);
        (await db.ImprovementDetails.CountAsync()).Should().Be(preImprDetails);
        (await db.SyncRecords.CountAsync()).Should().Be(preSyncRecords);
    }

    // ── County isolation ────────────────────────────────────────────────

    [Fact]
    public async Task RunAsync_RejectsCrossCountySourceConnection()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var (countyA, connA, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, connB, _)      = await SeedScopeAsync(db, "Yakima");

        // A's workbook is Mapped; caller passes A's id but B's
        // connection. Source-connection lookup must refuse with a
        // "not found for county" message.
        var wbId = await SeedSimpleMappedWorkbookAsync(db, countyA.Id, connA.Id, batchA.Id);

        var sut = CreateSut(db, new FakeSalesRowReader(Array.Empty<SalesRow>()));

        Func<Task> act = () => sut.RunAsync(countyA.Id, wbId, connB.Id, maxSales: 10);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{connB.Id}*not found for county {countyA.Id}*");
    }

    [Fact]
    public async Task RunAsync_RejectsInactiveSourceConnection()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        // Disable the connection.
        conn.IsActive = false;
        await db.SaveChangesAsync();

        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = CreateSut(db, new FakeSalesRowReader(Array.Empty<SalesRow>()));
        Func<Task> act = () => sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 10);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not active*");
    }

    [Fact]
    public async Task RunAsync_RejectsMissingSourceConnection()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var sut = CreateSut(db, new FakeSalesRowReader(Array.Empty<SalesRow>()));
        var phantomConn = Guid.NewGuid();

        Func<Task> act = () => sut.RunAsync(county.Id, wbId, phantomConn, maxSales: 10);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{phantomConn}*not found for county {county.Id}*");
    }

    // ── Argument validation ─────────────────────────────────────────────

    [Fact]
    public async Task RunAsync_RejectsEmptyCountyId()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var sut = CreateSut(db, new FakeSalesRowReader(Array.Empty<SalesRow>()));

        Func<Task> act = () => sut.RunAsync(Guid.Empty, Guid.NewGuid(), Guid.NewGuid(), 10);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*CountyId*");
    }

    [Fact]
    public async Task RunAsync_RejectsEmptyWorkbookId()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var sut = CreateSut(db, new FakeSalesRowReader(Array.Empty<SalesRow>()));

        Func<Task> act = () => sut.RunAsync(Guid.NewGuid(), Guid.Empty, Guid.NewGuid(), 10);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*WorkbookId*");
    }

    [Fact]
    public async Task RunAsync_RejectsEmptySourceConnectionId()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var sut = CreateSut(db, new FakeSalesRowReader(Array.Empty<SalesRow>()));

        Func<Task> act = () => sut.RunAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.Empty, 10);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*SourceConnectionId*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task RunAsync_RejectsNonPositiveMaxSales(int badMax)
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var sut = CreateSut(db, new FakeSalesRowReader(Array.Empty<SalesRow>()));

        Func<Task> act = () => sut.RunAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), badMax);
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*MaxSales*");
    }

    // ── Sample shape ────────────────────────────────────────────────────

    [Fact]
    public async Task RunAsync_PreservesSaleIdentifierAndReasonsInSample()
    {
        await using var db = CreateContext($"sqr-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var rows = new[]
        {
            new SalesRow("CHG-1001", "458-61A-203(1)", "00"),
            new SalesRow("CHG-1002", "458-61A-217(1)", "00"),
        };
        var sut = CreateSut(db, new FakeSalesRowReader(rows));
        var result = await sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 10);

        var s1 = result.Sample[0];
        s1.SaleIdentifier.Should().Be("CHG-1001");
        s1.Status.Should().Be(SalesQualificationDecisionStatus.Qualified);
        s1.IsExcludedFromComps.Should().BeFalse();
        s1.CanonicalValue.Should().Be("ArmsLengthSale");
        s1.Reasons.Should().HaveCount(2);
        s1.Reasons[0].Should().Contain("wac_cd=458-61A-203(1) operator-mapped");

        var s2 = result.Sample[1];
        s2.SaleIdentifier.Should().Be("CHG-1002");
        s2.Status.Should().Be(SalesQualificationDecisionStatus.Excluded);
        s2.IsExcludedFromComps.Should().BeTrue();
        s2.CanonicalValue.Should().BeNull();
        s2.Reasons[0].Should().Contain("wac_cd=458-61A-217(1) operator-excluded");
    }
}
