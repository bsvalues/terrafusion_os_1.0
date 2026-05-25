namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseTraceAction
{
    ClassificationCreated,
    ClassificationStateChanged,
    EligibilityReviewRun,
    RollbackCalculationRun,
    RollbackCalculationLocked,
    NoticePreviewGenerated,
    NoticeGenerated,
    NoticeSent,
    RemovalInitiated,
    RemovalFinalized,
    WithdrawalProcessed,
    PenaltySuppressed,
    StatutoryExceptionMarked,
    DocumentLinked,
    EvidencePacketReviewed,
    WorkflowTaskCreated,
    WorkflowStatusChanged,
    AiSummaryGenerated,
    SpatialReviewViewed
}

public sealed record CurrentUseTraceEventDto(
    Guid Id,
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid? CorrelationId,
    string Action,
    string ActorId,
    string ActorDisplayName,
    DateTimeOffset Timestamp,
    string? CalculationVersion,
    IReadOnlyList<Guid> DocumentIds,
    string Summary,
    string? PayloadJson,
    string Hash,
    string? PreviousHash
);

public sealed record AppendCurrentUseTraceEventDto(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid? CorrelationId,
    CurrentUseTraceAction Action,
    string ActorId,
    string ActorDisplayName,
    string Summary,
    string? CalculationVersion,
    IReadOnlyList<Guid>? DocumentIds,
    string? PayloadJson
);
