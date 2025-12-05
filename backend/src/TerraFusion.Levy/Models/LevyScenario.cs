using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Levy.Models
{
    /// <summary>
    /// Represents a levy calculation scenario for what-if analysis
    /// Government. Transcended. - Infinite scenario modeling
    /// </summary>
    [Table("LevyScenarios")]
    public class LevyScenario
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
        /// Foreign key to parent LevyMeasure
        /// </summary>
        [Required]
        public Guid LevyMeasureId { get; set; }

        /// <summary>
        /// Navigation property to LevyMeasure
        /// </summary>
        [ForeignKey(nameof(LevyMeasureId))]
        public LevyMeasure LevyMeasure { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        /// <summary>
        /// Scenario type: Baseline, Optimistic, Conservative, Custom
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string ScenarioType { get; set; } = "Custom";

        /// <summary>
        /// Assumed assessed value for this scenario
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AssessedValue { get; set; }

        /// <summary>
        /// Assumed levy rate for this scenario
        /// </summary>
        [Column(TypeName = "decimal(10,6)")]
        public decimal LevyRate { get; set; }

        /// <summary>
        /// Calculated levy amount for this scenario
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal CalculatedAmount { get; set; }

        /// <summary>
        /// Projected revenue for this scenario
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal ProjectedRevenue { get; set; }

        /// <summary>
        /// Assumed collection rate (percentage)
        /// </summary>
        [Column(TypeName = "decimal(5,4)")]
        public decimal CollectionRate { get; set; } = 0.98m; // 98% default

        /// <summary>
        /// Is this the active/selected scenario?
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Scenario assumptions (JSON)
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? Assumptions { get; set; }

        /// <summary>
        /// Navigation: Revenue projections for this scenario
        /// </summary>
        public ICollection<RevenueProjection> RevenueProjections { get; set; } = new List<RevenueProjection>();

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
        /// AI-generated scenario insights
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? AiInsights { get; set; }

        /// <summary>
        /// Quantum optimization applied
        /// </summary>
        public bool QuantumOptimized { get; set; }

        /// <summary>
        /// Confidence score for this scenario
        /// </summary>
        [Column(TypeName = "decimal(5,4)")]
        public decimal? ConfidenceScore { get; set; }

        #endregion
    }
}
