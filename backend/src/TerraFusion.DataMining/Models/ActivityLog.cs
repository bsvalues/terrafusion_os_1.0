using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.DataMining.Models;

/// <summary>
/// Records individual operations performed by the data-mining ETL pipeline
/// (scrapes, imports, transforms, exports). TMR-004.
/// </summary>
public class ActivityLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Foreign key to the job run that produced this entry.</summary>
    public long? JobRunId { get; set; }

    /// <summary>Navigation to the parent job run.</summary>
    public JobRun? JobRun { get; set; }

    /// <summary>Source system identifier (e.g. zillow, attom, narrpr, pacmls, county_gis).</summary>
    [Required]
    [MaxLength(100)]
    public string Source { get; set; } = string.Empty;

    /// <summary>Operation type (e.g. scrape, import, transform, export, validate).</summary>
    [Required]
    [MaxLength(50)]
    public string Operation { get; set; } = string.Empty;

    /// <summary>Status of this activity (e.g. started, completed, failed, skipped).</summary>
    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "started";

    /// <summary>Number of records affected by this activity.</summary>
    public int RecordsAffected { get; set; }

    /// <summary>Human-readable message or summary.</summary>
    [MaxLength(2000)]
    public string? Message { get; set; }

    /// <summary>JSON blob with additional detail (field mappings, error traces, etc.).</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? Details { get; set; }

    /// <summary>Duration of the activity in milliseconds.</summary>
    public long DurationMs { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Represents a single execution of an ETL job (one or more activities).
/// </summary>
public class JobRun
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Logical job name (e.g. zillow_market_sync, narrpr_scrape, pacmls_import).</summary>
    [Required]
    [MaxLength(200)]
    public string JobName { get; set; } = string.Empty;

    /// <summary>Status: queued, running, completed, failed, cancelled.</summary>
    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "queued";

    /// <summary>Total records processed in this run.</summary>
    public int TotalRecords { get; set; }

    /// <summary>Records that completed successfully.</summary>
    public int SuccessRecords { get; set; }

    /// <summary>Records that failed processing.</summary>
    public int FailedRecords { get; set; }

    /// <summary>Duration of the entire run in milliseconds.</summary>
    public long DurationMs { get; set; }

    /// <summary>JSON error summary when status is failed.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? ErrorSummary { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ──

    public ICollection<ActivityLog> Activities { get; set; } = new List<ActivityLog>();
}

/// <summary>
/// Schema-only entity for tracking which NARRPR credential configurations
/// exist. Does NOT store actual credentials — those come from
/// IConfiguration / environment variables at runtime.
/// </summary>
public class NarrprCredential
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>Friendly label for this credential set (e.g. "BentonCounty-Prod").</summary>
    [Required]
    [MaxLength(200)]
    public string Label { get; set; } = string.Empty;

    /// <summary>Configuration key path where the actual credential is stored
    /// (e.g. "Narrpr:Credentials:BentonCounty"). Never contains the secret itself.</summary>
    [Required]
    [MaxLength(500)]
    public string ConfigKeyPath { get; set; } = string.Empty;

    /// <summary>Whether this credential configuration is active.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Last time a connection was successfully validated.</summary>
    public DateTime? LastValidatedAt { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Captures AI/ML feedback on data quality, anomalies, or valuation confidence
/// generated during ETL processing.
/// </summary>
public class AIFeedback
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Parcel number the feedback applies to.</summary>
    [Required]
    [MaxLength(50)]
    public string ParcelNumber { get; set; } = string.Empty;

    /// <summary>Source module (e.g. zillow_ingest, narrpr_scrape, cma_engine).</summary>
    [Required]
    [MaxLength(100)]
    public string SourceModule { get; set; } = string.Empty;

    /// <summary>Feedback category (e.g. anomaly, outlier, confidence, data_gap).</summary>
    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    /// <summary>Severity: info, warning, critical.</summary>
    [Required]
    [MaxLength(20)]
    public string Severity { get; set; } = "info";

    /// <summary>Human-readable description of the feedback.</summary>
    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>Confidence score from 0.0 to 1.0.</summary>
    public double? ConfidenceScore { get; set; }

    /// <summary>JSON payload with model outputs, feature importances, etc.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? Payload { get; set; }

    /// <summary>Whether the feedback has been reviewed by a human.</summary>
    public bool IsReviewed { get; set; }

    [MaxLength(200)]
    public string? ReviewedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Defines a recurring ETL schedule (cron-based) for automated data collection.
/// </summary>
public class ETLSchedule
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>Logical job name this schedule triggers.</summary>
    [Required]
    [MaxLength(200)]
    public string JobName { get; set; } = string.Empty;

    /// <summary>POSIX cron expression (e.g. "0 2 * * *" for 2 AM daily).</summary>
    [Required]
    [MaxLength(100)]
    public string CronExpression { get; set; } = string.Empty;

    /// <summary>Whether this schedule is currently enabled.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Timestamp of the most recent execution.</summary>
    public DateTime? LastRunAt { get; set; }

    /// <summary>Outcome of the most recent execution (completed, failed).</summary>
    [MaxLength(30)]
    public string? LastRunStatus { get; set; }

    /// <summary>Next scheduled execution time.</summary>
    public DateTime? NextRunAt { get; set; }

    /// <summary>Optional JSON parameters passed to the job on each run.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? Parameters { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Point-in-time system metric captured during ETL operations
/// (throughput, error rates, latencies).
/// </summary>
public class SystemMetric
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Metric name (e.g. etl_records_per_second, scrape_latency_ms).</summary>
    [Required]
    [MaxLength(200)]
    public string MetricName { get; set; } = string.Empty;

    /// <summary>Numeric value of the metric.</summary>
    public double Value { get; set; }

    /// <summary>Unit of measure (e.g. ms, records/s, percent).</summary>
    [MaxLength(50)]
    public string? Unit { get; set; }

    /// <summary>Source component that emitted the metric.</summary>
    [MaxLength(100)]
    public string? Source { get; set; }

    /// <summary>Optional JSON tags for dimensional grouping.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? Tags { get; set; }

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Per-record data quality score produced after ETL ingestion or validation.
/// </summary>
public class DataQualityScore
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Parcel number the score applies to.</summary>
    [Required]
    [MaxLength(50)]
    public string ParcelNumber { get; set; } = string.Empty;

    /// <summary>Data source evaluated (e.g. zillow, narrpr, county_gis).</summary>
    [Required]
    [MaxLength(100)]
    public string DataSource { get; set; } = string.Empty;

    /// <summary>Overall quality score from 0.0 (worst) to 1.0 (best).</summary>
    public double OverallScore { get; set; }

    /// <summary>Completeness score — ratio of non-null required fields.</summary>
    public double CompletenessScore { get; set; }

    /// <summary>Accuracy score — cross-source consistency.</summary>
    public double AccuracyScore { get; set; }

    /// <summary>Timeliness score — freshness of the data.</summary>
    public double TimelinessScore { get; set; }

    /// <summary>Number of validation rules that passed.</summary>
    public int RulesPassed { get; set; }

    /// <summary>Number of validation rules that failed.</summary>
    public int RulesFailed { get; set; }

    /// <summary>JSON array of individual rule results.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? RuleDetails { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
