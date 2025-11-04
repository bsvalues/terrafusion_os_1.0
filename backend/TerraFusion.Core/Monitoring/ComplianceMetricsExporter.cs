using Prometheus;
using System.Diagnostics;
using TerraFusion.Core.Services;

namespace TerraFusion.Core.Monitoring;

/// <summary>
/// 📊 Compliance Metrics Exporter for Prometheus
/// 
/// Exports government compliance metrics to Prometheus for real-time monitoring:
/// - Overall compliance scores (0-100%)
/// - Individual standard compliance (FISMA, FedRAMP, Section 508, SOC 2, NIST)
/// - Violation counts by severity (Critical, High, Medium, Low)
/// - Compliance trend monitoring (compliance score changes over time)
/// - Championship compliance tracking (counties with 100% compliance)
/// 
/// Integrates with Grafana for compliance dashboard visualization.
/// </summary>
public class ComplianceMetricsExporter
{
    // ==================== Compliance Score Gauges ====================

    private static readonly Gauge OverallComplianceScore = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_overall_score_percent",
            "Overall government compliance score (0-100%)",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

    private static readonly Gauge FISMAComplianceScore = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_fisma_high_score_percent",
            "FISMA-High compliance score (0-100%)",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

    private static readonly Gauge FedRAMPComplianceScore = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_fedramp_high_score_percent",
            "FedRAMP High compliance score (0-100%)",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

    private static readonly Gauge Section508ComplianceScore = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_section508_score_percent",
            "Section 508 accessibility compliance score (0-100%)");

    private static readonly Gauge SOC2ComplianceScore = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_soc2_score_percent",
            "SOC 2 Type II compliance score (0-100%)",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

    private static readonly Gauge NISTComplianceScore = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_nist_80053_score_percent",
            "NIST 800-53 security controls compliance score (0-100%)",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

    // ==================== Violation Counters ====================

    private static readonly Gauge CriticalViolationsCount = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_violations_critical_count",
            "Count of critical compliance violations",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

    private static readonly Gauge HighViolationsCount = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_violations_high_count",
            "Count of high-severity compliance violations",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

    private static readonly Gauge MediumViolationsCount = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_violations_medium_count",
            "Count of medium-severity compliance violations",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

    private static readonly Gauge LowViolationsCount = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_violations_low_count",
            "Count of low-severity compliance violations",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

    // ==================== Compliance Monitoring ====================

    private static readonly Gauge ComplianceTrendScore = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_trend_score_change_percent",
            "Change in compliance score over time (positive = improving)",
            new GaugeConfiguration { LabelNames = new[] { "county", "timeframe" } });

    private static readonly Gauge ChampionshipCountiesCount = Prometheus.Metrics
        .CreateGauge("terrafusion_compliance_championship_counties_count",
            "Number of counties with 100% compliance (championship status)");

    // ==================== Compliance Operations ====================

    private static readonly Counter ComplianceChecksTotal = Prometheus.Metrics
        .CreateCounter("terrafusion_compliance_checks_total",
            "Total number of compliance checks performed",
            new CounterConfiguration { LabelNames = new[] { "county", "standard" } });

    private static readonly Histogram ComplianceCheckDuration = Prometheus.Metrics
        .CreateHistogram("terrafusion_compliance_check_duration_seconds",
            "Duration of compliance checks in seconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "county", "standard" },
                Buckets = new double[] { 0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0 }
            });

    /// <summary>
    /// Export compliance metrics for a specific county
    /// </summary>
    public void ExportComplianceMetrics(string countyCode, ComplianceResult result)
    {
        var activity = Activity.Current;

        try
        {
            // Overall compliance score
            OverallComplianceScore.WithLabels(countyCode).Set(result.OverallScore);

            // Individual standard scores
            FISMAComplianceScore.WithLabels(countyCode).Set(result.FISMAScore);
            FedRAMPComplianceScore.WithLabels(countyCode).Set(result.FedRAMPScore);
            Section508ComplianceScore.Set(result.Section508Score);
            SOC2ComplianceScore.WithLabels(countyCode).Set(result.SOC2Score);
            NISTComplianceScore.WithLabels(countyCode).Set(result.NISTScore);

            // Violation counts
            CriticalViolationsCount.WithLabels(countyCode).Set(result.CriticalViolations);
            HighViolationsCount.WithLabels(countyCode).Set(result.HighViolations);
            MediumViolationsCount.WithLabels(countyCode).Set(result.MediumViolations);
            LowViolationsCount.WithLabels(countyCode).Set(result.LowViolations);

            // Compliance checks
            ComplianceChecksTotal.WithLabels(countyCode, "all").Inc();

            activity?.SetTag("compliance.export", "success");
        }
        catch (Exception ex)
        {
            activity?.SetTag("compliance.export", "failed");
            activity?.SetTag("error.message", ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Record compliance check duration
    /// </summary>
    public void RecordComplianceCheckDuration(string countyCode, string standard, double durationSeconds)
    {
        ComplianceCheckDuration.WithLabels(countyCode, standard).Observe(durationSeconds);
        ComplianceChecksTotal.WithLabels(countyCode, standard).Inc();
    }

    /// <summary>
    /// Update championship counties count
    /// </summary>
    public void UpdateChampionshipCount(int championshipCount)
    {
        ChampionshipCountiesCount.Set(championshipCount);
    }

    /// <summary>
    /// Record compliance trend
    /// </summary>
    public void RecordComplianceTrend(string countyCode, string timeframe, double scoreChange)
    {
        ComplianceTrendScore.WithLabels(countyCode, timeframe).Set(scoreChange);
    }
}

/// <summary>
/// Compliance check result DTO
/// </summary>
public class ComplianceResult
{
    public double OverallScore { get; set; }
    public double FISMAScore { get; set; }
    public double FedRAMPScore { get; set; }
    public double Section508Score { get; set; }
    public double SOC2Score { get; set; }
    public double NISTScore { get; set; }
    public int CriticalViolations { get; set; }
    public int HighViolations { get; set; }
    public int MediumViolations { get; set; }
    public int LowViolations { get; set; }
}
