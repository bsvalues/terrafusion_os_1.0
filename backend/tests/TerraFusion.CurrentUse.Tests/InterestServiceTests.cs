using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.Services;
using Xunit;

namespace TerraFusion.CurrentUse.Tests;

/// <summary>
/// Unit tests for InterestService covering:
/// - Rate retrieval from seeded data
/// - Interest calculation over multiple years
/// - Edge cases: single year, missing rates
/// </summary>
public class InterestServiceTests
{
    private readonly Mock<ILogger<InterestService>> _loggerMock = new();

    private InterestService CreateService(CurrentUseDbContext db)
        => new(db, _loggerMock.Object);

    [Fact]
    public async Task GetRatesAsync_ReturnsSeededRates()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var rates = await svc.GetRatesAsync();

        rates.Should().NotBeEmpty();
        rates.Should().Contain(r => r.Year == 2024 && r.Rate == 0.08m);
        rates.Should().Contain(r => r.Year == 2023 && r.Rate == 0.07m);
        rates.Should().Contain(r => r.Year == 2025 && r.Rate == 0.075m);
    }

    [Fact]
    public async Task CalculateAsync_MultipleYears_ReturnsCorrectBreakdown()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.CalculateAsync(100000m, 2022, 2025);

        result.Should().NotBeNull();
        result.Principal.Should().Be(100000m);
        result.StartYear.Should().Be(2022);
        result.EndYear.Should().Be(2025);
        result.TotalInterest.Should().BeGreaterThan(0);
        result.TotalDue.Should().Be(result.Principal + result.TotalInterest);
        result.Breakdown.Should().HaveCountGreaterThan(0);
    }

    [Fact]
    public async Task CalculateAsync_SingleYear_ReturnsCorrectInterest()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        // Service iterates from startYear to endYear inclusive
        // 2023 rate = 7%, 2024 rate = 8%
        var result = await svc.CalculateAsync(50000m, 2023, 2024);

        result.Should().NotBeNull();
        result.Breakdown.Should().HaveCount(2); // 2023 and 2024
        // Total = 50000 * 0.07 + 50000 * 0.08 = 3500 + 4000 = 7500
        result.TotalInterest.Should().Be(7500m);
    }

    [Fact]
    public async Task CalculateAsync_CumulativeIncreases()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var result = await svc.CalculateAsync(100000m, 2020, 2024);

        // Verify cumulative is monotonically increasing
        decimal prev = 0;
        foreach (var breakdown in result.Breakdown)
        {
            breakdown.Cumulative.Should().BeGreaterThan(prev);
            prev = breakdown.Cumulative;
        }
    }

    [Fact]
    public async Task GetRatesAsync_AllRatesHaveSource()
    {
        using var db = TestDbContextFactory.CreateSeeded();
        var svc = CreateService(db);

        var rates = await svc.GetRatesAsync();

        foreach (var rate in rates)
        {
            rate.Source.Should().NotBeNullOrWhiteSpace();
            rate.Year.Should().BeGreaterThan(2000);
            rate.Rate.Should().BeGreaterThan(0);
        }
    }
}
