namespace TerraFusion.Modules.CurrentUse.Dto;

public sealed record CurrentUseInterestRateDto(
    Guid InterestRateId,
    Guid CountyId,
    int TaxYear,
    decimal AnnualRate,
    DateOnly EffectiveStartDate,
    DateOnly? EffectiveEndDate,
    string Source,
    DateTimeOffset CreatedAt,
    string CreatedBy
);

public sealed record CurrentUseInterestAccrualInputDto(
    Guid CountyId,
    int TaxYear,
    decimal AdditionalTax,
    DateOnly RemovalDate,
    DateOnly? TaxDueDateOverride
);

public sealed record CurrentUseInterestAccrualSegmentDto(
    int TaxYear,
    DateOnly StartDate,
    DateOnly EndDate,
    int DayCount,
    decimal AnnualRate,
    decimal InterestAmount,
    string Formula
);

public sealed record CurrentUseInterestAccrualResultDto(
    int TaxYear,
    decimal AdditionalTax,
    DateOnly AccrualStartDate,
    DateOnly AccrualEndDate,
    decimal InterestTotal,
    IReadOnlyList<CurrentUseInterestAccrualSegmentDto> Segments
);
