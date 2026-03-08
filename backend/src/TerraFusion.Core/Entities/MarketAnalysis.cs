using System;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// R2 Wave 29 ΓÇö Market area analysis result with county isolation.
/// Stores market area delineation, comparable sales analysis, time-trend adjustments.
/// </summary>
public class MarketAnalysis
{
    [Key]
    public int Id { get; set; }

    /// <summary>County isolation (sovereign county model).</summary>
    [Required]
    public Guid CountyId { get; set; }

    /// <summary>Analysis type: market_area_delineation | comparable_sales | time_trend | ratio_study</summary>
    [Required]
    [MaxLength(50)]
    public string AnalysisType { get; set; } = string.Empty;

    /// <summary>Human-readable market area name (e.g. "Kennewick NW Residential").</summary>
    [MaxLength(200)]
    public string MarketAreaName { get; set; } = string.Empty;

    /// <summary>JSON array of parcel IDs included in the analysis.</summary>
    public string ParcelIds { get; set; } = "[]";

    /// <summary>Number of parcels / observations.</summary>
    public int SampleSize { get; set; }

    // ΓöÇΓöÇ Comparable Sales Statistics ΓöÇΓöÇ

    /// <summary>Median sale price in the market area.</summary>
    public decimal MedianSalePrice { get; set; }

    /// <summary>Mean sale price.</summary>
    public decimal MeanSalePrice { get; set; }

    /// <summary>Price per square-foot (median).</summary>
    public decimal MedianPricePerSqft { get; set; }

    /// <summary>Coefficient of dispersion (COD) ΓÇö ratio-study quality metric.</summary>
    public double CoefficientOfDispersion { get; set; }

    /// <summary>Price-related differential (PRD) ΓÇö vertical equity metric.</summary>
    public double PriceRelatedDifferential { get; set; }

    /// <summary>Median assessment ratio (assessed / sale).</summary>
    public double MedianRatio { get; set; }

    // ΓöÇΓöÇ Time Trend ΓöÇΓöÇ

    /// <summary>Monthly time-trend coefficient (percent change per month).</summary>
    public double TimeTrendCoefficient { get; set; }

    /// <summary>R-squared of time-trend regression.</summary>
    public double TimeTrendRSquared { get; set; }

    /// <summary>Start date of analysis period.</summary>
    public DateTime PeriodStart { get; set; }

    /// <summary>End date of analysis period.</summary>
    public DateTime PeriodEnd { get; set; }

    // ΓöÇΓöÇ Market Area Delineation ΓöÇΓöÇ

    /// <summary>JSON object with boundary or clustering info for the market area.</summary>
    public string MarketAreaBoundary { get; set; } = "{}";

    /// <summary>JSON array of comparable-sale summary records.</summary>
    public string ComparableSummary { get; set; } = "[]";

    /// <summary>JSON object with additional statistics or breakdowns.</summary>
    public string AdditionalMetrics { get; set; } = "{}";

    // ΓöÇΓöÇ Audit ΓöÇΓöÇ

    [MaxLength(200)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
