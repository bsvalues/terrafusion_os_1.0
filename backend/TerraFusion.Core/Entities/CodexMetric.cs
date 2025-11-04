// TerraFusion Codex: Database Entity for Metric Storage
// Elite Government OS Engineering - Production Database Schema

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities
{
    /// <summary>
    /// Codex metric snapshot - stores time-series data for trend analysis
    /// </summary>
    [Table("CodexMetrics")]
    public class CodexMetric
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Timestamp of metric collection
        /// </summary>
        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Environment (Development, Staging, Production)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Environment { get; set; } = "Production";

        /// <summary>
        /// County identifier (for multi-tenant support)
        /// </summary>
        [MaxLength(100)]
        public string? County { get; set; }

        /// <summary>
        /// Domain name (systemPerformance, codeQuality, compliance, etc.)
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Domain { get; set; } = string.Empty;

        /// <summary>
        /// Metric name within domain
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string MetricName { get; set; } = string.Empty;

        /// <summary>
        /// Raw metric value (before scaling)
        /// </summary>
        [Required]
        public double RawValue { get; set; }

        /// <summary>
        /// Scaled metric value (0-12)
        /// </summary>
        [Required]
        public double ScaledValue { get; set; }

        /// <summary>
        /// Unit of measurement (ms, %, count, etc.)
        /// </summary>
        [MaxLength(20)]
        public string? Unit { get; set; }

        /// <summary>
        /// Alert level at time of collection
        /// </summary>
        [MaxLength(20)]
        public string? AlertLevel { get; set; }

        // Government-required audit fields
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [MaxLength(200)]
        public string CreatedBy { get; set; } = "System";

        [MaxLength(200)]
        public string UpdatedBy { get; set; } = "System";

        // Indexes for performance
        // CREATE INDEX IX_CodexMetrics_Timestamp ON CodexMetrics(Timestamp DESC)
        // CREATE INDEX IX_CodexMetrics_Domain_Timestamp ON CodexMetrics(Domain, Timestamp DESC)
        // CREATE INDEX IX_CodexMetrics_County_Timestamp ON CodexMetrics(County, Timestamp DESC)
    }

    /// <summary>
    /// Codex score snapshot - stores amplified domain scores
    /// </summary>
    [Table("CodexScores")]
    public class CodexScore
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Timestamp of score calculation
        /// </summary>
        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Environment
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Environment { get; set; } = "Production";

        /// <summary>
        /// County identifier
        /// </summary>
        [MaxLength(100)]
        public string? County { get; set; }

        /// <summary>
        /// Domain name
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Domain { get; set; } = string.Empty;

        /// <summary>
        /// Amplified score (0-12)
        /// </summary>
        [Required]
        public double AmplifiedScore { get; set; }

        /// <summary>
        /// Alert level (Green, Yellow, Red, Critical)
        /// </summary>
        [MaxLength(20)]
        public string AlertLevel { get; set; } = string.Empty;

        /// <summary>
        /// Recommended action
        /// </summary>
        [MaxLength(500)]
        public string? RecommendedAction { get; set; }

        // Government-required audit fields
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [MaxLength(200)]
        public string CreatedBy { get; set; } = "System";

        [MaxLength(200)]
        public string UpdatedBy { get; set; } = "System";

        // Indexes
        // CREATE INDEX IX_CodexScores_Timestamp ON CodexScores(Timestamp DESC)
        // CREATE INDEX IX_CodexScores_Domain_Timestamp ON CodexScores(Domain, Timestamp DESC)
    }

    /// <summary>
    /// Ultimate power snapshot - stores system-wide scores
    /// </summary>
    [Table("CodexUltimatePower")]
    public class CodexUltimatePower
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Timestamp of calculation
        /// </summary>
        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Environment
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Environment { get; set; } = "Production";

        /// <summary>
        /// County identifier
        /// </summary>
        [MaxLength(100)]
        public string? County { get; set; }

        /// <summary>
        /// Ultimate power score (0-12)
        /// </summary>
        [Required]
        public double UltimatePowerScore { get; set; }

        /// <summary>
        /// Percentage of maximum (0-100)
        /// </summary>
        [Required]
        public double Percentage { get; set; }

        /// <summary>
        /// Alert level
        /// </summary>
        [MaxLength(20)]
        public string AlertLevel { get; set; } = string.Empty;

        /// <summary>
        /// Recommended action
        /// </summary>
        [MaxLength(500)]
        public string? RecommendedAction { get; set; }

        /// <summary>
        /// Trend (Improving, Stable, Declining)
        /// </summary>
        [MaxLength(20)]
        public string? Trend { get; set; }

        /// <summary>
        /// JSON snapshot of all domain scores
        /// </summary>
        [Column(TypeName = "jsonb")] // PostgreSQL JSONB, SQLite will use TEXT
        public string DomainScoresJson { get; set; } = "{}";

        /// <summary>
        /// Is system in championship mode (score >= 10)
        /// </summary>
        public bool IsChampionshipMode { get; set; }

        /// <summary>
        /// Is FISMA-HIGH compliant (compliance >= 10)
        /// </summary>
        public bool IsFISMACompliant { get; set; }

        // Government-required audit fields
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [MaxLength(200)]
        public string CreatedBy { get; set; } = "System";

        [MaxLength(200)]
        public string UpdatedBy { get; set; } = "System";

        // Indexes
        // CREATE INDEX IX_CodexUltimatePower_Timestamp ON CodexUltimatePower(Timestamp DESC)
        // CREATE INDEX IX_CodexUltimatePower_County_Timestamp ON CodexUltimatePower(County, Timestamp DESC)
        // CREATE INDEX IX_CodexUltimatePower_IsChampionshipMode ON CodexUltimatePower(IsChampionshipMode)
    }

    /// <summary>
    /// Codex alert history - tracks when thresholds are breached
    /// </summary>
    [Table("CodexAlerts")]
    public class CodexAlert
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Timestamp of alert
        /// </summary>
        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Environment
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Environment { get; set; } = "Production";

        /// <summary>
        /// County identifier
        /// </summary>
        [MaxLength(100)]
        public string? County { get; set; }

        /// <summary>
        /// Domain name
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Domain { get; set; } = string.Empty;

        /// <summary>
        /// Alert level
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string AlertLevel { get; set; } = string.Empty;

        /// <summary>
        /// Score that triggered alert
        /// </summary>
        [Required]
        public double Score { get; set; }

        /// <summary>
        /// Threshold that was breached
        /// </summary>
        [Required]
        public double Threshold { get; set; }

        /// <summary>
        /// Alert message
        /// </summary>
        [Required]
        [MaxLength(1000)]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Recommended action
        /// </summary>
        [MaxLength(1000)]
        public string? RecommendedAction { get; set; }

        /// <summary>
        /// Was alert acknowledged
        /// </summary>
        public bool Acknowledged { get; set; }

        /// <summary>
        /// Who acknowledged
        /// </summary>
        [MaxLength(200)]
        public string? AcknowledgedBy { get; set; }

        /// <summary>
        /// When acknowledged
        /// </summary>
        public DateTime? AcknowledgedAt { get; set; }

        /// <summary>
        /// Was alert resolved
        /// </summary>
        public bool Resolved { get; set; }

        /// <summary>
        /// When resolved
        /// </summary>
        public DateTime? ResolvedAt { get; set; }

        /// <summary>
        /// Resolution notes
        /// </summary>
        [MaxLength(2000)]
        public string? ResolutionNotes { get; set; }

        // Government-required audit fields
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [MaxLength(200)]
        public string CreatedBy { get; set; } = "System";

        [MaxLength(200)]
        public string UpdatedBy { get; set; } = "System";

        // Indexes
        // CREATE INDEX IX_CodexAlerts_Timestamp ON CodexAlerts(Timestamp DESC)
        // CREATE INDEX IX_CodexAlerts_Acknowledged ON CodexAlerts(Acknowledged, Timestamp DESC)
        // CREATE INDEX IX_CodexAlerts_Resolved ON CodexAlerts(Resolved, Timestamp DESC)
    }
}
