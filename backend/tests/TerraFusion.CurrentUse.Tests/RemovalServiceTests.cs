using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.DTOs;
using TerraFusion.CurrentUse.Services;
using Xunit;

namespace TerraFusion.CurrentUse.Tests;

/// <summary>
/// Unit tests for RemovalService covering:
/// - List removals
/// - Initiate a new removal
/// - Removal status lifecycle
/// </summary>
public class RemovalServiceTests
{
    private readonly Mock<ILogger<RemovalService>> _loggerMock = new();

    private RemovalService CreateService(CurrentUseDbContext db)
        => new(db, _loggerMock.Object);

    [Fact]
    public async Task ListAsync_ReturnsSeededRemovals()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.ListAsync();

        result.Should().NotBeEmpty();
        result.Should().Contain(r => r.ParcelId == "1-1234-400-0008");
    }

    [Fact]
    public async Task InitiateAsync_ValidRequest_CreatesPendingRemoval()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RemovalInitiateRequest(
            ParcelId: "1-0234-100-0001",
            ClassificationCode: "DFL",
            Reason: "Voluntary withdrawal — land sold for residential development",
            RemovalDate: new DateOnly(2026, 6, 1)
        );

        var result = await svc.InitiateAsync(request);

        result.Should().NotBeNull();
        result.ParcelId.Should().Be("1-0234-100-0001");
        result.ClassificationCode.Should().Be("DFL");
        result.Status.Should().Be("Pending");
        result.Reason.Should().Contain("Voluntary withdrawal");
    }

    [Fact]
    public async Task InitiateAsync_WithoutRemovalDate_UsesNull()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RemovalInitiateRequest(
            ParcelId: "1-0567-200-0045",
            ClassificationCode: "CUFA",
            Reason: "Government acquisition for highway expansion",
            RemovalDate: null
        );

        var result = await svc.InitiateAsync(request);

        result.RemovalDate.Should().BeNull();
        result.Status.Should().Be("Pending");
    }

    [Fact]
    public async Task InitiateAsync_PersistsToDatabase()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RemovalInitiateRequest(
            ParcelId: "PERSIST-REM-001",
            ClassificationCode: "CUOS",
            Reason: "Test persistence",
            RemovalDate: new DateOnly(2026, 7, 1)
        );

        var created = await svc.InitiateAsync(request);

        // Verify it appears in the list
        var all = await svc.ListAsync();
        all.Should().Contain(r => r.Id == created.Id);
    }

    [Fact]
    public async Task ListAsync_IncludesFinancialDetails_ForConfirmedRemovals()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.ListAsync();
        var confirmed = result.FirstOrDefault(r => r.Status == "Confirmed");

        confirmed.Should().NotBeNull();
        confirmed!.RollbackAmount.Should().BeGreaterThan(0);
        confirmed.InterestAmount.Should().BeGreaterThan(0);
        confirmed.TotalDue.Should().BeGreaterThan(0);
    }
}
