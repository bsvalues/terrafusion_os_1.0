using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Exemption record from PACS property_exemption table.
/// One row per exemption type per owner per tax year.
/// NOTE: SSN, DL number, and dates of birth are excluded — PII by design.
/// Includes homestead, senior, disabled, agricultural, religious, nonprofit exemptions.
/// </summary>
[Table("pacs_exemptions")]
[Index(nameof(PacsPropId), nameof(PacsOwnerId), nameof(ExemptTaxYear), nameof(ExemptTypeCode), Name = "IX_PacsExemption_Natural", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsExemption_ParcelId")]
[Index(nameof(ExemptTypeCode), Name = "IX_PacsExemption_TypeCode")]
public class PacsExemption
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PacsOwnerId { get; set; }
    public decimal ExemptTaxYear { get; set; }
    public decimal OwnerTaxYear { get; set; }
    public int SupNum { get; set; }

    [MaxLength(5)] public string? PropTypeCode { get; set; }

    /// <summary>Exemption type code: HS, OV65, DP, EX, AG, etc. (property_exemption.exmpt_type_cd)</summary>
    [MaxLength(10)] public string? ExemptTypeCode { get; set; }

    /// <summary>Exemption sub-type code (property_exemption.exmpt_subtype_cd)</summary>
    [MaxLength(10)] public string? ExemptSubtypeCode { get; set; }

    /// <summary>Applicant name as filed (property_exemption.applicant_nm) — not PII, it's the entity name</summary>
    [MaxLength(70)] public string? ApplicantName { get; set; }

    // ── Dates ────────────────────────────────────────────────────────────
    public DateTime? EffectiveDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public decimal? EffectiveTaxYear { get; set; }
    public decimal? QualifyYear { get; set; }
    public decimal? ReviewLastYear { get; set; }

    // ── Value / Percent ──────────────────────────────────────────────────
    [Column(TypeName = "decimal(5,4)")] public decimal? ApplyPctOwner { get; set; }
    [Column(TypeName = "decimal(5,4)")] public decimal? ExemptionPct { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? CombinedDispIncome { get; set; }

    // ── Special / Abatement ──────────────────────────────────────────────
    [MaxLength(1)] public string? SpValueType { get; set; }
    [MaxLength(1)] public string? SpValueOption { get; set; }
    public DateTime? SpDateApproved { get; set; }
    public DateTime? SpExpirationDate { get; set; }
    [MaxLength(5000)] public string? SpComment { get; set; }

    // ── Absent Owner ─────────────────────────────────────────────────────
    public bool? AbsentFlag { get; set; }
    public DateTime? AbsentExpirationDate { get; set; }
    [MaxLength(255)] public string? AbsentComment { get; set; }

    // ── Deferral ─────────────────────────────────────────────────────────
    public DateTime? DeferralDate { get; set; }

    // ── Review ───────────────────────────────────────────────────────────
    [MaxLength(10)] public string? ExemptQualifyCd { get; set; }
    public DateTime? ReviewRequestDate { get; set; }
    [MaxLength(10)] public string? ReviewStatusCd { get; set; }

    // ── Flags ────────────────────────────────────────────────────────────
    public bool? ApplyNoExemptionAmount { get; set; }
    [MaxLength(1)] public string? ApplyLocalOptionPctOnly { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
