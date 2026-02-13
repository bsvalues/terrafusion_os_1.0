namespace TerraFusion.Security.Models
{
    /// <summary>
    /// Data access event for FISMA compliance audit tracking.
    /// </summary>
    public class DataAccessEvent
    {
        public string? UserId { get; set; }
        public string? Username { get; set; }
        public string? IpAddress { get; set; }
        public string? SessionId { get; set; }
        public string? County { get; set; }
        public string? ResourceType { get; set; }
        public string? ResourceId { get; set; }
        public string? Action { get; set; }
        public bool Success { get; set; }
        public string? Query { get; set; }
        public string? Parameters { get; set; }
        public int RecordCount { get; set; }
        public string[]? Fields { get; set; }
        public string? Purpose { get; set; }
    }

    /// <summary>
    /// Configuration change event for compliance tracking.
    /// </summary>
    public class ConfigChangeEvent
    {
        public string? UserId { get; set; }
        public string? Username { get; set; }
        public string ConfigKey { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string? Reason { get; set; }
        public string? ApprovedBy { get; set; }
    }

    /// <summary>
    /// Security violation event for incident response.
    /// </summary>
    public class SecurityViolationEvent
    {
        public string? UserId { get; set; }
        public string? IpAddress { get; set; }
        public string? SessionId { get; set; }
        public string ViolationType { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? AttemptedAction { get; set; }
        public string? BlockedBy { get; set; }
        public double RiskScore { get; set; }
    }

    /// <summary>
    /// Compliance report generated from audit data.
    /// </summary>
    public class ComplianceReport
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string? GeneratedBy { get; set; }
        public AuthenticationStats? AuthenticationStats { get; set; }
        public IEnumerable<DataAccessPattern>? DataAccessPatterns { get; set; }
        public IEnumerable<SecurityViolation>? SecurityViolations { get; set; }
        public IEnumerable<UserActivity>? UserActivitySummary { get; set; }
    }

    /// <summary>
    /// Authentication statistics for compliance reporting.
    /// </summary>
    public class AuthenticationStats
    {
        public int SuccessfulLogins { get; set; }
        public int FailedLogins { get; set; }
        public int Logouts { get; set; }
        public int PasswordChanges { get; set; }
        public int MfaChallenges { get; set; }
        public int UniqueUsers { get; set; }
    }

    /// <summary>
    /// Data access pattern analysis.
    /// </summary>
    public class DataAccessPattern
    {
        public string? ResourceType { get; set; }
        public string? Action { get; set; }
        public int AccessCount { get; set; }
        public int UniqueUsers { get; set; }
        public double AvgDurationMs { get; set; }
    }

    /// <summary>
    /// Security violation summary.
    /// </summary>
    public class SecurityViolation
    {
        public string? ViolationType { get; set; }
        public int Count { get; set; }
        public DateTime LastOccurrence { get; set; }
    }

    /// <summary>
    /// User activity summary for compliance.
    /// </summary>
    public class UserActivity
    {
        public string? UserId { get; set; }
        public string? Username { get; set; }
        public int TotalActions { get; set; }
        public int ActiveDays { get; set; }
        public DateTime FirstActivity { get; set; }
        public DateTime LastActivity { get; set; }
    }

    /// <summary>
    /// Audit integrity verification result.
    /// </summary>
    public class AuditIntegrityCheckResult
    {
        public int TotalRecords { get; set; }
        public int ValidRecords { get; set; }
        public List<Guid> TamperedRecords { get; set; } = new();
        public List<DateTimeRange> MissingRecords { get; set; } = new();
        public double IntegrityScore { get; set; }
        public bool IsValid { get; set; }
    }

    /// <summary>
    /// Date-time range for gap analysis.
    /// </summary>
    public class DateTimeRange
    {
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
    }

    /// <summary>
    /// Archive operation result.
    /// </summary>
    public class ArchiveResult
    {
        public bool Success { get; set; }
        public int ArchivedCount { get; set; }
        public int DeletedCount { get; set; }
        public string? ArchiveLocation { get; set; }
    }

    /// <summary>
    /// User session for authentication tracking.
    /// </summary>
    public class UserSession
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// User information summary.
    /// </summary>
    public class UserInfo
    {
        public string UserId { get; set; } = string.Empty;
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
        public string? Department { get; set; }
        public string? CountyId { get; set; }
        public string? SecurityClearance { get; set; }
        public List<string> Roles { get; set; } = new();
    }

    /// <summary>
    /// Exception thrown when audit logging fails.
    /// </summary>
    public class AuditException : Exception
    {
        public AuditException(string message) : base(message) { }
        public AuditException(string message, Exception innerException) : base(message, innerException) { }
    }
}
