using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

/// <summary>
/// Improvement attribute key-value store from PACS imprv_attr table.
/// Each row is one attribute (e.g., bedrooms, bathrooms, roof type, exterior,
/// garage type, HVAC, fireplace, pool) coded as i_attr_val_cd with numeric value.
/// </summary>
[Table("pacs_improvement_attributes")]
[Index(nameof(PacsPropId), nameof(PropValYear), nameof(PacsImprvId), nameof(PacsImprvDetId), nameof(PacsImprvAttrId), Name = "IX_PacsImprvAttr_Natural", IsUnique = true)]
[Index(nameof(ImprovementId), Name = "IX_PacsImprvAttr_ImprvId")]
[Index(nameof(AttributeCode), Name = "IX_PacsImprvAttr_Code")]
public class PacsImprovementAttribute
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ImprovementId { get; set; }
    public PacsImprovement Improvement { get; set; } = null!;

    public int PacsPropId { get; set; }
    public int PropValYear { get; set; }
    public int PacsImprvId { get; set; }
    public int PacsImprvDetId { get; set; }
    public int PacsImprvAttrId { get; set; }
    public int SupNum { get; set; }
    public int PacsAttrValId { get; set; }

    /// <summary>
    /// Attribute code — identifies what characteristic this row represents.
    /// Examples: BED, BATH, HEAT, COOL, ROOF, EXT, GAR, POOL, FP, STORIES, etc.
    /// (imprv_attr.i_attr_val_cd)
    /// </summary>
    [Required]
    [MaxLength(75)]
    public string AttributeCode { get; set; } = string.Empty;

    /// <summary>Numeric attribute value (imprv_attr.imprv_attr_val)</summary>
    [Column(TypeName = "decimal(18,4)")] public decimal? AttributeValue { get; set; }

    /// <summary>Unit count (imprv_attr.i_attr_unit)</summary>
    [Column(TypeName = "decimal(10,2)")] public decimal? AttrUnit { get; set; }

    /// <summary>Unit price (imprv_attr.i_attr_up)</summary>
    [Column(TypeName = "decimal(10,4)")] public decimal? AttrUnitPrice { get; set; }

    /// <summary>Adjustment factor (imprv_attr.i_attr_factor)</summary>
    [Column(TypeName = "decimal(10,6)")] public decimal? AttrFactor { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastPacsSync { get; set; }
}
