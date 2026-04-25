using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class PropertyWorkbenchFlag
{
    public int Id { get; set; }
    public int? CalibrationFindingId { get; set; }
    public CalibrationFinding? CalibrationFinding { get; set; }

    [Required][StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    [Required][StringLength(500)]
    public string Reason { get; set; } = string.Empty;

    [StringLength(20)]
    public string Status { get; set; } = "PENDING";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(100)]
    public string CreatedBy { get; set; } = "system";

    [StringLength(100)]
    public string UpdatedBy { get; set; } = "system";
}
