using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Levy.Models
{
    /// <summary>
    /// Represents a levy measure (tax levy) for a jurisdiction
    /// Government. Transcended. - Championship-level levy intelligence
    /// </summary>
    [Table("LevyMeasures")]
    public class LevyMeasure
    {
        [Key]
        public Guid Id { get; set; }

        /// <summary>
        /// County isolation - each levy belongs to one county
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string CountyId { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        /// <summary>
        /// Levy year (fiscal year)
        /// </summary>
        public int LevyYear { get; set; }

        /// <summary>
        /// Type of levy: General, Bond, Levy Lid Lift, etc.
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string LevyType { get; set; } = "General";

        /// <summary>
        /// Status: Draft, Approved, Active, Historical
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Draft";

        /// <summary>
        /// Target levy amount (dollars)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal TargetAmount { get; set; }

        /// <summary>
        /// Actual levy amount calculated (dollars)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal CalculatedAmount { get; set; }

        /// <summary>
        /// Maximum levy rate allowed (per $1000 of assessed value)
        /// </summary>
        [Column(TypeName = "decimal(10,6)")]
        public decimal? MaximumRate { get; set; }

        /// <summary>
        /// Calculated levy rate (per $1000 of assessed value)
        /// </summary>
        [Column(TypeName = "decimal(10,6)")]
        public decimal CalculatedRate { get; set; }

        /// <summary>
        /// Date the levy was approved
        /// </summary>
        public DateTime? ApprovedDate { get; set; }

        /// <summary>
        /// Date the levy becomes effective
        /// </summary>
        public DateTime? EffectiveDate { get; set; }

        /// <summary>
        /// Date the levy expires (for multi-year levies)
        /// </summary>
        public DateTime? ExpirationDate { get; set; }

        /// <summary>
        /// Is this levy subject to the 1% constitutional limit?
        /// </summary>
        public bool SubjectToLimit { get; set; } = true;

        /// <summary>
        /// Total assessed value for levy calculation
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAssessedValue { get; set; }

        /// <summary>
        /// Navigation: Districts included in this levy
        /// </summary>
        public ICollection<District> Districts { get; set; } = new List<District>();

        /// <summary>
        /// Navigation: Levy rates by district
        /// </summary>
        public ICollection<LevyRate> LevyRates { get; set; } = new List<LevyRate>();

        /// <summary>
        /// Navigation: Scenarios for this levy
        /// </summary>
        public ICollection<LevyScenario> Scenarios { get; set; } = new List<LevyScenario>();

        #region Audit Fields (FISMA Compliance)

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        [MaxLength(200)]
        public string CreatedBy { get; set; } = "System";

        [MaxLength(200)]
        public string? UpdatedBy { get; set; }

        #endregion

        #region Quantum Enhancement Fields

        /// <summary>
        /// Quantum optimization applied (factor 949)
        /// </summary>
        public bool QuantumOptimized { get; set; }

        /// <summary>
        /// AI-calculated confidence score for levy calculation
        /// </summary>
        [Column(TypeName = "decimal(5,4)")]
        public decimal? AiConfidenceScore { get; set; }

        /// <summary>
        /// JSON metadata for extensibility
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? Metadata { get; set; }

        #endregion
    }
}
