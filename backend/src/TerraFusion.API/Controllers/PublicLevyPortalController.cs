using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-040: Public-facing levy information portal.
/// Provides unauthenticated access to property tax information,
/// district details, and tax estimates for citizens.
/// No PII is exposed; only publicly available levy and district data.
/// </summary>
[ApiController]
[Route("api/levy/public")]
public class PublicLevyPortalController : ControllerBase
{
    private readonly ILogger<PublicLevyPortalController> _logger;

    public PublicLevyPortalController(ILogger<PublicLevyPortalController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Retrieve public levy information for a specific parcel.
    /// Returns only publicly available tax data; no PII.
    /// </summary>
    [HttpGet("property/{parcelId}")]
    public IActionResult GetProperty(string parcelId)
    {
        _logger.LogInformation("LEV-040: Public property info requested for parcel {ParcelId}", parcelId);
        return Ok(new { status = "stub", parcelId, message = "Public property info not yet implemented." });
    }

    /// <summary>
    /// Retrieve public information about a tax district.
    /// </summary>
    [HttpGet("district-info")]
    public IActionResult GetDistrictInfo([FromQuery] string? districtId)
    {
        _logger.LogInformation("LEV-040: Public district info requested");
        return Ok(new { status = "stub", message = "Public district info not yet implemented." });
    }

    /// <summary>
    /// Estimate the tax for a given assessed value and district.
    /// </summary>
    [HttpGet("tax-estimate")]
    public IActionResult GetTaxEstimate([FromQuery] decimal? assessedValue, [FromQuery] string? districtId)
    {
        _logger.LogInformation("LEV-040: Tax estimate requested");
        return Ok(new { status = "stub", message = "Tax estimate not yet implemented." });
    }
}
