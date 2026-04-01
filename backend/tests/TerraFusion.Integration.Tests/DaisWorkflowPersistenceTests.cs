using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests;

public sealed class DaisWorkflowPersistenceTests
{
    private static readonly Guid BentonCountyId = new("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OtherCountyId = new("22222222-2222-2222-2222-222222222222");

    private static DataDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        return new DataDbContext(options, configuration);
    }

    private static async Task SeedCounty(DataDbContext db, Guid countyId, string name, string fips)
    {
        if (!await db.Counties.AnyAsync(c => c.Id == countyId))
        {
            db.Counties.Add(new County
            {
                Id = countyId,
                Name = name,
                State = "WA",
                FipsCode = fips,
            });
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task CertificationService_StatusReads_InitializeAndReusePersistedRows()
    {
        await using var db = CreateContext(nameof(CertificationService_StatusReads_InitializeAndReusePersistedRows));
        await SeedCounty(db, BentonCountyId, "Benton", "003");

        var service = new CertificationService(db, NullLogger<CertificationService>.Instance);

        var first = await service.GetByTaxYearAsync(2030, BentonCountyId);
        var second = await service.GetByTaxYearAsync(2030, BentonCountyId);

        first.Should().HaveCount(6);
        second.Should().HaveCount(6);
        db.CertificationSteps.Count(s => s.CountyId == BentonCountyId && s.TaxYear == 2030).Should().Be(6);
        second.Select(s => s.Id).Should().BeEquivalentTo(first.Select(s => s.Id));
    }

    [Fact]
    public async Task QueueMetrics_IgnoreOtherCountyRows()
    {
        await using var db = CreateContext(nameof(QueueMetrics_IgnoreOtherCountyRows));
        await SeedCounty(db, BentonCountyId, "Benton", "003");
        await SeedCounty(db, OtherCountyId, "Franklin", "021");

        var service = new QueueService(db, NullLogger<QueueService>.Instance);

        await service.CreateAsync(BentonCountyId, new CreateQueueItemCommand("FIELD_INSPECTION", "BENTON-1", null, "high"));
        await service.CreateAsync(OtherCountyId, new CreateQueueItemCommand("FIELD_INSPECTION", "OTHER-1", null, "high"));

        var metrics = await service.GetMetricsAsync(BentonCountyId);

        metrics.TotalQueued.Should().Be(1);
        metrics.TotalQueued.Should().NotBe(2);
    }
}
