namespace TerraFusion.Modules.CurrentUse.Dto;

public sealed record CurrentUseOverviewDto(
    Guid ParcelId,
    Guid CountyId,
    string OwnerName,
    string ClassificationType,
    string LifecycleState,
    decimal ClassifiedAcres,
    decimal HomesiteExcludedAcres,
    string PolicyVersion
);

public sealed record RollbackTaxYearInputDto(
    int TaxYear,
    decimal CurrentUseValue,
    decimal TrueAndFairValue,
    decimal LevyRatePerThousand,
    decimal AnnualInterestRate
);

public sealed record RollbackCalculationRequestDto(
    Guid ParcelId,
    Guid CountyId,
    string ClassificationType,
    DateOnly RemovalDate,
    int TaxYearOfRemoval,
    IReadOnlyList<RollbackTaxYearInputDto> TaxYears,
    bool PenaltySuppressed
);

public sealed record RollbackYearResultDto(int TaxYear, decimal AdditionalTax, decimal Interest);

public sealed record RollbackCalculationResultDto(
    Guid ParcelId,
    IReadOnlyList<int> RollbackYears,
    string CalculationVersion,
    string PolicyVersion,
    IReadOnlyList<RollbackYearResultDto> YearResults,
    decimal AdditionalTaxSubtotal,
    decimal InterestSubtotal,
    decimal PenaltyAmount,
    decimal TotalDue,
    IReadOnlyList<string> Explanation
);
