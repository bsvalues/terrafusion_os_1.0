using TerraFusion.Modules.CurrentUse.Domain;

namespace TerraFusion.Modules.CurrentUse.Dto;

public sealed record CurrentUseOverviewDto(
    Guid ParcelId,
    Guid CountyId,
    int TaxYear,
    ClassificationType ClassificationType,
    CurrentUseLifecycleState LifecycleState,
    decimal ClassifiedAcres,
    decimal TotalParcelAcres,
    decimal? HomesiteExcludedAcres,
    decimal? CurrentUseValue,
    decimal? TrueAndFairValue,
    decimal? RollbackExposureEstimate,
    string OwnerName,
    string? OperatorName,
    bool LeasedOperation,
    string? ContiguousGroupId,
    int EvidenceCompletenessScore,
    string RiskLevel,
    DateOnly? LastReviewDate,
    DateOnly? NextReviewDueDate
);
