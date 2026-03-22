using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// BOE/ARB appeal protest record from PACS _arb_protest table.
/// Full hearing workflow: creation, evidence, hearing schedule, motions, and final values.
/// Begin/final value snapshots capture the full before-and-after for each appeal.
/// </summary>
[Table("pacs_appeals")]
[Index(nameof(PacsPropId), nameof(PropValYear), nameof(PacsCaseId), Name = "IX_PacsAppeal_Natural", IsUnique = true)]
[Index(nameof(ParcelId), Name = "IX_PacsAppeal_ParcelId")]
[Index(nameof(ProtStatus), Name = "IX_PacsAppeal_Status")]
[Index(nameof(HearingStartDate), Name = "IX_PacsAppeal_HearingDate")]
public class PacsAppeal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ParcelId { get; set; }
    public PacsParcel Parcel { get; set; } = null!;

    public int PacsPropId { get; set; }
    public decimal PropValYear { get; set; }
    public int PacsCaseId { get; set; }

    // ── Status & Type ────────────────────────────────────────────────────
    [MaxLength(10)] public string? ProtType { get; set; }
    [MaxLength(10)] public string? ProtStatus { get; set; }
    public DateTime? StatusDateChanged { get; set; }
    public DateTime? CreateDate { get; set; }
    public DateTime? CompleteDate { get; set; }
    public DateTime? FullRatificationDate { get; set; }

    // ── Assigned Staff ───────────────────────────────────────────────────
    public int? AppraisalStaff { get; set; }
    public int? HearingAppraisalStaff { get; set; }
    [MaxLength(10)] public string? AssignedPanel { get; set; }

    // ── Hearing Schedule ─────────────────────────────────────────────────
    public DateTime? HearingStartDate { get; set; }
    public DateTime? HearingFinishedDate { get; set; }
    public DateTime? ArrivedDate { get; set; }
    [MaxLength(1)] public string? HearingRescheduled { get; set; }
    [MaxLength(1)] public string? FullBoardHearing { get; set; }

    // ── Appraiser Meeting ────────────────────────────────────────────────
    public DateTime? AppraiserMeetingDateTime { get; set; }
    public int? AppraiserMeetingAppraiserId { get; set; }
    [MaxLength(1024)] public string? AppraiserMeetingAppraiserComments { get; set; }
    [MaxLength(1024)] public string? AppraiserMeetingTaxpayerComments { get; set; }

    // ── Evidence ─────────────────────────────────────────────────────────
    [MaxLength(1)] public string? TaxpayerDocRequested { get; set; }
    [MaxLength(1)] public string? TaxpayerEvidenceRequested { get; set; }
    public DateTime? TaxpayerEvidenceDeliveredDate { get; set; }

    // ── Decisions / Motions ──────────────────────────────────────────────
    [MaxLength(500)] public string? FirstMotion { get; set; }
    [MaxLength(10)] public string? FirstMotionDecisionCd { get; set; }
    public DateTime? FirstMotionDecisionDate { get; set; }
    [MaxLength(1)] public string? FirstMotionPass { get; set; }
    [MaxLength(500)] public string? SecondMotion { get; set; }
    [MaxLength(10)] public string? SecondMotionDecisionCd { get; set; }
    public DateTime? SecondMotionDecisionDate { get; set; }
    [MaxLength(1)] public string? SecondMotionPass { get; set; }
    [MaxLength(500)] public string? OtherMotion { get; set; }
    [MaxLength(10)] public string? DecisionReasonCd { get; set; }
    [MaxLength(1)] public string? SustainDistrictVal { get; set; }
    [MaxLength(1)] public string? ProtValType { get; set; }

    // ── Comments ─────────────────────────────────────────────────────────
    [MaxLength(1024)] public string? ProtComments { get; set; }
    [MaxLength(1024)] public string? TaxpayerComments { get; set; }
    [MaxLength(1024)] public string? DistrictComments { get; set; }
    [MaxLength(500)] public string? ArbInstructions { get; set; }

    // ── Assigned Values ──────────────────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? AppraiserAssignedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? ArbAssignedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AppraiserAssignedLandVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? AppraiserAssignedImprvVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BoeAssignedLandVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BoeAssignedImprvVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? OpinionOfValue { get; set; }

    // ── Begin Values (before appeal) ─────────────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginAppraisedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginAssessedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginLandHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginLandNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginImprvHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginImprvNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginAgUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginAgMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginTimberUse { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginTimberMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? BeginTenPercentCap { get; set; }
    [MaxLength(50)] public string? BeginExemptions { get; set; }
    [MaxLength(50)] public string? BeginEntities { get; set; }

    // ── Final Values (after appeal decision) ─────────────────────────────
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalAppraisedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalAssessedVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalLandHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalLandNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalImprvHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalImprvNonHstdVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalAgUseVal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalAgMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalTimberUse { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalTimberMarket { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal? FinalTenPercentCap { get; set; }
    [MaxLength(50)] public string? FinalExemptions { get; set; }
    [MaxLength(50)] public string? FinalEntities { get; set; }

    // ── Flags ────────────────────────────────────────────────────────────
    public bool? HighlyDisputedProperty { get; set; }
    public bool? TaxesPaid { get; set; }
    public bool? CasePrepared { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
