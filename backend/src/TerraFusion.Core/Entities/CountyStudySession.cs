// backend/src/TerraFusion.Core/Entities/CountyStudySession.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum StudyType { RatioStudy, MassAppraisal, IncomeApproach, CostApproach }
public enum StudyStatus { Draft, Active, UnderReview, Archived }

public class CountyStudySession
{
    public Guid StudyId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }

    /// <summary>
    /// Denormalized county display name, resolved from Counties table at study creation.
    /// Stored here so evidence packets don't require a live join.
    /// </summary>
    public string CountyName { get; set; } = string.Empty;

    public int TaxYear { get; set; }
    public StudyType StudyType { get; set; } = StudyType.RatioStudy;
    public StudyStatus Status { get; set; } = StudyStatus.Draft;

    [StringLength(200)]
    public string? BaselineVersion { get; set; }

    public Guid? ActiveSegmentSetId { get; set; }

    // Navigation
    public ICollection<CountySegmentSet> SegmentSets { get; set; } = new List<CountySegmentSet>();
    public ICollection<CountyCohort> Cohorts { get; set; } = new List<CountyCohort>();
    public ICollection<CountyScenario> Scenarios { get; set; } = new List<CountyScenario>();

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
