// backend/src/TerraFusion.Core/Entities/CountySpatialArtifact.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum SpatialArtifactType { NeighborhoodBoundary, SegmentGeometry, CohortGeometry }
public enum SpatialArtifactStatus { Candidate, Published, Superseded }

public class CountySpatialArtifact
{
    public Guid ArtifactId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid SourceScenarioId { get; set; }
    public Guid CountyId { get; set; }

    public SpatialArtifactType ArtifactType { get; set; }
    public SpatialArtifactStatus Status { get; set; } = SpatialArtifactStatus.Candidate;

    // Atlas layer reference (populated when Published)
    [StringLength(200)]
    public string? AtlasLayerId { get; set; }

    public int Version { get; set; } = 1;

    [StringLength(200)]
    public string? PublishedBy { get; set; }

    public DateTime? PublishedAt { get; set; }

    // GeoJSON geometry snapshot at time of publish
    public string? GeometryJson { get; set; }

    // Navigation
    public CountyScenario? SourceScenario { get; set; }

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
