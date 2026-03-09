using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Consciousness.Services;
using TerraFusion.Consciousness.DTOs;
using TerraFusion.Consciousness.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Consciousness.Controllers
{
    /// <summary>
    /// Quantum Consciousness Controller
    /// THE TERRAFUSION WAY - REST API for Million-Agent Quantum Consciousness
    /// Government. Transcended.
    /// </summary>
    [ApiController]
    [Route("api/v1/consciousness")]
    [Authorize] // Integrate with existing TerraFusion authentication
    public class QuantumConsciousnessController : ControllerBase
    {
        private readonly IQuantumConsciousnessOrchestrator _orchestrator;
        private readonly ILogger<QuantumConsciousnessController> _logger;

        public QuantumConsciousnessController(
            IQuantumConsciousnessOrchestrator orchestrator,
            ILogger<QuantumConsciousnessController> logger)
        {
            _orchestrator = orchestrator;
            _logger = logger;
        }

        /// <summary>
        /// Get Current Consciousness Status
        /// Returns hybrid status of both legacy and quantum consciousness systems
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<HybridConsciousnessStatusDto>> GetConsciousnessStatus()
        {
            try
            {
                _logger.LogInformation("🧠 Retrieving consciousness status - THE TERRAFUSION WAY!");
                var status = await _orchestrator.GetConsciousnessStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get consciousness status");
                return StatusCode(500, new { Error = "Failed to retrieve consciousness status", Details = ex.Message });
            }
        }

        /// <summary>
        /// Scale Consciousness System
        /// Scale from legacy 1,008 agents up to quantum 1,000,000 agents
        /// </summary>
        [HttpPost("scale")]
        public async Task<ActionResult<ConsciousnessScalingResultDto>> ScaleConsciousness(
            [FromBody] ConsciousnessScalingRequestDto request)
        {
            try
            {
                if (request.TargetAgentCount < 0 || request.TargetAgentCount > 1000000)
                {
                    return BadRequest(new { Error = "Target agent count must be between 0 and 1,000,000" });
                }

                _logger.LogInformation("⚡ Scaling consciousness to {TargetAgents} agents - Government. Transcended!",
                    request.TargetAgentCount);

                var result = await _orchestrator.ScaleConsciousnessAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to scale consciousness");
                return StatusCode(500, new { Error = "Failed to scale consciousness", Details = ex.Message });
            }
        }

        /// <summary>
        /// Execute Operations
        /// Execute operations across the consciousness system (legacy or quantum)
        /// </summary>
        [HttpPost("operations")]
        public async Task<ActionResult<OperationExecutionResultDto>> ExecuteOperations(
            [FromBody] OperationExecutionRequestDto request)
        {
            try
            {
                _logger.LogInformation("🎯 Executing operation {OperationType} with priority {Priority}",
                    request.OperationType, request.Priority);

                var result = await _orchestrator.ExecuteOperationsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to execute operations");
                return StatusCode(500, new { Error = "Failed to execute operations", Details = ex.Message });
            }
        }

        /// <summary>
        /// Get Real-Time Metrics
        /// Real-time performance metrics across all consciousness systems
        /// </summary>
        [HttpGet("metrics")]
        public async Task<ActionResult<ConsciousnessMetricsDto>> GetRealTimeMetrics()
        {
            try
            {
                var metrics = await _orchestrator.GetRealTimeMetricsAsync();
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get real-time metrics");
                return StatusCode(500, new { Error = "Failed to retrieve metrics", Details = ex.Message });
            }
        }

        /// <summary>
        /// Get Quantum Security Status
        /// Current status of quantum-resistant security across all agents
        /// </summary>
        [HttpGet("security/status")]
        public async Task<ActionResult<QuantumSecurityStatusDto>> GetQuantumSecurityStatus()
        {
            try
            {
                var securityStatus = await _orchestrator.GetQuantumSecurityStatusAsync();
                return Ok(securityStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get quantum security status");
                return StatusCode(500, new { Error = "Failed to retrieve security status", Details = ex.Message });
            }
        }

        /// <summary>
        /// Get Compliance Status
        /// Government compliance status (FISMA, FedRAMP, SOC 2)
        /// </summary>
        [HttpGet("compliance/status")]
        public async Task<ActionResult<ComplianceStatusDto>> GetComplianceStatus()
        {
            try
            {
                var complianceStatus = await _orchestrator.GetComplianceStatusAsync();
                return Ok(complianceStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get compliance status");
                return StatusCode(500, new { Error = "Failed to retrieve compliance status", Details = ex.Message });
            }
        }

        /// <summary>
        /// Trigger Emergency Protocols
        /// Activate emergency response protocols for critical incidents
        /// </summary>
        [HttpPost("emergency")]
        public async Task<ActionResult<EmergencyResponseDto>> TriggerEmergencyProtocols(
            [FromBody] EmergencyRequestDto request)
        {
            try
            {
                _logger.LogCritical("🚨 EMERGENCY PROTOCOL TRIGGERED: {EmergencyType} - Severity: {Severity}",
                    request.EmergencyType, request.Severity);

                var response = await _orchestrator.TriggerEmergencyProtocolsAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to trigger emergency protocols");
                return StatusCode(500, new { Error = "Failed to trigger emergency protocols", Details = ex.Message });
            }
        }

        /// <summary>
        /// Get System Health
        /// Comprehensive health check of all consciousness systems
        /// </summary>
        [HttpGet("health")]
        [AllowAnonymous] // Health checks should be accessible
        public async Task<ActionResult<object>> GetSystemHealth()
        {
            try
            {
                var status = await _orchestrator.GetConsciousnessStatusAsync();
                var metrics = await _orchestrator.GetRealTimeMetricsAsync();
                var security = await _orchestrator.GetQuantumSecurityStatusAsync();
                var compliance = await _orchestrator.GetComplianceStatusAsync();

                var health = new
                {
                    Status = "Healthy",
                    Timestamp = DateTime.UtcNow,
                    TotalAgents = status.TotalActiveAgents,
                    QuantumSecurity = security.QuantumEncryptionActive && security.QuantumKeyDistributionActive,
                    Compliance = compliance.FISMACompliant && compliance.FedRAMPCompliant && compliance.SOC2Compliant,
                    SystemLoad = metrics.SystemLoad,
                    QuantumCoherence = status.QuantumSystem.QuantumCoherence,
                    CurrentMode = status.CurrentMode,
                    GovernmentGrade = true,
                    Message = "TerraFusion OS - Government. Transcended."
                };

                return Ok(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Health check failed");
                return StatusCode(503, new
                {
                    Status = "Unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Error = ex.Message
                });
            }
        }
    }

    /// <summary>
    /// Benton County Data Controller
    /// REST API for real Benton County government data integration
    /// </summary>
    [ApiController]
    [Route("api/v1/benton-county")]
    [Authorize]
    public class BentonCountyDataController : ControllerBase
    {
        private readonly IBentonCountyDataService _bentonCountyDataService;
        private readonly ILogger<BentonCountyDataController> _logger;

        public BentonCountyDataController(
            IBentonCountyDataService bentonCountyDataService,
            ILogger<BentonCountyDataController> logger)
        {
            _bentonCountyDataService = bentonCountyDataService;
            _logger = logger;
        }

        /// <summary>
        /// Get Property Assessment Data
        /// Real property assessment data from Benton County
        /// </summary>
        [HttpPost("property-assessments")]
        public async Task<ActionResult<PropertyAssessmentDataDto>> GetPropertyAssessmentData(
            [FromBody] PropertyDataRequestDto request)
        {
            try
            {
                _logger.LogInformation("🏠 Retrieving property assessment data for Benton County");
                var data = await _bentonCountyDataService.GetPropertyAssessmentDataAsync(request);
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get property assessment data");
                return StatusCode(500, new { Error = "Failed to retrieve property assessment data", Details = ex.Message });
            }
        }

        /// <summary>
        /// Get Citizen Services Data
        /// Real citizen services data from Benton County
        /// </summary>
        [HttpPost("citizen-services")]
        public async Task<ActionResult<CitizenServicesDataDto>> GetCitizenServicesData(
            [FromBody] CitizenServicesRequestDto request)
        {
            try
            {
                _logger.LogInformation("👥 Retrieving citizen services data for Benton County");
                var data = await _bentonCountyDataService.GetCitizenServicesDataAsync(request);
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get citizen services data");
                return StatusCode(500, new { Error = "Failed to retrieve citizen services data", Details = ex.Message });
            }
        }

        /// <summary>
        /// Get Emergency Response Data
        /// Real emergency response data from Benton County
        /// </summary>
        [HttpPost("emergency-response")]
        public async Task<ActionResult<EmergencyResponseDataDto>> GetEmergencyResponseData(
            [FromBody] EmergencyDataRequestDto request)
        {
            try
            {
                _logger.LogInformation("🚨 Retrieving emergency response data for Benton County");
                var data = await _bentonCountyDataService.GetEmergencyResponseDataAsync(request);
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get emergency response data");
                return StatusCode(500, new { Error = "Failed to retrieve emergency response data", Details = ex.Message });
            }
        }

        /// <summary>
        /// Sync with Benton County
        /// Sync all data sources with Benton County systems
        /// </summary>
        [HttpPost("sync")]
        public async Task<ActionResult<DataSyncResultDto>> SyncWithBentonCounty()
        {
            try
            {
                _logger.LogInformation("🔄 Starting data sync with Benton County systems - THE TERRAFUSION WAY!");
                var result = await _bentonCountyDataService.SyncWithBentonCountyAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to sync with Benton County");
                return StatusCode(500, new { Error = "Failed to sync with Benton County", Details = ex.Message });
            }
        }

        /// <summary>
        /// Get Data Source Status
        /// Status of all Benton County data source connections
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<object>> GetDataSourceStatus()
        {
            try
            {
                _logger.LogInformation("Checking Benton County data source status");

                // Perform a real sync status check via the data service
                var syncResult = await _bentonCountyDataService.SyncWithBentonCountyAsync();

                var sourceStatus = syncResult.Success ? "Active" : "Unavailable";
                var status = new
                {
                    Status = syncResult.Success ? "Connected" : "Degraded",
                    Timestamp = DateTime.UtcNow,
                    DataSources = new
                    {
                        PropertyAssessments = sourceStatus,
                        CitizenServices = sourceStatus,
                        EmergencyResponse = sourceStatus,
                        PermitsLicenses = sourceStatus,
                        ZoningData = sourceStatus,
                        TaxRecords = sourceStatus
                    },
                    SyncDetails = new
                    {
                        syncResult.RecordsSynced,
                        syncResult.RecordsUpdated,
                        syncResult.RecordsAdded,
                        Duration = (syncResult.SyncEndTime - syncResult.SyncStartTime).TotalMilliseconds
                    },
                    LastSync = syncResult.SyncEndTime,
                    NextScheduledSync = syncResult.SyncEndTime.AddHours(1),
                    SyncMessages = syncResult.SyncMessages,
                    Message = syncResult.Success
                        ? "Real Benton County data powering quantum consciousness!"
                        : "Data sync encountered issues - check SyncMessages for details"
                };

                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get data source status");
                return StatusCode(500, new { Error = "Failed to retrieve data source status", Details = ex.Message });
            }
        }
    }

    /// <summary>
    /// Quantum Security Controller
    /// REST API for quantum-resistant security management
    /// </summary>
    [ApiController]
    [Route("api/v1/quantum-security")]
    [Authorize]
    public class QuantumSecurityController : ControllerBase
    {
        private readonly IQuantumSecurityService _quantumSecurityService;
        private readonly ILogger<QuantumSecurityController> _logger;

        public QuantumSecurityController(
            IQuantumSecurityService quantumSecurityService,
            ILogger<QuantumSecurityController> logger)
        {
            _quantumSecurityService = quantumSecurityService;
            _logger = logger;
        }

        /// <summary>
        /// Deploy Security to All Agents
        /// Deploy quantum-resistant security to all million agents
        /// </summary>
        [HttpPost("deploy")]
        public async Task<ActionResult<QuantumSecurityDeploymentResultDto>> DeploySecurityToAllAgents()
        {
            try
            {
                _logger.LogInformation("🔐 Deploying quantum security to all agents - THE TERRAFUSION WAY!");
                var result = await _quantumSecurityService.DeploySecurityToAllAgentsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to deploy security to all agents");
                return StatusCode(500, new { Error = "Failed to deploy security", Details = ex.Message });
            }
        }

        /// <summary>
        /// Monitor Quantum Threats
        /// Real-time quantum threat monitoring across all agents
        /// </summary>
        [HttpGet("threats")]
        public async Task<ActionResult<QuantumThreatMonitoringResultDto>> MonitorQuantumThreats()
        {
            try
            {
                var threats = await _quantumSecurityService.MonitorQuantumThreatsAsync();
                return Ok(threats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to monitor quantum threats");
                return StatusCode(500, new { Error = "Failed to monitor threats", Details = ex.Message });
            }
        }

        /// <summary>
        /// Validate Security Compliance
        /// Validate government security compliance (FISMA, FedRAMP, SOC 2)
        /// </summary>
        [HttpGet("compliance")]
        public async Task<ActionResult<SecurityComplianceResultDto>> ValidateSecurityCompliance()
        {
            try
            {
                var compliance = await _quantumSecurityService.ValidateSecurityComplianceAsync();
                return Ok(compliance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to validate security compliance");
                return StatusCode(500, new { Error = "Failed to validate compliance", Details = ex.Message });
            }
        }

        /// <summary>
        /// Respond to Security Incident
        /// Automated response to security incidents
        /// </summary>
        [HttpPost("incidents")]
        public async Task<ActionResult<SecurityIncidentResponseDto>> RespondToSecurityIncident(
            [FromBody] SecurityIncidentDto incident)
        {
            try
            {
                _logger.LogCritical("🚨 SECURITY INCIDENT: {IncidentType} - {Severity}",
                    incident.IncidentType, incident.Severity);

                var response = await _quantumSecurityService.RespondToSecurityIncidentAsync(incident);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to respond to security incident");
                return StatusCode(500, new { Error = "Failed to respond to incident", Details = ex.Message });
            }
        }
    }
}