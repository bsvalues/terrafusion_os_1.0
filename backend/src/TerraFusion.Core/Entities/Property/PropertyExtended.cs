using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities.Property;

/// <summary>
/// Extended property model that aggregates data from multiple external sources
/// (Zillow, ATTOM, NARRPR, PACMLS, county GIS) for mass appraisal. TMR-005.
/// Links back to the core <see cref="Entities.Property"/> entity via ParcelNumber.
/// </summary>
public class PropertyExtended
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>County parcel number — the universal join key across all sources.</summary>
    [Required]
    [MaxLength(50)]
    public string ParcelNumber { get; set; } = string.Empty;

    /// <summary>Active MLS number, if currently listed or recently sold via MLS.</summary>
    [MaxLength(30)]
    public string? MlsNumber { get; set; }

    // ── Address ──

    [MaxLength(500)]
    public string? FullAddress { get; set; }

    [MaxLength(200)]
    public string? StreetAddress { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(10)]
    public string? State { get; set; }

    [MaxLength(15)]
    public string? ZipCode { get; set; }

    [MaxLength(100)]
    public string? County { get; set; }

    // ── Location ──

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    [MaxLength(20)]
    public string? CensusTract { get; set; }

    [MaxLength(50)]
    public string? Neighborhood { get; set; }

    // ── Property Characteristics ──

    [MaxLength(50)]
    public string? PropertyType { get; set; }

    [MaxLength(50)]
    public string? PropertySubType { get; set; }

    [MaxLength(50)]
    public string? ZoningCode { get; set; }

    public int? YearBuilt { get; set; }
    public int? EffectiveYearBuilt { get; set; }

    /// <summary>Gross living area in square feet.</summary>
    public decimal? GrossLivingAreaSqft { get; set; }

    /// <summary>Total building area including non-living spaces.</summary>
    public decimal? TotalBuildingAreaSqft { get; set; }

    /// <summary>Lot size in square feet.</summary>
    public decimal? LotSizeSqft { get; set; }

    /// <summary>Lot size in acres.</summary>
    public decimal? LotSizeAcres { get; set; }

    public int? Bedrooms { get; set; }
    public int? BathroomsFull { get; set; }
    public int? BathroomsHalf { get; set; }
    public int? Stories { get; set; }
    public int? GarageSpaces { get; set; }

    [MaxLength(30)]
    public string? GarageType { get; set; }

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
    public bool? HasBasement { get; set; }

    /// <summary>Condition rating: poor, fair, average, good, excellent.</summary>
    [MaxLength(20)]
    public string? Condition { get; set; }

    /// <summary>Quality grade: low, average, above_average, high, luxury.</summary>
    [MaxLength(20)]
    public string? QualityGrade { get; set; }

    // ── Tax Information ──

    public int? TaxYear { get; set; }
    public decimal? AssessedValueTotal { get; set; }
    public decimal? AssessedValueLand { get; set; }
    public decimal? AssessedValueImprovement { get; set; }
    public decimal? MarketValueTotal { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? TaxRate { get; set; }

    // ── Sales History (most recent) ──

    public DateTime? LastSaleDate { get; set; }
    public decimal? LastSalePrice { get; set; }

    [MaxLength(100)]
    public string? LastSaleType { get; set; }

    [MaxLength(100)]
    public string? LastSaleRecordingNumber { get; set; }

    // ── External Valuations ──

    /// <summary>Zillow Zestimate value.</summary>
    public decimal? ZillowZestimate { get; set; }

    public DateTime? ZillowZestimateDate { get; set; }

    /// <summary>ATTOM automated valuation model (AVM) value.</summary>
    public decimal? AttomAvm { get; set; }

    public DateTime? AttomAvmDate { get; set; }

    // ── Data Freshness ──

    /// <summary>Last time this record was refreshed from any external source.</summary>
    public DateTime? LastRefreshedAt { get; set; }

    /// <summary>Primary source that last updated this record.</summary>
    [MaxLength(100)]
    public string? LastRefreshedSource { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ──

    /// <summary>MLS listings associated with this property.</summary>
    public ICollection<PropertyListing> Listings { get; set; } = new List<PropertyListing>();
}

/// <summary>
/// MLS listing record associated with a property. Tracks active, pending,
/// sold, and expired listing events from PACMLS and other MLS feeds.
/// </summary>
public class PropertyListing
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    /// <summary>Parent property extended record.</summary>
    public long PropertyExtendedId { get; set; }

    public PropertyExtended PropertyExtended { get; set; } = null!;

    /// <summary>MLS listing number.</summary>
    [Required]
    [MaxLength(30)]
    public string MlsNumber { get; set; } = string.Empty;

    /// <summary>MLS system source (e.g. PACMLS, NWMLS).</summary>
    [MaxLength(50)]
    public string? MlsSource { get; set; }

    /// <summary>Listing status: active, pending, sold, expired, withdrawn.</summary>
    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "active";

    public decimal? ListPrice { get; set; }
    public decimal? SoldPrice { get; set; }
    public decimal? OriginalListPrice { get; set; }

    public DateTime? ListDate { get; set; }
    public DateTime? SoldDate { get; set; }
    public DateTime? ExpirationDate { get; set; }

    /// <summary>Days on market as reported by the MLS.</summary>
    public int? DaysOnMarket { get; set; }

    [MaxLength(200)]
    public string? ListingAgent { get; set; }

    [MaxLength(200)]
    public string? ListingOffice { get; set; }

    [MaxLength(200)]
    public string? BuyerAgent { get; set; }

    [MaxLength(200)]
    public string? BuyerOffice { get; set; }

    /// <summary>Public remarks / description from the listing.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? PublicRemarks { get; set; }

    /// <summary>JSON array of photo URLs.</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? PhotoUrls { get; set; }

    // ── Audit fields ──

    [MaxLength(200)]
    public string CreatedBy { get; set; } = "system";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
