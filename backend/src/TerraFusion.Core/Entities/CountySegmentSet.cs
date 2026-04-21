// backend/src/TerraFusion.Core/Entities/CountySegmentSet.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum SegmentSetSourceType { Neighborhood, PropertyClass, Custom, Hybrid }

public class CountySegmentSet
{
    public Guid SegmentSetId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid CountyId { get; set; }

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    public SegmentSetSourceType SourceType { get; set; } = SegmentSetSourceType.Neighborhood;
    public int Version { get; set; } = 1;
    public bool IsBaseline { get; set; } = false;
    public Guid? DerivedFrom { get; set; }

    // Navigation
    public CountyStudySession? Study { get; set; }
    public ICollection<CountySegment> Segments { get; set; } = new List<CountySegment>();

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
