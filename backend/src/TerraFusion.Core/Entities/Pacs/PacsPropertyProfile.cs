using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Physical property profile per appraisal year from PACS property_profile table.
/// Contains building characteristics, land measurements, class/condition codes,
/// zoning, site attributes, and mobile home data.
/// </summary>
[Table("pacs_property_profiles")]
[Index(nameof(PacsPropId), nameof(PropValYear), Name = "IX_PacsPropertyProfile_PropYear", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsPropertyProfile_ParcelId")]
public class PacsPropertyProfile
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PropValYear { get; set; }
    public int SupNum { get; set; }

    // ── Classification ──────────────────────────────────────────────────
    /// <summary>Property class code (property_profile.class_cd)</summary>
    [MaxLength(10)] public string? ClassCode { get; set; }

    /// <summary>State property code (property_profile.state_cd)</summary>
    [MaxLength(10)] public string? StateCd { get; set; }

    /// <summary>Property use code (property_profile.property_use_cd)</summary>
    [MaxLength(10)] public string? PropertyUseCd { get; set; }

    /// <summary>Improvement type code (property_profile.imprv_type_cd)</summary>
    [MaxLength(5)] public string? ImprvTypeCode { get; set; }

    /// <summary>Improvement detail sub-class (property_profile.imprv_det_sub_class_cd)</summary>
    [MaxLength(10)] public string? ImprvDetSubClassCd { get; set; }

    /// <summary>Number of improvements on parcel (property_profile.num_imprv)</summary>
    public int? NumImprv { get; set; }

    // ── Building Characteristics ─────────────────────────────────────────
    /// <summary>Year built (property_profile.yr_blt)</summary>
    public decimal? YearBuilt { get; set; }

    /// <summary>Actual year built (property_profile.actual_year_built)</summary>
    public decimal? ActualYearBuilt { get; set; }

    /// <summary>Effective year built (property_profile.eff_yr_blt)</summary>
    public decimal? EffectiveYearBuilt { get; set; }

    /// <summary>Actual age in years (property_profile.actual_age)</summary>
    public int? ActualAge { get; set; }

    /// <summary>Gross living area sqft (property_profile.living_area)</summary>
    public decimal? LivingArea { get; set; }

    /// <summary>Condition code (property_profile.condition_cd)</summary>
    [MaxLength(5)] public string? ConditionCode { get; set; }

    /// <summary>Percent construction complete (property_profile.percent_complete)</summary>
    public decimal? PercentComplete { get; set; }

    /// <summary>Heat and AC description (property_profile.heat_ac_code)</summary>
    [MaxLength(75)] public string? HeatAcCode { get; set; }

    /// <summary>High-value improvement class code (property_profile.class_cd_highvalueimprov)</summary>
    [MaxLength(10)] public string? ClassCdHighValueImprv { get; set; }

    /// <summary>High-value improvement living area (property_profile.living_area_highvalueimprov)</summary>
    public decimal? LivingAreaHighValueImprv { get; set; }

    // ── Improvement Valuation ────────────────────────────────────────────
    /// <summary>Improvement unit price (property_profile.imprv_unit_price)</summary>
    public decimal? ImprvUnitPrice { get; set; }

    /// <summary>Improvement added value (property_profile.imprv_add_val)</summary>
    public decimal? ImprvAddVal { get; set; }

    /// <summary>Total appraised value (property_profile.appraised_val)</summary>
    public decimal? AppraisedVal { get; set; }

    // ── Land Measurements ────────────────────────────────────────────────
    /// <summary>Land type code (property_profile.land_type_cd)</summary>
    [MaxLength(10)] public string? LandTypeCode { get; set; }

    /// <summary>Land square footage (property_profile.land_sqft)</summary>
    public decimal? LandSqft { get; set; }

    /// <summary>Land acres (property_profile.land_acres)</summary>
    public decimal? LandAcres { get; set; }

    /// <summary>Land total acres (property_profile.land_total_acres)</summary>
    public decimal? LandTotalAcres { get; set; }

    /// <summary>Useable land acres (property_profile.land_useable_acres)</summary>
    public decimal? LandUseableAcres { get; set; }

    /// <summary>Useable land sqft (property_profile.land_useable_sqft)</summary>
    public decimal? LandUseableSqft { get; set; }

    /// <summary>Land front footage (property_profile.land_front_feet)</summary>
    public decimal? LandFrontFeet { get; set; }

    /// <summary>Land depth (property_profile.land_depth)</summary>
    public decimal? LandDepth { get; set; }

    /// <summary>Number of land lots (property_profile.land_num_lots)</summary>
    public decimal? LandNumLots { get; set; }

    /// <summary>Total land sqft (property_profile.land_total_sqft)</summary>
    public decimal? LandTotalSqft { get; set; }

    // ── Land Valuation ───────────────────────────────────────────────────
    /// <summary>Land unit price (property_profile.land_unit_price)</summary>
    public decimal? LandUnitPrice { get; set; }

    /// <summary>Main land unit price (property_profile.main_land_unit_price)</summary>
    public decimal? MainLandUnitPrice { get; set; }

    /// <summary>Main land total adjustment (property_profile.main_land_total_adj)</summary>
    public decimal? MainLandTotalAdj { get; set; }

    /// <summary>Land appraisal method (property_profile.land_appr_method)</summary>
    [MaxLength(5)] public string? LandApprMethod { get; set; }

    /// <summary>Land schedule table (property_profile.ls_table)</summary>
    [MaxLength(25)] public string? LsTable { get; set; }

    /// <summary>Size adjustment percent (property_profile.size_adj_pct)</summary>
    public decimal? SizeAdjPct { get; set; }

    // ── Geographic / Market Identifiers ──────────────────────────────────
    /// <summary>Neighborhood code (property_profile.neighborhood)</summary>
    [MaxLength(10)] public string? NeighborhoodCode { get; set; }

    /// <summary>Region code (property_profile.region)</summary>
    [MaxLength(5)] public string? RegionCode { get; set; }

    /// <summary>Abstract subdivision code (property_profile.abs_subdv)</summary>
    [MaxLength(10)] public string? AbsSubdv { get; set; }

    /// <summary>Subset code (property_profile.subset)</summary>
    [MaxLength(5)] public string? SubsetCode { get; set; }

    /// <summary>Map ID (property_profile.map_id)</summary>
    [MaxLength(20)] public string? MapId { get; set; }

    /// <summary>Sub-market code (property_profile.sub_market_cd)</summary>
    [MaxLength(10)] public string? SubMarketCd { get; set; }

    // ── Site Characteristics ─────────────────────────────────────────────
    /// <summary>Zoning (property_profile.zoning)</summary>
    [MaxLength(50)] public string? Zoning { get; set; }

    /// <summary>Zoning characteristic 1 (property_profile.characteristic_zoning1)</summary>
    [MaxLength(20)] public string? CharacteristicZoning1 { get; set; }

    /// <summary>Zoning characteristic 2 (property_profile.characteristic_zoning2)</summary>
    [MaxLength(20)] public string? CharacteristicZoning2 { get; set; }

    /// <summary>View characteristic (property_profile.characteristic_view)</summary>
    [MaxLength(20)] public string? CharacteristicView { get; set; }

    /// <summary>Visibility and access code (property_profile.visibility_access_cd)</summary>
    [MaxLength(10)] public string? VisibilityAccessCd { get; set; }

    /// <summary>Road access description (property_profile.road_access)</summary>
    [MaxLength(50)] public string? RoadAccess { get; set; }

    /// <summary>Utilities description (property_profile.utilities)</summary>
    [MaxLength(50)] public string? Utilities { get; set; }

    /// <summary>Topography description (property_profile.topography)</summary>
    [MaxLength(50)] public string? Topography { get; set; }

    /// <summary>School district ID (property_profile.school_id)</summary>
    public int? SchoolId { get; set; }

    /// <summary>City ID (property_profile.city_id)</summary>
    public int? CityId { get; set; }

    /// <summary>Last appraisal date (property_profile.last_appraisal_dt)</summary>
    public DateTime? LastAppraisalDate { get; set; }

    // ── Mobile Home ──────────────────────────────────────────────────────
    [MaxLength(100)] public string? MobileHomeMake { get; set; }
    [MaxLength(100)] public string? MobileHomeModel { get; set; }
    [MaxLength(100)] public string? MobileHomeSerialNum { get; set; }
    [MaxLength(100)] public string? MobileHomeHudNum { get; set; }
    [MaxLength(100)] public string? MobileHomeTitleNum { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
