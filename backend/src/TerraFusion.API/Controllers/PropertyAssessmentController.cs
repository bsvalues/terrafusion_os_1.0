using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using TerraFusion.Levy.Services;

using LevyComplianceVerificationRequest = TerraFusion.Levy.Services.ComplianceVerificationRequest;
using LevyPropertyValidationRequest = TerraFusion.Levy.Services.PropertyValidationRequest;
using LevyPropertyValuationRequest = TerraFusion.Levy.Services.PropertyValuationRequest;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-028: Property assessment validation and valuation for levy purposes.
/// Handles assessment validation, valuation calculations, and compliance checking.
/// Statutory authority: RCW 84.40 (listing of property), RCW 84.41 (revaluation).
/// </summary>
[ApiController]
[Route("api/levy/assessment")]
[Authorize]
public class PropertyAssessmentController : ControllerBase
{
    private readonly ILogger<PropertyAssessmentController> _logger;
    private readonly ILevyPropertyAssessmentService _service;

    public PropertyAssessmentController(
        ILogger<PropertyAssessmentController> logger,
        ILevyPropertyAssessmentService service)
    {
        _logger = logger;
        _service = service;
    }

    /// <summary>
    /// Validate assessment data for a set of parcels against levy requirements.
    /// </summary>
    [HttpPost("validate")]
    public async Task<IActionResult> Validate(
        [FromBody] LevyPropertyValidationRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("LEV-028: Assessment validation requested");

        if (request is null)
        {
            return BadRequest(new { error = "request body is required" });
        }

        try
        {
            var result = await _service.ValidatePropertyAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "LEV-028: Assessment validation rejected: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Perform a valuation calculation for levy impact analysis.
    /// </summary>
    [HttpPost("valuate")]
    public async Task<IActionResult> Valuate(
        [FromBody] LevyPropertyValuationRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("LEV-028: Valuation calculation requested");

        if (request is null || string.IsNullOrWhiteSpace(request.PropertyId))
        {
            return BadRequest(new { error = "property_id is required" });
        }

        try
        {
            var result = await _service.CalculateValueAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "LEV-028: Valuation calculation rejected: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Check levy compliance status for a specific parcel.
    /// </summary>
    [HttpGet("compliance/{parcelId}")]
    public IActionResult GetCompliance(string parcelId)
    {
        _logger.LogInformation("LEV-028: Compliance check requested for parcel {ParcelId}", parcelId);
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            status = "unavailable",
            mode = "compatibility",
            parcelId,
            message = "Parcel-scoped levy compliance is not backed on this legacy route. Use the governed district-level or levy-measure compliance surfaces instead.",
            liveRoutes = new[]
            {
                "/api/levy/v1/property-assessment/verify-compliance",
                "/levy/measures/{id}/compliance",
            },
            requestContract = new LevyComplianceVerificationRequest
            {
                DistrictId = string.Empty,
                AssessmentYear = DateTime.UtcNow.Year,
                ComplianceArea = "all",
            },
        });
    }
}
