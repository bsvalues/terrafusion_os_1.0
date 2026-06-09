using FluentAssertions;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// TERRAFORGE-COMPS-LOOKBACK-RULE contract tests.
/// The comps-pool population rule must span an assessor-credible multi-year
/// lookback window (taxYear-3 .. taxYear), not only SalesYear == taxYear.
/// For tax year 2026 that means 2023/2024/2025 sales are in the pool.
/// File-based source scan, same pattern as TerraForgeControllerTests
/// (referencing TerraFusion.API triggers OOM on TerraFusion.Data).
/// </summary>
public class TerraForgeCompsPoolLookbackTests
{
    private static readonly string CompsPoolBlock;

    static TerraForgeCompsPoolLookbackTests()
    {
        var testDir = AppDomain.CurrentDomain.BaseDirectory;
        var repoRoot = Path.GetFullPath(Path.Combine(testDir, "..", "..", "..", "..", ".."));
        var controllerPath = Path.Combine(repoRoot, "src", "TerraFusion.API", "Controllers", "TerraForgeController.cs");
        var source = File.ReadAllText(controllerPath);

        // Isolate the GetCompsPool endpoint body: from its route attribute to the
        // next endpoint attribute, so assertions cannot match other endpoints.
        var start = source.IndexOf("[HttpGet(\"comps-pool\")]", StringComparison.Ordinal);
        start.Should().BeGreaterThan(-1, "comps-pool endpoint must exist");
        var end = source.IndexOf("[HttpGet(", start + 1, StringComparison.Ordinal);
        CompsPoolBlock = end > start ? source[start..end] : source[start..];
    }

    [Fact]
    public void CompsPool_UsesThreeYearLookbackWindow()
    {
        CompsPoolBlock.Should().Contain("var windowStartYear = taxYear - 3;",
            "tax year N must search sales years N-3 through N");
    }

    [Fact]
    public void CompsPool_IncludesPriorSalesYearsInWindow_2024And2025AreInThe2026Pool()
    {
        // SalesYear >= taxYear-3 && <= taxYear ⇒ for taxYear 2026 the pool
        // includes SalesYear 2023, 2024, and 2025 — not just 2026.
        CompsPoolBlock.Should().Contain("s.SalesYear >= windowStartYear && s.SalesYear <= taxYear");
    }

    [Fact]
    public void CompsPool_DoesNotFilterToCurrentSalesYearOnly()
    {
        CompsPoolBlock.Should().NotContain("s.SalesYear == taxYear",
            "the narrow SalesYear == taxYear population rule was replaced by the lookback window");
    }

    [Fact]
    public void CompsPool_FallsBackToSaleDateWindowWhenSalesYearIsNull()
    {
        CompsPoolBlock.Should().Contain("s.SalesYear == null");
        CompsPoolBlock.Should().Contain("s.SaleDate >= windowStart");
        CompsPoolBlock.Should().Contain("s.SaleDate < windowEnd");
    }

    [Fact]
    public void CompsPool_KeepsQualificationScreenOnVisiblePool()
    {
        // Rejected/disqualified sales never enter the visible pool.
        CompsPoolBlock.Should().Contain("s.QualificationDecision == \"qualified\"");
        CompsPoolBlock.Should().Contain("s.QualificationRecommendation == \"qualified\" || s.QualificationRecommendation == null");
    }

    [Fact]
    public void CompsPool_ReturnsActiveCompWindowToTheUi()
    {
        CompsPoolBlock.Should().Contain("compWindow = new");
        CompsPoolBlock.Should().Contain("salesYearStart = windowStartYear");
        CompsPoolBlock.Should().Contain("salesYearEnd = taxYear");
        CompsPoolBlock.Should().Contain("label = $\"{windowStartYear}–{taxYear}\"");
    }

    [Fact]
    public void CompsPool_ReturnsSeparatedPopulationCounts()
    {
        CompsPoolBlock.Should().Contain("poolCounts = new");
        CompsPoolBlock.Should().Contain("candidate = candidateCount");
        CompsPoolBlock.Should().Contain("qualified = qualifiedConfirmedCount");
        CompsPoolBlock.Should().Contain("rejectedOrUnqualified = rejectedOrUnqualifiedCount");
        CompsPoolBlock.Should().Contain("displayed = items.Count");
    }
}
