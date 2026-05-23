using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;
using TerraFusion.Levy.Services;
using Xunit;

namespace TerraFusion.Levy.Tests;

public class LevyCalculationServiceTests
{
    private readonly Mock<ILogger<LevyCalculationService>> _logger = new();

    private LevyCalculationService CreateService(LevyDbContext? db = null)
    {
        db ??= TestLevyDbContextFactory.Create();
        return new LevyCalculationService(db, _logger.Object);
    }

    [Fact]
    public async Task CalculateOptimalRate_BasicCalculation_ReturnsCorrectRate()
    {
        // Arrange: target $1,000,000 on $100,000,000 AV = 10.0 per $1000
        var measure = new LevyMeasure
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "General Fund",
            LevyType = "General",
            TargetAmount = 1_000_000m,
            TotalAssessedValue = 100_000_000m,
            SubjectToLimit = true
        };

        var service = CreateService();

        // Act
        var result = await service.CalculateOptimalRateAsync(measure);

        // Assert
        result.CalculatedRate.Should().Be(0.01m); // $1M / $100M = 0.01
        result.LevyAmount.Should().Be(1_000_000m);
        result.QuantumOptimized.Should().BeFalse();
    }

    [Fact]
    public async Task CalculateOptimalRate_ExceedsStatutoryCap_CapsAtMaximumRate()
    {
        // Arrange: target $20M on $100M AV = 0.20 rate, but max is 0.05
        var measure = new LevyMeasure
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "School District",
            LevyType = "General",
            TargetAmount = 20_000_000m,
            TotalAssessedValue = 100_000_000m,
            MaximumRate = 0.05m,
            SubjectToLimit = true
        };

        var service = CreateService();

        // Act
        var result = await service.CalculateOptimalRateAsync(measure);

        // Assert
        result.AiOptimalRate.Should().Be(0.05m); // Capped at max
        result.CalculatedRate.Should().Be(0.20m); // Raw rate still calculated
    }

    [Fact]
    public async Task CalculateOptimalRate_ZeroAssessedValue_ReturnsZeroRate()
    {
        var measure = new LevyMeasure
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "Empty District",
            LevyType = "General",
            TargetAmount = 500_000m,
            TotalAssessedValue = 0m,
            SubjectToLimit = true
        };

        var service = CreateService();

        var result = await service.CalculateOptimalRateAsync(measure);

        result.CalculatedRate.Should().Be(0m);
        result.LevyAmount.Should().Be(0m);
    }

    [Fact]
    public async Task CalculateOptimalRate_NoMaximumRate_ReturnsBaseRate()
    {
        var measure = new LevyMeasure
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "Fire District",
            LevyType = "General",
            TargetAmount = 2_000_000m,
            TotalAssessedValue = 200_000_000m,
            MaximumRate = null,
            SubjectToLimit = true
        };

        var service = CreateService();

        var result = await service.CalculateOptimalRateAsync(measure);

        result.CalculatedRate.Should().Be(0.01m);
        result.AiOptimalRate.Should().Be(0.01m); // No cap, so recommended = base
    }

    [Fact]
    public async Task CalculateOptimalRate_ConfidenceScore_IsWithinExpectedRange()
    {
        var measure = new LevyMeasure
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "Port District",
            LevyType = "General",
            TargetAmount = 500_000m,
            TotalAssessedValue = 50_000_000m,
            SubjectToLimit = true
        };

        var service = CreateService();

        var result = await service.CalculateOptimalRateAsync(measure);

        result.ConfidenceScore.Should().BeGreaterThan(0m);
        result.ConfidenceScore.Should().BeLessThanOrEqualTo(1m);
    }

    [Fact]
    public async Task CalculateOptimalRate_RecommendationReason_IncludesExplanation()
    {
        var measure = new LevyMeasure
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "Library",
            LevyType = "General",
            TargetAmount = 100_000m,
            TotalAssessedValue = 10_000_000m,
            SubjectToLimit = true
        };

        var service = CreateService();

        var result = await service.CalculateOptimalRateAsync(measure);

        result.RecommendationReason.Should().NotBeNullOrEmpty();
    }
}
