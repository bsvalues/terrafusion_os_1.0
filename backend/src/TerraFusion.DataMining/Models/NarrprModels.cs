using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.DataMining.Models;

/// <summary>
/// Top-level property report scraped from NARRPR (National Association of
/// REALTORS Realtors Property Resource). TMR-008.
/// </summary>
public class NarrprPropertyReport
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Parcel number used to join with county records.</summary>
    [Required]
    [MaxLength(50)]
    public string ParcelNumber { get; set; } = string.Empty;

    /// <summary>NARRPR internal report/property ID.</summary>
    [MaxLength(50)]
    public string? NarrprId { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(10)]
    public string? State { get; set; }

    [MaxLength(15)]
    public string? ZipCode { get; set; }

    [MaxLength(100)]
    public string? County { get; set; }

    // ── Property Characteristics ──

    [MaxLength(50)]
    public string? PropertyType { get; set; }

    [MaxLength(50)]
    public string? PropertySubType { get; set; }

    public int? YearBuilt { get; set; }
    public decimal? GrossLivingAreaSqft { get; set; }
    public decimal? LotSizeSqft { get; set; }
    public decimal? LotSizeAcres { get; set; }
    public int? Bedrooms { get; set; }
    public decimal? Bathrooms { get; set; }
    public int? Stories { get; set; }
    public int? GarageSpaces { get; set; }

    [MaxLength(30)]
    public string? FoundationType { get; set; }

    [MaxLength(30)]
    public string? RoofType { get; set; }

    [MaxLength(30)]
    public string? ExteriorMaterial { get; set; }

    [MaxLength(30)]
    public string? HeatingType { get; set; }

    [MaxLength(30)]
    public string? CoolingType { get; set; }

    public bool? HasPool { get; set; }
    public bool? HasFireplace { get; set; }

    // ── Valuation ──

    /// <summary>NARRPR estimated value.</summary>
    public decimal? EstimatedValue { get; set; }

    public decimal? EstimatedValueLow { get; set; }
    public decimal? EstimatedValueHigh { get; set; }

    /// <summary>Confidence level of the estimate (high, medium, low).</summary>
    [MaxLength(20)]
    public string? ValuationConfidence { get; set; }

    // ── Tax Information ──

    public decimal? TaxAssessedValue { get; set; }
    public int? TaxYear { get; set; }
    public decimal? AnnualTaxAmount { get; set; }

    // ── Owner Information (public record only) ──

    [MaxLength(200)]
    public string? OwnerName { get; set; }

    [MaxLength(30)]
    public string? OwnerOccupied { get; set; }

    // ── Market Context ──

    [MaxLength(100)]
    public string? MarketArea { get; set; }

    [MaxLength(100)]
    public string? SchoolDistrict { get; set; }

    /// <summary>Flood zone designation if available.</summary>
    [MaxLength(20)]
    public string? FloodZone { get; set; }

    // ── Data Source Tracking ──

    /// <summary>Timestamp when the NARRPR report was scraped.</summary>
    public DateTime? ScrapedAt { get; set; }

    /// <summary>NARRPR report URL or identifier (not credentials).</summary>
    [MaxLength(1000)]
    public string? SourceUrl { get; set; }

    /// <summary>Report generation date from NARRPR.</summary>
    public DateTime? ReportDate { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ──

    public ICollection<NarrprSaleRecord> SaleHistory { get; set; } = new List<NarrprSaleRecord>();
    public ICollection<NarrprComparable> Comparables { get; set; } = new List<NarrprComparable>();
}

/// <summary>
/// Historical sale record extracted from a NARRPR property report.
/// </summary>
public class NarrprSaleRecord
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long NarrprPropertyReportId { get; set; }
    public NarrprPropertyReport NarrprPropertyReport { get; set; } = null!;

    public DateTime? SaleDate { get; set; }
    public decimal? SalePrice { get; set; }

    [MaxLength(100)]
    public string? SaleType { get; set; }

    [MaxLength(100)]
    public string? RecordingNumber { get; set; }

    [MaxLength(200)]
    public string? Buyer { get; set; }

    [MaxLength(200)]
    public string? Seller { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Comparable property suggested by NARRPR within a property report.
/// </summary>
public class NarrprComparable
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long NarrprPropertyReportId { get; set; }
    public NarrprPropertyReport NarrprPropertyReport { get; set; } = null!;

    [MaxLength(50)]
    public string? ParcelNumber { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    public DateTime? SaleDate { get; set; }
    public decimal? SalePrice { get; set; }

    public decimal? GrossLivingAreaSqft { get; set; }
    public decimal? LotSizeSqft { get; set; }
    public int? YearBuilt { get; set; }
    public int? Bedrooms { get; set; }
    public decimal? Bathrooms { get; set; }

    /// <summary>Distance from subject property in miles.</summary>
    public double? DistanceMiles { get; set; }

    /// <summary>Similarity score assigned by NARRPR (0–100).</summary>
    public double? SimilarityScore { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
