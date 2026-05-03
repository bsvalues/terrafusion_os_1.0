using Microsoft.Extensions.Logging;

namespace TerraFusion.Consciousness.Services;

/// <summary>
/// Compatibility predictive-impact host.
/// Governed predictive impact modeling is unavailable until backed by measured training data and evidence.
/// </summary>
public class PredictiveImpactService : IPredictiveImpactService
{
    private const string UnavailableReason =
        "Governed predictive impact modeling unavailable; compatibility surface only.";

    private readonly ILogger<PredictiveImpactService> _logger;

    public PredictiveImpactService(ILogger<PredictiveImpactService> logger)
    {
        _logger = logger;
        _logger.LogWarning(UnavailableReason);
    }

    public Task<PredictedImpact> PredictParameterImpactAsync(
        string parameterName,
        double currentValue,
        double proposedValue,
        Dictionary<string, double> currentMetrics)
    {
        _logger.LogWarning(
            "Predictive impact request received for {ParameterName}, but {Reason}",
            parameterName,
            UnavailableReason);

        return Task.FromResult(new PredictedImpact
        {
            AccuracyChange = 0.0,
            PerformanceImpact = 0.0,
            CoordinationEfficiency = 0.0,
            ThroughputGain = 0.0,
            ConfidenceScore = 0.0,
            PredictionMethod = "Unavailable",
            FeatureImportance = new Dictionary<string, double>()
        });
    }

    public Task RecordActualImpactAsync(
        string parameterName,
        double oldValue,
        double newValue,
        ActualImpactMetrics actualMetrics)
    {
        _logger.LogWarning(
            "Actual impact record received for {ParameterName}, but {Reason}",
            parameterName,
            UnavailableReason);

        return Task.CompletedTask;
    }
}

#region Data Models

/// <summary>
/// Historical parameter adjustment data.
/// Retained for compatibility with existing callers.
/// </summary>
public class ParameterHistory
{
    public List<ParameterAdjustment> Adjustments { get; } = new();
    public int UntrainedSampleCount { get; private set; }

    public void AddPrediction(double oldValue, double newValue, PredictedImpact prediction)
    {
        Adjustments.Add(new ParameterAdjustment
        {
            Timestamp = DateTime.UtcNow,
            OldValue = oldValue,
            NewValue = newValue,
            PredictedImpact = prediction
        });
    }

    public void AddActualOutcome(double oldValue, double newValue, ActualImpactMetrics actual)
    {
        var adjustment = Adjustments.LastOrDefault(a =>
            Math.Abs(a.OldValue - oldValue) < 0.001 &&
            Math.Abs(a.NewValue - newValue) < 0.001);

        if (adjustment == null)
        {
            return;
        }

        adjustment.ActualMetrics = actual;
        UntrainedSampleCount++;
    }

    public void ResetUntrainedCount() => UntrainedSampleCount = 0;
}

public class ParameterAdjustment
{
    public DateTime Timestamp { get; set; }
    public double OldValue { get; set; }
    public double NewValue { get; set; }
    public PredictedImpact? PredictedImpact { get; set; }
    public ActualImpactMetrics? ActualMetrics { get; set; }
}

public class HistoricalPattern
{
    public double AverageDelta { get; set; }
    public double VarianceDelta { get; set; }
    public int TrendDirection { get; set; }
    public double RecentVolatility { get; set; }
    public double SeasonalFactor { get; set; }
    public double PredictionAccuracy { get; set; }
    public int SampleCount { get; set; }
}

public class PredictionResult
{
    public double AccuracyChange { get; set; }
    public double PerformanceImpact { get; set; }
    public double CoordinationEfficiency { get; set; }
    public double ThroughputGain { get; set; }
}

#endregion

#region Interfaces

public interface IPredictiveImpactService
{
    Task<PredictedImpact> PredictParameterImpactAsync(
        string parameterName,
        double currentValue,
        double proposedValue,
        Dictionary<string, double> currentMetrics);

    Task RecordActualImpactAsync(
        string parameterName,
        double oldValue,
        double newValue,
        ActualImpactMetrics actualMetrics);
}

public class PredictedImpact
{
    public double AccuracyChange { get; set; }
    public double PerformanceImpact { get; set; }
    public double CoordinationEfficiency { get; set; }
    public double ThroughputGain { get; set; }
    public double ConfidenceScore { get; set; }
    public string PredictionMethod { get; set; } = "Unknown";
    public Dictionary<string, double>? FeatureImportance { get; set; }
}

public class ActualImpactMetrics
{
    public double AccuracyChange { get; set; }
    public double PerformanceImpact { get; set; }
    public double CoordinationEfficiency { get; set; }
    public double ThroughputGain { get; set; }
    public DateTime MeasurementTime { get; set; }
}

#endregion
