// ═══════════════════════════════════════════════════════════════════════════════
// Phase 22: Multi-County Federation Layer Tests
// Tests for CountyId parsing, county context, and API endpoint county routing.
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Phase 22: Tests for the Multi-County Federation Layer infrastructure.
/// Validates county ID parsing, county context behavior, and placeholder responses for non-configured counties.
/// </summary>
public class MultiCountyFederationTests
{
    #region CountyHelper.ParseCountyIdOrDefault Tests

    [Fact]
    public void ParseCountyIdOrDefault_NullInput_ReturnsBenton()
    {
        // Arrange & Act
        var result = CountyHelper.ParseCountyIdOrDefault(null);

        // Assert
        Assert.Equal(CountyId.Benton, result);
    }

    [Fact]
    public void ParseCountyIdOrDefault_EmptyInput_ReturnsBenton()
    {
        // Arrange & Act
        var result = CountyHelper.ParseCountyIdOrDefault("");

        // Assert
        Assert.Equal(CountyId.Benton, result);
    }

    [Fact]
    public void ParseCountyIdOrDefault_WhitespaceInput_ReturnsBenton()
    {
        // Arrange & Act
        var result = CountyHelper.ParseCountyIdOrDefault("   ");

        // Assert
        Assert.Equal(CountyId.Benton, result);
    }

    [Fact]
    public void ParseCountyIdOrDefault_InvalidInput_ReturnsBenton()
    {
        // Arrange & Act
        var result = CountyHelper.ParseCountyIdOrDefault("invalidcounty");

        // Assert
        Assert.Equal(CountyId.Benton, result);
    }

    [Theory]
    [InlineData("benton", CountyId.Benton)]
    [InlineData("BENTON", CountyId.Benton)]
    [InlineData("Benton", CountyId.Benton)]
    [InlineData("  benton  ", CountyId.Benton)]
    public void ParseCountyIdOrDefault_BentonVariants_ReturnsBenton(string input, CountyId expected)
    {
        // Act
        var result = CountyHelper.ParseCountyIdOrDefault(input);

        // Assert
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("yakima", CountyId.Yakima)]
    [InlineData("YAKIMA", CountyId.Yakima)]
    [InlineData("Yakima", CountyId.Yakima)]
    public void ParseCountyIdOrDefault_YakimaVariants_ReturnsYakima(string input, CountyId expected)
    {
        // Act
        var result = CountyHelper.ParseCountyIdOrDefault(input);

        // Assert
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("franklin", CountyId.Franklin)]
    [InlineData("FRANKLIN", CountyId.Franklin)]
    [InlineData("Franklin", CountyId.Franklin)]
    public void ParseCountyIdOrDefault_FranklinVariants_ReturnsFranklin(string input, CountyId expected)
    {
        // Act
        var result = CountyHelper.ParseCountyIdOrDefault(input);

        // Assert
        Assert.Equal(expected, result);
    }

    #endregion

    #region CountyHelper.GetCountyInfo Tests

    [Fact]
    public void GetCountyInfo_Benton_ReturnsConfiguredCounty()
    {
        // Act
        var info = CountyHelper.GetCountyInfo(CountyId.Benton);

        // Assert
        Assert.Equal(CountyId.Benton, info.Id);
        Assert.Equal("Benton County", info.DisplayName);
        Assert.Equal("benton", info.Code);
        Assert.True(info.IsConfigured);
        Assert.Equal("WA", info.State);
    }

    [Fact]
    public void GetCountyInfo_Yakima_ReturnsNotConfigured()
    {
        // Act
        var info = CountyHelper.GetCountyInfo(CountyId.Yakima);

        // Assert
        Assert.Equal(CountyId.Yakima, info.Id);
        Assert.Equal("Yakima County", info.DisplayName);
        Assert.Equal("yakima", info.Code);
        Assert.False(info.IsConfigured);
    }

    [Fact]
    public void GetCountyInfo_Franklin_ReturnsNotConfigured()
    {
        // Act
        var info = CountyHelper.GetCountyInfo(CountyId.Franklin);

        // Assert
        Assert.Equal(CountyId.Franklin, info.Id);
        Assert.Equal("Franklin County", info.DisplayName);
        Assert.Equal("franklin", info.Code);
        Assert.False(info.IsConfigured);
    }

    [Fact]
    public void GetCountyInfo_StringOverload_ParsesAndReturnsInfo()
    {
        // Act
        var info = CountyHelper.GetCountyInfo("yakima");

        // Assert
        Assert.Equal(CountyId.Yakima, info.Id);
        Assert.Equal("Yakima County", info.DisplayName);
    }

    [Fact]
    public void GetCountyInfo_InvalidString_ReturnsBentonInfo()
    {
        // Act
        var info = CountyHelper.GetCountyInfo("invalid");

        // Assert
        Assert.Equal(CountyId.Benton, info.Id);
        Assert.True(info.IsConfigured);
    }

    #endregion

    #region CountyHelper.IsCountyConfigured Tests

    [Fact]
    public void IsCountyConfigured_Benton_ReturnsTrue()
    {
        Assert.True(CountyHelper.IsCountyConfigured(CountyId.Benton));
        Assert.True(CountyHelper.IsCountyConfigured("benton"));
    }

    [Fact]
    public void IsCountyConfigured_Yakima_ReturnsFalse()
    {
        Assert.False(CountyHelper.IsCountyConfigured(CountyId.Yakima));
        Assert.False(CountyHelper.IsCountyConfigured("yakima"));
    }

    [Fact]
    public void IsCountyConfigured_Franklin_ReturnsFalse()
    {
        Assert.False(CountyHelper.IsCountyConfigured(CountyId.Franklin));
        Assert.False(CountyHelper.IsCountyConfigured("franklin"));
    }

    #endregion

    #region AllCounties Tests

    [Fact]
    public void AllCounties_HasThreeCounties()
    {
        Assert.Equal(3, CountyHelper.AllCounties.Count);
    }

    [Fact]
    public void AllCounties_OnlyBentonIsConfigured()
    {
        var configured = CountyHelper.AllCounties.Where(c => c.IsConfigured).ToList();
        Assert.Single(configured);
        Assert.Equal(CountyId.Benton, configured[0].Id);
    }

    [Fact]
    public void AllCounties_AllAreWashingtonState()
    {
        Assert.All(CountyHelper.AllCounties, c => Assert.Equal("WA", c.State));
    }

    #endregion

    #region ICountyContext Tests

    [Fact]
    public void SingleTenantCountyContext_AlwaysReturnsBenton()
    {
        // Arrange
        var context = new SingleTenantCountyContext();

        // Assert
        Assert.Equal(CountyId.Benton, context.CurrentCountyId);
        Assert.Equal("Benton County", context.CurrentCounty.DisplayName);
        Assert.True(context.IsCurrentCountyConfigured);
    }

    [Fact]
    public void RequestScopedCountyContext_NullCode_DefaultsToBenton()
    {
        // Arrange
        var context = new RequestScopedCountyContext(countyCode: null);

        // Assert
        Assert.Equal(CountyId.Benton, context.CurrentCountyId);
        Assert.True(context.IsCurrentCountyConfigured);
    }

    [Fact]
    public void RequestScopedCountyContext_YakimaCode_ReturnsYakima()
    {
        // Arrange
        var context = new RequestScopedCountyContext("yakima");

        // Assert
        Assert.Equal(CountyId.Yakima, context.CurrentCountyId);
        Assert.Equal("Yakima County", context.CurrentCounty.DisplayName);
        Assert.False(context.IsCurrentCountyConfigured);
    }

    [Fact]
    public void RequestScopedCountyContext_CountyIdEnum_UsesDirectly()
    {
        // Arrange
        var context = new RequestScopedCountyContext(CountyId.Franklin);

        // Assert
        Assert.Equal(CountyId.Franklin, context.CurrentCountyId);
        Assert.Equal("Franklin County", context.CurrentCounty.DisplayName);
        Assert.False(context.IsCurrentCountyConfigured);
    }

    #endregion
}
