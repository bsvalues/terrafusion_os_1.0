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

  // ── Layer 1: Raw PACS Import Codes (verbatim source facts) ──
  // Copied exactly from PACS at sync time. Never interpreted, transformed, or judged.
  // These are facts about what PACS recorded — not TerraFusion's opinion.
  [StringLength(10)]
  public string? RawSaleQualifier { get; set; }   // PACS SaleQualifier

  [StringLength(10)]
  public string? RawCountyRatioCd { get; set; }   // PACS SaleCountyRatioCd

  [StringLength(10)]
  public string? RawExcludeCalcCd { get; set; }   // PACS SalesExcludeCalcCd

  [StringLength(32)]
  public string? RawWacCd { get; set; }            // PACS WacCd (WAC 458-61A)

  // ── Layer 2: TerraFusion Qualification Recommendation (rule engine, post-sync) ──
  // Computed by SaleQualificationService.ComputeRecommendations() — always run AFTER ingest.
  // Never set during sync. Recomputable at any time from Layer 1 raw codes.
  [StringLength(30)]
  public string? QualificationRecommendation { get; set; }   // qualified | non-arms-length | foreclosure | estate | excluded: {code} | exempt: {code}

  [StringLength(200)]
  public string? RecommendationReason { get; set; }           // which PACS code triggered this recommendation

  [StringLength(50)]
  public string? RecommendationSource { get; set; }           // "TerraFusionRuleEngine"

  [StringLength(20)]
  public string? RecommendationVersion { get; set; }          // rule set version, e.g. "1.0"

  // ── Layer 3: Assessor Final Decision (human authority — final word) ──
  // Null = no explicit decision; ValuationService falls back to QualificationRecommendation.
  // Non-null = assessor's explicit determination; always wins over recommendation.
  // Raw PACS codes are facts. TerraFusion recommendation is a suggestion. Assessor decision is law.
  [StringLength(30)]
  public string? QualificationDecision { get; set; }          // qualified | non-arms-length | foreclosure | estate | excluded | exempt

  [StringLength(500)]
  public string? DecisionReason { get; set; }                 // assessor's stated reason

  [StringLength(100)]
  public string? DecisionBy { get; set; }                     // who made the decision

  public DateTime? DecisionAt { get; set; }                   // when the decision was made

  [StringLength(50)]
  public string? DecisionSource { get; set; }                 // "AssessorOverride" | "AcceptedRecommendation"

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
