using FluentAssertions;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// Source contract for CompsForge statewide federation posture.
/// Keeps statewide product contract honest without loading TerraFusion.API in tests.
/// </summary>
public class TerraForgeStatewideCompsContractTests
{
    private static readonly string ControllerSource;

    static TerraForgeStatewideCompsContractTests()
    {
        var testDir = AppDomain.CurrentDomain.BaseDirectory;
        var backendRoot = Path.GetFullPath(Path.Combine(testDir, "..", "..", "..", "..", ".."));
        var controllerPath = Path.Combine(backendRoot, "src", "TerraFusion.API", "Controllers", "TerraForgeController.cs");
        ControllerSource = File.ReadAllText(controllerPath);
    }

    [Fact]
    public void Controller_HasStatewideCompsFederationContractEndpoint()
    {
        ControllerSource.Should().Contain("[HttpGet(\"comps/statewide\")]");

        var endpoint = StatewideCompsEndpointSource();
        endpoint.Should().Contain("StatusCode(501");
        endpoint.Should().Contain("not_connected");
        endpoint.Should().Contain("Statewide comps federation is not connected in this runtime.");
        endpoint.Should().Contain("results = Array.Empty<NormalizedComparableSaleDto>()");
    }

    [Fact]
    public void StatewideCompsContract_DeclaresRegistryNormalizationProvenanceAndAccessRules()
    {
        ControllerSource.Should().Contain("StatewideCompsContractResponse");
        ControllerSource.Should().Contain("CompsCountySourceDto");
        ControllerSource.Should().Contain("NormalizedComparableSaleDto");
        ControllerSource.Should().Contain("CompsSaleProvenanceDto");
        ControllerSource.Should().Contain("CompsCountyAccessRuleDto");

        var endpoint = StatewideCompsEndpointSource();
        endpoint.Should().Contain("county_source_registry");
        endpoint.Should().Contain("normalized_sales_schema");
        endpoint.Should().Contain("cross_county_search_index");
        endpoint.Should().Contain("provenance_chain");
        endpoint.Should().Contain("county_access_policy");
    }

    [Fact]
    public void StatewideCompsContract_DoesNotSilentlyAliasBentonCompsPool()
    {
        var endpoint = StatewideCompsEndpointSource();

        endpoint.Should().NotContain("GetCompsPool");
        endpoint.Should().NotContain("_db.ComparableSales");
        endpoint.Should().NotContain("40MW11900000000");
        endpoint.Should().Contain("endpoint = \"/api/terraforge/comps-pool\"");
        endpoint.Should().Contain("countyId = \"benton\"");
    }

    private static string StatewideCompsEndpointSource()
    {
        const string methodSignature = "public IActionResult GetStatewideCompsFederationContract";
        var start = ControllerSource.IndexOf(methodSignature, StringComparison.Ordinal);
        start.Should().BeGreaterThanOrEqualTo(0, "the statewide CompsForge contract endpoint must exist");

        var end = ControllerSource.IndexOf("    // ── OLS Regression", start, StringComparison.Ordinal);
        end.Should().BeGreaterThan(start, "the endpoint should be defined before OLS Regression");

        return ControllerSource[start..end];
    }
}
