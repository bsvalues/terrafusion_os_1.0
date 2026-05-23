using TerraFusion.CostForge.Tests.Mirrors;

namespace TerraFusion.CostForge.Tests;

/// <summary>
/// Tests for NormalizeExplicitRevalArea — the region string normalization logic
/// that maps user input to canonical "Reval N" format.
/// </summary>
public class RegionNormalizationTests
{
    [Theory]
    [InlineData("Reval 1", "Reval 1")]
    [InlineData("Reval 2", "Reval 2")]
    [InlineData("Reval 3", "Reval 3")]
    [InlineData("Reval 4", "Reval 4")]
    [InlineData("Reval 5", "Reval 5")]
    [InlineData("Reval 6", "Reval 6")]
    public void NormalizeExplicitRevalArea_ExactMatch_ReturnsCanonical(string input, string expected)
    {
        var result = CostCalculationEngine.NormalizeExplicitRevalArea(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("reval 1", "Reval 1")]
    [InlineData("REVAL 3", "Reval 3")]
    [InlineData("ReVaL 6", "Reval 6")]
    public void NormalizeExplicitRevalArea_CaseInsensitive(string input, string expected)
    {
        var result = CostCalculationEngine.NormalizeExplicitRevalArea(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("1", "Reval 1")]
    [InlineData("2", "Reval 2")]
    [InlineData("6", "Reval 6")]
    public void NormalizeExplicitRevalArea_NumericOnly_ReturnsCanonical(string input, string expected)
    {
        var result = CostCalculationEngine.NormalizeExplicitRevalArea(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("REVAL1", "Reval 1")]
    [InlineData("reval3", "Reval 3")]
    [InlineData("REVAL6", "Reval 6")]
    public void NormalizeExplicitRevalArea_NoSpace_ReturnsCanonical(string input, string expected)
    {
        var result = CostCalculationEngine.NormalizeExplicitRevalArea(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void NormalizeExplicitRevalArea_NullOrEmpty_ReturnsNull(string? input)
    {
        var result = CostCalculationEngine.NormalizeExplicitRevalArea(input);
        Assert.Null(result);
    }

    [Theory]
    [InlineData("7")]
    [InlineData("Reval 7")]
    [InlineData("0")]
    [InlineData("Downtown")]
    [InlineData("Zone A")]
    public void NormalizeExplicitRevalArea_InvalidRegion_ReturnsNull(string input)
    {
        var result = CostCalculationEngine.NormalizeExplicitRevalArea(input);
        Assert.Null(result);
    }

    [Fact]
    public void NormalizeExplicitRevalArea_LeadingTrailingWhitespace_Trimmed()
    {
        var result = CostCalculationEngine.NormalizeExplicitRevalArea("  Reval 4  ");
        Assert.Equal("Reval 4", result);
    }
}

/// <summary>
/// Tests for BankersRound (MidpointRounding.ToEven) — ensures IAAO-compliant rounding.
/// </summary>
public class BankersRoundTests
{
    [Theory]
    [InlineData(127.505, 127.50)]  // .5 rounds to even (0 is even)
    [InlineData(127.515, 127.52)]  // .5 rounds to even (2 is even)
    [InlineData(127.525, 127.52)]  // .5 rounds to even (2 is even)
    [InlineData(127.535, 127.54)]  // .5 rounds to even (4 is even)
    [InlineData(100.004, 100.00)]
    [InlineData(100.005, 100.00)]  // Bankers: .5 → even
    [InlineData(100.006, 100.01)]
    [InlineData(100.015, 100.02)]  // Bankers: .5 → even (2)
    public void BankersRound_FollowsMidpointToEven(decimal input, decimal expected)
    {
        var result = CostCalculationEngine.BankersRound(input);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void BankersRound_PreservesExactValues()
    {
        Assert.Equal(127.50m, CostCalculationEngine.BankersRound(127.50m));
        Assert.Equal(0.00m, CostCalculationEngine.BankersRound(0.00m));
        Assert.Equal(999999.99m, CostCalculationEngine.BankersRound(999999.99m));
    }
}
