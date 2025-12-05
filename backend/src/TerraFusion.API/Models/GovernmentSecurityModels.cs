/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - GOVERNMENT SECURITY MODELS
 * FISMA-High Compliance, Quantum Encryption, Elite Security Models
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.API.Models;

/// <summary>
/// Security Validation Result for Government Operations
/// </summary>
public class SecurityValidationResult
{
    public bool Success { get; set; }
    public decimal ComplianceScore { get; set; }
    public string FISMALevel { get; set; } = "FISMA-HIGH";
    public object? SecurityControlsValidation { get; set; }
    public object? AccessControlValidation { get; set; }
    public object? AuditControlValidation { get; set; }
    public object? CommunicationProtectionValidation { get; set; }
    public object? IncidentResponseValidation { get; set; }
    public object? RiskManagementValidation { get; set; }
    public object? IntegrityValidation { get; set; }
    public List<string> ComplianceGaps { get; set; } = new();
    public List<string> RemediationRecommendations { get; set; } = new();
    public List<string> ValidationChecks { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public DateTime ValidationTimestamp { get; set; } = DateTime.UtcNow;

    // Legacy aliases retained for compatibility with older callers
    public bool IsValid
    {
        get => Success;
        set => Success = value;
    }

    public string SecurityLevel
    {
        get => FISMALevel;
        set => FISMALevel = value;
    }
}

/// <summary>
/// Audit Logging Result
/// </summary>
public class AuditLoggingResult
{
    public string AuditId { get; set; } = Guid.NewGuid().ToString();
    public bool Success { get; set; }
    public string AuditLoggingLevel { get; set; } = string.Empty;
    public object? AuditStorageInitialization { get; set; }
    public object? TamperProofInitialization { get; set; }
    public object? RealTimeMonitoringInitialization { get; set; }
    public object? AuditEncryptionInitialization { get; set; }
    public object? ComplianceReportingInitialization { get; set; }
    public object? AuditAnalysisInitialization { get; set; }
    public object? AuditValidation { get; set; }
    public int LogEntriesCreated { get; set; }
    public TimeSpan LogRetentionPeriod { get; set; } = TimeSpan.Zero;
    public List<string> ComplianceStandards { get; set; } = new();
    public DateTime InitializationTimestamp { get; set; } = DateTime.UtcNow;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Continuous Compliance Result
/// </summary>
public class ContinuousComplianceResult
{
    public bool Success { get; set; }
    public string MonitoringStatus { get; set; } = string.Empty;
    public object? MonitoringFrameworkInitialization { get; set; }
    public object? RealTimeValidationStart { get; set; }
    public object? AutomatedRemediationInitialization { get; set; }
    public object? ReportingAutomationStart { get; set; }
    public object? ComplianceDashboardInitialization { get; set; }
    public object? AlertingSystemStart { get; set; }
    public object? MonitoringValidation { get; set; }
    public TimeSpan MonitoringFrequency { get; set; } = TimeSpan.Zero;
    public string AutomationLevel { get; set; } = string.Empty;
    public DateTime InitializationTimestamp { get; set; } = DateTime.UtcNow;

    // Legacy properties retained – map back to new fields for compatibility
    public bool IsCompliant
    {
        get => Success;
        set => Success = value;
    }

    public string ComplianceLevel { get; set; } = "FISMA-HIGH";
    public List<string> ComplianceChecks { get; set; } = new();
    public List<string> NonCompliantItems { get; set; } = new();
    public DateTime CheckTimestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Security Assessment Result
/// </summary>
public class SecurityAssessmentResult
{
    public string AssessmentId { get; set; } = Guid.NewGuid().ToString();
    public bool Success { get; set; }
    public decimal OverallSecurityScore { get; set; }
    public string SecurityGrade { get; set; } = string.Empty;
    public object? NetworkSecurityAssessment { get; set; }
    public object? ApplicationSecurityAssessment { get; set; }
    public object? DataSecurityAssessment { get; set; }
    public object? AccessControlAssessment { get; set; }
    public object? InfrastructureSecurityAssessment { get; set; }
    public object? ComplianceAssessment { get; set; }
    public object? VulnerabilityAssessment { get; set; }
    public List<string> SecurityRecommendations { get; set; } = new();
    public string RiskLevel { get; set; } = string.Empty;
    public DateTime AssessmentTimestamp { get; set; } = DateTime.UtcNow;

    // Legacy fields
    public string SecurityPosture { get; set; } = string.Empty;
    public decimal RiskScore { get; set; }
    public List<string> Vulnerabilities { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Threat Analysis Result
/// </summary>
public class ThreatAnalysisResult
{
    private List<string> _mitigations = new();

    public string AnalysisId { get; set; } = Guid.NewGuid().ToString();
    public bool Success { get; set; }
    public string OverallThreatLevel { get; set; } = "LOW";
    public object? ThreatLandscapeAnalysis { get; set; }
    public IEnumerable<ThreatIndicator> ActiveThreatDetection { get; set; } = Enumerable.Empty<ThreatIndicator>();
    public object? ThreatPatternAnalysis { get; set; }
    public object? ThreatRiskAssessment { get; set; }
    public object? ThreatIntelligenceReports { get; set; }
    public IEnumerable<string> MitigationStrategies
    {
        get => _mitigations;
        set => _mitigations = value?.ToList() ?? new List<string>();
    }
    public int ActiveThreatsCount { get; set; }
    public int CriticalThreatsCount { get; set; }
    public string ThreatTrend { get; set; } = string.Empty;
    public DateTime AnalysisTimestamp { get; set; } = DateTime.UtcNow;

    // Legacy collection exposure retained for compatibility
    public List<ThreatIndicator> Threats { get; set; } = new();
    public List<string> Mitigations
    {
        get => _mitigations;
        set => _mitigations = value ?? new List<string>();
    }
    public string ThreatLevel
    {
        get => OverallThreatLevel;
        set => OverallThreatLevel = value;
    }
}

/// <summary>
/// Threat Indicator
/// </summary>
public class ThreatIndicator
{
    public string ThreatType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Security Incident
/// </summary>
public class SecurityIncident
{
    public string IncidentId { get; set; } = Guid.NewGuid().ToString();
    public string IncidentType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImpactLevel { get; set; } = string.Empty;
    public List<string> AffectedSystems { get; set; } = new();
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    public DateTime Timestamp
    {
        get => OccurredAt;
        set => OccurredAt = value;
    }
}

/// <summary>
/// Security Incident Response
/// </summary>
public class SecurityIncidentResponse
{
    public string ResponseId { get; set; } = Guid.NewGuid().ToString();
    public string IncidentId { get; set; } = string.Empty;
    public string ResponseStatus { get; set; } = string.Empty;
    public bool Success { get; set; }
    public object? IncidentClassification { get; set; }
    public object? ImmediateResponse { get; set; }
    public object? ContainmentActions { get; set; }
    public object? InvestigationResults { get; set; }
    public object? RecoveryActions { get; set; }
    public object? IncidentReport { get; set; }
    public object? LessonsLearned { get; set; }
    public TimeSpan ResponseDuration { get; set; }
    public string Status
    {
        get => ResponseStatus;
        set => ResponseStatus = value;
    }
    public string? EscalatedTo { get; set; }
    public string ResolutionNotes { get; set; } = string.Empty;
    public int MitigationDurationMinutes { get; set; }
    public List<string> ActionsTaken { get; set; } = new();
    public DateTime ResponseTimestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Compliance Report Result
/// </summary>
public class ComplianceReportResult
{
    public string ReportId { get; set; } = Guid.NewGuid().ToString();
    public bool Success { get; set; }
    public decimal OverallComplianceScore { get; set; }
    public string ComplianceGrade { get; set; } = string.Empty;
    public object? FISMAComplianceReport { get; set; }
    public object? SecurityControlsReport { get; set; }
    public object? AuditTrailReport { get; set; }
    public object? VulnerabilityReport { get; set; }
    public object? RiskAssessmentReport { get; set; }
    public object? IncidentResponseReport { get; set; }
    public object? ComplianceEvidence { get; set; }
    public string ReportingPeriod { get; set; } = string.Empty;
    public List<string> ComplianceStandards { get; set; } = new();
    public DateTime ReportGenerationTimestamp { get; set; } = DateTime.UtcNow;

    // Legacy fields
    public string ReportType { get; set; } = string.Empty;
    public bool IsCompliant { get; set; }
    public List<string> ComplianceDetails { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Security Dashboard
/// </summary>
public class SecurityDashboard
{
    public string DashboardName { get; set; } = string.Empty;
    public object? SecurityStatus { get; set; }
    public object? ComplianceMetrics { get; set; }
    public object? ThreatIntelligence { get; set; }
    public object? IncidentResponseStatus { get; set; }
    public object? SecurityPerformanceMetrics { get; set; }
    public object? AuditSummary { get; set; }
    public decimal OverallSecurityScore { get; set; }
    public string SecurityGrade { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    // Legacy dashboard aggregates retained
    public SecurityAssessmentResult CurrentAssessment { get; set; } = new();
    public List<SecurityIncident> RecentIncidents { get; set; } = new();
    public ThreatAnalysisResult ThreatAnalysis { get; set; } = new();
    public ContinuousComplianceResult ComplianceStatus { get; set; } = new();
    public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Penetration Test Result
/// </summary>
public class PenetrationTestResult
{
    public string TestId { get; set; } = Guid.NewGuid().ToString();
    public bool Success { get; set; }
    public object? NetworkPenTest { get; set; }
    public object? WebAppPenTest { get; set; }
    public object? DatabasePenTest { get; set; }
    public object? SocialEngineeringTest { get; set; }
    public object? WirelessSecurityTest { get; set; }
    public object? PenTestReport { get; set; }
    public object? VulnerabilityFindings { get; set; } = new List<object>();
    public decimal OverallRiskScore { get; set; }
    public int CriticalVulnerabilities { get; set; }
    public DateTime TestExecutionTimestamp { get; set; } = DateTime.UtcNow;

    // Legacy properties retained
    public bool TestPassed { get; set; }
    public List<string> VulnerabilitiesFound { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public DateTime TestDate { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// In-memory security event used by the government-grade engine
/// </summary>
public class SecurityEvent
{
    public string EventId { get; set; } = Guid.NewGuid().ToString();
    public string EventType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}


