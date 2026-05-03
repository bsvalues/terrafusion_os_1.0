using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-018: Levy export file management.
/// This surface previously returned fake stub success payloads. The backing
/// import/export snapshot schema and worker pipeline are still missing, so all
/// endpoints now return explicit governed unavailable responses that name the
/// blockers and available read-only alternatives.
/// </summary>
[ApiController]
[Route("api/levy/export")]
[Authorize]
public sealed class LevyExportController : ControllerBase
{
    private readonly ILogger<LevyExportController> _logger;

    public LevyExportController(ILogger<LevyExportController> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    private IActionResult NotImplementedYet(string operation, string blockedBy, params string[] useInstead)
    {
        _logger.LogInformation(
            "LEV-018: {Operation} requested but no governed export snapshot pipeline exists (blocked by {BlockedBy})",
            operation,
            blockedBy);

        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            success = false,
            error = "export_pipeline_unavailable",
            operation,
            blockedBy,
            useInstead,
        });
    }

    /// <summary>
    /// Upload a levy export file for parsing and import.
    /// </summary>
    [HttpPost("upload")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Upload([FromForm] IFormFile? file) =>
        NotImplementedYet(
            operation: "upload",
            blockedBy: "No ImportLog/ExportLog tables or governed import worker exist in TerraLevy.",
            useInstead: new[]
            {
                "GET /api/levy/certifications/export",
                "POST /api/levy/reports/generate",
                "GET /api/levy/dashboard/districts-overview",
            });

    /// <summary>
    /// Retrieve the history of uploaded levy export files.
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetHistory([FromQuery] int? year, [FromQuery] string? districtId) =>
        NotImplementedYet(
            operation: "history",
            blockedBy: "No persisted levy export snapshot history exists in the current schema.",
            useInstead: new[]
            {
                "GET /api/levy/reports/templates",
                "POST /api/levy/reports/generate",
                "GET /api/levy/audit/dashboard",
            });

    /// <summary>
    /// Compare two levy export snapshots to identify changes.
    /// </summary>
    [HttpGet("compare")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Compare([FromQuery] string? exportIdA, [FromQuery] string? exportIdB) =>
        NotImplementedYet(
            operation: "compare",
            blockedBy: "No export snapshot entity exists to compare exportIdA/exportIdB payloads.",
            useInstead: new[]
            {
                "GET /api/levy/dashboard/districts-overview",
                "GET /api/levy/calculator/rate-comparison/{districtId}",
                "GET /api/levy/forecast/compare",
            });
}
