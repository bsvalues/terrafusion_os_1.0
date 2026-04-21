// backend/src/TerraFusion.Core/Entities/CountyExceptionSet.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum ExceptionReasonCode
{
    LowSample, SegmentInstability, Outlier, EdgeEffect, Heterogeneity, ManualFlag
}

public enum ExceptionDestination { Dais, Dossier, Internal }
public enum ExceptionSetStatus { Created, Dispatched, Resolved }

public class CountyExceptionSet
{
    public Guid ExceptionSetId { get; set; } = Guid.NewGuid();
    public Guid StudyId { get; set; }
    public Guid SourceScenarioId { get; set; }
    public Guid CountyId { get; set; }

    public ExceptionReasonCode ReasonCode { get; set; }

    // JSON array of parcel IDs: ["12345-001", "12345-002", ...]
    [Required]
    public string ParcelIdsJson { get; set; } = "[]";

    public int ParcelCount { get; set; }
    public ExceptionDestination Destination { get; set; } = ExceptionDestination.Internal;
    public ExceptionSetStatus Status { get; set; } = ExceptionSetStatus.Created;

    // Navigation
    public CountyScenario? SourceScenario { get; set; }

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}
