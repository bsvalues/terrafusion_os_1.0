using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Persistent record of a completed property valuation.
/// Stores results from all three approaches (cost, income, sales) and the
/// final reconciled value. Each record is immutable once sealed.
/// Write lane: Forge (TerraForge).
/// </summary>
public class ValuationRecord
{
  public Guid Id { get; set; } = Guid.NewGuid();

  [Required]
  [StringLength(50)]
  public string ParcelId { get; set; } = string.Empty;

  [Required]
  public int TaxYear { get; set; }

  [Required]
  [StringLength(30)]
  public string PropertyType { get; set; } = "residential";

  // ── Cost Approach ──
  public decimal? CostApproachValue { get; set; }
  [StringLength(20)]
  public string? CostConfidence { get; set; }
  [StringLength(10)]
  public string? BuildingType { get; set; }
  [StringLength(30)]
  public string? Region { get; set; }
  public decimal? SquareFeet { get; set; }
  public decimal? Rcn { get; set; }
  public decimal? DepreciationPercent { get; set; }
  public decimal? Rcnld { get; set; }
  public decimal? LandValue { get; set; }
  public decimal? SiteImprovementValue { get; set; }

  // ── Income Approach ──
  public decimal? IncomeApproachValue { get; set; }
  [StringLength(20)]
  public string? IncomeConfidence { get; set; }
  public decimal? GrossIncome { get; set; }
  public decimal? VacancyRate { get; set; }
  public decimal? OperatingExpenses { get; set; }
  public decimal? NetOperatingIncome { get; set; }
  public decimal? CapRate { get; set; }

  // ── Sales Comparison Approach ──
  public decimal? SalesComparisonValue { get; set; }
  [StringLength(20)]
  public string? SalesConfidence { get; set; }
  public int? ComparableCount { get; set; }
  public decimal? MedianAdjustedPrice { get; set; }

  // ── Reconciliation ──
  public decimal? FinalReconciledValue { get; set; }
  public decimal? Spread { get; set; }
  [StringLength(20)]
  public string? OverallConfidence { get; set; }

  // ── Status ──
  [Required]
  [StringLength(20)]
  public string Status { get; set; } = "draft"; // draft | reviewed | sealed

  [StringLength(500)]
  public string? Notes { get; set; }

  // ── Ownership ──
  public Guid CountyId { get; set; }
  public County County { get; set; } = null!;

  [StringLength(100)]
  public string CreatedBy { get; set; } = "system";
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  public DateTime? ReviewedAt { get; set; }
  [StringLength(100)]
  public string? ReviewedBy { get; set; }
}
