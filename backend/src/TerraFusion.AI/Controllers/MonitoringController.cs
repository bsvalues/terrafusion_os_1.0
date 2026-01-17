/*
 * MonitoringController - REST API for Advanced Monitoring
 *
 * Provides endpoints for system metrics, performance monitoring,
 * service health, resource utilization, alerts, and time series data.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 2 Day 1
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/monitoring")]
    [Produces("application/json")]
    public class MonitoringController : ControllerBase
    {
        private readonly IAdvancedMonitoringService _monitoringService;
        private readonly ILogger<MonitoringController> _logger;

        public MonitoringController(
            IAdvancedMonitoringService monitoringService,
            ILogger<MonitoringController> logger)
        {
            _monitoringService = monitoringService;
            _logger = logger;
        }

        /// <summary>
        /// Get complete monitoring dashboard
        /// </summary>
        /// <returns>Comprehensive monitoring dashboard with all metrics</returns>
        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(MonitoringDashboard), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                AdvancedMonitoringService.IncrementRequestCount("/api/monitoring/dashboard");

                var dashboard = await _monitoringService.GetMonitoringDashboardAsync();
                return Ok(dashboard);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting monitoring dashboard");
                AdvancedMonitoringService.IncrementErrorCount();
                return StatusCode(500, new { error = "Failed to get monitoring dashboard" });
            }
        }

        /// <summary>
        /// Get system metrics
        /// </summary>
        /// <returns>Current system metrics</returns>
        [HttpGet("system")]
        [ProducesResponseType(typeof(SystemMetrics), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSystemMetrics()
        {
            try
            {
                AdvancedMonitoringService.IncrementRequestCount("/api/monitoring/system");

                var metrics = await _monitoringService.GetSystemMetricsAsync();
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system metrics");
                AdvancedMonitoringService.IncrementErrorCount();
                return StatusCode(500, new { error = "Failed to get system metrics" });
            }
        }

        /// <summary>
        /// Get performance metrics
        /// </summary>
        /// <param name="timeRange">Time range (5m, 15m, 1h, 6h, 24h)</param>
        /// <returns>Performance metrics for specified time range</returns>
        [HttpGet("performance")]
        [ProducesResponseType(typeof(Services.AdvancedMonitoringPerformanceMetrics), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPerformanceMetrics([FromQuery] string timeRange = "1h")
        {
            try
            {
                AdvancedMonitoringService.IncrementRequestCount("/api/monitoring/performance");

                var metrics = await _monitoringService.GetPerformanceMetricsAsync(timeRange);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting performance metrics");
                AdvancedMonitoringService.IncrementErrorCount();
                return StatusCode(500, new { error = "Failed to get performance metrics" });
            }
        }

        /// <summary>
        /// Get service health metrics
        /// </summary>
        /// <returns>Health metrics for all services</returns>
        [HttpGet("services")]
        [ProducesResponseType(typeof(List<ServiceHealthMetric>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetServiceHealth()
        {
            try
            {
                AdvancedMonitoringService.IncrementRequestCount("/api/monitoring/services");

                var services = await _monitoringService.GetServiceHealthMetricsAsync();
                return Ok(services);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting service health");
                AdvancedMonitoringService.IncrementErrorCount();
                return StatusCode(500, new { error = "Failed to get service health" });
            }
        }

        /// <summary>
        /// Get resource utilization
        /// </summary>
        /// <returns>Current resource utilization metrics</returns>
        [HttpGet("resources")]
        [ProducesResponseType(typeof(ResourceUtilization), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetResourceUtilization()
        {
            try
            {
                AdvancedMonitoringService.IncrementRequestCount("/api/monitoring/resources");

                var resources = await _monitoringService.GetResourceUtilizationAsync();
                return Ok(resources);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting resource utilization");
                AdvancedMonitoringService.IncrementErrorCount();
                return StatusCode(500, new { error = "Failed to get resource utilization" });
            }
        }

        /// <summary>
        /// Get active alerts
        /// </summary>
        /// <returns>List of active alerts</returns>
        [HttpGet("alerts")]
        [ProducesResponseType(typeof(List<Alert>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAlerts()
        {
            try
            {
                AdvancedMonitoringService.IncrementRequestCount("/api/monitoring/alerts");

                var alerts = await _monitoringService.GetActiveAlertsAsync();
                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting alerts");
                AdvancedMonitoringService.IncrementErrorCount();
                return StatusCode(500, new { error = "Failed to get alerts" });
            }
        }

        /// <summary>
        /// Get metric time series data
        /// </summary>
        /// <param name="metric">Metric name (cpu, memory, requests, latency, errors)</param>
        /// <param name="timeRange">Time range (5m, 15m, 1h, 6h, 24h)</param>
        /// <returns>Time series data for specified metric</returns>
        [HttpGet("metrics/{metric}")]
        [ProducesResponseType(typeof(List<MetricTimeSeries>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMetricTimeSeries(string metric, [FromQuery] string timeRange = "1h")
        {
            try
            {
                AdvancedMonitoringService.IncrementRequestCount($"/api/monitoring/metrics/{metric}");

                var series = await _monitoringService.GetMetricTimeSeriesAsync(metric, timeRange);
                return Ok(series);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting metric time series");
                AdvancedMonitoringService.IncrementErrorCount();
                return StatusCode(500, new { error = "Failed to get metric time series" });
            }
        }
    }
}
