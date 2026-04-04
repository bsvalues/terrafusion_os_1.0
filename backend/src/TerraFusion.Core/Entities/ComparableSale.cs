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
  // All fields below are copied verbatim from the PACS Sale table (and chg_of_owner) at sync time.
  // Never interpreted, transformed, or defaulted by TerraFusion.
  // Field names map 1:1 to PACS column names documented in PACS 9.0 Database Table Guide.

  // ── PACS reference keys ──
  public int? PacsChgOfOwnerId { get; set; }            // chg_of_owner.chg_of_owner_id — PACS sale record ID (for traceability)
  public int? ExciseNumber { get; set; }                 // chg_of_owner.excise_number — WA recorder's office REET excise number

  // ── Qualification / ratio study codes ──
  [StringLength(10)]
  public string? RawSaleQualifier { get; set; }          // sale.sl_qualifier — generic sale qualifier code

  [StringLength(10)]
  public string? RawCountyRatioCd { get; set; }          // sale.sl_county_ratio_cd — county's qualified/unqualified call

  [StringLength(10)]
  public string? RawRatioTypeCd { get; set; }            // sale.sl_ratio_type_cd — WA State DOR ratio study type code (e.g. "100")

  [StringLength(10)]
  public string? RawRatioCd { get; set; }                // sale.sl_ratio_cd — PACS sale ratio code (maps to sale_ratio_type.sl_ratio_type_cd)

  [StringLength(100)]
  public string? RawRatioCdReason { get; set; }          // sale.sl_ratio_cd_reason — reason text for DOR report (e.g. "Gift- Grantee pays debt")

  [StringLength(10)]
  public string? RawExcludeCalcCd { get; set; }          // sale.sales_exclude_calc_cd — exclude from calculations code (used with include_no_calc)

  [StringLength(32)]
  public string? RawWacCd { get; set; }                  // sale.wac_cd — WAC 458-61A REET exemption code (e.g. "458-61A-205(2)")

  // ── Price / adjustments ──
  // IMPORTANT: adjusted_sl_price is the price used for ratio study calcs, NOT sl_price.
  public decimal? AdjustedSalePrice { get; set; }        // sale.adjusted_sl_price — adjusted sale price used in ratio study (sl_price ± adjustments)

  public decimal? SaleAdjustmentAmount { get; set; }     // sale.sl_adj_sl_amt — dollar amount of price adjustment (negative = downward adj)

  [StringLength(50)]
  public string? RawAdjReason { get; set; }              // sale.sl_adj_rsn — sale price adjustment reason text (verbatim)

  [StringLength(5)]
  public string? RawAdjCode { get; set; }                // sale.sl_adj_cd — sale price adjustment reason code

  public decimal? SaleExemptionAmount { get; set; }      // sale.exemption_amount — REET exemption amount (partial exemption applied to this sale)

  // ── PACS pre-computed ratio ──
  public decimal? PacsComputedRatio { get; set; }        // sale.sl_ratio — PACS-computed ratio (assessed_val / sl_price * 100); not used for TF calcs but preserved for audit

  // ── Sale type / deed metadata ──
  [StringLength(5)]
  public string? RawSaleTypeCode { get; set; }           // sale.sl_type_cd — sale type code (e.g. "SWD" = Statutory Warranty Deed, "WD" = Warranty Deed)

  [StringLength(5)]
  public string? RawFinancingCode { get; set; }          // sale.sl_financing_cd — financing type code

  // ── Ratio report suppression ──
  [StringLength(5)]
  public string? SuppressOnRatioRptCd { get; set; }      // sale.suppress_on_ratio_rpt_cd — "T" / "F": suppress from DOR ratio report

  [StringLength(30)]
  public string? SuppressOnRatioReason { get; set; }     // sale.suppress_on_ratio_rsn — reason this sale is suppressed from the report

  public bool? IncludeNoCalc { get; set; }               // sale.include_no_calc — in ratio report but excluded from IAAO calculations

  // ── Washington-specific flags ──
  public bool? LandOnlySale { get; set; }                // sale.land_only_sale — true = land-only sale; ratio calculated on land value only

  public bool? ContinueCurrentUse { get; set; }          // sale.continue_current_use — WA: current use (open space/farm/timber) designation must continue

  public int? SalesYear { get; set; }                    // sale.sales_year — PACS DOR ratio study year assignment (may differ from SaleDate.Year)

  // ── Physical characteristics frozen at time of sale ──
  // PACS imports these from the property record at the time of sale (sl_living_area vs current imprv data).
  // Use these for ratio study comps — NOT the live GrossLivingArea / LotSizeSqft fields.
  public decimal? SlLivingArea { get; set; }             // sale.sl_living_area — living area at time of sale

  public int? SlYearBuilt { get; set; }                  // sale.sl_yr_blt — year built at time of sale

  public decimal? SlLandAcres { get; set; }              // sale.sl_land_acres — land acres at time of sale

  public decimal? SlLandSqft { get; set; }               // sale.sl_land_sqft — land square footage at time of sale

  // ── Comments ──
  [StringLength(500)]
  public string? RawComment { get; set; }                // sale.sl_comment — general sale comment (staff notes, clerk notes)

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
