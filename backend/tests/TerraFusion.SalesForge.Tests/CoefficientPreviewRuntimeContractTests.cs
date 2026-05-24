using FluentAssertions;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

public class CoefficientPreviewRuntimeContractTests
{
    private static readonly string ControllerSource = ReadSource(
        "src", "TerraFusion.API", "Controllers", "MassAppraisalController.cs");

    private static readonly string CountyResolverSource = ReadSource(
        "src", "TerraFusion.API", "Services", "CountyResolver.cs");

    private static readonly string StatisticsSource = ReadSource(
        "src", "TerraFusion.API", "Services", "ForgeStatisticsService.cs");

    [Fact]
    public void MassAppraisal_ResolvesCountyScopeThroughCountyResolver()
    {
        ControllerSource.Should().Contain("ICountyResolver");
        ControllerSource.Should().Contain("_countyResolver.ResolveAsync(countyToken");
        ControllerSource.Should().Contain("X-TerraFusion-County");
    }

    [Fact]
    public void CountyResolver_AcceptsWashingtonCountySlugTokens()
    {
        CountyResolverSource.Should().Contain("TryGetCountyNameFromSlug");
        CountyResolverSource.Should().Contain("\"wa\", StringComparison.OrdinalIgnoreCase");
    }

    [Fact]
    public void ForgeStatistics_JoinsPropertiesOnRequestedStudyTaxYear()
    {
        StatisticsSource.Should().Contain("p.TaxYear == taxYear");
        StatisticsSource.Should().Contain("saleParcelIds.Contains(p.ParcelNumber)");
        StatisticsSource.Should().NotContain("MaxAsync(p => (int?)p.TaxYear");
    }

    private static string ReadSource(params string[] relativePath)
    {
        var testDir = AppDomain.CurrentDomain.BaseDirectory;
        var repoRoot = Path.GetFullPath(Path.Combine(testDir, "..", "..", "..", "..", ".."));
        return File.ReadAllText(Path.Combine(new[] { repoRoot }.Concat(relativePath).ToArray()));
    }
}
