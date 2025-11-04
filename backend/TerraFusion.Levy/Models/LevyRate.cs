using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Levy.Models
{
    /// <summary>
    /// Represents the levy rate for a specific district and levy measure
    /// </summary>
    [Table("LevyRates")]
    public class LevyRate
    {
        [Key]
        public Guid Id { get; set; }

        /// <summary>
        /// County isolation
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string CountyId { get; set; } = string.Empty;

        /// <summary>
        /// Foreign key to LevyMeasure
        /// </summary>
        [Required]
        public Guid LevyMeasureId { get; set; }

        /// <summary>
        /// Navigation property to LevyMeasure
        /// </summary>
        [ForeignKey(nameof(LevyMeasureId))]
        public LevyMeasure LevyMeasure { get; set; } = null!;

        /// <summary>
        /// Foreign key to District (optional - null for county-wide levies)
        /// </summary>
        public Guid? DistrictId { get; set; }

        /// <summary>
        /// Navigation property to District
        /// </summary>
        [ForeignKey(nameof(DistrictId))]
        public District? District { get; set; }

        /// <summary>
        /// Levy rate per $1000 of assessed value
        /// </summary>
        [Column(TypeName = "decimal(10,6)")]
        public decimal Rate { get; set; }

        /// <summary>
        /// Assessed value this rate applies to
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AssessedValue { get; set; }

        /// <summary>
        /// Calculated levy amount (Rate * AssessedValue / 1000)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal LevyAmount { get; set; }

        /// <summary>
        /// Effective date for this rate
        /// </summary>
        public DateTime EffectiveDate { get; set; }

        /// <summary>
        /// Expiration date for this rate
        /// </summary>
        public DateTime? ExpirationDate { get; set; }

        #region Audit Fields

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        [MaxLength(200)]
        public string CreatedBy { get; set; } = "System";

        [MaxLength(200)]
        public string? UpdatedBy { get; set; }

        #endregion

        #region Quantum Enhancement

        /// <summary>
        /// AI-calculated optimal rate (if different from Rate)
        /// </summary>
        [Column(TypeName = "decimal(10,6)")]
        public decimal? AiOptimalRate { get; set; }

        /// <summary>
        /// Confidence score for this rate calculation
        /// </summary>
        [Column(TypeName = "decimal(5,4)")]
        public decimal? ConfidenceScore { get; set; }

        #endregion
    }
}
