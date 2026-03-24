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
public sealed class CertificationServiceTests
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
    public async Task Certification_CreateAsync_PersistsToDb()
    {
        await using var db = CreateDbContext(nameof(Certification_CreateAsync_PersistsToDb));
        await SeedCounty(db, BentonCountyId);
        var svc = new CertificationService(db, NullLogger<CertificationService>.Instance);

        var entity = new CertificationStep
        {
            TaxYear = 2026,
            StepCode = "DATA_FREEZE",
            CountyId = BentonCountyId,
        };

        var result = await svc.CreateAsync(entity);

        result.Id.Should().NotBe(Guid.Empty);
        db.CertificationSteps.Should().ContainSingle(s => s.Id == result.Id);
    }

    [Fact]
    public async Task Certification_GetByIdAsync_ReturnsSavedStep()
    {
        await using var db = CreateDbContext(nameof(Certification_GetByIdAsync_ReturnsSavedStep));
        await SeedCounty(db, BentonCountyId);
        var svc = new CertificationService(db, NullLogger<CertificationService>.Instance);

        var entity = new CertificationStep
        {
            TaxYear = 2026,
            StepCode = "EQUALIZATION_REVIEW",
            Notes = "Review completed by assessor.",
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, BentonCountyId);

        fetched.Should().NotBeNull();
        fetched!.StepCode.Should().Be("EQUALIZATION_REVIEW");
        fetched.Notes.Should().Be("Review completed by assessor.");
    }

    [Fact]
    public async Task Certification_GetByIdAsync_WrongCounty_ReturnsNull()
    {
        await using var db = CreateDbContext(nameof(Certification_GetByIdAsync_WrongCounty_ReturnsNull));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new CertificationService(db, NullLogger<CertificationService>.Instance);

        var entity = new CertificationStep
        {
            TaxYear = 2026,
            StepCode = "SIGN_OFF",
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, OtherCountyId);

        fetched.Should().BeNull();
    }

    [Fact]
    public async Task Certification_GetByTaxYearAsync_FiltersCorrectly()
    {
        await using var db = CreateDbContext(nameof(Certification_GetByTaxYearAsync_FiltersCorrectly));
        await SeedCounty(db, BentonCountyId);
        var svc = new CertificationService(db, NullLogger<CertificationService>.Instance);

        await svc.CreateAsync(new CertificationStep
        {
            TaxYear = 2025,
            StepCode = "DATA_FREEZE_2025",
            CountyId = BentonCountyId,
        });

        await svc.CreateAsync(new CertificationStep
        {
            TaxYear = 2026,
            StepCode = "DATA_FREEZE_2026",
            CountyId = BentonCountyId,
        });

        var results = await svc.GetByTaxYearAsync(2026, BentonCountyId);

        results.Should().HaveCount(1);
        results[0].StepCode.Should().Be("DATA_FREEZE_2026");
    }

    [Fact]
    public async Task Certification_CompleteStepAsync_SetsCompletedBy()
    {
        await using var db = CreateDbContext(nameof(Certification_CompleteStepAsync_SetsCompletedBy));
        await SeedCounty(db, BentonCountyId);
        var svc = new CertificationService(db, NullLogger<CertificationService>.Instance);

        var created = await svc.CreateAsync(new CertificationStep
        {
            TaxYear = 2026,
            StepCode = "BOE_CERTIFICATION",
            CountyId = BentonCountyId,
        });

        created.Status.Should().Be("pending");

        var completed = await svc.CompleteStepAsync(created.Id, "bob.assessor@benton.wa.gov", BentonCountyId);

        completed.Status.Should().Be("completed");
        completed.CompletedBy.Should().Be("bob.assessor@benton.wa.gov");
        completed.CompletedAt.Should().NotBeNull();
    }
}
