using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-026: Levy report generation and scheduling.
/// Provides report templates, on-demand generation, and scheduled report management.
/// </summary>
[ApiController]
[Route("api/levy/reports")]
[Authorize]
public class LevyReportController : ControllerBase
{
    private readonly ILogger<LevyReportController> _logger;

    public LevyReportController(ILogger<LevyReportController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// List available report templates for levy reporting.
    /// </summary>
    [HttpGet("templates")]
    public IActionResult GetTemplates()
    {
        _logger.LogInformation("LEV-026: Report templates requested");
        return Ok(new { status = "stub", message = "Report templates not yet implemented." });
    }

    /// <summary>
    /// Generate a levy report from a template with the specified parameters.
    /// </summary>
    [HttpPost("generate")]
    public IActionResult Generate([FromBody] object request)
    {
        _logger.LogInformation("LEV-026: Report generation requested");
        return Ok(new { status = "stub", message = "Report generation not yet implemented." });
    }

    /// <summary>
    /// Retrieve the list of scheduled reports and their status.
    /// </summary>
    [HttpGet("scheduled")]
    public IActionResult GetScheduled()
    {
        _logger.LogInformation("LEV-026: Scheduled reports requested");
        return Ok(new { status = "stub", message = "Scheduled reports not yet implemented." });
    }
}
