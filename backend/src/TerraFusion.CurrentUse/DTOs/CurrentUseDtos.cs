namespace TerraFusion.CurrentUse.DTOs;

// ── Request DTOs ───────────────────────────────────────────────────────────

public record RollbackCalculationRequest(
    string ParcelId,
    string ClassificationCode,
    int EnrollmentYear,
    int RemovalYear,
    Dictionary<string, decimal> MarketValues,
    Dictionary<string, decimal> CurrentUseValues,
    string? PenaltyExceptionCode
);

public record InterestCalculationRequest(
    decimal Principal,
    int StartYear,
    int EndYear
);

public record ClassificationCreateRequest(
    string ParcelId,
    string ClassificationCode,
    string Description,
    DateOnly EnrollmentDate,
    decimal? Acreage,
    decimal? CurrentMarketValue,
    decimal? CurrentUseValue
);

public record RemovalInitiateRequest(
    string ParcelId,
    string ClassificationCode,
    string Reason,
    DateOnly? RemovalDate
);

// ── Response DTOs ──────────────────────────────────────────────────────────

public record ClassificationsResponse(
    int Total,
    int Page,
    int PageSize,
    List<ClassificationDto> Items
);

public record ClassificationDto(
    Guid Id,
    string ParcelId,
    string ClassificationCode,
    string Description,
    string EnrollmentDate,
    string Status,
    decimal? Acreage,
    decimal? CurrentMarketValue,
    decimal? CurrentUseValue,
    decimal? TaxSavings,
    string? CountyId
);

public record RollbackResult(
    decimal TotalRollbackTax,
    decimal TotalInterest,
    decimal TotalPenalty,
    decimal GrandTotal,
    List<YearBreakdown> YearBreakdowns,
    bool PenaltyApplied,
    bool PenaltyExceptionApplied,
    string? ExceptionCode
);

public record YearBreakdown(
    int Year,
    decimal MarketValue,
    decimal CurrentUseValue,
    decimal Difference,
    decimal InterestRate,
    decimal InterestAmount,
    decimal Subtotal
);

public record InterestCalcResult(
    decimal Principal,
    decimal TotalInterest,
    decimal TotalDue,
    int StartYear,
    int EndYear,
    List<InterestYearBreakdown> Breakdown
);

public record InterestYearBreakdown(
    int Year,
    decimal Rate,
    decimal YearInterest,
    decimal Cumulative
);

public record InterestRateDto(
    int Year,
    decimal Rate,
    string Source,
    string EffectiveDate
);

public record RemovalDto(
    Guid Id,
    string ParcelId,
    string ClassificationCode,
    string Reason,
    string InitiatedDate,
    string Status,
    string? RemovalDate,
    decimal? RollbackAmount,
    decimal? InterestAmount,
    decimal? PenaltyAmount,
    decimal? TotalDue
);

public record PenaltyExceptionDto(
    string Code,
    string Description,
    string RcwReference,
    bool Eligible,
    string Reason
);
