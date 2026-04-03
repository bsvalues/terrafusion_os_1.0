using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Detailed CAMA (Computer Assisted Mass Appraisal) property characteristics.
/// Captures the physical attributes needed for the cost approach.
/// Write lane: Forge (TerraForge) — synced from Harris PACS.
/// </summary>
public class CamaCharacteristic
{
  public Guid Id { get; set; } = Guid.NewGuid();

  [Required]
  [StringLength(50)]
  public string ParcelId { get; set; } = string.Empty;

  [Required]
  public int TaxYear { get; set; }

  // ── Building Classification ──
  [Required]
  [StringLength(10)]
  public string BuildingType { get; set; } = string.Empty; // R1, R2, C1-C4, I1, A1-A2, S1, S2

  [StringLength(50)]
  public string? BuildingTypeDescription { get; set; }

  [StringLength(30)]
  public string? Region { get; set; }

  // ── Dimensions ──
  public decimal SquareFeet { get; set; }
  public decimal? Stories { get; set; }
  public decimal? BasementSqft { get; set; }
  public decimal? GarageSqft { get; set; }

  // ── Quality / Condition ──
  [StringLength(20)]
  public string? QualityGrade { get; set; } // ECONOMY, FAIR, STANDARD, GOOD, EXCELLENT, LUXURY

  [StringLength(20)]
  public string? ConditionGrade { get; set; } // POOR, FAIR, GOOD, EXCELLENT

  [StringLength(20)]
  public string? ComplexityGrade { get; set; } // SIMPLE, STANDARD, COMPLEX, HIGHLY_COMPLEX

  // ── Construction Details ──
  [StringLength(30)]
  public string? ExteriorWall { get; set; }

  [StringLength(30)]
  public string? RoofType { get; set; }

  [StringLength(30)]
  public string? Foundation { get; set; }

  [StringLength(30)]
  public string? HvacType { get; set; }

  [StringLength(30)]
  public string? InteriorFinish { get; set; }

  // ── Age / Life ──
  public int? YearBuilt { get; set; }
  public int? EffectiveAge { get; set; }
  public int? EconomicLife { get; set; }

  // ── Land ──
  public decimal? LandAreaSqft { get; set; }

  [StringLength(50)]
  public string? LandZone { get; set; }
  public decimal? LandAdjustmentFactor { get; set; }

  // ── Features ──
  public int? Bedrooms { get; set; }
  public int? Bathrooms { get; set; }
  public int? Fireplaces { get; set; }
  public bool? HasPool { get; set; }

  // ── County Cost Model (from pacs_improvements — Benton County's own cost approach) ──
  public decimal? ImprvVal { get; set; }              // County's pre-computed improvement value
  public decimal? PhysicalDepreciationPct { get; set; } // Physical depreciation % from PACS
  public decimal? DepreciationPct { get; set; }       // Total (combined) depreciation % from PACS

  // ── Obsolescence ──
  public decimal? FunctionalObsolescence { get; set; }
  public decimal? ExternalObsolescence { get; set; }

  // ── Ownership ──
  public Guid CountyId { get; set; }
  public County County { get; set; } = null!;

  [StringLength(100)]
  public string UpdatedBy { get; set; } = "system";
  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
