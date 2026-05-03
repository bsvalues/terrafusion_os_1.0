using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class CalibrationMemo
{
    public int Id { get; set; }
    public Guid CountyId { get; set; }

    [Required][StringLength(20)]
    public string Status { get; set; } = "DRAFT";

    public string? Section1Purpose { get; set; }
    public string? Section2DataUsed { get; set; }
    public string? Section3Diagnostics { get; set; }
    public string? Section4ChangeMade { get; set; }
    public string? Section5Impact { get; set; }
    public string? Section6Verification { get; set; }
    public string? Section7SignOff { get; set; }
    public string? Section8Notes { get; set; }

    public int CompletenessScore { get; set; }

    [StringLength(100)]
    public string? SignedBy { get; set; }

    public DateTime? SignedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(100)]
    public string CreatedBy { get; set; } = "system";

    [StringLength(100)]
    public string UpdatedBy { get; set; } = "system";
}
