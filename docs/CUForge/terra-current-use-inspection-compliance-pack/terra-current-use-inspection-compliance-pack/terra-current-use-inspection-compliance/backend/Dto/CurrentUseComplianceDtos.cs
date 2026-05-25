namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseComplianceStatus
{
    Unknown,
    Compliant,
    Monitoring,
    EvidenceNeeded,
    InspectionScheduled,
    InspectionComplete,
    AtRisk,
    RemovalReviewRecommended
}

public enum CurrentUseInspectionStatus
{
    Draft,
    Scheduled,
    InField,
    Complete,
    Canceled,
    RequiresFollowup
}

public enum CurrentUseInspectionFindingType
{
    CommercialUseObserved,
    NoCommercialUseObserved,
    CropActivityObserved,
    LivestockObserved,
    IrrigationObserved,
    FallowOrIdleObserved,
    HomesiteIssueObserved,
    PossibleDevelopmentObserved,
    AccessIssue,
    Other
}

public sealed record CurrentUseInspectionFindingDto(
    CurrentUseInspectionFindingType FindingType,
    string Summary,
    bool RiskFlag
);

public sealed record CurrentUseInspectionDto(
    Guid InspectionId,
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    CurrentUseInspectionStatus Status,
    DateOnly? ScheduledDate,
    DateOnly? CompletedDate,
    string? InspectorId,
    string? InspectorName,
    IReadOnlyList<CurrentUseInspectionFindingDto> Findings,
    string Notes,
    DateTimeOffset CreatedAt,
    string CreatedBy,
    DateTimeOffset UpdatedAt,
    string UpdatedBy
);

public sealed record ScheduleCurrentUseInspectionDto(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    DateOnly ScheduledDate,
    string InspectorId,
    string InspectorName,
    string Notes,
    string CreatedBy
);

public sealed record CompleteCurrentUseInspectionDto(
    DateOnly CompletedDate,
    IReadOnlyList<CurrentUseInspectionFindingDto> Findings,
    string Notes,
    string UpdatedBy
);

public sealed record CurrentUseComplianceSummaryDto(
    Guid CountyId,
    Guid ParcelId,
    Guid? ClassificationId,
    CurrentUseComplianceStatus Status,
    DateOnly? LastInspectionDate,
    DateOnly? NextInspectionDueDate,
    DateOnly? LastIncomeAuditDate,
    DateOnly? NextIncomeAuditDueDate,
    int RiskScore,
    IReadOnlyList<string> RiskReasons,
    IReadOnlyList<CurrentUseInspectionDto> RecentInspections
);
