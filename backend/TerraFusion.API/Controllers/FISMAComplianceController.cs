using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator,SecurityOfficer,ComplianceManager")]
    public class FISMAComplianceController : ControllerBase
    {
        private readonly IFISMAComplianceService _complianceService;
        private readonly ILogger<FISMAComplianceController> _logger;

        public FISMAComplianceController(
            IFISMAComplianceService complianceService,
            ILogger<FISMAComplianceController> logger)
        {
            _complianceService = complianceService;
            _logger = logger;
        }

        /// <summary>
        /// Get current FISMA compliance status
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<FISMAComplianceReport>> GetComplianceStatus()
        {
            try
            {
                var report = await _complianceService.GetComplianceStatusAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving FISMA compliance status");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Run comprehensive FISMA compliance assessment
        /// </summary>
        [HttpPost("assess")]
        public async Task<ActionResult<FISMAComplianceReport>> RunComplianceAssessment()
        {
            try
            {
                _logger.LogInformation("Starting FISMA compliance assessment");
                var report = await _complianceService.RunComplianceAssessmentAsync();

                _logger.LogInformation($"Assessment completed: {report.CompliancePercentage}% compliant");
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running FISMA compliance assessment");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get list of missing security controls
        /// </summary>
        [HttpGet("missing-controls")]
        public async Task<ActionResult<List<SecurityControl>>> GetMissingControls()
        {
            try
            {
                var missingControls = await _complianceService.GetMissingControlsAsync();
                return Ok(missingControls);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving missing controls");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Implement a specific security control
        /// </summary>
        [HttpPost("implement-control/{controlId}")]
        public async Task<ActionResult<bool>> ImplementControl(string controlId)
        {
            try
            {
                var success = await _complianceService.ImplementControlAsync(controlId);

                if (success)
                {
                    _logger.LogInformation($"Successfully implemented control: {controlId}");
                    return Ok(true);
                }
                else
                {
                    _logger.LogWarning($"Failed to implement control: {controlId}");
                    return BadRequest($"Failed to implement control: {controlId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error implementing control: {controlId}");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get detailed compliance metrics by control family
        /// </summary>
        [HttpGet("metrics")]
        public async Task<ActionResult<TerraFusion.Abstractions.DTOs.ComplianceMetrics>> GetComplianceMetrics()
        {
            try
            {
                var metrics = await _complianceService.GetComplianceMetricsAsync();
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance metrics");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Generate compliance improvement plan
        /// </summary>
        [HttpPost("improvement-plan")]
        public async Task<ActionResult<ComplianceImprovementPlan>> GenerateImprovementPlan(
            [FromBody] double targetCompliance = 95.0)
        {
            try
            {
                var currentReport = await _complianceService.GetComplianceStatusAsync();
                var missingControls = await _complianceService.GetMissingControlsAsync();

                var plan = new ComplianceImprovementPlan
                {
                    PlanId = Guid.NewGuid().ToString(),
                    CreatedDate = DateTime.UtcNow,
                    CurrentCompliance = currentReport.CompliancePercentage,
                    TargetCompliance = targetCompliance,
                    PriorityControls = missingControls.Where(c => c.Priority == "HIGH").ToList(),
                    Status = "DRAFT"
                };

                // Create implementation phases
                var highPriorityControls = missingControls.Where(c => c.Priority == "HIGH").ToList();
                var mediumPriorityControls = missingControls.Where(c => c.Priority == "MEDIUM").ToList();
                var lowPriorityControls = missingControls.Where(c => c.Priority == "LOW").ToList();

                plan.Phases = new List<ImplementationPhase>
                {
                    new ImplementationPhase
                    {
                        PhaseNumber = 1,
                        PhaseName = "Critical Controls Implementation",
                        ControlIds = highPriorityControls.Take(12).Select(c => c.ControlId).ToList(),
                        StartDate = DateTime.UtcNow.AddDays(1),
                        EndDate = DateTime.UtcNow.AddDays(14),
                        Status = "PLANNED",
                        ExpectedComplianceGain = 3.7
                    },
                    new ImplementationPhase
                    {
                        PhaseNumber = 2,
                        PhaseName = "Security Hardening",
                        ControlIds = mediumPriorityControls.Take(8).Select(c => c.ControlId).ToList(),
                        StartDate = DateTime.UtcNow.AddDays(15),
                        EndDate = DateTime.UtcNow.AddDays(28),
                        Status = "PLANNED",
                        ExpectedComplianceGain = 2.5
                    },
                    new ImplementationPhase
                    {
                        PhaseNumber = 3,
                        PhaseName = "Operational Excellence",
                        ControlIds = lowPriorityControls.Take(6).Select(c => c.ControlId).ToList(),
                        StartDate = DateTime.UtcNow.AddDays(29),
                        EndDate = DateTime.UtcNow.AddDays(42),
                        Status = "PLANNED",
                        ExpectedComplianceGain = 1.8
                    }
                };

                plan.TotalEstimatedHours = plan.PriorityControls.Sum(c => c.EstimatedEffortHours);
                plan.EstimatedCompletionDate = plan.Phases.Max(p => p.EndDate);

                return Ok(plan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating compliance improvement plan");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get compliance dashboard data
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<ActionResult<object>> GetComplianceDashboard()
        {
            try
            {
                var report = await _complianceService.GetComplianceStatusAsync();
                var metrics = await _complianceService.GetComplianceMetricsAsync();

                var dashboard = new
                {
                    OverallCompliance = report.CompliancePercentage,
                    Status = report.Status,
                    GovernmentReadiness = report.GovernmentReadiness,
                    ImplementedControls = report.ImplementedControls,
                    TotalControls = report.TotalControls,
                    HighPriorityGaps = report.HighPriorityGaps,
                    MediumPriorityGaps = report.MediumPriorityGaps,
                    LowPriorityGaps = report.LowPriorityGaps,
                    FamilyCompliance = new
                    {
                        AccessControl = metrics.AccessControlCompliance,
                        AuditAccountability = metrics.AuditAccountabilityCompliance,
                        SecurityAssessment = metrics.SecurityAssessmentCompliance,
                        ConfigurationManagement = metrics.ConfigurationManagementCompliance,
                        ContingencyPlanning = metrics.ContingencyPlanningCompliance,
                        IdentificationAuthentication = metrics.IdentificationAuthenticationCompliance,
                        IncidentResponse = metrics.IncidentResponseCompliance,
                        SystemCommunications = metrics.SystemCommunicationsCompliance
                    },
                    TrendData = metrics.TrendData,
                    RecommendedActions = report.RecommendedActions,
                    NextAssessmentDate = report.NextAssessmentDate,
                    LastUpdated = DateTime.UtcNow
                };

                return Ok(dashboard);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance dashboard");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Export compliance report
        /// </summary>
        [HttpGet("export")]
        public async Task<ActionResult> ExportComplianceReport([FromQuery] string format = "json")
        {
            try
            {
                var report = await _complianceService.GetComplianceStatusAsync();
                var metrics = await _complianceService.GetComplianceMetricsAsync();

                var exportData = new
                {
                    ExportDate = DateTime.UtcNow,
                    ComplianceReport = report,
                    DetailedMetrics = metrics,
                    SystemInfo = new
                    {
                        SystemName = "TerraFusion OS 1.0",
                        Version = "1.0.0",
                        Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
                    }
                };

                if (format.ToLower() == "json")
                {
                    return Ok(exportData);
                }
                else
                {
                    return BadRequest("Only JSON format is currently supported");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting compliance report");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
