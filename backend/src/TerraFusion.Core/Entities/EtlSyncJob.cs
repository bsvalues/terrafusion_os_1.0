using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities;

/// <summary>
/// ETL sync job ΓÇö tracks data synchronization operations between
/// TerraFusion and external systems (Harris PACS, Tyler Vision, Aumentum).
/// </summary>
public class EtlSyncJob
{
  [Key]
  [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
  public int Id { get; set; }

  public Guid CountyId { get; set; }

  /// <summary>Source system identifier: harris_pacs, tyler_vision, aumentum, csv_import.</summary>
  [MaxLength(100)]
  public string SourceSystem { get; set; } = "";

  /// <summary>Entity type being synced: parcels, sales, permits, assessments.</summary>
  [MaxLength(100)]
  public string EntityType { get; set; } = "";

  /// <summary>Direction: inbound (external ΓåÆ TF), outbound (TF ΓåÆ external).</summary>
  [MaxLength(20)]
  public string Direction { get; set; } = "inbound";

  /// <summary>Status: queued, running, completed, failed, cancelled.</summary>
  [MaxLength(30)]
  public string Status { get; set; } = "queued";

  /// <summary>Total records to process.</summary>
  public int TotalRecords { get; set; }

  /// <summary>Records successfully processed.</summary>
  public int ProcessedRecords { get; set; }

  /// <summary>Records that failed processing.</summary>
  public int FailedRecords { get; set; }

  /// <summary>Records skipped (duplicates, unchanged).</summary>
  public int SkippedRecords { get; set; }

  /// <summary>Duration in milliseconds.</summary>
  public long DurationMs { get; set; }

  /// <summary>Throughput in records per second.</summary>
  public double RecordsPerSecond { get; set; }

  /// <summary>JSON array of error messages for failed records.</summary>
  [Column(TypeName = "nvarchar(max)")]
  public string? Errors { get; set; }

  /// <summary>JSON details blob with field mappings, transform stats, etc.</summary>
  [Column(TypeName = "nvarchar(max)")]
  public string? Details { get; set; }

  /// <summary>Watermark for incremental sync (e.g., last modified timestamp).</summary>
  public DateTime? Watermark { get; set; }

  [MaxLength(200)]
  public string CreatedBy { get; set; } = "";

  public DateTime StartedAt { get; set; } = DateTime.UtcNow;
  public DateTime? CompletedAt { get; set; }
}
