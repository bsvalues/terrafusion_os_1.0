using FluentAssertions;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// File-based contract tests for the Sales audit and review controllers.
/// Validates the API contract by scanning controller source files.
/// </summary>
public class SalesAuditControllerTests
{
    private static readonly string AuditSource;
    private static readonly string RatioStudySource;
    private static readonly string ReviewQueueSource;
    private static readonly string PipelineSource;

    static SalesAuditControllerTests()
    {
        var testDir = AppDomain.CurrentDomain.BaseDirectory;
        var repoRoot = Path.GetFullPath(Path.Combine(testDir, "..", "..", "..", "..", ".."));
        var controllersDir = Path.Combine(repoRoot, "src", "TerraFusion.API", "Controllers");

        AuditSource = File.ReadAllText(Path.Combine(controllersDir, "SalesAuditController.cs"));
        RatioStudySource = File.ReadAllText(Path.Combine(controllersDir, "SalesRatioStudyController.cs"));
        ReviewQueueSource = File.ReadAllText(Path.Combine(controllersDir, "SalesReviewQueueController.cs"));
        PipelineSource = File.ReadAllText(Path.Combine(controllersDir, "SalesPipelineController.cs"));
    }

    // ─── SalesAuditController ─────────────────────────────────────────────────

    [Fact]
    public void SalesAudit_IsApiController()
    {
        AuditSource.Should().Contain("[ApiController]");
    }

    [Fact]
    public void SalesAudit_HasRouteAttribute()
    {
        AuditSource.Should().Contain("[Route(");
    }

    [Fact]
    public void SalesAudit_HasAuditEndpoints()
    {
        AuditSource.Should().ContainAny("HttpGet", "HttpPost");
    }

    // ─── SalesRatioStudyController ────────────────────────────────────────────

    [Fact]
    public void SalesRatioStudy_IsApiController()
    {
        RatioStudySource.Should().Contain("[ApiController]");
    }

    [Fact]
    public void SalesRatioStudy_HasRouteAttribute()
    {
        RatioStudySource.Should().Contain("[Route(");
    }

    // ─── SalesReviewQueueController ───────────────────────────────────────────

    [Fact]
    public void SalesReviewQueue_IsApiController()
    {
        ReviewQueueSource.Should().Contain("[ApiController]");
    }

    [Fact]
    public void SalesReviewQueue_HasRouteAttribute()
    {
        ReviewQueueSource.Should().Contain("[Route(");
    }

    // ─── SalesPipelineController ──────────────────────────────────────────────

    [Fact]
    public void SalesPipeline_IsApiController()
    {
        PipelineSource.Should().Contain("[ApiController]");
    }

    [Fact]
    public void SalesPipeline_HasRouteAttribute()
    {
        PipelineSource.Should().Contain("[Route(");
    }
}
