// backend/src/TerraFusion.Core/Entities/CountyScenario.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum ScenarioAdjustmentType
{
    LandValuePercent, ImprovementValuePercent, TotalValuePercent,
    LandValueFlat, ImprovementValueFlat,
    NeighborhoodFactor, FeatureUnitRate
}

public enum ScenarioStatus { Draft, Saved, Reviewed, Approved, Promoted, Rejected, Archived }

public class CountyScenario
{
    public Guid ScenarioId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid CohortId { get; set; }
    public Guid CountyId { get; set; }

    public ScenarioAdjustmentType AdjustmentType { get; set; }

    // JSON: { magnitude: 4.0, baseYear?: null, featureCode?: null }
    [Required]
    public string Parameters { get; set; } = "{}";

    [Required, StringLength(1000)]
    public string Rationale { get; set; } = string.Empty;

    public ScenarioStatus Status { get; set; } = ScenarioStatus.Draft;

    public Guid? CompareTargetId { get; set; }

    // Cached impact preview (populated by preview endpoint, invalidated on param change)
    public string? ImpactPreviewJson { get; set; }

    // Navigation
    public CountyStudySession? Study { get; set; }
    public CountyCohort? Cohort { get; set; }
    public CountyAdjustmentSet? AdjustmentSet { get; set; }
    public ICollection<CountyExceptionSet> ExceptionSets { get; set; } = new List<CountyExceptionSet>();

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
