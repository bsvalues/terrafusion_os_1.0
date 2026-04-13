using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public class MatrixVersion
{
    public int Id { get; set; }
    public Guid CountyId { get; set; }

    [Required][StringLength(20)]
    public string Version { get; set; } = string.Empty;

    [Required][StringLength(20)]
    public string Status { get; set; } = "DRAFT";

    [Required][StringLength(20)]
    public string VersionType { get; set; } = "CALIBRATED";

    public DateTime? EffectiveDate { get; set; }
    public DateTime? LockedAt { get; set; }

    [StringLength(100)]
    public string? LockedBy { get; set; }

    public string RateSnapshot { get; set; } = "{}";

    [StringLength(500)]
    public string? TriggeringEvent { get; set; }

    public DateTime? SalesWindowStart { get; set; }
    public DateTime? SalesWindowEnd { get; set; }
    public string SalesExclusionRules { get; set; } = "{}";

    public decimal? PrdBefore { get; set; }
    public decimal? PrdAfter { get; set; }
    public decimal? PrbBefore { get; set; }
    public decimal? PrbAfter { get; set; }
    public decimal? CodBefore { get; set; }
    public decimal? CodAfter { get; set; }
    public decimal? CountyAvImpact { get; set; }

    public string SignOffChain { get; set; } = "[]";
    public int? CalibrationMemoId { get; set; }
    public CalibrationMemo? CalibrationMemo { get; set; }
    public DateTime? NextReviewDate { get; set; }
    public int? ParentVersionId { get; set; }
    public MatrixVersion? ParentVersion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(100)]
    public string CreatedBy { get; set; } = "system";

    [StringLength(100)]
    public string UpdatedBy { get; set; } = "system";

    public ICollection<RevalAreaEvidenceAge> EvidenceAges { get; set; } = new List<RevalAreaEvidenceAge>();
    public ICollection<CalibrationFinding> Findings { get; set; } = new List<CalibrationFinding>();
}
