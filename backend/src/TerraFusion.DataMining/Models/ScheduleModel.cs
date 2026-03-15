using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.DataMining.Models;

/// <summary>
/// Defines a scheduled ETL job with cron-based recurrence, enable/disable
/// control, and last-run tracking. TMR-011.
/// </summary>
public class Schedule
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    /// <summary>Unique name for this schedule (e.g. "zillow_daily_sync").</summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Human-readable description of what the schedule does.</summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>Logical job name to invoke when the schedule fires.</summary>
    [Required]
    [MaxLength(200)]
    public string JobName { get; set; } = string.Empty;

    /// <summary>POSIX cron expression (e.g. "0 3 * * *" for 3 AM daily).</summary>
    [Required]
    [MaxLength(100)]
    public string CronExpression { get; set; } = string.Empty;

    /// <summary>IANA time zone for interpreting the cron expression
    /// (e.g. "America/Los_Angeles").</summary>
    [MaxLength(100)]
    public string TimeZone { get; set; } = "America/Los_Angeles";

    /// <summary>Whether this schedule is currently enabled.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Priority level for queue ordering: low, normal, high, critical.</summary>
    [MaxLength(20)]
    public string Priority { get; set; } = "normal";

    /// <summary>Maximum number of retry attempts on failure.</summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>Delay in seconds between retry attempts.</summary>
    public int RetryDelaySeconds { get; set; } = 60;

    /// <summary>Timeout in seconds for the scheduled job execution.</summary>
    public int TimeoutSeconds { get; set; } = 3600;

    // ── Last Run Tracking ──

    /// <summary>Timestamp of the most recent execution.</summary>
    public DateTime? LastRunAt { get; set; }

    /// <summary>Outcome of the most recent execution: completed, failed, timed_out.</summary>
    [MaxLength(30)]
    public string? LastRunStatus { get; set; }

    /// <summary>Duration of the most recent run in milliseconds.</summary>
    public long? LastRunDurationMs { get; set; }

    /// <summary>Error message from the most recent failed run.</summary>
    [MaxLength(2000)]
    public string? LastRunError { get; set; }

    // ── Next Run ──

    /// <summary>Computed next execution time.</summary>
    public DateTime? NextRunAt { get; set; }

    // ── Configuration ──

    /// <summary>Optional JSON parameters passed to the job on each run.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? Parameters { get; set; }

    /// <summary>Configuration key path for data source credentials
    /// (never contains actual secrets).</summary>
    [MaxLength(500)]
    public string? CredentialConfigKey { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
