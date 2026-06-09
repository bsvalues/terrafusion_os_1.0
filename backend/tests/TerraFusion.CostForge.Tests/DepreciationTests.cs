using TerraFusion.CostForge.Tests.Mirrors;

namespace TerraFusion.CostForge.Tests;

/// <summary>
/// Tests for depreciation calculation — bracket tables, condition adjustments,
/// and the full depreciation pipeline.
/// </summary>
public class DepreciationTests
{
    // ─── Residential Depreciation Brackets ────────────────────────────────────

    [Theory]
    [InlineData(0, 0.95)]
    [InlineData(3, 0.95)]
    [InlineData(5, 0.95)]
    [InlineData(6, 0.87)]
    [InlineData(10, 0.87)]
    [InlineData(15, 0.87)]
    [InlineData(16, 0.70)]
    [InlineData(20, 0.70)]
    [InlineData(25, 0.70)]
    [InlineData(26, 0.50)]
    [InlineData(35, 0.50)]
    [InlineData(40, 0.50)]
    [InlineData(41, 0.35)]
    [InlineData(60, 0.35)]
    [InlineData(100, 0.35)]
    public void GetDepreciationFactor_Residential_CorrectBracket(int age, decimal expectedFactor)
    {
        var factor = CostCalculationEngine.GetDepreciationFactor(age, isResidential: true);
        Assert.Equal(expectedFactor, factor);
    }

    // ─── Commercial Depreciation Brackets ─────────────────────────────────────

    [Theory]
    [InlineData(0, 0.97)]
    [InlineData(5, 0.97)]
    [InlineData(6, 0.85)]
    [InlineData(15, 0.85)]
    [InlineData(16, 0.65)]
    [InlineData(25, 0.65)]
    [InlineData(26, 0.40)]
    [InlineData(35, 0.40)]
    [InlineData(36, 0.25)]
    [InlineData(50, 0.25)]
    [InlineData(100, 0.25)]
    public void GetDepreciationFactor_Commercial_CorrectBracket(int age, decimal expectedFactor)
    {
        var factor = CostCalculationEngine.GetDepreciationFactor(age, isResidential: false);
        Assert.Equal(expectedFactor, factor);
    }

    // ─── R-type and A-type are residential ────────────────────────────────────

    [Theory]
    [InlineData("R1", true)]
    [InlineData("R2", true)]
    [InlineData("A1", true)]
    [InlineData("A2", true)]
    [InlineData("C1", false)]
    [InlineData("C2", false)]
    [InlineData("C3", false)]
    [InlineData("C4", false)]
    [InlineData("I1", false)]
    [InlineData("S1", false)]
    [InlineData("S2", false)]
    public void BuildingType_ResidentialClassification_Correct(string buildingType, bool expectedResidential)
    {
        // The production code uses: StartsWith("R") || StartsWith("A") → residential
        bool isResidential = buildingType.StartsWith("R", StringComparison.OrdinalIgnoreCase)
                          || buildingType.StartsWith("A", StringComparison.OrdinalIgnoreCase);
        Assert.Equal(expectedResidential, isResidential);
    }

    // ─── Full Depreciation Pipeline ───────────────────────────────────────────

    [Fact]
    public void CalculateDepreciation_NewBuilding_MinimalDepreciation()
    {
        var result = CostCalculationEngine.CalculateDepreciation(
            effectiveAge: 2, condition: "good", replacementCostNew: 500_000m);

        // Age 2 → residential bracket 0-5 → factor 0.95 → physical = 5%
        Assert.Equal(5.00m, result.PhysicalDepreciation);
        Assert.Equal(0.0m, result.FunctionalObsolescence);
        Assert.Equal(0.0m, result.ExternalObsolescence);
        Assert.Equal(5.00m, result.TotalDepreciation);
        Assert.Equal(475_000.00m, result.DepreciatedValue);
    }

    [Fact]
    public void CalculateDepreciation_PoorCondition_AddsFunctionalObsolescence()
    {
        var result = CostCalculationEngine.CalculateDepreciation(
            effectiveAge: 2, condition: "poor", replacementCostNew: 100_000m);

        Assert.Equal(5.00m, result.PhysicalDepreciation);
        Assert.Equal(5.0m, result.FunctionalObsolescence);
        Assert.Equal(0.0m, result.ExternalObsolescence);
        Assert.Equal(10.00m, result.TotalDepreciation);
        Assert.Equal(90_000.00m, result.DepreciatedValue);
    }

    [Fact]
    public void CalculateDepreciation_FairCondition_Adds3PercentFunctional()
    {
        var result = CostCalculationEngine.CalculateDepreciation(
            effectiveAge: 10, condition: "fair", replacementCostNew: 200_000m);

        // Age 10 → bracket 6-15 → factor 0.87 → physical = 13%
        Assert.Equal(13.00m, result.PhysicalDepreciation);
        Assert.Equal(3.0m, result.FunctionalObsolescence);
        Assert.Equal(16.00m, result.TotalDepreciation);
        // 200000 × (1 - 0.16) = 168000
        Assert.Equal(168_000.00m, result.DepreciatedValue);
    }

    [Fact]
    public void CalculateDepreciation_NegativeAge_ClampedToZero()
    {
        var result = CostCalculationEngine.CalculateDepreciation(
            effectiveAge: -5, condition: "good", replacementCostNew: 300_000m);

        // Clamped to 0 → bracket 0-5 → factor 0.95 → physical = 5%
        Assert.Equal(5.00m, result.PhysicalDepreciation);
    }

    [Fact]
    public void CalculateDepreciation_VeryOldBuilding_MaxDepreciation()
    {
        var result = CostCalculationEngine.CalculateDepreciation(
            effectiveAge: 80, condition: "poor", replacementCostNew: 400_000m);

        // Age 80 → bracket 41+ → factor 0.35 → physical = 65%
        Assert.Equal(65.00m, result.PhysicalDepreciation);
        Assert.Equal(5.0m, result.FunctionalObsolescence);
        Assert.Equal(70.00m, result.TotalDepreciation);
        // 400000 × (1 - 0.70) = 120000
        Assert.Equal(120_000.00m, result.DepreciatedValue);
    }

    // ─── Depreciation Bracket Table Integrity ─────────────────────────────────

    [Fact]
    public void ResidentialBrackets_CoverFullRange()
    {
        var brackets = BentonCostData.ResidentialDepreciation;
        Assert.Equal(0, brackets[0].MinAge);
        Assert.Equal(999, brackets[^1].MaxAge);

        // No gaps
        for (int i = 1; i < brackets.Length; i++)
        {
            Assert.Equal(brackets[i - 1].MaxAge + 1, brackets[i].MinAge);
        }
    }

    [Fact]
    public void CommercialBrackets_CoverFullRange()
    {
        var brackets = BentonCostData.CommercialDepreciation;
        Assert.Equal(0, brackets[0].MinAge);
        Assert.Equal(999, brackets[^1].MaxAge);

        // No gaps
        for (int i = 1; i < brackets.Length; i++)
        {
            Assert.Equal(brackets[i - 1].MaxAge + 1, brackets[i].MinAge);
        }
    }

    [Fact]
    public void DepreciationFactors_MonotonicallyDecreasing()
    {
        foreach (var brackets in new[] { BentonCostData.ResidentialDepreciation, BentonCostData.CommercialDepreciation })
        {
            for (int i = 1; i < brackets.Length; i++)
            {
                Assert.True(brackets[i].Factor <= brackets[i - 1].Factor,
                    $"Depreciation factor should decrease with age: bracket {i}");
            }
        }
    }

    [Fact]
    public void DepreciationFactors_AllBetweenZeroAndOne()
    {
        foreach (var brackets in new[] { BentonCostData.ResidentialDepreciation, BentonCostData.CommercialDepreciation })
        {
            foreach (var b in brackets)
            {
                Assert.True(b.Factor > 0m && b.Factor <= 1m,
                    $"Factor {b.Factor} out of range for bracket [{b.MinAge}-{b.MaxAge}]");
            }
        }
    }
}
