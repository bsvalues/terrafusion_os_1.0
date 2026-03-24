using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Stage2;

[Trait("Category", "Stage2")]
public sealed class AppealServiceTests
{
    private static readonly Guid BentonCountyId = new("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OtherCountyId  = new("22222222-2222-2222-2222-222222222222");

    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase($"Stage2-{name}-{Guid.NewGuid()}")
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, config);
    }

    private static async Task SeedCounty(DataDbContext db, Guid countyId)
    {
        if (!await db.Counties.AnyAsync(c => c.Id == countyId))
        {
            db.Counties.Add(new County
            {
                Id = countyId,
                Name = "Benton",
                State = "WA",
                FipsCode = "003",
            });
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task Appeal_CreateAsync_PersistsToDb()
    {
        await using var db = CreateDbContext(nameof(Appeal_CreateAsync_PersistsToDb));
        await SeedCounty(db, BentonCountyId);
        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        var entity = new Appeal
        {
            ParcelId = "12345-000-000",
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 450_000m,
            RequestedValue = 400_000m,
            TaxYear = 2026,
            CountyId = BentonCountyId,
        };

        var result = await svc.CreateAsync(entity);

        result.Id.Should().NotBe(Guid.Empty);
        db.Appeals.Should().ContainSingle(a => a.Id == result.Id);
    }

    [Fact]
    public async Task Appeal_GetByIdAsync_ReturnsSavedAppeal()
    {
        await using var db = CreateDbContext(nameof(Appeal_GetByIdAsync_ReturnsSavedAppeal));
        await SeedCounty(db, BentonCountyId);
        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        var entity = new Appeal
        {
            ParcelId = "99999-001-001",
            AppealGround = "UNIFORMITY",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 300_000m,
            RequestedValue = 270_000m,
            TaxYear = 2026,
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, BentonCountyId);

        fetched.Should().NotBeNull();
        fetched!.ParcelId.Should().Be("99999-001-001");
        fetched.AppealGround.Should().Be("UNIFORMITY");
    }

    [Fact]
    public async Task Appeal_GetByIdAsync_WrongCounty_ReturnsNull()
    {
        await using var db = CreateDbContext(nameof(Appeal_GetByIdAsync_WrongCounty_ReturnsNull));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        var entity = new Appeal
        {
            ParcelId = "55555-000-000",
            AppealGround = "CLASSIFICATION",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 200_000m,
            RequestedValue = 180_000m,
            TaxYear = 2026,
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, OtherCountyId);

        fetched.Should().BeNull();
    }

    [Fact]
    public async Task Appeal_GetByParcelAsync_OnlyReturnsSameCounty()
    {
        await using var db = CreateDbContext(nameof(Appeal_GetByParcelAsync_OnlyReturnsSameCounty));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        const string sharedParcelId = "77777-000-000";

        await svc.CreateAsync(new Appeal
        {
            ParcelId = sharedParcelId,
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 100_000m,
            RequestedValue = 90_000m,
            TaxYear = 2026,
            CountyId = BentonCountyId,
        });

        await svc.CreateAsync(new Appeal
        {
            ParcelId = sharedParcelId,
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 100_000m,
            RequestedValue = 90_000m,
            TaxYear = 2026,
            CountyId = OtherCountyId,
        });

        var results = await svc.GetByParcelAsync(sharedParcelId, BentonCountyId);

        results.Should().HaveCount(1);
        results.All(a => a.CountyId == BentonCountyId).Should().BeTrue();
    }

    [Fact]
    public async Task Appeal_UpdateStatusAsync_ChangesStatus()
    {
        await using var db = CreateDbContext(nameof(Appeal_UpdateStatusAsync_ChangesStatus));
        await SeedCounty(db, BentonCountyId);
        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        var created = await svc.CreateAsync(new Appeal
        {
            ParcelId = "33333-000-000",
            AppealGround = "CLERICAL_ERROR",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 500_000m,
            RequestedValue = 480_000m,
            TaxYear = 2026,
            CountyId = BentonCountyId,
        });

        var updated = await svc.UpdateStatusAsync(
            created.Id,
            "decided",
            BentonCountyId,
            decisionNotes: "Clerical error confirmed.",
            decidedValue: 480_000m);

        updated.Status.Should().Be("decided");
        updated.DecisionNotes.Should().Be("Clerical error confirmed.");
        updated.DecidedValue.Should().Be(480_000m);
        updated.DecisionDate.Should().NotBeNull();
    }

    [Fact]
    public async Task Appeal_GetByTaxYearAsync_FiltersCorrectly()
    {
        await using var db = CreateDbContext(nameof(Appeal_GetByTaxYearAsync_FiltersCorrectly));
        await SeedCounty(db, BentonCountyId);
        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        await svc.CreateAsync(new Appeal
        {
            ParcelId = "A-2025",
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 200_000m,
            RequestedValue = 180_000m,
            TaxYear = 2025,
            CountyId = BentonCountyId,
        });

        await svc.CreateAsync(new Appeal
        {
            ParcelId = "A-2026",
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 220_000m,
            RequestedValue = 200_000m,
            TaxYear = 2026,
            CountyId = BentonCountyId,
        });

        var results2026 = await svc.GetByTaxYearAsync(2026, BentonCountyId);

        results2026.Should().HaveCount(1);
        results2026[0].ParcelId.Should().Be("A-2026");
    }
}
