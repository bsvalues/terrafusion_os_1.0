// BIV-019 — Validates incoming data against schema and business rules
using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.Core.Sync
{
    /// <summary>
    /// Result of validating a single record or batch.
    /// </summary>
    public sealed class ValidationReport
    {
        public bool IsValid => Issues.Count == 0;
        public List<string> Issues { get; } = new();
        public Dictionary<string, List<string>> FieldIssues { get; } = new();
        public int AnomalyScore { get; set; }

        /// <summary>Adds a field-level validation issue.</summary>
        public void AddFieldIssue(string field, string message)
        {
            Issues.Add($"{field}: {message}");
            if (!FieldIssues.ContainsKey(field))
                FieldIssues[field] = new List<string>();
            FieldIssues[field].Add(message);
        }

        /// <summary>Adds a record-level validation issue.</summary>
        public void AddIssue(string message) => Issues.Add(message);
    }

    /// <summary>
    /// Defines a validation rule for a field.
    /// </summary>
    public sealed class FieldRule
    {
        public string FieldName { get; init; } = string.Empty;
        public bool Required { get; init; }
        public Type? ExpectedType { get; init; }
        public double? MinValue { get; init; }
        public double? MaxValue { get; init; }
        public int? MaxLength { get; init; }
        public IReadOnlyList<string>? AllowedValues { get; init; }
    }

    /// <summary>
    /// Validates incoming sync data against schema definitions and business rules.
    /// Supports range validation, outlier detection (IQR), and anomaly scoring.
    /// </summary>
    public class DataValidator
    {
        private readonly List<FieldRule> _rules = new();
        private readonly Dictionary<string, List<double>> _fieldDistributions = new();

        /// <summary>Adds a validation rule for a field.</summary>
        public DataValidator AddRule(FieldRule rule)
        {
            _rules.Add(rule ?? throw new ArgumentNullException(nameof(rule)));
            return this;
        }

        /// <summary>
        /// Feeds historical values for a numeric field to build distribution data for IQR outlier detection.
        /// </summary>
        public void FeedDistribution(string fieldName, IEnumerable<double> values)
        {
            if (!_fieldDistributions.ContainsKey(fieldName))
                _fieldDistributions[fieldName] = new List<double>();
            _fieldDistributions[fieldName].AddRange(values);
        }

        /// <summary>
        /// Validates a single record against all registered rules.
        /// </summary>
        public ValidationReport Validate(Dictionary<string, object?> record)
        {
            var report = new ValidationReport();
            int anomalyHits = 0;

            foreach (var rule in _rules)
            {
                record.TryGetValue(rule.FieldName, out var value);

                // Required check
                if (rule.Required && (value == null || (value is string s && string.IsNullOrWhiteSpace(s))))
                {
                    report.AddFieldIssue(rule.FieldName, "Required field is null or empty.");
                    continue;
                }

                if (value == null) continue;

                // Type check
                if (rule.ExpectedType != null && value.GetType() != rule.ExpectedType)
                {
                    try
                    {
                        Convert.ChangeType(value, rule.ExpectedType);
                    }
                    catch
                    {
                        report.AddFieldIssue(rule.FieldName,
                            $"Expected type {rule.ExpectedType.Name}, got {value.GetType().Name}.");
                    }
                }

                // Max length check (strings)
                if (rule.MaxLength.HasValue && value is string str && str.Length > rule.MaxLength.Value)
                {
                    report.AddFieldIssue(rule.FieldName,
                        $"Exceeds max length {rule.MaxLength.Value} (actual: {str.Length}).");
                }

                // Range check (numerics)
                if ((rule.MinValue.HasValue || rule.MaxValue.HasValue) && TryGetDouble(value, out var dbl))
                {
                    if (rule.MinValue.HasValue && dbl < rule.MinValue.Value)
                        report.AddFieldIssue(rule.FieldName, $"Below minimum {rule.MinValue.Value}.");
                    if (rule.MaxValue.HasValue && dbl > rule.MaxValue.Value)
                        report.AddFieldIssue(rule.FieldName, $"Above maximum {rule.MaxValue.Value}.");
                }

                // Allowed values check
                if (rule.AllowedValues != null && value is string sv &&
                    !rule.AllowedValues.Contains(sv, StringComparer.OrdinalIgnoreCase))
                {
                    report.AddFieldIssue(rule.FieldName,
                        $"Value '{sv}' not in allowed set [{string.Join(", ", rule.AllowedValues)}].");
                }

                // IQR outlier detection
                if (_fieldDistributions.TryGetValue(rule.FieldName, out var dist) &&
                    dist.Count >= 10 && TryGetDouble(value, out var numVal))
                {
                    if (IsIqrOutlier(numVal, dist))
                    {
                        report.AddFieldIssue(rule.FieldName, $"IQR outlier detected (value: {numVal}).");
                        anomalyHits++;
                    }
                }
            }

            report.AnomalyScore = anomalyHits;
            return report;
        }

        /// <summary>
        /// Validates a batch of records. Returns a report for each record.
        /// </summary>
        public IReadOnlyList<ValidationReport> ValidateBatch(
            IReadOnlyList<Dictionary<string, object?>> records)
        {
            return records.Select(Validate).ToList();
        }

        /// <summary>
        /// Checks if a value is an IQR outlier relative to the given distribution.
        /// Outlier = below Q1 - 1.5*IQR or above Q3 + 1.5*IQR.
        /// </summary>
        private static bool IsIqrOutlier(double value, List<double> distribution)
        {
            var sorted = distribution.OrderBy(x => x).ToList();
            int n = sorted.Count;
            double q1 = sorted[n / 4];
            double q3 = sorted[3 * n / 4];
            double iqr = q3 - q1;
            double lower = q1 - 1.5 * iqr;
            double upper = q3 + 1.5 * iqr;
            return value < lower || value > upper;
        }

        private static bool TryGetDouble(object? value, out double result)
        {
            result = 0;
            if (value == null) return false;
            try
            {
                result = Convert.ToDouble(value);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
