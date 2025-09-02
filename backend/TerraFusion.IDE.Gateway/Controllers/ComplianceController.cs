using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.IDE.Gateway.Services;
using TerraFusion.Core.Models.Compliance;
using TerraFusion.Core.Models.Security;
using System.Security.Claims;

namespace TerraFusion.IDE.Gateway.Controllers;

/// <summary>
/// Government compliance validation and security clearance management controller
/// Implements FISMA, NIST, Section 508, FedRAMP, and SOC 2 compliance frameworks
/// </summary>
[ApiController]
[Route("api/compliance")]
[Authorize]
public class ComplianceController : ControllerBase
{
    private readonly IComplianceValidationService _complianceService;
    private readonly ISecurityClearanceService _clearanceService;
    private readonly IGovernmentAuditService _auditService;
    private readonly IFISMAComplianceService _fismaService;
    private readonly INISTFrameworkService _nistService;
    private readonly IFedRAMPService _fedrampService;
    private readonly ILogger<ComplianceController> _logger;

    public ComplianceController(
        IComplianceValidationService complianceService,
        ISecurityClearanceService clearanceService,
        IGovernmentAuditService auditService,
        IFISMAComplianceService fismaService,
        INISTFrameworkService nistService,
        IFedRAMPService fedrampService,
        ILogger<ComplianceController> logger)
    {
        _complianceService = complianceService;
        _clearanceService = clearanceService;
        _auditService = auditService;
        _fismaService = fismaService;
        _nistService = nistService;
        _fedrampService = fedrampService;
        _logger = logger;
    }

    /// <summary>
    /// Get comprehensive compliance status across all government frameworks
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<ComplianceStatusResponse>> GetComplianceStatus()
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            
            // Validate security clearance
            var clearanceValidation = await _clearanceService.ValidateUserClearanceAsync(username);
            if (!clearanceValidation.IsValid)
            {
                return Forbid("Insufficient security clearance for compliance data access");
            }

            var complianceStatus = await _complianceService.GetComprehensiveComplianceStatusAsync();

            await _auditService.LogGovernmentAccess(
                "COMPLIANCE_STATUS_ACCESS",
                $"Compliance status accessed by user with {clearanceValidation.ClearanceLevel} clearance",
                username
            );

            return Ok(complianceStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve compliance status");
            return StatusCode(500, "Failed to retrieve compliance status");
        }
    }

    /// <summary>
    /// Run comprehensive compliance assessment across specified frameworks
    /// </summary>
    [HttpPost("assessment/run")]
    public async Task<ActionResult<ComplianceAssessmentResult>> RunComplianceAssessment(
        [FromBody] ComplianceAssessmentRequest request)
    {
        try
        {
            var username = User.Identity?.Name ?? "system";

            // Validate security clearance for assessment operations
            var clearanceValidation = await _clearanceService.ValidateUserClearanceAsync(username);
            if (clearanceValidation.ClearanceLevel < SecurityClearanceLevel.Secret)
            {
                return Forbid("SECRET clearance or higher required for compliance assessments");
            }

            var assessmentResult = await _complianceService.RunComprehensiveAssessmentAsync(request);

            await _auditService.LogGovernmentAccess(
                "COMPLIANCE_ASSESSMENT_EXECUTED",
                $"Compliance assessment run for frameworks: {string.Join(", ", request.Frameworks)} by {clearanceValidation.ClearanceLevel} cleared user",
                username
            );

            return Ok(assessmentResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to run compliance assessment");
            return StatusCode(500, "Failed to execute compliance assessment");
        }
    }

    /// <summary>
    /// Get FISMA compliance details and control status
    /// </summary>
    [HttpGet("fisma")]
    public async Task<ActionResult<FISMAComplianceReport>> GetFISMACompliance()
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            var fismaCompliance = await _fismaService.GetFISMAComplianceReportAsync();

            await _auditService.LogGovernmentAccess(
                "FISMA_COMPLIANCE_ACCESS",
                $"FISMA compliance data accessed - Score: {fismaCompliance.OverallScore}%",
                username
            );

            return Ok(fismaCompliance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve FISMA compliance data");
            return StatusCode(500, "Failed to retrieve FISMA compliance data");
        }
    }

    /// <summary>
    /// Get NIST SP 800-53 framework compliance status
    /// </summary>
    [HttpGet("nist")]
    public async Task<ActionResult<NISTComplianceReport>> GetNISTCompliance()
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            var nistCompliance = await _nistService.GetNISTFrameworkComplianceAsync();

            await _auditService.LogGovernmentAccess(
                "NIST_COMPLIANCE_ACCESS",
                $"NIST 800-53 compliance data accessed - {nistCompliance.ImplementedControls}/{nistCompliance.TotalControls} controls implemented",
                username
            );

            return Ok(nistCompliance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve NIST compliance data");
            return StatusCode(500, "Failed to retrieve NIST compliance data");
        }
    }

    /// <summary>
    /// Get Section 508 accessibility compliance status
    /// </summary>
    [HttpGet("section508")]
    public async Task<ActionResult<Section508ComplianceReport>> GetSection508Compliance()
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            var section508Compliance = await _complianceService.GetSection508ComplianceAsync();

            await _auditService.LogGovernmentAccess(
                "SECTION_508_COMPLIANCE_ACCESS",
                $"Section 508 accessibility compliance accessed - WCAG {section508Compliance.WCAGLevel} compliant",
                username
            );

            return Ok(section508Compliance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve Section 508 compliance data");
            return StatusCode(500, "Failed to retrieve Section 508 compliance data");
        }
    }

    /// <summary>
    /// Get FedRAMP authorization status and controls
    /// </summary>
    [HttpGet("fedramp")]
    public async Task<ActionResult<FedRAMPAuthorizationStatus>> GetFedRAMPStatus()
    {
        try
        {
            var username = User.Identity?.Name ?? "system";

            // FedRAMP data requires higher clearance
            var clearanceValidation = await _clearanceService.ValidateUserClearanceAsync(username);
            if (clearanceValidation.ClearanceLevel < SecurityClearanceLevel.Secret)
            {
                return Forbid("SECRET clearance required for FedRAMP authorization data");
            }

            var fedrampStatus = await _fedrampService.GetAuthorizationStatusAsync();

            await _auditService.LogGovernmentAccess(
                "FEDRAMP_STATUS_ACCESS",
                $"FedRAMP authorization status accessed - Status: {fedrampStatus.AuthorizationStatus}",
                username
            );

            return Ok(fedrampStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve FedRAMP status");
            return StatusCode(500, "Failed to retrieve FedRAMP authorization status");
        }
    }

    /// <summary>
    /// Get user's security clearance information
    /// </summary>
    [HttpGet("clearance")]
    public async Task<ActionResult<SecurityClearanceInfo>> GetSecurityClearance()
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            var clearanceInfo = await _clearanceService.GetUserClearanceInfoAsync(username);

            if (clearanceInfo == null)
            {
                return NotFound("Security clearance information not found");
            }

            await _auditService.LogGovernmentAccess(
                "SECURITY_CLEARANCE_QUERY",
                $"Security clearance information accessed - Level: {clearanceInfo.ClearanceLevel}",
                username
            );

            return Ok(clearanceInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve security clearance information");
            return StatusCode(500, "Failed to retrieve security clearance information");
        }
    }

    /// <summary>
    /// Generate comprehensive government compliance report
    /// </summary>
    [HttpPost("report/generate")]
    public async Task<ActionResult> GenerateComplianceReport([FromBody] ComplianceReportRequest request)
    {
        try
        {
            var username = User.Identity?.Name ?? "system";

            // Validate security clearance for report generation
            var clearanceValidation = await _clearanceService.ValidateUserClearanceAsync(username);
            if (clearanceValidation.ClearanceLevel < SecurityClearanceLevel.Confidential)
            {
                return Forbid("CONFIDENTIAL clearance or higher required for compliance report generation");
            }

            var report = await _complianceService.GenerateComprehensiveReportAsync(request);

            await _auditService.LogGovernmentAccess(
                "COMPLIANCE_REPORT_GENERATED",
                $"Government compliance report generated - Type: {request.ReportType}, Classification: {request.Classification}",
                username
            );

            return File(report.Content, "application/pdf", report.FileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate compliance report");
            return StatusCode(500, "Failed to generate compliance report");
        }
    }

    /// <summary>
    /// Validate specific compliance control implementation
    /// </summary>
    [HttpPost("control/validate")]
    public async Task<ActionResult<ControlValidationResult>> ValidateControl([FromBody] ControlValidationRequest request)
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            var validationResult = await _complianceService.ValidateControlImplementationAsync(request);

            await _auditService.LogGovernmentAccess(
                "CONTROL_VALIDATION",
                $"Control validation performed - Framework: {request.Framework}, Control: {request.ControlId}, Status: {validationResult.Status}",
                username
            );

            return Ok(validationResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate compliance control");
            return StatusCode(500, "Failed to validate compliance control");
        }
    }

    /// <summary>
    /// Submit compliance finding remediation
    /// </summary>
    [HttpPost("finding/{findingId}/remediate")]
    public async Task<ActionResult<RemediationResult>> SubmitRemediation(string findingId, [FromBody] RemediationSubmission remediation)
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            
            var remediationResult = await _complianceService.SubmitFindingRemediationAsync(findingId, remediation, username);

            await _auditService.LogGovernmentAccess(
                "COMPLIANCE_REMEDIATION_SUBMITTED",
                $"Finding remediation submitted - Finding: {findingId}, Status: {remediationResult.Status}",
                username
            );

            return Ok(remediationResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to submit compliance remediation");
            return StatusCode(500, "Failed to submit compliance remediation");
        }
    }

    /// <summary>
    /// Get compliance metrics for dashboard display
    /// </summary>
    [HttpGet("metrics")]
    public async Task<ActionResult<ComplianceMetrics>> GetComplianceMetrics()
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            var metrics = await _complianceService.GetComplianceMetricsAsync();

            await _auditService.LogGovernmentAccess(
                "COMPLIANCE_METRICS_ACCESS",
                $"Compliance metrics accessed - Overall Score: {metrics.OverallComplianceScore}%",
                username
            );

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve compliance metrics");
            return StatusCode(500, "Failed to retrieve compliance metrics");
        }
    }

    /// <summary>
    /// Schedule automated compliance assessment
    /// </summary>
    [HttpPost("assessment/schedule")]
    public async Task<ActionResult<ScheduledAssessmentResult>> ScheduleAssessment([FromBody] ScheduledAssessmentRequest request)
    {
        try
        {
            var username = User.Identity?.Name ?? "system";

            // Validate security clearance for scheduling assessments
            var clearanceValidation = await _clearanceService.ValidateUserClearanceAsync(username);
            if (clearanceValidation.ClearanceLevel < SecurityClearanceLevel.Secret)
            {
                return Forbid("SECRET clearance required for scheduling compliance assessments");
            }

            var scheduledResult = await _complianceService.ScheduleAutomatedAssessmentAsync(request);

            await _auditService.LogGovernmentAccess(
                "COMPLIANCE_ASSESSMENT_SCHEDULED",
                $"Automated assessment scheduled - Frameworks: {string.Join(", ", request.Frameworks)}, Schedule: {request.CronExpression}",
                username
            );

            return Ok(scheduledResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to schedule compliance assessment");
            return StatusCode(500, "Failed to schedule compliance assessment");
        }
    }

    /// <summary>
    /// Get compliance trend analysis
    /// </summary>
    [HttpGet("trends")]
    public async Task<ActionResult<ComplianceTrendAnalysis>> GetComplianceTrends([FromQuery] int days = 90)
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            var trendAnalysis = await _complianceService.GetComplianceTrendAnalysisAsync(days);

            await _auditService.LogGovernmentAccess(
                "COMPLIANCE_TRENDS_ACCESS",
                $"Compliance trend analysis accessed - Period: {days} days",
                username
            );

            return Ok(trendAnalysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve compliance trends");
            return StatusCode(500, "Failed to retrieve compliance trends");
        }
    }

    /// <summary>
    /// Export compliance data for external audit
    /// </summary>
    [HttpPost("export/audit")]
    public async Task<ActionResult> ExportForAudit([FromBody] AuditExportRequest request)
    {
        try
        {
            var username = User.Identity?.Name ?? "system";

            // High-level clearance required for audit exports
            var clearanceValidation = await _clearanceService.ValidateUserClearanceAsync(username);
            if (clearanceValidation.ClearanceLevel < SecurityClearanceLevel.TopSecret)
            {
                return Forbid("TOP SECRET clearance required for audit data export");
            }

            var exportData = await _complianceService.ExportComplianceDataForAuditAsync(request);

            await _auditService.LogGovernmentAccess(
                "COMPLIANCE_AUDIT_EXPORT",
                $"Compliance data exported for external audit - Auditor: {request.AuditorName}, Classification: {request.Classification}",
                username
            );

            return File(exportData.Data, exportData.ContentType, exportData.FileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to export compliance data for audit");
            return StatusCode(500, "Failed to export compliance data for audit");
        }
    }

    /// <summary>
    /// Validate government system readiness for deployment
    /// </summary>
    [HttpPost("deployment/validate")]
    public async Task<ActionResult<DeploymentReadinessResult>> ValidateDeploymentReadiness([FromBody] DeploymentValidationRequest request)
    {
        try
        {
            var username = User.Identity?.Name ?? "system";
            var readinessResult = await _complianceService.ValidateGovernmentDeploymentReadinessAsync(request);

            await _auditService.LogGovernmentAccess(
                "DEPLOYMENT_READINESS_VALIDATION",
                $"Government deployment readiness validated - Environment: {request.Environment}, Readiness: {readinessResult.IsReady}",
                username
            );

            return Ok(readinessResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate deployment readiness");
            return StatusCode(500, "Failed to validate deployment readiness");
        }
    }
}