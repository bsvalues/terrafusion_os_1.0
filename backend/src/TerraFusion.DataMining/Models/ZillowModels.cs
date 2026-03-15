using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.DataMining.Models;

/// <summary>
/// Aggregated market-level data scraped or ingested from Zillow for a
/// geographic area (zip code, neighborhood, city). TMR-007.
/// </summary>
public class ZillowMarketData
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Geographic region type: zipcode, neighborhood, city, county.</summary>
    [Required]
    [MaxLength(30)]
    public string RegionType { get; set; } = "zipcode";

    /// <summary>Region identifier (e.g. "99336", "Richland", "Benton County").</summary>
    [Required]
    [MaxLength(200)]
    public string RegionName { get; set; } = string.Empty;

    /// <summary>Zillow region ID when available.</summary>
    [MaxLength(50)]
    public string? ZillowRegionId { get; set; }

    // ── Market Metrics ──

    /// <summary>Zillow Home Value Index (ZHVI) — typical home value for the region.</summary>
    public decimal? Zhvi { get; set; }

    /// <summary>Median list price of active listings.</summary>
    public decimal? MedianListPrice { get; set; }

    /// <summary>Median sale price of closed sales.</summary>
    public decimal? MedianSalePrice { get; set; }

    /// <summary>Median price per square foot.</summary>
    public decimal? MedianPricePerSqft { get; set; }

    /// <summary>Median days on market for sold listings.</summary>
    public int? MedianDaysOnMarket { get; set; }

    /// <summary>Sale-to-list price ratio (e.g. 0.98 = 98%).</summary>
    public double? SaleToListRatio { get; set; }

    /// <summary>Number of homes sold in the period.</summary>
    public int? HomesSold { get; set; }

    /// <summary>Number of new listings in the period.</summary>
    public int? NewListings { get; set; }

    /// <summary>Current active inventory count.</summary>
    public int? ActiveInventory { get; set; }

    /// <summary>Months of supply (inventory / absorption rate).</summary>
    public double? MonthsOfSupply { get; set; }

    /// <summary>Year-over-year home value change as a decimal (e.g. 0.05 = +5%).</summary>
    public double? YoyValueChange { get; set; }

    /// <summary>Month of data collection (YYYY-MM format).</summary>
    [MaxLength(10)]
    public string? DataMonth { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ──

    public ICollection<ZillowPriceTrend> PriceTrends { get; set; } = new List<ZillowPriceTrend>();
}

/// <summary>
/// Monthly price trend data point within a Zillow market data region.
/// </summary>
public class ZillowPriceTrend
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Parent market data record.</summary>
    public long ZillowMarketDataId { get; set; }

    public ZillowMarketData ZillowMarketData { get; set; } = null!;

    /// <summary>Date of the data point (typically first of the month).</summary>
    public DateTime Date { get; set; }

    /// <summary>ZHVI value at this date.</summary>
    public decimal? Zhvi { get; set; }

    /// <summary>Median sale price at this date.</summary>
    public decimal? MedianSalePrice { get; set; }

    /// <summary>Median list price at this date.</summary>
    public decimal? MedianListPrice { get; set; }

    /// <summary>Number of sales in this month.</summary>
    public int? SalesCount { get; set; }

    /// <summary>Inventory count at this date.</summary>
    public int? InventoryCount { get; set; }

    // ── Audit fields ──

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Individual property record from Zillow, capturing Zestimate and
/// property detail snapshot.
/// </summary>
public class ZillowProperty
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Zillow property ID (zpid).</summary>
    [MaxLength(30)]
    public string? Zpid { get; set; }

    /// <summary>Parcel number used to join with county records.</summary>
    [MaxLength(50)]
    public string? ParcelNumber { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(10)]
    public string? State { get; set; }

    [MaxLength(15)]
    public string? ZipCode { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // ── Valuation ──

    /// <summary>Current Zestimate value.</summary>
    public decimal? Zestimate { get; set; }

    /// <summary>Zestimate low range.</summary>
    public decimal? ZestimateLow { get; set; }

    /// <summary>Zestimate high range.</summary>
    public decimal? ZestimateHigh { get; set; }

    /// <summary>Zillow Rent Zestimate.</summary>
    public decimal? RentZestimate { get; set; }

    // ── Characteristics ──

    [MaxLength(50)]
    public string? PropertyType { get; set; }

    public int? YearBuilt { get; set; }
    public decimal? LivingAreaSqft { get; set; }
    public decimal? LotSizeSqft { get; set; }
    public int? Bedrooms { get; set; }
    public decimal? Bathrooms { get; set; }

    // ── Last Sale ──

    public DateTime? LastSaleDate { get; set; }
    public decimal? LastSalePrice { get; set; }

    // ── Listing Status ──

    [MaxLength(30)]
    public string? ListingStatus { get; set; }

    public decimal? ListPrice { get; set; }
    public int? DaysOnZillow { get; set; }

    // ── Tax ──

    public decimal? TaxAssessedValue { get; set; }
    public int? TaxYear { get; set; }
    public decimal? AnnualTaxAmount { get; set; }

    // ── Data Source Tracking ──

    /// <summary>URL or identifier of the Zillow page scraped.</summary>
    [MaxLength(1000)]
    public string? SourceUrl { get; set; }

    public DateTime? ScrapedAt { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
