using TerraFusion.Modules.CurrentUse.Domain;

namespace TerraFusion.Modules.CurrentUse.Dto;

public sealed record TaxYearValueDto(int TaxYear, decimal Value);
public sealed record LevyRateDto(int TaxYear, decimal RatePerThousand);
public sealed record InterestRateDto(int TaxYear, decimal AnnualRate);

public sealed record RollbackCalculationInputDto(
    Guid ParcelId,
    Guid CountyId,
    DateOnly RemovalDate,
    int TaxYearOfRemoval,
    ClassificationType ClassificationType,
    RemovalType RemovalType,
    IReadOnlyList<TaxYearValueDto> CurrentUseAssessedValuesByYear,
    IReadOnlyList<TaxYearValueDto> TrueAndFairValuesByYear,
    IReadOnlyList<LevyRateDto> LevyRatesByYear,
    IReadOnlyList<InterestRateDto> InterestRatesByYear,
    PenaltySuppressionReason? PenaltySuppressionReason,
    StatutoryExceptionReason? StatutoryExceptionReason,
    decimal? PartialRemovalAcres,
    decimal? TotalClassifiedAcres,
    string CreatedBy
);

public sealed record RollbackExplanationLineDto(
    string TaxYear,
    string Label,
    string? Formula,
    decimal? Amount,
    string? Note
);

public sealed record RollbackCalculationResultDto(
    Guid CalculationId,
    Guid ParcelId,
    IReadOnlyList<int> RollbackYears,
    decimal AdditionalTaxSubtotal,
    decimal InterestSubtotal,
    decimal PenaltyAmount,
    decimal TotalDue,
    bool PenaltyApplied,
    PenaltySuppressionReason? PenaltySuppressionReason,
    bool StatutoryExceptionApplied,
    StatutoryExceptionReason? StatutoryExceptionReason,
    string CalculationVersion,
    IReadOnlyList<RollbackExplanationLineDto> Explanation,
    DateTimeOffset CreatedAt,
    string CreatedBy
);
