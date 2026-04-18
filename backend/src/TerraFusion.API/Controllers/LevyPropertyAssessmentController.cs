using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Levy.Services;

// File-scoped aliases: the TerraFusion.API.Controllers namespace has existing
// DTOs with the same simple names (e.g. WorkflowExecutionRequest) from other
// controllers. Aliasing keeps the Levy port contract explicit and unambiguous.
using LevyPropertyValidationRequest = TerraFusion.Levy.Services.PropertyValidationRequest;
using LevyPropertyValidationResult = TerraFusion.Levy.Services.PropertyValidationResult;
using LevyPropertyValuationRequest = TerraFusion.Levy.Services.PropertyValuationRequest;
using LevyPropertyValuationResult = TerraFusion.Levy.Services.PropertyValuationResult;
using LevyComplianceVerificationRequest = TerraFusion.Levy.Services.ComplianceVerificationRequest;
using LevyComplianceVerificationResult = TerraFusion.Levy.Services.ComplianceVerificationResult;
using LevyWorkflowExecutionRequest = TerraFusion.Levy.Services.WorkflowExecutionRequest;
using LevyWorkflowExecutionResult = TerraFusion.Levy.Services.WorkflowExecutionResult;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraLevy Phase 2 — port of BCBSLevy <c>routes_property_assessment.py</c>.
///
/// Canonical surface: <c>/api/levy/v1/property-assessment/*</c>.
/// This controller is deliberately distinct from <see cref="PropertyAssessmentController"/>,
/// which exposes the top-level CAMA assessment record. This surface mirrors the
/// levy-scoped validation / valuation / compliance / workflow agent calls the
/// Flask system published under <c>/assessment/api/*</c>.
///
/// Evidence contract: Flask <c>/api/validate-property</c>, <c>/api/calculate-value</c>,
/// <c>/api/verify-compliance</c>, <c>/api/execute-workflow</c> in
/// <c>packages/terra-levy/backend/routes_property_assessment.py</c>.
/// </summary>
[ApiController]
[Route("api/levy/v1/property-assessment")]
[Authorize]
public class LevyPropertyAssessmentController : ControllerBase
{
    private readonly ILevyPropertyAssessmentService _service;
    private readonly ILogger<LevyPropertyAssessmentController> _logger;

    public LevyPropertyAssessmentController(
        ILevyPropertyAssessmentService service,
        ILogger<LevyPropertyAssessmentController> logger)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>Validate property data structure and completeness.</summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(LevyPropertyValidationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Validate(
        [FromBody] LevyPropertyValidationRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest(new { error = "Invalid request data" });
        }

        try
        {
            var result = await _service.ValidatePropertyAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validate rejected: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Calculate property value by valuation method.</summary>
    [HttpPost("calculate-value")]
    [ProducesResponseType(typeof(LevyPropertyValuationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CalculateValue(
        [FromBody] LevyPropertyValuationRequest request,
        CancellationToken cancellationToken)
    {
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
            _logger.LogWarning(ex, "CalculateValue rejected: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Verify regulatory compliance for a district.</summary>
    [HttpPost("verify-compliance")]
    [ProducesResponseType(typeof(LevyComplianceVerificationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyCompliance(
        [FromBody] LevyComplianceVerificationRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.DistrictId))
        {
            return BadRequest(new { error = "district_id is required" });
        }

        try
        {
            var result = await _service.VerifyComplianceAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "VerifyCompliance rejected: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Execute an assessment workflow across a batch of properties.</summary>
    [HttpPost("execute-workflow")]
    [ProducesResponseType(typeof(LevyWorkflowExecutionResult), StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExecuteWorkflow(
        [FromBody] LevyWorkflowExecutionRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.WorkflowType))
        {
            return BadRequest(new { error = "workflow_type is required" });
        }

        if (request.Properties is null || request.Properties.Count == 0)
        {
            return BadRequest(new { error = "properties list is required" });
        }

        try
        {
            var result = await _service.ExecuteWorkflowAsync(request, cancellationToken);
            return Accepted(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "ExecuteWorkflow rejected: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
    }
}
