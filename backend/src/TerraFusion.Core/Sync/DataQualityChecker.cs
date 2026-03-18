// BIV-067 — Pre-ingest quality gates
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync
{
    /// <summary>
    /// Quality gate severity levels.
    /// </summary>
    public enum QualitySeverity
    {
        Info,
        Warning,
        Error,
        Critical
    }

    /// <summary>
    /// A single quality finding on the dataset.
    /// </summary>
    public sealed record QualityFinding
    {
        public string Field { get; init; } = string.Empty;
        public QualitySeverity Severity { get; init; }
        public string Message { get; init; } = string.Empty;
        public int AffectedRecords { get; init; }
        public string? SuggestedAction { get; init; }
    }

    /// <summary>
    /// Full quality report for a dataset.
    /// </summary>
    public sealed class QualityReport
    {
        public bool PassedAllGates => !Findings.Any(f => f.Severity >= QualitySeverity.Error);
        public int TotalRecords { get; set; }
        public int CleanRecords { get; set; }
        public double CleanPercentage => TotalRecords > 0 ? (double)CleanRecords / TotalRecords * 100 : 0;
        public List<QualityFinding> Findings { get; } = new();
        public Dictionary<string, double> FieldCompleteness { get; } = new();
        public DateTime CheckedAtUtc { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Pre-ingest data quality gate interface.
    /// </summary>
    public interface IDataQualityChecker
    {
        /// <summary>
        /// Runs all quality checks on a dataset and returns a quality report.
        /// </summary>
        Task<QualityReport> CheckAsync(
            IReadOnlyList<Dictionary<string, object?>> records,
            DataQualityConfig config,
            CancellationToken ct = default);
    }

    /// <summary>
    /// Configuration for quality checks.
    /// </summary>
    public sealed class DataQualityConfig
    {
        /// <summary>Columns that must be present and non-null.</summary>
        public List<string> RequiredColumns { get; init; } = new();

        /// <summary>Minimum completeness percentage to pass (0-100).</summary>
        public double MinCompletenessPercent { get; init; } = 90.0;

        /// <summary>Numeric columns to check for IQR outliers.</summary>
        public List<string> OutlierCheckColumns { get; init; } = new();

        /// <summary>Maximum allowed outlier percentage before failing.</summary>
        public double MaxOutlierPercent { get; init; } = 5.0;

        /// <summary>Maximum allowed null percentage per field before warning.</summary>
        public double MaxNullPercent { get; init; } = 10.0;
    }

    /// <summary>
    /// Pre-ingest quality checker. Validates required columns, detects null density,
    /// runs IQR outlier detection on numeric fields, and generates automated cleaning suggestions.
    /// </summary>
    public class DataQualityChecker : IDataQualityChecker
    {
        /// <inheritdoc />
        public Task<QualityReport> CheckAsync(
            IReadOnlyList<Dictionary<string, object?>> records,
            DataQualityConfig config,
            CancellationToken ct = default)
        {
            var report = new QualityReport { TotalRecords = records.Count };

            if (records.Count == 0)
            {
                report.Findings.Add(new QualityFinding
                {
                    Severity = QualitySeverity.Warning,
                    Message = "Dataset is empty.",
                    SuggestedAction = "Verify connector is returning data."
                });
                return Task.FromResult(report);
            }

            // Gather all field names
            var allFields = records
                .SelectMany(r => r.Keys)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            // 1. Required column validation
            CheckRequiredColumns(records, config.RequiredColumns, report);

            // 2. Null density / field completeness
            CheckNullDensity(records, allFields, config.MaxNullPercent, report);

            // 3. IQR outlier detection on numeric columns
            CheckOutliers(records, config.OutlierCheckColumns, config.MaxOutlierPercent, report);

            // 4. Calculate clean record count
            report.CleanRecords = CountCleanRecords(records, config.RequiredColumns);

            // 5. Overall completeness gate
            if (report.CleanPercentage < config.MinCompletenessPercent)
            {
                report.Findings.Add(new QualityFinding
                {
                    Severity = QualitySeverity.Error,
                    Message = $"Clean record rate {report.CleanPercentage:F1}% is below minimum {config.MinCompletenessPercent}%.",
                    AffectedRecords = report.TotalRecords - report.CleanRecords,
                    SuggestedAction = "Review source data quality or adjust required column definitions."
                });
            }

            return Task.FromResult(report);
        }

        private static void CheckRequiredColumns(
            IReadOnlyList<Dictionary<string, object?>> records,
            List<string> requiredColumns,
            QualityReport report)
        {
            foreach (var col in requiredColumns)
            {
                int missing = records.Count(r =>
                    !r.ContainsKey(col) || r[col] == null ||
                    (r[col] is string s && string.IsNullOrWhiteSpace(s)));

                if (missing > 0)
                {
                    var pct = (double)missing / records.Count * 100;
                    report.Findings.Add(new QualityFinding
                    {
                        Field = col,
                        Severity = pct > 50 ? QualitySeverity.Critical : QualitySeverity.Error,
                        Message = $"Required column '{col}' is missing/null in {missing} records ({pct:F1}%).",
                        AffectedRecords = missing,
                        SuggestedAction = $"Investigate source data for missing '{col}' values."
                    });
                }
            }
        }

        private static void CheckNullDensity(
            IReadOnlyList<Dictionary<string, object?>> records,
            List<string> allFields,
            double maxNullPercent,
            QualityReport report)
        {
            foreach (var field in allFields)
            {
                int nullCount = records.Count(r =>
                    !r.ContainsKey(field) || r[field] == null);
                double completeness = (1.0 - (double)nullCount / records.Count) * 100;
                report.FieldCompleteness[field] = completeness;

                double nullPct = (double)nullCount / records.Count * 100;
                if (nullPct > maxNullPercent)
                {
                    report.Findings.Add(new QualityFinding
                    {
                        Field = field,
                        Severity = QualitySeverity.Warning,
                        Message = $"Field '{field}' has {nullPct:F1}% null values (threshold: {maxNullPercent}%).",
                        AffectedRecords = nullCount,
                        SuggestedAction = $"Consider applying default values or filtering null '{field}' records."
                    });
                }
            }
        }

        private static void CheckOutliers(
            IReadOnlyList<Dictionary<string, object?>> records,
            List<string> outlierColumns,
            double maxOutlierPercent,
            QualityReport report)
        {
            foreach (var col in outlierColumns)
            {
                var values = new List<double>();
                foreach (var r in records)
                {
                    if (r.TryGetValue(col, out var v) && v != null)
                    {
                        try { values.Add(Convert.ToDouble(v)); } catch { }
                    }
                }

                if (values.Count < 10) continue;

                var sorted = values.OrderBy(x => x).ToList();
                double q1 = sorted[sorted.Count / 4];
                double q3 = sorted[3 * sorted.Count / 4];
                double iqr = q3 - q1;
                double lower = q1 - 1.5 * iqr;
                double upper = q3 + 1.5 * iqr;

                int outlierCount = values.Count(v => v < lower || v > upper);
                double outlierPct = (double)outlierCount / values.Count * 100;

                if (outlierPct > maxOutlierPercent)
                {
                    report.Findings.Add(new QualityFinding
                    {
                        Field = col,
                        Severity = QualitySeverity.Warning,
                        Message = $"Field '{col}' has {outlierPct:F1}% outliers (IQR range: {lower:F2}–{upper:F2}).",
                        AffectedRecords = outlierCount,
                        SuggestedAction = $"Review outlier values in '{col}'. Consider capping or investigating source."
                    });
                }
            }
        }

        private static int CountCleanRecords(
            IReadOnlyList<Dictionary<string, object?>> records,
            List<string> requiredColumns)
        {
            return records.Count(r =>
                requiredColumns.All(col =>
                    r.ContainsKey(col) && r[col] != null &&
                    !(r[col] is string s && string.IsNullOrWhiteSpace(s))));
        }
    }
}
