using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class RevalAreaEvidenceAge
{
    public int Id { get; set; }
    public int MatrixVersionId { get; set; }
    public MatrixVersion MatrixVersion { get; set; } = null!;

    [Required][StringLength(50)]
    public string RevalArea { get; set; } = string.Empty;

    [Required][StringLength(100)]
    public string Factor { get; set; } = string.Empty;

    public DateTime? LastRatioStudyDate { get; set; }
    public int SaleCount { get; set; }
    public decimal? MedianRatio { get; set; }

    public int EvidenceAgeMonths { get; set; }

    [Required][StringLength(20)]
    public string EvidenceStatus { get; set; } = "CURRENT";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
