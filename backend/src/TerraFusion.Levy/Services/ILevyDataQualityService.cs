using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Levy.Services;

/// <summary>
/// Levy-scoped data-quality surface.
/// Ports the Flask <c>routes_data_quality.py</c> JSON endpoints (7 total).
/// HTML dashboard routes are intentionally skipped — they live in the React shell.
/// </summary>
/// <remarks>
/// Phase 2 contract port: shapes match the Flask responses.
/// Implementation is deterministic placeholder; downstream phases will wire this
/// behind the TerraFusion AI swarm without changing the interface.
/// </remarks>
public interface ILevyDataQualityService
{
    Task<DataQualityAnalysisResult> AnalyzeAsync(DataQualityAnalysisRequest request, CancellationToken cancellationToken);
    Task<AiRecommendationsResult> GetAiRecommendationsAsync(AiRecommendationsRequest request, CancellationToken cancellationToken);
    Task<MonitoringStatusResult> GetMonitoringStatusAsync(CancellationToken cancellationToken);
    Task<MonitoringToggleResult> ToggleMonitoringAsync(MonitoringToggleRequest request, CancellationToken cancellationToken);
    Task<RealtimeMetricsResult> GetRealtimeMetricsAsync(CancellationToken cancellationToken);
    Task<LevyTrendAnalysisResult> AnalyzeTrendsAsync(LevyTrendAnalysisRequest request, CancellationToken cancellationToken);
    Task<DataQualityAuditResult> AuditAsync(DataQualityAuditRequest request, CancellationToken cancellationToken);
}

// ─── /analyze ───────────────────────────────────────────────────────────────
public sealed class DataQualityAnalysisRequest
{
    public double OverallScore { get; set; } = 85.0;
    public double CompletenessScore { get; set; } = 90.0;
    public double AccuracyScore { get; set; } = 82.0;
    public double ConsistencyScore { get; set; } = 88.0;
    public double TimelinessScore { get; set; } = 75.0;
    public int CompletenessFieldsMissing { get; set; } = 45;
    public int AccuracyErrors { get; set; } = 128;
    public int ConsistencyIssues { get; set; } = 65;
}

public sealed class DataQualityAnalysisResult
{
    public bool Success { get; set; }
    public double Score { get; set; }
    public DateTime GeneratedAt { get; set; }
    public List<string> Assumptions { get; set; } = new();
}

// ─── /ai-recommendations ────────────────────────────────────────────────────
public sealed class AiRecommendationsRequest
{
    public string FocusArea { get; set; } = "all";
    public int MaxRecommendations { get; set; } = 5;
}

public sealed class AiRecommendation
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string FocusArea { get; set; } = string.Empty;
    public string Severity { get; set; } = "info";
    public string? Action { get; set; }
}

public sealed class AiRecommendationsResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public List<AiRecommendation> Recommendations { get; set; } = new();
    public string Source { get; set; } = "placeholder";
}

// ─── /monitoring-status & /monitoring/toggle ────────────────────────────────
public sealed class MonitoringStatusResult
{
    public bool Enabled { get; set; }
    public int IntervalMinutes { get; set; }
    public double AlertThreshold { get; set; }
    public string Agent { get; set; } = "placeholder";
    public DateTime CheckedAt { get; set; }
}

public sealed class MonitoringToggleRequest
{
    public bool Enabled { get; set; }
    public int IntervalMinutes { get; set; } = 15;
    public double AlertThreshold { get; set; } = 0.75;
}

public sealed class MonitoringToggleResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public MonitoringStatusResult Status { get; set; } = new();
}

// ─── /realtime-metrics ──────────────────────────────────────────────────────
public sealed class RealtimeMetricsResult
{
    public bool Success { get; set; }
    public Dictionary<string, double> Metrics { get; set; } = new();
    public DateTime Timestamp { get; set; }
    public string Source { get; set; } = "placeholder";
}

// ─── /trends ────────────────────────────────────────────────────────────────
public sealed class LevyTrendAnalysisRequest
{
    public Guid? DistrictId { get; set; }
    public string? TaxCodeId { get; set; }
    public int[]? YearRange { get; set; }
    public string TrendType { get; set; } = "rate";
    public bool CompareToSimilar { get; set; }
}

public sealed class LevyTrendAnalysisResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public Dictionary<string, object> TrendResults { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
    public List<string> Assumptions { get; set; } = new();
}

// ─── /audit ─────────────────────────────────────────────────────────────────
public sealed class DataQualityAuditRequest
{
    public List<string> FocusAreas { get; set; } = new() { "completeness", "accuracy", "consistency", "timeliness" };
    public Guid? DistrictId { get; set; }
    public bool Comprehensive { get; set; }
}

public sealed class DataQualityAuditResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public Dictionary<string, object> AuditResults { get; set; } = new();
    public string AuditType { get; set; } = "standard";
    public List<string> FocusAreas { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
    public List<string> Assumptions { get; set; } = new();
}
