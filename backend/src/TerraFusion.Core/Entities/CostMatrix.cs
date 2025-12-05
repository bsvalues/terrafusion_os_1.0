using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TerraFusion.Core.Entities;

public class CostMatrix
{
    public int Id { get; set; }

    // County relationship
    public Guid CountyId { get; set; }

    // Matrix configuration
    [StringLength(50)]
    public string MatrixType { get; set; } = string.Empty;

    public decimal BaseRate { get; set; }
    public decimal Multiplier { get; set; } = 1.0m;

    [Required]
    [StringLength(100)]
    public string Region { get; set; } = string.Empty;

    [Required]
    [StringLength(10)]
    public string BuildingType { get; set; } = string.Empty;

    [StringLength(200)]
    public string BuildingTypeDescription { get; set; } = string.Empty;

    public decimal BaseCost { get; set; }
    public int MatrixYear { get; set; }
    public int SourceMatrixId { get; set; }

    [StringLength(500)]
    public string MatrixDescription { get; set; } = string.Empty;

    public int DataPoints { get; set; }
    public decimal MinCost { get; set; }
    public decimal MaxCost { get; set; }

    [StringLength(50)]
    public string County { get; set; } = string.Empty;

    [StringLength(5)]
    public string State { get; set; } = string.Empty;

    // Adjustment factors as JSON
    public string AdjustmentFactors { get; set; } = "{}";

    // Legacy fields for backward compatibility
    public decimal CostPerSqFt { get; set; }
    public decimal AdjustmentFactor { get; set; } = 1.0m;

    [StringLength(50)]
    public string? Grade { get; set; }

    [StringLength(50)]
    public string? Condition { get; set; }

    public int? YearBuilt { get; set; }
    public decimal? DepreciationRate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EffectiveDate { get; set; }
}

public class AdjustmentFactors
{
    public decimal Complexity { get; set; } = 1.0m;
    public decimal Quality { get; set; } = 1.0m;
    public decimal Condition { get; set; } = 1.0m;
}
