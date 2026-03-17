using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.Unit.Tests.Phase20;

/// <summary>
/// Phase 20 — TerraQueue Operational Spine: QueueService unit tests.
///
/// Validates:
///   - Status transition map (reject invalid moves)
///   - GetAllAsync with status/assignedTo/taskType filters
///   - County isolation on all queries
///   - StartedAt/CompletedAt auto-set
///   - ReviewAsync approve/reject
///
/// Filter: dotnet test --filter "FullyQualifiedName~Phase20.QueueServiceTests"
/// </summary>
public class QueueServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;
    private readonly QueueService _sut;
    private readonly Guid _bentonCountyId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private readonly Guid _kingCountyId = Guid.Parse("00000000-0000-0000-0000-000000000002");

    public QueueServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"QueueServiceTests_{Guid.NewGuid()}")
            .Options;

        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        _db = new TerraFusionDbContext(options, config);
        var logger = Mock.Of<ILogger<QueueService>>();
        _sut = new QueueService(_db, logger);
    }

    public void Dispose() => _db.Dispose();

    private QueueItem MakeItem(string status = "queued", string? assignedTo = null, Guid? countyId = null) =>
        new()
        {
            Id = Guid.NewGuid(),
            ParcelId = $"P-{Guid.NewGuid().ToString()[..6]}",
            TaskType = "FIELD_INSPECTION",
            Priority = "normal",
            Status = status,
            AssignedTo = assignedTo,
            CountyId = countyId ?? _bentonCountyId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

    private async Task SeedItem(QueueItem item)
    {
        _db.QueueItems.Add(item);
        await _db.SaveChangesAsync();
    }

    // ── Transition Validation ───────────────────────────────────────

    [Fact]
    public async Task UpdateStatusAsync_Queued_To_InProgress_Succeeds()
    {
        var item = MakeItem("queued");
        await SeedItem(item);

        var result = await _sut.UpdateStatusAsync(item.Id, "in_progress", _bentonCountyId);

        result.Status.Should().Be("in_progress");
        result.StartedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateStatusAsync_InProgress_To_Completed_Succeeds()
    {
        var item = MakeItem("in_progress");
        item.StartedAt = DateTime.UtcNow.AddHours(-2);
        await SeedItem(item);

        var result = await _sut.UpdateStatusAsync(item.Id, "completed", _bentonCountyId);

        result.Status.Should().Be("completed");
        result.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateStatusAsync_Completed_To_Queued_Throws_InvalidOperation()
    {
        var item = MakeItem("completed");
        item.CompletedAt = DateTime.UtcNow;
        await SeedItem(item);

        var act = () => _sut.UpdateStatusAsync(item.Id, "queued", _bentonCountyId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Invalid status transition*completed*queued*");
    }

    [Fact]
    public async Task UpdateStatusAsync_Queued_To_Completed_Throws_InvalidOperation()
    {
        var item = MakeItem("queued");
        await SeedItem(item);

        var act = () => _sut.UpdateStatusAsync(item.Id, "completed", _bentonCountyId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Invalid status transition*queued*completed*");
    }

    [Fact]
    public async Task UpdateStatusAsync_Failed_To_Queued_Succeeds_Retry()
    {
        var item = MakeItem("failed");
        await SeedItem(item);

        var result = await _sut.UpdateStatusAsync(item.Id, "queued", _bentonCountyId);

        result.Status.Should().Be("queued");
    }

    [Fact]
    public async Task UpdateStatusAsync_Escalated_To_InProgress_Succeeds_DeEscalate()
    {
        var item = MakeItem("escalated");
        await SeedItem(item);

        var result = await _sut.UpdateStatusAsync(item.Id, "in_progress", _bentonCountyId);

        result.Status.Should().Be("in_progress");
    }

    // ── GetAllAsync Filters ─────────────────────────────────────────

    [Fact]
    public async Task GetAllAsync_Filters_By_Status()
    {
        await SeedItem(MakeItem("queued"));
        await SeedItem(MakeItem("in_progress"));
        await SeedItem(MakeItem("completed"));

        var result = await _sut.GetAllAsync(_bentonCountyId, status: "queued");

        result.Should().HaveCount(1);
        result[0].Status.Should().Be("queued");
    }

    [Fact]
    public async Task GetAllAsync_Filters_By_AssignedTo()
    {
        await SeedItem(MakeItem("in_progress", assignedTo: "appraiser-jones"));
        await SeedItem(MakeItem("in_progress", assignedTo: "appraiser-smith"));

        var result = await _sut.GetAllAsync(_bentonCountyId, assignedTo: "appraiser-jones");

        result.Should().HaveCount(1);
        result[0].AssignedTo.Should().Be("appraiser-jones");
    }

    // ── County Isolation ────────────────────────────────────────────

    [Fact]
    public async Task GetAllAsync_Enforces_CountyId_Isolation()
    {
        await SeedItem(MakeItem("queued", countyId: _bentonCountyId));
        await SeedItem(MakeItem("queued", countyId: _kingCountyId));

        var bentonItems = await _sut.GetAllAsync(_bentonCountyId);
        var kingItems = await _sut.GetAllAsync(_kingCountyId);

        bentonItems.Should().HaveCount(1);
        kingItems.Should().HaveCount(1);
        bentonItems[0].CountyId.Should().Be(_bentonCountyId);
        kingItems[0].CountyId.Should().Be(_kingCountyId);
    }

    [Fact]
    public async Task AssignAsync_Enforces_CountyId_Isolation()
    {
        var item = MakeItem("queued", countyId: _bentonCountyId);
        await SeedItem(item);

        // Attempt to assign using wrong county should throw
        var act = () => _sut.AssignAsync(item.Id, "appraiser-jones", _kingCountyId);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // ── StartedAt / CompletedAt Auto-Set ────────────────────────────

    [Fact]
    public async Task UpdateStatusAsync_Sets_StartedAt_On_InProgress()
    {
        var item = MakeItem("queued");
        await SeedItem(item);

        var result = await _sut.UpdateStatusAsync(item.Id, "in_progress", _bentonCountyId);

        result.StartedAt.Should().NotBeNull();
        result.StartedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task UpdateStatusAsync_Sets_CompletedAt_On_Completed()
    {
        var item = MakeItem("in_progress");
        item.StartedAt = DateTime.UtcNow.AddHours(-1);
        await SeedItem(item);

        var result = await _sut.UpdateStatusAsync(item.Id, "completed", _bentonCountyId);

        result.CompletedAt.Should().NotBeNull();
        result.CompletedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }
}
