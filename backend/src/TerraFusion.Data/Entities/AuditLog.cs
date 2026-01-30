using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Data.Entities
{
    /// <summary>
    /// Entity for storing audit log entries in the database
    /// Tracks all security-relevant events and user actions
    /// </summary>
    [Table("AuditLogs")]
    public class AuditLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// Type of audit event (e.g., "LOGIN", "SECURITY:FAILED_LOGIN", "DATA_ACCESS")
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// JSON-serialized data associated with the event
        /// </summary>
        [Column(TypeName = "nvarchar(max)")]
        public string? Data { get; set; }

        /// <summary>
        /// When the event occurred
        /// </summary>
        [Required]
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// User ID if authenticated
        /// </summary>
        [MaxLength(450)]
        public string? UserId { get; set; }

        /// <summary>
        /// User email for easier identification
        /// </summary>
        [MaxLength(256)]
        public string? UserEmail { get; set; }

        /// <summary>
        /// Client IP address
        /// </summary>
        [MaxLength(45)] // Supports IPv6
        public string? IpAddress { get; set; }

        /// <summary>
        /// User agent string from browser/client
        /// </summary>
        [MaxLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>
        /// HTTP request path
        /// </summary>
        [MaxLength(500)]
        public string? RequestPath { get; set; }

        /// <summary>
        /// HTTP method (GET, POST, etc.)
        /// </summary>
        [MaxLength(10)]
        public string? RequestMethod { get; set; }

        /// <summary>
        /// Correlation ID for tracking related events
        /// </summary>
        [MaxLength(100)]
        public string? CorrelationId { get; set; }

        /// <summary>
        /// Response status code if applicable
        /// </summary>
        public int? ResponseStatusCode { get; set; }

        /// <summary>
        /// Duration of the operation in milliseconds
        /// </summary>
        public long? DurationMs { get; set; }

        /// <summary>
        /// Machine name where the event occurred
        /// </summary>
        [MaxLength(100)]
        public string? MachineName { get; set; }

        /// <summary>
        /// Process ID for debugging
        /// </summary>
        public int? ProcessId { get; set; }

        /// <summary>
        /// Severity level (Info, Warning, Error, Critical)
        /// </summary>
        [MaxLength(20)]
        public string? Severity { get; set; }

        /// <summary>
        /// Module or component that generated the event
        /// </summary>
        [MaxLength(100)]
        public string? Source { get; set; }
    }

    /// <summary>
    /// Entity for storing security-specific events
    /// Extends audit log with security-specific fields
    /// </summary>
    [Table("SecurityEvents")]
    public class SecurityEvent : AuditLog
    {
        /// <summary>
        /// Security threat level (Low, Medium, High, Critical)
        /// </summary>
        [MaxLength(20)]
        public string? ThreatLevel { get; set; }

        /// <summary>
        /// Attack type if detected (SQLInjection, XSS, BruteForce, etc.)
        /// </summary>
        [MaxLength(50)]
        public string? AttackType { get; set; }

        /// <summary>
        /// Whether the security event was blocked
        /// </summary>
        public bool WasBlocked { get; set; }

        /// <summary>
        /// Action taken (Blocked, Logged, Alerted, etc.)
        /// </summary>
        [MaxLength(100)]
        public string? ActionTaken { get; set; }

        /// <summary>
        /// Additional security context
        /// </summary>
        [Column(TypeName = "nvarchar(max)")]
        public string? SecurityContext { get; set; }
    }
}