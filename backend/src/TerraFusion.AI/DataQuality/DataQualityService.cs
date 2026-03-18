// TFT-013, TFT-008: IAAO-standard data quality scoring service
// Implements the four-dimension quality framework from
// IAAO Standard on Data Quality (2018).

using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.DataQuality;

#region DTOs

/// <summary>
/// Quality grade aligned with IAAO tiered rating system.
/// </summary>
public enum QualityGrade
{
    /// <summary>Exceptional quality: score 90-100.</summary>
    A,
    /// <summary>Good quality: score 80-89.</summary>
    B,
    /// <summary>Acceptable quality: score 70-79.</summary>
    C,
    /// <summary>Below standard: score 60-69.</summary>
    D,
    /// <summary>Failing quality: score below 60.</summary>
    F
}

/// <summary>
/// Score for a single quality dimension, expressed as a percentage (0-100).
/// </summary>
/// <param name="Dimension">Name of the quality dimension.</param>
/// <param name="Score">Numeric score, 0-100.</param>
/// <param name="Weight">Weight used in the overall composite (must sum to 1.0 across dimensions).</param>
/// <param name="Details">Human-readable explanation of how the score was derived.</param>
public sealed record DimensionScore(
    string Dimension,
    double Score,
    double Weight,
    string Details);

/// <summary>
/// Complete quality report for a dataset.
/// </summary>
/// <param name="OverallScore">Weighted composite score, 0-100.</param>
/// <param name="Grade">Letter grade derived from the overall score.</param>
/// <param name="Dimensions">Individual dimension scores.</param>
/// <param name="RecordCount">Total number of records evaluated.</param>
/// <param name="EvaluatedAt">Timestamp of the evaluation.</param>
public sealed record QualityReport(
    double OverallScore,
    QualityGrade Grade,
    IReadOnlyList<DimensionScore> Dimensions,
    int RecordCount,
    DateTime EvaluatedAt);

/// <summary>
/// Represents a single record in a dataset to be quality-scored.
/// Callers populate this from their domain objects.
/// </summary>
public sealed class DatasetRecord
{
    /// <summary>Unique identifier (parcel number, sale id, etc.).</summary>
    public required string RecordId { get; init; }

    /// <summary>
    /// Field values keyed by field name. Null values represent missing data.
    /// </summary>
    public required IReadOnlyDictionary<string, object?> Fields { get; init; }

    /// <summary>Timestamp when this record was last updated.</summary>
    public DateTime? LastUpdated { get; init; }
}

/// <summary>
/// Configuration for quality assessment, specifying which fields to evaluate
/// and dimension weights.
/// </summary>
public sealed class QualityAssessmentConfig
{
    /// <summary>Fields that must be non-null for completeness scoring.</summary>
    public IReadOnlyList<string> RequiredFields { get; init; } = Array.Empty<string>();

    /// <summary>
    /// Numeric field range constraints for accuracy scoring.
    /// Key = field name, Value = (min, max).
    /// </summary>
    public IReadOnlyDictionary<string, (double Min, double Max)> RangeConstraints { get; init; }
        = new Dictionary<string, (double, double)>();

    /// <summary>
    /// Cross-field consistency checks. Each predicate returns true if consistent.
    /// </summary>
    public IReadOnlyList<Func<DatasetRecord, bool>> ConsistencyChecks { get; init; }
        = Array.Empty<Func<DatasetRecord, bool>>();

    /// <summary>Maximum acceptable age of a record in days for timeliness scoring.</summary>
    public int MaxRecordAgeDays { get; init; } = 365;

    /// <summary>Weight for completeness dimension (default 0.30).</summary>
    public double CompletenessWeight { get; init; } = 0.30;

    /// <summary>Weight for consistency dimension (default 0.25).</summary>
    public double ConsistencyWeight { get; init; } = 0.25;

    /// <summary>Weight for accuracy dimension (default 0.25).</summary>
    public double AccuracyWeight { get; init; } = 0.25;

    /// <summary>Weight for timeliness dimension (default 0.20).</summary>
    public double TimelinessWeight { get; init; } = 0.20;
}

#endregion

/// <summary>
/// Assesses dataset quality across four IAAO dimensions:
/// completeness, consistency, accuracy, and timeliness.
/// </summary>
public interface IDataQualityService
{
    /// <summary>
    /// Evaluates a dataset and produces a <see cref="QualityReport"/>.
    /// </summary>
    /// <param name="dataset">The records to evaluate.</param>
    /// <param name="config">Assessment configuration (fields, weights, constraints).</param>
    /// <returns>A quality report with dimension scores and overall grade.</returns>
    Task<QualityReport> AssessQualityAsync(
        IReadOnlyList<DatasetRecord> dataset,
        QualityAssessmentConfig config);
}

/// <inheritdoc />
public sealed class DataQualityService : IDataQualityService
{
    private readonly ILogger<DataQualityService> _logger;

    public DataQualityService(ILogger<DataQualityService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public Task<QualityReport> AssessQualityAsync(
        IReadOnlyList<DatasetRecord> dataset,
        QualityAssessmentConfig config)
    {
        ArgumentNullException.ThrowIfNull(dataset);
        ArgumentNullException.ThrowIfNull(config);

        if (dataset.Count == 0)
        {
            return Task.FromResult(new QualityReport(0, QualityGrade.F,
                Array.Empty<DimensionScore>(), 0, DateTime.UtcNow));
        }

        var completeness = ScoreCompleteness(dataset, config);
        var consistency = ScoreConsistency(dataset, config);
        var accuracy = ScoreAccuracy(dataset, config);
        var timeliness = ScoreTimeliness(dataset, config);

        var dimensions = new List<DimensionScore> { completeness, consistency, accuracy, timeliness };

        double totalWeight = dimensions.Sum(d => d.Weight);
        double overallScore = totalWeight > 0
            ? dimensions.Sum(d => d.Score * d.Weight) / totalWeight
            : 0;

        // Clamp to [0, 100]
        overallScore = Math.Clamp(overallScore, 0, 100);

        var grade = overallScore switch
        {
            >= 90 => QualityGrade.A,
            >= 80 => QualityGrade.B,
            >= 70 => QualityGrade.C,
            >= 60 => QualityGrade.D,
            _ => QualityGrade.F
        };

        var report = new QualityReport(
            Math.Round(overallScore, 2),
            grade,
            dimensions,
            dataset.Count,
            DateTime.UtcNow);

        _logger.LogInformation(
            "Data quality assessment complete: {RecordCount} records, overall score {Score:F1} ({Grade})",
            dataset.Count, overallScore, grade);

        return Task.FromResult(report);
    }

    /// <summary>
    /// Completeness = percentage of required fields that are non-null/non-empty
    /// across all records.
    /// </summary>
    private static DimensionScore ScoreCompleteness(
        IReadOnlyList<DatasetRecord> dataset, QualityAssessmentConfig config)
    {
        if (config.RequiredFields.Count == 0)
        {
            return new DimensionScore("Completeness", 100, config.CompletenessWeight,
                "No required fields configured; defaulting to 100%.");
        }

        int totalChecks = dataset.Count * config.RequiredFields.Count;
        int presentCount = 0;

        foreach (var record in dataset)
        {
            foreach (var field in config.RequiredFields)
            {
                if (record.Fields.TryGetValue(field, out var value) && value is not null)
                {
                    if (value is not string s || !string.IsNullOrWhiteSpace(s))
                    {
                        presentCount++;
                    }
                }
            }
        }

        double score = totalChecks > 0 ? (double)presentCount / totalChecks * 100 : 0;

        return new DimensionScore("Completeness", Math.Round(score, 2), config.CompletenessWeight,
            $"{presentCount}/{totalChecks} required field values present ({score:F1}%).");
    }

    /// <summary>
    /// Consistency = percentage of records passing all cross-field consistency checks.
    /// </summary>
    private static DimensionScore ScoreConsistency(
        IReadOnlyList<DatasetRecord> dataset, QualityAssessmentConfig config)
    {
        if (config.ConsistencyChecks.Count == 0)
        {
            return new DimensionScore("Consistency", 100, config.ConsistencyWeight,
                "No consistency checks configured; defaulting to 100%.");
        }

        int totalChecks = dataset.Count * config.ConsistencyChecks.Count;
        int passedCount = 0;

        foreach (var record in dataset)
        {
            foreach (var check in config.ConsistencyChecks)
            {
                try
                {
                    if (check(record))
                        passedCount++;
                }
                catch
                {
                    // Failed check counts as inconsistent
                }
            }
        }

        double score = totalChecks > 0 ? (double)passedCount / totalChecks * 100 : 0;

        return new DimensionScore("Consistency", Math.Round(score, 2), config.ConsistencyWeight,
            $"{passedCount}/{totalChecks} consistency checks passed ({score:F1}%).");
    }

    /// <summary>
    /// Accuracy = percentage of numeric field values that fall within their
    /// declared valid range.
    /// </summary>
    private static DimensionScore ScoreAccuracy(
        IReadOnlyList<DatasetRecord> dataset, QualityAssessmentConfig config)
    {
        if (config.RangeConstraints.Count == 0)
        {
            return new DimensionScore("Accuracy", 100, config.AccuracyWeight,
                "No range constraints configured; defaulting to 100%.");
        }

        int totalChecks = 0;
        int inRangeCount = 0;

        foreach (var record in dataset)
        {
            foreach (var (field, (min, max)) in config.RangeConstraints)
            {
                if (!record.Fields.TryGetValue(field, out var rawValue) || rawValue is null)
                    continue; // Skip nulls — completeness handles missing data

                totalChecks++;

                double numericValue;
                if (rawValue is double d)
                    numericValue = d;
                else if (rawValue is decimal dec)
                    numericValue = (double)dec;
                else if (rawValue is int i)
                    numericValue = i;
                else if (rawValue is long l)
                    numericValue = l;
                else if (double.TryParse(rawValue.ToString(), out var parsed))
                    numericValue = parsed;
                else
                    continue; // Non-numeric, skip

                if (numericValue >= min && numericValue <= max)
                    inRangeCount++;
            }
        }

        double score = totalChecks > 0 ? (double)inRangeCount / totalChecks * 100 : 100;

        return new DimensionScore("Accuracy", Math.Round(score, 2), config.AccuracyWeight,
            $"{inRangeCount}/{totalChecks} range checks passed ({score:F1}%).");
    }

    /// <summary>
    /// Timeliness = percentage of records whose LastUpdated is within the
    /// configured maximum age. Records without a LastUpdated are penalized.
    /// </summary>
    private static DimensionScore ScoreTimeliness(
        IReadOnlyList<DatasetRecord> dataset, QualityAssessmentConfig config)
    {
        var cutoff = DateTime.UtcNow.AddDays(-config.MaxRecordAgeDays);
        int timelyCount = 0;

        foreach (var record in dataset)
        {
            if (record.LastUpdated.HasValue && record.LastUpdated.Value >= cutoff)
                timelyCount++;
        }

        double score = (double)timelyCount / dataset.Count * 100;

        return new DimensionScore("Timeliness", Math.Round(score, 2), config.TimelinessWeight,
            $"{timelyCount}/{dataset.Count} records updated within {config.MaxRecordAgeDays} days ({score:F1}%).");
    }
}
