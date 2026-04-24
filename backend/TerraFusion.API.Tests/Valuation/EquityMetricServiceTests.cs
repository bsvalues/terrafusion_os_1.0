using TerraFusion.AI.Valuation;
using TerraFusion.Core.DTOs;
using Xunit;

namespace TerraFusion.API.Tests.Valuation;

public class EquityMetricServiceTests
{
    [Fact]
    public void Median_odd_count_returns_middle_value()
    {
        var values = new List<decimal> { 1m, 3m, 5m };
        Assert.Equal(3m, EquityMetricService.Median(values));
    }

    [Fact]
    public void Median_even_count_averages_two_middle()
    {
        var values = new List<decimal> { 1m, 2m, 3m, 4m };
        Assert.Equal(2.5m, EquityMetricService.Median(values));
    }

    [Fact]
    public void Cod_equal_ratios_is_zero()
    {
        var values = new List<decimal> { 1.0m, 1.0m, 1.0m };
        Assert.Equal(0m, EquityMetricService.ComputeCod(values, 1.0m));
    }

    [Fact]
    public void Cod_10_percent_spread_is_nonzero()
    {
        var values = new List<decimal> { 0.9m, 1.0m, 1.1m };
        var cod = EquityMetricService.ComputeCod(values, 1.0m);
        Assert.InRange(cod, 6.5m, 7.0m);
    }

    [Fact]
    public void VintageKey_returns_decade_bucket()
    {
        Assert.Equal("1970s", EquityMetricService.VintageKey(1975));
        Assert.Equal("2020s", EquityMetricService.VintageKey(2023));
        Assert.Equal("Unknown", EquityMetricService.VintageKey(null));
    }

    [Fact]
    public void ComputeFromRatios_small_sample_flags_insufficient()
    {
        var ratios = new List<SaleRatio>
        {
            new("P1", 100000m, 100000m, 1.0m, DateTime.UtcNow, 2000, "H1", "Kennewick", "R", "GOOD", "STANDARD")
        };
        var svc = new EquityMetricService(null!, null!);
        var result = svc.ComputeFromRatios(ratios);
        Assert.Equal("insufficient-sales", result.Provenance);
    }

    [Fact]
    public void ComputeFromRatios_large_sample_gets_deciles()
    {
        var ratios = Enumerable.Range(0, 40)
            .Select(i => new SaleRatio(
                $"P{i}", 100000m + i * 1000m, 100000m + i * 1000m, 1.0m + i * 0.001m,
                DateTime.UtcNow, 2000, "H1", "Kennewick", "R", "GOOD", "STANDARD"))
            .ToList();
        var svc = new EquityMetricService(null!, null!);
        var result = svc.ComputeFromRatios(ratios);
        Assert.Equal("real", result.Provenance);
        Assert.Equal(10, result.DecileMedianRatios.Length);
        Assert.All(result.DecileMedianRatios, d => Assert.NotNull(d));
    }
}
