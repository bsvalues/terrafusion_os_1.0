using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-023: Levy data management operations.
/// Ports a subset of <c>routes_data_management.py</c> (15 Flask routes) — currently
/// PARTIAL_BLOCKED. See <c>docs/levy/port-audit/gap-matrix.md</c> for the per-route status.
/// <para>
/// Until unblocked, every endpoint here returns <c>501 Not Implemented</c> with a
/// structured payload that names the missing dependency. We refuse to return fake
/// success bodies — that would lie to callers and the React shell.
/// </para>
/// <para>Unblock conditions:</para>
/// <list type="bullet">
///   <item><description><b>Districts list/detail</b>: <c>LevyDbContext</c> currently marked TEMPORARY STUB; needs real implementation before wiring <c>Districts</c> queries.</description></item>
///   <item><description><b>Tax codes</b>: no <c>TaxCode</c> entity exists in the .NET schema; needs migration.</description></item>
///   <item><description><b>Import / Export / history / preview</b>: no <c>ImportLog</c> / <c>ExportLog</c> entities and no port of <c>utils/import_utils.py</c> + <c>utils/district_utils.py</c>.</description></item>
/// </list>
/// </summary>
[ApiController]
[Route("api/levy/data")]
[Authorize]
public class LevyDataManagementController : ControllerBase
{
    private readonly ILogger<LevyDataManagementController> _logger;

    public LevyDataManagementController(ILogger<LevyDataManagementController> logger)
    {
        _logger = logger;
    }

    private IActionResult NotImplementedYet(string operation, string blockedBy)
    {
        _logger.LogInformation(
            "LEV-023: {Operation} requested but not yet implemented (blocked by {BlockedBy})",
            operation, blockedBy);
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            success = false,
            error = "not_implemented",
            operation,
            blockedBy,
            tracker = "docs/levy/port-audit/gap-matrix.md (routes_data_management.py)",
        });
    }

    /// <summary>Import levy data from an uploaded file.</summary>
    [HttpPost("import")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Import([FromForm] IFormFile? file, [FromQuery] string? format) =>
        NotImplementedYet("import", "ImportLog entity + utils/import_utils.py port");

    /// <summary>Export levy data for the current county.</summary>
    [HttpGet("export")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Export([FromQuery] string? format, [FromQuery] int? year) =>
        NotImplementedYet("export", "ExportLog entity + export utility port");

    /// <summary>List all tax districts for the current county.</summary>
    [HttpGet("districts")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetDistricts([FromQuery] string? search) =>
        NotImplementedYet("districts.list", "LevyDbContext (currently TEMPORARY STUB)");

    /// <summary>List all tax codes for the current county.</summary>
    [HttpGet("tax-codes")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTaxCodes([FromQuery] string? districtId) =>
        NotImplementedYet("tax-codes.list", "TaxCode entity (no .NET schema)");
}
