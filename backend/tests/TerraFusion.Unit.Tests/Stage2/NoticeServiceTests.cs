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
public sealed class NoticeServiceTests
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
    public async Task Notice_CreateAsync_PersistsToDb()
    {
        await using var db = CreateDbContext(nameof(Notice_CreateAsync_PersistsToDb));
        await SeedCounty(db, BentonCountyId);
        var svc = new NoticeService(db, NullLogger<NoticeService>.Instance);

        var entity = new Notice
        {
            ParcelId = "12345-000-000",
            TemplateId = "VALUE_CHANGE_NOTICE",
            DeliveryMethod = "mail",
            CountyId = BentonCountyId,
        };

        var result = await svc.CreateAsync(entity);

        result.Id.Should().NotBe(Guid.Empty);
        db.Notices.Should().ContainSingle(n => n.Id == result.Id);
    }

    [Fact]
    public async Task Notice_GetByIdAsync_ReturnsSavedNotice()
    {
        await using var db = CreateDbContext(nameof(Notice_GetByIdAsync_ReturnsSavedNotice));
        await SeedCounty(db, BentonCountyId);
        var svc = new NoticeService(db, NullLogger<NoticeService>.Instance);

        var entity = new Notice
        {
            ParcelId = "77777-001-001",
            TemplateId = "HEARING_NOTICE",
            DeliveryMethod = "email",
            RcwReference = "RCW 84.48.010",
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, BentonCountyId);

        fetched.Should().NotBeNull();
        fetched!.TemplateId.Should().Be("HEARING_NOTICE");
        fetched.RcwReference.Should().Be("RCW 84.48.010");
    }

    [Fact]
    public async Task Notice_GetByIdAsync_WrongCounty_ReturnsNull()
    {
        await using var db = CreateDbContext(nameof(Notice_GetByIdAsync_WrongCounty_ReturnsNull));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new NoticeService(db, NullLogger<NoticeService>.Instance);

        var entity = new Notice
        {
            ParcelId = "33333-000-000",
            TemplateId = "DECISION_NOTICE",
            DeliveryMethod = "mail",
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, OtherCountyId);

        fetched.Should().BeNull();
    }

    [Fact]
    public async Task Notice_GetByParcelAsync_OnlyReturnsSameCounty()
    {
        await using var db = CreateDbContext(nameof(Notice_GetByParcelAsync_OnlyReturnsSameCounty));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new NoticeService(db, NullLogger<NoticeService>.Instance);

        const string sharedParcelId = "55555-000-000";

        await svc.CreateAsync(new Notice
        {
            ParcelId = sharedParcelId,
            TemplateId = "VALUE_CHANGE_NOTICE",
            DeliveryMethod = "mail",
            CountyId = BentonCountyId,
        });

        await svc.CreateAsync(new Notice
        {
            ParcelId = sharedParcelId,
            TemplateId = "VALUE_CHANGE_NOTICE",
            DeliveryMethod = "mail",
            CountyId = OtherCountyId,
        });

        var results = await svc.GetByParcelAsync(sharedParcelId, BentonCountyId);

        results.Should().HaveCount(1);
        results.All(n => n.CountyId == BentonCountyId).Should().BeTrue();
    }

    [Fact]
    public async Task Notice_UpdateStatusAsync_ChangesStatus()
    {
        await using var db = CreateDbContext(nameof(Notice_UpdateStatusAsync_ChangesStatus));
        await SeedCounty(db, BentonCountyId);
        var svc = new NoticeService(db, NullLogger<NoticeService>.Instance);

        var created = await svc.CreateAsync(new Notice
        {
            ParcelId = "99999-000-000",
            TemplateId = "VALUE_CHANGE_NOTICE",
            DeliveryMethod = "mail",
            CountyId = BentonCountyId,
        });

        created.Status.Should().Be("generated");
        created.SentAt.Should().BeNull();

        var updated = await svc.UpdateStatusAsync(created.Id, "sent", BentonCountyId);

        updated.Status.Should().Be("sent");
        updated.SentAt.Should().NotBeNull();
    }
}
