using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;
using TerraFusion.Levy.Services;
using Xunit;

namespace TerraFusion.Levy.Tests;

public class RevenueProjectionServiceTests
{
    private readonly Mock<ILogger<RevenueProjectionService>> _logger = new();

    private RevenueProjectionService CreateService(LevyDbContext? db = null)
    {
        db ??= TestLevyDbContextFactory.Create();
        return new RevenueProjectionService(db, _logger.Object);
    }

    [Fact]
    public async Task GenerateProjections_FiveYears_ReturnsFiveProjections()
    {
        var scenario = new LevyScenario
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "Baseline",
            ScenarioType = "Baseline",
            AssessedValue = 100_000_000m,
            LevyRate = 0.01m,
            CollectionRate = 0.98m,
            LevyMeasureId = Guid.NewGuid()
        };

        var service = CreateService();

        var projections = await service.GenerateProjectionsAsync(scenario, 5);

        projections.Should().HaveCount(5);
    }

    [Fact]
    public async Task GenerateProjections_AssessedValueGrows_EachYearHigherThanPrevious()
    {
        var scenario = new LevyScenario
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "Growth Test",
            ScenarioType = "Optimistic",
            AssessedValue = 50_000_000m,
            LevyRate = 0.012m,
            CollectionRate = 0.97m,
            LevyMeasureId = Guid.NewGuid()
        };

        var service = CreateService();

        var projections = await service.GenerateProjectionsAsync(scenario, 3);

        for (int i = 1; i < projections.Count; i++)
        {
            projections[i].ProjectedAssessedValue.Should()
                .BeGreaterThan(projections[i - 1].ProjectedAssessedValue);
        }
    }

    [Fact]
    public async Task GenerateProjections_ConfidenceDecreases_OverTime()
    {
        var scenario = new LevyScenario
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "Confidence Decay",
            ScenarioType = "Baseline",
            AssessedValue = 80_000_000m,
            LevyRate = 0.008m,
            CollectionRate = 0.98m,
            LevyMeasureId = Guid.NewGuid()
        };

        var service = CreateService();

        var projections = await service.GenerateProjectionsAsync(scenario, 5);

        for (int i = 1; i < projections.Count; i++)
        {
            projections[i].ConfidenceLevel.Should().NotBeNull();
            projections[i - 1].ConfidenceLevel.Should().NotBeNull();
            projections[i].ConfidenceLevel!.Value.Should()
                .BeLessThanOrEqualTo(projections[i - 1].ConfidenceLevel!.Value);
        }
    }

    [Fact]
    public async Task GenerateProjections_NetRevenue_IncludesCollectionRate()
    {
        var scenario = new LevyScenario
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "Collection Rate Test",
            ScenarioType = "Baseline",
            AssessedValue = 100_000_000m,
            LevyRate = 0.01m,
            CollectionRate = 0.95m,
            LevyMeasureId = Guid.NewGuid()
        };

        var service = CreateService();

        var projections = await service.GenerateProjectionsAsync(scenario, 1);

        // Net revenue should be less than gross levy amount (due to collection rate < 1)
        projections[0].ProjectedNetRevenue.Should()
            .BeLessThan(projections[0].ProjectedLevyAmount);
    }

    [Fact]
    public async Task GenerateProjections_RiskFactors_ArePopulated()
    {
        var scenario = new LevyScenario
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "Risk Test",
            ScenarioType = "Conservative",
            AssessedValue = 75_000_000m,
            LevyRate = 0.015m,
            CollectionRate = 0.96m,
            LevyMeasureId = Guid.NewGuid()
        };

        var service = CreateService();

        var projections = await service.GenerateProjectionsAsync(scenario, 3);

        projections.Should().AllSatisfy(p =>
        {
            p.RiskFactors.Should().NotBeNullOrEmpty();
        });
    }

    [Fact]
    public async Task GenerateProjections_CountyIdIsPreserved()
    {
        var scenario = new LevyScenario
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "County Test",
            ScenarioType = "Baseline",
            AssessedValue = 60_000_000m,
            LevyRate = 0.009m,
            CollectionRate = 0.98m,
            LevyMeasureId = Guid.NewGuid()
        };

        var service = CreateService();

        var projections = await service.GenerateProjectionsAsync(scenario, 2);

        projections.Should().AllSatisfy(p =>
        {
            p.CountyId.Should().Be("benton");
            p.LevyScenarioId.Should().Be(scenario.Id);
        });
    }

    [Fact]
    public async Task CalculateProjectedGrowthRate_NoHistoricalData_ReturnsDefaultRate()
    {
        var service = CreateService();

        var rate = await service.CalculateProjectedGrowthRateAsync("benton");

        rate.Should().BeGreaterThan(0m);
        rate.Should().BeLessThan(0.10m); // Reasonable growth rate
    }
}
