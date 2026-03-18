using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-018: Levy export file management.
/// Handles upload, history tracking, and comparison of levy export files
/// from county assessment systems.
/// </summary>
[ApiController]
[Route("api/levy/export")]
[Authorize]
public class LevyExportController : ControllerBase
{
    private readonly ILogger<LevyExportController> _logger;

    public LevyExportController(ILogger<LevyExportController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Upload a levy export file for parsing and import.
    /// </summary>
    [HttpPost("upload")]
    public IActionResult Upload([FromForm] IFormFile? file)
    {
        _logger.LogInformation("LEV-018: Levy export file upload requested");
        return Ok(new { status = "stub", message = "Levy export upload not yet implemented." });
    }

    /// <summary>
    /// Retrieve the history of uploaded levy export files.
    /// </summary>
    [HttpGet("history")]
    public IActionResult GetHistory([FromQuery] int? year, [FromQuery] string? districtId)
    {
        _logger.LogInformation("LEV-018: Export history requested");
        return Ok(new { status = "stub", message = "Export history not yet implemented." });
    }

    /// <summary>
    /// Compare two levy export snapshots to identify changes.
    /// </summary>
    [HttpGet("compare")]
    public IActionResult Compare([FromQuery] string? exportIdA, [FromQuery] string? exportIdB)
    {
        _logger.LogInformation("LEV-018: Export comparison requested");
        return Ok(new { status = "stub", message = "Export comparison not yet implemented." });
    }
}
