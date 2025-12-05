// TerraFusion Codex: 3-6-9 Framework - Service Interface
// Elite Systems Architecture by MIT PhD Agent

using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.Services;
using TerraFusion.Abstractions.DTOs;
using static TerraFusion.Core.Services.CodexService;

namespace TerraFusion.Core.Interfaces
{
    /// <summary>
    /// Interface for Codex Service implementing 3-6-9 framework
    /// </summary>
    public interface ICodexService
    {
        // Foundation (3): Metric Scaling
        double ScaleMetric(double value, double min = 0, double max = 12);
        double ScaleMetricInverse(double value, double min, double max);

        // Amplification (6): Metric Combination
        double AmplifyMetrics(IEnumerable<double> metrics);
        double AmplifyMetricsWeighted(IEnumerable<double> metrics, IEnumerable<double> weights);

        // Ultimate Power (9): Normalization
        double CalculateUltimatePower(IEnumerable<double> metrics);

        // Domain-Specific Amplification
        double AmplifySystemHealth(SystemPerformanceMetrics metrics);
        double AmplifyEngineeringExcellence(CodeQualityMetrics metrics);
        double AmplifyFISMACompliance(CodexComplianceMetrics metrics);

        // System-Wide Calculation
        Task<double> CalculateSystemWideUltimatePowerAsync(SystemWideCodex codex);

        // Alert & Threshold Analysis
        AlertThreshold DetermineAlertLevel(double score);

        // Trend Analysis
        Trend CalculateTrend(List<TimeSeriesCodex> history);

        // Comparative Analysis
        ComparisonResult CompareEnvironments(List<ComparativeCodex> codices);

        // Metric Gathering
        Task<SystemPerformanceMetrics> GatherSystemPerformanceMetricsAsync();
        Task<CodeQualityMetrics> GatherCodeQualityMetricsAsync();
        Task<CodexComplianceMetrics> GatherComplianceMetricsAsync();
        Task<SystemWideCodex> GetSystemWideCodexAsync();
    }
}
