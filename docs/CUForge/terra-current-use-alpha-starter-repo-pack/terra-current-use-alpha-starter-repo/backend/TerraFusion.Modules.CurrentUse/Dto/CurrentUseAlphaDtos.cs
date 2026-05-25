namespace TerraFusion.Modules.CurrentUse.Dto;

public sealed record CurrentUseAlphaOverviewDto(
    Guid ParcelId,
    Guid CountyId,
    string OwnerName,
    string ClassificationType,
    string LifecycleState,
    decimal ClassifiedAcres
);

public sealed record CurrentUseAlphaRollbackRequestDto(
    Guid ParcelId,
    string ClassificationType,
    DateOnly RemovalDate,
    int TaxYearOfRemoval
);

public sealed record CurrentUseAlphaRollbackResultDto(
    Guid ParcelId,
    IReadOnlyList<int> RollbackYears,
    string CalculationVersion,
    string PolicyVersion,
    decimal TotalDue,
    IReadOnlyList<string> Explanation
);
