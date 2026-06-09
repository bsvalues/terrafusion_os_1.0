using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.DTOs;
using TerraFusion.CurrentUse.Services;
using Xunit;

namespace TerraFusion.CurrentUse.Tests;

/// <summary>
/// Unit tests for ClassificationService covering:
/// - List with pagination
/// - Filter by status and classification code
/// - Get by ID
/// - Create new classification
/// </summary>
public class ClassificationServiceTests
{
    private readonly Mock<ILogger<ClassificationService>> _loggerMock = new();

    private ClassificationService CreateService(CurrentUseDbContext db)
        => new(db, _loggerMock.Object);

    [Fact]
    public async Task ListAsync_ReturnsSeededClassifications()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.ListAsync(null, null, 1, 50);

        result.Should().NotBeNull();
        result.Total.Should().BeGreaterThan(0);
        result.Items.Should().NotBeEmpty();
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(50);
    }

    [Fact]
    public async Task ListAsync_FilterByStatus_ReturnsOnlyActive()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.ListAsync("Active", null, 1, 50);

        result.Items.Should().OnlyContain(c => c.Status == "Active");
    }

    [Fact]
    public async Task ListAsync_FilterByStatus_ReturnsOnlyRemoved()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.ListAsync("Removed", null, 1, 50);

        result.Items.Should().OnlyContain(c => c.Status == "Removed");
        result.Items.Should().HaveCount(1); // Only one removed in seed data
    }

    [Fact]
    public async Task ListAsync_FilterByClassificationCode()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.ListAsync(null, "CUFA", 1, 50);

        result.Items.Should().OnlyContain(c => c.ClassificationCode == "CUFA");
        result.Items.Should().HaveCount(2); // Two CUFA in seed data
    }

    [Fact]
    public async Task ListAsync_Pagination_RespectsPageSize()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var page1 = await svc.ListAsync(null, null, 1, 2);
        var page2 = await svc.ListAsync(null, null, 2, 2);

        page1.Items.Should().HaveCount(2);
        page2.Items.Should().NotBeEmpty();
        page1.Items.Select(i => i.Id).Should().NotIntersectWith(page2.Items.Select(i => i.Id));
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsClassification()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var knownId = Guid.Parse("a1b2c3d4-0001-0001-0001-000000000001");
        var result = await svc.GetByIdAsync(knownId);

        result.Should().NotBeNull();
        result!.Id.Should().Be(knownId);
        result.ParcelId.Should().Be("1-0234-100-0001");
        result.ClassificationCode.Should().Be("DFL");
    }

    [Fact]
    public async Task GetByIdAsync_NonExistentId_ReturnsNull()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.GetByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_ReturnsNewClassification()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new ClassificationCreateRequest(
            ParcelId: "NEW-001",
            ClassificationCode: "CUOS",
            Description: "New open space enrollment",
            EnrollmentDate: new DateOnly(2026, 1, 15),
            Acreage: 45.5m,
            CurrentMarketValue: 350000m,
            CurrentUseValue: 42000m
        );

        var result = await svc.CreateAsync(request);

        result.Should().NotBeNull();
        result.ParcelId.Should().Be("NEW-001");
        result.ClassificationCode.Should().Be("CUOS");
        result.Status.Should().Be("Active");
        result.Acreage.Should().Be(45.5m);
    }

    [Fact]
    public async Task CreateAsync_PersistsToDatabase()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new ClassificationCreateRequest(
            ParcelId: "PERSIST-001",
            ClassificationCode: "DFL",
            Description: "Persistence test",
            EnrollmentDate: new DateOnly(2026, 3, 1),
            Acreage: 100m,
            CurrentMarketValue: 600000m,
            CurrentUseValue: 70000m
        );

        var created = await svc.CreateAsync(request);

        // Verify it's in the database
        var retrieved = await svc.GetByIdAsync(created.Id);
        retrieved.Should().NotBeNull();
        retrieved!.ParcelId.Should().Be("PERSIST-001");
    }
}
