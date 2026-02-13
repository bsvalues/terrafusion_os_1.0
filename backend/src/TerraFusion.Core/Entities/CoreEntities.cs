using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;



public class PropertyAssessment
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public int AssessmentYear { get; set; }
    public decimal AssessedValue { get; set; }
    public decimal MarketValue { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public string? AssessmentMethod { get; set; }
    public string? AssessorNotes { get; set; }
    public Guid AssessorId { get; set; }
    public DateTime AssessmentDate { get; set; }
    public bool IsActive { get; set; } = true;
}

public class TaxLevy
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public string? TaxingDistrict { get; set; }
    public decimal TaxRate { get; set; }
    public decimal LevyAmount { get; set; }
    public int TaxYear { get; set; }
    public string? Purpose { get; set; }
    public DateTime EffectiveDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public bool IsActive { get; set; } = true;
}

public class GovernmentUser
{
    public Guid Id { get; set; }
    [EmailAddress]
    public required string Email { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? Department { get; set; }
    public required string Role { get; set; }
    public string? SocialSecurityNumber { get; set; } // Encrypted
    public string? PasswordHash { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime LastLoginAt { get; set; }
    public Guid? CountyId { get; set; }
    public string? Permissions { get; set; } // JSON string
}

public class PasswordHistory
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Foreign key to GovernmentUser
    /// </summary>
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Hashed password (PBKDF2/Argon2 format)
    /// Phase 4 Sprint 1: Storage only, no enforcement
    /// </summary>
    public required string PasswordHash { get; set; }
    
    /// <summary>
    /// When this password was set
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Navigation property (optional)
    /// </summary>
    public GovernmentUser? User { get; set; }
}

public class AuditLog
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Type of audit event (e.g., "LOGIN", "SECURITY:FAILED_LOGIN", "DATA_ACCESS")
    /// </summary>
    public required string Type { get; set; }
    
    /// <summary>
    /// JSON-serialized data associated with the event
    /// </summary>
    public string? Data { get; set; }
    
    /// <summary>
    /// When the event occurred
    /// </summary>
    public DateTime Timestamp { get; set; }
    
    /// <summary>
    /// User ID if authenticated
    /// </summary>
    public string? UserId { get; set; }
    
    /// <summary>
    /// User email for easier identification
    /// </summary>
    public string? UserEmail { get; set; }
    
    /// <summary>
    /// Client IP address
    /// </summary>
    public string? IpAddress { get; set; }
    
    /// <summary>
    /// User agent string from browser/client
    /// </summary>
    public string? UserAgent { get; set; }
    
    /// <summary>
    /// HTTP request path
    /// </summary>
    public string? RequestPath { get; set; }
    
    /// <summary>
    /// HTTP method (GET, POST, etc.)
    /// </summary>
    public string? RequestMethod { get; set; }
    
    /// <summary>
    /// Correlation ID for tracking related events
    /// </summary>
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
    public string? MachineName { get; set; }
    
    /// <summary>
    /// Process ID for debugging
    /// </summary>
    public int? ProcessId { get; set; }
    
    /// <summary>
    /// Severity level (Info, Warning, Error, Critical)
    /// </summary>
    public string? Severity { get; set; }
    
    /// <summary>
    /// Source of the audit event
    /// </summary>
    public string? Source { get; set; }
}

public class AIAgent
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Type { get; set; }
    public required string Status { get; set; }
    public string? Configuration { get; set; } // JSON
    public string? CurrentTask { get; set; }
    public int ProcessedTasks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastActiveAt { get; set; }
    public string? AssignedCounty { get; set; }
    public double PerformanceScore { get; set; }
}


public class PerformanceMetric
{
    public Guid Id { get; set; }
    public required string MetricName { get; set; }
    public required string MetricType { get; set; }
    public double Value { get; set; }
    public string? Unit { get; set; }
    public DateTime Timestamp { get; set; }
    public string? Source { get; set; }
    public string? Metadata { get; set; } // JSON
    public Guid? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }
}

public class SecurityEvent
{
    public Guid Id { get; set; }
    public required string EventType { get; set; }
    public required string Description { get; set; }
    public string? Severity { get; set; }
    public string? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime Timestamp { get; set; }
    public string? Metadata { get; set; } // JSON
    public bool IsResolved { get; set; } = false;
    public string? Resolution { get; set; }
}

public class UserSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string SessionToken { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? RefreshToken { get; set; }
}