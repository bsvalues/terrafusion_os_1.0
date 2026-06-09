namespace TerraFusion.CostForge.Tests;

/// <summary>
/// File-based contract tests for CostForgeController.
/// Verifies the controller source file contains expected routes, attributes, and structure.
/// </summary>
public class CostForgeControllerContractTests
{
    private static readonly string ControllerSource = LoadControllerSource();

    private static string LoadControllerSource()
    {
        // Navigate from test bin to the controller source
        var testDir = AppContext.BaseDirectory;
        var repoRoot = Path.GetFullPath(Path.Combine(testDir, "..", "..", "..", "..", ".."));
        var controllerPath = Path.Combine(repoRoot, "src", "TerraFusion.API", "Controllers", "CostForgeController.cs");
        if (!File.Exists(controllerPath))
        {
            // Try alternative path from workspace root
            controllerPath = Path.Combine(repoRoot, "..", "src", "TerraFusion.API", "Controllers", "CostForgeController.cs");
        }
        return File.Exists(controllerPath) ? File.ReadAllText(controllerPath) : "";
    }

    // ─── Route Contract ───────────────────────────────────────────────────────

    [Fact]
    public void Controller_HasApiControllerAttribute()
    {
        Assert.Contains("[ApiController]", ControllerSource);
    }

    [Fact]
    public void Controller_RouteIsApiCostforge()
    {
        Assert.Contains("[Route(\"api/[controller]\")]", ControllerSource);
    }

    [Fact]
    public void Controller_RequiresAuthorization()
    {
        Assert.Contains("[Authorize]", ControllerSource);
    }

    [Fact]
    public void Controller_RequiresCostforgePermission()
    {
        Assert.Contains("[RequiresPermission(\"access:costforge\")]", ControllerSource);
    }

    // ─── Core Endpoints Exist ─────────────────────────────────────────────────

    [Theory]
    [InlineData("HttpPost(\"calculate\")")]
    [InlineData("HttpPost(\"cost-estimate\")")]
    [InlineData("HttpPost(\"batch-calculate\")")]
    [InlineData("HttpGet(\"cost-matrix/benton\")")]
    [InlineData("HttpGet(\"depreciation-schedule\")")]
    [InlineData("HttpPost(\"depreciation-calculate\")")]
    [InlineData("HttpGet(\"building-types\")")]
    [InlineData("HttpGet(\"regions\")")]
    [InlineData("HttpGet(\"quality-grades\")")]
    [InlineData("HttpGet(\"condition-grades\")")]
    [InlineData("HttpGet(\"feature-factors\")")]
    public void Controller_HasCoreEndpoint(string endpoint)
    {
        Assert.Contains(endpoint, ControllerSource);
    }

    // ─── Income Approach Endpoints ────────────────────────────────────────────

    [Theory]
    [InlineData("HttpGet(\"income-approach/cap-rates\")")]
    [InlineData("HttpGet(\"income-approach/market-data/benton\")")]
    [InlineData("HttpGet(\"income-approach/expense-ratios\")")]
    [InlineData("HttpGet(\"income-approach/location-premiums/benton\")")]
    [InlineData("HttpPost(\"income-approach/calculate-noi\")")]
    [InlineData("HttpPost(\"income-approach/calculate-valuation\")")]
    public void Controller_HasIncomeApproachEndpoint(string endpoint)
    {
        Assert.Contains(endpoint, ControllerSource);
    }

    // ─── Sales Comparison Endpoints ───────────────────────────────────────────

    [Theory]
    [InlineData("HttpGet(\"sales-comparison/adjustment-factors\")")]
    [InlineData("HttpGet(\"sales-comparison/market-areas/benton\")")]
    [InlineData("HttpGet(\"sales-comparison/confidence-thresholds\")")]
    [InlineData("HttpPost(\"sales-comparison/adjust-comparable\")")]
    [InlineData("HttpPost(\"sales-comparison/reconcile\")")]
    public void Controller_HasSalesComparisonEndpoint(string endpoint)
    {
        Assert.Contains(endpoint, ControllerSource);
    }

    // ─── Analytics Endpoints ──────────────────────────────────────────────────

    [Theory]
    [InlineData("HttpPost(\"analytics/bayesian\")")]
    [InlineData("HttpPost(\"analytics/montecarlo\")")]
    [InlineData("HttpPost(\"analytics/regression\")")]
    [InlineData("HttpPost(\"analytics/spatial/moran\")")]
    [InlineData("HttpPost(\"analytics/spatial/geary\")")]
    [InlineData("HttpPost(\"analytics/market/comparable-sales\")")]
    [InlineData("HttpPost(\"analytics/market/ratio-study\")")]
    [InlineData("HttpPost(\"analytics/rcw/84-34\")")]
    [InlineData("HttpPost(\"analytics/rcw/84-26\")")]
    [InlineData("HttpPost(\"analytics/rcw/84-36-381\")")]
    [InlineData("HttpPost(\"analytics/levy/calculate\")")]
    [InlineData("HttpPost(\"analytics/data-quality/assess\")")]
    [InlineData("HttpPost(\"analytics/etl/sync\")")]
    [InlineData("HttpPost(\"analytics/ml/predict\")")]
    public void Controller_HasAnalyticsEndpoint(string endpoint)
    {
        Assert.Contains(endpoint, ControllerSource);
    }

    // ─── Batch Operations ─────────────────────────────────────────────────────

    [Theory]
    [InlineData("HttpGet(\"batch/preview\")")]
    [InlineData("HttpPost(\"batch/apply\")")]
    [InlineData("HttpGet(\"batch/status/{jobId}\")")]
    [InlineData("HttpPost(\"batch/cancel/{jobId}\")")]
    public void Controller_HasBatchEndpoint(string endpoint)
    {
        Assert.Contains(endpoint, ControllerSource);
    }

    // ─── Data Integrity ───────────────────────────────────────────────────────

    [Fact]
    public void Controller_UsesBentonCounty2025CostMatrix()
    {
        Assert.Contains("Benton County Assessor – Cost Matrix 2025", ControllerSource);
    }

    [Fact]
    public void Controller_HasAuditLogging()
    {
        Assert.Contains("_auditLogger.LogUserActionAsync", ControllerSource);
    }

    [Fact]
    public void Controller_HasCountyContextResolution()
    {
        Assert.Contains("ResolveCountyContextAsync", ControllerSource);
    }

    [Fact]
    public void Controller_HasCertifiedReferenceCheck()
    {
        Assert.Contains("CertifiedReferenceUnavailableIfNeeded", ControllerSource);
    }

    // ─── Static Data Classes ──────────────────────────────────────────────────

    [Fact]
    public void Controller_HasBentonCostDataClass()
    {
        Assert.Contains("internal static class BentonCostData", ControllerSource);
    }

    [Fact]
    public void Controller_HasBentonIncomeDataClass()
    {
        Assert.Contains("BentonIncomeData", ControllerSource);
    }

    [Fact]
    public void Controller_Has66CostMatrixEntries()
    {
        // 11 building types × 6 regions = 66
        Assert.Contains("11 building types × 6 Reval Areas = 66 matrix entries", ControllerSource);
    }
}
