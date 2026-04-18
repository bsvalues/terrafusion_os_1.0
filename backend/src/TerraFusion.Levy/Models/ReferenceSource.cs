using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Levy.Models
{
    /// <summary>
    /// Classifies the statutory/authoritative reference source for levy calculation inputs.
    /// </summary>
    public enum ReferenceSourceType
    {
        /// <summary>IPD annual rate — WA DOR September memo — RCW 84.55.005.</summary>
        Ipd = 0,

        /// <summary>State school levy rate — RCW 84.52.065 / 84.52.068.</summary>
        StateSchool = 1,

        /// <summary>Voter-approved lid lift — RCW 84.55.050.</summary>
        LidLift = 2,

        /// <summary>Refund fund component — RCW 84.69.</summary>
        RefundFund = 3,

        /// <summary>Banked capacity carry-forward — RCW 84.55.092.</summary>
        BankedCapacity = 4
    }

    /// <summary>
    /// Authoritative reference input for a levy calculation.
    /// Every value used in a certification must trace back to a ReferenceSource
    /// with a verifiable citation, issuer, and specialist review.
    ///
    /// Governance: rows are immutable once <see cref="ReviewedAt"/> is set.
    /// Replacements are done by inserting a new row with <see cref="IsActive"/>=true
    /// and deactivating the prior.
    /// </summary>
    [Table("ReferenceSources")]
    public class ReferenceSource
    {
        [Key]
        public Guid Id { get; set; }

        /// <summary>County isolation (multi-tenant).</summary>
        [Required]
        [MaxLength(100)]
        public string CountyId { get; set; } = string.Empty;

        /// <summary>Kind of reference (IPD, StateSchool, LidLift, RefundFund, BankedCapacity).</summary>
        [Required]
        public ReferenceSourceType SourceType { get; set; }

        /// <summary>Tax year the value applies to (e.g., 2026).</summary>
        [Required]
        public int TaxYear { get; set; }

        /// <summary>Statutory citation — e.g., "RCW 84.55.005".</summary>
        [Required]
        [MaxLength(100)]
        public string Citation { get; set; } = string.Empty;

        /// <summary>
        /// District code this reference applies to (null = applies to all districts in county).
        /// Required for LidLift and BankedCapacity.
        /// </summary>
        [MaxLength(50)]
        public string? DistrictCode { get; set; }

        /// <summary>
        /// Scalar numeric value (e.g., IPD percent = 4.523, state-school rate = 2.70 per $1k).
        /// Null if the reference is structured and must be read from <see cref="ValueJson"/>.
        /// </summary>
        [Column(TypeName = "decimal(18,6)")]
        public decimal? Value { get; set; }

        /// <summary>Unit of the scalar value (e.g., "percent", "dollars_per_thousand_av", "dollars").</summary>
        [MaxLength(50)]
        public string? ValueUnit { get; set; }

        /// <summary>Structured value for multi-part references (stored as jsonb).</summary>
        [Column(TypeName = "jsonb")]
        public string? ValueJson { get; set; }

        /// <summary>URL of the authoritative source document (DOR memo, resolution PDF, etc.).</summary>
        [MaxLength(1000)]
        public string? SourceUrl { get; set; }

        /// <summary>Issuing authority — e.g., "WA DOR Property Tax Division".</summary>
        [Required]
        [MaxLength(200)]
        public string IssuedBy { get; set; } = string.Empty;

        /// <summary>Date the source document was issued by the authority.</summary>
        [Required]
        public DateTime IssuedDate { get; set; }

        /// <summary>When this record was ingested into the system.</summary>
        [Required]
        public DateTime IngestedAt { get; set; }

        /// <summary>Operator who ingested the record.</summary>
        [Required]
        [MaxLength(200)]
        public string IngestedBy { get; set; } = string.Empty;

        /// <summary>Levy Specialist who reviewed and attested the record. Null until signed off.</summary>
        [MaxLength(200)]
        public string? ReviewedBy { get; set; }

        /// <summary>Timestamp of specialist review. Null until signed off.</summary>
        public DateTime? ReviewedAt { get; set; }

        /// <summary>True while this row is the authoritative value for (County, SourceType, TaxYear, District).</summary>
        [Required]
        public bool IsActive { get; set; }

        /// <summary>Free-text operator notes (ingest provenance, edge cases, etc.).</summary>
        [MaxLength(4000)]
        public string? Notes { get; set; }
    }
}
