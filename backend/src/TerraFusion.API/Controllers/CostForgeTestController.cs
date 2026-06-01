using Microsoft.AspNetCore.Mvc;

#if DEBUG
namespace TerraFusion.API.Controllers;

/// <summary>
/// Development-only test endpoints for CostForge integration.
/// This controller is compiled only in DEBUG builds.
/// </summary>
[ApiController]
[Route("api/costforge-test")]
public class CostForgeTestController : ControllerBase
{
    private readonly ILogger<CostForgeTestController> _logger;

    public CostForgeTestController(ILogger<CostForgeTestController> logger)
    {
        _logger = logger;
    }

    private ObjectResult Unavailable(string surface)
    {
        _logger.LogWarning("CostForge development surface requested: {Surface}", surface);
        return StatusCode(StatusCodes.Status503ServiceUnavailable, new
        {
            success = false,
            code = "COSTFORGE_TEST_SURFACE_UNAVAILABLE",
            message = "CostForge development endpoints do not expose governed operational data in this environment.",
            surface,
            generated = false
        });
    }

    /// <summary>
    /// Development system status endpoint for CostForgeIntegrationPanel.
    /// </summary>
    [HttpGet("status")]
    public ActionResult GetSystemStatus()
    {
        return Unavailable("status");
    }

    /// <summary>
    /// Development performance metrics endpoint.
    /// </summary>
    [HttpGet("metrics")]
    public ActionResult GetPerformanceMetrics()
    {
        return Unavailable("metrics");
    }

    /// <summary>
    /// Development AI agent status endpoint.
    /// </summary>
    [HttpGet("agents/status")]
    public ActionResult GetAIAgentStatus()
    {
        return Unavailable("agents/status");
    }

    /// <summary>
    /// Development scale agents endpoint.
    /// </summary>
    [HttpPost("agents/scale")]
    public ActionResult ScaleAIAgents([FromBody] TestScaleAgentsRequest request)
    {
        return Unavailable("agents/scale");
    }

    /// <summary>
    /// Development source-ingestion status endpoint.
    /// </summary>
    [HttpPost("sync/source-status")]
    public ActionResult SyncWithHarrisPACS([FromBody] TestHarrisSyncRequest request)
    {
        return Unavailable("sync/source-status");
    }

    /// <summary>
    /// Development property cost calculation endpoint.
    /// </summary>
    [HttpPost("calculate")]
    public ActionResult CalculatePropertyCost([FromBody] TestPropertyCostRequest request)
    {
        return Unavailable("calculate");
    }
}

/// <summary>
/// Request DTOs for test endpoints
/// </summary>
public class TestScaleAgentsRequest
{
    public int TargetCount { get; set; }
}

public class TestHarrisSyncRequest
{
    public string? CountyId { get; set; }
    public string? SyncType { get; set; }
    public DateTime? LastSyncDate { get; set; }
    public List<string>? PropertyTypes { get; set; }
}

public class TestPropertyCostRequest
{
    public decimal? PropertyValue { get; set; }
    public string? County { get; set; }
    public bool TestMode { get; set; } = true;
}
#endif
