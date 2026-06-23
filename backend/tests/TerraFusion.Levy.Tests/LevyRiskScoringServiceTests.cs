using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;
using TerraFusion.Levy.Services;
using Xunit;

namespace TerraFusion.Levy.Tests;

public class LevyRiskScoringServiceTests
{
    private readonly Mock<ILogger<LevyRiskScoringService>> _logger = new();

    private LevyRiskScoringService CreateService(LevyDbContext? db = null)
    {
        db ??= TestLevyDbContextFactory.Create();
        return new LevyRiskScoringService(db, _logger.Object);
    }

    [Fact]
    public async Task GetDistrictRiskSummary_NoRateData_ReturnsFailureResult()
    {
        var db = TestLevyDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.GetDistrictRiskSummaryAsync(2026, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("No levy rate data found");
    }

    [Fact]
    public async Task GetDistrictRiskSummary_WithRateData_ReturnsSuccessResult()
    {
        var db = TestLevyDbContextFactory.Create();
        var district = new District
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            DistrictCode = "SD-001",
            Name = "Kennewick School District",
            DistrictType = "School",
            TotalAssessedValue = 5_000_000_000m,
            ParcelCount = 25000,
            IsActive = true,
            CreatedBy = "test"
        };
        db.Districts.Add(district);

        var measure = new LevyMeasure
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "School General",
            LevyType = "General",
            LevyYear = 2026,
            Status = "Active",
            TargetAmount = 50_000_000m,
            TotalAssessedValue = 5_000_000_000m,
            CreatedBy = "test"
        };
        db.LevyMeasures.Add(measure);

        db.LevyRates.Add(new LevyRate
        {
            Id = Guid.NewGuid(),
            LevyMeasureId = measure.Id,
            DistrictId = district.Id,
            Rate = 3.5m, // $3.50 per $1000 — well below $10 limit
            AssessedValue = 5_000_000_000m,
            LevyAmount = 17_500_000m,
            EffectiveDate = new DateTime(2026, 1, 1),
            CreatedBy = "test"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.GetDistrictRiskSummaryAsync(2026, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Districts.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetDistrictRiskSummary_HighRateUtilization_FlagsCritical()
    {
        var db = TestLevyDbContextFactory.Create();
        var district = new District
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            DistrictCode = "OVER-001",
            Name = "Over-Limit District",
            DistrictType = "City",
            TotalAssessedValue = 1_000_000_000m,
            ParcelCount = 5000,
            IsActive = true,
            CreatedBy = "test"
        };
        db.Districts.Add(district);

        var measure = new LevyMeasure
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "City General",
            LevyType = "General",
            LevyYear = 2026,
            Status = "Active",
            TargetAmount = 9_800_000m,
            TotalAssessedValue = 1_000_000_000m,
            CreatedBy = "test"
        };
        db.LevyMeasures.Add(measure);

        // Rate at 9.8 per $1000 = 98% utilization of $10 limit → critical
        db.LevyRates.Add(new LevyRate
        {
            Id = Guid.NewGuid(),
            LevyMeasureId = measure.Id,
            DistrictId = district.Id,
            Rate = 9.8m,
            AssessedValue = 1_000_000_000m,
            LevyAmount = 9_800_000m,
            EffectiveDate = new DateTime(2026, 1, 1),
            CreatedBy = "test"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.GetDistrictRiskSummaryAsync(2026, CancellationToken.None);

        result.Success.Should().BeTrue();
        var score = result.Districts.FirstOrDefault(d => d.DistrictCode == "OVER-001");
        score.Should().NotBeNull();
        score!.OverallRisk.Should().Be("critical");
        score.RiskReasons.Should().Contain(r => r.Contains("95%"));
    }

    [Fact]
    public async Task GetDistrictRiskSummary_NullTaxYear_DefaultsToCurrentYear()
    {
        var db = TestLevyDbContextFactory.Create();
        var service = CreateService(db);

        // Should not throw — defaults to DateTime.UtcNow.Year
        var result = await service.GetDistrictRiskSummaryAsync(null, CancellationToken.None);

        result.Should().NotBeNull();
        result.TaxYear.Should().Be(DateTime.UtcNow.Year);
    }
}
