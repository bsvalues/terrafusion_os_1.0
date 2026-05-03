using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Wiring tests for the durable Sync spine schema.
///
/// These verify that entity → EF configuration → DbContext registration is wired
/// correctly and that CountyId scoping is preserved. They run against EF.InMemory,
/// which does NOT enforce migrations or constraints — so they prove the wiring,
/// not the migration safety. Migration safety is proven by scaffold inspection
/// and a successful local `dotnet ef database update`.
/// </summary>
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

        var countyAOnlyResults = await context.SyncWatermarks.Where(x => x.CountyId == countyA.Id).ToListAsync();
        countyAOnlyResults.Should().NotContain(x => x.LastSourceToken == "county-b-token");

        var totalRows = await context.SyncWatermarks.CountAsync();
        totalRows.Should().Be(2);
    }

    [Fact]
    public async System.Threading.Tasks.Task SyncBatch_RecordsAndQuarantine_LinkByBatchId()
    {
        await using var context = CreateContext($"sync-batch-link-{Guid.NewGuid()}");

        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);
        await context.SaveChangesAsync();

        var batch = new SyncBatch
        {
            CountyId = county.Id,
            SourceSystem = "PACS",
            Mode = "full",
            Status = "completed",
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-2),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 3,
            InsertedCount = 2,
            QuarantinedCount = 1
        };
        context.SyncBatches.Add(batch);

        context.SyncRecords.AddRange(
            new SyncRecord
            {
                CountyId = county.Id,
                SyncBatchId = batch.Id,
                SourceSystem = "PACS",
                EntityType = "Parcel",
                SourceKey = "PACS-1",
                Operation = "insert",
                PayloadHash = "sha256:1",
                SourceModifiedAtUtc = DateTimeOffset.UtcNow
            },
            new SyncRecord
            {
                CountyId = county.Id,
                SyncBatchId = batch.Id,
                SourceSystem = "PACS",
                EntityType = "Parcel",
                SourceKey = "PACS-2",
                Operation = "insert",
                PayloadHash = "sha256:2",
                SourceModifiedAtUtc = DateTimeOffset.UtcNow
            }
        );

        context.SyncQuarantine.Add(new SyncQuarantine
        {
            CountyId = county.Id,
            SyncBatchId = batch.Id,
            SourceSystem = "PACS",
            EntityType = "Parcel",
            SourceKey = "PACS-3",
            Reason = "Unknown improvement code",
            PayloadHash = "sha256:3",
            PayloadJson = "{\"prop_id\":3}"
        });

        await context.SaveChangesAsync();

        var recordCount = await context.SyncRecords.CountAsync(r => r.SyncBatchId == batch.Id);
        var quarantineCount = await context.SyncQuarantine.CountAsync(q => q.SyncBatchId == batch.Id);

        recordCount.Should().Be(2);
        quarantineCount.Should().Be(1);
    }
}
