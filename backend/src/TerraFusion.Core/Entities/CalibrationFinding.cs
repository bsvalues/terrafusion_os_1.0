using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class CalibrationFinding
{
    public int Id { get; set; }
    public int MatrixVersionId { get; set; }
    public MatrixVersion MatrixVersion { get; set; } = null!;

    [Required][StringLength(50)]
    public string Classification { get; set; } = string.Empty;

    [Required][StringLength(100)]
    public string BuildingType { get; set; } = string.Empty;

    [StringLength(50)]
    public string? RevalArea { get; set; }

    public decimal? PrdValue { get; set; }
    public decimal? PrbValue { get; set; }
    public decimal? CodValue { get; set; }
    public decimal? ConfidenceLevel { get; set; }

    public decimal? ProposedAdjustmentPct { get; set; }
    public decimal? ProposedRateNew { get; set; }
    public decimal? EstimatedAvImpact { get; set; }

    public string? OutlierParcelIds { get; set; }

    [StringLength(500)]
    public string? EvidenceSummary { get; set; }

    [StringLength(20)]
    public string ResolutionStatus { get; set; } = "OPEN";

    [StringLength(500)]
    public string? AppraiserNote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(100)]
    public string CreatedBy { get; set; } = "system";

    [StringLength(100)]
    public string UpdatedBy { get; set; } = "system";
}
