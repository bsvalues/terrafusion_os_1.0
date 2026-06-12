using System;
using System.Collections.Generic;
using FluentAssertions;
using TerraFusion.Core.Entities.Forge;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 — TF-native SALES ratio study (D-VAL-1, pack V5): IAAO median/COD/PRD over qualified
/// sales, with a TF linear time-trend adjustment. Disqualified sales are excluded. Deterministic.
/// </summary>
public class SalesRatioTests
{
    private static readonly DateTime AsOf = new(2025, 1, 1);

    // Four qualified sales (price 100 each), trend 0 → ratios 0.8/0.9/1.1/1.2:
    // median = 1.0, COD = 15.0, PRD = 1.0.
    private static List<RatioSale> Fixture() => new()
    {
        new RatioSale(SalePrice: 100m, AssessedValue: 80m,  SaleDate: AsOf, Qualified: true),
        new RatioSale(SalePrice: 100m, AssessedValue: 90m,  SaleDate: AsOf, Qualified: true),
        new RatioSale(SalePrice: 100m, AssessedValue: 110m, SaleDate: AsOf, Qualified: true),
        new RatioSale(SalePrice: 100m, AssessedValue: 120m, SaleDate: AsOf, Qualified: true),
    };

    [Fact] // S1
    public void iaao_median_cod_prd_are_correct()
    {
        var r = SalesRatioCalculator.ComputeStudy(Fixture(), AsOf, annualTrendRate: 0m);
        r.Found.Should().BeTrue();
        r.Count.Should().Be(4);
        r.MedianRatio.Should().Be(1.0m);
        r.Cod.Should().Be(15.0m);
        r.Prd.Should().Be(1.0m);
    }

    [Fact] // S2
    public void disqualified_sales_are_excluded()
    {
        var sales = Fixture();
        sales.Add(new RatioSale(999m, 10m, AsOf, Qualified: false)); // wild outlier, disqualified
        var r = SalesRatioCalculator.ComputeStudy(sales, AsOf, 0m);
        r.Count.Should().Be(4, "the disqualified sale is excluded");
        r.MedianRatio.Should().Be(1.0m);
    }

    [Fact] // S3
    public void time_trend_adjusts_sale_price()
    {
        // One sale a year before AsOf, +10%/yr linear trend → adjusted price 110 → ratio 100/110.
        var sales = new List<RatioSale> { new(100m, 100m, new DateTime(2024, 1, 1), Qualified: true) };
        var r = SalesRatioCalculator.ComputeStudy(sales, AsOf, annualTrendRate: 0.10m);
        r.MedianRatio.Should().BeApproximately(0.9091m, 0.0005m);

        var noTrend = SalesRatioCalculator.ComputeStudy(sales, AsOf, annualTrendRate: 0m);
        noTrend.MedianRatio.Should().Be(1.0m);
    }

    [Fact] // S4
    public void study_is_deterministic()
    {
        SalesRatioCalculator.ComputeStudy(Fixture(), AsOf, 0m)
            .Should().Be(SalesRatioCalculator.ComputeStudy(Fixture(), AsOf, 0m));
    }

    [Fact] // S5
    public void no_qualified_sales_is_explicit()
    {
        var r = SalesRatioCalculator.ComputeStudy(new List<RatioSale>(), AsOf, 0m);
        r.Found.Should().BeFalse();
        r.Explanation.Should().NotBeNullOrWhiteSpace();
    }
}
