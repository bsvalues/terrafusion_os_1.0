using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Improvement detail segment from PACS imprv_detail table.
/// One per building section/segment (e.g., main area, garage, porch, addition).
/// Contains area measurements, unit pricing, full depreciation breakdown,
/// sketch commands, and permanent crop agriculture data.
/// </summary>
[Table("pacs_improvement_details")]
[Index(nameof(PacsPropId), nameof(PropValYear), nameof(PacsImprvId), nameof(PacsImprvDetId), Name = "IX_PacsImprvDet_Natural", IsUnique = true)]
[Index(nameof(ImprovementId), Name = "IX_PacsImprvDet_ImprvId")]
public class PacsImprovementDetail
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ImprovementId { get; set; }
    public PacsImprovement Improvement { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PropValYear { get; set; }
    public int PacsImprvId { get; set; }
    public int PacsImprvDetId { get; set; }
    public int SupNum { get; set; }
    public int? SeqNum { get; set; }

    // ── Classification ───────────────────────────────────────────────────
    [MaxLength(10)] public string? ImprvDetClassCd { get; set; }
    [MaxLength(5)]  public string? ImprvDetMethCd { get; set; }
    [MaxLength(10)] public string? ImprvDetTypeCd { get; set; }
    [MaxLength(10)] public string? ImprvDetSubClassCd { get; set; }
    [MaxLength(100)] public string? ImprvDetDesc { get; set; }
    [MaxLength(5)]  public string? ConditionCode { get; set; }
    [MaxLength(10)] public string? LeaseClass { get; set; }

    // ── Area Measurements ────────────────────────────────────────────────
    [Column(TypeName = "decimal(12,2)")] public decimal? ImprvDetArea { get; set; }
    [MaxLength(1)] public string? ImprvDetAreaType { get; set; }
    [Column(TypeName = "decimal(12,2)")] public decimal? CubicArea { get; set; }
    [Column(TypeName = "decimal(12,2)")] public decimal? CalcArea { get; set; }
    [Column(TypeName = "decimal(12,2)")] public decimal? SketchArea { get; set; }
    [Column(TypeName = "decimal(12,2)")] public decimal? NetRentableArea { get; set; }
    [Column(TypeName = "decimal(12,2)")] public decimal? Perimeter { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? Length { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? Width { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? Height { get; set; }

    // ── Stories / Units ──────────────────────────────────────────────────
    public int? NumStories { get; set; }
    public int? NumUnits { get; set; }
    public decimal? FloorNumber { get; set; }
    public decimal? LoadFactor { get; set; }

    // ── Age ──────────────────────────────────────────────────────────────
    public decimal? YearBuilt { get; set; }
    public decimal? YearNew { get; set; }
    public decimal? DepreciationYear { get; set; }
    public decimal? EffectiveTaxYear { get; set; }
    public decimal? ActualAge { get; set; }
    public decimal? PercentComplete { get; set; }
    [MaxLength(255)] public string? PercentCompleteComment { get; set; }

    // ── Valuation ────────────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvDetVal { get; set; }
    [MaxLength(1)] public string? ImprvDetValSource { get; set; }
    [Column(TypeName = "decimal(10,4)")] public decimal? UnitPrice { get; set; }
    [Column(TypeName = "decimal(10,4)")] public decimal? ImprvDetOrigUp { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvDetOrigVal { get; set; }
    [Column(TypeName = "decimal(8,4)")] public decimal? ImprvDetAdjFactor { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvDetAdjAmt { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvDetCalcVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvDetAdjVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvDetFlatVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? DepreciatedReplacementCostNew { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvDetCostUnitPrice { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvDetMsVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvDetMsUnitPrice { get; set; }
    [Column(TypeName = "decimal(8,4)")] public decimal? AddFactor { get; set; }
    [Column(TypeName = "decimal(8,4)")] public decimal? SizeAdjPct { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValue { get; set; }

    // ── Depreciation ─────────────────────────────────────────────────────
    // PACS stores these as 0-100 integer percentages (e.g. dep_pct=95 = 95% good).
    // decimal(6,2) accommodates 0–9999.99 — well above the 100 ceiling.
    [Column(TypeName = "decimal(6,2)")] public decimal? EconomicPct { get; set; }
    [Column(TypeName = "decimal(6,2)")] public decimal? PhysicalPct { get; set; }
    [MaxLength(1)] public string? PhysicalPctSource { get; set; }
    [Column(TypeName = "decimal(6,2)")] public decimal? FunctionalPct { get; set; }
    [Column(TypeName = "decimal(6,2)")] public decimal? DepPct { get; set; }
    [MaxLength(255)] public string? EconomicComment { get; set; }
    [MaxLength(255)] public string? PhysicalComment { get; set; }
    [MaxLength(255)] public string? FunctionalComment { get; set; }

    // ── Sketch Commands ──────────────────────────────────────────────────
    [MaxLength(1800)] public string? SketchCommands { get; set; }

    // ── Permanent Crops (Agricultural) ───────────────────────────────────
    [Column(TypeName = "decimal(10,4)")] public decimal? PermanentCropAcres { get; set; }
    [Column(TypeName = "decimal(10,4)")] public decimal? PermanentCropIrrigationAcres { get; set; }
    [MaxLength(15)] public string? PermanentCropAgeGroup { get; set; }
    [MaxLength(15)] public string? PermanentCropTrellis { get; set; }
    [MaxLength(15)] public string? PermanentCropIrrigationSystemType { get; set; }
    [MaxLength(15)] public string? PermanentCropIrrigationSubClass { get; set; }
    [MaxLength(15)] public string? PermanentCropDensity { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
