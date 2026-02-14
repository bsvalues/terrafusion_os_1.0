using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces
{
    public interface IAuditService
    {
        // Core audit
        Task<Guid> LogAuditEventAsync(AuditEvent auditEvent);

        // Authentication events
        Task LogAuthenticationAttemptAsync(string username, string? ipAddress);
        Task LogSuccessfulLoginAsync(string userId, string ipAddress, string sessionId);
        Task LogAuthenticationErrorAsync(string username, string message);
        Task LogAuthenticationSuccessAsync(string username, string? ipAddress);
        Task LogAuthenticationFailureAsync(string username, string? ipAddress, string reason);

        // Session events
        Task LogTokenRefreshAsync(string userId, string sessionId);
        Task LogLogoutAsync(string userId, string sessionId);

        // Password events
        Task LogPasswordChangeAsync(string userId);
        Task LogFailedPasswordChangeAsync(string userId, string reason);

        // Data access and compliance
        Task LogDataAccessAsync(DataAccessEvent accessEvent);
        Task LogConfigurationChangeAsync(ConfigChangeEvent changeEvent);
        Task LogSecurityViolationAsync(SecurityViolationEvent violation);
        Task LogSecurityEventAsync(string eventType, string userId, string details);

        // Query and reporting
        Task<AuditLogQueryResult> QueryAuditLogsAsync(AuditLogQuery query);
        Task<ComplianceReport> GenerateComplianceReportAsync(DateTime startDate, DateTime endDate);

        // Integrity and archival
        Task<AuditIntegrityCheckResult> VerifyAuditIntegrityAsync(DateTime startDate, DateTime endDate);
        Task<ArchiveResult> ArchiveAuditLogsAsync(int retentionDays);
    }
}
