using FluentValidation;

namespace TerraFusion.API.SalesForge;

// ─── Request DTOs ─────────────────────────────────────────────────────────────

/// <summary>
/// Query parameters for sale-qualification, comps-pool, and ratio-study endpoints.
/// </summary>
public sealed record SalesForgeQueryRequest
{
    public int TaxYear { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
    public Guid? CountyId { get; init; }
    public string? PropertyType { get; init; }
    public string? Neighborhood { get; init; }
    public string? QualificationFilter { get; init; }
}

/// <summary>
/// Request body for compute-qualifications batch operation.
/// </summary>
public sealed record ComputeQualificationsRequest
{
    public Guid CountyId { get; init; }
    public int TaxYear { get; init; }
    public int? SalesYear { get; init; }
    public string? PropertyTypeFilter { get; init; }
    public string? NeighborhoodFilter { get; init; }
    public bool DryRun { get; init; }
}

/// <summary>
/// Request body for apply-recommendations batch operation.
/// </summary>
public sealed record ApplyRecommendationsRequest
{
    public Guid CountyId { get; init; }
    public int TaxYear { get; init; }
    public List<Guid> SaleIds { get; init; } = new();
    public string DecisionBy { get; init; } = string.Empty;
    public string DecisionSource { get; init; } = "TerraForge";
}

// ─── Validators ───────────────────────────────────────────────────────────────

public sealed class SalesForgeQueryValidator : AbstractValidator<SalesForgeQueryRequest>
{
    public SalesForgeQueryValidator()
    {
        RuleFor(x => x.TaxYear)
            .InclusiveBetween(2000, 2100)
            .WithMessage("TaxYear must be between 2000 and 2100");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be >= 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 200)
            .WithMessage("PageSize must be between 1 and 200");

        RuleFor(x => x.PropertyType)
            .MaximumLength(50)
            .When(x => x.PropertyType != null);

        RuleFor(x => x.Neighborhood)
            .MaximumLength(100)
            .When(x => x.Neighborhood != null);

        RuleFor(x => x.QualificationFilter)
            .Must(v => v == null || IsValidQualification(v))
            .WithMessage("QualificationFilter must be one of: qualified, non-arms-length, foreclosure, estate, land-only, omitted, dark-sale, excluded, exempt");
    }

    private static bool IsValidQualification(string value)
    {
        return value is "qualified" or "non-arms-length" or "foreclosure"
            or "estate" or "land-only" or "omitted" or "dark-sale"
            or "excluded" or "exempt" or "all";
    }
}

public sealed class ComputeQualificationsValidator : AbstractValidator<ComputeQualificationsRequest>
{
    public ComputeQualificationsValidator()
    {
        RuleFor(x => x.CountyId)
            .NotEmpty()
            .WithMessage("CountyId is required");

        RuleFor(x => x.TaxYear)
            .InclusiveBetween(2000, 2100)
            .WithMessage("TaxYear must be between 2000 and 2100");

        RuleFor(x => x.SalesYear)
            .InclusiveBetween(2000, 2100)
            .When(x => x.SalesYear.HasValue)
            .WithMessage("SalesYear must be between 2000 and 2100");

        RuleFor(x => x.PropertyTypeFilter)
            .MaximumLength(50)
            .When(x => x.PropertyTypeFilter != null);

        RuleFor(x => x.NeighborhoodFilter)
            .MaximumLength(100)
            .When(x => x.NeighborhoodFilter != null);
    }
}

public sealed class ApplyRecommendationsValidator : AbstractValidator<ApplyRecommendationsRequest>
{
    public ApplyRecommendationsValidator()
    {
        RuleFor(x => x.CountyId)
            .NotEmpty()
            .WithMessage("CountyId is required");

        RuleFor(x => x.TaxYear)
            .InclusiveBetween(2000, 2100)
            .WithMessage("TaxYear must be between 2000 and 2100");

        RuleFor(x => x.SaleIds)
            .NotEmpty()
            .WithMessage("At least one SaleId is required");

        RuleFor(x => x.SaleIds)
            .Must(ids => ids.Count <= 1000)
            .WithMessage("Cannot apply more than 1000 recommendations at once");

        RuleFor(x => x.DecisionBy)
            .NotEmpty()
            .MaximumLength(100)
            .WithMessage("DecisionBy is required and must be <= 100 characters");

        RuleFor(x => x.DecisionSource)
            .NotEmpty()
            .MaximumLength(50);
    }
}
