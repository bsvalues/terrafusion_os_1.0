using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class SaleRecord
{
    public int Id { get; set; }
    public int MatrixVersionId { get; set; }
    public MatrixVersion MatrixVersion { get; set; } = null!;

    [Required][StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    [StringLength(50)]
    public string RevalArea { get; set; } = string.Empty;

    [StringLength(100)]
    public string BuildingType { get; set; } = string.Empty;

    public DateTime SaleDate { get; set; }
    public decimal SalePrice { get; set; }
    public decimal AssessedValue { get; set; }
    public decimal Ratio { get; set; }           // AssessedValue / SalePrice

    public bool IsOutlierIqr { get; set; }

    [StringLength(50)]
    public string? AiClassification { get; set; } // ESTATE_SALE | RENOVATION | RELATED_PARTY | NEW_CONSTRUCTION

    [StringLength(500)]
    public string? PacsFlags { get; set; }

    public int ValueQuintile { get; set; }        // 1–5 computed on import
    public int AgeBand { get; set; }              // 1=Pre-1960 … 5=Post-2015

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(100)]
    public string CreatedBy { get; set; } = "system";

    [StringLength(100)]
    public string UpdatedBy { get; set; } = "system";
}
