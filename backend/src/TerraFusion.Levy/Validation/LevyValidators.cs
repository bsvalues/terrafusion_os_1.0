using FluentValidation;

namespace TerraFusion.Levy.Validation;

// ─── Request DTOs for validation ──────────────────────────────────────────────

/// <summary>
/// Request parameters for the levy bill calculation endpoint.
/// </summary>
public sealed record LevyCalculateRequest
{
    public string? TaxAreaNumber { get; init; }
    public decimal AssessedValue { get; init; }
    public int Year { get; init; } = DateTime.UtcNow.Year;
}

/// <summary>
/// Request parameters for the levy rates query endpoint.
/// </summary>
public sealed record LevyRatesRequest
{
    public int Year { get; init; } = DateTime.UtcNow.Year;
    public string? LevyCd { get; init; }
}

/// <summary>
/// Request parameters for the tax areas query endpoint.
/// </summary>
public sealed record LevyTaxAreasRequest
{
    public int Year { get; init; } = DateTime.UtcNow.Year;
    public string? Search { get; init; }
}

/// <summary>
/// Request for revenue projection generation.
/// </summary>
public sealed record RevenueProjectionRequest
{
    public Guid ScenarioId { get; init; }
    public int YearsToProject { get; init; } = 5;
}

/// <summary>
/// Request for certification state transition.
/// </summary>
public sealed record CertificationRequest
{
    public Guid LevyRunId { get; init; }
    public string? SubmittedBy { get; init; }
    public string? Notes { get; init; }
}

// ─── Validators ───────────────────────────────────────────────────────────────

public sealed class LevyCalculateRequestValidator : AbstractValidator<LevyCalculateRequest>
{
    public LevyCalculateRequestValidator()
    {
        RuleFor(x => x.TaxAreaNumber)
            .NotEmpty()
            .WithMessage("taxAreaNumber is required")
            .MaximumLength(20)
            .WithMessage("taxAreaNumber must be 20 characters or fewer");

        RuleFor(x => x.AssessedValue)
            .GreaterThanOrEqualTo(0m)
            .WithMessage("assessedValue cannot be negative")
            .LessThanOrEqualTo(999_999_999_999m)
            .WithMessage("assessedValue exceeds maximum allowed value");

        RuleFor(x => x.Year)
            .InclusiveBetween(2000, 2100)
            .WithMessage("year must be between 2000 and 2100");
    }
}

public sealed class LevyRatesRequestValidator : AbstractValidator<LevyRatesRequest>
{
    public LevyRatesRequestValidator()
    {
        RuleFor(x => x.Year)
            .InclusiveBetween(2000, 2100)
            .WithMessage("year must be between 2000 and 2100");

        RuleFor(x => x.LevyCd)
            .MaximumLength(20)
            .When(x => x.LevyCd != null)
            .WithMessage("levyCd must be 20 characters or fewer");
    }
}

public sealed class LevyTaxAreasRequestValidator : AbstractValidator<LevyTaxAreasRequest>
{
    public LevyTaxAreasRequestValidator()
    {
        RuleFor(x => x.Year)
            .InclusiveBetween(2000, 2100)
            .WithMessage("year must be between 2000 and 2100");

        RuleFor(x => x.Search)
            .MaximumLength(50)
            .When(x => x.Search != null)
            .WithMessage("search must be 50 characters or fewer");
    }
}

public sealed class RevenueProjectionRequestValidator : AbstractValidator<RevenueProjectionRequest>
{
    public RevenueProjectionRequestValidator()
    {
        RuleFor(x => x.ScenarioId)
            .NotEmpty()
            .WithMessage("scenarioId is required");

        RuleFor(x => x.YearsToProject)
            .InclusiveBetween(1, 30)
            .WithMessage("yearsToProject must be between 1 and 30");
    }
}

public sealed class CertificationRequestValidator : AbstractValidator<CertificationRequest>
{
    public CertificationRequestValidator()
    {
        RuleFor(x => x.LevyRunId)
            .NotEmpty()
            .WithMessage("levyRunId is required");

        RuleFor(x => x.SubmittedBy)
            .NotEmpty()
            .WithMessage("submittedBy is required")
            .MaximumLength(200)
            .WithMessage("submittedBy must be 200 characters or fewer");
    }
}
