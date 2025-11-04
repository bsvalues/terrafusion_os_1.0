/**
 * GovernmentComplianceController - REST API for Government Compliance
 *
 * Provides endpoints for compliance reporting, FISMA validation,
 * NIST controls checking, accessibility validation, and remediation planning.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 1 Day 3
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/compliance")]
    [Produces("application/json")]
    public class GovernmentComplianceController : ControllerBase
    {
        private readonly IGovernmentComplianceService _complianceService;
        private readonly ILogger<GovernmentComplianceController> _logger;

        public GovernmentComplianceController(
            IGovernmentComplianceService complianceService,
            ILogger<GovernmentComplianceController> logger)
        {
            _complianceService = complianceService;
            _logger = logger;
        }

        /// <summary>
        /// Generate comprehensive compliance report
        /// </summary>
        /// <param name="environment">Environment to validate</param>
        /// <returns>Complete compliance report</returns>
        [HttpGet("report/{environment}")]
        [ProducesResponseType(typeof(GovernmentComplianceReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetComplianceReport(string environment)
        {
            try
            {
                _logger.LogInformation("Generating compliance report for {Environment}", environment);

                var report = await _complianceService.GenerateComplianceReportAsync(environment);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating compliance report");
                return StatusCode(500, new { error = "Failed to generate compliance report" });
            }
        }

        /// <summary>
        /// Validate FISMA compliance
        /// </summary>
        /// <returns>FISMA compliance status</returns>
        [HttpGet("fisma")]
        [ProducesResponseType(typeof(FISMAComplianceStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> ValidateFISMA()
        {
            try
            {
                var status = await _complianceService.ValidateFISMAComplianceAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating FISMA compliance");
                return StatusCode(500, new { error = "Failed to validate FISMA compliance" });
            }
        }

        /// <summary>
        /// Validate NIST 800-53 controls
        /// </summary>
        /// <returns>NIST controls status</returns>
        [HttpGet("nist")]
        [ProducesResponseType(typeof(NISTControlsStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> ValidateNIST()
        {
            try
            {
                var status = await _complianceService.ValidateNISTControlsAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating NIST controls");
                return StatusCode(500, new { error = "Failed to validate NIST controls" });
            }
        }

        /// <summary>
        /// Validate accessibility compliance
        /// </summary>
        /// <returns>Accessibility compliance status</returns>
        [HttpGet("accessibility")]
        [ProducesResponseType(typeof(AccessibilityComplianceStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> ValidateAccessibility()
        {
            try
            {
                var status = await _complianceService.ValidateAccessibilityAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating accessibility");
                return StatusCode(500, new { error = "Failed to validate accessibility" });
            }
        }

        /// <summary>
        /// Get compliance violations
        /// </summary>
        /// <param name="severity">Filter by severity (optional)</param>
        /// <returns>List of violations</returns>
        [HttpGet("violations")]
        [ProducesResponseType(typeof(List<ComplianceViolation>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetViolations([FromQuery] string? severity = null)
        {
            try
            {
                var violations = await _complianceService.GetComplianceViolationsAsync(
                    severity ?? string.Empty);
                return Ok(violations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting compliance violations");
                return StatusCode(500, new { error = "Failed to get violations" });
            }
        }

        /// <summary>
        /// Generate remediation plan
        /// </summary>
        /// <param name="violations">Violations to remediate</param>
        /// <returns>Remediation plan</returns>
        [HttpPost("remediation")]
        [ProducesResponseType(typeof(RemediationPlan), StatusCodes.Status200OK)]
        public async Task<IActionResult> GenerateRemediationPlan(
            [FromBody] List<ComplianceViolation> violations)
        {
            try
            {
                var plan = await _complianceService.GenerateRemediationPlanAsync(violations);
                return Ok(plan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating remediation plan");
                return StatusCode(500, new { error = "Failed to generate remediation plan" });
            }
        }
    }
}
