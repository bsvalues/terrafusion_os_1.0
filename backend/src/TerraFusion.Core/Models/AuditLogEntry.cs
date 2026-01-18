/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - AUDIT LOG ENTRY MODEL
 * FISMA-HIGH Compliance Audit Trail Entry
 * NIST 800-53 AU-3/AU-9/AU-11 Compliant
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

namespace TerraFusion.Core.Models;

/// <summary>
/// Audit Log Entry Model for FISMA-HIGH compliance
///
/// NIST 800-53 Requirements:
/// - AU-3: Content of Audit Records (user identity, timestamp, action, resource, result)
/// - AU-9: Protection of Audit Information (append-only, immutable)
/// - AU-11: Audit Record Retention (7 years minimum for government records)
/// </summary>
public class AuditLogEntry
{
    /// <summary>
    /// Unique audit log identifier
    /// </summary>
    public Guid LogId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// User who performed the action (NIST 800-53 AU-3: user identity)
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when action occurred (NIST 800-53 AU-3: timestamp)
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Action performed (NIST 800-53 AU-3: type of event)
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Resource affected by the action (NIST 800-53 AU-3: identity of objects)
    /// </summary>
    public string Resource { get; set; } = string.Empty;

    /// <summary>
    /// Result of the action (Success, Failed, PartialSuccess)
    /// </summary>
    public string Result { get; set; } = string.Empty;

    /// <summary>
    /// Additional details or context
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// Source IP address or system identifier
    /// </summary>
    public string? Source { get; set; }

    /// <summary>
    /// Session identifier for correlation
    /// </summary>
    public string? SessionId { get; set; }
}
