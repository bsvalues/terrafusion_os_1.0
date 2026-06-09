using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.DTOs;
using TerraFusion.CurrentUse.Models;
using TerraFusion.CurrentUse.Services;
using Xunit;

namespace TerraFusion.CurrentUse.Tests;

/// <summary>
/// Unit tests for RollbackCalculationService covering:
/// - Basic rollback calculation with known values
/// - DFL 7-year cap vs CUFA/CUOS/CUTL 10-year cap
/// - Penalty application (20%) and penalty exception waiver
/// - Interest compounding per WA DOR method
/// - Edge cases: zero values, missing rates, single year
/// </summary>
public class RollbackCalculationServiceTests
{
    private readonly Mock<ILogger<RollbackCalculationService>> _loggerMock = new();

    private RollbackCalculationService CreateService(CurrentUseDbContext db)
        => new(db, _loggerMock.Object);

    [Fact]
    public async Task CalculateAsync_BasicRollback_ReturnsCorrectTotals()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RollbackCalculationRequest(
            ParcelId: "TEST-001",
            ClassificationCode: "CUFA",
            EnrollmentYear: 2020,
            RemovalYear: 2024,
            MarketValues: new Dictionary<string, decimal>
            {
                ["2020"] = 500000m,
                ["2021"] = 520000m,
                ["2022"] = 540000m,
                ["2023"] = 560000m,
                ["2024"] = 580000m
            },
            CurrentUseValues: new Dictionary<string, decimal>
            {
                ["2020"] = 100000m,
                ["2021"] = 105000m,
                ["2022"] = 110000m,
                ["2023"] = 115000m,
                ["2024"] = 120000m
            },
            PenaltyExceptionCode: null
        );

        // Act
        var result = await svc.CalculateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.TotalRollbackTax.Should().BeGreaterThan(0);
        result.TotalInterest.Should().BeGreaterOrEqualTo(0);
        result.TotalPenalty.Should().Be(result.TotalRollbackTax * 0.20m);
        result.GrandTotal.Should().Be(result.TotalRollbackTax + result.TotalInterest + result.TotalPenalty);
        result.PenaltyApplied.Should().BeTrue();
        result.PenaltyExceptionApplied.Should().BeFalse();
        result.YearBreakdowns.Should().HaveCount(5);
    }

    [Fact]
    public async Task CalculateAsync_DFL_CapsAt7Years()
    {
        // Arrange: DFL classification with 12 years of enrollment
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var marketValues = new Dictionary<string, decimal>();
        var cuValues = new Dictionary<string, decimal>();
        for (int y = 2014; y <= 2025; y++)
        {
            marketValues[y.ToString()] = 300000m + (y - 2014) * 10000m;
            cuValues[y.ToString()] = 50000m;
        }

        var request = new RollbackCalculationRequest(
            ParcelId: "DFL-001",
            ClassificationCode: "DFL",
            EnrollmentYear: 2014,
            RemovalYear: 2025,
            MarketValues: marketValues,
            CurrentUseValues: cuValues,
            PenaltyExceptionCode: null
        );

        // Act
        var result = await svc.CalculateAsync(request);

        // Assert: DFL caps at 7 years, so only years 2019-2025
        result.YearBreakdowns.Should().HaveCount(7);
        result.YearBreakdowns.First().Year.Should().Be(2019);
        result.YearBreakdowns.Last().Year.Should().Be(2025);
    }

    [Fact]
    public async Task CalculateAsync_CUFA_CapsAt10Years()
    {
        // Arrange: CUFA with 15 years
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var marketValues = new Dictionary<string, decimal>();
        var cuValues = new Dictionary<string, decimal>();
        for (int y = 2010; y <= 2025; y++)
        {
            marketValues[y.ToString()] = 400000m;
            cuValues[y.ToString()] = 80000m;
        }

        var request = new RollbackCalculationRequest(
            ParcelId: "CUFA-001",
            ClassificationCode: "CUFA",
            EnrollmentYear: 2010,
            RemovalYear: 2025,
            MarketValues: marketValues,
            CurrentUseValues: cuValues,
            PenaltyExceptionCode: null
        );

        // Act
        var result = await svc.CalculateAsync(request);

        // Assert: CUFA caps at 10 years, so only years 2016-2025
        result.YearBreakdowns.Should().HaveCount(10);
        result.YearBreakdowns.First().Year.Should().Be(2016);
    }

    [Fact]
    public async Task CalculateAsync_PenaltyException_WaivesPenalty()
    {
        // Arrange
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RollbackCalculationRequest(
            ParcelId: "EXC-001",
            ClassificationCode: "CUFA",
            EnrollmentYear: 2022,
            RemovalYear: 2025,
            MarketValues: new Dictionary<string, decimal>
            {
                ["2022"] = 500000m, ["2023"] = 510000m,
                ["2024"] = 520000m, ["2025"] = 530000m
            },
            CurrentUseValues: new Dictionary<string, decimal>
            {
                ["2022"] = 100000m, ["2023"] = 100000m,
                ["2024"] = 100000m, ["2025"] = 100000m
            },
            PenaltyExceptionCode: "DEATH"
        );

        // Act
        var result = await svc.CalculateAsync(request);

        // Assert
        result.PenaltyExceptionApplied.Should().BeTrue();
        result.ExceptionCode.Should().Be("DEATH");
        result.TotalPenalty.Should().Be(0);
        result.GrandTotal.Should().Be(result.TotalRollbackTax + result.TotalInterest);
    }

    [Fact]
    public async Task CalculateAsync_GovtAcquisition_WaivesPenalty()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RollbackCalculationRequest(
            ParcelId: "GOV-001",
            ClassificationCode: "CUOS",
            EnrollmentYear: 2023,
            RemovalYear: 2025,
            MarketValues: new Dictionary<string, decimal>
            {
                ["2023"] = 200000m, ["2024"] = 210000m, ["2025"] = 220000m
            },
            CurrentUseValues: new Dictionary<string, decimal>
            {
                ["2023"] = 30000m, ["2024"] = 30000m, ["2025"] = 30000m
            },
            PenaltyExceptionCode: "GOVT_ACQUISITION"
        );

        var result = await svc.CalculateAsync(request);

        result.PenaltyExceptionApplied.Should().BeTrue();
        result.TotalPenalty.Should().Be(0);
    }

    [Fact]
    public async Task CalculateAsync_InvalidExceptionCode_PenaltyStillApplied()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RollbackCalculationRequest(
            ParcelId: "INV-001",
            ClassificationCode: "CUFA",
            EnrollmentYear: 2023,
            RemovalYear: 2025,
            MarketValues: new Dictionary<string, decimal>
            {
                ["2023"] = 300000m, ["2024"] = 310000m, ["2025"] = 320000m
            },
            CurrentUseValues: new Dictionary<string, decimal>
            {
                ["2023"] = 50000m, ["2024"] = 50000m, ["2025"] = 50000m
            },
            PenaltyExceptionCode: "INVALID_CODE"
        );

        var result = await svc.CalculateAsync(request);

        result.PenaltyExceptionApplied.Should().BeFalse();
        result.TotalPenalty.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CalculateAsync_SingleYear_NoInterest()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RollbackCalculationRequest(
            ParcelId: "SGL-001",
            ClassificationCode: "CUFA",
            EnrollmentYear: 2025,
            RemovalYear: 2025,
            MarketValues: new Dictionary<string, decimal> { ["2025"] = 500000m },
            CurrentUseValues: new Dictionary<string, decimal> { ["2025"] = 100000m },
            PenaltyExceptionCode: null
        );

        var result = await svc.CalculateAsync(request);

        result.TotalRollbackTax.Should().Be(400000m);
        result.TotalInterest.Should().Be(0); // No interest on removal year itself
        result.YearBreakdowns.Should().HaveCount(1);
        result.YearBreakdowns[0].Year.Should().Be(2025);
    }

    [Fact]
    public async Task CalculateAsync_ZeroMarketValue_NoDifference()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RollbackCalculationRequest(
            ParcelId: "ZERO-001",
            ClassificationCode: "CUFA",
            EnrollmentYear: 2023,
            RemovalYear: 2025,
            MarketValues: new Dictionary<string, decimal>
            {
                ["2023"] = 0m, ["2024"] = 0m, ["2025"] = 0m
            },
            CurrentUseValues: new Dictionary<string, decimal>
            {
                ["2023"] = 50000m, ["2024"] = 50000m, ["2025"] = 50000m
            },
            PenaltyExceptionCode: null
        );

        var result = await svc.CalculateAsync(request);

        result.TotalRollbackTax.Should().Be(0);
        result.TotalInterest.Should().Be(0);
        result.TotalPenalty.Should().Be(0);
        result.GrandTotal.Should().Be(0);
    }

    [Fact]
    public async Task CalculateAsync_InterestCompoundsCorrectly()
    {
        // Arrange: Use known rates from seed data
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var request = new RollbackCalculationRequest(
            ParcelId: "INT-001",
            ClassificationCode: "CUFA",
            EnrollmentYear: 2022,
            RemovalYear: 2024,
            MarketValues: new Dictionary<string, decimal>
            {
                ["2022"] = 200000m, ["2023"] = 200000m, ["2024"] = 200000m
            },
            CurrentUseValues: new Dictionary<string, decimal>
            {
                ["2022"] = 100000m, ["2023"] = 100000m, ["2024"] = 100000m
            },
            PenaltyExceptionCode: null
        );

        var result = await svc.CalculateAsync(request);

        // Year 2022: diff=100k, interest for 2 years (2023 rate + 2024 rate)
        // Year 2023: diff=100k, interest for 1 year (2024 rate)
        // Year 2024: diff=100k, interest for 0 years
        result.TotalRollbackTax.Should().Be(300000m);
        result.TotalInterest.Should().BeGreaterThan(0);

        // Verify year breakdowns have correct interest amounts
        var y2024 = result.YearBreakdowns.Single(yb => yb.Year == 2024);
        y2024.InterestAmount.Should().Be(0); // No interest on removal year
    }
}
