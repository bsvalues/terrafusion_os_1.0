namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseAppealStatus
{
    Draft,
    AppealWindowOpen,
    Filed,
    PacketPreparing,
    PacketReady,
    Scheduled,
    HearingComplete,
    DecisionReceived,
    Closed,
    Withdrawn
}

public enum CurrentUseReclassificationStatus
{
    NotStarted,
    OptionAvailable,
    ApplicationReceived,
    UnderReview,
    Approved,
    Denied,
    Expired,
    Closed
}

public sealed record CurrentUseAppealDto(
    Guid AppealId,
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid? RemovalId,
    Guid? RollbackCalculationId,
    CurrentUseAppealStatus Status,
    DateOnly NoticeMailDate,
    DateOnly AppealDeadline,
    DateOnly? FiledDate,
    DateOnly? HearingDate,
    string? BoardReferenceNumber,
    string Summary,
    IReadOnlyList<Guid> EvidenceDocumentIds,
    DateTimeOffset CreatedAt,
    string CreatedBy,
    DateTimeOffset UpdatedAt,
    string UpdatedBy
);

public sealed record CreateCurrentUseAppealDto(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid? RemovalId,
    Guid? RollbackCalculationId,
    DateOnly NoticeMailDate,
    int AppealWindowDays,
    string Summary,
    string CreatedBy
);

public sealed record FileCurrentUseAppealDto(
    DateOnly FiledDate,
    string BoardReferenceNumber,
    string UpdatedBy,
    string? Note
);

public sealed record CurrentUseReclassificationOptionDto(
    Guid ReclassificationId,
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    string FromClassification,
    string? TargetClassification,
    CurrentUseReclassificationStatus Status,
    DateOnly NoticeDate,
    DateOnly ApplicationDeadline,
    DateOnly? ApplicationReceivedDate,
    string Summary,
    DateTimeOffset CreatedAt,
    string CreatedBy,
    DateTimeOffset UpdatedAt,
    string UpdatedBy
);

public sealed record CreateCurrentUseReclassificationOptionDto(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    string FromClassification,
    string? TargetClassification,
    DateOnly NoticeDate,
    int ApplicationWindowDays,
    string Summary,
    string CreatedBy
);

public sealed record ReceiveCurrentUseReclassificationApplicationDto(
    DateOnly ApplicationReceivedDate,
    string? TargetClassification,
    string UpdatedBy,
    string? Note
);
