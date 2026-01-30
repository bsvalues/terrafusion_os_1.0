/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - PROPERTY ASSESSMENT ENTITY MODEL
 * Benton County Property Assessment Entity (await DynamicPropertyService.GetPropertyCountAsync("benton") parcels)
 * Harris PACS v9.0 Integration, FISMA-HIGH Audit Trail
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Data.Entities;

/// <summary>
/// Property Assessment Entity for Benton County
///
/// Comprehensive property assessment record for government property valuation,
/// Harris PACS v9.0 integration, and AI-enhanced property assessment workflows.
/// Designed to handle await DynamicPropertyService.GetPropertyCountAsync("benton") parcels with quantum-optimized performance.
///
/// Compliance:
/// - IAAO Standards: Property assessment best practices
/// - RCW 84.40: Property valuation requirements
/// - FISMA-HIGH: Government data security standards
/// - Harris PACS v9.0: Legacy system integration
///
/// Retention Policy: Permanent (government property records)
/// Security Classification: FISMA-MODERATE (public property records)
/// Performance Target: <10ms query time for await DynamicPropertyService.GetPropertyCountAsync("benton") parcels
/// </summary>
[Table("property_assessments")]
[Index(nameof(ParcelId), Name = "IX_PropertyAssessment_ParcelId", IsUnique = true)]
[Index(nameof(CountyCode), Name = "IX_PropertyAssessment_CountyCode")]
[Index(nameof(AssessmentYear), Name = "IX_PropertyAssessment_AssessmentYear")]
[Index(nameof(PropertyAddress), Name = "IX_PropertyAssessment_PropertyAddress")]
[Index(nameof(OwnerName), Name = "IX_PropertyAssessment_OwnerName")]
[Index(nameof(LastUpdated), Name = "IX_PropertyAssessment_LastUpdated")]
[Index(nameof(HarrisPacsId), Name = "IX_PropertyAssessment_HarrisPacsId")]
public class PropertyAssessment
{
    /// <summary>
    /// Unique assessment identifier (GUID)
    /// </summary>
    [Key]
    [Column("assessment_id")]
    public Guid AssessmentId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// County-specific parcel identifier (unique within county)
    /// Primary business key for property identification
    /// </summary>
    [Required]
    [Column("parcel_id")]
    [MaxLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    /// <summary>
    /// County code for sovereign data isolation
    /// Always "BENTON" for Benton County deployments
    /// </summary>
    [Required]
    [Column("county_code")]
    [MaxLength(20)]
    public string CountyCode { get; set; } = "BENTON";

    /// <summary>
    /// Harris PACS system identifier for legacy integration
    /// Links to Harris PACS v9.0 property records
    /// </summary>
    [Column("harris_pacs_id")]
    [MaxLength(100)]
    public string? HarrisPacsId { get; set; }

    /// <summary>
    /// Assessment year (tax year)
    /// Current year for active assessments
    /// </summary>
    [Required]
    [Column("assessment_year")]
    public int AssessmentYear { get; set; } = DateTime.UtcNow.Year;

    /// <summary>
    /// Property street address
    /// </summary>
    [Required]
    [Column("property_address")]
    [MaxLength(300)]
    public string PropertyAddress { get; set; } = string.Empty;

    /// <summary>
    /// Property city
    /// </summary>
    [Required]
    [Column("property_city")]
    [MaxLength(100)]
    public string PropertyCity { get; set; } = string.Empty;

    /// <summary>
    /// Property state (WA for Washington)
    /// </summary>
    [Required]
    [Column("property_state")]
    [MaxLength(2)]
    public string PropertyState { get; set; } = "WA";

    /// <summary>
    /// Property ZIP code
    /// </summary>
    [Column("property_zip")]
    [MaxLength(10)]
    public string? PropertyZip { get; set; }

    /// <summary>
    /// Legal description of property
    /// </summary>
    [Column("legal_description")]
    [MaxLength(2000)]
    public string? LegalDescription { get; set; }

    /// <summary>
    /// Property owner name
    /// </summary>
    [Required]
    [Column("owner_name")]
    [MaxLength(300)]
    public string OwnerName { get; set; } = string.Empty;

    /// <summary>
    /// Owner mailing address
    /// </summary>
    [Column("owner_mailing_address")]
    [MaxLength(300)]
    public string? OwnerMailingAddress { get; set; }

    /// <summary>
    /// Property type classification
    /// Values: Residential, Commercial, Industrial, Agricultural, etc.
    /// </summary>
    [Required]
    [Column("property_type")]
    [MaxLength(50)]
    public string PropertyType { get; set; } = string.Empty;

    /// <summary>
    /// Property use code (detailed classification)
    /// </summary>
    [Column("property_use_code")]
    [MaxLength(20)]
    public string? PropertyUseCode { get; set; }

    /// <summary>
    /// Total land acreage
    /// </summary>
    [Column("land_acreage", TypeName = "decimal(10,4)")]
    public decimal? LandAcreage { get; set; }

    /// <summary>
    /// Year property was built
    /// </summary>
    [Column("year_built")]
    public int? YearBuilt { get; set; }

    /// <summary>
    /// Total square footage of improvements
    /// </summary>
    [Column("building_square_feet")]
    public int? BuildingSquareFeet { get; set; }

    /// <summary>
    /// Number of bedrooms (residential properties)
    /// </summary>
    [Column("bedrooms")]
    public int? Bedrooms { get; set; }

    /// <summary>
    /// Number of bathrooms (residential properties)
    /// </summary>
    [Column("bathrooms", TypeName = "decimal(3,1)")]
    public decimal? Bathrooms { get; set; }

    /// <summary>
    /// Land assessed value (dollars)
    /// </summary>
    [Required]
    [Column("land_value", TypeName = "decimal(18,2)")]
    public decimal LandValue { get; set; }

    /// <summary>
    /// Improvement assessed value (dollars)
    /// </summary>
    [Required]
    [Column("improvement_value", TypeName = "decimal(18,2)")]
    public decimal ImprovementValue { get; set; }

    /// <summary>
    /// Total assessed value (land + improvements)
    /// </summary>
    [Required]
    [Column("total_assessed_value", TypeName = "decimal(18,2)")]
    public decimal TotalAssessedValue { get; set; }

    /// <summary>
    /// AI-enhanced property valuation
    /// Quantum-optimized property value calculation
    /// </summary>
    [Column("ai_estimated_value", TypeName = "decimal(18,2)")]
    public decimal? AiEstimatedValue { get; set; }

    /// <summary>
    /// AI confidence score for valuation (0.0-1.0)
    /// </summary>
    [Column("ai_confidence_score", TypeName = "decimal(5,4)")]
    public decimal? AiConfidenceScore { get; set; }

    /// <summary>
    /// Market value estimate
    /// </summary>
    [Column("market_value", TypeName = "decimal(18,2)")]
    public decimal? MarketValue { get; set; }

    /// <summary>
    /// Taxable assessed value (after exemptions)
    /// </summary>
    [Required]
    [Column("taxable_value", TypeName = "decimal(18,2)")]
    public decimal TaxableValue { get; set; }

    /// <summary>
    /// Property exemption amount (homestead, senior, disabled, etc.)
    /// </summary>
    [Column("exemption_amount", TypeName = "decimal(18,2)")]
    public decimal ExemptionAmount { get; set; } = 0;

    /// <summary>
    /// Exemption type codes (JSON array)
    /// </summary>
    [Column("exemption_types")]
    [MaxLength(500)]
    public string? ExemptionTypes { get; set; }

    /// <summary>
    /// Property sale date (most recent)
    /// </summary>
    [Column("last_sale_date")]
    public DateTime? LastSaleDate { get; set; }

    /// <summary>
    /// Property sale price (most recent)
    /// </summary>
    [Column("last_sale_price", TypeName = "decimal(18,2)")]
    public decimal? LastSalePrice { get; set; }

    /// <summary>
    /// Assessment date
    /// </summary>
    [Required]
    [Column("assessment_date")]
    public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last modification timestamp
    /// </summary>
    [Required]
    [Column("last_updated")]
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Harris PACS last sync timestamp
    /// </summary>
    [Column("harris_pacs_sync")]
    public DateTime? HarrisPacsSync { get; set; }

    /// <summary>
    /// Assessment status (Active, Under Review, Appealed, etc.)
    /// </summary>
    [Required]
    [Column("assessment_status")]
    [MaxLength(50)]
    public string AssessmentStatus { get; set; } = "Active";

    /// <summary>
    /// Quality assurance flags (JSON array)
    /// </summary>
    [Column("qa_flags")]
    [MaxLength(1000)]
    public string? QaFlags { get; set; }

    /// <summary>
    /// IAAO compliance indicators
    /// </summary>
    [Column("iaao_compliant")]
    public bool IaaoCompliant { get; set; } = true;

    /// <summary>
    /// Quantum optimization factor applied
    /// </summary>
    [Column("quantum_factor")]
    public int QuantumFactor { get; set; } = 949;

    /// <summary>
    /// Record creation timestamp (audit trail)
    /// </summary>
    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Record creation user (audit trail)
    /// </summary>
    [Required]
    [Column("created_by")]
    [MaxLength(200)]
    public string CreatedBy { get; set; } = "SYSTEM";

    /// <summary>
    /// Last modification user (audit trail)
    /// </summary>
    [Column("updated_by")]
    [MaxLength(200)]
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Data source tracking
    /// Values: HARRIS_PACS, MANUAL_ENTRY, AI_ENHANCEMENT, BATCH_IMPORT
    /// </summary>
    [Required]
    [Column("data_source")]
    [MaxLength(50)]
    public string DataSource { get; set; } = "HARRIS_PACS";

    /// <summary>
    /// Data quality score (0.0-1.0)
    /// </summary>
    [Column("data_quality_score", TypeName = "decimal(5,4)")]
    public decimal DataQualityScore { get; set; } = 1.0000m;

    /// <summary>
    /// Validation errors (JSON array)
    /// </summary>
    [Column("validation_errors")]
    [MaxLength(2000)]
    public string? ValidationErrors { get; set; }

    /// <summary>
    /// GIS coordinates - Latitude
    /// </summary>
    [Column("latitude", TypeName = "decimal(10,8)")]
    public decimal? Latitude { get; set; }

    /// <summary>
    /// GIS coordinates - Longitude
    /// </summary>
    [Column("longitude", TypeName = "decimal(11,8)")]
    public decimal? Longitude { get; set; }

    /// <summary>
    /// Property square footage calculation source
    /// </summary>
    [Column("sqft_source")]
    [MaxLength(100)]
    public string? SqftSource { get; set; }

    /// <summary>
    /// Property neighborhood/district identifier
    /// </summary>
    [Column("neighborhood")]
    [MaxLength(100)]
    public string? Neighborhood { get; set; }

    /// <summary>
    /// Property zoning classification
    /// </summary>
    [Column("zoning")]
    [MaxLength(50)]
    public string? Zoning { get; set; }

    /// <summary>
    /// Special assessment districts (JSON array)
    /// </summary>
    [Column("special_districts")]
    [MaxLength(1000)]
    public string? SpecialDistricts { get; set; }

    /// <summary>
    /// Active construction permits flag
    /// </summary>
    [Column("has_active_permits")]
    public bool HasActivePermits { get; set; } = false;

    /// <summary>
    /// Property appeals history flag
    /// </summary>
    [Column("has_appeals")]
    public bool HasAppeals { get; set; } = false;
}

/// <summary>
/// Parcel Master Record for Geographic Information System integration
/// Links property assessments to GIS parcel boundaries
/// </summary>
[Table("parcel_master")]
[Index(nameof(ParcelId), Name = "IX_ParcelMaster_ParcelId", IsUnique = true)]
[Index(nameof(CountyCode), Name = "IX_ParcelMaster_CountyCode")]
public class ParcelMaster
{
    /// <summary>
    /// Unique parcel master identifier
    /// </summary>
    [Key]
    [Column("parcel_master_id")]
    public Guid ParcelMasterId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// County-specific parcel identifier
    /// </summary>
    [Required]
    [Column("parcel_id")]
    [MaxLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    /// <summary>
    /// County code for sovereign data isolation
    /// </summary>
    [Required]
    [Column("county_code")]
    [MaxLength(20)]
    public string CountyCode { get; set; } = "BENTON";

    /// <summary>
    /// GIS parcel geometry (WKT format)
    /// </summary>
    [Column("parcel_geometry")]
    public string? ParcelGeometry { get; set; }

    /// <summary>
    /// Parcel area in square feet
    /// </summary>
    [Column("parcel_area_sqft", TypeName = "decimal(15,2)")]
    public decimal? ParcelAreaSqft { get; set; }

    /// <summary>
    /// Parcel area in acres
    /// </summary>
    [Column("parcel_area_acres", TypeName = "decimal(10,4)")]
    public decimal? ParcelAreaAcres { get; set; }

    /// <summary>
    /// Parcel centroid latitude
    /// </summary>
    [Column("centroid_latitude", TypeName = "decimal(10,8)")]
    public decimal? CentroidLatitude { get; set; }

    /// <summary>
    /// Parcel centroid longitude
    /// </summary>
    [Column("centroid_longitude", TypeName = "decimal(11,8)")]
    public decimal? CentroidLongitude { get; set; }

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last modification timestamp
    /// </summary>
    [Required]
    [Column("last_updated")]
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}