using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Owner-level computed value splits from PACS wash_prop_owner_val.
/// Populated by Harris CalculateTaxable stored procedures.
/// Contains homestead/non-homestead splits, timber/ag values,
/// new construction values, and final taxable values per owner.
/// Composite natural key: (prop_id, year, sup_num, owner_id).
/// </summary>
[Table("pacs_owner_vals")]
[Index(nameof(PacsPropId), nameof(PropValYear), nameof(SupNum), nameof(PacsOwnerId),
    Name = "IX_PacsOwnerVal_PropYearSupOwner", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsOwnerVal_ParcelId")]
public class PacsOwnerVal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PropValYear { get; set; }
    public int SupNum { get; set; }
    public int PacsOwnerId { get; set; }

    // ── Improvement Value Splits ───────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ImprvNonHstdVal { get; set; }

    // ── Land Value Splits ──────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? LandHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? LandNonHstdVal { get; set; }

    // ── Timber / Ag Market Values ──────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberHsMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgHsMarket { get; set; }

    // ── New Construction Values ────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValHs { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValNhs { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? NewValP { get; set; }

    // ── Appraised Values ───────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? AppraisedClassified { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AppraisedNonClassified { get; set; }

    // ── Use Values (Current Use Program) ───────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? AgUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AgHsUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TimberHsUseVal { get; set; }

    // ── Taxable Values ─────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? TaxableClassified { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? TaxableNonClassified { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
