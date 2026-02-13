using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces
{
    /// <summary>
    /// Audit service interface matching ProductionAuditService implementation.
    /// All methods map to real Dapper-backed audit logging.
    /// </summary>
    public interface IAuditService
    {
        // Core audit event logging
        Task<Guid> LogAuditEventAsync(AuditEvent auditEvent);

        // Authentication auditing
        Task LogAuthenticationAttemptAsync(string username, string ipAddress);
        Task LogSuccessfulLoginAsync(string userId, string ipAddress, string sessionId);

        // Data access auditing (FISMA requirement)
        Task LogDataAccessAsync(DataAccessEvent accessEvent);

        // Configuration change auditing
        Task LogConfigurationChangeAsync(ConfigChangeEvent changeEvent);

        // Security violation logging
        Task LogSecurityViolationAsync(SecurityViolationEvent violation);

        // Query and reporting
        Task<AuditLogQueryResult> QueryAuditLogsAsync(AuditLogQuery query);
        Task<ComplianceReport> GenerateComplianceReportAsync(DateTime startDate, DateTime endDate);

        // Integrity verification
        Task<AuditIntegrityCheckResult> VerifyAuditIntegrityAsync(DateTime startDate, DateTime endDate);

        // Archival
        Task<ArchiveResult> ArchiveAuditLogsAsync(int retentionDays);
    }
}
