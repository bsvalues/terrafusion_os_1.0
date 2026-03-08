// TerraFusion OS — Wave 35: Valuation Pipeline
// Tracks end-to-end valuation pipeline runs with stage-level metrics.

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Records a full valuation pipeline execution across multiple stages
/// (data ingestion, quality check, cost approach, sales comp, income approach,
///  reconciliation, review, certification).
/// </summary>
public class ValuationPipeline
{
  [Key]
  [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
  public int Id { get; set; }

  /// <summary>County tenant key.</summary>
  public Guid CountyId { get; set; }

  /// <summary>Pipeline run name (e.g. "2026-annual-reval").</summary>
  [MaxLength(200)]
  public string PipelineName { get; set; } = string.Empty;

  /// <summary>Tax year this pipeline targets.</summary>
  public int TaxYear { get; set; }

  /// <summary>Total parcels in scope.</summary>
  public int TotalParcels { get; set; }

  /// <summary>Parcels that completed all stages.</summary>
  public int CompletedParcels { get; set; }

  /// <summary>Parcels that failed at any stage.</summary>
  public int FailedParcels { get; set; }

  /// <summary>Parcels still in progress.</summary>
  public int InProgressParcels { get; set; }

  /// <summary>Current stage: ingestion|quality|cost|sales|income|reconciliation|review|certified.</summary>
  [MaxLength(50)]
  public string CurrentStage { get; set; } = "ingestion";

  /// <summary>Overall status: queued|running|completed|failed|cancelled.</summary>
  [MaxLength(30)]
  public string Status { get; set; } = "queued";

  /// <summary>Total duration in milliseconds.</summary>
  public long DurationMs { get; set; }

  /// <summary>Average value change percentage from prior year.</summary>
  public double AvgValueChangePercent { get; set; }

  /// <summary>Median value change percentage.</summary>
  public double MedianValueChangePercent { get; set; }

  /// <summary>Coefficient of dispersion (lower is better).</summary>
  public double CoefficientOfDispersion { get; set; }

  /// <summary>Price-related differential (ideal: 1.00).</summary>
  public double PriceRelatedDifferential { get; set; }

  /// <summary>Stage-level timing and counts (JSON).</summary>
  [Column(TypeName = "text")]
  public string? StageDetails { get; set; }

  /// <summary>Error details (JSON).</summary>
  [Column(TypeName = "text")]
  public string? Errors { get; set; }

  /// <summary>User who initiated the pipeline.</summary>
  [MaxLength(200)]
  public string? CreatedBy { get; set; }

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
