namespace TerraFusion.Modules.CurrentUse.Entities;

public sealed class CurrentUseTimelineEvent
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public Guid ParcelId { get; set; }
    public Guid? ClassificationId { get; set; }

    public string EventType { get; set; } = string.Empty;
    public DateTimeOffset EventDate { get; set; }

    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;
    public string? PayloadJson { get; set; }

    // Append-only correction pattern.
    public Guid? CorrectionOfEventId { get; set; }
}
