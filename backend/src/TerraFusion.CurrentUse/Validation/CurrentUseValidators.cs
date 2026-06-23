using FluentValidation;
using TerraFusion.CurrentUse.DTOs;

namespace TerraFusion.CurrentUse.Validation;

/// <summary>
/// Validates rollback calculation requests per WA RCW 84.33/84.34 constraints.
/// </summary>
public class RollbackCalculationRequestValidator : AbstractValidator<RollbackCalculationRequest>
{
    private static readonly HashSet<string> ValidCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        "DFL", "CUFA", "CUOS", "CUTL"
    };

    public RollbackCalculationRequestValidator()
    {
        RuleFor(x => x.ParcelId)
            .NotEmpty().WithMessage("ParcelId is required")
            .MaximumLength(50).WithMessage("ParcelId must not exceed 50 characters");

        RuleFor(x => x.ClassificationCode)
            .NotEmpty().WithMessage("ClassificationCode is required")
            .Must(code => ValidCodes.Contains(code))
            .WithMessage("ClassificationCode must be one of: DFL, CUFA, CUOS, CUTL");

        RuleFor(x => x.EnrollmentYear)
            .InclusiveBetween(1990, 2050)
            .WithMessage("EnrollmentYear must be between 1990 and 2050");

        RuleFor(x => x.RemovalYear)
            .InclusiveBetween(1990, 2050)
            .WithMessage("RemovalYear must be between 1990 and 2050")
            .GreaterThan(x => x.EnrollmentYear)
            .WithMessage("RemovalYear must be after EnrollmentYear");

        RuleFor(x => x.MarketValues)
            .NotNull().WithMessage("MarketValues dictionary is required");

        RuleFor(x => x.CurrentUseValues)
            .NotNull().WithMessage("CurrentUseValues dictionary is required");
    }
}

/// <summary>
/// Validates classification creation requests.
/// </summary>
public class ClassificationCreateRequestValidator : AbstractValidator<ClassificationCreateRequest>
{
    private static readonly HashSet<string> ValidCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        "DFL", "CUFA", "CUOS", "CUTL"
    };

    public ClassificationCreateRequestValidator()
    {
        RuleFor(x => x.ParcelId)
            .NotEmpty().WithMessage("ParcelId is required")
            .MaximumLength(50).WithMessage("ParcelId must not exceed 50 characters");

        RuleFor(x => x.ClassificationCode)
            .NotEmpty().WithMessage("ClassificationCode is required")
            .Must(code => ValidCodes.Contains(code))
            .WithMessage("ClassificationCode must be one of: DFL, CUFA, CUOS, CUTL");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters");

        RuleFor(x => x.EnrollmentDate)
            .NotEmpty().WithMessage("EnrollmentDate is required")
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today))
            .WithMessage("EnrollmentDate cannot be in the future");

        RuleFor(x => x.Acreage)
            .GreaterThan(0).WithMessage("Acreage must be greater than 0")
            .LessThanOrEqualTo(100000m).WithMessage("Acreage exceeds maximum allowed (100,000 acres)");

        RuleFor(x => x.CurrentMarketValue)
            .GreaterThan(0).WithMessage("CurrentMarketValue must be greater than 0");

        RuleFor(x => x.CurrentUseValue)
            .GreaterThan(0).WithMessage("CurrentUseValue must be greater than 0")
            .LessThanOrEqualTo(x => x.CurrentMarketValue)
            .WithMessage("CurrentUseValue cannot exceed CurrentMarketValue");
    }
}

/// <summary>
/// Validates removal initiation requests.
/// </summary>
public class RemovalInitiateRequestValidator : AbstractValidator<RemovalInitiateRequest>
{
    private static readonly HashSet<string> ValidCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        "DFL", "CUFA", "CUOS", "CUTL"
    };

    public RemovalInitiateRequestValidator()
    {
        RuleFor(x => x.ParcelId)
            .NotEmpty().WithMessage("ParcelId is required")
            .MaximumLength(50).WithMessage("ParcelId must not exceed 50 characters");

        RuleFor(x => x.ClassificationCode)
            .NotEmpty().WithMessage("ClassificationCode is required")
            .Must(code => ValidCodes.Contains(code))
            .WithMessage("ClassificationCode must be one of: DFL, CUFA, CUOS, CUTL");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required")
            .MinimumLength(10).WithMessage("Reason must be at least 10 characters")
            .MaximumLength(1000).WithMessage("Reason must not exceed 1000 characters");
    }
}
