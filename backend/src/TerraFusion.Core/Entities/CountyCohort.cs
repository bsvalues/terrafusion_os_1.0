// backend/src/TerraFusion.Core/Entities/CountyCohort.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum CohortSelectionType { Segment, Neighborhood, Lasso, Rule, Hybrid }

public class CountyCohort
{
    public Guid CohortId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid CountyId { get; set; }

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    public CohortSelectionType SelectionType { get; set; }

    // JSON: { segmentIds?, neighborhoodIds?, geometry?, ruleExpression? }
    [Required]
    public string Definition { get; set; } = "{}";

    public int ParcelCount { get; set; }
    public bool IsHybrid { get; set; }

    // Navigation
    public CountyStudySession? Study { get; set; }
    public ICollection<CountyScenario> Scenarios { get; set; } = new List<CountyScenario>();

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
