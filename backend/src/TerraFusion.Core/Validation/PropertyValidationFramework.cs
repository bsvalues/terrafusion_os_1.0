// LEV-030 — Property Validation Framework
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TerraFusion.Core.Validation
{
    /// <summary>
    /// Property and levy data validation framework.
    /// Enforces schema validation, business rules, and value range constraints
    /// for WA property tax data integrity.
    /// </summary>
    public class PropertyValidationFramework
    {
        private readonly List<IPropertyValidationRule> _rules = new();

        /// <summary>Register a validation rule.</summary>
        public void RegisterRule(IPropertyValidationRule rule)
        {
            _rules.Add(rule);
        }

        /// <summary>
        /// Validate a property record against all registered rules.
        /// </summary>
        /// <param name="record">The property record to validate.</param>
        /// <returns>Validation result with all issues.</returns>
        public Task<PropertyValidationResult> ValidateAsync(PropertyRecord record)
        {
            var issues = new List<ValidationIssue>();

            foreach (var rule in _rules.Where(r => r.IsActive))
            {
                var issue = rule.Evaluate(record);
                if (issue != null)
                    issues.Add(issue);
            }

            var result = new PropertyValidationResult
            {
                ParcelNumber = record.ParcelNumber,
                IsValid = !issues.Any(i => i.Severity == "Error"),
                Issues = issues,
                RulesEvaluated = _rules.Count(r => r.IsActive),
                ValidatedAt = DateTime.UtcNow
            };
            return Task.FromResult(result);
        }

        /// <summary>
        /// Create a framework pre-loaded with standard WA property rules.
        /// </summary>
        public static PropertyValidationFramework CreateDefault()
        {
            var framework = new PropertyValidationFramework();
            framework.RegisterRule(new AssessedValuePositiveRule());
            framework.RegisterRule(new TaxCodeRequiredRule());
            framework.RegisterRule(new RateRangeRule());
            framework.RegisterRule(new ParcelNumberFormatRule());
            framework.RegisterRule(new LandValueNotExceedsTotalRule());
            return framework;
        }
    }

    /// <summary>Interface for a single validation rule.</summary>
    public interface IPropertyValidationRule
    {
        string Name { get; }
        bool IsActive { get; }
        ValidationIssue? Evaluate(PropertyRecord record);
    }

    /// <summary>A property record to be validated.</summary>
    public class PropertyRecord
    {
        public string ParcelNumber { get; set; } = string.Empty;
        public string TaxCode { get; set; } = string.Empty;
        public decimal AssessedValue { get; set; }
        public decimal LandValue { get; set; }
        public decimal ImprovementValue { get; set; }
        public decimal TaxableValue { get; set; }
        public decimal LevyRate { get; set; }
    }

    /// <summary>Validation result for a property record.</summary>
    public class PropertyValidationResult
    {
        public string ParcelNumber { get; set; } = string.Empty;
        public bool IsValid { get; set; }
        public List<ValidationIssue> Issues { get; set; } = new();
        public int RulesEvaluated { get; set; }
        public DateTime ValidatedAt { get; set; }
    }

    /// <summary>A single validation issue.</summary>
    public class ValidationIssue
    {
        public string RuleName { get; set; } = string.Empty;
        public string Severity { get; set; } = "Warning";
        public string Message { get; set; } = string.Empty;
        public string Field { get; set; } = string.Empty;
    }

    // --- Built-in rules ---

    internal class AssessedValuePositiveRule : IPropertyValidationRule
    {
        public string Name => "AssessedValuePositive";
        public bool IsActive => true;
        public ValidationIssue? Evaluate(PropertyRecord r) =>
            r.AssessedValue < 0 ? new ValidationIssue
            { RuleName = Name, Severity = "Error", Field = "AssessedValue", Message = "Assessed value must be >= 0." } : null;
    }

    internal class TaxCodeRequiredRule : IPropertyValidationRule
    {
        public string Name => "TaxCodeRequired";
        public bool IsActive => true;
        public ValidationIssue? Evaluate(PropertyRecord r) =>
            string.IsNullOrWhiteSpace(r.TaxCode) ? new ValidationIssue
            { RuleName = Name, Severity = "Error", Field = "TaxCode", Message = "Tax code is required." } : null;
    }

    internal class RateRangeRule : IPropertyValidationRule
    {
        public string Name => "RateRange";
        public bool IsActive => true;
        public ValidationIssue? Evaluate(PropertyRecord r) =>
            r.LevyRate < 0 || r.LevyRate > 20m ? new ValidationIssue
            { RuleName = Name, Severity = "Error", Field = "LevyRate", Message = "Levy rate must be between 0 and 20 per $1,000." } : null;
    }

    internal class ParcelNumberFormatRule : IPropertyValidationRule
    {
        public string Name => "ParcelNumberFormat";
        public bool IsActive => true;
        public ValidationIssue? Evaluate(PropertyRecord r) =>
            string.IsNullOrWhiteSpace(r.ParcelNumber) || r.ParcelNumber.Length < 5 ? new ValidationIssue
            { RuleName = Name, Severity = "Error", Field = "ParcelNumber", Message = "Parcel number must be at least 5 characters." } : null;
    }

    internal class LandValueNotExceedsTotalRule : IPropertyValidationRule
    {
        public string Name => "LandValueNotExceedsTotal";
        public bool IsActive => true;
        public ValidationIssue? Evaluate(PropertyRecord r) =>
            r.LandValue > r.AssessedValue ? new ValidationIssue
            { RuleName = Name, Severity = "Warning", Field = "LandValue", Message = "Land value exceeds total assessed value." } : null;
    }
}
