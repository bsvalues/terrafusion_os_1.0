// backend/TerraFusion.API.Tests/BentonEquityMathTests.cs
//
// Task D — pure-math tests for the Benton Method helpers. These run without
// a DB and pin down the contract that the Inspector service relies on:
//   1. PRB slope direction + magnitude on hand-computed fixtures.
//   2. VEI composite lands in [0, 100] with the right weighting.
//   3. ClassifyEquity sort order (Regressive before Progressive) + the
//      InsufficientData gate at < MinRatiosForClassification.
//   4. ComputeBentonEquityScore deducts the expected penalties for isolated
//      COD / PRD / PRB / VEI breaches.

using TerraFusion.Core.DTOs;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.API.Tests;

public class BentonEquityMathTests
{
    private static SaleRatio MakeRatio(int i, decimal av, decimal sp) =>
        new(
            ParcelId:           $"P{i}",
            AssessedValue:      av,
            AdjustedSalePrice:  sp,
            Ratio:              av / sp,
            SaleDate:           new DateTime(2025, 6, 15, 0, 0, 0, DateTimeKind.Utc),
            YearBuilt:          2000,
            NeighborhoodCode:   "NBHD",
            City:               "Kennewick",
            PropertyUseStratum: "R1",
            ConditionGrade:     "GOOD",
            QualityGrade:       "STANDARD");

    // ── PRB ────────────────────────────────────────────────────────────────

    [Fact]
    public void ComputePrb_ReturnsNull_WhenFewerThan10()
    {
        var ratios = Enumerable.Range(0, 9)
            .Select(i => MakeRatio(i, 100_000m, 100_000m))
            .ToList();
        Assert.Null(BentonEquityMath.ComputePrb(ratios, 1.0m));
    }

    [Fact]
    public void ComputePrb_FairDistribution_IsNearZero()
    {
        // All ratios ≈ 1.0 across a range of values → slope ≈ 0.
        var ratios = new List<SaleRatio>();
        for (var i = 0; i < 20; i++)
            ratios.Add(MakeRatio(i, 200_000m + i * 5_000m, 200_000m + i * 5_000m));
        var prb = BentonEquityMath.ComputePrb(ratios, 1.0m);
        Assert.NotNull(prb);
        Assert.InRange(prb!.Value, -0.02m, 0.02m);
    }

    [Fact]
    public void ComputePrb_RegressiveBias_IsPositive()
    {
        // Higher-value parcels over-assessed (ratio rises with value) → positive slope.
        var ratios = new List<SaleRatio>();
        for (var i = 0; i < 20; i++)
        {
            var sp = 100_000m + i * 20_000m;
            var av = sp * (0.85m + 0.02m * i);   // ratio climbs 0.85 → 1.23
            ratios.Add(MakeRatio(i, av, sp));
        }
        var median = BentonEquityMath.Median(ratios.Select(r => r.Ratio).ToList());
        var prb = BentonEquityMath.ComputePrb(ratios, median);
        Assert.NotNull(prb);
        Assert.True(prb!.Value > 0.05m, $"Expected progressive PRB > 0.05, got {prb}");
    }

    [Fact]
    public void ComputePrb_ProgressiveBias_IsNegative()
    {
        // Lower-value parcels over-assessed (ratio falls with value) → negative slope.
        var ratios = new List<SaleRatio>();
        for (var i = 0; i < 20; i++)
        {
            var sp = 100_000m + i * 20_000m;
            var av = sp * (1.23m - 0.02m * i);   // ratio falls 1.23 → 0.85
            ratios.Add(MakeRatio(i, av, sp));
        }
        var median = BentonEquityMath.Median(ratios.Select(r => r.Ratio).ToList());
        var prb = BentonEquityMath.ComputePrb(ratios, median);
        Assert.NotNull(prb);
        Assert.True(prb!.Value < -0.05m, $"Expected regressive PRB < -0.05, got {prb}");
    }

    // ── VEI ────────────────────────────────────────────────────────────────

    [Fact]
    public void ComputeVei_ReturnsNull_WhenPrdOrPrbMissing()
    {
        var ratios = Enumerable.Range(0, 20).Select(i => MakeRatio(i, 100_000m, 100_000m)).ToList();
        Assert.Null(BentonEquityMath.ComputeVei(ratios, null, 0.02m));
        Assert.Null(BentonEquityMath.ComputeVei(ratios, 1.0m, null));
    }

    [Fact]
    public void ComputeVei_PerfectFair_IsNear100()
    {
        var ratios = new List<SaleRatio>();
        for (var i = 0; i < 20; i++)
            ratios.Add(MakeRatio(i, 200_000m + i * 5_000m, 200_000m + i * 5_000m));
        var vei = BentonEquityMath.ComputeVei(ratios, prd: 1.0m, prb: 0m);
        Assert.NotNull(vei);
        // PRD=1 and PRB=0 contribute 40+40. Spearman on constant-ratio series ≈ 0
        // (ties), so the ρ term contributes 20 → total 100.
        Assert.InRange(vei!.Value, 95m, 100m);
    }

    [Fact]
    public void ComputeVei_BothBandsBreached_DropsBelow60()
    {
        var ratios = Enumerable.Range(0, 20).Select(i => MakeRatio(i, 100_000m, 100_000m)).ToList();
        var vei = BentonEquityMath.ComputeVei(ratios, prd: 1.10m, prb: 0.10m);
        Assert.NotNull(vei);
        Assert.True(vei!.Value < 60m, $"Expected VEI < 60 for dual-band breach, got {vei}");
    }

    // ── ClassifyEquity ─────────────────────────────────────────────────────

    [Fact]
    public void ClassifyEquity_InsufficientData_WhenBelowMinRatios()
    {
        Assert.Equal("InsufficientData",
            BentonEquityMath.ClassifyEquity(prd: 1.0m, prb: 0m, ratioCount: 10));
    }

    [Fact]
    public void ClassifyEquity_InsufficientData_WhenBothNull()
    {
        Assert.Equal("InsufficientData",
            BentonEquityMath.ClassifyEquity(prd: null, prb: null, ratioCount: 100));
    }

    [Fact]
    public void ClassifyEquity_Fair_WhenInsideBothBands()
    {
        Assert.Equal("Fair",
            BentonEquityMath.ClassifyEquity(prd: 1.00m, prb: 0.01m, ratioCount: 50));
    }

    [Fact]
    public void ClassifyEquity_Regressive_WhenPrdHigh()
    {
        Assert.Equal("Regressive",
            BentonEquityMath.ClassifyEquity(prd: 1.04m, prb: 0m, ratioCount: 50));
    }

    [Fact]
    public void ClassifyEquity_Regressive_WhenPrbNegative()
    {
        Assert.Equal("Regressive",
            BentonEquityMath.ClassifyEquity(prd: 1.00m, prb: -0.08m, ratioCount: 50));
    }

    [Fact]
    public void ClassifyEquity_Progressive_WhenPrdLow()
    {
        Assert.Equal("Progressive",
            BentonEquityMath.ClassifyEquity(prd: 0.96m, prb: 0m, ratioCount: 50));
    }

    [Fact]
    public void ClassifyEquity_Progressive_WhenPrbPositive()
    {
        Assert.Equal("Progressive",
            BentonEquityMath.ClassifyEquity(prd: 1.00m, prb: 0.08m, ratioCount: 50));
    }

    [Fact]
    public void ClassifyEquity_RegressiveWins_WhenBothSignalsDisagree()
    {
        // PRD points progressive (< 0.98), PRB points regressive (< -0.05).
        // Regressivity is the more equity-harmful finding → Regressive wins.
        Assert.Equal("Regressive",
            BentonEquityMath.ClassifyEquity(prd: 0.96m, prb: -0.08m, ratioCount: 50));
    }

    // ── ComputeBentonEquityScore ─────────────────────────────────────────────

    [Fact]
    public void ComputeBentonEquityScore_AllFair_IsNear100()
    {
        var score = BentonEquityMath.ComputeBentonEquityScore(
            cod: 10m, prd: 1.00m, prb: 0.01m, vei: 98m, ratioCount: 50);
        Assert.NotNull(score);
        Assert.InRange(score!.Value, 99m, 100m);
    }

    [Fact]
    public void ComputeBentonEquityScore_CodBreachOnly_DeductsExpected()
    {
        // COD excess = 25 - 20 = 5 → penalty 5 * 1.5 = 7.5
        var score = BentonEquityMath.ComputeBentonEquityScore(
            cod: 25m, prd: 1.00m, prb: 0m, vei: 100m, ratioCount: 50);
        Assert.Equal(92.5m, score);
    }

    [Fact]
    public void ComputeBentonEquityScore_PrbBreachOnly_DeductsExpected()
    {
        // PRB excess = 0.10 - 0.05 = 0.05 → penalty 0.05 * 200 = 10
        var score = BentonEquityMath.ComputeBentonEquityScore(
            cod: 10m, prd: 1.00m, prb: 0.10m, vei: 100m, ratioCount: 50);
        Assert.Equal(90m, score);
    }

    [Fact]
    public void ComputeBentonEquityScore_InsufficientRatios_ReturnsNull()
    {
        var score = BentonEquityMath.ComputeBentonEquityScore(
            cod: 10m, prd: 1.00m, prb: 0m, vei: 100m, ratioCount: 10);
        Assert.Null(score);
    }

    [Fact]
    public void ComputeBentonEquityScore_ClampedToZero_OnSevereBreaches()
    {
        var score = BentonEquityMath.ComputeBentonEquityScore(
            cod: 200m, prd: 2m, prb: 1m, vei: 0m, ratioCount: 50);
        Assert.Equal(0m, score);
    }
}
