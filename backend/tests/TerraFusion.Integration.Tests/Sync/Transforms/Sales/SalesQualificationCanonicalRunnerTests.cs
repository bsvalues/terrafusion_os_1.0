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
/// Slice C36 tests: locked workbook plus bounded PACS sale rows are
/// transformed into CanonicalSaleQualifications rows.
/// </summary>
public class SalesQualificationCanonicalRunnerTests
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
            FipsCode = countyName == "Benton" ? "53005" : "53011",
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

    private static async Task<Guid> SeedSimpleMappedWorkbookAsync(
        TerraFusionDbContext db,
        Guid countyId,
        Guid connectionId,
        Guid batchId,
        string status = "Mapped",
        DateTime? updatedAt = null)
    {
        var wb = new SyncMappingWorkbook
        {
            CountyId = countyId,
            SourceConnectionId = connectionId,
            ProfileBatchId = batchId,
            Name = $"sales-qualification-{Guid.NewGuid():N}",
            Status = status,
            UpdatedAt = updatedAt ?? new DateTime(2026, 4, 28, 20, 10, 1, DateTimeKind.Utc),
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
            MappingColumnId = wacCol.Id,
            SourceValue = "458-61A-217(1)",
            ReviewStatus = "Excluded",
            CanonicalValue = null,
            IsExcluded = true,
            ObservedCount = 50,
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
        db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
        {
            CountyId = countyId,
            MappingColumnId = ratioCol.Id,
            SourceValue = "27",
            ReviewStatus = "Deferred",
            CanonicalValue = null,
            IsExcluded = false,
            ObservedCount = 25,
        });

        await db.SaveChangesAsync();
        return wb.Id;
    }

    private sealed class FakeSalesRowReader : ISalesRowReader
    {
        private readonly List<SalesRow> _rows;
        public int CallCount { get; private set; }
        public List<int> MaxRowsRequested { get; } = new();

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
            return Task.FromResult<IReadOnlyList<SalesRow>>(_rows.Take(maxRows).ToList());
        }
    }

    private static SalesQualificationCanonicalRunner CreateSut(
        TerraFusionDbContext db,
        ISalesRowReader salesReader)
    {
        return new SalesQualificationCanonicalRunner(
            db,
            new SyncMappingWorkbookReadModel(db),
            salesReader,
            new CanonicalSalesQualificationWriter(db));
    }

    [Fact]
    public async Task RunAsync_WritesCanonicalRowsWithAxisDetailsAndSaleSnapshot()
    {
        await using var db = CreateContext($"c36-write-{Guid.NewGuid()}");
        var lockedAt = new DateTime(2026, 4, 28, 20, 30, 0, DateTimeKind.Utc);
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id, updatedAt: lockedAt);

        var saleDate = new DateTime(2025, 9, 12, 0, 0, 0, DateTimeKind.Utc);
        var rows = new[]
        {
            new SalesRow("1001", "458-61A-203(1)", "00", 1001, saleDate, 450000m),
            new SalesRow("1002", "458-61A-217(1)", "00", 1002, saleDate, 250000m),
            new SalesRow("1003", "458-61A-203(1)", "27", 1003, saleDate, 350000m),
        };
        var sut = CreateSut(db, new FakeSalesRowReader(rows));

        var result = await sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 10, operatorId: "c36-test");

        result.RowsRead.Should().Be(3);
        result.RowsPersisted.Should().Be(3);
        result.QualifiedCount.Should().Be(1);
        result.ExcludedCount.Should().Be(1);
        result.InconclusiveCount.Should().Be(1);
        result.SkippedNoIdentifierCount.Should().Be(0);

        var persisted = await db.CanonicalSaleQualifications
            .AsNoTracking()
            .OrderBy(r => r.ChgOfOwnerId)
            .ToListAsync();

        persisted.Should().HaveCount(3);

        var qualified = persisted[0];
        qualified.ChgOfOwnerId.Should().Be(1001);
        qualified.ComputedDecision.Should().Be(CanonicalSaleQualificationDecision.Qualified);
        qualified.WacCdAxisDecision.Should().Be(CanonicalSaleAxisDecision.Qualified);
        qualified.SlRatioTypeCdAxisDecision.Should().Be(CanonicalSaleAxisDecision.Qualified);
        qualified.WacCdCanonicalValue.Should().Be("ArmsLengthSale");
        qualified.SlRatioTypeCdCanonicalValue.Should().Be("Conventional");
        qualified.SourceWorkbookId.Should().Be(wbId);
        qualified.SourceWorkbookLockedAt.Should().Be(lockedAt);
        qualified.SaleDate.Should().Be(saleDate);
        qualified.SalePrice.Should().Be(450000m);
        qualified.CreatedBy.Should().Be("c36-test");
        qualified.UpdatedBy.Should().Be("c36-test");

        var excluded = persisted[1];
        excluded.ChgOfOwnerId.Should().Be(1002);
        excluded.ComputedDecision.Should().Be(CanonicalSaleQualificationDecision.Excluded);
        excluded.WacCdAxisDecision.Should().Be(CanonicalSaleAxisDecision.Excluded);
        excluded.SlRatioTypeCdAxisDecision.Should().Be(CanonicalSaleAxisDecision.Qualified);

        var inconclusive = persisted[2];
        inconclusive.ChgOfOwnerId.Should().Be(1003);
        inconclusive.ComputedDecision.Should().Be(CanonicalSaleQualificationDecision.Inconclusive);
        inconclusive.WacCdAxisDecision.Should().Be(CanonicalSaleAxisDecision.Qualified);
        inconclusive.SlRatioTypeCdAxisDecision.Should().Be(CanonicalSaleAxisDecision.NotMapped);
    }

    [Fact]
    public async Task RunAsync_SkipsRowsWithoutCanonicalSaleIdentifier()
    {
        await using var db = CreateContext($"c36-skip-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var rows = new[]
        {
            new SalesRow("missing-id", "458-61A-203(1)", "00", ChgOfOwnerId: null),
        };
        var sut = CreateSut(db, new FakeSalesRowReader(rows));

        var result = await sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 10, operatorId: "c36-test");

        result.RowsRead.Should().Be(1);
        result.RowsPersisted.Should().Be(0);
        result.SkippedNoIdentifierCount.Should().Be(1);
        result.Entries.Should().ContainSingle().Which.SkipReason.Should().Contain("chg_of_owner_id");
        (await db.CanonicalSaleQualifications.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task RunAsync_RejectsDraftWorkbookBeforePacsReadOrCanonicalWrite()
    {
        await using var db = CreateContext($"c36-draft-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(
            db,
            county.Id,
            conn.Id,
            batch.Id,
            status: "Draft");

        var fakeReader = new FakeSalesRowReader(new[]
        {
            new SalesRow("1001", "458-61A-203(1)", "00", 1001),
        });
        var sut = CreateSut(db, fakeReader);

        Func<Task> act = () => sut.RunAsync(county.Id, wbId, conn.Id, maxSales: 10, operatorId: "c36-test");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Status='Draft'*Status='Mapped'*");

        fakeReader.CallCount.Should().Be(0);
        (await db.CanonicalSaleQualifications.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task RunAsync_UpsertsExistingCanonicalRowInPlace()
    {
        await using var db = CreateContext($"c36-upsert-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, conn.Id, batch.Id);

        var first = CreateSut(db, new FakeSalesRowReader(new[]
        {
            new SalesRow("2001", "458-61A-203(1)", "00", 2001, SalePrice: 450000m),
        }));
        await first.RunAsync(county.Id, wbId, conn.Id, maxSales: 10, operatorId: "first-run");

        var second = CreateSut(db, new FakeSalesRowReader(new[]
        {
            new SalesRow("2001", "458-61A-217(1)", "00", 2001, SalePrice: 250000m),
        }));
        await second.RunAsync(county.Id, wbId, conn.Id, maxSales: 10, operatorId: "second-run");

        var rows = await db.CanonicalSaleQualifications
            .AsNoTracking()
            .Where(r => r.CountyId == county.Id && r.ChgOfOwnerId == 2001)
            .ToListAsync();

        rows.Should().ContainSingle();
        rows[0].ComputedDecision.Should().Be(CanonicalSaleQualificationDecision.Excluded);
        rows[0].WacCdSourceValue.Should().Be("458-61A-217(1)");
        rows[0].SalePrice.Should().Be(250000m);
        rows[0].CreatedBy.Should().Be("first-run");
        rows[0].UpdatedBy.Should().Be("second-run");
    }

    [Fact]
    public async Task RunAsync_RejectsCrossCountySourceConnection()
    {
        await using var db = CreateContext($"c36-cross-county-{Guid.NewGuid()}");
        var (countyA, connA, batchA) = await SeedScopeAsync(db, "Benton");
        var (countyB, connB, _) = await SeedScopeAsync(db, "Yakima");
        var wbId = await SeedSimpleMappedWorkbookAsync(db, countyA.Id, connA.Id, batchA.Id);
        var sut = CreateSut(db, new FakeSalesRowReader(Array.Empty<SalesRow>()));

        Func<Task> act = () => sut.RunAsync(countyA.Id, wbId, connB.Id, maxSales: 10, operatorId: "c36-test");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{connB.Id}*not found for county {countyA.Id}*");
        countyB.Id.Should().NotBe(countyA.Id);
    }

    [Fact]
    public async Task RunAsync_RejectsSameCountySourceConnectionThatDoesNotOwnWorkbook()
    {
        await using var db = CreateContext($"c36-source-mismatch-{Guid.NewGuid()}");
        var (county, workbookConnection, batch) = await SeedScopeAsync(db, "Benton");
        var requestedConnection = new SyncSourceConnection
        {
            Id = Guid.NewGuid(),
            CountyId = county.Id,
            Name = "Benton PACS OLTP Alternate",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "localhost,1433",
            Database = "pacs_oltp_alt",
            AuthMode = "SqlAuth",
            IsActive = true,
        };
        db.SyncSourceConnections.Add(requestedConnection);
        await db.SaveChangesAsync();

        var wbId = await SeedSimpleMappedWorkbookAsync(db, county.Id, workbookConnection.Id, batch.Id);
        var fakeReader = new FakeSalesRowReader(new[]
        {
            new SalesRow("1001", "458-61A-203(1)", "00", 1001),
        });
        var sut = CreateSut(db, fakeReader);

        Func<Task> act = () => sut.RunAsync(
            county.Id,
            wbId,
            requestedConnection.Id,
            maxSales: 10,
            operatorId: "c36-test");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*belongs to source connection {workbookConnection.Id}*not requested source connection {requestedConnection.Id}*");

        fakeReader.CallCount.Should().Be(0);
        (await db.CanonicalSaleQualifications.CountAsync()).Should().Be(0);
    }
}
