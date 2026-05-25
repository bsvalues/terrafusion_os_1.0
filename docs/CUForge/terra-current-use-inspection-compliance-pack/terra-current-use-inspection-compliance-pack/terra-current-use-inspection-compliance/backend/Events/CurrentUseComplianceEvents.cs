namespace TerraFusion.Modules.CurrentUse.Events;

public sealed record CurrentUseInspectionScheduled(
    Guid CountyId,
    Guid ParcelId,
    Guid InspectionId,
    DateOnly ScheduledDate,
    string InspectorName,
    string CreatedBy,
    DateTimeOffset CreatedAt
);

public sealed record CurrentUseInspectionCompleted(
    Guid CountyId,
    Guid ParcelId,
    Guid InspectionId,
    DateOnly CompletedDate,
    int RiskFindingCount,
    string UpdatedBy,
    DateTimeOffset UpdatedAt
);

public sealed record CurrentUseComplianceStatusChanged(
    Guid CountyId,
    Guid ParcelId,
    string PreviousStatus,
    string NewStatus,
    int RiskScore,
    string UpdatedBy,
    DateTimeOffset UpdatedAt
);
