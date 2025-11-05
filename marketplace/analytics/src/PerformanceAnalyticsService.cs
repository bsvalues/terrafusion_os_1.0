using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.Analytics.Services
{
    /// <summary>
    /// Performance analytics service for county-level system metrics and AI swarm performance.
    /// Provides real-time monitoring of TerraFusion platform health across 39 counties.
    /// </summary>
    public class PerformanceAnalyticsService : IPerformanceAnalyticsService
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<PerformanceAnalyticsService> _logger;
        private readonly IConsciousnessOrchestrator _consciousnessEngine;
        private readonly IPerformanceMetricsCollector _metricsCollector;

        public PerformanceAnalyticsService(
            TerraFusionDbContext context,
            ILogger<PerformanceAnalyticsService> logger,
            IConsciousnessOrchestrator consciousnessEngine,
            IPerformanceMetricsCollector metricsCollector)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _consciousnessEngine = consciousnessEngine ?? throw new ArgumentNullException(nameof(consciousnessEngine));
            _metricsCollector = metricsCollector ?? throw new ArgumentNullException(nameof(metricsCollector));
        }

        /// <summary>
        /// Get comprehensive county performance metrics.
        /// COUNTY ISOLATION: Returns metrics for specific county only.
        /// </summary>
        public async Task<CountyPerformanceMetrics> GetCountyMetricsAsync(
            Guid countyCode,
            DateTime startTime,
            DateTime endTime)
        {
            if (countyCode == Guid.Empty)
                throw new ArgumentException("County code cannot be empty", nameof(countyCode));

            _logger.LogInformation(
                "Fetching performance metrics for county {CountyId} from {StartTime} to {EndTime}",
                countyCode, startTime, endTime);

            // Get raw performance metrics (COUNTY ISOLATED)
            var rawMetrics = await _metricsCollector.GetMetricsAsync(countyCode, startTime, endTime);

            // Calculate aggregated statistics
            var metrics = new CountyPerformanceMetrics
            {
                CountyId = countyCode,
                StartTime = startTime,
                EndTime = endTime,

                // API Performance
                ApiLatencyP50 = CalculatePercentile(rawMetrics.ApiLatencies, 50),
                ApiLatencyP95 = CalculatePercentile(rawMetrics.ApiLatencies, 95),
                ApiLatencyP99 = CalculatePercentile(rawMetrics.ApiLatencies, 99),
                TotalApiRequests = rawMetrics.ApiLatencies.Count,
                FailedRequests = rawMetrics.FailedRequests,
                SuccessRate = rawMetrics.ApiLatencies.Count > 0
                    ? (decimal)(rawMetrics.ApiLatencies.Count - rawMetrics.FailedRequests) / rawMetrics.ApiLatencies.Count * 100
                    : 100,

                // Database Performance
                DatabaseLatencyP50 = CalculatePercentile(rawMetrics.DatabaseLatencies, 50),
                DatabaseLatencyP95 = CalculatePercentile(rawMetrics.DatabaseLatencies, 95),
                TotalDatabaseQueries = rawMetrics.DatabaseLatencies.Count,
                DatabaseConnectionPoolSize = rawMetrics.DatabaseConnectionPoolSize,

                // AI Swarm Performance
                AIAgentsActive = rawMetrics.ActiveAIAgents,
                AISwarmLatencyP50 = CalculatePercentile(rawMetrics.AISwarmLatencies, 50),
                AISwarmLatencyP95 = CalculatePercentile(rawMetrics.AISwarmLatencies, 95),
                TotalAICoordinations = rawMetrics.AICoordinations.Count,
                AIConfidenceAverage = rawMetrics.AICoordinations.Any()
                    ? rawMetrics.AICoordinations.Average(c => c.Confidence)
                    : 0,

                // System Resources
                CpuUsagePercent = rawMetrics.CpuUsagePercent,
                MemoryUsageMB = rawMetrics.MemoryUsageMB,
                DiskUsagePercent = rawMetrics.DiskUsagePercent,

                // Data Volume
                PropertiesProcessed = rawMetrics.PropertiesProcessed,
                AssessmentsCreated = rawMetrics.AssessmentsCreated,
                DataSyncOperations = rawMetrics.DataSyncOperations
            };

            // Get AI-powered performance insights
            metrics.AIHealthInsights = await GetPerformanceAIInsightsAsync(countyCode, metrics);

            // Determine health status
            metrics.HealthStatus = DetermineHealthStatus(metrics);

            _logger.LogInformation(
                "County {CountyId} metrics: API P95={ApiP95}ms, Success={Success:F2}%, AI Agents={Agents}, Health={Health}",
                countyCode, metrics.ApiLatencyP95, metrics.SuccessRate, metrics.AIAgentsActive, metrics.HealthStatus);

            return metrics;
        }

        /// <summary>
        /// Get real-time AI swarm performance metrics across multiple counties.
        /// MULTI-COUNTY: Requires authorization for multi-county access.
        /// </summary>
        public async Task<AISwarmPerformanceMetrics> GetAISwarmMetricsAsync(
            List<Guid> countyCodes,
            TimeSpan timeRange)
        {
            if (countyCodes == null || !countyCodes.Any())
                throw new ArgumentException("At least one county code required", nameof(countyCodes));

            _logger.LogInformation(
                "Fetching AI swarm metrics for {CountyCount} counties over {TimeRange}",
                countyCodes.Count, timeRange);

            var endTime = DateTime.UtcNow;
            var startTime = endTime - timeRange;

            // Get consciousness engine status (system-wide)
            var consciousnessStatus = await _consciousnessEngine.GetSystemStatusAsync();

            // Get county-specific swarm metrics
            var countySwarmData = new List<CountySwarmData>();
            foreach (var countyCode in countyCodes)
            {
                var countyMetrics = await _metricsCollector.GetAIMetricsAsync(countyCode, startTime, endTime);
                countySwarmData.Add(new CountySwarmData
                {
                    CountyId = countyCode,
                    ActiveAgents = countyMetrics.ActiveAgents,
                    CompletedCoordinations = countyMetrics.CompletedCoordinations,
                    AverageSwarmSize = countyMetrics.AverageSwarmSize,
                    AverageLatency = countyMetrics.AverageLatency,
                    AverageConfidence = countyMetrics.AverageConfidence
                });
            }

            var metrics = new AISwarmPerformanceMetrics
            {
                TimeRange = timeRange,
                TotalCounties = countyCodes.Count,

                // Global AI Metrics
                TotalActiveAgents = consciousnessStatus.TotalActiveAgents,
                TotalAgentCapacity = 50000, // 50K+ agent capacity
                AgentUtilizationPercent = (decimal)consciousnessStatus.TotalActiveAgents / 50000 * 100,

                // Swarm Coordination
                TotalCoordinations = countySwarmData.Sum(c => c.CompletedCoordinations),
                AverageSwarmSize = countySwarmData.Average(c => c.AverageSwarmSize),
                AverageLatency = countySwarmData.Average(c => c.AverageLatency),
                AverageConfidence = countySwarmData.Average(c => c.AverageConfidence),

                // County Breakdown
                CountyMetrics = countySwarmData,

                // Consciousness Engine Status
                ConsciousnessLevel = consciousnessStatus.ConsciousnessLevel,
                QuantumOptimizationEnabled = consciousnessStatus.QuantumOptimizationEnabled,
                InfiniteDimensionalProcessingActive = consciousnessStatus.InfiniteDimensionalProcessingActive
            };

            _logger.LogInformation(
                "AI Swarm metrics: {TotalAgents} active agents ({Utilization:F2}% capacity), {Coordinations} coordinations, Avg confidence={Confidence:F2}%",
                metrics.TotalActiveAgents, metrics.AgentUtilizationPercent, metrics.TotalCoordinations, metrics.AverageConfidence);

            return metrics;
        }

        /// <summary>
        /// Get comparative performance metrics across multiple counties.
        /// Requires multi-county authorization (Power User role).
        /// </summary>
        public async Task<ComparativeCountyMetrics> GetComparativeMetricsAsync(
            List<Guid> countyCodes,
            DateTime startTime,
            DateTime endTime)
        {
            if (countyCodes == null || countyCodes.Count < 2)
                throw new ArgumentException("At least 2 county codes required for comparison", nameof(countyCodes));

            _logger.LogInformation(
                "Fetching comparative metrics for {CountyCount} counties from {StartTime} to {EndTime}",
                countyCodes.Count, startTime, endTime);

            // Get metrics for each county
            var countyMetricsList = new List<CountyPerformanceMetrics>();
            foreach (var countyCode in countyCodes)
            {
                var metrics = await GetCountyMetricsAsync(countyCode, startTime, endTime);
                countyMetricsList.Add(metrics);
            }

            // Calculate comparative statistics
            var comparison = new ComparativeCountyMetrics
            {
                CountyCodes = countyCodes,
                StartTime = startTime,
                EndTime = endTime,
                CountyMetrics = countyMetricsList,

                // API Performance Comparison
                BestApiLatencyP95 = countyMetricsList.Min(m => m.ApiLatencyP95),
                WorstApiLatencyP95 = countyMetricsList.Max(m => m.ApiLatencyP95),
                AverageApiLatencyP95 = countyMetricsList.Average(m => m.ApiLatencyP95),

                // Success Rate Comparison
                BestSuccessRate = countyMetricsList.Max(m => m.SuccessRate),
                WorstSuccessRate = countyMetricsList.Min(m => m.SuccessRate),
                AverageSuccessRate = countyMetricsList.Average(m => m.SuccessRate),

                // AI Performance Comparison
                MostAIAgents = countyMetricsList.Max(m => m.AIAgentsActive),
                LeastAIAgents = countyMetricsList.Min(m => m.AIAgentsActive),
                TotalAIAgents = countyMetricsList.Sum(m => m.AIAgentsActive),

                // Health Status Distribution
                HealthyCounties = countyMetricsList.Count(m => m.HealthStatus == "Healthy"),
                WarningCounties = countyMetricsList.Count(m => m.HealthStatus == "Warning"),
                CriticalCounties = countyMetricsList.Count(m => m.HealthStatus == "Critical")
            };

            // Identify top and bottom performers
            comparison.TopPerformer = countyMetricsList
                .OrderBy(m => m.ApiLatencyP95)
                .ThenByDescending(m => m.SuccessRate)
                .First().CountyId;

            comparison.NeedsAttention = countyMetricsList
                .Where(m => m.HealthStatus == "Critical" || m.HealthStatus == "Warning")
                .OrderByDescending(m => m.HealthStatus == "Critical" ? 2 : 1)
                .ThenBy(m => m.SuccessRate)
                .Select(m => m.CountyId)
                .ToList();

            _logger.LogInformation(
                "Comparative metrics: {HealthyCount} healthy, {WarningCount} warning, {CriticalCount} critical counties",
                comparison.HealthyCounties, comparison.WarningCounties, comparison.CriticalCounties);

            return comparison;
        }

        #region Private Helper Methods

        private double CalculatePercentile(List<double> values, int percentile)
        {
            if (!values.Any()) return 0;

            var sorted = values.OrderBy(v => v).ToList();
            int index = (int)Math.Ceiling(percentile / 100.0 * sorted.Count) - 1;
            index = Math.Max(0, Math.Min(index, sorted.Count - 1));
            return sorted[index];
        }

        private string DetermineHealthStatus(CountyPerformanceMetrics metrics)
        {
            // Critical conditions
            if (metrics.SuccessRate < 95.0m ||
                metrics.ApiLatencyP95 > 50 ||
                metrics.DatabaseLatencyP95 > 100)
            {
                return "Critical";
            }

            // Warning conditions
            if (metrics.SuccessRate < 99.0m ||
                metrics.ApiLatencyP95 > 20 ||
                metrics.DatabaseLatencyP95 > 50 ||
                metrics.CpuUsagePercent > 80)
            {
                return "Warning";
            }

            // Healthy
            return "Healthy";
        }

        private async Task<AIPerformanceInsights> GetPerformanceAIInsightsAsync(
            Guid countyCode,
            CountyPerformanceMetrics metrics)
        {
            var swarmRequest = new AISwarmRequest
            {
                CountyId = countyCode,
                AnalysisType = "PerformanceMetrics",
                Data = metrics,
                SwarmSize = 30
            };

            var swarmResult = await _consciousnessEngine.CoordinateAnalysisAsync(swarmRequest);

            return new AIPerformanceInsights
            {
                Confidence = swarmResult.Confidence,
                HealthAssessment = swarmResult.HealthAssessment,
                Recommendations = swarmResult.Recommendations,
                PredictedIssues = swarmResult.PredictedIssues,
                SwarmSize = swarmResult.AgentsUsed
            };
        }

        #endregion
    }
}
