using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities.CMA;

/// <summary>
/// Comparative Market Analysis (CMA) report generated for a subject property.
/// Contains search parameters, comparable property selections, adjustments,
/// and final reconciled value. TMR-006.
/// </summary>
public class CmaReport
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    // ── Subject Property ──

    /// <summary>Parcel number of the subject property being analyzed.</summary>
    [Required]
    [MaxLength(50)]
    public string SubjectParcelNumber { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? SubjectAddress { get; set; }

    [MaxLength(50)]
    public string? SubjectPropertyType { get; set; }

    public int? SubjectYearBuilt { get; set; }
    public decimal? SubjectGrossLivingAreaSqft { get; set; }
    public decimal? SubjectLotSizeSqft { get; set; }
    public int? SubjectBedrooms { get; set; }
    public int? SubjectBathrooms { get; set; }

    [MaxLength(20)]
    public string? SubjectCondition { get; set; }

    [MaxLength(20)]
    public string? SubjectQualityGrade { get; set; }

    // ── Search Parameters ──

    /// <summary>Radius in miles used to find comparables.</summary>
    public double SearchRadiusMiles { get; set; } = 1.0;

    /// <summary>Lookback period in months for sales.</summary>
    public int SearchMonthsBack { get; set; } = 12;

    /// <summary>Minimum number of comparables required.</summary>
    public int MinComparables { get; set; } = 3;

    /// <summary>Maximum number of comparables to include.</summary>
    public int MaxComparables { get; set; } = 10;

    /// <summary>JSON blob of additional search filters applied
    /// (property type, GLA range, year built range, etc.).</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? SearchFilters { get; set; }

    // ── Analysis Results ──

    /// <summary>Number of comparable properties found.</summary>
    public int ComparablesFound { get; set; }

    /// <summary>Number of comparable properties selected for final analysis.</summary>
    public int ComparablesSelected { get; set; }

    /// <summary>Indicated value from the sales comparison approach.</summary>
    public decimal? IndicatedValue { get; set; }

    /// <summary>Low end of the value range.</summary>
    public decimal? ValueRangeLow { get; set; }

    /// <summary>High end of the value range.</summary>
    public decimal? ValueRangeHigh { get; set; }

    /// <summary>Final reconciled value opinion.</summary>
    public decimal? ReconciledValue { get; set; }

    /// <summary>Confidence score from 0.0 to 1.0.</summary>
    public double? ConfidenceScore { get; set; }

    /// <summary>Analysis status: draft, in_progress, completed, reviewed, approved.</summary>
    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "draft";

    /// <summary>Analyst notes or narrative.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? AnalystNotes { get; set; }

    /// <summary>JSON summary of market conditions at time of analysis.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? MarketConditionsSummary { get; set; }

    /// <summary>Effective date of the analysis.</summary>
    public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

    // ── County context ──

    public Guid? CountyId { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ──

    /// <summary>Comparable properties included in this report.</summary>
    public ICollection<CmaComparable> Comparables { get; set; } = new List<CmaComparable>();
}

/// <summary>
/// A single comparable property within a CMA report, including the adjustments
/// applied to reconcile it against the subject property.
/// </summary>
public class CmaComparable
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Parent CMA report.</summary>
    public Guid CmaReportId { get; set; }

    public CmaReport CmaReport { get; set; } = null!;

    /// <summary>Parcel number of the comparable property.</summary>
    [Required]
    [MaxLength(50)]
    public string ParcelNumber { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    // ── Sale Data ──

    public DateTime? SaleDate { get; set; }
    public decimal? SalePrice { get; set; }

    [MaxLength(30)]
    public string? SaleQualification { get; set; }

    // ── Physical Characteristics ──

    [MaxLength(50)]
    public string? PropertyType { get; set; }

    public int? YearBuilt { get; set; }
    public decimal? GrossLivingAreaSqft { get; set; }
    public decimal? LotSizeSqft { get; set; }
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }

    [MaxLength(20)]
    public string? Condition { get; set; }

    [MaxLength(20)]
    public string? QualityGrade { get; set; }

    // ── Proximity ──

    /// <summary>Distance from the subject property in miles.</summary>
    public double? DistanceMiles { get; set; }

    /// <summary>Overall similarity score from 0.0 to 1.0.</summary>
    public double? SimilarityScore { get; set; }

    // ── Adjustments ──

    /// <summary>Market conditions (time) adjustment in dollars.</summary>
    public decimal? AdjustmentMarketConditions { get; set; }

    /// <summary>Location adjustment in dollars.</summary>
    public decimal? AdjustmentLocation { get; set; }

    /// <summary>GLA (size) adjustment in dollars.</summary>
    public decimal? AdjustmentSize { get; set; }

    /// <summary>Age/condition adjustment in dollars.</summary>
    public decimal? AdjustmentAge { get; set; }

    /// <summary>Quality adjustment in dollars.</summary>
    public decimal? AdjustmentQuality { get; set; }

    /// <summary>Site/lot adjustment in dollars.</summary>
    public decimal? AdjustmentSite { get; set; }

    /// <summary>Net total adjustment in dollars.</summary>
    public decimal? NetAdjustment { get; set; }

    /// <summary>Adjusted sale price after all adjustments.</summary>
    public decimal? AdjustedSalePrice { get; set; }

    /// <summary>JSON blob with additional or custom adjustments.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? AdditionalAdjustments { get; set; }

    /// <summary>Weight assigned to this comparable in reconciliation (0.0–1.0).</summary>
    public double? ReconciliationWeight { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
