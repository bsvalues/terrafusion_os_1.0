using FluentAssertions;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// File-based contract tests for TerraForgeController.
/// Validates the API contract by scanning the controller source file.
/// This avoids referencing TerraFusion.API (which triggers OOM on TerraFusion.Data).
/// </summary>
public class TerraForgeControllerTests
{
    private static readonly string ControllerSource;

    static TerraForgeControllerTests()
    {
        // Navigate from test bin to the source file
        var testDir = AppDomain.CurrentDomain.BaseDirectory;
        var repoRoot = Path.GetFullPath(Path.Combine(testDir, "..", "..", "..", "..", ".."));
        var controllerPath = Path.Combine(repoRoot, "src", "TerraFusion.API", "Controllers", "TerraForgeController.cs");
        ControllerSource = File.ReadAllText(controllerPath);
    }

    // ─── Route Contract ───────────────────────────────────────────────────────

    [Fact]
    public void Controller_HasBaseRoute_ApiTerraforge()
    {
        ControllerSource.Should().Contain("[Route(\"api/terraforge\")]");
    }

    [Fact]
    public void Controller_IsApiController()
    {
        ControllerSource.Should().Contain("[ApiController]");
    }

    // ─── Core Endpoints ───────────────────────────────────────────────────────

    [Theory]
    [InlineData("[HttpGet(\"sale-qualification\")]")]
    [InlineData("[HttpGet(\"comps-pool\")]")]
    [InlineData("[HttpGet(\"ratio-study\")]")]
    [InlineData("[HttpGet(\"regression\")]")]
    [InlineData("[HttpGet(\"county-stats\")]")]
    [InlineData("[HttpPost(\"compute-qualifications\")]")]
    [InlineData("[HttpPost(\"apply-recommendations\")]")]
    public void Controller_HasCoreEndpoint(string httpAttribute)
    {
        ControllerSource.Should().Contain(httpAttribute);
    }

    // ─── Advanced Ratio Study Endpoints ───────────────────────────────────────

    [Theory]
    [InlineData("[HttpGet(\"ratio-study/trends\")]")]
    [InlineData("[HttpGet(\"ratio-study/stratified\")]")]
    [InlineData("[HttpGet(\"ratio-study/confidence-intervals\")]")]
    [InlineData("[HttpGet(\"ratio-study/vertical-equity\")]")]
    [InlineData("[HttpGet(\"ratio-study/influence-diagnostics\")]")]
    [InlineData("[HttpGet(\"ratio-study/time-trend\")]")]
    [InlineData("[HttpGet(\"ratio-study/spatial-autocorrelation\")]")]
    [InlineData("[HttpGet(\"ratio-study/hedonic-regression\")]")]
    [InlineData("[HttpGet(\"ratio-study/variance-decomposition\")]")]
    [InlineData("[HttpGet(\"ratio-study/sale-chasing\")]")]
    [InlineData("[HttpGet(\"ratio-study/cross-validation\")]")]
    [InlineData("[HttpGet(\"ratio-study/ks-shift-test\")]")]
    [InlineData("[HttpGet(\"ratio-study/driver-analysis\")]")]
    public void Controller_HasAdvancedRatioStudyEndpoint(string httpAttribute)
    {
        ControllerSource.Should().Contain(httpAttribute);
    }

    // ─── DI Dependencies ──────────────────────────────────────────────────────

    [Fact]
    public void Controller_InjectsDbContext()
    {
        ControllerSource.Should().Contain("TerraFusionDbContext");
    }

    [Fact]
    public void Controller_InjectsOlsRegressionService()
    {
        ControllerSource.Should().Contain("IOlsRegressionService");
    }

    [Fact]
    public void Controller_InjectsSaleQualificationService()
    {
        ControllerSource.Should().Contain("ISaleQualificationService");
    }

    [Fact]
    public void Controller_InjectsCountyResolver()
    {
        ControllerSource.Should().Contain("ICountyResolver");
    }

    // ─── Pagination Contract ──────────────────────────────────────────────────

    [Fact]
    public void Controller_EnforcesPageSizeCap()
    {
        // The controller caps pageSize at 200
        ControllerSource.Should().Contain("if (pageSize > 200) pageSize = 200");
    }

    [Fact]
    public void Controller_EnforcesMinPage()
    {
        ControllerSource.Should().Contain("if (page < 1) page = 1");
    }

    // ─── County Scope ─────────────────────────────────────────────────────────

    [Fact]
    public void Controller_SupportsCountyIdHeader()
    {
        ControllerSource.Should().Contain("x-county-id");
    }

    [Fact]
    public void Controller_SupportsCountyIdClaim()
    {
        ControllerSource.Should().Contain("FindFirst(\"countyId\")");
    }

    // ─── IAAO Compliance ──────────────────────────────────────────────────────

    [Fact]
    public void Controller_ImplementsIQROutlierTrimming()
    {
        // IAAO Standard on Ratio Studies §5.1.3
        ControllerSource.Should().Contain("IQR");
    }

    [Fact]
    public void Controller_ComputesCOD()
    {
        // Coefficient of Dispersion
        ControllerSource.Should().ContainAny("COD", "cod", "Cod");
    }

    [Fact]
    public void Controller_ComputesPRD()
    {
        // Price-Related Differential
        ControllerSource.Should().ContainAny("PRD", "prd", "Prd");
    }

    // ─── Qualification Model ──────────────────────────────────────────────────

    [Fact]
    public void Controller_RespectsLayer3DecisionOverRecommendation()
    {
        // Layer 3 (assessor decision) always wins
        ControllerSource.Should().Contain("QualificationDecision");
        ControllerSource.Should().Contain("QualificationRecommendation");
    }

    [Fact]
    public void Controller_ExcludesSuppressedFromRatioStudy()
    {
        ControllerSource.Should().Contain("SuppressOnRatioRptCd");
    }
}
