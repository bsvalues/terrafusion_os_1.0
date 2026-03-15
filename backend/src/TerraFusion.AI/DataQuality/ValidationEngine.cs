// TFT-011: Core validation engine with rule-set registration
// Supports required-field, range, cross-field, and custom predicate rules.

using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.DataQuality;

/// <summary>
/// A strongly-typed predicate that validates a single aspect of an entity.
/// Returns a <see cref="ValidationResult"/> describing pass/fail and context.
/// </summary>
/// <typeparam name="T">The entity type being validated.</typeparam>
public delegate ValidationResult ValidationPredicate<in T>(T entity);

/// <summary>
/// Validates entities against registered rule sets.
/// </summary>
public interface IValidationEngine
{
    /// <summary>
    /// Registers a named rule set with its associated predicates.
    /// </summary>
    void RegisterRuleSet<T>(ValidationRuleSet ruleSet, IReadOnlyList<ValidationPredicate<T>> predicates);

    /// <summary>
    /// Validates an entity against all registered rule sets for its type.
    /// </summary>
    /// <param name="entityId">Identifier for the entity (for reporting).</param>
    /// <param name="entity">The entity to validate.</param>
    /// <returns>A complete validation report.</returns>
    Task<ValidationReport> ValidateAsync<T>(string entityId, T entity);
}

/// <summary>
/// Default implementation of <see cref="IValidationEngine"/>.
/// Thread-safe; rule sets can be registered at startup or dynamically.
/// </summary>
public sealed class ValidationEngine : IValidationEngine
{
    private readonly ILogger<ValidationEngine> _logger;

    /// <summary>
    /// Internal storage: keyed by entity Type, each entry holds a list of
    /// (RuleSet metadata, list of predicates) tuples.
    /// </summary>
    private readonly ConcurrentDictionary<Type, List<object>> _registry = new();

    public ValidationEngine(ILogger<ValidationEngine> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public void RegisterRuleSet<T>(ValidationRuleSet ruleSet, IReadOnlyList<ValidationPredicate<T>> predicates)
    {
        ArgumentNullException.ThrowIfNull(ruleSet);
        ArgumentNullException.ThrowIfNull(predicates);

        if (ruleSet.Rules.Count != predicates.Count)
        {
            throw new ArgumentException(
                $"Rule set '{ruleSet.Name}' has {ruleSet.Rules.Count} rules but {predicates.Count} predicates were provided. Counts must match.");
        }

        var entry = new RuleSetEntry<T>(ruleSet, predicates);

        _registry.AddOrUpdate(
            typeof(T),
            _ => new List<object> { entry },
            (_, list) => { list.Add(entry); return list; });

        _logger.LogInformation(
            "Registered rule set '{RuleSetName}' with {RuleCount} rules for type {EntityType}",
            ruleSet.Name, ruleSet.Rules.Count, typeof(T).Name);
    }

    /// <inheritdoc />
    public Task<ValidationReport> ValidateAsync<T>(string entityId, T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);

        var results = new List<ValidationResult>();

        if (_registry.TryGetValue(typeof(T), out var entries))
        {
            foreach (var raw in entries)
            {
                if (raw is RuleSetEntry<T> entry)
                {
                    for (int i = 0; i < entry.Predicates.Count; i++)
                    {
                        try
                        {
                            var result = entry.Predicates[i](entity);
                            results.Add(result);
                        }
                        catch (Exception ex)
                        {
                            var rule = entry.RuleSet.Rules[i];
                            _logger.LogWarning(ex,
                                "Rule '{RuleId}' threw an exception for entity '{EntityId}'",
                                rule.RuleId, entityId);

                            results.Add(new ValidationResult(
                                rule.RuleId,
                                Passed: false,
                                Message: $"Rule evaluation failed: {ex.Message}",
                                Severity: rule.Severity,
                                FieldName: null,
                                ActualValue: null));
                        }
                    }
                }
            }
        }

        int passCount = results.Count(r => r.Passed);
        int failCount = results.Count(r => !r.Passed && r.Severity == ValidationSeverity.Error);
        int warningCount = results.Count(r => !r.Passed && r.Severity == ValidationSeverity.Warning);

        var report = new ValidationReport(
            EntityId: entityId,
            Results: results,
            PassCount: passCount,
            FailCount: failCount,
            WarningCount: warningCount,
            OverallPassed: failCount == 0);

        return Task.FromResult(report);
    }

    /// <summary>
    /// Internal holder that pairs a <see cref="ValidationRuleSet"/> with its predicates.
    /// </summary>
    private sealed record RuleSetEntry<T>(
        ValidationRuleSet RuleSet,
        IReadOnlyList<ValidationPredicate<T>> Predicates);
}

#region Builder helpers

/// <summary>
/// Fluent builder for constructing validation rule sets with their predicates.
/// </summary>
/// <typeparam name="T">The entity type being validated.</typeparam>
public sealed class ValidationRuleSetBuilder<T>
{
    private readonly string _name;
    private readonly List<ValidationRule> _rules = new();
    private readonly List<ValidationPredicate<T>> _predicates = new();

    public ValidationRuleSetBuilder(string name)
    {
        _name = name;
    }

    /// <summary>
    /// Adds a required-field rule that checks whether a string field is non-null and non-empty.
    /// </summary>
    public ValidationRuleSetBuilder<T> RequiredField(
        string ruleId, string fieldName, Func<T, string?> accessor,
        ValidationSeverity severity = ValidationSeverity.Error)
    {
        _rules.Add(new ValidationRule(ruleId, $"{fieldName} required",
            $"{fieldName} must not be null or empty.", severity, "Required"));

        _predicates.Add(entity =>
        {
            var value = accessor(entity);
            bool passed = !string.IsNullOrWhiteSpace(value);
            return new ValidationResult(ruleId, passed,
                passed ? $"{fieldName} is present." : $"{fieldName} is missing or empty.",
                severity, fieldName, value);
        });

        return this;
    }

    /// <summary>
    /// Adds a numeric range rule.
    /// </summary>
    public ValidationRuleSetBuilder<T> RangeCheck(
        string ruleId, string fieldName, Func<T, double?> accessor,
        double min, double max,
        ValidationSeverity severity = ValidationSeverity.Error)
    {
        _rules.Add(new ValidationRule(ruleId, $"{fieldName} range",
            $"{fieldName} must be between {min} and {max}.", severity, "Range"));

        _predicates.Add(entity =>
        {
            var value = accessor(entity);
            bool passed = value.HasValue && value.Value >= min && value.Value <= max;
            return new ValidationResult(ruleId, passed,
                passed
                    ? $"{fieldName} = {value:F2} is within [{min}, {max}]."
                    : $"{fieldName} = {value?.ToString("F2") ?? "null"} is outside [{min}, {max}].",
                severity, fieldName, value?.ToString("F4"));
        });

        return this;
    }

    /// <summary>
    /// Adds a custom predicate rule for cross-field consistency or arbitrary logic.
    /// </summary>
    public ValidationRuleSetBuilder<T> Custom(
        string ruleId, string name, string description,
        Func<T, bool> predicate, Func<T, string> messageOnFail,
        ValidationSeverity severity = ValidationSeverity.Error,
        string category = "Custom",
        string? fieldName = null)
    {
        _rules.Add(new ValidationRule(ruleId, name, description, severity, category));

        _predicates.Add(entity =>
        {
            bool passed = predicate(entity);
            return new ValidationResult(ruleId, passed,
                passed ? $"{name}: OK" : messageOnFail(entity),
                severity, fieldName, null);
        });

        return this;
    }

    /// <summary>
    /// Builds the rule set and predicate list.
    /// </summary>
    public (ValidationRuleSet RuleSet, IReadOnlyList<ValidationPredicate<T>> Predicates) Build()
    {
        return (new ValidationRuleSet(_name, _rules.AsReadOnly()), _predicates.AsReadOnly());
    }
}

#endregion
