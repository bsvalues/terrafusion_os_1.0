using System;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Per-parcel improvement detail record. Preserves the Benton Method input set:
/// type/class/method codes, area, value, value source ('A'djusted vs 'F'lat),
/// condition, year built, and the three depreciation percentages (physical,
/// functional, economic) plus completion percentage.
///
/// Parent <c>imprv</c> attributes (PACS) are deferred per Slice A.5 locked decision —
/// recoverable from source via <see cref="SourceImprvId"/> if needed downstream.
/// </summary>
public sealed class ImprovementDetail
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public int SourceImprvId { get; set; }
    public int SourceImprvDetId { get; set; }

    public int AssessmentYear { get; set; }
    public int SupplementNumber { get; set; }

    public string TypeCode { get; set; } = null!;
    public string? ClassCode { get; set; }
    public string? MethodCode { get; set; }
    public decimal? AreaSqFt { get; set; }
    public decimal? Value { get; set; }
    public string? ValueSource { get; set; }
    public string? ConditionCode { get; set; }
    public int? YearBuilt { get; set; }

    public decimal? PhysicalPercent { get; set; }
    public decimal? FunctionalPercent { get; set; }
    public decimal? EconomicPercent { get; set; }
    public decimal? PercentComplete { get; set; }
    public decimal? DepreciationPercent { get; set; }

    public bool IsNewValue { get; set; }

    public string? PayloadHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
