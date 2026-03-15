// TFT-009, TFT-010: Pre-built IAAO validation rule sets
// Based on IAAO Standard on Verification and Adjustment of Sales (2020)
// and IAAO Standard on Mass Appraisal of Real Property (2017).

using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.DataQuality;

/// <summary>
/// Static factory for IAAO-standard validation rule sets.
/// These rule sets encode the data quality requirements from IAAO publications
/// and are intended for use with <see cref="IValidationEngine"/>.
/// </summary>
public static class IAAOValidationRules
{
    /// <summary>
    /// IAAO property record validation rules.
    /// Checks structural integrity of property data fields.
    /// </summary>
    public static (ValidationRuleSet RuleSet, IReadOnlyList<ValidationPredicate<PropertyRecord>> Predicates)
        PropertyValidationRules()
    {
        var builder = new ValidationRuleSetBuilder<PropertyRecord>("IAAO Property Validation");

        builder
            .RequiredField("PROP-001", "ParcelNumber", p => p.ParcelNumber)

            .RangeCheck("PROP-002", "YearBuilt", p => p.YearBuilt,
                min: 1600, max: DateTime.UtcNow.Year + 1,
                severity: ValidationSeverity.Error)

            .Custom("PROP-003", "Square footage positive",
                "Total living area must be greater than zero.",
                p => p.TotalLivingAreaSqFt > 0,
                p => $"TotalLivingAreaSqFt = {p.TotalLivingAreaSqFt} is not positive.",
                ValidationSeverity.Error, "Range", "TotalLivingAreaSqFt")

            .Custom("PROP-004", "Sale price positive (if sold)",
                "Sale price must be greater than zero when a sale is recorded.",
                p => !p.SalePrice.HasValue || p.SalePrice.Value > 0,
                p => $"SalePrice = {p.SalePrice} is not positive.",
                ValidationSeverity.Error, "Range", "SalePrice")

            .RangeCheck("PROP-005", "AssessmentRatio", p => p.AssessmentRatio,
                min: 0.10, max: 10.0,
                severity: ValidationSeverity.Warning)

            .Custom("PROP-006", "Lot size non-negative",
                "Lot acreage must be zero or positive.",
                p => p.LotAcreage >= 0,
                p => $"LotAcreage = {p.LotAcreage} is negative.",
                ValidationSeverity.Error, "Range", "LotAcreage")

            .RequiredField("PROP-007", "PropertyType", p => p.PropertyType);

        return builder.Build();
    }

    /// <summary>
    /// IAAO sale qualification and data integrity rules.
    /// Per IAAO Standard on Verification and Adjustment of Sales.
    /// </summary>
    public static (ValidationRuleSet RuleSet, IReadOnlyList<ValidationPredicate<SaleRecord>> Predicates)
        SaleValidationRules()
    {
        var builder = new ValidationRuleSetBuilder<SaleRecord>("IAAO Sale Validation");

        builder
            .Custom("SALE-001", "Arm's-length transaction",
                "Sale must be qualified as arm's-length to be used in ratio studies.",
                s => s.IsArmsLength,
                _ => "Sale is not qualified as arm's-length.",
                ValidationSeverity.Warning, "Qualification", "IsArmsLength")

            .Custom("SALE-002", "Sale date not in future",
                "Sale date must not be after the current date.",
                s => s.SaleDate <= DateTime.UtcNow.Date,
                s => $"SaleDate = {s.SaleDate:yyyy-MM-dd} is in the future.",
                ValidationSeverity.Error, "Timeliness", "SaleDate")

            .Custom("SALE-003", "Sale price positive",
                "Sale price must be greater than zero.",
                s => s.SalePrice > 0,
                s => $"SalePrice = {s.SalePrice} is not positive.",
                ValidationSeverity.Error, "Range", "SalePrice")

            .RequiredField("SALE-004", "ParcelNumber", s => s.ParcelNumber)

            .RequiredField("SALE-005", "GrantorName", s => s.GrantorName,
                ValidationSeverity.Warning)

            .RequiredField("SALE-006", "GranteeName", s => s.GranteeName,
                ValidationSeverity.Warning)

            .Custom("SALE-007", "Sale price minimum threshold",
                "Sale price should exceed $1,000 to avoid nominal transfers.",
                s => s.SalePrice >= 1000,
                s => $"SalePrice = {s.SalePrice:C} may be a nominal transfer.",
                ValidationSeverity.Warning, "Qualification", "SalePrice");

        return builder.Build();
    }

    /// <summary>
    /// IAAO assessment record validation rules.
    /// Per IAAO Standard on Mass Appraisal of Real Property.
    /// </summary>
    public static (ValidationRuleSet RuleSet, IReadOnlyList<ValidationPredicate<AssessmentRecord>> Predicates)
        AssessmentValidationRules()
    {
        var builder = new ValidationRuleSetBuilder<AssessmentRecord>("IAAO Assessment Validation");

        builder
            .Custom("ASMT-001", "Assessed value positive",
                "Total assessed value must be greater than zero.",
                a => a.TotalAssessedValue > 0,
                a => $"TotalAssessedValue = {a.TotalAssessedValue} is not positive.",
                ValidationSeverity.Error, "Range", "TotalAssessedValue")

            .Custom("ASMT-002", "Assessment date within cycle year",
                "Assessment date must fall within the declared assessment cycle year.",
                a => a.AssessmentDate.Year == a.CycleYear || a.AssessmentDate.Year == a.CycleYear - 1,
                a => $"AssessmentDate year {a.AssessmentDate.Year} does not match CycleYear {a.CycleYear}.",
                ValidationSeverity.Warning, "Timeliness", "AssessmentDate")

            .Custom("ASMT-003", "Appraisal approach documented",
                "At least one appraisal approach (cost, sales comparison, income) must be indicated.",
                a => a.CostApproachUsed || a.SalesComparisonUsed || a.IncomeApproachUsed,
                _ => "No appraisal approach is documented.",
                ValidationSeverity.Error, "Completeness", "AppraisalApproach")

            .Custom("ASMT-004", "Land value non-negative",
                "Land assessed value must not be negative.",
                a => a.LandValue >= 0,
                a => $"LandValue = {a.LandValue} is negative.",
                ValidationSeverity.Error, "Range", "LandValue")

            .Custom("ASMT-005", "Improvement value non-negative",
                "Improvement assessed value must not be negative.",
                a => a.ImprovementValue >= 0,
                a => $"ImprovementValue = {a.ImprovementValue} is negative.",
                ValidationSeverity.Error, "Range", "ImprovementValue")

            .Custom("ASMT-006", "Land + improvement = total",
                "Land value plus improvement value must equal total assessed value.",
                a => Math.Abs(a.LandValue + a.ImprovementValue - a.TotalAssessedValue) < 0.01,
                a => $"Land ({a.LandValue}) + Improvement ({a.ImprovementValue}) != Total ({a.TotalAssessedValue}).",
                ValidationSeverity.Error, "Consistency", "TotalAssessedValue")

            .RequiredField("ASMT-007", "ParcelNumber", a => a.ParcelNumber);

        return builder.Build();
    }
}

#region Entity types used by IAAO validation rules

/// <summary>
/// Represents a property record for validation purposes.
/// Map your domain entity to this record before calling the validation engine.
/// </summary>
public sealed record PropertyRecord(
    string ParcelNumber,
    double? YearBuilt,
    double TotalLivingAreaSqFt,
    double? SalePrice,
    double? AssessmentRatio,
    double LotAcreage,
    string PropertyType,
    string? Neighborhood = null);

/// <summary>
/// Represents a sales transaction for validation purposes.
/// </summary>
public sealed record SaleRecord(
    string ParcelNumber,
    decimal SalePrice,
    DateTime SaleDate,
    bool IsArmsLength,
    string? GrantorName = null,
    string? GranteeName = null,
    string? SaleInstrument = null);

/// <summary>
/// Represents an assessment record for validation purposes.
/// </summary>
public sealed record AssessmentRecord(
    string ParcelNumber,
    decimal TotalAssessedValue,
    decimal LandValue,
    decimal ImprovementValue,
    DateTime AssessmentDate,
    int CycleYear,
    bool CostApproachUsed,
    bool SalesComparisonUsed,
    bool IncomeApproachUsed);

#endregion
