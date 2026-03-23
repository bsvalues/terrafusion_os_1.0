using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Land detail segment from PACS land_detail table.
/// One per land segment on a parcel. Captures type, acreage, market and ag values,
/// adjustment factors, homestead percent, current-use application data,
/// waterfront footage, and new construction flags.
/// </summary>
[Table("pacs_land_details")]
[Index(nameof(PacsPropId), nameof(PropValYear), nameof(PacsLandSegId), Name = "IX_PacsLand_Natural", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsLand_ParcelId")]
[Index(nameof(LandTypeCode), Name = "IX_PacsLand_TypeCode")]
public class PacsLandDetail
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PropValYear { get; set; }
    public int PacsLandSegId { get; set; }
    public int SupNum { get; set; }

    // ── Classification ───────────────────────────────────────────────────
    [MaxLength(10)] public string? LandTypeCode { get; set; }
    [MaxLength(50)] public string? LandSegDesc { get; set; }
    [MaxLength(5)]  public string? StateCd { get; set; }
    [MaxLength(1)]  public string? LandSegHomesite { get; set; }
    [MaxLength(3)]  public string? LandClassCode { get; set; }
    [MaxLength(10)] public string? LandInfluenceCode { get; set; }
    [MaxLength(10)] public string? LandSoilCode { get; set; }
    [MaxLength(10)] public string? AgLandTypeCd { get; set; }
    [MaxLength(5)]  public string? LandAdjTypeCd { get; set; }
    [MaxLength(5)]  public string? AppraisalCode { get; set; }
    [MaxLength(10)] public string? PrimaryUseCd { get; set; }
    [MaxLength(10)] public string? SubUseCd { get; set; }
    [MaxLength(5)]  public string? TypeSchedule { get; set; }

    // ── Size ─────────────────────────────────────────────────────────────
    [Column(TypeName = "decimal(12,4)")] public decimal? SizeAcres { get; set; }
    [Column(TypeName = "decimal(14,2)")] public decimal? SizeSquareFeet { get; set; }
    [Column(TypeName = "decimal(12,4)")] public decimal? SizeUseableAcres { get; set; }
    [Column(TypeName = "decimal(14,2)")] public decimal? SizeUseableSquareFeet { get; set; }
    [Column(TypeName = "decimal(12,4)")] public decimal? EffSizeAcres { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? EffectiveFront { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? EffectiveDepth { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? WidthFront { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? WidthBack { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? DepthRight { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? DepthLeft { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? WaterfrontFootage { get; set; }
    public decimal? NumLots { get; set; }

    // ── Market Value ─────────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? MktUnitPrice { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LandSegMktVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? MktCalcVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? MktAdjVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? MktFlatVal { get; set; }
    [MaxLength(1)] public string? MktValSource { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LandSegOrigVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LandSegUp { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? LandAdjFactor { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LandAdjAmt { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? LandMassAdjFactor { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? OaMktVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NonTaxedMktVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? MktapprVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? DistVal { get; set; }

    // ── Agricultural Values ──────────────────────────────────────────────
    [MaxLength(5)]  public string? AgUseCd { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgUnitPrice { get; set; }
    [MaxLength(1)]  public string? AgApply { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgCalcVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgAdjVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgFlatVal { get; set; }
    [MaxLength(5)]  public string? AgValType { get; set; }
    [MaxLength(1)]  public string? AgValSource { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgLoss { get; set; }
    public decimal? AgEffTaxYear { get; set; }
    public decimal? AgApplyYear { get; set; }
    public DateTime? AgTimberConvDate { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? OaAgVal { get; set; }

    // ── Timber ───────────────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? Timber78Val { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? Timber78ValPct { get; set; }

    // ── Homestead ────────────────────────────────────────────────────────
    [Column(TypeName = "decimal(5,4)")] public decimal? HsPct { get; set; }

    // ── New Construction ─────────────────────────────────────────────────
    public bool? NewConstructionFlag { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewConstructionValue { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LandNewVal { get; set; }

    // ── Current Use Application ──────────────────────────────────────────
    [MaxLength(16)] public string? ApplicationNumber { get; set; }
    [MaxLength(23)] public string? RecordingNumber { get; set; }
    public decimal? AssessmentYrQualified { get; set; }
    [Column(TypeName = "decimal(12,4)")] public decimal? CurrentUseEffectiveAcres { get; set; }
    public decimal? EffectiveTaxYear { get; set; }

    // ── Misc ─────────────────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? MiscValue { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? AgPbrsPct { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LockedVal { get; set; }
    [MaxLength(5)] public string? LockedAgUseCd { get; set; }
    [MaxLength(500)] public string? LandSegComment { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
