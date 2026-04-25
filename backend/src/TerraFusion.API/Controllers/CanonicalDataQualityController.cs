/*
 * CanonicalDataQualityController
 *
 * Track 4 canonical data-quality endpoint. Returns structured
 * DataQualityIssueDto[] from CamaDataQualityService (8 canonical checks).
 *
 * The legacy /api/costforge/analytics/data-quality/assess endpoint on
 * CostForgeController and the /api/dataquality/report endpoint on
 * DataQualityController are preserved; this new endpoint is the v2 surface.
 *
 * @version 1.0.0 - Track 4 (CostForge Benton Method v2)
 */

using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/costforge/data-quality")]
public class CanonicalDataQualityController : ControllerBase
{
    private readonly ICamaDataQualityService _dq;
    private readonly ILogger<CanonicalDataQualityController> _logger;

    public CanonicalDataQualityController(
        ICamaDataQualityService dq,
        ILogger<CanonicalDataQualityController> logger)
    {
        _dq = dq;
        _logger = logger;
    }

    /// <summary>
    /// Run all 8 canonical data-quality checks and return structured issues.
    /// </summary>
    [HttpGet("canonical")]
    public async Task<IActionResult> GetCanonicalChecks(
        [FromQuery] Guid countyId,
        [FromQuery] int taxYear,
        CancellationToken ct)
    {
        if (countyId == Guid.Empty)
            return BadRequest(new { error = "countyId is required" });
        if (taxYear < 2000 || taxYear > 2100)
            return BadRequest(new { error = "taxYear must be between 2000 and 2100" });

        try
        {
            var result = await _dq.AssessAsync(countyId, taxYear, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "CanonicalDataQualityController.GetCanonicalChecks failed: countyId={CountyId} taxYear={TaxYear}",
                countyId, taxYear);
            return StatusCode(500, new { error = "data-quality assessment failed", detail = ex.Message });
        }
    }
}
