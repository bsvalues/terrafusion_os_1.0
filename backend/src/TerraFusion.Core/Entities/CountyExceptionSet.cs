// backend/src/TerraFusion.Core/Entities/CountyExceptionSet.cs
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

public enum ExceptionReasonCode
{
    LowSample, SegmentInstability, Outlier, EdgeEffect, Heterogeneity, ManualFlag
}

public enum ExceptionDestination { Dais, Dossier, Internal }
public enum ExceptionSetStatus { Created, Dispatched, Resolved }
public enum DownstreamClosureReceiptStatus { Drafted, Opened, Returned }
public enum DownstreamClosureReceiptSource { ExceptionQueue, SegmentInspector }

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

    public string? AssignedTo { get; set; }   // free-text staff name
    public string? Notes { get; set; }         // accumulated notes (append-style via service)

    // Navigation
    public CountyScenario? SourceScenario { get; set; }

    // FISMA audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
}

public class CountyDownstreamClosureReceipt
{
    public Guid ReceiptId { get; set; } = Guid.NewGuid();
    public Guid? ExceptionSetId { get; set; }
    public Guid StudyId { get; set; }
    public Guid CountyId { get; set; }

    public DownstreamClosureReceiptSource SourceType { get; set; } = DownstreamClosureReceiptSource.ExceptionQueue;
    public ExceptionDestination Destination { get; set; }
    public string Template { get; set; } = string.Empty;
    public string SegmentId { get; set; } = string.Empty;
    public string SegmentLabel { get; set; } = string.Empty;
    public DownstreamClosureReceiptStatus Status { get; set; } = DownstreamClosureReceiptStatus.Drafted;
    public string? DownstreamEntityId { get; set; }
    public string? EvidenceRef { get; set; }
    public string? Notes { get; set; }

    public DateTime DraftedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string UpdatedBy { get; set; } = "system";

    public CountyExceptionSet? ExceptionSet { get; set; }
}
