namespace TerraFusion.IDE.Gateway.Models;

// Security & Compliance Models
public class SecurityClearanceInfo
{
    public string Level { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime ExpirationDate { get; set; }
}

public class AccessRecord
{
    public string UserId { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public DateTime AccessTime { get; set; }
    public string Action { get; set; } = string.Empty;
}

public class SecurityRestriction
{
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> AppliesTo { get; set; } = new();
}

public class AuditFinding
{
    public string Id { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DiscoveredDate { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class ScheduledAssessmentRequest
{
    public string Framework { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public List<string> Scope { get; set; } = new();
}

public class ScheduledAssessmentResult
{
    public string AssessmentId { get; set; } = string.Empty;
    public bool Success { get; set; }
    public DateTime ScheduledFor { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class AccessibilityCheck
{
    public string Standard { get; set; } = string.Empty;
    public int Score { get; set; }
    public List<string> Issues { get; set; } = new();
}

public class ServiceHealthStatus
{
    public string ServiceName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime LastCheck { get; set; }
    public Dictionary<string, string> Metrics { get; set; } = new();
}

public class FedRAMPAuthorizationStatus
{
    public string Level { get; set; } = string.Empty;
    public bool IsAuthorized { get; set; }
    public DateTime AuthorizationDate { get; set; }
    public DateTime ExpirationDate { get; set; }
}

public class ComplianceTrendAnalysis
{
    public string Framework { get; set; } = string.Empty;
    public List<TrendDataPoint> Trends { get; set; } = new();
    public double AverageScore { get; set; }
}

public class TrendDataPoint
{
    public DateTime Date { get; set; }
    public double Score { get; set; }
}

public class SOC2ComplianceReport
{
    public string ReportId { get; set; } = string.Empty;
    public DateTime GeneratedDate { get; set; }
    public int OverallScore { get; set; }
    public Dictionary<string, int> CategoryScores { get; set; } = new();
}

public class AuditExportRequest
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<string> Frameworks { get; set; } = new();
    public string Format { get; set; } = "JSON";
}

public class FrameworkAssessmentResult
{
    public string Framework { get; set; } = string.Empty;
    public int Score { get; set; }
    public List<AssessmentControl> Controls { get; set; } = new();
}

public class AssessmentControl
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public string Details { get; set; } = string.Empty;
}

public class ValidationStep
{
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
}

public class DeploymentValidationRequest
{
    public string Environment { get; set; } = string.Empty;
    public List<string> Frameworks { get; set; } = new();
}

public class DeploymentReadinessResult
{
    public bool IsReady { get; set; }
    public List<ValidationStep> ValidationSteps { get; set; } = new();
    public List<string> Blockers { get; set; } = new();
}

public class MonitoringConfiguration
{
    public string ServiceName { get; set; } = string.Empty;
    public Dictionary<string, string> Metrics { get; set; } = new();
    public int RefreshInterval { get; set; }
}

public class HistoricalComplianceData
{
    public string Framework { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<ComplianceSnapshot> Snapshots { get; set; } = new();
}

public class ComplianceSnapshot
{
    public DateTime Date { get; set; }
    public int Score { get; set; }
    public Dictionary<string, int> ControlScores { get; set; } = new();
}

public class ComplianceTrendData
{
    public string Framework { get; set; } = string.Empty;
    public List<TrendDataPoint> DataPoints { get; set; } = new();
}

public class ComplianceStatusResponse
{
    public string Framework { get; set; } = string.Empty;
    public int CurrentScore { get; set; }
    public DateTime LastAssessment { get; set; }
    public List<string> RecentChanges { get; set; } = new();
}

public class ComplianceReportRequest
{
    public List<string> Frameworks { get; set; } = new();
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Format { get; set; } = "PDF";
}

public class ReadinessCheck
{
    public string CheckName { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ComplianceConfiguration
{
    public List<string> EnabledFrameworks { get; set; } = new();
    public Dictionary<string, int> ThresholdScores { get; set; } = new();
    public bool AutomatedAssessment { get; set; }
}

// Database Models
public class DatabaseInfo
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string ConnectionString { get; set; } = string.Empty;
    public int TableCount { get; set; }
    public long SizeInBytes { get; set; }
}

public class QueryRequest
{
    public string DatabaseName { get; set; } = string.Empty;
    public string Query { get; set; } = string.Empty;
    public int MaxRows { get; set; } = 1000;
}

public class QueryResult
{
    public bool Success { get; set; }
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
    public int RowCount { get; set; }
    public double ExecutionTimeMs { get; set; }
    public string? Error { get; set; }
}
