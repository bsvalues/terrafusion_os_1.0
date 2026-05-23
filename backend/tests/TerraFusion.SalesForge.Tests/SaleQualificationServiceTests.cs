using FluentAssertions;
using TerraFusion.SalesForge.Tests.Mirrors;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// Tests for the 5-layer sale qualification engine.
/// Verifies WA State county qualification rules per IAAO standards.
/// </summary>
public class SaleQualificationServiceTests
{
    // ─── Layer 1: PACS SaleQualifier (sl_qualifier) ───────────────────────────

    [Theory]
    [InlineData("Q", "qualified")]
    [InlineData("1", "qualified")]
    [InlineData("VALID", "qualified")]
    [InlineData("U", "non-arms-length")]
    [InlineData("N", "non-arms-length")]
    [InlineData("E", "foreclosure")]
    [InlineData("FC", "foreclosure")]
    [InlineData("FORECLOSURE", "foreclosure")]
    [InlineData("A", "estate")]
    [InlineData("ESTATE", "estate")]
    [InlineData("EST", "estate")]
    public void Qualify_Layer1_SaleQualifier_MapsCorrectly(string rawQualifier, string expected)
    {
        var result = SaleQualificationEngine.Qualify(rawQualifier, null, null, null);
        result.Should().Be(expected);
    }

    [Fact]
    public void Qualify_Layer1_CaseInsensitive()
    {
        SaleQualificationEngine.Qualify("q", null, null, null).Should().Be("qualified");
        SaleQualificationEngine.Qualify("valid", null, null, null).Should().Be("qualified");
        SaleQualificationEngine.Qualify("fc", null, null, null).Should().Be("foreclosure");
    }

    // ─── Layer 2: County Ratio Code (sl_county_ratio_cd) ──────────────────────

    [Theory]
    [InlineData("100", "qualified")]
    [InlineData("0", "qualified")]
    [InlineData("200", "non-arms-length")]
    [InlineData("300", "land-only")]
    [InlineData("400", "omitted")]
    [InlineData("500", "dark-sale")]
    [InlineData("999", "non-arms-length")]
    public void Qualify_Layer2_BentonCountyRatioCodes(string countyRatioCd, string expected)
    {
        var result = SaleQualificationEngine.Qualify(null, countyRatioCd, null, null);
        result.Should().Be(expected);
    }

    [Fact]
    public void Qualify_Layer1_TakesPrecedence_OverLayer2()
    {
        var result = SaleQualificationEngine.Qualify("Q", "200", null, null);
        result.Should().Be("qualified");
    }

    // ─── Layer 3: Exclusion flag (sales_exclude_calc_cd) ──────────────────────

    [Fact]
    public void Qualify_Layer3_ExcludeCalcCd_ReturnsExcluded()
    {
        var result = SaleQualificationEngine.Qualify(null, null, "Y", null);
        result.Should().Be("excluded");
    }

    [Fact]
    public void Qualify_Layer2_TakesPrecedence_OverLayer3()
    {
        var result = SaleQualificationEngine.Qualify(null, "100", "Y", null);
        result.Should().Be("qualified");
    }

    // ─── Layer 4: WAC 458-61A excise exemption code ───────────────────────────

    [Fact]
    public void Qualify_Layer4_WacCode_ReturnsExempt()
    {
        var result = SaleQualificationEngine.Qualify(null, null, null, "458-61A-205(2)");
        result.Should().StartWith("exempt");
    }

    [Fact]
    public void Qualify_Layer4_ShortWacCode_IncludesCodeInResult()
    {
        var result = SaleQualificationEngine.Qualify(null, null, null, "458-61A-205(2)");
        result.Should().Be("exempt: 458-61A-205(2)");
    }

    [Fact]
    public void Qualify_Layer4_LongWacCode_TruncatesToExempt()
    {
        var longCode = "458-61A-205(2)-EXTRA-LONG-CODE";
        var result = SaleQualificationEngine.Qualify(null, null, null, longCode);
        result.Should().Be("exempt");
    }

    // ─── Layer 5: Default ─────────────────────────────────────────────────────

    [Fact]
    public void Qualify_Layer5_NoCodes_ReturnsQualified()
    {
        var result = SaleQualificationEngine.Qualify(null, null, null, null);
        result.Should().Be("qualified");
    }

    [Fact]
    public void Qualify_AllEmpty_ReturnsQualified()
    {
        var result = SaleQualificationEngine.Qualify("", "", "", "");
        result.Should().Be("qualified");
    }

    [Fact]
    public void Qualify_AllWhitespace_ReturnsQualified()
    {
        var result = SaleQualificationEngine.Qualify("  ", "  ", "  ", "  ");
        result.Should().Be("qualified");
    }

    // ─── Edge cases ───────────────────────────────────────────────────────────

    [Fact]
    public void Qualify_WhitespaceAroundCodes_IsTrimmed()
    {
        SaleQualificationEngine.Qualify(" Q ", null, null, null).Should().Be("qualified");
        SaleQualificationEngine.Qualify(null, " 100 ", null, null).Should().Be("qualified");
    }
}
