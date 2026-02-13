using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Security.Models
{
    /// <summary>
    /// Tracks failed login attempts for account lockout mechanism
    /// FISMA compliance requirement for brute force attack prevention
    /// </summary>
    public class LoginAttempt
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Username { get; set; } = string.Empty;

        public string? IpAddress { get; set; }

        public bool WasSuccessful { get; set; }

        public string? FailureReason { get; set; }

        public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;

        public string? UserAgent { get; set; }
    }

    /// <summary>
    /// Stores password history to prevent password reuse
    /// NIST 800-63B compliance requirement
    /// </summary>
    public class PasswordHistory
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Tracks revoked JWT tokens for security
    /// Prevents use of logged-out or compromised tokens
    /// </summary>
    public class RevokedToken
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Jti { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        public DateTime RevokedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; }

        public string? Reason { get; set; }
    }

    /// <summary>
    /// Stores common/breached passwords for validation
    /// NIST 800-63B requirement to check against known compromised passwords
    /// </summary>
    public class CommonPassword
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public int Occurrences { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Extended audit event model for ProductionAuditService
    /// </summary>
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
        public string? ParentEventId { get; set; }
        public long? DurationMs { get; set; }
        public DateTime Timestamp { get; set; }
        public string? ServerHostname { get; set; }
        public string? Hash { get; set; }
        public bool IsEncrypted { get; set; }
        public int RetentionDays { get; set; } = 2555; // 7 years for government compliance
    }

    public enum AuditSeverity
    {
        Information,
        Warning,
        Error,
        Critical
    }

    public class AuditLogQuery
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? EventType { get; set; }
        public string? EventCategory { get; set; }
        public string? UserId { get; set; }
        public string? IpAddress { get; set; }
        public AuditSeverity? Severity { get; set; }
        public string? ResourceType { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 100;
        public int Offset { get; set; }
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = true;
    }

    public class AuditLogQueryResult
    {
        public List<AuditEvent> Logs { get; set; } = new();
        public long TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class LdapAuthResult
    {
        public bool Success { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
        public string? Department { get; set; }
        public List<string> Groups { get; set; } = new();
        public Dictionary<string, string> Attributes { get; set; } = new();
    }
}
