using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Abstractions.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ComplianceController : ControllerBase
    {
        private readonly ILogger<ComplianceController> _logger;
        private readonly IComplianceAutomationService _complianceService;

        public ComplianceController(
            ILogger<ComplianceController> logger,
            IComplianceAutomationService complianceService)
        {
            _logger = logger;
            _complianceService = complianceService;
        }

        /// <summary>
        /// Get compliance dashboard data
        /// </summary>
        [HttpGet("dashboard")]
        [Authorize(Roles = "Admin,ComplianceOfficer,SecurityOfficer")]
        public async Task<ActionResult<ComplianceDashboardData>> GetDashboard()
        {
            try
            {
                var dashboardData = await _complianceService.GetComplianceDashboardDataAsync();
                return Ok(dashboardData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance dashboard data");
                return StatusCode(500, new { error = "Failed to retrieve compliance dashboard data" });
            }
        }

        /// <summary>
        /// Generate compliance report for a specific framework
        /// </summary>
        [HttpPost("reports")]
        [Authorize(Roles = "Admin,ComplianceOfficer")]
        public async Task<ActionResult<ComplianceReport>> GenerateReport([FromBody] GenerateReportRequest request)
        {
            try
            {
                var report = await _complianceService.GenerateComplianceReportAsync(
                    request.Framework,
                    request.StartDate,
                    request.EndDate);

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating compliance report for {Framework}", request.Framework);
                return StatusCode(500, new { error = "Failed to generate compliance report" });
            }
        }

        /// <summary>
        /// Get audit trail with optional filtering
        /// </summary>
        [HttpGet("audit-trail")]
        [Authorize(Roles = "Admin,ComplianceOfficer,Auditor")]
        public async Task<ActionResult<List<AuditTrail>>> GetAuditTrail(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? userId = null)
        {
            try
            {
                var auditTrail = await _complianceService.GetAuditTrailAsync(startDate, endDate, userId);
                return Ok(auditTrail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit trail");
                return StatusCode(500, new { error = "Failed to retrieve audit trail" });
            }
        }

        /// <summary>
        /// Create audit trail entry
        /// </summary>
        [HttpPost("audit-trail")]
        [Authorize]
        public async Task<ActionResult<AuditTrail>> CreateAuditTrail([FromBody] CreateAuditTrailRequest request)
        {
            try
            {
                var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "ANONYMOUS";
                var auditTrail = await _complianceService.CreateAuditTrailAsync(
                    request.Action,
                    userId,
                    request.Data,
                    request.EntityType);

                return Ok(auditTrail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating audit trail for action: {Action}", request.Action);
                return StatusCode(500, new { error = "Failed to create audit trail" });
            }
        }

        /// <summary>
        /// Validate compliance for a specific framework
        /// </summary>
        [HttpGet("validate/{framework}")]
        [Authorize(Roles = "Admin,ComplianceOfficer")]
        public async Task<ActionResult<ComplianceStatus>> ValidateCompliance(ComplianceFramework framework)
        {
            try
            {
                var status = await _complianceService.ValidateComplianceAsync(framework);
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating compliance for {Framework}", framework);
                return StatusCode(500, new { error = "Failed to validate compliance" });
            }
        }

        /// <summary>
        /// Get compliance violations
        /// </summary>
        [HttpGet("violations")]
        [Authorize(Roles = "Admin,ComplianceOfficer,SecurityOfficer")]
        public async Task<ActionResult<List<ComplianceViolation>>> GetViolations(
            [FromQuery] ComplianceFramework framework = ComplianceFramework.All)
        {
            try
            {
                var violations = await _complianceService.GetComplianceViolationsAsync(framework);
                return Ok(violations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance violations");
                return StatusCode(500, new { error = "Failed to retrieve compliance violations" });
            }
        }

        /// <summary>
        /// Remediate a compliance violation
        /// </summary>
        [HttpPost("violations/{violationId}/remediate")]
        [Authorize(Roles = "Admin,ComplianceOfficer")]
        public async Task<ActionResult> RemediateViolation(string violationId, [FromBody] RemediateViolationRequest request)
        {
            try
            {
                var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "ANONYMOUS";
                var success = await _complianceService.RemediateViolationAsync(
                    violationId,
                    request.RemediationAction,
                    userId);

                if (success)
                {
                    return Ok(new { message = "Violation remediated successfully" });
                }
                else
                {
                    return StatusCode(500, new { error = "Failed to remediate violation" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error remediating violation {ViolationId}", violationId);
                return StatusCode(500, new { error = "Failed to remediate violation" });
            }
        }

        /// <summary>
        /// Get compliance controls for a framework
        /// </summary>
        [HttpGet("controls/{framework}")]
        [Authorize(Roles = "Admin,ComplianceOfficer")]
        public async Task<ActionResult<List<ComplianceControl>>> GetControls(ComplianceFramework framework)
        {
            try
            {
                var controls = await _complianceService.GetComplianceControlsAsync(framework);
                return Ok(controls);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance controls for {Framework}", framework);
                return StatusCode(500, new { error = "Failed to retrieve compliance controls" });
            }
        }

        /// <summary>
        /// Update compliance control status
        /// </summary>
        [HttpPut("controls/{controlId}")]
        [Authorize(Roles = "Admin,ComplianceOfficer")]
        public async Task<ActionResult> UpdateControl(string controlId, [FromBody] UpdateControlRequest request)
        {
            try
            {
                var success = await _complianceService.UpdateComplianceControlAsync(
                    controlId,
                    request.Status,
                    request.Evidence);

                if (success)
                {
                    return Ok(new { message = "Control updated successfully" });
                }
                else
                {
                    return StatusCode(500, new { error = "Failed to update control" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating compliance control {ControlId}", controlId);
                return StatusCode(500, new { error = "Failed to update control" });
            }
        }

        /// <summary>
        /// Schedule compliance report
        /// </summary>
        [HttpPost("reports/schedule")]
        [Authorize(Roles = "Admin,ComplianceOfficer")]
        public async Task<ActionResult> ScheduleReport([FromBody] ComplianceReportSchedule schedule)
        {
            try
            {
                var success = await _complianceService.ScheduleComplianceReportAsync(schedule);

                if (success)
                {
                    return Ok(new { message = "Report scheduled successfully" });
                }
                else
                {
                    return StatusCode(500, new { error = "Failed to schedule report" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling compliance report");
                return StatusCode(500, new { error = "Failed to schedule report" });
            }
        }
    }

    // Request DTOs
    public class GenerateReportRequest
    {
        public ComplianceFramework Framework { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class CreateAuditTrailRequest
    {
        public required string Action { get; set; }
        public required object Data { get; set; }
        public required string EntityType { get; set; }
    }

    public class RemediateViolationRequest
    {
        public required string RemediationAction { get; set; }
    }

    public class UpdateControlRequest
    {
        public ComplianceControlStatus Status { get; set; }
        public required string Evidence { get; set; }
    }
}
