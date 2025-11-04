// TerraFusion.Operations/Interfaces/IEliteOperationalService.cs
using TerraFusion.Operations.Models;

namespace TerraFusion.Operations.Interfaces;

/// <summary>
/// Elite Operational Excellence Service Interface
/// Defines championship-level operational service contracts
/// </summary>
public interface IEliteOperationalService
{
    /// <summary>
    /// Initialize Elite Operational Excellence Framework
    /// </summary>
    /// <returns>Elite operational initialization result</returns>
    Task<EliteOperationalResult> InitializeAsync();

    /// <summary>
    /// Execute Elite Operational Excellence Cycle
    /// </summary>
    /// <returns>Elite operational cycle result</returns>
    Task<EliteOperationalResult> ExecuteOperationalExcellenceCycleAsync();

    /// <summary>
    /// Get Elite Operational Dashboard
    /// </summary>
    /// <returns>Elite operational dashboard</returns>
    Task<EliteOperationalDashboard> GetEliteOperationalDashboardAsync();

    /// <summary>
    /// Trigger Elite Emergency Response
    /// </summary>
    /// <param name="request">Emergency request</param>
    /// <returns>Emergency response result</returns>
    Task<EliteEmergencyResponse> TriggerEliteEmergencyResponseAsync(EliteEmergencyRequest request);
}

/// <summary>
/// Health Monitoring Service Interface
/// </summary>
public interface IHealthMonitoringService
{
    Task<HealthMetrics> GetCurrentHealthMetricsAsync();
    Task<bool> ValidateSystemHealthAsync();
}

/// <summary>
/// Incident Response Service Interface
/// </summary>
public interface IIncidentResponseService
{
    Task<IncidentResponse> HandleIncidentAsync(IncidentRequest request);
    Task<List<IncidentResponse>> GetActiveIncidentsAsync();
}

/// <summary>
/// Self Healing Service Interface
/// </summary>
public interface ISelfHealingService
{
    Task<SelfHealingResult> PerformSelfHealingAsync();
    Task<bool> ValidateSelfHealingCapabilitiesAsync();
}

/// <summary>
/// Performance Optimization Service Interface
/// </summary>
public interface IPerformanceOptimizationService
{
    Task<PerformanceOptimizationResult> OptimizePerformanceAsync();
    Task<PerformanceMetrics> GetPerformanceMetricsAsync();
}

/// <summary>
/// Autonomous Recovery Service Interface
/// </summary>
public interface IAutonomousRecoveryService
{
    Task<RecoveryResult> PerformAutonomousRecoveryAsync();
    Task<RecoveryStatus> GetRecoveryStatusAsync();
}

/// <summary>
/// System Metrics Collector Interface
/// </summary>
public interface ISystemMetricsCollector
{
    Task<SystemMetrics> CollectSystemMetricsAsync();
    Task<List<MetricDataPoint>> GetHistoricalMetricsAsync(DateTime from, DateTime to);
}

/// <summary>
/// Performance Analyzer Interface
/// </summary>
public interface IPerformanceAnalyzer
{
    Task<ElitePerformanceMetrics> GetCurrentPerformanceMetricsAsync();
    Task<PerformanceAnalysisResult> AnalyzePerformanceAsync();
}

/// <summary>
/// Security Monitor Interface
/// </summary>
public interface ISecurityMonitor
{
    Task<SecurityStatus> GetSecurityStatusAsync();
    Task<List<SecurityThreat>> GetActiveThreatsAsync();
}

/// <summary>
/// Compliance Validator Interface
/// </summary>
public interface IComplianceValidator
{
    Task<ComplianceStatus> GetComplianceStatusAsync();
    Task<ComplianceValidationResult> ValidateComplianceAsync();
}

/// <summary>
/// AI Agent Coordinator Interface
/// </summary>
public interface IAIAgentCoordinator
{
    Task<AIAgentCoordinationStatus> GetCoordinationStatusAsync();
    Task<CoordinationResult> CoordinateAgentsAsync();
}

/// <summary>
/// Agent Health Monitor Interface
/// </summary>
public interface IAgentHealthMonitor
{
    Task<AgentHealthStatus> GetAgentHealthStatusAsync();
    Task<List<UnhealthyAgent>> GetUnhealthyAgentsAsync();
}

/// <summary>
/// Swarm Optimizer Interface
/// </summary>
public interface ISwarmOptimizer
{
    Task<SwarmOptimizationResult> OptimizeSwarmAsync();
    Task<SwarmMetrics> GetSwarmMetricsAsync();
}

/// <summary>
/// County Service Monitor Interface
/// </summary>
public interface ICountyServiceMonitor
{
    Task<CountyServiceMetrics> GetCountyServiceMetricsAsync();
    Task<List<CountyServiceStatus>> GetCountyServiceStatusesAsync();
}

/// <summary>
/// Citizen Service Analyzer Interface
/// </summary>
public interface ICitizenServiceAnalyzer
{
    Task<CitizenServiceExcellence> GetCitizenServiceMetricsAsync();
    Task<CitizenSatisfactionReport> GenerateSatisfactionReportAsync();
}

/// <summary>
/// Government Compliance Service Interface
/// </summary>
public interface IGovernmentComplianceService
{
    Task<GovernmentComplianceStatus> GetComplianceStatusAsync();
    Task<ComplianceAuditResult> PerformComplianceAuditAsync();
}

/// <summary>
/// Emergency Response Coordinator Interface
/// </summary>
public interface IEmergencyResponseCoordinator
{
    Task<EmergencyReadinessStatus> GetEmergencyReadinessStatusAsync();
    Task<EmergencyResponse> CoordinateEmergencyResponseAsync(EmergencyRequest request);
}

/// <summary>
/// Disaster Recovery Service Interface
/// </summary>
public interface IDisasterRecoveryService
{
    Task<DisasterRecoveryStatus> GetDisasterRecoveryStatusAsync();
    Task<DisasterRecoveryResult> InitiateDisasterRecoveryAsync();
}

/// <summary>
/// Crisis Management Service Interface
/// </summary>
public interface ICrisisManagementService
{
    Task<CrisisManagementStatus> GetCrisisManagementStatusAsync();
    Task<CrisisResponse> HandleCrisisAsync(CrisisRequest request);
}

/// <summary>
/// Predictive Analytics Service Interface
/// </summary>
public interface IPredictiveAnalyticsService
{
    Task<PredictiveAnalytics> GetPredictiveAnalyticsAsync();
    Task<List<Prediction>> GeneratePredictionsAsync();
}

/// <summary>
/// Operational Intelligence Service Interface
/// </summary>
public interface IOperationalIntelligenceService
{
    Task<OperationalIntelligence> GetOperationalIntelligenceAsync();
    Task<IntelligenceReport> GenerateIntelligenceReportAsync();
}

/// <summary>
/// Threat Detection Service Interface
/// </summary>
public interface IThreatDetectionService
{
    Task<ThreatDetectionResult> DetectThreatsAsync();
    Task<List<SecurityThreat>> GetActiveThreatsAsync();
}

// Caching Service Interfaces

/// <summary>
/// Operational Metrics Cache Interface
/// </summary>
public interface IOperationalMetricsCache
{
    Task<T?> GetAsync<T>(string key) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null) where T : class;
    Task RemoveAsync(string key);
}

/// <summary>
/// Performance Data Cache Interface
/// </summary>
public interface IPerformanceDataCache
{
    Task<PerformanceData?> GetPerformanceDataAsync(string key);
    Task SetPerformanceDataAsync(string key, PerformanceData data, TimeSpan? expiry = null);
}

/// <summary>
/// Health Status Cache Interface
/// </summary>
public interface IHealthStatusCache
{
    Task<HealthStatus?> GetHealthStatusAsync(string key);
    Task SetHealthStatusAsync(string key, HealthStatus status, TimeSpan? expiry = null);
}

// Logging Service Interfaces

/// <summary>
/// Operational Logger Interface
/// </summary>
public interface IOperationalLogger
{
    Task LogOperationalEventAsync(string eventType, object data, string? userId = null);
    Task LogPerformanceMetricAsync(string metricName, double value, Dictionary<string, object>? tags = null);
}

/// <summary>
/// Performance Logger Interface
/// </summary>
public interface IPerformanceLogger
{
    Task LogPerformanceDataAsync(PerformanceData data);
    Task LogPerformanceAnomalyAsync(PerformanceAnomaly anomaly);
}

/// <summary>
/// Security Event Logger Interface
/// </summary>
public interface ISecurityEventLogger
{
    Task LogSecurityEventAsync(SecurityEvent securityEvent);
    Task LogSecurityThreatAsync(SecurityThreat threat);
}

/// <summary>
/// Compliance Logger Interface
/// </summary>
public interface IComplianceLogger
{
    Task LogComplianceEventAsync(ComplianceEvent complianceEvent);
    Task LogComplianceViolationAsync(ComplianceViolation violation);
}

/// <summary>
/// Metrics Collector Interface
/// </summary>
public interface IMetricsCollector
{
    Task CollectMetricsAsync();
    Task<MetricsCollection> GetCollectedMetricsAsync();
}

/// <summary>
/// Operational Telemetry Interface
/// </summary>
public interface IOperationalTelemetry
{
    Task SendTelemetryAsync(TelemetryData data);
    Task<TelemetryReport> GenerateTelemetryReportAsync();
}
