namespace TerraFusion.CurrentUse.Dto;

/// <summary>
/// Summary of a parcel's current-use status (alpha read).
/// </summary>
public record CurrentUseAlphaOverviewDto(
    string ParcelId,
    string? ClassificationType,
    string? ProgramStatus,
    DateOnly? EnrollmentDate,
    string EngineVersion
);

/// <summary>
/// Request body for rollback calculation.
/// </summary>
public record CurrentUseAlphaRollbackRequestDto(
    string ParcelId,
    string ClassificationType,
    string RemovalDate,
    int TaxYearOfRemoval
);

/// <summary>
/// Result of a current-use rollback calculation.
/// </summary>
public record CurrentUseAlphaRollbackResultDto(
    int[] RollbackYears,
    string CalculationVersion,
    string PolicyVersion,
    decimal AdditionalTaxSubtotal,
    decimal InterestSubtotal,
    decimal PenaltyAmount,
    decimal TotalDue,
    string[] Explanation
);
