using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Top-level improvement record from PACS imprv table.
/// One per building/structure on a parcel. Contains type, class, overall depreciation,
/// value totals, and mobile home data. Child records are in PacsImprovementDetail.
/// </summary>
[Table("pacs_improvements")]
[Index(nameof(PacsPropId), nameof(PropValYear), nameof(PacsImprvId), Name = "IX_PacsImprv_PropYearId", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsImprv_ParcelId")]
public class PacsImprovement
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PropValYear { get; set; }
    public int PacsImprvId { get; set; }
    public int SupNum { get; set; }

    // ── Classification ───────────────────────────────────────────────────
    [MaxLength(5)] public string? ImprvTypeCode { get; set; }
    [MaxLength(5)] public string? ImprvStateCd { get; set; }
    [MaxLength(255)] public string? ImprvDesc { get; set; }
    [MaxLength(5)] public string? MiscCode { get; set; }
    [MaxLength(1)] public string? PrimaryImprv { get; set; }
    [MaxLength(1)] public string? ImprvHomesite { get; set; }
    public int? NumImprv { get; set; }
    [MaxLength(6)] public string? BuildingNumber { get; set; }
    [MaxLength(50)] public string? BuildingName { get; set; }

    // ── Values ───────────────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? OriginalVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BaseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CalcVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AdjustedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FlatVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? DistVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? IncomeVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? MktapprVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LockedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LivingAreaUp { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvAdjAmt { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvAdjFactor { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvMassAdjFactor { get; set; }
    [MaxLength(1)] public string? ValueType { get; set; }
    [MaxLength(1)] public string? ImprvValSource { get; set; }

    // ── New Value ────────────────────────────────────────────────────────
    public decimal? ImpNewYear { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImpNewVal { get; set; }
    public decimal? ImpNewPc { get; set; }

    // ── Depreciation ─────────────────────────────────────────────────────
    [Column(TypeName = "decimal(5,2)")] public decimal? EconomicPct { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal? PhysicalPct { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal? FunctionalPct { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal? DepPct { get; set; }
    [MaxLength(255)] public string? EconomicComment { get; set; }
    [MaxLength(255)] public string? PhysicalComment { get; set; }
    [MaxLength(255)] public string? FunctionalComment { get; set; }
    [MaxLength(255)] public string? DepComment { get; set; }

    // ── Age / Completion ─────────────────────────────────────────────────
    public decimal? ActualYearBuilt { get; set; }
    public decimal? EffectiveYearBuilt { get; set; }
    public decimal? PercentComplete { get; set; }
    [MaxLength(255)] public string? PercentCompleteComment { get; set; }

    // ── Use Codes ────────────────────────────────────────────────────────
    [MaxLength(10)] public string? PrimaryUseCd { get; set; }
    [MaxLength(10)] public string? SecondaryUseCd { get; set; }

    // ── Stories ──────────────────────────────────────────────────────────
    [MaxLength(5)] public string? Stories { get; set; }

    // ── Homestead Percent ────────────────────────────────────────────────
    [Column(TypeName = "decimal(5,4)")] public decimal? HsPct { get; set; }

    // ── Permanent Crops ──────────────────────────────────────────────────
    [Column(TypeName = "decimal(10,4)")] public decimal? PermanentCropLandAcres { get; set; }
    [Column(TypeName = "decimal(10,4)")] public decimal? PermanentCropPlantedAcres { get; set; }

    // ── Mobile Home ──────────────────────────────────────────────────────
    [MaxLength(100)] public string? MobileHomeMake { get; set; }
    [MaxLength(100)] public string? MobileHomeModel { get; set; }
    [MaxLength(100)] public string? MobileHomeSerialNum { get; set; }
    [MaxLength(100)] public string? MobileHomeSerialNum2 { get; set; }
    [MaxLength(100)] public string? MobileHomeSerialNum3 { get; set; }
    [MaxLength(100)] public string? MobileHomeHudNum { get; set; }
    [MaxLength(100)] public string? MobileHomeHudNum2 { get; set; }
    [MaxLength(100)] public string? MobileHomeHudNum3 { get; set; }
    [MaxLength(100)] public string? MobileHomeTitleNum { get; set; }
    public decimal? MobileHomeYear { get; set; }
    public decimal? MobileHomeTipOut { get; set; }

    // ── Image / Comments ─────────────────────────────────────────────────
    [MaxLength(50)] public string? ImprvImageUrl { get; set; }
    [MaxLength(1000)] public string? ImprvComment { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }

    public ICollection<PacsImprovementDetail> Details { get; set; } = new List<PacsImprovementDetail>();
    public ICollection<PacsImprovementAttribute> Attributes { get; set; } = new List<PacsImprovementAttribute>();
}
