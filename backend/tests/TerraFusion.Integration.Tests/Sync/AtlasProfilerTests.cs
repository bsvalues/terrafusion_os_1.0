using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Tests for <see cref="AtlasProfiler"/> using an in-memory DbContext + a fake
/// <see cref="IMetadataReaderFactory"/>. No live SQL Server required.
///
/// Real SQL execution is covered separately in Slice B1.6 against a Docker SQL fixture.
/// </summary>
public class AtlasProfilerTests
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

    private static async System.Threading.Tasks.Task<(County county, SyncSourceConnection conn)> SeedCountyAndConnectionAsync(
        TerraFusionDbContext context, bool isActive = true)
    {
        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);

        var conn = new SyncSourceConnection
        {
            CountyId = county.Id,
            Name = "Benton PACS Training",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "jcharrispacs",
            Database = "pacs_training",
            IsActive = isActive
        };
        context.SyncSourceConnections.Add(conn);
        await context.SaveChangesAsync();

        return (county, conn);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileAsync_CreatesBatch_PersistsAllSevenDomains_ReturnsCounts()
    {
        await using var context = CreateContext($"profile-success-{Guid.NewGuid()}");
        var (county, conn) = await SeedCountyAndConnectionAsync(context);

        var fakeReader = new FakeMetadataReader
        {
            Tables = new[]
            {
                new TableMetadata("dbo", "property", false, 89247, 64),
                new TableMetadata("dbo", "vw_active_parcels", true, null, 12)
            },
            Columns = new[]
            {
                new ColumnMetadata("dbo", "property", "prop_id", 1, "int", null, 10, 0, false, true, false, null),
                new ColumnMetadata("dbo", "property", "geo_id", 2, "varchar", 50, null, null, true, false, false, null)
            },
            Views = new[]
            {
                new ViewMetadata("dbo", "vw_active_parcels", "SELECT * FROM property_val WHERE prop_inactive_dt IS NULL")
            },
            Procedures = new[]
            {
                new ProcedureMetadata("dbo", "usp_GetActiveExemptions", "CREATE PROCEDURE usp_GetActiveExemptions...")
            },
            Udfs = new[]
            {
                new UdfMetadata("dbo", "fn_NormalizeOwnerName", "scalar", "CREATE FUNCTION fn_NormalizeOwnerName...")
            },
            Triggers = new[]
            {
                new TriggerMetadata("dbo", "trg_audit", "property_val", true, false, "INSERT,UPDATE,DELETE", "CREATE TRIGGER trg_audit...")
            },
            Constraints = new[]
            {
                new ConstraintMetadata("dbo", "property", "PK_property", "PRIMARY_KEY", null, null, null),
                new ConstraintMetadata("dbo", "property_val", "FK_property_val_property", "FOREIGN_KEY", null, "property", "prop_id"),
                new ConstraintMetadata("dbo", "sale", "CK_sale_price_positive", "CHECK", "sl_price >= 0", null, null)
            }
        };
        var fakeFactory = new FakeMetadataReaderFactory(fakeReader);

        var profiler = new AtlasProfiler(context, fakeFactory);
        var result = await profiler.ProfileAsync(conn.Id, county.Id, "test-operator");

        result.Status.Should().Be("completed");
        result.TableCount.Should().Be(2);
        result.ColumnCount.Should().Be(2);
        result.ViewCount.Should().Be(1);
        result.ProcedureCount.Should().Be(1);
        result.UdfCount.Should().Be(1);
        result.TriggerCount.Should().Be(1);
        result.ConstraintCount.Should().Be(3);
        result.FailureMessage.Should().BeNull();

        var batch = await context.SyncBatches.SingleAsync(x => x.Id == result.BatchId);
        batch.CountyId.Should().Be(county.Id);
        batch.Mode.Should().Be("profile");
        batch.Status.Should().Be("completed");
        batch.SourceSystem.Should().Be("PACS");
        batch.CompletedAtUtc.Should().NotBeNull();
        batch.ReadCount.Should().Be(2 + 2 + 1 + 1 + 1 + 1 + 3);  // total profile rows
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileAsync_StampsCountyIdOnEveryProfileRow()
    {
        await using var context = CreateContext($"profile-county-stamp-{Guid.NewGuid()}");
        var (county, conn) = await SeedCountyAndConnectionAsync(context);

        var fakeReader = new FakeMetadataReader
        {
            Tables = new[] { new TableMetadata("dbo", "t1", false, 10, 3) },
            Columns = new[] { new ColumnMetadata("dbo", "t1", "id", 1, "int", null, null, null, false, true, false, null) },
            Views = new[] { new ViewMetadata("dbo", "v1", "SELECT 1") }
        };
        var profiler = new AtlasProfiler(context, new FakeMetadataReaderFactory(fakeReader));
        var result = await profiler.ProfileAsync(conn.Id, county.Id, "test-operator");

        var profileTables = await context.SyncProfileTables.ToListAsync();
        profileTables.Should().AllSatisfy(t => t.CountyId.Should().Be(county.Id));
        profileTables.Should().AllSatisfy(t => t.SyncBatchId.Should().Be(result.BatchId));
        profileTables.Should().AllSatisfy(t => t.SourceSystem.Should().Be("PACS"));

        var profileColumns = await context.SyncProfileColumns.ToListAsync();
        profileColumns.Should().AllSatisfy(c => c.CountyId.Should().Be(county.Id));
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileAsync_RejectsCrossCountyConnection()
    {
        await using var context = CreateContext($"profile-cross-county-{Guid.NewGuid()}");
        var (bentonCounty, bentonConn) = await SeedCountyAndConnectionAsync(context);

        var wallaWallaCountyId = Guid.NewGuid();
        context.Counties.Add(new County { Id = wallaWallaCountyId, Name = "Walla Walla", State = "WA", FipsCode = "53071" });
        await context.SaveChangesAsync();

        var profiler = new AtlasProfiler(context, new FakeMetadataReaderFactory(new FakeMetadataReader()));

        Func<System.Threading.Tasks.Task> act = () => profiler.ProfileAsync(bentonConn.Id, wallaWallaCountyId, "test-operator");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{bentonConn.Id}*not found for county {wallaWallaCountyId}*");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileAsync_RejectsInactiveConnection()
    {
        await using var context = CreateContext($"profile-inactive-{Guid.NewGuid()}");
        var (county, conn) = await SeedCountyAndConnectionAsync(context, isActive: false);

        var profiler = new AtlasProfiler(context, new FakeMetadataReaderFactory(new FakeMetadataReader()));

        Func<System.Threading.Tasks.Task> act = () => profiler.ProfileAsync(conn.Id, county.Id, "test-operator");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not active*");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileAsync_OnReaderException_MarksBatchFailedWithMessage()
    {
        await using var context = CreateContext($"profile-fail-{Guid.NewGuid()}");
        var (county, conn) = await SeedCountyAndConnectionAsync(context);

        var fakeFactory = new FakeMetadataReaderFactory(
            new FakeMetadataReader(),
            openException: new InvalidOperationException("Connection refused: jcharrispacs is unreachable"));

        var profiler = new AtlasProfiler(context, fakeFactory);
        var result = await profiler.ProfileAsync(conn.Id, county.Id, "test-operator");

        result.Status.Should().Be("failed");
        result.FailureMessage.Should().Contain("Connection refused");

        var batch = await context.SyncBatches.SingleAsync(x => x.Id == result.BatchId);
        batch.Status.Should().Be("failed");
        batch.FailureMessage.Should().Contain("Connection refused");
        batch.CompletedAtUtc.Should().NotBeNull();

        var refreshedConn = await context.SyncSourceConnections.SingleAsync(x => x.Id == conn.Id);
        refreshedConn.LastConnectionErrorAtUtc.Should().NotBeNull();
        refreshedConn.LastConnectionErrorMessage.Should().Contain("Connection refused");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileAsync_OnSuccess_UpdatesConnectionLastSuccessfulAt()
    {
        await using var context = CreateContext($"profile-conn-success-{Guid.NewGuid()}");
        var (county, conn) = await SeedCountyAndConnectionAsync(context);

        var profiler = new AtlasProfiler(context, new FakeMetadataReaderFactory(new FakeMetadataReader()));
        var result = await profiler.ProfileAsync(conn.Id, county.Id, "test-operator");

        result.Status.Should().Be("completed");

        var refreshedConn = await context.SyncSourceConnections.SingleAsync(x => x.Id == conn.Id);
        refreshedConn.LastSuccessfulConnectionAtUtc.Should().NotBeNull();
        refreshedConn.LastConnectionErrorMessage.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileAsync_EmptySource_CompletesWithZeroCounts()
    {
        await using var context = CreateContext($"profile-empty-{Guid.NewGuid()}");
        var (county, conn) = await SeedCountyAndConnectionAsync(context);

        var profiler = new AtlasProfiler(context, new FakeMetadataReaderFactory(new FakeMetadataReader()));
        var result = await profiler.ProfileAsync(conn.Id, county.Id, "test-operator");

        result.Status.Should().Be("completed");
        result.TableCount.Should().Be(0);
        result.ColumnCount.Should().Be(0);
        result.ViewCount.Should().Be(0);
        result.ProcedureCount.Should().Be(0);
        result.UdfCount.Should().Be(0);
        result.TriggerCount.Should().Be(0);
        result.ConstraintCount.Should().Be(0);
    }

    // ────────────────────────────────────────────────────────────────────
    // Test doubles
    // ────────────────────────────────────────────────────────────────────

    private sealed class FakeMetadataReader : IMetadataReader
    {
        public IReadOnlyList<TableMetadata> Tables { get; init; } = Array.Empty<TableMetadata>();
        public IReadOnlyList<ColumnMetadata> Columns { get; init; } = Array.Empty<ColumnMetadata>();
        public IReadOnlyList<ViewMetadata> Views { get; init; } = Array.Empty<ViewMetadata>();
        public IReadOnlyList<ProcedureMetadata> Procedures { get; init; } = Array.Empty<ProcedureMetadata>();
        public IReadOnlyList<UdfMetadata> Udfs { get; init; } = Array.Empty<UdfMetadata>();
        public IReadOnlyList<TriggerMetadata> Triggers { get; init; } = Array.Empty<TriggerMetadata>();
        public IReadOnlyList<ConstraintMetadata> Constraints { get; init; } = Array.Empty<ConstraintMetadata>();

        public System.Threading.Tasks.Task<IReadOnlyList<TableMetadata>> ReadTablesAsync(CancellationToken ct = default) => System.Threading.Tasks.Task.FromResult(Tables);
        public System.Threading.Tasks.Task<IReadOnlyList<ColumnMetadata>> ReadColumnsAsync(CancellationToken ct = default) => System.Threading.Tasks.Task.FromResult(Columns);
        public System.Threading.Tasks.Task<IReadOnlyList<ViewMetadata>> ReadViewsAsync(CancellationToken ct = default) => System.Threading.Tasks.Task.FromResult(Views);
        public System.Threading.Tasks.Task<IReadOnlyList<ProcedureMetadata>> ReadProceduresAsync(CancellationToken ct = default) => System.Threading.Tasks.Task.FromResult(Procedures);
        public System.Threading.Tasks.Task<IReadOnlyList<UdfMetadata>> ReadUdfsAsync(CancellationToken ct = default) => System.Threading.Tasks.Task.FromResult(Udfs);
        public System.Threading.Tasks.Task<IReadOnlyList<TriggerMetadata>> ReadTriggersAsync(CancellationToken ct = default) => System.Threading.Tasks.Task.FromResult(Triggers);
        public System.Threading.Tasks.Task<IReadOnlyList<ConstraintMetadata>> ReadConstraintsAsync(CancellationToken ct = default) => System.Threading.Tasks.Task.FromResult(Constraints);
    }

    private sealed class FakeMetadataReaderSession : IMetadataReaderSession
    {
        public IMetadataReader Reader { get; init; } = null!;
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    private sealed class FakeMetadataReaderFactory : IMetadataReaderFactory
    {
        private readonly IMetadataReader _reader;
        private readonly Exception? _openException;

        public FakeMetadataReaderFactory(IMetadataReader reader, Exception? openException = null)
        {
            _reader = reader;
            _openException = openException;
        }

        public System.Threading.Tasks.Task<IMetadataReaderSession> OpenAsync(SyncSourceConnection connection, CancellationToken ct = default)
        {
            if (_openException is not null) throw _openException;
            return System.Threading.Tasks.Task.FromResult<IMetadataReaderSession>(new FakeMetadataReaderSession { Reader = _reader });
        }
    }
}
