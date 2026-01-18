/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - QUANTUM CONSCIOUSNESS LOG ENTITY
 * FISMA-HIGH Compliant Audit Trail for Parameter Adjustments
 * 7-Year Retention, Immutable Append-Only, NIST 800-53 AU-3/AU-9/AU-11
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Data.Entities;

/// <summary>
/// Quantum Consciousness Parameter Adjustment Audit Log
///
/// FISMA-HIGH Compliance:
/// - NIST 800-53 AU-3: Audit record content (who, what, when, where, source, outcome)
/// - NIST 800-53 AU-9: Audit information protection (append-only, no deletion)
/// - NIST 800-53 AU-11: Audit record retention (7 years = 2,555 days minimum)
///
/// Retention Policy: 7 years (2,555 days) from creation date
/// Security Classification: FISMA-HIGH
/// Data Protection: Encrypted at rest (PostgreSQL pgcrypto), encrypted in transit (TLS 1.3)
/// </summary>
[Table("quantum_consciousness_logs")]
[Index(nameof(Timestamp), Name = "IX_QuantumConsciousnessLog_Timestamp")]
[Index(nameof(UserId), Name = "IX_QuantumConsciousnessLog_UserId")]
[Index(nameof(ParameterName), Name = "IX_QuantumConsciousnessLog_ParameterName")]
[Index(nameof(Result), Name = "IX_QuantumConsciousnessLog_Result")]
public class QuantumConsciousnessLog
{
    /// <summary>
    /// Unique audit log identifier (GUID for distributed system compatibility)
    /// </summary>
    [Key]
    [Column("log_id")]
    public Guid LogId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Timestamp of parameter adjustment (UTC, NIST 800-53 AU-3)
    /// </summary>
    [Required]
    [Column("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User identifier who initiated adjustment (NIST 800-53 AU-3)
    /// </summary>
    [Required]
    [Column("user_id")]
    [MaxLength(200)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// User email for accountability (FISMA requirement)
    /// </summary>
    [Required]
    [Column("user_email")]
    [MaxLength(300)]
    public string UserEmail { get; set; } = string.Empty;

    /// <summary>
    /// Parameter name adjusted (coherenceLevel, entanglementStrength, consciousnessLevel, optimizationFactor)
    /// </summary>
    [Required]
    [Column("parameter_name")]
    [MaxLength(100)]
    public string ParameterName { get; set; } = string.Empty;

    /// <summary>
    /// Previous parameter value (NIST 800-53 AU-3: before state)
    /// </summary>
    [Required]
    [Column("old_value", TypeName = "decimal(18,6)")]
    public decimal OldValue { get; set; }

    /// <summary>
    /// New parameter value (NIST 800-53 AU-3: after state)
    /// </summary>
    [Required]
    [Column("new_value", TypeName = "decimal(18,6)")]
    public decimal NewValue { get; set; }

    /// <summary>
    /// Adjustment result (Success, Failed, PartialSuccess)
    /// </summary>
    [Required]
    [Column("result")]
    [MaxLength(50)]
    public string Result { get; set; } = string.Empty;

    /// <summary>
    /// Number of AI agents affected by adjustment
    /// </summary>
    [Column("affected_agent_count")]
    public int AffectedAgentCount { get; set; }

    /// <summary>
    /// Swarm recalibration duration in milliseconds
    /// </summary>
    [Column("recalibration_duration_ms")]
    public long RecalibrationDurationMs { get; set; }

    /// <summary>
    /// Predicted accuracy impact percentage (from ML model)
    /// </summary>
    [Column("predicted_accuracy_impact", TypeName = "decimal(10,4)")]
    public decimal? PredictedAccuracyImpact { get; set; }

    /// <summary>
    /// Actual accuracy change measured post-adjustment
    /// </summary>
    [Column("actual_accuracy_change", TypeName = "decimal(10,4)")]
    public decimal? ActualAccuracyChange { get; set; }

    /// <summary>
    /// Error message if adjustment failed (NIST 800-53 AU-3: outcome)
    /// </summary>
    [Column("error_message")]
    [MaxLength(2000)]
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Client IP address (NIST 800-53 AU-3: source)
    /// </summary>
    [Required]
    [Column("ip_address")]
    [MaxLength(50)]
    public string IpAddress { get; set; } = string.Empty;

    /// <summary>
    /// User agent string (browser/client identification)
    /// </summary>
    [Column("user_agent")]
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Confidence score from ML prediction model (0.0-1.0)
    /// </summary>
    [Column("confidence_score", TypeName = "decimal(5,4)")]
    public decimal? ConfidenceScore { get; set; }

    /// <summary>
    /// Preset ID if applied via preset (NULL for manual adjustment)
    /// </summary>
    [Column("preset_id")]
    [MaxLength(50)]
    public string? PresetId { get; set; }

    /// <summary>
    /// Retention expiration date (7 years from creation, NIST 800-53 AU-11)
    /// </summary>
    [Required]
    [Column("retention_expires")]
    public DateTime RetentionExpires { get; set; }

    /// <summary>
    /// Record creation timestamp (for audit trail integrity)
    /// </summary>
    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Set retention expiration to 7 years from creation
    /// </summary>
    public void SetRetentionPolicy()
    {
        RetentionExpires = CreatedAt.AddYears(7); // NIST 800-53 AU-11: 7-year retention
    }
}
