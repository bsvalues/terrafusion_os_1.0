using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Levy.Models
{
    /// <summary>
    /// Per-district, per-year ledger entry for banked levy capacity under RCW 84.55.092.
    /// </summary>
    /// <remarks>
    /// Identity: (CountyId, DistrictCode, TaxYear) is unique among active rows.
    /// A district may only bank capacity if it has adopted the one-time resolution
    /// under RCW 84.55.0101 — that resolution MUST be linked via
    /// <see cref="ResolutionReferenceId"/>.
    /// </remarks>
    [Table("BankedCapacities")]
    public class BankedCapacity
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

        /// <summary>Tax year this ledger entry applies to.</summary>
        [Required]
        public int TaxYear { get; set; }

        /// <summary>Banked capacity carried into the year (prior year's ClosingBalance).</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal OpeningBalance { get; set; }

        /// <summary>New capacity accrued this year (HighestLawfulLevy − CertifiedLevy, when positive).</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AccruedThisYear { get; set; }

        /// <summary>Amount drawn down by this year's certification.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal UsedThisYear { get; set; }

        /// <summary>Opening + Accrued − Used. Carried forward as next year's OpeningBalance.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal ClosingBalance { get; set; }

        /// <summary>FK to the LevyCertification that set this entry (null until cert is signed).</summary>
        public Guid? CertificationId { get; set; }

        /// <summary>FK to ReferenceSource for the district's banked-capacity election resolution.</summary>
        public Guid? ResolutionReferenceId { get; set; }

        /// <summary>True while this row is the authoritative ledger entry for (County, District, TaxYear).</summary>
        [Required]
        public bool IsActive { get; set; } = true;

        /// <summary>Operator notes.</summary>
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
