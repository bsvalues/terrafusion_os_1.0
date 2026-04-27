using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Wiring tests for the Slice B2.1 Data Profile statistics schema:
/// SyncProfileTableStats, SyncProfileColumnStats, SyncProfileCodeCandidate.
///
/// These three entities sit alongside B1.1's structural atlas and carry the
/// per-batch sample-based statistics produced by the deep-profile pass. All
/// three reference a SyncBatch (typically Mode='profile') and are
/// CountyId-scoped. Verifies entity → EF configuration → DbContext
/// registration end to end.
/// </summary>
public class SyncProfileStatsSchemaTests
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

    private static async System.Threading.Tasks.Task<(County county, SyncBatch profileBatch)> SeedCountyAndProfileBatchAsync(TerraFusionDbContext context)
    {
        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);

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
        context.SyncBatches.Add(batch);
        await context.SaveChangesAsync();

        return (county, batch);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTableStats_PersistsRowCountAndSamplingMetadata()
    {
        await using var context = CreateContext($"profile-table-stats-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileTableStats.Add(new SyncProfileTableStats
        {
            CountyId        = county.Id,
            SyncBatchId     = batch.Id,
            SourceSystem    = "PACS",
            SchemaName      = "dbo",
            TableName       = "property_val",
            RowCount        = 12_500_000,
            RowCountIsExact = false,
            SampleRowCount  = 10_000,
            SamplingMethod  = "BernoulliSample",
        });
        await context.SaveChangesAsync();

        var loaded = await context.SyncProfileTableStats.SingleAsync(x => x.SyncBatchId == batch.Id);
        loaded.SchemaName.Should().Be("dbo");
        loaded.TableName.Should().Be("property_val");
        loaded.RowCount.Should().Be(12_500_000L);
        loaded.RowCountIsExact.Should().BeFalse();
        loaded.SampleRowCount.Should().Be(10_000);
        loaded.SamplingMethod.Should().Be("BernoulliSample");
        loaded.CountyId.Should().Be(county.Id);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileColumnStats_PersistsNullPctDistinctAndSampleJson()
    {
        await using var context = CreateContext($"profile-column-stats-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileColumnStats.Add(new SyncProfileColumnStats
        {
            CountyId             = county.Id,
            SyncBatchId          = batch.Id,
            SourceSystem         = "PACS",
            SchemaName           = "dbo",
            TableName            = "property_val",
            ColumnName           = "ratio_rpt_cd",
            ParentRowCount       = 10_000,
            NullCount            = 412,
            NullPct              = 4.12m,
            DistinctCount        = 7,
            DistinctCountIsExact = true,
            MinValue             = "F",
            MaxValue             = "T",
            SampleValuesJson     = "[\"T\",\"F\",\"T\",null,\"T\",\"S\",\"T\",\"F\",\"T\",\"T\"]",
            TopValuesJson        = "[{\"value\":\"T\",\"count\":7421},{\"value\":\"F\",\"count\":2055}]",
        });
        await context.SaveChangesAsync();

        var loaded = await context.SyncProfileColumnStats.SingleAsync(x => x.SyncBatchId == batch.Id);
        loaded.ColumnName.Should().Be("ratio_rpt_cd");
        loaded.ParentRowCount.Should().Be(10_000);
        loaded.NullCount.Should().Be(412L);
        loaded.NullPct.Should().Be(4.12m);
        loaded.DistinctCount.Should().Be(7);
        loaded.DistinctCountIsExact.Should().BeTrue();
        loaded.MinValue.Should().Be("F");
        loaded.MaxValue.Should().Be("T");
        loaded.SampleValuesJson.Should().Contain("\"T\"");
        loaded.TopValuesJson.Should().Contain("\"count\":7421");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileCodeCandidate_PersistsHeuristicEvidence()
    {
        await using var context = CreateContext($"profile-code-candidate-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileCodeCandidates.Add(new SyncProfileCodeCandidate
        {
            CountyId           = county.Id,
            SyncBatchId        = batch.Id,
            SourceSystem       = "PACS",
            SchemaName         = "dbo",
            TableName          = "property_val",
            ColumnName         = "ratio_rpt_cd",
            DistinctCount      = 7,
            SampleSize         = 10_000,
            DistinctRatio      = 0.0007m,
            Reason             = "low_cardinality_string",
            CandidateCodesJson = "[{\"code\":\"T\",\"count\":7421},{\"code\":\"F\",\"count\":2055}]",
        });
        await context.SaveChangesAsync();

        var loaded = await context.SyncProfileCodeCandidates.SingleAsync(x => x.SyncBatchId == batch.Id);
        loaded.ColumnName.Should().Be("ratio_rpt_cd");
        loaded.DistinctCount.Should().Be(7);
        loaded.SampleSize.Should().Be(10_000);
        loaded.DistinctRatio.Should().Be(0.0007m);
        loaded.Reason.Should().Be("low_cardinality_string");
        loaded.CandidateCodesJson.Should().Contain("\"code\":\"T\"");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileStats_AreCountyScoped_BatchesDoNotCross()
    {
        await using var context = CreateContext($"profile-stats-isolation-{Guid.NewGuid()}");
        var (countyA, batchA) = await SeedCountyAndProfileBatchAsync(context);
        var (countyB, batchB) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileTableStats.Add(new SyncProfileTableStats
        {
            CountyId       = countyA.Id, SyncBatchId = batchA.Id, SourceSystem = "PACS",
            SchemaName     = "dbo", TableName = "property",
            RowCount       = 1_000, RowCountIsExact = true,
            SampleRowCount = 1_000, SamplingMethod = "Full",
        });
        context.SyncProfileTableStats.Add(new SyncProfileTableStats
        {
            CountyId       = countyB.Id, SyncBatchId = batchB.Id, SourceSystem = "PACS",
            SchemaName     = "dbo", TableName = "property",
            RowCount       = 2_000_000, RowCountIsExact = false,
            SampleRowCount = 10_000, SamplingMethod = "BernoulliSample",
        });
        await context.SaveChangesAsync();

        var perCountyA = await context.SyncProfileTableStats
            .Where(x => x.CountyId == countyA.Id)
            .ToListAsync();
        perCountyA.Should().HaveCount(1);
        perCountyA[0].SamplingMethod.Should().Be("Full");

        var perCountyB = await context.SyncProfileTableStats
            .Where(x => x.CountyId == countyB.Id)
            .ToListAsync();
        perCountyB.Should().HaveCount(1);
        perCountyB[0].SamplingMethod.Should().Be("BernoulliSample");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileStats_CascadeDeleteWithSyncBatch_LeavesNoOrphans()
    {
        await using var context = CreateContext($"profile-stats-cascade-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileTableStats.Add(new SyncProfileTableStats
        {
            CountyId      = county.Id, SyncBatchId = batch.Id, SourceSystem = "PACS",
            SchemaName    = "dbo", TableName = "property",
            RowCount      = 1, RowCountIsExact = true,
            SampleRowCount = 1, SamplingMethod = "Full",
        });
        context.SyncProfileColumnStats.Add(new SyncProfileColumnStats
        {
            CountyId    = county.Id, SyncBatchId = batch.Id, SourceSystem = "PACS",
            SchemaName  = "dbo", TableName = "property", ColumnName = "prop_id",
            ParentRowCount = 1, NullCount = 0, NullPct = 0m,
            DistinctCount = 1, DistinctCountIsExact = true,
        });
        context.SyncProfileCodeCandidates.Add(new SyncProfileCodeCandidate
        {
            CountyId   = county.Id, SyncBatchId = batch.Id, SourceSystem = "PACS",
            SchemaName = "dbo", TableName = "property", ColumnName = "ratio_rpt_cd",
            DistinctCount = 2, SampleSize = 10, DistinctRatio = 0.2m,
            Reason     = "low_cardinality_string",
        });
        await context.SaveChangesAsync();

        // Sanity check on baseline before cascade.
        (await context.SyncProfileTableStats.CountAsync()).Should().Be(1);
        (await context.SyncProfileColumnStats.CountAsync()).Should().Be(1);
        (await context.SyncProfileCodeCandidates.CountAsync()).Should().Be(1);

        // Cascade: removing the SyncBatch must remove every dependent stat row
        // (the configurations declare DeleteBehavior.Cascade on SyncBatchId).
        context.SyncBatches.Remove(batch);
        await context.SaveChangesAsync();

        (await context.SyncProfileTableStats.CountAsync()).Should().Be(0);
        (await context.SyncProfileColumnStats.CountAsync()).Should().Be(0);
        (await context.SyncProfileCodeCandidates.CountAsync()).Should().Be(0);
    }
}
