using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Audit Logger interface for government-grade compliance tracking
    /// Provides comprehensive audit logging for TerraFusion consciousness operations
    /// Government. Transcended.
    /// </summary>
    public interface IAuditLogger
    {
        /// <summary>
        /// Log audit event with government compliance standards
        /// </summary>
        Task LogAuditEventAsync(AuditEvent auditEvent);

        /// <summary>
        /// Get audit trail based on query parameters
        /// </summary>
        Task<List<AuditEvent>> GetAuditTrailAsync(AuditQuery query);

        /// <summary>
        /// Get audit summary for specified time period
        /// </summary>
        Task<AuditSummary> GetAuditSummaryAsync(DateTime startDate, DateTime endDate);
    }
}