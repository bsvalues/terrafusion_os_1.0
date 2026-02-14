namespace TerraFusion.Security.Models;

public enum AuditSeverity
{
    Information,
    Warning,
    Critical
}

public class AuditEvent
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string EventCategory { get; set; } = string.Empty;
    public AuditSeverity Severity { get; set; }
    public string? UserId { get; set; }
    public string? Username { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? SessionId { get; set; }
    public string? County { get; set; }
    public string? ResourceType { get; set; }
    public string? ResourceId { get; set; }
    public string? Action { get; set; }
    public string? Outcome { get; set; }
    public string? Data { get; set; }
    public string? ErrorMessage { get; set; }
    public string? CorrelationId { get; set; }
    public Guid? ParentEventId { get; set; }
    public long? DurationMs { get; set; }
    public DateTime Timestamp { get; set; }
    public string? ServerHostname { get; set; }
    public string? Hash { get; set; }
    public bool IsEncrypted { get; set; }
    public int? RetentionDays { get; set; }
}

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
    public List<string>? Fields { get; set; }
    public string? Purpose { get; set; }
}

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

public class AuditLogQuery
{
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public int Offset { get; set; }
}

public class AuditLogQueryResult
{
    public List<AuditEvent> Logs { get; set; } = new();
    public long TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

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

public class AuthenticationStats
{
    public long SuccessfulLogins { get; set; }
    public long FailedLogins { get; set; }
    public long Logouts { get; set; }
    public long PasswordChanges { get; set; }
    public long MfaChallenges { get; set; }
    public long UniqueUsers { get; set; }
}

public class DataAccessPattern
{
    public string? ResourceType { get; set; }
    public string? Action { get; set; }
    public long AccessCount { get; set; }
    public long UniqueUsers { get; set; }
    public double AvgDurationMs { get; set; }
}

public class SecurityViolation
{
    public string? ViolationType { get; set; }
    public long Count { get; set; }
    public DateTime LastOccurrence { get; set; }
}

public class UserActivity
{
    public string? UserId { get; set; }
    public string? Username { get; set; }
    public long TotalActions { get; set; }
    public long ActiveDays { get; set; }
    public DateTime FirstActivity { get; set; }
    public DateTime LastActivity { get; set; }
}

public class AuditIntegrityCheckResult
{
    public int TotalRecords { get; set; }
    public int ValidRecords { get; set; }
    public List<Guid> TamperedRecords { get; set; } = new();
    public List<DateTimeRange> MissingRecords { get; set; } = new();
    public double IntegrityScore { get; set; }
    public bool IsValid { get; set; }
}

public class DateTimeRange
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
}

public class ArchiveResult
{
    public bool Success { get; set; }
    public int ArchivedCount { get; set; }
    public int DeletedCount { get; set; }
    public string? ArchiveLocation { get; set; }
}

public class AuditException : Exception
{
    public AuditException(string message) : base(message) { }
    public AuditException(string message, Exception innerException) : base(message, innerException) { }
}
