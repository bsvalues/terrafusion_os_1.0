// TerraFusion.Operations/HealthChecks/EliteOperationalHealthCheck.cs
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using TerraFusion.Operations.Interfaces;

namespace TerraFusion.Operations.HealthChecks;

/// <summary>
/// Elite Operational Excellence Health Check
/// Validates championship-level operational system health
/// </summary>
public class EliteOperationalHealthCheck : IHealthCheck
{
    private readonly IEliteOperationalService _eliteOperationalService;
    private readonly ILogger<EliteOperationalHealthCheck> _logger;

    public EliteOperationalHealthCheck(
        IEliteOperationalService eliteOperationalService,
        ILogger<EliteOperationalHealthCheck> logger)
    {
        _eliteOperationalService = eliteOperationalService;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            var healthScore = dashboard.OperationalExcellenceScore;
            var systemHealth = dashboard.SystemStatus.OverallHealth;

            var healthData = new Dictionary<string, object>
            {
                ["OperationalExcellenceScore"] = healthScore,
                ["SystemHealth"] = systemHealth,
                ["AIAgents"] = dashboard.AIAgentStatus.ActiveAgents,
                ["Counties"] = dashboard.CountyServiceMetrics.ActiveCounties,
                ["ResponseTime"] = dashboard.SystemStatus.ResponseTime.TotalMilliseconds,
                ["Uptime"] = dashboard.SystemStatus.SystemUptime.TotalHours,
                ["ThroughputPerSecond"] = dashboard.SystemStatus.ThroughputPerSecond,
                ["CitizenSatisfaction"] = dashboard.CitizenServiceExcellence.CitizenFeedbackScore,
                ["SecurityScore"] = dashboard.SecurityMetrics.SecurityScore,
                ["ComplianceScore"] = dashboard.ComplianceMetrics.ComplianceScore
            };

            return healthScore switch
            {
                >= 95.0 when systemHealth >= 90.0 => HealthCheckResult.Healthy(
                    "Elite Operational Excellence - Championship Level Performance"),
                >= 85.0 when systemHealth >= 80.0 => HealthCheckResult.Degraded(
                    "Operational Excellence - Good Performance"),
                _ => HealthCheckResult.Unhealthy(
    "AI Agent Coordination - System Issues")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Elite Operational Health Check failed");
            return HealthCheckResult.Unhealthy(
                "Elite Operational Health Check failed",
                ex);
        }
    }
}

/// <summary>
/// AI Agent Coordination Health Check
/// Validates AI agent swarm coordination health
/// </summary>
public class AIAgentCoordinationHealthCheck : IHealthCheck
{
    private readonly IAIAgentCoordinator _aiAgentCoordinator;
    private readonly ILogger<AIAgentCoordinationHealthCheck> _logger;

    public AIAgentCoordinationHealthCheck(
        IAIAgentCoordinator aiAgentCoordinator,
        ILogger<AIAgentCoordinationHealthCheck> logger)
    {
        _aiAgentCoordinator = aiAgentCoordinator;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var agentStatus = await _aiAgentCoordinator.GetCoordinationStatusAsync();

            var healthData = new Dictionary<string, object>
            {
                ["ActiveAgents"] = agentStatus.ActiveAgents,
                ["HealthyAgents"] = agentStatus.HealthyAgents,
                ["CoordinationEfficiency"] = agentStatus.CoordinationEfficiency,
                ["SwarmOptimizationScore"] = agentStatus.SwarmOptimizationScore,
                ["ResponseTimeMs"] = agentStatus.AverageResponseTime.TotalMilliseconds
            };

            var healthPercentage = (double)agentStatus.HealthyAgents / agentStatus.ActiveAgents * 100;

            return healthPercentage switch
            {
                >= 95.0 when agentStatus.CoordinationEfficiency >= 90.0 => HealthCheckResult.Healthy(
                    "AI Agent Coordination - Optimal Performance"),
                >= 80.0 when agentStatus.CoordinationEfficiency >= 70.0 => HealthCheckResult.Degraded(
                    "AI Agent Coordination - Acceptable Performance"),
                _ => HealthCheckResult.Unhealthy(
                    "AI Agent Coordination - Performance Issues Detected")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI Agent Coordination Health Check failed");
            return HealthCheckResult.Unhealthy(
                "AI Agent Coordination Health Check failed",
                ex);
        }
    }
}

/// <summary>
/// County Services Health Check
/// Validates county government service delivery health
/// </summary>
public class CountyServicesHealthCheck : IHealthCheck
{
    private readonly ICountyServiceMonitor _countyServiceMonitor;
    private readonly ILogger<CountyServicesHealthCheck> _logger;

    public CountyServicesHealthCheck(
        ICountyServiceMonitor countyServiceMonitor,
        ILogger<CountyServicesHealthCheck> logger)
    {
        _countyServiceMonitor = countyServiceMonitor;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var countyMetrics = await _countyServiceMonitor.GetCountyServiceMetricsAsync();

            var healthData = new Dictionary<string, object>
            {
                ["ActiveCounties"] = countyMetrics.ActiveCounties,
                ["ServiceAvailability"] = countyMetrics.ServiceAvailability,
                ["ResponseTime"] = countyMetrics.AverageResponseTime.TotalMilliseconds,
                ["ThroughputPerHour"] = countyMetrics.ThroughputPerHour,
                ["ServiceQualityScore"] = countyMetrics.ServiceQualityScore
            };

            return countyMetrics.ServiceAvailability switch
            {
                >= 99.0 when countyMetrics.ServiceQualityScore >= 90.0 => HealthCheckResult.Healthy(
                    "County Services - Excellent Availability and Quality"),
                >= 95.0 when countyMetrics.ServiceQualityScore >= 80.0 => HealthCheckResult.Degraded(
                    "County Services - Good Availability"),
                _ => HealthCheckResult.Unhealthy(
                    "County Services - Availability Issues")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "County Services Health Check failed");
            return HealthCheckResult.Unhealthy(
                "County Services Health Check failed",
                ex);
        }
    }
}

/// <summary>
/// Performance Metrics Health Check
/// Validates system performance metrics health
/// </summary>
public class PerformanceMetricsHealthCheck : IHealthCheck
{
    private readonly IPerformanceAnalyzer _performanceAnalyzer;
    private readonly ILogger<PerformanceMetricsHealthCheck> _logger;

    public PerformanceMetricsHealthCheck(
        IPerformanceAnalyzer performanceAnalyzer,
        ILogger<PerformanceMetricsHealthCheck> logger)
    {
        _performanceAnalyzer = performanceAnalyzer;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var performanceMetrics = await _performanceAnalyzer.GetCurrentPerformanceMetricsAsync();

            var healthData = new Dictionary<string, object>
            {
                ["CPUUtilization"] = performanceMetrics.CPUUtilization,
                ["MemoryUtilization"] = performanceMetrics.MemoryUtilization,
                ["ResponseTime"] = performanceMetrics.ResponseTime.TotalMilliseconds,
                ["ThroughputPerSecond"] = performanceMetrics.ThroughputPerSecond,
                ["ErrorRate"] = performanceMetrics.ErrorRate,
                ["PerformanceScore"] = performanceMetrics.PerformanceScore
            };

            return performanceMetrics.PerformanceScore switch
            {
                >= 90.0 when performanceMetrics.ErrorRate <= 0.1 => HealthCheckResult.Healthy(
                    "Performance Metrics - Excellent Performance"),
                >= 75.0 when performanceMetrics.ErrorRate <= 1.0 => HealthCheckResult.Degraded(
                    "Performance Metrics - Acceptable Performance"),
                _ => HealthCheckResult.Unhealthy(
                    "Performance Metrics - Performance Issues")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Performance Metrics Health Check failed");
            return HealthCheckResult.Unhealthy(
                "Performance Metrics Health Check failed",
                ex);
        }
    }
}

/// <summary>
/// Security Compliance Health Check
/// Validates security and compliance status health
/// </summary>
public class SecurityComplianceHealthCheck : IHealthCheck
{
    private readonly ISecurityMonitor _securityMonitor;
    private readonly IComplianceValidator _complianceValidator;
    private readonly ILogger<SecurityComplianceHealthCheck> _logger;

    public SecurityComplianceHealthCheck(
        ISecurityMonitor securityMonitor,
        IComplianceValidator complianceValidator,
        ILogger<SecurityComplianceHealthCheck> logger)
    {
        _securityMonitor = securityMonitor;
        _complianceValidator = complianceValidator;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var securityStatus = await _securityMonitor.GetSecurityStatusAsync();
            var complianceStatus = await _complianceValidator.GetComplianceStatusAsync();

            var healthData = new Dictionary<string, object>
            {
                ["SecurityScore"] = securityStatus.SecurityScore,
                ["ThreatLevel"] = securityStatus.ThreatLevel,
                ["VulnerabilitiesDetected"] = securityStatus.VulnerabilitiesDetected,
                ["ComplianceScore"] = complianceStatus.ComplianceScore,
                ["FISMACompliant"] = complianceStatus.FISMACompliant,
                ["FedRAMPCompliant"] = complianceStatus.FedRAMPCompliant,
                ["ComplianceViolations"] = complianceStatus.ViolationsDetected
            };

            var overallSecurityScore = (securityStatus.SecurityScore + complianceStatus.ComplianceScore) / 2;

            return overallSecurityScore switch
            {
                >= 95.0 when securityStatus.ThreatLevel == "Low" && complianceStatus.ViolationsDetected == 0 =>
                    HealthCheckResult.Healthy("Security & Compliance - Excellent Status"),
                >= 80.0 when securityStatus.ThreatLevel != "High" && complianceStatus.ViolationsDetected <= 2 =>
                    HealthCheckResult.Degraded("Security & Compliance - Acceptable Status"),
                _ => HealthCheckResult.Unhealthy("Security & Compliance - Issues Detected")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Security Compliance Health Check failed");
            return HealthCheckResult.Unhealthy(
                "Security Compliance Health Check failed",
                ex);
        }
    }
}

/// <summary>
/// Emergency Response Health Check
/// Validates emergency response system readiness
/// </summary>
public class EmergencyResponseHealthCheck : IHealthCheck
{
    private readonly IEmergencyResponseCoordinator _emergencyResponseCoordinator;
    private readonly ILogger<EmergencyResponseHealthCheck> _logger;

    public EmergencyResponseHealthCheck(
        IEmergencyResponseCoordinator emergencyResponseCoordinator,
        ILogger<EmergencyResponseHealthCheck> logger)
    {
        _emergencyResponseCoordinator = emergencyResponseCoordinator;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var emergencyStatus = await _emergencyResponseCoordinator.GetEmergencyReadinessStatusAsync();

            var healthData = new Dictionary<string, object>
            {
                ["ReadinessScore"] = emergencyStatus.ReadinessScore,
                ["ResponseCapacity"] = emergencyStatus.ResponseCapacity,
                ["ActiveProtocols"] = emergencyStatus.ActiveProtocols,
                ["ResponseTime"] = emergencyStatus.AverageResponseTime.TotalSeconds,
                ["BackupSystemsReady"] = emergencyStatus.BackupSystemsReady,
                ["DisasterRecoveryReady"] = emergencyStatus.DisasterRecoveryReady
            };

            return emergencyStatus.ReadinessScore switch
            {
                >= 95.0 when emergencyStatus.BackupSystemsReady && emergencyStatus.DisasterRecoveryReady =>
                    HealthCheckResult.Healthy("Emergency Response - Fully Ready"),
                >= 80.0 when emergencyStatus.ResponseCapacity >= 75.0 =>
                    HealthCheckResult.Degraded("Emergency Response - Adequate Readiness"),
                _ => HealthCheckResult.Unhealthy("Emergency Response - Readiness Issues")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Emergency Response Health Check failed");
            return HealthCheckResult.Unhealthy(
                "Emergency Response Health Check failed",
                ex);
        }
    }
}

/// <summary>
/// Citizen Services Health Check
/// Validates citizen service delivery quality
/// </summary>
public class CitizenServicesHealthCheck : IHealthCheck
{
    private readonly ICitizenServiceAnalyzer _citizenServiceAnalyzer;
    private readonly ILogger<CitizenServicesHealthCheck> _logger;

    public CitizenServicesHealthCheck(
        ICitizenServiceAnalyzer citizenServiceAnalyzer,
        ILogger<CitizenServicesHealthCheck> logger)
    {
        _citizenServiceAnalyzer = citizenServiceAnalyzer;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var citizenServiceMetrics = await _citizenServiceAnalyzer.GetCitizenServiceMetricsAsync();

            var healthData = new Dictionary<string, object>
            {
                ["CitizenFeedbackScore"] = citizenServiceMetrics.CitizenFeedbackScore,
                ["ServiceCompletionRate"] = citizenServiceMetrics.ServiceCompletionRate,
                ["ResponseTime"] = citizenServiceMetrics.AverageResponseTime.TotalMinutes,
                ["SatisfactionRating"] = citizenServiceMetrics.SatisfactionRating,
                ["AccessibilityScore"] = citizenServiceMetrics.AccessibilityScore,
                ["DigitalAdoptionRate"] = citizenServiceMetrics.DigitalAdoptionRate
            };

            return citizenServiceMetrics.CitizenFeedbackScore switch
            {
                >= 90.0 when citizenServiceMetrics.ServiceCompletionRate >= 95.0 =>
                    HealthCheckResult.Healthy("Citizen Services - Excellent Quality"),
                >= 75.0 when citizenServiceMetrics.ServiceCompletionRate >= 85.0 =>
                    HealthCheckResult.Degraded("Citizen Services - Good Quality"),
                _ => HealthCheckResult.Unhealthy("Citizen Services - Quality Issues")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Citizen Services Health Check failed");
            return HealthCheckResult.Unhealthy(
                "Citizen Services Health Check failed",
                ex);
        }
    }
}
