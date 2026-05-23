using FluentAssertions;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// Tests for IAAO ratio study statistical calculations.
/// Verifies compliance with IAAO Standard on Ratio Studies (2013) §5.
///
/// Key metrics tested:
///   - Median ratio (central tendency)
///   - COD (Coefficient of Dispersion) — uniformity measure
///   - PRD (Price-Related Differential) — vertical equity
///   - IQR outlier trimming
/// </summary>
public class RatioStudyStatisticsTests
{
    // ─── IAAO Median Calculation ──────────────────────────────────────────────

    [Fact]
    public void Median_OddCount_ReturnsMiddleValue()
    {
        var ratios = new[] { 0.85m, 0.90m, 0.95m, 1.00m, 1.05m };
        var median = ComputeMedian(ratios);
        median.Should().Be(0.95m);
    }

    [Fact]
    public void Median_EvenCount_ReturnsAverageOfMiddleTwo()
    {
        var ratios = new[] { 0.85m, 0.90m, 1.00m, 1.05m };
        var median = ComputeMedian(ratios);
        median.Should().Be(0.95m);
    }

    // ─── COD (Coefficient of Dispersion) ──────────────────────────────────────
    // IAAO Standard: COD = (avg absolute deviation from median / median) × 100
    // Target: Single-family residential ≤ 15.0

    [Fact]
    public void COD_PerfectUniformity_IsZero()
    {
        var ratios = new[] { 1.00m, 1.00m, 1.00m, 1.00m, 1.00m };
        var cod = ComputeCOD(ratios);
        cod.Should().Be(0.0m);
    }

    [Fact]
    public void COD_KnownValues_MatchesManualCalculation()
    {
        // Ratios: 0.90, 0.95, 1.00, 1.05, 1.10
        // Median = 1.00
        // Abs deviations: 0.10, 0.05, 0.00, 0.05, 0.10
        // Avg abs deviation = 0.06
        // COD = (0.06 / 1.00) × 100 = 6.0
        var ratios = new[] { 0.90m, 0.95m, 1.00m, 1.05m, 1.10m };
        var cod = ComputeCOD(ratios);
        cod.Should().Be(6.0m);
    }

    [Fact]
    public void COD_ResidentialTarget_ShouldBe15OrLess()
    {
        // Well-appraised residential jurisdiction
        var ratios = new[] { 0.92m, 0.95m, 0.97m, 0.98m, 1.00m, 1.01m, 1.03m, 1.05m, 1.08m };
        var cod = ComputeCOD(ratios);
        cod.Should().BeLessThanOrEqualTo(15.0m);
    }

    // ─── PRD (Price-Related Differential) ─────────────────────────────────────
    // IAAO Standard: PRD = mean ratio / weighted mean ratio
    // Target: 0.98 ≤ PRD ≤ 1.03 (no systematic regressivity/progressivity)

    [Fact]
    public void PRD_PerfectEquity_IsOne()
    {
        // All properties assessed at same ratio regardless of value
        var data = new[]
        {
            (ratio: 1.00m, salePrice: 100_000m),
            (ratio: 1.00m, salePrice: 200_000m),
            (ratio: 1.00m, salePrice: 500_000m),
            (ratio: 1.00m, salePrice: 1_000_000m),
        };
        var prd = ComputePRD(data);
        prd.Should().Be(1.00m);
    }

    [Fact]
    public void PRD_Regressive_GreaterThanOne()
    {
        // Regressive: low-value properties over-assessed relative to high-value
        var data = new[]
        {
            (ratio: 1.10m, salePrice: 100_000m),   // over-assessed
            (ratio: 1.05m, salePrice: 200_000m),
            (ratio: 0.95m, salePrice: 500_000m),
            (ratio: 0.90m, salePrice: 1_000_000m), // under-assessed
        };
        var prd = ComputePRD(data);
        prd.Should().BeGreaterThan(1.00m);
    }

    // ─── IQR Outlier Trimming ─────────────────────────────────────────────────
    // IAAO §5.1.3: Outliers identified using IQR × 1.5 fences

    [Fact]
    public void IQRTrim_RemovesOutliers()
    {
        var ratios = new[] { 0.50m, 0.90m, 0.95m, 1.00m, 1.05m, 1.10m, 2.50m };
        var trimmed = IQRTrim(ratios);
        trimmed.Should().NotContain(0.50m);
        trimmed.Should().NotContain(2.50m);
        trimmed.Should().HaveCountGreaterThan(0);
    }

    [Fact]
    public void IQRTrim_NoOutliers_ReturnsAll()
    {
        var ratios = new[] { 0.95m, 0.97m, 0.99m, 1.01m, 1.03m, 1.05m };
        var trimmed = IQRTrim(ratios);
        trimmed.Should().HaveCount(6);
    }

    // ─── Helpers (mirror the logic in TerraForgeController) ───────────────────

    private static decimal ComputeMedian(decimal[] values)
    {
        var sorted = values.OrderBy(v => v).ToArray();
        int n = sorted.Length;
        if (n == 0) return 0;
        if (n % 2 == 1) return sorted[n / 2];
        return (sorted[n / 2 - 1] + sorted[n / 2]) / 2m;
    }

    private static decimal ComputeCOD(decimal[] ratios)
    {
        if (ratios.Length == 0) return 0;
        var median = ComputeMedian(ratios);
        if (median == 0) return 0;
        var avgAbsDev = ratios.Average(r => Math.Abs(r - median));
        return Math.Round(avgAbsDev / median * 100m, 1);
    }

    private static decimal ComputePRD((decimal ratio, decimal salePrice)[] data)
    {
        if (data.Length == 0) return 1.0m;
        var meanRatio = data.Average(d => d.ratio);
        var totalAV = data.Sum(d => d.ratio * d.salePrice);
        var totalSP = data.Sum(d => d.salePrice);
        var weightedMean = totalAV / totalSP;
        if (weightedMean == 0) return 1.0m;
        return Math.Round(meanRatio / weightedMean, 4);
    }

    private static decimal[] IQRTrim(decimal[] ratios)
    {
        var sorted = ratios.OrderBy(v => v).ToArray();
        int n = sorted.Length;
        if (n < 4) return sorted;
        var q1 = sorted[n / 4];
        var q3 = sorted[3 * n / 4];
        var iqr = q3 - q1;
        var lowerFence = q1 - 1.5m * iqr;
        var upperFence = q3 + 1.5m * iqr;
        return sorted.Where(v => v >= lowerFence && v <= upperFence).ToArray();
    }
}
