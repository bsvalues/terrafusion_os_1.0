/**
 * AnalyticsController - REST API for Analytics & Reporting
 *
 * Provides endpoints for analytics summaries, trend analysis, custom reports,
 * data aggregations, predictive insights, and usage reporting.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 2 Day 2
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.DTOs;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    [Produces("application/json")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsReportingService _analyticsService;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(
            IAnalyticsReportingService analyticsService,
            ILogger<AnalyticsController> logger)
        {
            _analyticsService = analyticsService;
            _logger = logger;
        }

        /// <summary>
        /// Get analytics summary
        /// </summary>
        /// <param name="timeRange">Time range (1h, 6h, 24h, 7d, 30d)</param>
        /// <returns>Comprehensive analytics summary</returns>
        [HttpGet("summary")]
        [ProducesResponseType(typeof(AnalyticsSummary), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSummary([FromQuery] string timeRange = "24h")
        {
            try
            {
                var summary = await _analyticsService.GetAnalyticsSummaryAsync(timeRange);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting analytics summary");
                return StatusCode(500, new { error = "Failed to get analytics summary" });
            }
        }

        /// <summary>
        /// Get trend analysis for metric
        /// </summary>
        /// <param name="metric">Metric name (users, requests, performance, errors)</param>
        /// <param name="timeRange">Time range</param>
        /// <returns>Trend analysis with predictions</returns>
        [HttpGet("trends/{metric}")]
        [ProducesResponseType(typeof(List<TrendAnalysis>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTrends(string metric, [FromQuery] string timeRange = "7d")
        {
            try
            {
                var trends = await _analyticsService.GetTrendAnalysisAsync(metric, timeRange);
                return Ok(trends);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trend analysis");
                return StatusCode(500, new { error = "Failed to get trend analysis" });
            }
        }

        /// <summary>
        /// Generate custom report
        /// </summary>
        /// <param name="request">Report configuration</param>
        /// <returns>Generated custom report</returns>
        [HttpPost("reports")]
        [ProducesResponseType(typeof(CustomReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GenerateReport([FromBody] ReportRequest request)
        {
            try
            {
                _logger.LogInformation("Generating custom report: {ReportName}", request.ReportName);
                var report = await _analyticsService.GenerateCustomReportAsync(request);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating custom report");
                return StatusCode(500, new { error = "Failed to generate report" });
            }
        }

        /// <summary>
        /// Get data aggregations
        /// </summary>
        /// <param name="groupBy">Group by dimension (county, service, user, time)</param>
        /// <param name="timeRange">Time range</param>
        /// <returns>Aggregated data</returns>
        [HttpGet("aggregations")]
        [ProducesResponseType(typeof(List<DataAggregation>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAggregations(
            [FromQuery] string groupBy = "county",
            [FromQuery] string timeRange = "24h")
        {
            try
            {
                var aggregations = await _analyticsService.GetDataAggregationsAsync(groupBy, timeRange);
                return Ok(aggregations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting data aggregations");
                return StatusCode(500, new { error = "Failed to get aggregations" });
            }
        }

        /// <summary>
        /// Get predictive insights
        /// </summary>
        /// <param name="metric">Metric to analyze</param>
        /// <returns>Predictive insights with forecasts</returns>
        [HttpGet("insights/{metric}")]
        [ProducesResponseType(typeof(PredictiveInsights), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetInsights(string metric)
        {
            try
            {
                var insights = await _analyticsService.GetPredictiveInsightsAsync(metric);
                return Ok(insights);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting predictive insights");
                return StatusCode(500, new { error = "Failed to get insights" });
            }
        }

        /// <summary>
        /// Get user activity report
        /// </summary>
        /// <param name="timeRange">Time range</param>
        /// <returns>User activity analysis</returns>
        [HttpGet("users/activity")]
        [ProducesResponseType(typeof(UserActivityReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUserActivity([FromQuery] string timeRange = "7d")
        {
            try
            {
                var report = await _analyticsService.GetUserActivityReportAsync(timeRange);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user activity report");
                return StatusCode(500, new { error = "Failed to get user activity" });
            }
        }

        /// <summary>
        /// Get system usage report
        /// </summary>
        /// <param name="timeRange">Time range</param>
        /// <returns>System usage analysis</returns>
        [HttpGet("system/usage")]
        [ProducesResponseType(typeof(SystemUsageReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSystemUsage([FromQuery] string timeRange = "7d")
        {
            try
            {
                var report = await _analyticsService.GetSystemUsageReportAsync(timeRange);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system usage report");
                return StatusCode(500, new { error = "Failed to get system usage" });
            }
        }
    }
}
