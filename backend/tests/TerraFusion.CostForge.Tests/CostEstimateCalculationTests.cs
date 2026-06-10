using TerraFusion.CostForge.Tests.Mirrors;

namespace TerraFusion.CostForge.Tests;

/// <summary>
/// Tests for the core cost estimate calculation engine.
/// Verifies: cost matrix lookup, factor application, depreciation, Benton Method ordering.
/// </summary>
public class CostEstimateCalculationTests
{
    // ─── Basic Calculation Tests ──────────────────────────────────────────────

    [Fact]
    public void ComputeCostEstimate_R1_Reval1_StandardGrades_ReturnsCorrectResult()
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "Reval 1", 2000m, 2020, "STANDARD", "GOOD", "STANDARD");

        Assert.NotNull(result);
        Assert.Equal("R1", result.BuildingType);
        Assert.Equal("Single Family Residential", result.BuildingTypeLabel);
        Assert.Equal("Reval 1", result.RevalArea);
        Assert.Equal(127.50m, result.BaseCostPerSqft);
        Assert.Equal(1.00m, result.RevalAreaFactor);
        Assert.Equal(1.00m, result.QualityFactor);
        Assert.Equal(1.00m, result.ConditionFactor);
        Assert.Equal(1.00m, result.ComplexityFactor);
    }

    [Fact]
    public void ComputeCostEstimate_UnknownBuildingType_ReturnsNull()
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "X99", "Reval 1", 1000m, 2020, "STANDARD", "GOOD", "STANDARD");

        Assert.Null(result);
    }

    [Fact]
    public void ComputeCostEstimate_UnknownRegion_ReturnsNull()
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "Reval 99", 1000m, 2020, "STANDARD", "GOOD", "STANDARD");

        Assert.Null(result);
    }

    [Fact]
    public void ComputeCostEstimate_CaseInsensitive_BuildingType()
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "r1", "Reval 1", 1000m, 2020, "STANDARD", "GOOD", "STANDARD");

        Assert.NotNull(result);
        Assert.Equal("R1", result.BuildingType);
    }

    [Fact]
    public void ComputeCostEstimate_CaseInsensitive_Region()
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "reval 1", 1000m, 2020, "STANDARD", "GOOD", "STANDARD");

        Assert.NotNull(result);
        Assert.Equal("Reval 1", result.RevalArea);
    }

    // ─── Factor Application Tests ─────────────────────────────────────────────

    [Theory]
    [InlineData("Reval 1", 1.00)]
    [InlineData("Reval 2", 1.05)]
    [InlineData("Reval 3", 1.10)]
    [InlineData("Reval 4", 0.95)]
    [InlineData("Reval 5", 0.90)]
    [InlineData("Reval 6", 0.82)]
    public void ComputeCostEstimate_AppliesCorrectRegionFactor(string region, decimal expectedFactor)
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", region, 1000m, DateTime.UtcNow.Year, "STANDARD", "GOOD", "STANDARD");

        Assert.NotNull(result);
        Assert.Equal(expectedFactor, result.RevalAreaFactor);
    }

    [Theory]
    [InlineData("ECONOMY", 0.75)]
    [InlineData("STANDARD", 1.00)]
    [InlineData("CUSTOM", 1.12)]
    [InlineData("PREMIUM", 1.30)]
    [InlineData("LUXURY", 1.55)]
    public void ComputeCostEstimate_AppliesCorrectQualityFactor(string quality, decimal expectedFactor)
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "Reval 1", 1000m, DateTime.UtcNow.Year, quality, "GOOD", "STANDARD");

        Assert.NotNull(result);
        Assert.Equal(expectedFactor, result.QualityFactor);
    }

    [Theory]
    [InlineData("POOR", 0.65)]
    [InlineData("FAIR", 0.80)]
    [InlineData("GOOD", 1.00)]
    [InlineData("EXCELLENT", 1.10)]
    public void ComputeCostEstimate_AppliesCorrectConditionFactor(string condition, decimal expectedFactor)
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "Reval 1", 1000m, DateTime.UtcNow.Year, "STANDARD", condition, "STANDARD");

        Assert.NotNull(result);
        Assert.Equal(expectedFactor, result.ConditionFactor);
    }

    [Theory]
    [InlineData("SIMPLE", 0.90)]
    [InlineData("STANDARD", 1.00)]
    [InlineData("COMPLEX", 1.10)]
    [InlineData("HIGHLY_COMPLEX", 1.20)]
    public void ComputeCostEstimate_AppliesCorrectComplexityFactor(string complexity, decimal expectedFactor)
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "Reval 1", 1000m, DateTime.UtcNow.Year, "STANDARD", "GOOD", complexity);

        Assert.NotNull(result);
        Assert.Equal(expectedFactor, result.ComplexityFactor);
    }

    // ─── Benton Method Ordering Tests ─────────────────────────────────────────

    [Fact]
    public void ComputeCostEstimate_BentonMethod_ConditionAppliedAfterDepreciation()
    {
        // The Benton Method applies condition AFTER depreciation (RCNLD = RCND × condition)
        // Not before (which would be: RCN × condition × depreciation)
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "Reval 1", 1000m, 2000, "STANDARD", "POOR", "STANDARD");

        Assert.NotNull(result);
        // RCN = 127.50 × 1.00 × 1.00 × 1.00 = 127.50
        Assert.Equal(127.50m, result.RcnPerSqft);
        // RCND = RCN × depreciation (age ~26 → factor 0.50)
        Assert.Equal(result.RcnPerSqft * result.DepreciationFactor, result.RcndPerSqft);
        // Adjusted = RCND × condition (0.65 for POOR)
        Assert.Equal(CostCalculationEngine.BankersRound(result.RcndPerSqft * 0.65m), result.AdjustedCostPerSqft);
    }

    [Fact]
    public void ComputeCostEstimate_AssessmentRatio_Always100Percent()
    {
        // RCW 84.40.030 — property assessed at 100% of true & fair value
        var result = CostCalculationEngine.ComputeCostEstimate(
            "C1", "Reval 3", 5000m, 2015, "PREMIUM", "EXCELLENT", "COMPLEX");

        Assert.NotNull(result);
        Assert.Equal(1.00m, result.AssessmentRatio);
        Assert.Equal(result.TotalCost, result.AssessedValue);
    }

    [Fact]
    public void ComputeCostEstimate_TotalCost_EqualsAdjustedCostTimesSquareFeet()
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "C2", "Reval 2", 3500m, 2010, "CUSTOM", "FAIR", "STANDARD");

        Assert.NotNull(result);
        Assert.Equal(
            CostCalculationEngine.BankersRound(result.AdjustedCostPerSqft * result.SquareFeet),
            result.TotalCost);
    }

    // ─── All Building Types Covered ───────────────────────────────────────────

    [Theory]
    [InlineData("R1", "Single Family Residential")]
    [InlineData("R2", "Multi-Family Residential")]
    [InlineData("C1", "Commercial Retail")]
    [InlineData("C2", "Office")]
    [InlineData("C3", "Restaurant")]
    [InlineData("C4", "Warehouse")]
    [InlineData("A1", "Farm")]
    [InlineData("A2", "Ranch")]
    [InlineData("I1", "Industrial")]
    [InlineData("S1", "Hospital")]
    [InlineData("S2", "School")]
    public void ComputeCostEstimate_AllBuildingTypes_Supported(string code, string expectedLabel)
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            code, "Reval 1", 1000m, DateTime.UtcNow.Year, "STANDARD", "GOOD", "STANDARD");

        Assert.NotNull(result);
        Assert.Equal(expectedLabel, result.BuildingTypeLabel);
    }

    // ─── Matrix Completeness ──────────────────────────────────────────────────

    [Fact]
    public void CostMatrix_Has66Entries_11TypesTimes6Regions()
    {
        Assert.Equal(66, BentonCostData.CostMatrix.Length);
    }

    [Fact]
    public void CostMatrix_AllBaseCosts_Positive()
    {
        foreach (var entry in BentonCostData.CostMatrix)
        {
            Assert.True(entry.BaseCostPerSqft > 0,
                $"{entry.BuildingType} in {entry.Region} has non-positive base cost");
        }
    }

    [Fact]
    public void CostMatrix_EachBuildingType_ExistsInAllRegions()
    {
        var buildingTypes = BentonCostData.CostMatrix.Select(e => e.BuildingType).Distinct().ToList();
        var regions = BentonCostData.RegionFactors.Keys.ToList();

        foreach (var bt in buildingTypes)
        {
            foreach (var region in regions)
            {
                var exists = BentonCostData.CostMatrix.Any(e =>
                    e.BuildingType == bt && e.Region.Equals(region, StringComparison.OrdinalIgnoreCase));
                Assert.True(exists, $"Missing matrix entry: {bt} × {region}");
            }
        }
    }

    // ─── Future Year Built (negative age) ─────────────────────────────────────

    [Fact]
    public void ComputeCostEstimate_FutureYearBuilt_AgeClampedToZero()
    {
        var result = CostCalculationEngine.ComputeCostEstimate(
            "R1", "Reval 1", 1000m, DateTime.UtcNow.Year + 5, "STANDARD", "GOOD", "STANDARD");

        Assert.NotNull(result);
        Assert.Equal(0, result.Age);
    }
}
