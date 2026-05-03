using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class OutlierExclusion
{
    public int Id { get; set; }
    public int MatrixVersionId { get; set; }
    public int SaleRecordId { get; set; }
    public SaleRecord SaleRecord { get; set; } = null!;

    [Required][StringLength(30)]
    public string DispositionType { get; set; } = string.Empty; // EXCLUDED | FLAGGED_DATA | ACCEPTED

    [StringLength(500)]
    public string? AppraiserNote { get; set; }

    public bool DataProblemFlagged { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(100)]
    public string CreatedBy { get; set; } = "system";
}
