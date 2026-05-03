using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync.Atlas;

/// <summary>
/// Tests for <see cref="DeepProfilePersistenceService"/>. Verifies the
/// replace-for-batch-and-table semantics, county-scoped isolation, and that
/// Slice B1 structural metadata is never disturbed by deep-profile writes.
///
/// These tests use the in-memory EF Core provider — same convention as the
/// B2.1 schema tests (<c>SyncProfileStatsSchemaTests</c>).
/// </summary>
public class DeepProfilePersistenceServiceTests
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

    private static async System.Threading.Tasks.Task<(County county, SyncBatch batch)> SeedCountyAndBatchAsync(
        TerraFusionDbContext db, string countyName = "Benton")
    {
        var county = new County
        {
            Id       = Guid.NewGuid(),
            Name     = countyName,
            State    = "WA",
            FipsCode = countyName == "Benton" ? "53005" : "53011",
        };
        db.Counties.Add(county);

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

        return (county, batch);
    }

    /// <summary>
    /// Builds the canonical fake DeepProfileResult described in the slice
    /// card: dbo.ParcelAccount with two columns, ParcelNumber as the simple
    /// per-row sample and PropertyClass as the code-candidate.
    /// </summary>
    private static DeepProfileResult BuildFakeResult(
        string schemaName = "dbo",
        string tableName  = "ParcelAccount")
    {
        var table = new TableStatsRecord(
            SchemaName:      schemaName,
            TableName:       tableName,
            RowCount:        2,
            RowCountIsExact: true,
            SampleRowCount:  2,
            SamplingMethod:  "Full");

        var parcelNumber = new ColumnStatsRecord(
            SchemaName:           schemaName,
            TableName:            tableName,
            ColumnName:           "ParcelNumber",
            ParentRowCount:       2,
            NullCount:            0,
            NullPct:              0m,
            DistinctCount:        2,
            DistinctCountIsExact: true,
            MinValue:             "1001",
            MaxValue:             "1002",
            SampleValuesJson:     "[\"1001\",\"1002\"]",
            TopValuesJson:        "[{\"Value\":\"1001\",\"Count\":1},{\"Value\":\"1002\",\"Count\":1}]");

        var propertyClass = new ColumnStatsRecord(
            SchemaName:           schemaName,
            TableName:            tableName,
            ColumnName:           "PropertyClass",
            ParentRowCount:       100,
            NullCount:            0,
            NullPct:              0m,
            DistinctCount:        4,
            DistinctCountIsExact: true,
            MinValue:             "C",
            MaxValue:             "R",
            SampleValuesJson:     "[\"R\",\"R\",\"C\",\"R\",\"V\",\"M\",\"R\",\"R\",\"C\",\"R\"]",
            TopValuesJson:        "[{\"Value\":\"R\",\"Count\":60},{\"Value\":\"C\",\"Count\":25}]");

        var candidate = new CodeCandidateRecord(
            SchemaName:         schemaName,
            TableName:          tableName,
            ColumnName:         "PropertyClass",
            DistinctCount:      4,
            SampleSize:         100,
            DistinctRatio:      0.04m,
            Reason:             "low_cardinality_string",
            CandidateCodesJson: "[{\"code\":\"R\",\"count\":60},{\"code\":\"C\",\"count\":25}]");

        return new DeepProfileResult(
            Table:          table,
            Columns:        new[] { parcelNumber, propertyClass },
            CodeCandidates: new[] { candidate });
    }

    [Fact]
    public async System.Threading.Tasks.Task PersistAsync_InsertsTableStats()
    {
        await using var db = CreateContext($"deep-persist-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndBatchAsync(db);
        var sut = new DeepProfilePersistenceService(db);

        await sut.PersistAsync(county.Id, batch.Id, BuildFakeResult(), CancellationToken.None);

        var rows = await db.SyncProfileTableStats.ToListAsync();
        rows.Should().HaveCount(1);
        rows[0].CountyId.Should().Be(county.Id);
        rows[0].SyncBatchId.Should().Be(batch.Id);
        rows[0].SchemaName.Should().Be("dbo");
        rows[0].TableName.Should().Be("ParcelAccount");
        rows[0].RowCount.Should().Be(2L);
        rows[0].RowCountIsExact.Should().BeTrue();
        rows[0].SampleRowCount.Should().Be(2);
        rows[0].SamplingMethod.Should().Be("Full");
    }

    [Fact]
    public async System.Threading.Tasks.Task PersistAsync_InsertsColumnStats()
    {
        await using var db = CreateContext($"deep-persist-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndBatchAsync(db);
        var sut = new DeepProfilePersistenceService(db);

        await sut.PersistAsync(county.Id, batch.Id, BuildFakeResult(), CancellationToken.None);

        var rows = await db.SyncProfileColumnStats
            .Where(x => x.SyncBatchId == batch.Id)
            .OrderBy(x => x.ColumnName)
            .ToListAsync();
        rows.Should().HaveCount(2);
        rows[0].ColumnName.Should().Be("ParcelNumber");
        rows[0].MinValue.Should().Be("1001");
        rows[0].MaxValue.Should().Be("1002");
        rows[0].SampleValuesJson.Should().Contain("1001");
        rows[1].ColumnName.Should().Be("PropertyClass");
        rows[1].DistinctCount.Should().Be(4);
        rows[1].DistinctCountIsExact.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task PersistAsync_InsertsCodeCandidates()
    {
        await using var db = CreateContext($"deep-persist-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndBatchAsync(db);
        var sut = new DeepProfilePersistenceService(db);

        await sut.PersistAsync(county.Id, batch.Id, BuildFakeResult(), CancellationToken.None);

        var rows = await db.SyncProfileCodeCandidates.ToListAsync();
        rows.Should().HaveCount(1);
        rows[0].ColumnName.Should().Be("PropertyClass");
        rows[0].DistinctCount.Should().Be(4);
        rows[0].SampleSize.Should().Be(100);
        rows[0].DistinctRatio.Should().Be(0.04m);
        rows[0].Reason.Should().Be("low_cardinality_string");
        rows[0].CandidateCodesJson.Should().Contain("\"code\":\"R\"");
    }

    [Fact]
    public async System.Threading.Tasks.Task PersistAsync_EmptyResult_DoesNotThrow()
    {
        await using var db = CreateContext($"deep-persist-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndBatchAsync(db);
        var sut = new DeepProfilePersistenceService(db);

        // "Empty" here means a result with a valid Table but no columns and
        // no candidates — the legitimate output of a permission-restricted
        // sample where every column was filtered out.
        var emptyResult = new DeepProfileResult(
            Table: new TableStatsRecord(
                SchemaName:      "dbo",
                TableName:       "EmptyShell",
                RowCount:        0,
                RowCountIsExact: true,
                SampleRowCount:  0,
                SamplingMethod:  "Full"),
            Columns:        Array.Empty<ColumnStatsRecord>(),
            CodeCandidates: Array.Empty<CodeCandidateRecord>());

        Func<System.Threading.Tasks.Task> act = () => sut.PersistAsync(county.Id, batch.Id, emptyResult, CancellationToken.None);
        await act.Should().NotThrowAsync();

        // The Table row still lands; the column / candidate sets stay empty.
        (await db.SyncProfileTableStats.CountAsync()).Should().Be(1);
        (await db.SyncProfileColumnStats.CountAsync()).Should().Be(0);
        (await db.SyncProfileCodeCandidates.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async System.Threading.Tasks.Task PersistAsync_ReplacesExistingStatsForSameBatchOnly()
    {
        await using var db = CreateContext($"deep-persist-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndBatchAsync(db);
        var sut = new DeepProfilePersistenceService(db);

        // First persist: row count = 2.
        await sut.PersistAsync(county.Id, batch.Id, BuildFakeResult(), CancellationToken.None);

        // Second persist: same scope, but the table is now reported with
        // RowCount = 99 to simulate a re-profile that found more rows.
        var refreshed = BuildFakeResult() with
        {
            Table = new TableStatsRecord(
                SchemaName:      "dbo",
                TableName:       "ParcelAccount",
                RowCount:        99,
                RowCountIsExact: true,
                SampleRowCount:  99,
                SamplingMethod:  "Full"),
        };
        await sut.PersistAsync(county.Id, batch.Id, refreshed, CancellationToken.None);

        // Exactly ONE row for this (batch, table) — the prior row was
        // replaced, not appended.
        var rows = await db.SyncProfileTableStats
            .Where(x => x.SyncBatchId == batch.Id && x.TableName == "ParcelAccount")
            .ToListAsync();
        rows.Should().HaveCount(1);
        rows[0].RowCount.Should().Be(99L);

        // Column + candidate sides also replaced (not duplicated).
        (await db.SyncProfileColumnStats
            .Where(x => x.SyncBatchId == batch.Id && x.TableName == "ParcelAccount")
            .CountAsync()).Should().Be(2);
        (await db.SyncProfileCodeCandidates
            .Where(x => x.SyncBatchId == batch.Id && x.TableName == "ParcelAccount")
            .CountAsync()).Should().Be(1);
    }

    [Fact]
    public async System.Threading.Tasks.Task PersistAsync_DoesNotDeleteStatsForOtherBatch()
    {
        await using var db = CreateContext($"deep-persist-{Guid.NewGuid()}");
        var (county, batchA) = await SeedCountyAndBatchAsync(db);
        var batchB = new SyncBatch
        {
            CountyId       = county.Id,
            SourceSystem   = "PACS",
            Mode           = "profile",
            Status         = "completed",
            StartedAtUtc   = DateTimeOffset.UtcNow.AddDays(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow.AddDays(-1).AddMinutes(5),
            ReadCount      = 0,
        };
        db.SyncBatches.Add(batchB);
        await db.SaveChangesAsync();

        var sut = new DeepProfilePersistenceService(db);

        // Seed Batch B with stats first.
        await sut.PersistAsync(county.Id, batchB.Id, BuildFakeResult(), CancellationToken.None);

        // Then write stats into Batch A — must NOT touch Batch B's rows.
        await sut.PersistAsync(county.Id, batchA.Id, BuildFakeResult(), CancellationToken.None);

        var perBatch = await db.SyncProfileTableStats
            .GroupBy(x => x.SyncBatchId)
            .Select(g => new { BatchId = g.Key, Count = g.Count() })
            .ToListAsync();

        perBatch.Should().HaveCount(2);
        perBatch.All(g => g.Count == 1).Should().BeTrue();

        // Same on the column-stats side.
        (await db.SyncProfileColumnStats.Where(x => x.SyncBatchId == batchB.Id).CountAsync())
            .Should().Be(2);
        (await db.SyncProfileColumnStats.Where(x => x.SyncBatchId == batchA.Id).CountAsync())
            .Should().Be(2);
    }

    [Fact]
    public async System.Threading.Tasks.Task PersistAsync_DoesNotDeleteAtlasStructuralMetadata()
    {
        await using var db = CreateContext($"deep-persist-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndBatchAsync(db);

        // Seed a B1 structural row. Deep-profile persistence MUST NOT touch
        // it — different concern, different table, different lifecycle.
        db.SyncProfileTables.Add(new SyncProfileTable
        {
            CountyId         = county.Id,
            SyncBatchId      = batch.Id,
            SourceSystem     = "PACS",
            SchemaName       = "dbo",
            TableName        = "ParcelAccount",
            IsView           = false,
            RowCountEstimate = 2,
            ColumnCount      = 2,
        });
        db.SyncProfileColumns.Add(new SyncProfileColumn
        {
            CountyId         = county.Id,
            SyncBatchId      = batch.Id,
            SourceSystem     = "PACS",
            SchemaName       = "dbo",
            TableName        = "ParcelAccount",
            ColumnName       = "ParcelNumber",
            OrdinalPosition  = 1,
            DataType         = "varchar",
            IsNullable       = false,
            IsPrimaryKey     = true,
        });
        await db.SaveChangesAsync();

        var sut = new DeepProfilePersistenceService(db);

        // Persist deep stats (and re-persist to exercise the delete path) —
        // the structural rows must survive both passes intact.
        await sut.PersistAsync(county.Id, batch.Id, BuildFakeResult(), CancellationToken.None);
        await sut.PersistAsync(county.Id, batch.Id, BuildFakeResult(), CancellationToken.None);

        (await db.SyncProfileTables
            .Where(x => x.SyncBatchId == batch.Id && x.TableName == "ParcelAccount")
            .CountAsync()).Should().Be(1);
        (await db.SyncProfileColumns
            .Where(x => x.SyncBatchId == batch.Id && x.TableName == "ParcelAccount")
            .CountAsync()).Should().Be(1);
    }

    [Fact]
    public async System.Threading.Tasks.Task PersistAsync_RequiresCountyIdAndBatchId()
    {
        await using var db = CreateContext($"deep-persist-{Guid.NewGuid()}");
        var sut = new DeepProfilePersistenceService(db);
        var result = BuildFakeResult();

        await FluentActions.Invoking(
                () => sut.PersistAsync(Guid.Empty, Guid.NewGuid(), result, CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*CountyId*");

        await FluentActions.Invoking(
                () => sut.PersistAsync(Guid.NewGuid(), Guid.Empty, result, CancellationToken.None))
            .Should().ThrowAsync<ArgumentException>()
            .WithMessage("*ProfileBatchId*");

        await FluentActions.Invoking(
                () => sut.PersistAsync(Guid.NewGuid(), Guid.NewGuid(), null!, CancellationToken.None))
            .Should().ThrowAsync<ArgumentNullException>();
    }
}
