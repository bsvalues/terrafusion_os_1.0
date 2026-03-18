// TFT-012: Validation DTOs for IAAO data quality and ratio study validation
// These records support the forge-statistics batch validation pipeline.

namespace TerraFusion.Core.DTOs;

/// <summary>
/// Severity classification for validation findings, aligned with
/// IAAO Standard on Data Quality (2018).
/// </summary>
public enum ValidationSeverity
{
    /// <summary>Informational finding; no action required.</summary>
    Info = 0,

    /// <summary>Potential issue that warrants review but does not block processing.</summary>
    Warning = 1,

    /// <summary>Critical failure that must be resolved before the record can be used.</summary>
    Error = 2
}

/// <summary>
/// Defines a single validation rule that can be applied to an entity.
/// </summary>
/// <param name="RuleId">Unique identifier for this rule (e.g., "PROP-001").</param>
/// <param name="Name">Human-readable rule name.</param>
/// <param name="Description">Full description of what the rule checks.</param>
/// <param name="Severity">How severe a violation is.</param>
/// <param name="Category">Grouping category (e.g., "Property", "Sale", "Assessment").</param>
public sealed record ValidationRule(
    string RuleId,
    string Name,
    string Description,
    ValidationSeverity Severity,
    string Category);

/// <summary>
/// The outcome of applying a single <see cref="ValidationRule"/> to an entity.
/// </summary>
/// <param name="RuleId">The rule that was evaluated.</param>
/// <param name="Passed">True if the entity satisfies the rule.</param>
/// <param name="Message">Human-readable explanation of the result.</param>
/// <param name="Severity">Severity of the rule (copied for convenience).</param>
/// <param name="FieldName">The entity field that was validated, if applicable.</param>
/// <param name="ActualValue">The actual value found in the field, serialized as string.</param>
public sealed record ValidationResult(
    string RuleId,
    bool Passed,
    string Message,
    ValidationSeverity Severity,
    string? FieldName = null,
    string? ActualValue = null);

/// <summary>
/// A named collection of <see cref="ValidationRule"/> instances that are
/// evaluated together (e.g., "IAAO Property Rules").
/// </summary>
/// <param name="Name">Display name for this rule set.</param>
/// <param name="Rules">The rules contained in this set.</param>
public sealed record ValidationRuleSet(
    string Name,
    IReadOnlyList<ValidationRule> Rules);

/// <summary>
/// Complete validation report for a single entity, summarizing all
/// rule evaluations.
/// </summary>
/// <param name="EntityId">Identifier of the validated entity (parcel number, sale id, etc.).</param>
/// <param name="Results">Individual validation results.</param>
/// <param name="PassCount">Number of rules that passed.</param>
/// <param name="FailCount">Number of Error-severity rules that failed.</param>
/// <param name="WarningCount">Number of Warning-severity rules that failed.</param>
/// <param name="OverallPassed">True only if zero Error-severity rules failed.</param>
public sealed record ValidationReport(
    string EntityId,
    IReadOnlyList<ValidationResult> Results,
    int PassCount,
    int FailCount,
    int WarningCount,
    bool OverallPassed);
