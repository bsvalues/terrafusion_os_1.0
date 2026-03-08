using System;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// R2 Wave 30 — RCW calculation result with county isolation.
/// Stores results from Washington State RCW exemption/special-use calculators.
/// </summary>
public class RcwCalculation
{
    [Key]
    public int Id { get; set; }

    [Required]
    public Guid CountyId { get; set; }

    /// <summary>RCW statute: rcw_84_34 (Open Space), rcw_84_26 (Historic), rcw_84_36_381 (Senior/Disabled)</summary>
    [Required]
    [MaxLength(50)]
    public string Statute { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ParcelId { get; set; } = string.Empty;

    /// <summary>Current Use classification for RCW 84.34.</summary>
    [MaxLength(50)]
    public string CurrentUseClassification { get; set; } = string.Empty;

    /// <summary>Market value (full, unreduced).</summary>
    public decimal MarketValue { get; set; }

    /// <summary>Assessed / reduced value after exemption.</summary>
    public decimal ReducedValue { get; set; }

    /// <summary>Exemption amount (MarketValue - ReducedValue).</summary>
    public decimal ExemptionAmount { get; set; }

    /// <summary>Tax savings at the given levy rate.</summary>
    public decimal TaxSavings { get; set; }

    /// <summary>Levy rate used (mills / $1000 or percentage).</summary>
    public double LevyRate { get; set; }

    /// <summary>Tax year the calculation applies to.</summary>
    public int TaxYear { get; set; }

    /// <summary>Income (for Senior/Disabled means-test).</summary>
    public decimal Income { get; set; }

    /// <summary>JSON with statute-specific detail (e.g., age, classification, acreage).</summary>
    public string Details { get; set; } = "{}";

    /// <summary>Whether the applicant qualifies under this statute.</summary>
    public bool Qualifies { get; set; }

    /// <summary>Reason for disqualification (empty if qualifies).</summary>
    [MaxLength(500)]
    public string DisqualificationReason { get; set; } = string.Empty;

    [MaxLength(200)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
