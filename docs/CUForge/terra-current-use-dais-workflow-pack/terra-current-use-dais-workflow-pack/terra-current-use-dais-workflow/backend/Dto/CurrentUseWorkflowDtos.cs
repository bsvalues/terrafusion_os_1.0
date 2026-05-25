namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseWorkflowType
{
    ApplicationReview,
    ContinuanceReview,
    RemovalReview,
    OwnerWithdrawal,
    MissingEvidenceFollowup,
    ReclassificationReview,
    AppealSupport
}

public enum CurrentUseWorkflowStatus
{
    Open,
    WaitingOnOwner,
    WaitingOnStaff,
    WaitingOnTreasurer,
    WaitingOnBoard,
    Completed,
    Closed,
    Canceled
}

public sealed record CurrentUseWorkflowTaskDto(
    Guid Id,
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    CurrentUseWorkflowType WorkflowType,
    CurrentUseWorkflowStatus Status,
    string Title,
    string? AssignedTo,
    DateOnly? DueDate,
    string Priority,
    string Summary,
    DateTimeOffset CreatedAt,
    string CreatedBy
);

public sealed record CreateCurrentUseWorkflowTaskDto(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    CurrentUseWorkflowType WorkflowType,
    string Title,
    string? AssignedTo,
    DateOnly? DueDate,
    string Priority,
    string Summary,
    string CreatedBy
);

public sealed record UpdateCurrentUseWorkflowTaskStatusDto(
    CurrentUseWorkflowStatus Status,
    string UpdatedBy,
    string? Note
);
