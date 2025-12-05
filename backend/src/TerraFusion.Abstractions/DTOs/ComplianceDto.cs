using System;
using System.Collections.Generic;

namespace TerraFusion.Abstractions.DTOs
{
    public enum ComplianceFramework
    {
        All,
        FISMA,
        NIST,
        SOC2,
        FEDRAMP,
        ISO27001
    }

    public enum ComplianceStatusType
    {
        Unknown,
        Compliant,
        NonCompliant,
        PartiallyCompliant,
        InProgress
    }

    public enum ComplianceControlStatus
    {
        NotImplemented,
        InProgress,
        Implemented,
        NonCompliant,
        RequiresReview,
        Monitored,
        Resolved
    }

    public class ComplianceControl
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ComplianceFramework Framework { get; set; }
        public ComplianceControlStatus Status { get; set; }
        public string Evidence { get; set; } = string.Empty;
        public string ResponsibleParty { get; set; } = string.Empty;
        public string ControlId { get; set; } = string.Empty;
        public string ControlName { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string RemediationAction { get; set; } = string.Empty;
        public string RemediatedBy { get; set; } = string.Empty;
        public DateTime? LastReviewed { get; set; }
        public DateTime? NextReview { get; set; }
    }

    public class ComplianceViolation
    {
        public string Id { get; set; } = string.Empty;
        public string ControlId { get; set; } = string.Empty;
        public string ViolationType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public ComplianceFramework Framework { get; set; }
        public DateTime DetectedAt { get; set; }
        public string DetectedBy { get; set; } = string.Empty;
        public ComplianceControlStatus Status { get; set; }
        public string RemediationAction { get; set; } = string.Empty;
        public string RemediatedBy { get; set; } = string.Empty;
        public DateTime? RemediatedAt { get; set; }
        public string Evidence { get; set; } = string.Empty;
    }

    public class ComplianceStatus
    {
        public ComplianceFramework Framework { get; set; }
        public double ComplianceScore { get; set; }
        public int TotalControls { get; set; }
        public int ImplementedControls { get; set; }
        public int ViolationCount { get; set; }
        public DateTime LastAssessment { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class ComplianceMetrics
    {
        public double OverallComplianceScore { get; set; }
        public int TotalControls { get; set; }
        public int ImplementedControls { get; set; }
        public int ViolationsCount { get; set; }
        public int HighSeverityViolations { get; set; }
        public int MediumSeverityViolations { get; set; }
        public int LowSeverityViolations { get; set; }
        public Dictionary<ComplianceFramework, double> FrameworkScores { get; set; } = new();
        public DateTime LastUpdated { get; set; }
        
        // Additional properties expected by the service
        public double ComplianceScore { get; set; }
        public int TotalAuditEvents { get; set; }
        public int SecurityIncidents { get; set; }
        public int DataAccessEvents { get; set; }
        public int PrivilegedAccessEvents { get; set; }
        public int FailedLoginAttempts { get; set; }
        public int ConfigurationChanges { get; set; }
        public Dictionary<string, int> ViolationsByType { get; set; } = new();
    }

    public class ComplianceRecommendation
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public ComplianceFramework Framework { get; set; }
        public string AffectedControlId { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;
        public string ResponsibleParty { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        
        // Additional properties expected by the service
        public string Category { get; set; } = string.Empty;
        public List<string> ActionItems { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class ComplianceDashboardData
    {
        public Dictionary<ComplianceFramework, ComplianceStatus> FrameworkStatus { get; set; } = new();
        public List<ComplianceViolation> RecentViolations { get; set; } = new();
        public ComplianceMetrics OverallMetrics { get; set; } = new();
        public List<ComplianceRecommendation> TopRecommendations { get; set; } = new();
        public Dictionary<string, object> TrendData { get; set; } = new();
        public DateTime LastUpdated { get; set; }
    }

    public class ComplianceReport
    {
        public string Id { get; set; } = string.Empty;
        public ComplianceFramework Framework { get; set; }
        public DateTime GeneratedAt { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public ComplianceStatus OverallStatus { get; set; } = new();
        public List<ComplianceControl> Controls { get; set; } = new();
        public List<ComplianceViolation> Violations { get; set; } = new();
        public ComplianceMetrics Metrics { get; set; } = new();
        public List<ComplianceRecommendation> Recommendations { get; set; } = new();
        public string GeneratedBy { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
    }

    public class ComplianceReportSchedule
    {
        public string Id { get; set; } = string.Empty;
        public ComplianceFramework Framework { get; set; }
        public string Frequency { get; set; } = string.Empty;
        public DateTime NextRun { get; set; }
        public string Recipients { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class AuditTrail
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Action { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public string Data { get; set; } = string.Empty;
        public List<ComplianceFramework> ApplicableFrameworks { get; set; } = new();
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
    }
}
