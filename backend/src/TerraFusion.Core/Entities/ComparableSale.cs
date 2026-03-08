using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Records an actual property sale transaction used as a comparable in
/// the sales comparison approach.
/// Write lane: Forge (TerraForge) — typically ingested from PACS/MLS.
/// </summary>
public class ComparableSale
{
  public Guid Id { get; set; } = Guid.NewGuid();

  [Required]
  [StringLength(50)]
  public string ParcelId { get; set; } = string.Empty;

  [Required]
  public DateTime SaleDate { get; set; }

  [Required]
  public decimal SalePrice { get; set; }

  [Required]
  [StringLength(30)]
  public string PropertyType { get; set; } = "residential";

  [StringLength(200)]
  public string? Address { get; set; }

  [StringLength(50)]
  public string? Neighborhood { get; set; }

  // ── Physical Characteristics ──
  public decimal? GrossLivingArea { get; set; }
  public decimal? LotSizeSqft { get; set; }
  public int? YearBuilt { get; set; }
  public int? Bedrooms { get; set; }
  public int? Bathrooms { get; set; }

  [StringLength(20)]
  public string? Condition { get; set; } // poor | fair | average | good | excellent

  [StringLength(20)]
  public string? QualityGrade { get; set; }

  // ── Sale Qualification ──
  [StringLength(30)]
  public string SaleQualification { get; set; } = "qualified"; // qualified | non-arms-length | foreclosure | estate

  public bool IsVerified { get; set; }

  [StringLength(200)]
  public string? VerificationSource { get; set; }

  // ── Ownership ──
  public Guid CountyId { get; set; }
  public County County { get; set; } = null!;

  [StringLength(100)]
  public string IngestedBy { get; set; } = "system";
  public DateTime IngestedAt { get; set; } = DateTime.UtcNow;
}
