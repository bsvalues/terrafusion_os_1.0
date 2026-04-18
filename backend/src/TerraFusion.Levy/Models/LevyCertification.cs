using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Levy.Models
{
    /// <summary>
    /// Lifecycle state of a levy certification.
    /// </summary>
    public enum LevyCertificationStatus
    {
        /// <summary>In-progress draft, not yet submitted for review.</summary>
        Draft = 0,

        /// <summary>Submitted to Levy Specialist for review.</summary>
        PendingReview = 1,

        /// <summary>Reviewed, attested, and certified. Authoritative.</summary>
        Certified = 2,

        /// <summary>Replaced by a newer certification (see <see cref="LevyCertification.SupersededByCertificationId"/>).</summary>
        Superseded = 3,

        /// <summary>Revoked — must not be used. <see cref="LevyCertification.Notes"/> explains why.</summary>
        Revoked = 4
    }

    /// <summary>
    /// A certified (or in-process) levy calculation for a single district for a single tax year.
    /// Encapsulates every input, every statutory citation, every derived value,
    /// and the SHA-256 attestation envelope that proves the inputs were not altered
    /// after certification.
    /// </summary>
    /// <remarks>
    /// Governance: rows in <see cref="LevyCertificationStatus.Certified"/> state are immutable.
    /// Changes require a new certification row that sets <see cref="SupersededByCertificationId"/>
    /// on the prior row.
    /// </remarks>
    [Table("LevyCertifications")]
    public class LevyCertification
    {
        [Key]
        public Guid Id { get; set; }

        /// <summary>County isolation (multi-tenant).</summary>
        [Required]
        [MaxLength(100)]
        public string CountyId { get; set; } = string.Empty;

        /// <summary>Taxing district code — e.g., "BC-REG".</summary>
        [Required]
        [MaxLength(50)]
        public string DistrictCode { get; set; } = string.Empty;

        /// <summary>Tax year the certification applies to.</summary>
        [Required]
        public int TaxYear { get; set; }

        /// <summary>Lifecycle state.</summary>
        [Required]
        public LevyCertificationStatus Status { get; set; } = LevyCertificationStatus.Draft;

        // ── Statutory inputs ─────────────────────────────────────────────

        /// <summary>Regular-levy assessed value the rate is applied to.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AssessedValueRegular { get; set; }

        /// <summary>Limit Factor — RCW 84.55.005 — min(1.01, 1 + IPD%) unless lid lift.</summary>
        [Column(TypeName = "decimal(10,6)")]
        public decimal LimitFactor { get; set; }

        /// <summary>Prior-year Highest Lawful Levy × LimitFactor + add-ons.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal HighestLawfulLevy { get; set; }

        /// <summary>Assessed value of new construction.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal NewConstructionValue { get; set; }

        /// <summary>Allowed levy attributable to new construction.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal NewConstructionLevy { get; set; }

        /// <summary>Assessed value of annexed property (if any).</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? AnnexationValue { get; set; }

        /// <summary>Allowed levy attributable to annexation (if any).</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? AnnexationLevy { get; set; }

        /// <summary>Refund-fund amount per RCW 84.69 (if applicable).</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? RefundFundAmount { get; set; }

        /// <summary>Voter-approved lid-lift amount (if applicable) — RCW 84.55.050.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? LidLiftAmount { get; set; }

        /// <summary>Banked capacity drawn down this cert — RCW 84.55.092.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal BankedCapacityUsed { get; set; }

        /// <summary>Banked capacity carried forward after this cert.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal BankedCapacityRemaining { get; set; }

        // ── Derived outputs ──────────────────────────────────────────────

        /// <summary>Final certified levy amount ($).</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal LeviedAmount { get; set; }

        /// <summary>Final certified rate ($ per $1,000 AV).</summary>
        [Column(TypeName = "decimal(10,6)")]
        public decimal LevyRate { get; set; }

        // ── Reference provenance (FKs to ReferenceSource) ────────────────

        /// <summary>IPD reference used (required for regular levies).</summary>
        public Guid? IpdReferenceId { get; set; }

        /// <summary>State-school reference (required for state-school levies only).</summary>
        public Guid? StateSchoolReferenceId { get; set; }

        /// <summary>Lid-lift reference (required when <see cref="LidLiftAmount"/> is set).</summary>
        public Guid? LidLiftReferenceId { get; set; }

        /// <summary>Refund-fund reference (required when <see cref="RefundFundAmount"/> is set).</summary>
        public Guid? RefundFundReferenceId { get; set; }

        // ── Attestation ─────────────────────────────────────────────────

        /// <summary>Full SHA-256 attestation envelope (JSON) from /api/levy/v1/attest.</summary>
        [Column(TypeName = "jsonb")]
        public string? AttestationEnvelope { get; set; }

        /// <summary>Payload SHA-256 hash (64 hex chars). Mirrors envelope.payloadHash.</summary>
        [MaxLength(64)]
        public string? AttestationHash { get; set; }

        /// <summary>correlationId of the attest call (links to TerraTrace).</summary>
        [MaxLength(200)]
        public string? AttestationCorrelationId { get; set; }

        /// <summary>Full input/output snapshot (JSON) for reproducibility.</summary>
        [Column(TypeName = "jsonb")]
        public string? CalculationSnapshot { get; set; }

        // ── Certification metadata ───────────────────────────────────────

        /// <summary>Timestamp of Certified transition (null until certified).</summary>
        public DateTime? CertifiedAt { get; set; }

        /// <summary>Levy Specialist who certified. Null until certified.</summary>
        [MaxLength(200)]
        public string? CertifiedBy { get; set; }

        /// <summary>Id of the certification that supersedes this one (if any).</summary>
        public Guid? SupersededByCertificationId { get; set; }

        /// <summary>Timestamp the cert was superseded.</summary>
        public DateTime? SupersededAt { get; set; }

        /// <summary>Free-text notes (operator commentary, revocation reason, etc.).</summary>
        [MaxLength(4000)]
        public string? Notes { get; set; }

        // ── Audit ───────────────────────────────────────────────────────

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        [MaxLength(200)]
        public string CreatedBy { get; set; } = string.Empty;

        public DateTime? UpdatedAt { get; set; }

        [MaxLength(200)]
        public string? UpdatedBy { get; set; }
    }
}
