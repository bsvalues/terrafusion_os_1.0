using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Levy.Models
{
    /// <summary>
    /// Represents revenue projection for a levy scenario over time
    /// </summary>
    [Table("RevenueProjections")]
    public class RevenueProjection
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
        /// Foreign key to LevyScenario
        /// </summary>
        [Required]
        public Guid LevyScenarioId { get; set; }

        /// <summary>
        /// Navigation property to LevyScenario
        /// </summary>
        [ForeignKey(nameof(LevyScenarioId))]
        public LevyScenario LevyScenario { get; set; } = null!;

        /// <summary>
        /// Fiscal year for this projection
        /// </summary>
        public int FiscalYear { get; set; }

        /// <summary>
        /// Projected assessed value
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal ProjectedAssessedValue { get; set; }

        /// <summary>
        /// Projected levy amount
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal ProjectedLevyAmount { get; set; }

        /// <summary>
        /// Projected collection rate
        /// </summary>
        [Column(TypeName = "decimal(5,4)")]
        public decimal ProjectedCollectionRate { get; set; }

        /// <summary>
        /// Projected net revenue (levy amount * collection rate)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal ProjectedNetRevenue { get; set; }

        /// <summary>
        /// Growth rate assumption (percentage)
        /// </summary>
        [Column(TypeName = "decimal(5,4)")]
        public decimal GrowthRate { get; set; }

        /// <summary>
        /// Confidence level for this projection
        /// </summary>
        [Column(TypeName = "decimal(5,4)")]
        public decimal? ConfidenceLevel { get; set; }

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

        #region AI Enhancement

        /// <summary>
        /// AI-calculated projection (if different from manual projection)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? AiProjectedRevenue { get; set; }

        /// <summary>
        /// Risk factors (JSON array)
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? RiskFactors { get; set; }

        #endregion
    }
}
