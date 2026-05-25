namespace TerraFusion.Modules.CurrentUse.Dto;

public sealed record CurrentUseEvidenceItemDto(
    Guid Id,
    Guid ParcelId,
    string EvidenceType,
    string Status,
    Guid? DocumentId,
    DateTimeOffset? ReceivedAt,
    DateTimeOffset? ReviewedAt,
    string? ReviewedBy,
    string? Notes
);

public sealed record CurrentUseTimelineEventDto(
    Guid Id,
    Guid ParcelId,
    string EventType,
    DateTimeOffset EventDate,
    string ActorDisplayName,
    string Summary,
    string? PayloadJson
);
