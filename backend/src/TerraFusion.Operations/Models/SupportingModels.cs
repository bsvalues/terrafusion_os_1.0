// TerraFusion.Operations/Models/SupportingModels.cs
namespace TerraFusion.Operations.Models;

/// <summary>
/// Security Status
/// </summary>
public class SecurityStatus
{
    public double SecurityScore { get; set; }
    public string ThreatLevel { get; set; } = "Low";
    public int VulnerabilitiesDetected { get; set; }
    public List<SecurityThreat> ActiveThreats { get; set; } = new();
    public DateTime LastSecurityScan { get; set; }
    public bool IntrusionDetected { get; set; }
}

/// <summary>
/// Compliance Status
/// </summary>
public class ComplianceStatus
{
    public double ComplianceScore { get; set; }
    public bool FISMACompliant { get; set; }
    public bool FedRAMPCompliant { get; set; }
    public bool HIPAACompliant { get; set; }
    public bool SOX404Compliant { get; set; }
    public int ViolationsDetected { get; set; }
    public List<ComplianceViolation> Violations { get; set; } = new();
    public DateTime LastAudit { get; set; }
}

/// <summary>
/// Performance Analysis Result
/// </summary>
public class PerformanceAnalysisResult
{
    public bool Success { get; set; }
    public double PerformanceScore { get; set; }
    public List<PerformanceInsight> Insights { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public DateTime AnalysisCompletedAt { get; set; }
}

/// <summary>
/// Performance Insight
/// </summary>
public class PerformanceInsight
{
    public string Component { get; set; } = "";
    public string Issue { get; set; } = "";
    public string Recommendation { get; set; } = "";
    public double Impact { get; set; }
    public string Priority { get; set; } = "";
}

/// <summary>
/// Swarm Optimization Result
/// </summary>
public class SwarmOptimizationResult
{
    public bool Success { get; set; }
    public double OptimizationScore { get; set; }
    public int AgentsOptimized { get; set; }
    public List<string> OptimizationsApplied { get; set; } = new();
    public DateTime OptimizationCompletedAt { get; set; }
}

/// <summary>
/// Coordination Result
/// </summary>
public class CoordinationResult
{
    public bool Success { get; set; }
    public int AgentsCoordinated { get; set; }
    public double CoordinationEfficiency { get; set; }
    public List<string> CoordinationActions { get; set; } = new();
    public DateTime CoordinationCompletedAt { get; set; }
}

/// <summary>
/// Disaster Recovery Status
/// </summary>
public class DisasterRecoveryStatus
{
    public bool IsRecoveryReady { get; set; }
    public string RecoveryPhase { get; set; } = "";
    public double ReadinessScore { get; set; }
    public List<string> BackupSystems { get; set; } = new();
    public DateTime LastRecoveryTest { get; set; }
}

/// <summary>
/// Agent Health Status
/// </summary>
public class AgentHealthStatus
{
    public int TotalAgents { get; set; }
    public int HealthyAgents { get; set; }
    public int UnhealthyAgents { get; set; }
    public double HealthPercentage { get; set; }
    public List<UnhealthyAgent> UnhealthyAgentsList { get; set; } = new();
    public DateTime LastHealthCheck { get; set; }
}

/// <summary>
/// Threat Detection Result
/// </summary>
public class ThreatDetectionResult
{
    public bool ThreatsDetected { get; set; }
    public int ThreatCount { get; set; }
    public List<SecurityThreat> Threats { get; set; } = new();
    public double ThreatSeverityScore { get; set; }
    public DateTime DetectionCompletedAt { get; set; }
}

/// <summary>
/// Health Status
/// </summary>
public class HealthStatus
{
    public string Component { get; set; } = "";
    public string Status { get; set; } = "";
    public double HealthScore { get; set; }
    public List<string> Issues { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Performance Data
/// </summary>
public class PerformanceData
{
    public string MetricName { get; set; } = "";
    public double Value { get; set; }
    public string Unit { get; set; } = "";
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Security Event
/// </summary>
public class SecurityEvent
{
    public string EventId { get; set; } = "";
    public string EventType { get; set; } = "";
    public string Severity { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime OccurredAt { get; set; }
    public string Source { get; set; } = "";
    public Dictionary<string, object> EventData { get; set; } = new();
}

/// <summary>
/// Emergency Readiness Status
/// </summary>
public class EmergencyReadinessStatus
{
    public double ReadinessScore { get; set; }
    public double ResponseCapacity { get; set; }
    public int ActiveProtocols { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public bool BackupSystemsReady { get; set; }
    public bool DisasterRecoveryReady { get; set; }
    public DateTime LastReadinessCheck { get; set; }
}

/// <summary>
/// Intelligence Report
/// </summary>
public class IntelligenceReport
{
    public string ReportId { get; set; } = "";
    public string ReportType { get; set; } = "";
    public List<IntelligenceInsight> Insights { get; set; } = new();
    public string ExecutiveSummary { get; set; } = "";
    public DateTime GeneratedAt { get; set; }
    public string GeneratedBy { get; set; } = "";
}

/// <summary>
/// Telemetry Data
/// </summary>
public class TelemetryData
{
    public string Source { get; set; } = "";
    public string DataType { get; set; } = "";
    public Dictionary<string, object> Metrics { get; set; } = new();
    public DateTime Timestamp { get; set; }
    public string SessionId { get; set; } = "";
}

/// <summary>
/// Government Compliance Status
/// </summary>
public class GovernmentComplianceStatus
{
    public bool IsCompliant { get; set; }
    public string ComplianceLevel { get; set; } = "";
    public List<string> ComplianceFrameworks { get; set; } = new();
    public int ViolationCount { get; set; }
    public DateTime LastComplianceCheck { get; set; }
    public string ComplianceOfficer { get; set; } = "";
}

/// <summary>
/// Compliance Event
/// </summary>
public class ComplianceEvent
{
    public string EventId { get; set; } = "";
    public string ComplianceFramework { get; set; } = "";
    public string EventType { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime OccurredAt { get; set; }
    public string Severity { get; set; } = "";
}

/// <summary>
/// Crisis Management Status
/// </summary>
public class CrisisManagementStatus
{
    public bool IsInCrisis { get; set; }
    public string CrisisLevel { get; set; } = "";
    public List<string> ActiveCrises { get; set; } = new();
    public double ResponseReadiness { get; set; }
    public DateTime LastCrisisAssessment { get; set; }
}

/// <summary>
/// Metrics Collection
/// </summary>
public class MetricsCollection
{
    public List<MetricDataPoint> Metrics { get; set; } = new();
    public DateTime CollectionStarted { get; set; }
    public DateTime CollectionCompleted { get; set; }
    public int MetricsCount { get; set; }
    public string CollectionId { get; set; } = "";
}

/// <summary>
/// Citizen Satisfaction Report
/// </summary>
public class CitizenSatisfactionReport
{
    public string ReportId { get; set; } = "";
    public double OverallSatisfactionScore { get; set; }
    public int ResponseCount { get; set; }
    public Dictionary<string, double> ServiceRatings { get; set; } = new();
    public List<string> TopComplaints { get; set; } = new();
    public List<string> TopPraises { get; set; } = new();
    public DateTime ReportGeneratedAt { get; set; }
}

/// <summary>
/// Swarm Metrics
/// </summary>
public class SwarmMetrics
{
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public double SwarmEfficiency { get; set; }
    public double LoadDistribution { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public DateTime LastMetricsUpdate { get; set; }
}

/// <summary>
/// Compliance Validation Result
/// </summary>
public class ComplianceValidationResult
{
    public bool IsValid { get; set; }
    public List<string> PassedControls { get; set; } = new();
    public List<string> FailedControls { get; set; } = new();
    public double CompliancePercentage { get; set; }
    public DateTime ValidationCompletedAt { get; set; }
}

/// <summary>
/// Disaster Recovery Result
/// </summary>
public class DisasterRecoveryResult
{
    public bool Success { get; set; }
    public string RecoveryType { get; set; } = "";
    public TimeSpan RecoveryTime { get; set; }
    public List<string> RecoveredSystems { get; set; } = new();
    public DateTime RecoveryCompletedAt { get; set; }
}

/// <summary>
/// Telemetry Report
/// </summary>
public class TelemetryReport
{
    public string ReportId { get; set; } = "";
    public TimeSpan ReportingPeriod { get; set; }
    public Dictionary<string, object> Metrics { get; set; } = new();
    public List<string> KeyInsights { get; set; } = new();
    public DateTime ReportGeneratedAt { get; set; }
}

/// <summary>
/// Performance Anomaly
/// </summary>
public class PerformanceAnomaly
{
    public string AnomalyId { get; set; } = "";
    public string Component { get; set; } = "";
    public string AnomalyType { get; set; } = "";
    public double Severity { get; set; }
    public string Description { get; set; } = "";
    public DateTime DetectedAt { get; set; }
    public bool IsResolved { get; set; }
}

/// <summary>
/// Crisis Request
/// </summary>
public class CrisisRequest
{
    public string CrisisType { get; set; } = "";
    public string Severity { get; set; } = "";
    public string Description { get; set; } = "";
    public Dictionary<string, object> Context { get; set; } = new();
    public DateTime RequestedAt { get; set; }
    public string RequestedBy { get; set; } = "";
}

/// <summary>
/// Crisis Response
/// </summary>
public class CrisisResponse
{
    public string ResponseId { get; set; } = "";
    public bool Success { get; set; }
    public List<string> ActionsExecuted { get; set; } = new();
    public TimeSpan ResponseTime { get; set; }
    public DateTime CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Emergency Request
/// </summary>
public class EmergencyRequest
{
    public string EmergencyType { get; set; } = "";
    public string Priority { get; set; } = "";
    public string Description { get; set; } = "";
    public Dictionary<string, object> EmergencyData { get; set; } = new();
    public DateTime RequestedAt { get; set; }
    public string RequestedBy { get; set; } = "";
}

/// <summary>
/// Emergency Response
/// </summary>
public class EmergencyResponse
{
    public string ResponseId { get; set; } = "";
    public bool Success { get; set; }
    public List<EmergencyAction> ActionsExecuted { get; set; } = new();
    public TimeSpan ResponseTime { get; set; }
    public DateTime CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Compliance Audit Result
/// </summary>
public class ComplianceAuditResult
{
    public string AuditId { get; set; } = "";
    public bool AuditPassed { get; set; }
    public double ComplianceScore { get; set; }
    public List<string> ComplianceGaps { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public DateTime AuditCompletedAt { get; set; }
    public string AuditorName { get; set; } = "";
}

/// <summary>
/// Health Report
/// </summary>
public class HealthReport
{
    public string SystemHealth { get; set; } = "Unknown";
    public DateTime GeneratedAt { get; set; }
    public List<ComponentHealth> Components { get; set; } = new();
}

/// <summary>
/// Component Health
/// </summary>
public class ComponentHealth
{
    public string ComponentName { get; set; } = "";
    public string Status { get; set; } = "Unknown";
    public double HealthScore { get; set; }
    public DateTime LastChecked { get; set; }
}

/// <summary>
/// Performance Optimization
/// </summary>
public class PerformanceOptimization
{
    public string OptimizationType { get; set; } = "";
    public string Description { get; set; } = "";
    public double ImprovementPercentage { get; set; }
    public DateTime AppliedAt { get; set; }
}

/// <summary>
/// Emergency Recovery Result
/// </summary>
public class EmergencyRecoveryResult
{
    public bool IsSuccessful { get; set; }
    public string Message { get; set; } = "";
    public DateTime ExecutedAt { get; set; }
}

/// <summary>
/// Predictive Issue
/// </summary>
public class PredictiveIssue
{
    public string IssueType { get; set; } = string.Empty;
    public double Probability { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime PredictedAt { get; set; }
    public string Severity { get; set; } = "Low";
}

/// <summary>
/// Performance Optimizations
/// </summary>
public class PerformanceOptimizations
{
    public double OptimizationScore { get; set; }
    public List<string> OptimizationsApplied { get; set; } = new();
    public DateTime CompletedAt { get; set; }
    public Dictionary<string, double> PerformanceImprovements { get; set; } = new();
}

/// <summary>
/// Capacity Analysis
/// </summary>
public class CapacityAnalysis
{
    public double CurrentCapacity { get; set; }
    public double RecommendedCapacity { get; set; }
    public List<string> ScalingRecommendations { get; set; } = new();
    public DateTime AnalysisDate { get; set; }
    public Dictionary<string, double> ResourceUtilization { get; set; } = new();
}

/// <summary>
/// Security Assessment
/// </summary>
public class SecurityAssessment
{
    public double SecurityScore { get; set; }
    public int VulnerabilitiesDetected { get; set; }
    public string ComplianceLevel { get; set; } = string.Empty;
    public string ThreatLevel { get; set; } = string.Empty;
    public List<SecurityThreat> Threats { get; set; } = new();
    public DateTime AssessmentDate { get; set; }
}

/// <summary>
/// Compliance Validation
/// </summary>
public class ComplianceValidation
{
    public bool FISMACompliance { get; set; }
    public bool FedRAMPCompliance { get; set; }
    public bool SOC2Compliance { get; set; }
    public double ComplianceScore { get; set; }
    public List<string> ComplianceGaps { get; set; } = new();
    public DateTime ValidationDate { get; set; }
}

/// <summary>
/// Autonomous Recovery Result
/// </summary>
public class AutonomousRecoveryResult
{
    public bool Success { get; set; }
    public List<string> RecoveryActions { get; set; } = new();
    public TimeSpan RecoveryTime { get; set; }
    public string RecoveryStage { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; }
}
