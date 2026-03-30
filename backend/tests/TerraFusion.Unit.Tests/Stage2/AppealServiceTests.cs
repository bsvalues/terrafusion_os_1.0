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
    public void AppealEntity_ConformsToAuditableCountyPattern()
    {
        typeof(Appeal).GetProperty(nameof(Appeal.Id))!.PropertyType.Should().Be(typeof(Guid));
        typeof(Appeal).GetProperty(nameof(Appeal.CountyId))!.PropertyType.Should().Be(typeof(Guid));
        typeof(Appeal).GetProperty(nameof(Appeal.County))!.PropertyType.Should().Be(typeof(County));
        typeof(Appeal).GetProperty(nameof(Appeal.CreatedAt))!.PropertyType.Should().Be(typeof(DateTime));
        typeof(Appeal).GetProperty(nameof(Appeal.UpdatedAt))!.PropertyType.Should().Be(typeof(DateTime));
        typeof(Appeal).GetProperty(nameof(Appeal.CreatedBy))!.PropertyType.Should().Be(typeof(string));
        typeof(Appeal).GetProperty(nameof(Appeal.UpdatedBy))!.PropertyType.Should().Be(typeof(string));
    }

    [Fact]
    public async Task AppealService_CreateAsync_PersistsAppealForResolvedCounty()
    {
        await using var db = CreateDbContext(nameof(AppealService_CreateAsync_PersistsAppealForResolvedCounty));
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
    public async Task AppealService_GetByIdAsync_ReturnsOnlyWhenCountyMatches()
    {
        await using var db = CreateDbContext(nameof(AppealService_GetByIdAsync_ReturnsOnlyWhenCountyMatches));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
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
        var sameCounty = await svc.GetByIdAsync(created.Id, BentonCountyId);
        var otherCounty = await svc.GetByIdAsync(created.Id, OtherCountyId);

        sameCounty.Should().NotBeNull();
        sameCounty!.ParcelId.Should().Be("99999-001-001");
        sameCounty.AppealGround.Should().Be("UNIFORMITY");
        otherCounty.Should().BeNull();
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
    public async Task AppealService_ListAsync_FiltersAllRowsByCountyId()
    {
        await using var db = CreateDbContext(nameof(AppealService_ListAsync_FiltersAllRowsByCountyId));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        await svc.CreateAsync(new Appeal
        {
            ParcelId = "BENTON-2026",
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 200_000m,
            RequestedValue = 180_000m,
            TaxYear = 2026,
            CountyId = BentonCountyId,
        });

        await svc.CreateAsync(new Appeal
        {
            ParcelId = "A-OTHER-2026",
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 220_000m,
            RequestedValue = 200_000m,
            TaxYear = 2026,
            CountyId = OtherCountyId,
        });

        var results2026 = await svc.GetByTaxYearAsync(2026, BentonCountyId);

        results2026.Should().HaveCount(1);
        results2026[0].ParcelId.Should().Be("BENTON-2026");
        results2026[0].CountyId.Should().Be(BentonCountyId);
    }

    [Fact]
    public async Task Appeal_CreateAsync_Command_EnforcesCountyAndDefaults()
    {
        await using var db = CreateDbContext(nameof(Appeal_CreateAsync_Command_EnforcesCountyAndDefaults));
        await SeedCounty(db, BentonCountyId);
        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        var created = await svc.CreateAsync(
            BentonCountyId,
            new CreateAppealCommand("PARCEL-101", null, "Jane Smith", 450_000m, 400_000m, 0),
            "appeals@test");

        created.CountyId.Should().Be(BentonCountyId);
        created.AppealGround.Should().Be("MARKET_VALUE");
        created.Status.Should().Be("filed");
        created.PetitionerName.Should().Be("Jane Smith");
        created.CreatedBy.Should().Be("appeals@test");
        created.TaxYear.Should().BeGreaterThan(2000);
    }

    [Fact]
    public async Task AppealService_UpdateAsync_RejectsCrossCountyMutation()
    {
        await using var db = CreateDbContext(nameof(AppealService_UpdateAsync_RejectsCrossCountyMutation));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new AppealService(db, NullLogger<AppealService>.Instance);

        var created = await svc.CreateAsync(new Appeal
        {
            ParcelId = "CROSS-COUNTY-001",
            AppealGround = "MARKET_VALUE",
            FiledDate = DateTime.UtcNow,
            CurrentValue = 325_000m,
            RequestedValue = 300_000m,
            TaxYear = 2026,
            CountyId = BentonCountyId,
        });

        var act = () => svc.UpdateStatusAsync(created.Id, "decided", OtherCountyId, "not allowed", 300_000m);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}
