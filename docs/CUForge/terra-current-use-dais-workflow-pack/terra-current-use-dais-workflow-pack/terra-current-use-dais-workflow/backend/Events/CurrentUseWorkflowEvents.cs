namespace TerraFusion.Modules.CurrentUse.Events;

public sealed record CurrentUseWorkflowTaskCreated(
    Guid CountyId,
    Guid ParcelId,
    Guid TaskId,
    string WorkflowType,
    string CreatedBy,
    DateTimeOffset CreatedAt
);

public sealed record CurrentUseWorkflowStatusChanged(
    Guid CountyId,
    Guid ParcelId,
    Guid TaskId,
    string PreviousStatus,
    string NewStatus,
    string UpdatedBy,
    DateTimeOffset UpdatedAt
);

public sealed record CurrentUseForgeFactReferenced(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    Guid? RollbackCalculationId,
    string ReferencedByWorkflowTaskId,
    DateTimeOffset ReferencedAt
);
