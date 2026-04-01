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
public sealed class ExemptionServiceTests
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
    public async Task Exemption_CreateAsync_PersistsToDb()
    {
        await using var db = CreateDbContext(nameof(Exemption_CreateAsync_PersistsToDb));
        await SeedCounty(db, BentonCountyId);
        var svc = new ExemptionService(db, NullLogger<ExemptionService>.Instance);

        var entity = new Exemption
        {
            ParcelId = "12345-000-000",
            ProgramCode = "SENIOR",
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 50_000m,
            CountyId = BentonCountyId,
        };

        var result = await svc.CreateAsync(entity);

        result.Id.Should().NotBe(Guid.Empty);
        db.Exemptions.Should().ContainSingle(e => e.Id == result.Id);
    }

    [Fact]
    public async Task Exemption_GetByIdAsync_ReturnsSavedExemption()
    {
        await using var db = CreateDbContext(nameof(Exemption_GetByIdAsync_ReturnsSavedExemption));
        await SeedCounty(db, BentonCountyId);
        var svc = new ExemptionService(db, NullLogger<ExemptionService>.Instance);

        var entity = new Exemption
        {
            ParcelId = "88888-001-001",
            ProgramCode = "DISABILITY",
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 25_000m,
            ApplicantName = "Jane Smith",
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, BentonCountyId);

        fetched.Should().NotBeNull();
        fetched!.ProgramCode.Should().Be("DISABILITY");
        fetched.ApplicantName.Should().Be("Jane Smith");
    }

    [Fact]
    public async Task Exemption_GetByIdAsync_WrongCounty_ReturnsNull()
    {
        await using var db = CreateDbContext(nameof(Exemption_GetByIdAsync_WrongCounty_ReturnsNull));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new ExemptionService(db, NullLogger<ExemptionService>.Instance);

        var entity = new Exemption
        {
            ParcelId = "66666-000-000",
            ProgramCode = "VETERAN",
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 30_000m,
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, OtherCountyId);

        fetched.Should().BeNull();
    }

    [Fact]
    public async Task Exemption_GetByParcelAsync_OnlyReturnsSameCounty()
    {
        await using var db = CreateDbContext(nameof(Exemption_GetByParcelAsync_OnlyReturnsSameCounty));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new ExemptionService(db, NullLogger<ExemptionService>.Instance);

        const string sharedParcelId = "44444-000-000";

        await svc.CreateAsync(new Exemption
        {
            ParcelId = sharedParcelId,
            ProgramCode = "SENIOR",
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 40_000m,
            CountyId = BentonCountyId,
        });

        await svc.CreateAsync(new Exemption
        {
            ParcelId = sharedParcelId,
            ProgramCode = "SENIOR",
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 40_000m,
            CountyId = OtherCountyId,
        });

        var results = await svc.GetByParcelAsync(sharedParcelId, BentonCountyId);

        results.Should().HaveCount(1);
        results.All(e => e.CountyId == BentonCountyId).Should().BeTrue();
    }

    [Fact]
    public async Task Exemption_UpdateStatusAsync_ChangesStatus()
    {
        await using var db = CreateDbContext(nameof(Exemption_UpdateStatusAsync_ChangesStatus));
        await SeedCounty(db, BentonCountyId);
        var svc = new ExemptionService(db, NullLogger<ExemptionService>.Instance);

        var created = await svc.CreateAsync(new Exemption
        {
            ParcelId = "11111-000-000",
            ProgramCode = "SENIOR",
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 55_000m,
            CountyId = BentonCountyId,
        });

        created.Status.Should().Be("pending");

        var updated = await svc.UpdateStatusAsync(created.Id, "approved", BentonCountyId);

        updated.Status.Should().Be("approved");
    }

    [Fact]
    public async Task Exemption_CreateAsync_Command_EnforcesCountyAndDefaults()
    {
        await using var db = CreateDbContext(nameof(Exemption_CreateAsync_Command_EnforcesCountyAndDefaults));
        await SeedCounty(db, BentonCountyId);
        var svc = new ExemptionService(db, NullLogger<ExemptionService>.Instance);

        var created = await svc.CreateAsync(
            BentonCountyId,
            new CreateExemptionCommand("PARCEL-202", null, "Jane Smith", 52_000m, "84.36.381", "Review notes"),
            "exemptions@test");

        created.CountyId.Should().Be(BentonCountyId);
        created.ProgramCode.Should().Be("SENIOR_DISABLED");
        created.Status.Should().Be("pending");
        created.ApplicantName.Should().Be("Jane Smith");
        created.CreatedBy.Should().Be("exemptions@test");
    }
}
