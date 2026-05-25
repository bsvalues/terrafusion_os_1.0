namespace TerraFusion.Modules.CurrentUse.Entities;

public sealed class CurrentUseTraceEvent
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public Guid ParcelId { get; set; }
    public Guid? ClassificationId { get; set; }
    public Guid? CorrelationId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string ActorId { get; set; } = string.Empty;
    public string ActorDisplayName { get; set; } = string.Empty;

    public DateTimeOffset Timestamp { get; set; }

    public string? CalculationVersion { get; set; }
    public string DocumentIdsJson { get; set; } = "[]";
    public string Summary { get; set; } = string.Empty;
    public string? PayloadJson { get; set; }

    public string Hash { get; set; } = string.Empty;
    public string? PreviousHash { get; set; }
}
