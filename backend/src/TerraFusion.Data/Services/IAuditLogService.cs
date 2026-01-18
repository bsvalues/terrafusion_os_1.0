/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - AUDIT LOG SERVICE INTERFACE
 * FISMA-HIGH Compliance Audit Trail (NIST 800-53 AU-3, AU-11)
 * 7-Year Retention, Immutable Append-Only Logging
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using TerraFusion.Core.Models;

namespace TerraFusion.Data.Services;

/// <summary>
/// Audit Log Service Interface for FISMA-HIGH compliance
///
/// NIST 800-53 Requirements:
/// - AU-3: Content of Audit Records (user identity, timestamp, action, resource, result)
/// - AU-11: Audit Record Retention (7 years minimum for government records)
/// - AU-9: Protection of Audit Information (append-only, immutable)
///
/// Use Cases:
/// - Parameter adjustments (quantum consciousness tuning)
/// - Preset applications (configuration changes)
/// - Failed operations (security monitoring)
/// - Administrative actions (compliance tracking)
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// Log parameter change event for FISMA compliance
    /// </summary>
    /// <param name="entry">Audit log entry with complete metadata</param>
    /// <returns>Task representing the async operation</returns>
    Task LogParameterChangeAsync(AuditLogEntry entry);

    /// <summary>
    /// Retrieve audit log entries for a specific user
    /// </summary>
    /// <param name="userId">User ID to filter by</param>
    /// <param name="startDate">Start date for audit log query</param>
    /// <param name="endDate">End date for audit log query</param>
    /// <returns>List of audit log entries</returns>
    Task<List<AuditLogEntry>> GetAuditLogsForUserAsync(
        string userId,
        DateTime startDate,
        DateTime endDate);

    /// <summary>
    /// Retrieve audit log entries for a specific resource
    /// </summary>
    /// <param name="resource">Resource identifier (e.g., "QuantumConsciousness.coherenceLevel")</param>
    /// <param name="startDate">Start date for audit log query</param>
    /// <param name="endDate">End date for audit log query</param>
    /// <returns>List of audit log entries</returns>
    Task<List<AuditLogEntry>> GetAuditLogsForResourceAsync(
        string resource,
        DateTime startDate,
        DateTime endDate);

    /// <summary>
    /// Retrieve all failed operations for security monitoring
    /// </summary>
    /// <param name="startDate">Start date for audit log query</param>
    /// <param name="endDate">End date for audit log query</param>
    /// <returns>List of failed operation audit log entries</returns>
    Task<List<AuditLogEntry>> GetFailedOperationsAsync(
        DateTime startDate,
        DateTime endDate);
}
