using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-031: Tax strategy decision support.
/// Provides decision tree navigation, path analysis, and scenario modeling
/// for levy strategy planning.
/// </summary>
[ApiController]
[Route("api/levy/strategy")]
[Authorize]
public class TaxStrategyController : ControllerBase
{
    private readonly ILogger<TaxStrategyController> _logger;

    public TaxStrategyController(ILogger<TaxStrategyController> logger)
    {
        _logger = logger;
    }

    private IActionResult CompatibilityUnavailable(string operation, object? context = null)
    {
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            status = "unavailable",
            mode = "compatibility",
            operation,
            context,
            message = "The legacy tax-strategy route has no governed decision-tree or write contract. Use the live levy scenario and projection surfaces directly.",
            liveRoutes = new[]
            {
                "/levy/measures",
                "/levy/scenarios",
                "/levy/projections",
                "/levy/scenarios/analyze",
                "/levy/scenarios/compare",
                "/api/levy/budget/scenarios",
                "/api/levy/forecast/dashboard",
            },
        });
    }

    /// <summary>
    /// Retrieve the tax strategy decision tree for the current county context.
    /// </summary>
    [HttpGet("decision-tree")]
    public IActionResult GetDecisionTree([FromQuery] string? context)
    {
        _logger.LogInformation("LEV-031: Decision tree requested");
        return CompatibilityUnavailable("decision-tree", new { context });
    }

    /// <summary>
    /// Analyze a specific strategy path and its projected outcomes.
    /// </summary>
    [HttpGet("path-analysis")]
    public IActionResult GetPathAnalysis([FromQuery] string? pathId)
    {
        _logger.LogInformation("LEV-031: Path analysis requested");
        return CompatibilityUnavailable("path-analysis", new { pathId });
    }

    /// <summary>
    /// Create and evaluate a tax strategy scenario.
    /// </summary>
    [HttpPost("scenario")]
    public IActionResult CreateScenario([FromBody] object request)
    {
        _logger.LogInformation("LEV-031: Strategy scenario creation requested");
        return CompatibilityUnavailable("scenario", request);
    }
}
