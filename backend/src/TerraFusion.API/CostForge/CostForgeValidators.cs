using FluentValidation;
using TerraFusion.API.Controllers;

namespace TerraFusion.API.CostForge;

/// <summary>
/// FluentValidation validators for CostForge request DTOs.
/// Enforces IAAO data quality standards and Benton County business rules.
/// </summary>

public class CostEstimateRequestValidator : AbstractValidator<CostEstimateRequest>
{
    private static readonly HashSet<string> ValidBuildingTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "R1", "R2", "C1", "C2", "C3", "C4", "A1", "A2", "I1", "S1", "S2"
    };

    public CostEstimateRequestValidator()
    {
        RuleFor(x => x.BuildingType)
            .NotEmpty().WithMessage("Building type is required")
            .Must(bt => ValidBuildingTypes.Contains(bt))
            .WithMessage("Building type must be one of: R1, R2, C1, C2, C3, C4, A1, A2, I1, S1, S2");

        RuleFor(x => x.SquareFeet)
            .GreaterThan(0).WithMessage("Square feet must be positive")
            .LessThanOrEqualTo(10_000_000).WithMessage("Square feet exceeds maximum (10,000,000)");

        RuleFor(x => x.YearBuilt)
            .GreaterThanOrEqualTo(1800).When(x => x.YearBuilt.HasValue)
            .WithMessage("Year built must be 1800 or later");

        RuleFor(x => x.YearBuilt)
            .LessThanOrEqualTo(DateTime.UtcNow.Year + 5).When(x => x.YearBuilt.HasValue)
            .WithMessage("Year built cannot be more than 5 years in the future");
    }
}

public class DepreciationCalculationRequestValidator : AbstractValidator<DepreciationCalculationRequest>
{
    public DepreciationCalculationRequestValidator()
    {
        RuleFor(x => x.ActualAge)
            .GreaterThanOrEqualTo(0).WithMessage("Actual age cannot be negative")
            .LessThanOrEqualTo(200).WithMessage("Actual age exceeds maximum (200 years)");

        RuleFor(x => x.EffectiveAge)
            .GreaterThanOrEqualTo(0).WithMessage("Effective age cannot be negative")
            .LessThanOrEqualTo(200).WithMessage("Effective age exceeds maximum (200 years)");

        RuleFor(x => x.ReplacementCostNew)
            .GreaterThan(0).WithMessage("Replacement cost new must be positive")
            .LessThanOrEqualTo(100_000_000).WithMessage("Replacement cost new exceeds maximum ($100M)");

        RuleFor(x => x.EffectiveAge)
            .LessThanOrEqualTo(x => x.ActualAge + 10)
            .WithMessage("Effective age should not exceed actual age by more than 10 years");
    }
}

public class PropertyCostCalculationRequestValidator : AbstractValidator<PropertyCostCalculationRequest>
{
    public PropertyCostCalculationRequestValidator()
    {
        RuleFor(x => x.BuildingType)
            .NotEmpty().WithMessage("Building type is required")
            .MaximumLength(10).WithMessage("Building type code too long");

        RuleFor(x => x.Region)
            .NotEmpty().WithMessage("Region is required")
            .MaximumLength(50).WithMessage("Region name too long");

        RuleFor(x => x.SquareFeet)
            .GreaterThan(0).When(x => x.SquareFeet.HasValue)
            .WithMessage("Square feet must be positive");

        RuleFor(x => x.YearBuilt)
            .GreaterThanOrEqualTo(1800).When(x => x.YearBuilt.HasValue)
            .WithMessage("Year built must be 1800 or later");

        RuleFor(x => x.ParcelNumber)
            .MaximumLength(30).When(x => !string.IsNullOrEmpty(x.ParcelNumber))
            .WithMessage("Parcel number too long");

        RuleFor(x => x.CountyCode)
            .MaximumLength(10).When(x => !string.IsNullOrEmpty(x.CountyCode))
            .WithMessage("County code too long");
    }
}

public class NoiCalculationRequestValidator : AbstractValidator<CostForgeController.NoiCalculationRequest>
{
    public NoiCalculationRequestValidator()
    {
        RuleFor(x => x.AnnualRentalIncome)
            .GreaterThan(0).WithMessage("Annual rental income must be positive")
            .LessThanOrEqualTo(100_000_000).WithMessage("Annual rental income exceeds maximum ($100M)");

        RuleFor(x => x.VacancyRate)
            .InclusiveBetween(0, 100).WithMessage("Vacancy rate must be between 0 and 100");

        RuleFor(x => x.PropertyTaxes).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Insurance).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Utilities).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Maintenance).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ManagementFees).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ReplacementReserves).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OtherExpenses).GreaterThanOrEqualTo(0);
    }
}

public class IncomeValuationRequestValidator : AbstractValidator<CostForgeController.IncomeValuationRequest>
{
    public IncomeValuationRequestValidator()
    {
        RuleFor(x => x.AnnualRentalIncome)
            .GreaterThan(0).WithMessage("Annual rental income must be positive")
            .LessThanOrEqualTo(100_000_000).WithMessage("Annual rental income exceeds maximum ($100M)");

        RuleFor(x => x.VacancyRate)
            .InclusiveBetween(0, 100).WithMessage("Vacancy rate must be between 0 and 100");

        RuleFor(x => x.CapRate)
            .GreaterThan(0).WithMessage("Cap rate must be positive")
            .LessThanOrEqualTo(25m).WithMessage("Cap rate exceeds reasonable maximum (25%)");

        RuleFor(x => x.PropertyTaxes).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Insurance).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Utilities).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Maintenance).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ManagementFees).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ReplacementReserves).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OtherExpenses).GreaterThanOrEqualTo(0);
    }
}

public class ScaleAgentsRequestValidator : AbstractValidator<ScaleAgentsRequest>
{
    public ScaleAgentsRequestValidator()
    {
        RuleFor(x => x.TargetCount)
            .GreaterThanOrEqualTo(1).WithMessage("Target count must be at least 1")
            .LessThanOrEqualTo(100_000).WithMessage("Target count exceeds maximum (100,000)");
    }
}
