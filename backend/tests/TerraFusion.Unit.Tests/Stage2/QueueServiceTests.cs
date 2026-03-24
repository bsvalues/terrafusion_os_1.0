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
public sealed class QueueServiceTests
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
    public async Task Queue_CreateAsync_PersistsToDb()
    {
        await using var db = CreateDbContext(nameof(Queue_CreateAsync_PersistsToDb));
        await SeedCounty(db, BentonCountyId);
        var svc = new QueueService(db, NullLogger<QueueService>.Instance);

        var entity = new QueueItem
        {
            ParcelId = "12345-000-000",
            TaskType = "APPEAL_REVIEW",
            Priority = "high",
            CountyId = BentonCountyId,
        };

        var result = await svc.CreateAsync(entity);

        result.Id.Should().NotBe(Guid.Empty);
        db.QueueItems.Should().ContainSingle(q => q.Id == result.Id);
    }

    [Fact]
    public async Task Queue_GetByIdAsync_ReturnsSavedItem()
    {
        await using var db = CreateDbContext(nameof(Queue_GetByIdAsync_ReturnsSavedItem));
        await SeedCounty(db, BentonCountyId);
        var svc = new QueueService(db, NullLogger<QueueService>.Instance);

        var entity = new QueueItem
        {
            ParcelId = "88888-001-001",
            TaskType = "EXEMPTION_VERIFY",
            Priority = "normal",
            SlaHours = 48,
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, BentonCountyId);

        fetched.Should().NotBeNull();
        fetched!.TaskType.Should().Be("EXEMPTION_VERIFY");
        fetched.SlaHours.Should().Be(48);
    }

    [Fact]
    public async Task Queue_GetByIdAsync_WrongCounty_ReturnsNull()
    {
        await using var db = CreateDbContext(nameof(Queue_GetByIdAsync_WrongCounty_ReturnsNull));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new QueueService(db, NullLogger<QueueService>.Instance);

        var entity = new QueueItem
        {
            ParcelId = "55555-000-000",
            TaskType = "FIELD_INSPECTION",
            Priority = "normal",
            CountyId = BentonCountyId,
        };

        var created = await svc.CreateAsync(entity);
        var fetched = await svc.GetByIdAsync(created.Id, OtherCountyId);

        fetched.Should().BeNull();
    }

    [Fact]
    public async Task Queue_GetPendingAsync_OnlyReturnsSameCounty()
    {
        await using var db = CreateDbContext(nameof(Queue_GetPendingAsync_OnlyReturnsSameCounty));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var svc = new QueueService(db, NullLogger<QueueService>.Instance);

        // Add one item for Benton, one for Other
        await svc.CreateAsync(new QueueItem
        {
            ParcelId = "BENTON-001",
            TaskType = "APPEAL_REVIEW",
            Priority = "normal",
            CountyId = BentonCountyId,
        });

        await svc.CreateAsync(new QueueItem
        {
            ParcelId = "OTHER-001",
            TaskType = "APPEAL_REVIEW",
            Priority = "normal",
            CountyId = OtherCountyId,
        });

        var pending = await svc.GetPendingAsync(BentonCountyId);

        pending.Should().HaveCount(1);
        pending.All(q => q.CountyId == BentonCountyId).Should().BeTrue();
        pending[0].Status.Should().Be("queued");
    }

    [Fact]
    public async Task Queue_UpdateStatusAsync_ValidTransition_Succeeds()
    {
        await using var db = CreateDbContext(nameof(Queue_UpdateStatusAsync_ValidTransition_Succeeds));
        await SeedCounty(db, BentonCountyId);
        var svc = new QueueService(db, NullLogger<QueueService>.Instance);

        var created = await svc.CreateAsync(new QueueItem
        {
            ParcelId = "99999-000-000",
            TaskType = "CERTIFICATION_STEP",
            Priority = "high",
            CountyId = BentonCountyId,
        });

        created.Status.Should().Be("queued");

        var updated = await svc.UpdateStatusAsync(created.Id, "in_progress", BentonCountyId);

        updated.Status.Should().Be("in_progress");
        updated.StartedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Queue_UpdateStatusAsync_InvalidTransition_Throws()
    {
        await using var db = CreateDbContext(nameof(Queue_UpdateStatusAsync_InvalidTransition_Throws));
        await SeedCounty(db, BentonCountyId);
        var svc = new QueueService(db, NullLogger<QueueService>.Instance);

        var created = await svc.CreateAsync(new QueueItem
        {
            ParcelId = "77777-000-000",
            TaskType = "APPEAL_REVIEW",
            Priority = "normal",
            CountyId = BentonCountyId,
        });

        // queued → completed is NOT a valid transition; must go through in_progress first
        Func<Task> act = async () => await svc.UpdateStatusAsync(created.Id, "completed", BentonCountyId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*from 'queued' to 'completed'*");
    }

    [Fact]
    public async Task Queue_AssignAsync_SetsAssignee()
    {
        await using var db = CreateDbContext(nameof(Queue_AssignAsync_SetsAssignee));
        await SeedCounty(db, BentonCountyId);
        var svc = new QueueService(db, NullLogger<QueueService>.Instance);

        var created = await svc.CreateAsync(new QueueItem
        {
            ParcelId = "66666-000-000",
            TaskType = "EXEMPTION_VERIFY",
            Priority = "normal",
            CountyId = BentonCountyId,
        });

        created.AssignedTo.Should().BeNull();

        var assigned = await svc.AssignAsync(created.Id, "alice.appraiser@benton.wa.gov", BentonCountyId);

        assigned.AssignedTo.Should().Be("alice.appraiser@benton.wa.gov");
    }
}
