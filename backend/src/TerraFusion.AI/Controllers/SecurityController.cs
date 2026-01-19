/*
 * SecurityController - REST API for Security and Compliance
 *
 * Provides endpoints for security status, compliance reporting, security events,
 * vulnerability assessments, access control reports, recommendations, and audit trails.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 3 Day 3
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/security")]
    [Produces("application/json")]
    public class SecurityController : ControllerBase
    {
        private readonly ISecurityComplianceService _securityService;
        private readonly ILogger<SecurityController> _logger;

        public SecurityController(
            ISecurityComplianceService securityService,
            ILogger<SecurityController> logger)
        {
            _securityService = securityService;
            _logger = logger;
        }

        /// <summary>
        /// Get security status
        /// </summary>
        /// <returns>Complete security status with score, compliance, and threat summary</returns>
        [HttpGet("status")]
        [ProducesResponseType(typeof(SecurityStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                var status = await _securityService.GetSecurityStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting security status");
                return StatusCode(500, new { error = "Failed to get security status" });
            }
        }

        /// <summary>
        /// Get compliance report
        /// </summary>
        /// <returns>NIST 800-53 and FISMA compliance report with control assessments</returns>
        [HttpGet("compliance")]
        [ProducesResponseType(typeof(ComplianceReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetComplianceReport()
        {
            try
            {
                var report = await _securityService.GetComplianceReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting compliance report");
                return StatusCode(500, new { error = "Failed to get compliance report" });
            }
        }

        /// <summary>
        /// Get security events
        /// </summary>
        /// <returns>Recent security events with severity and status</returns>
        [HttpGet("events")]
        [ProducesResponseType(typeof(SecurityEventsReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSecurityEvents()
        {
            try
            {
                var events = await _securityService.GetSecurityEventsAsync();
                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting security events");
                return StatusCode(500, new { error = "Failed to get security events" });
            }
        }

        /// <summary>
        /// Get vulnerability report
        /// </summary>
        /// <returns>Vulnerability assessment with CVSS scoring and remediation status</returns>
        [HttpGet("vulnerabilities")]
        [ProducesResponseType(typeof(VulnerabilityReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetVulnerabilities()
        {
            try
            {
                var report = await _securityService.GetVulnerabilitiesAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vulnerabilities");
                return StatusCode(500, new { error = "Failed to get vulnerabilities" });
            }
        }

        /// <summary>
        /// Get access control report
        /// </summary>
        /// <returns>Access control and authentication statistics</returns>
        [HttpGet("access-control")]
        [ProducesResponseType(typeof(AccessControlReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAccessControl()
        {
            try
            {
                var report = await _securityService.GetAccessControlReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting access control report");
                return StatusCode(500, new { error = "Failed to get access control report" });
            }
        }

        /// <summary>
        /// Get security recommendations
        /// </summary>
        /// <returns>Prioritized security recommendations with implementation steps</returns>
        [HttpGet("recommendations")]
        [ProducesResponseType(typeof(List<SecurityRecommendation>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRecommendations()
        {
            try
            {
                var recommendations = await _securityService.GetRecommendationsAsync();
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting security recommendations");
                return StatusCode(500, new { error = "Failed to get security recommendations" });
            }
        }

        /// <summary>
        /// Get audit trail
        /// </summary>
        /// <param name="limit">Maximum number of entries to return (default: 100)</param>
        /// <param name="filter">Optional filter criteria</param>
        /// <returns>Audit trail entries with event details</returns>
        [HttpGet("audit-trail")]
        [ProducesResponseType(typeof(AuditTrailReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAuditTrail([FromQuery] int limit = 100, [FromQuery] string? filter = null)
        {
            try
            {
                var report = await _securityService.GetAuditTrailAsync(limit, filter);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit trail");
                return StatusCode(500, new { error = "Failed to get audit trail" });
            }
        }

        /// <summary>
        /// Run security scan
        /// </summary>
        /// <param name="config">Security scan configuration</param>
        /// <returns>Security scan result with findings</returns>
        [HttpPost("scan")]
        [ProducesResponseType(typeof(SecurityScanResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> RunSecurityScan([FromBody] SecurityScanConfig config)
        {
            try
            {
                _logger.LogInformation("Running security scan: {ScanType}", config.ScanType);
                var result = await _securityService.RunSecurityScanAsync(config);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running security scan");
                return StatusCode(500, new { error = "Failed to run security scan" });
            }
        }

        /// <summary>
        /// Remediate vulnerability
        /// </summary>
        /// <param name="request">Remediation request with vulnerability ID and action</param>
        /// <returns>Remediation result with status</returns>
        [HttpPost("remediate")]
        [ProducesResponseType(typeof(RemediationResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> RemediateVulnerability([FromBody] RemediationRequest request)
        {
            try
            {
                _logger.LogInformation("Remediating vulnerability: {VulnerabilityId}", request.VulnerabilityId);
                var result = await _securityService.RemediateVulnerabilityAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error remediating vulnerability");
                return StatusCode(500, new { error = "Failed to remediate vulnerability" });
            }
        }
    }
}
