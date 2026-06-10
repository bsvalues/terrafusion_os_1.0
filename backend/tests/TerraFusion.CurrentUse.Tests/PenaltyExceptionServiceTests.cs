using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.Services;
using Xunit;

namespace TerraFusion.CurrentUse.Tests;

/// <summary>
/// Unit tests for PenaltyExceptionService covering:
/// - Evaluation with no removal found
/// - Evaluation with existing removal (keyword matching)
/// - All 5 RCW exception codes
/// </summary>
public class PenaltyExceptionServiceTests
{
    private readonly Mock<ILogger<PenaltyExceptionService>> _loggerMock = new();

    private PenaltyExceptionService CreateService(CurrentUseDbContext db)
        => new(db, _loggerMock.Object);

    [Fact]
    public async Task EvaluateAsync_NoRemoval_AllIneligible()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        // Use a parcel with no removal
        var result = await svc.EvaluateAsync("1-0234-100-0001");

        result.Should().HaveCount(5); // All 5 exception types
        result.Should().OnlyContain(e => !e.Eligible);
        result.Should().OnlyContain(e => e.Reason.Contains("No active removal"));
    }

    [Fact]
    public async Task EvaluateAsync_WithRemoval_ReturnsAllExceptionTypes()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        // Parcel with a confirmed removal
        var result = await svc.EvaluateAsync("1-1234-400-0008");

        result.Should().HaveCount(5);
        result.Should().Contain(e => e.Code == "DEATH");
        result.Should().Contain(e => e.Code == "GOVT_ACQUISITION");
        result.Should().Contain(e => e.Code == "TRADE_LAND_CONSERVATION");
        result.Should().Contain(e => e.Code == "FORCED_SALE");
        result.Should().Contain(e => e.Code == "TRANSFER_TO_GOVT");
    }

    [Fact]
    public async Task EvaluateAsync_AllExceptionsHaveRcwReferences()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.EvaluateAsync("1-1234-400-0008");

        foreach (var exception in result)
        {
            exception.RcwReference.Should().NotBeNullOrWhiteSpace();
            exception.RcwReference.Should().Contain("RCW");
            exception.Description.Should().NotBeNullOrWhiteSpace();
            exception.Code.Should().NotBeNullOrWhiteSpace();
        }
    }

    [Fact]
    public async Task EvaluateAsync_DeathKeyword_TriggersEligibility()
    {
        // Arrange: Create a removal with "death" in the reason
        using var db = TestDbContextFactory.CreateSeeded();
        db.Removals.Add(new Models.Removal
        {
            Id = Guid.NewGuid(),
            ParcelId = "DEATH-TEST-001",
            ClassificationCode = "CUFA",
            Reason = "Owner death — estate liquidation",
            InitiatedDate = new DateOnly(2026, 1, 1),
            Status = "Pending"
        });
        await db.SaveChangesAsync();

        var svc = CreateService(db);
        var result = await svc.EvaluateAsync("DEATH-TEST-001");

        var deathException = result.Single(e => e.Code == "DEATH");
        deathException.Eligible.Should().BeTrue();
        deathException.Reason.Should().Contain("death");
    }

    [Fact]
    public async Task EvaluateAsync_GovernmentKeyword_TriggersEligibility()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        db.Removals.Add(new Models.Removal
        {
            Id = Guid.NewGuid(),
            ParcelId = "GOVT-TEST-001",
            ClassificationCode = "CUOS",
            Reason = "Government acquisition for park expansion",
            InitiatedDate = new DateOnly(2026, 2, 1),
            Status = "Pending"
        });
        await db.SaveChangesAsync();

        var svc = CreateService(db);
        var result = await svc.EvaluateAsync("GOVT-TEST-001");

        var govtException = result.Single(e => e.Code == "GOVT_ACQUISITION");
        govtException.Eligible.Should().BeTrue();
    }

    [Fact]
    public async Task EvaluateAsync_CondemnationKeyword_TriggersEligibility()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        db.Removals.Add(new Models.Removal
        {
            Id = Guid.NewGuid(),
            ParcelId = "COND-TEST-001",
            ClassificationCode = "CUTL",
            Reason = "Condemnation proceeding by county",
            InitiatedDate = new DateOnly(2026, 3, 1),
            Status = "Pending"
        });
        await db.SaveChangesAsync();

        var svc = CreateService(db);
        var result = await svc.EvaluateAsync("COND-TEST-001");

        var forcedSale = result.Single(e => e.Code == "FORCED_SALE");
        forcedSale.Eligible.Should().BeTrue();
    }
}
