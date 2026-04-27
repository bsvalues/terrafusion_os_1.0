using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Atlas;

/// <summary>
/// Tests for <see cref="DeepProfileOrchestrator"/> using a fake
/// <see cref="IDeepProfileReaderFactory"/> + the real
/// <see cref="DeepProfilePersistenceService"/>. The orchestrator's
/// per-batch loop is the unit under test; the SQL Server reader's
/// SQL-execution path is exercised by the (future) Slice B2.6 Docker
/// integration tests.
/// </summary>
public class DeepProfileOrchestratorTests
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

    /// <summary>
    /// Seeds a county, an active SyncSourceConnection, and a profile
    /// SyncBatch. Returns the trio so tests can attach SyncProfileTable +
    /// SyncProfileColumn rows under the same batch scope.
    /// </summary>
    private static async System.Threading.Tasks.Task<(County county, SyncSourceConnection conn, SyncBatch batch)>
        SeedScopeAsync(TerraFusionDbContext db, string countyName = "Benton")
    {
        var county = new County
        {
            Id       = Guid.NewGuid(),
            Name     = countyName,
            State    = "WA",
            FipsCode = countyName == "Benton" ? "53005" : "53011",
        };
        db.Counties.Add(county);

        var conn = new SyncSourceConnection
        {
            Id              = Guid.NewGuid(),
            CountyId        = county.Id,
            Name            = $"{countyName} PACS",
            SourceSystem    = "PACS",
            ConnectionType  = "SqlServer",
            Server          = "localhost,1433",
            Database        = "PACS_Training",
            AuthMode        = "WindowsIntegrated",
            IsActive        = true,
        };
        db.SyncSourceConnections.Add(conn);

        var batch = new SyncBatch
        {
            CountyId       = county.Id,
            SourceSystem   = "PACS",
            Mode           = "profile",
            Status         = "completed",
            StartedAtUtc   = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount      = 0,
        };
        db.SyncBatches.Add(batch);

        await db.SaveChangesAsync();
        return (county, conn, batch);
    }

    private static SyncProfileTable Table(Guid countyId, Guid batchId, string schema, string name, bool isView, int columnCount)
        => new()
        {
            CountyId         = countyId,
            SyncBatchId      = batchId,
            SourceSystem     = "PACS",
            SchemaName       = schema,
            TableName        = name,
            IsView           = isView,
            RowCountEstimate = 1,
            ColumnCount      = columnCount,
        };

    private static SyncProfileColumn Column(Guid countyId, Guid batchId, string schema, string table, string column, int ordinal, string dataType, bool nullable = true)
        => new()
        {
            CountyId        = countyId,
            SyncBatchId     = batchId,
            SourceSystem    = "PACS",
            SchemaName      = schema,
            TableName       = table,
            ColumnName      = column,
            OrdinalPosition = ordinal,
            DataType        = dataType,
            IsNullable      = nullable,
        };

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_LoopsOverBatchTables_AndPersistsResults()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        // Two real tables + one view (view should be skipped).
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "ParcelAccount", isView: false, columnCount: 2));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "PropertyVal",   isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "v_PropertyView", isView: true,  columnCount: 1));

        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "ParcelAccount", "ParcelNumber", 1, "varchar", nullable: false));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "ParcelAccount", "PropertyClass", 2, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "PropertyVal",   "AssessedValue", 1, "decimal"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "v_PropertyView", "any_col",      1, "int"));
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader();
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        var result = await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None);

        // 3 tables in batch, 1 is a view → 2 attempted, 2 profiled, 0 failed,
        // 0 skipped (every non-view table had columns).
        result.TablesAttempted.Should().Be(2);
        result.TablesProfiled.Should().Be(2);
        result.TablesFailed.Should().Be(0);
        result.TablesSkipped.Should().Be(0);
        result.Failures.Should().BeEmpty();

        // Reader was asked for both real tables, IN schema-then-name order
        // (orchestrator orders deterministically), and was NOT asked for the view.
        fakeReader.Calls.Should().BeEquivalentTo(new[]
        {
            ("dbo", "ParcelAccount"),
            ("dbo", "PropertyVal"),
        }, opt => opt.WithStrictOrdering());

        // Persistence wrote one TableStats row per profiled table.
        (await db.SyncProfileTableStats.CountAsync()).Should().Be(2);
        (await db.SyncProfileColumnStats.CountAsync()).Should().Be(3); // 2 + 1 across the two tables
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_PassesColumnRefsInOrdinalOrder()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "ParcelAccount", isView: false, columnCount: 3));
        // Insert columns OUT OF ORDER — orchestrator must sort by OrdinalPosition.
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "ParcelAccount", "C", ordinal: 3, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "ParcelAccount", "A", ordinal: 1, "int", nullable: false));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "ParcelAccount", "B", ordinal: 2, "tinyint"));
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader();
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None);

        var passed = fakeReader.LastColumns;
        passed.Should().NotBeNull();
        var nonNull = passed!;
        nonNull.Select(c => c.Name).Should().ContainInOrder("A", "B", "C");
        nonNull.Select(c => c.IsNullable).Should().ContainInOrder(false, true, true);
        nonNull.Select(c => c.DataType).Should().ContainInOrder("int", "tinyint", "varchar");
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_TableWithoutColumns_IsSkippedNotProfiled()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        // Two tables — only one has columns recorded in the structural atlas.
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "WithCols",    isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "EmptyShell",  isView: false, columnCount: 0));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "WithCols", "col1", 1, "varchar"));
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader();
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        var result = await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None);

        result.TablesAttempted.Should().Be(2);
        result.TablesProfiled.Should().Be(1);
        result.TablesSkipped.Should().Be(1);
        fakeReader.Calls.Should().BeEquivalentTo(new[] { ("dbo", "WithCols") });
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_PerTableFailure_DoesNotStopBatch()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Healthy",       isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "TablePoisoned", isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Recovers",      isView: false, columnCount: 1));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "Healthy",       "h", 1, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "TablePoisoned", "p", 1, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "Recovers",      "r", 1, "varchar"));
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader
        {
            FailOnTable = "TablePoisoned",
            FailureMessage = "simulated reader explosion",
        };
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        var result = await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None);

        result.TablesAttempted.Should().Be(3);
        result.TablesProfiled.Should().Be(2);
        result.TablesFailed.Should().Be(1);
        result.TablesSkipped.Should().Be(0);
        result.Failures.Should().HaveCount(1);
        result.Failures[0].TableName.Should().Be("TablePoisoned");
        result.Failures[0].Reason.Should().Contain("simulated reader explosion");

        // The two healthy tables persisted; the failing one did NOT leave a
        // partial TableStats row behind.
        var statsTables = await db.SyncProfileTableStats
            .Select(s => s.TableName)
            .ToListAsync();
        statsTables.Should().BeEquivalentTo(new[] { "Healthy", "Recovers" });
    }

    // ── Per-table session isolation + timeout-budget plumbing (FIX-B2.7E) ──
    //
    // Before FIX-B2.7E the orchestrator opened ONE session and reused it
    // for every table. When the first table tripped ADO.NET's default 30 s
    // CommandTimeout (B2.7-OLTP / dbo.imprv), the SqlConnection went into
    // a broken state and cascaded "BeginExecuteReader requires an open and
    // available Connection" across every subsequent table on the same
    // connection. The fix opens a fresh session per table — these tests
    // pin both the per-table OpenAsync count AND the timeout-budget plumb-
    // through so a future regression on either lever has a unit signal.

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_OpensIndependentSessionPerProfilableTable()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "TableA", isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "TableB", isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "TableC", isView: false, columnCount: 1));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "TableA", "a", 1, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "TableB", "b", 1, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "TableC", "c", 1, "varchar"));
        await db.SaveChangesAsync();

        var factory = new FakeReaderFactory(new RecordingFakeReader());
        var sut = new DeepProfileOrchestrator(db, factory, new DeepProfilePersistenceService(db));

        var result = await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None);

        result.TablesProfiled.Should().Be(3);
        // Pre-fix: factory.OpenCallCount == 1 (one session shared across all
        // tables). Post-fix: one OpenAsync per profiled table.
        factory.OpenCallCount.Should().Be(3);
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_FailedTable_NextTableStillGetsFreshSession()
    {
        // The cascade case: even when one table's profile blows up, the
        // next table's profile must run against a brand-new session so a
        // poisoned connection from the prior table can't haunt it.
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Boom",     isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Survivor", isView: false, columnCount: 1));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "Boom",     "x", 1, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "Survivor", "y", 1, "varchar"));
        await db.SaveChangesAsync();

        var factory = new FakeReaderFactory(new RecordingFakeReader
        {
            FailOnTable    = "Boom",
            FailureMessage = "simulated timeout cascade trigger",
        });
        var sut = new DeepProfileOrchestrator(db, factory, new DeepProfilePersistenceService(db));

        var result = await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None);

        result.TablesAttempted.Should().Be(2);
        result.TablesFailed.Should().Be(1);
        result.TablesProfiled.Should().Be(1);
        // Critical: the orchestrator opened a NEW session for "Survivor"
        // even though "Boom" had just blown up. Pre-fix this number was 1.
        factory.OpenCallCount.Should().Be(2);
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_NoBudgetSupplied_PlumbsDefaultBudgetToFactory()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "OnlyTable", isView: false, columnCount: 1));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "OnlyTable", "c", 1, "varchar"));
        await db.SaveChangesAsync();

        var factory = new FakeReaderFactory(new RecordingFakeReader());
        // 3-arg ctor → orchestrator uses DeepProfileTimeoutBudget.Default.
        var sut = new DeepProfileOrchestrator(db, factory, new DeepProfilePersistenceService(db));

        await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None);

        factory.ReceivedBudgets.Should().HaveCount(1);
        factory.ReceivedBudgets[0].Should().NotBeNull();
        factory.ReceivedBudgets[0].Should().BeEquivalentTo(DeepProfileTimeoutBudget.Default);
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_CustomBudget_PlumbsToEveryFactoryOpen()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "TableA", isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "TableB", isView: false, columnCount: 1));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "TableA", "a", 1, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "TableB", "b", 1, "varchar"));
        await db.SaveChangesAsync();

        var factory = new FakeReaderFactory(new RecordingFakeReader());
        var customBudget = new DeepProfileTimeoutBudget(
            MetadataSeconds:        15,
            MaterializationSeconds: 600,
            AggregationSeconds:     450);

        // 4-arg ctor with explicit budget — orchestrator must forward it
        // verbatim on every per-table OpenAsync call.
        var sut = new DeepProfileOrchestrator(
            db, factory, new DeepProfilePersistenceService(db), customBudget);

        await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None);

        factory.ReceivedBudgets.Should().HaveCount(2);
        factory.ReceivedBudgets.Should().AllSatisfy(b =>
            b.Should().BeEquivalentTo(customBudget));
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_RejectsCrossCountyConnection()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (countyA, _, batch) = await SeedScopeAsync(db, "Benton");
        var (_, connB, _)       = await SeedScopeAsync(db, "Yakima");

        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(new RecordingFakeReader()),
            new DeepProfilePersistenceService(db));

        await FluentActions.Invoking(() =>
                sut.RunAsync(batch.Id, countyA.Id, connB.Id, "test", ct: CancellationToken.None))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_RejectsInactiveConnection()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        conn.IsActive = false;
        await db.SaveChangesAsync();

        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(new RecordingFakeReader()),
            new DeepProfilePersistenceService(db));

        await FluentActions.Invoking(() =>
                sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not active*");
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_EmptyBatchProducesZeroCounts()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        // No SyncProfileTable rows seeded — batch is empty.

        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(new RecordingFakeReader()),
            new DeepProfilePersistenceService(db));

        var result = await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", ct: CancellationToken.None);

        result.TablesAttempted.Should().Be(0);
        result.TablesProfiled.Should().Be(0);
        result.TablesFailed.Should().Be(0);
        result.TablesSkipped.Should().Be(0);
        result.Failures.Should().BeEmpty();
    }

    [Theory]
    [InlineData("batchId")]
    [InlineData("countyId")]
    [InlineData("sourceConnectionId")]
    public async System.Threading.Tasks.Task RunAsync_RequiresEveryGuidId(string emptyParam)
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(new RecordingFakeReader()),
            new DeepProfilePersistenceService(db));

        var batchId  = emptyParam == "batchId"            ? Guid.Empty : Guid.NewGuid();
        var countyId = emptyParam == "countyId"           ? Guid.Empty : Guid.NewGuid();
        var connId   = emptyParam == "sourceConnectionId" ? Guid.Empty : Guid.NewGuid();

        await FluentActions.Invoking(() =>
                sut.RunAsync(batchId, countyId, connId, "test", ct: CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>();
    }

    // ── B2.5A safety controls ─────────────────────────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_IncludeFilter_LimitsToAllowlist()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        // Three real tables; allowlist names just two of them.
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Alpha", isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Beta",  isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Gamma", isView: false, columnCount: 1));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "Alpha", "a", 1, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "Beta",  "b", 1, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "Gamma", "g", 1, "varchar"));
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader();
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        var options = new DeepProfileOptions(
            IncludeQualifiedNames: new[] { "dbo.Alpha", "dbo.Gamma" });

        var result = await sut.RunAsync(
            batch.Id, county.Id, conn.Id, "test", options: options, ct: CancellationToken.None);

        // Beta is filtered out before iteration even starts. TablesAttempted
        // reflects the include-filtered set (2), not the corpus (3).
        result.TablesAttempted.Should().Be(2);
        result.TablesProfiled.Should().Be(2);
        result.TablesFailed.Should().Be(0);
        result.TablesSkipped.Should().Be(0);
        fakeReader.Calls.Should().BeEquivalentTo(new[]
        {
            ("dbo", "Alpha"),
            ("dbo", "Gamma"),
        }, opt => opt.WithStrictOrdering());
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_IncludeFilter_IsCaseInsensitive()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "ParcelAccount", isView: false, columnCount: 1));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "ParcelAccount", "x", 1, "varchar"));
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader();
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        var result = await sut.RunAsync(
            batch.Id, county.Id, conn.Id, "test",
            options: new DeepProfileOptions(IncludeQualifiedNames: new[] { "DBO.parcelaccount" }),
            ct: CancellationToken.None);

        result.TablesProfiled.Should().Be(1);
        fakeReader.Calls.Should().ContainSingle().Which.Table.Should().Be("ParcelAccount");
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_IncludeFilter_TypoEntriesSilentlyDropped()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "ParcelAccount", isView: false, columnCount: 1));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "ParcelAccount", "x", 1, "varchar"));
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader();
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        // Only the second entry actually matches.
        var result = await sut.RunAsync(
            batch.Id, county.Id, conn.Id, "test",
            options: new DeepProfileOptions(IncludeQualifiedNames: new[]
            {
                "dbo.TypoTable",      // typo
                "dbo.ParcelAccount",  // real
                "wrongschema.ParcelAccount",  // wrong schema
            }),
            ct: CancellationToken.None);

        result.TablesAttempted.Should().Be(1);
        result.TablesProfiled.Should().Be(1);
        fakeReader.Calls.Should().ContainSingle().Which.Should().Be(("dbo", "ParcelAccount"));
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_MaxTables_TruncatesAfterSorting()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        // Insert 5 tables in non-alphabetical insert order; orchestrator
        // sorts by (schema, table). With max=2 we expect the first two by
        // alphabetic name: Alpha, Bravo.
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Echo",   isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Alpha",  isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Charlie", isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Delta",  isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Bravo",  isView: false, columnCount: 1));
        foreach (var name in new[] { "Echo", "Alpha", "Charlie", "Delta", "Bravo" })
        {
            db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", name, "x", 1, "varchar"));
        }
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader();
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        var result = await sut.RunAsync(
            batch.Id, county.Id, conn.Id, "test",
            options: new DeepProfileOptions(MaxTables: 2),
            ct: CancellationToken.None);

        // 5 in include-filtered set, 2 profiled, 3 truncated → Skipped.
        result.TablesAttempted.Should().Be(5);
        result.TablesProfiled.Should().Be(2);
        result.TablesSkipped.Should().Be(3);
        fakeReader.Calls.Should().BeEquivalentTo(new[]
        {
            ("dbo", "Alpha"),
            ("dbo", "Bravo"),
        }, opt => opt.WithStrictOrdering());
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_IncludeAndMaxTablesTogether_FilterFirstThenCap()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Alpha",  isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Bravo",  isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Charlie", isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "Delta",  isView: false, columnCount: 1));
        foreach (var name in new[] { "Alpha", "Bravo", "Charlie", "Delta" })
        {
            db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", name, "x", 1, "varchar"));
        }
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader();
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        // Include: Alpha, Charlie, Delta (3 of 4); Cap: 2.
        // Expected: Alpha + Charlie profiled, Delta skipped (cap), Bravo
        // not even in attempted because the include filter dropped it.
        var result = await sut.RunAsync(
            batch.Id, county.Id, conn.Id, "test",
            options: new DeepProfileOptions(
                IncludeQualifiedNames: new[] { "dbo.Alpha", "dbo.Charlie", "dbo.Delta" },
                MaxTables: 2),
            ct: CancellationToken.None);

        result.TablesAttempted.Should().Be(3);  // include-filtered set
        result.TablesProfiled.Should().Be(2);
        result.TablesSkipped.Should().Be(1);    // Delta truncated
        fakeReader.Calls.Should().BeEquivalentTo(new[]
        {
            ("dbo", "Alpha"),
            ("dbo", "Charlie"),
        }, opt => opt.WithStrictOrdering());
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_MaxTablesNonPositive_Throws()
    {
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(new RecordingFakeReader()),
            new DeepProfilePersistenceService(db));

        await FluentActions.Invoking(() =>
                sut.RunAsync(batch.Id, county.Id, conn.Id, "test",
                    options: new DeepProfileOptions(MaxTables: 0),
                    ct: CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>().WithMessage("*MaxTables*");

        await FluentActions.Invoking(() =>
                sut.RunAsync(batch.Id, county.Id, conn.Id, "test",
                    options: new DeepProfileOptions(MaxTables: -5),
                    ct: CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>().WithMessage("*MaxTables*");
    }

    [Fact]
    public async System.Threading.Tasks.Task RunAsync_NullOptions_PreservesPreB25ABehavior()
    {
        // Backward-compat: existing callers passed only a CancellationToken
        // for the trailing param. Verify that null options reproduces the
        // pre-B2.5A "profile every non-view table" behavior.
        await using var db = CreateContext($"deep-orch-{Guid.NewGuid()}");
        var (county, conn, batch) = await SeedScopeAsync(db);

        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "T1", isView: false, columnCount: 1));
        db.SyncProfileTables.Add(Table(county.Id, batch.Id, "dbo", "T2", isView: false, columnCount: 1));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "T1", "a", 1, "varchar"));
        db.SyncProfileColumns.Add(Column(county.Id, batch.Id, "dbo", "T2", "b", 1, "varchar"));
        await db.SaveChangesAsync();

        var fakeReader = new RecordingFakeReader();
        var sut = new DeepProfileOrchestrator(
            db,
            new FakeReaderFactory(fakeReader),
            new DeepProfilePersistenceService(db));

        var result = await sut.RunAsync(batch.Id, county.Id, conn.Id, "test", options: null, ct: CancellationToken.None);

        result.TablesAttempted.Should().Be(2);
        result.TablesProfiled.Should().Be(2);
        result.TablesSkipped.Should().Be(0);
    }

    // ── Test doubles ─────────────────────────────────────────────────────

    /// <summary>
    /// Fake <see cref="IDeepProfileReader"/> that records every ProfileTableAsync
    /// call and can be configured to fail on a specific table name.
    /// </summary>
    private sealed class RecordingFakeReader : IDeepProfileReader
    {
        public List<(string Schema, string Table)> Calls { get; } = new();
        public IReadOnlyList<ColumnRef>? LastColumns { get; private set; }
        public string? FailOnTable { get; set; }
        public string? FailureMessage { get; set; }

        public Task<DeepProfileResult> ProfileTableAsync(
            string schemaName, string tableName, IReadOnlyList<ColumnRef> columns, CancellationToken ct = default)
        {
            Calls.Add((schemaName, tableName));
            LastColumns = columns;

            if (FailOnTable == tableName)
            {
                throw new InvalidOperationException(FailureMessage ?? "Fake reader failure.");
            }

            // Build a minimal-but-valid result so the persistence service is happy.
            var table = new TableStatsRecord(
                SchemaName: schemaName, TableName: tableName,
                RowCount: 1, RowCountIsExact: true, SampleRowCount: 1, SamplingMethod: "Full");

            var columnStats = columns.Select(c => new ColumnStatsRecord(
                SchemaName:           schemaName,
                TableName:            tableName,
                ColumnName:           c.Name,
                ParentRowCount:       1,
                NullCount:            0,
                NullPct:              0m,
                DistinctCount:        1,
                DistinctCountIsExact: true,
                MinValue:             null,
                MaxValue:             null,
                SampleValuesJson:     null,
                TopValuesJson:        null)).ToList();

            return Task.FromResult(new DeepProfileResult(
                Table:          table,
                Columns:        columnStats,
                CodeCandidates: Array.Empty<CodeCandidateRecord>()));
        }
    }

    /// <summary>
    /// Fake factory that hands out the same reader on every Open call. The
    /// session disposal is a no-op — the fake reader doesn't own a connection.
    ///
    /// FIX-B2.7E: records every <see cref="OpenAsync"/> invocation so tests
    /// can assert per-table session lifecycle. Also captures the per-call
    /// <see cref="DeepProfileTimeoutBudget"/> so tests can assert plumb-through.
    /// </summary>
    private sealed class FakeReaderFactory : IDeepProfileReaderFactory
    {
        private readonly IDeepProfileReader _reader;
        public FakeReaderFactory(IDeepProfileReader reader) => _reader = reader;

        public List<DeepProfileTimeoutBudget?> ReceivedBudgets { get; } = new();
        public int OpenCallCount => ReceivedBudgets.Count;

        public Task<IDeepProfileReaderSession> OpenAsync(
            SyncSourceConnection connection,
            DeepProfileTimeoutBudget? timeoutBudget = null,
            CancellationToken ct = default)
        {
            ReceivedBudgets.Add(timeoutBudget);
            return Task.FromResult<IDeepProfileReaderSession>(new FakeSession(_reader));
        }

        private sealed class FakeSession : IDeepProfileReaderSession
        {
            public FakeSession(IDeepProfileReader reader) => Reader = reader;
            public IDeepProfileReader Reader { get; }
            public ValueTask DisposeAsync() => ValueTask.CompletedTask;
        }
    }
}
