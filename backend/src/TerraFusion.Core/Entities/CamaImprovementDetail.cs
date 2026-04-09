using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Per-segment improvement detail canonicalized from PacsImprovementDetail.
/// Each row represents one building segment (MA, CovPatio, Patio, Shop, etc.)
/// for a given parcel and tax year.
///
/// Preserves the PACS cost matrix join keys (MethodCode, ClassCode, SegmentType,
/// SubClassCode) so CostForge can re-derive segment valuations against calibrated
/// matrices without touching PACS directly.
///
/// Boundary rule: written only by PacsCanonicalizer. Read by ForgeController and
/// CostForge services. Never written by assessor workflow tools.
/// </summary>
[Table("cama_improvement_details")]
[Index(nameof(ParcelId), nameof(TaxYear), Name = "IX_CamaImprvDet_ParcelYear")]
public class CamaImprovementDetail
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    [Required]
    public int TaxYear { get; set; }

    /// <summary>
    /// Segment type code from PACS ImprvDetTypeCd. Cost matrix join key.
    /// Examples: MA (main area), CovPatio, Patio, Shop, Garage, BSMT.
    /// </summary>
    [StringLength(10)]
    public string? SegmentType { get; set; }

    /// <summary>Human-readable description from PACS ImprvDetDesc.</summary>
    [StringLength(100)]
    public string? SegmentDesc { get; set; }

    /// <summary>
    /// Method code from PACS ImprvDetMethCd. Cost matrix join key.
    /// Example: EXT-B (exterior base rate method).
    /// </summary>
    [StringLength(5)]
    public string? MethodCode { get; set; }

    /// <summary>
    /// Class/quality code from PACS ImprvDetClassCd. Cost matrix join key and
    /// quality tier indicator. Examples: chp, fair, Avg, Good, VGD, EXC.
    /// </summary>
    [StringLength(10)]
    public string? ClassCode { get; set; }

    /// <summary>
    /// Sub-class code from PACS ImprvDetSubClassCd. Cost matrix join key.
    /// * = standard tier within class, + = plus tier within class.
    /// </summary>
    [StringLength(10)]
    public string? SubClassCode { get; set; }

    /// <summary>PACS condition code. Examples: VGD, Good, Avg, Fair, Poor.</summary>
    [StringLength(5)]
    public string? ConditionCode { get; set; }

    /// <summary>Segment floor area in square feet from PACS ImprvDetArea.</summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// PACS-published cost per square foot (ImprvDetUnitPrice).
    /// This is the matrix-sourced rate before area multiplication and depreciation.
    /// </summary>
    public decimal? UnitPrice { get; set; }

    /// <summary>
    /// PACS-computed segment value before depreciation (ImprvDetCalcVal).
    /// Equals Area × UnitPrice × adjustment factors.
    /// </summary>
    public decimal? CalcValue { get; set; }

    /// <summary>
    /// PACS-computed depreciated replacement cost new for this segment
    /// (DepreciatedReplacementCostNew). Sum across all segments equals ImprvVal.
    /// </summary>
    public decimal? DepreciatedRCN { get; set; }

    /// <summary>Physical percent-good for this segment (0–100 scale, from PACS).</summary>
    public decimal? PhysicalPct { get; set; }

    /// <summary>Total depreciation percent for this segment (0–100 scale, from PACS DepPct).</summary>
    public decimal? DepPct { get; set; }

    /// <summary>Year this segment was built (from PACS ImprvDetYearBuilt).</summary>
    public int? YearBuilt { get; set; }

    public Guid CountyId { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
