using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Full valuation record per property per appraisal year from PACS property_val.
/// Contains all six value approaches (cost, income, shared, arb, dist, mktappr),
/// homestead cap (HSCAP) tracking, agricultural/timber values, supplemental info,
/// legal description, geographic codes, and appraiser assignments.
/// </summary>
[Table("pacs_valuations")]
[Index(nameof(PacsPropId), nameof(PropValYear), nameof(SupNum), Name = "IX_PacsValuation_PropYearSup", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsValuation_ParcelId")]
[Index(nameof(NeighborhoodCode), Name = "IX_PacsValuation_Hood")]
[Index(nameof(PropertyUseCd), Name = "IX_PacsValuation_UseCode")]
public class PacsValuation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PropValYear { get; set; }
    public int SupNum { get; set; }

    // ── Core Values ──────────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? AppraisedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AssessedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? Market { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvVal { get; set; }

    // ── Land Value Splits ────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? LandHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LandNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvNonHstdVal { get; set; }

    // ── Agricultural Values ──────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? AgUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgLoss { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgLateLoss { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgHsUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgHsMktVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgHsLoss { get; set; }

    // ── Timber Values ────────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? Timber78 { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberUse { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberLoss { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberLateLoss { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberHsUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberHsMktVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberHsLoss { get; set; }

    // ── Homestead Cap (HSCAP) ────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? TenPercentCap { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FreezeCeiling { get; set; }
    public decimal? FreezeYear { get; set; }
    public decimal? HscapQualifyYear { get; set; }
    public decimal? HscapBaseYear { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? HscapPrevHsVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? HscapNewHsVal { get; set; }
    public decimal? HscapPrevReapprYear { get; set; }
    public decimal? LastAppraisalYear { get; set; }

    // ── New Value Tracking ───────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? NewVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValHs { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValNhs { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValImprvHs { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValImprvNhs { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValLandHs { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValLandNhs { get; set; }
    public decimal? NewYear { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? RemodelValCurrYr { get; set; }

    // ── Cost Approach Values ─────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? CostValue { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostLandHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostLandNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostImprvHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostImprvNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostAgUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostAgMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostAgLoss { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostTimberMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostTimberUse { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CostTimberLoss { get; set; }

    // ── Income Approach Values ───────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? IncomeValue { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? IncomeMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? IncomeLandHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? IncomeLandNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? IncomeImprvHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? IncomeImprvNonHstdVal { get; set; }

    // ── Market Approach Values ───────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? MktapprMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? MktapprImprvHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? MktapprImprvNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? MktapprLandHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? MktapprLandNonHstdVal { get; set; }

    // ── ARB (Appeal Board) Values ────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbLandHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbLandNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbImprvHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbImprvNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbAgUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbAgMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbTimberMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbTimberUse { get; set; }

    // ── Abatement / TIF ──────────────────────────────────────────────────
    [Column(TypeName = "decimal(5,4)")] public decimal? AbatedPct { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AbatedAmt { get; set; }
    public decimal? AbatedYear { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TifImprvVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TifLandVal { get; set; }
    [MaxLength(1)] public string? TifFlag { get; set; }

    // ── Rendered / Personal Property ─────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? RenderedVal { get; set; }
    public decimal? RenderedYear { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? PpFarm { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? PpNonFarm { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? PpSqFt { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? DorValue { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NonTaxedMktVal { get; set; }

    // ── Legal Description ────────────────────────────────────────────────
    [MaxLength(2000)] public string? LegalDesc { get; set; }
    [MaxLength(2000)] public string? LegalDesc2 { get; set; }
    [Column(TypeName = "decimal(10,4)")] public decimal? LegalAcreage { get; set; }
    [Column(TypeName = "decimal(10,4)")] public decimal? EffSizeAcres { get; set; }

    // ── Geographic Codes ─────────────────────────────────────────────────
    [Column("hood_cd")] [MaxLength(10)] public string? NeighborhoodCode { get; set; }
    [MaxLength(10)] public string? AbsSubdvCd { get; set; }
    [MaxLength(5)] public string? RegionCode { get; set; }
    [MaxLength(5)] public string? SubsetCd { get; set; }
    [MaxLength(20)] public string? MapId { get; set; }
    [MaxLength(50)] public string? Block { get; set; }
    [MaxLength(50)] public string? TractOrLot { get; set; }
    [MaxLength(50)] public string? MblHmPark { get; set; }
    [MaxLength(50)] public string? MblHmSpace { get; set; }

    // ── Legal / Township ─────────────────────────────────────────────────
    [MaxLength(20)] public string? TownshipCode { get; set; }
    [MaxLength(50)] public string? TownshipSection { get; set; }
    [MaxLength(50)] public string? TownshipQSection { get; set; }
    [MaxLength(20)] public string? RangeCode { get; set; }
    [MaxLength(10)] public string? StateDistrictCd { get; set; }
    [MaxLength(20)] public string? Mapsco { get; set; }

    // ── Classification Codes ─────────────────────────────────────────────
    [MaxLength(10)] public string? PropertyUseCd { get; set; }
    [MaxLength(10)] public string? SecondaryUseCd { get; set; }
    [MaxLength(10)] public string? AssessmentUseCd { get; set; }
    [MaxLength(10)] public string? SubMarketCd { get; set; }
    [MaxLength(10)] public string? VisibilityAccessCd { get; set; }
    [MaxLength(5)] public string? ApprMethod { get; set; }
    [MaxLength(5)] public string? SubType { get; set; }
    [MaxLength(10)] public string? UrbanGrowthCd { get; set; }
    [MaxLength(1)] public string? PropState { get; set; }
    public int? Cycle { get; set; }

    // ── Appraiser Assignments ────────────────────────────────────────────
    public int? LastAppraiserId { get; set; }
    public int? NextAppraiserId { get; set; }
    public int? ValueAppraiserId { get; set; }
    public int? LandAppraiserId { get; set; }
    public DateTime? LastAppraisalDate { get; set; }
    public DateTime? NextAppraisalDate { get; set; }
    [MaxLength(500)] public string? NextAppraisalReason { get; set; }
    public DateTime? LastActualAppraisalDate { get; set; }
    public DateTime? RecalcDate { get; set; }

    // ── GIS Coordinates ──────────────────────────────────────────────────
    [Column(TypeName = "decimal(10,6)")] public decimal? GisCoordX { get; set; }
    [Column(TypeName = "decimal(10,6)")] public decimal? GisCoordY { get; set; }

    // ── Irrigation / Mineral ─────────────────────────────────────────────
    public decimal? OilWells { get; set; }
    public decimal? IrrWells { get; set; }
    public decimal? IrrAcres { get; set; }
    public decimal? IrrCapacity { get; set; }

    // ── Business (Personal Property) ─────────────────────────────────────
    [MaxLength(50)] public string? UbiNumber { get; set; }
    [MaxLength(50)] public string? TaxRegistration { get; set; }
    public DateTime? BusinessStartDate { get; set; }
    public DateTime? BusinessCloseDate { get; set; }
    public DateTime? BusinessSoldDate { get; set; }

    // ── Supplemental Info ────────────────────────────────────────────────
    [MaxLength(10)] public string? SupCode { get; set; }
    [MaxLength(500)] public string? SupDesc { get; set; }
    public DateTime? SupDate { get; set; }
    [MaxLength(1)] public string? SupAction { get; set; }
    [MaxLength(3000)] public string? SupComment { get; set; }

    // ── UDI (Undivided Interest) ─────────────────────────────────────────
    [MaxLength(1)] public string? UdiParent { get; set; }
    public int? UdiParentPropId { get; set; }
    [MaxLength(5)] public string? UdiStatus { get; set; }

    // ── Flags ────────────────────────────────────────────────────────────
    [MaxLength(1)] public string? VitFlag { get; set; }
    public bool? HasLockedValues { get; set; }
    public DateTime? PropInactiveDate { get; set; }
    public DateTime? NoticeMailDate { get; set; }
    public DateTime? ChangeDate { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
