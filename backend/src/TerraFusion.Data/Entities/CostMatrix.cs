using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Data.Entities;

/// <summary>
/// Cost Matrix entity for CAMA cost approach calculations.
/// Seeded from real Benton County data (costforge-ai-workspace/benton_cost_matrix.json).
/// Each row represents a building type × region cost factor with adjustment multipliers.
/// </summary>
[Table("cost_matrices")]
[Index(nameof(CountyCode), nameof(BuildingType), nameof(Region), nameof(MatrixYear),
    Name = "IX_CostMatrix_County_Type_Region_Year")]
[Index(nameof(CountyCode), Name = "IX_CostMatrix_CountyCode")]
public class CostMatrix
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>County code for sovereign data isolation</summary>
    [Required]
    [Column("county_code")]
    [MaxLength(20)]
    public string CountyCode { get; set; } = "BENTON";

    /// <summary>Building type code (A1, C1, C4, I1, R1, R2, S1)</summary>
    [Required]
    [Column("building_type")]
    [MaxLength(10)]
    public string BuildingType { get; set; } = string.Empty;

    /// <summary>Building type description (e.g., "Agricultural - Farm")</summary>
    [Column("building_type_description")]
    [MaxLength(200)]
    public string? BuildingTypeDescription { get; set; }

    /// <summary>Region within the county (Central Benton, East Benton, West Benton)</summary>
    [Required]
    [Column("region")]
    [MaxLength(100)]
    public string Region { get; set; } = string.Empty;

    /// <summary>Base cost per square foot for this building type × region</summary>
    [Required]
    [Column("base_cost", TypeName = "decimal(18,6)")]
    public decimal BaseCost { get; set; }

    /// <summary>Matrix year (assessment year these factors apply to)</summary>
    [Required]
    [Column("matrix_year")]
    public int MatrixYear { get; set; }

    /// <summary>External matrix ID from PACS system</summary>
    [Column("matrix_id")]
    public int? MatrixId { get; set; }

    /// <summary>Matrix description from source system</summary>
    [Column("matrix_description")]
    [MaxLength(200)]
    public string? MatrixDescription { get; set; }

    /// <summary>Number of data points used to derive this cost factor</summary>
    [Column("data_points")]
    public int DataPoints { get; set; }

    /// <summary>Minimum cost in source data</summary>
    [Column("min_cost", TypeName = "decimal(18,6)")]
    public decimal MinCost { get; set; }

    /// <summary>Maximum cost in source data</summary>
    [Column("max_cost", TypeName = "decimal(18,6)")]
    public decimal MaxCost { get; set; }

    /// <summary>Complexity adjustment factor (default 1.0)</summary>
    [Column("complexity_factor", TypeName = "decimal(8,4)")]
    public decimal ComplexityFactor { get; set; } = 1.0m;

    /// <summary>Quality adjustment factor (default 1.0)</summary>
    [Column("quality_factor", TypeName = "decimal(8,4)")]
    public decimal QualityFactor { get; set; } = 1.0m;

    /// <summary>Condition adjustment factor (default 1.0)</summary>
    [Column("condition_factor", TypeName = "decimal(8,4)")]
    public decimal ConditionFactor { get; set; } = 1.0m;

    // Audit fields (FISMA compliance)
    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [Column("created_by")]
    [MaxLength(200)]
    public string CreatedBy { get; set; } = "SYSTEM";

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    [MaxLength(200)]
    public string? UpdatedBy { get; set; }

    /// <summary>Data source tracking</summary>
    [Required]
    [Column("data_source")]
    [MaxLength(100)]
    public string DataSource { get; set; } = "BENTON_COST_MATRIX_2025";
}
