/**
 * PerformanceProfilerController - REST API for Performance Profiling
 *
 * Provides endpoints for code profiling, bottleneck detection,
 * and optimization recommendations.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 8 Day 1
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/ai/profile")]
    [Produces("application/json")]
    public class PerformanceProfilerController : ControllerBase
    {
        private readonly IPerformanceProfilingService _profilingService;
        private readonly ILogger<PerformanceProfilerController> _logger;

        public PerformanceProfilerController(
            IPerformanceProfilingService profilingService,
            ILogger<PerformanceProfilerController> logger)
        {
            _profilingService = profilingService;
            _logger = logger;
        }

        /// <summary>
        /// Profile code execution and detect bottlenecks
        /// </summary>
        /// <param name="request">Profiling request with code and options</param>
        /// <returns>Comprehensive profiling results</returns>
        [HttpPost]
        [ProducesResponseType(typeof(ProfilingResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ProfileCode([FromBody] ProfileRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Code))
                {
                    return BadRequest(new { error = "Code is required" });
                }

                _logger.LogInformation("Profiling code in {Language}", request.Language);

                var result = await _profilingService.ProfileCodeAsync(request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error profiling code");
                return StatusCode(500, new { error = "Failed to profile code", details = ex.Message });
            }
        }

        /// <summary>
        /// Detect performance bottlenecks in code
        /// </summary>
        /// <param name="request">Code and line timings</param>
        /// <returns>List of detected bottlenecks</returns>
        [HttpPost("bottlenecks")]
        [ProducesResponseType(typeof(List<BottleneckAnalysis>), StatusCodes.Status200OK)]
        public async Task<IActionResult> DetectBottlenecks([FromBody] BottleneckRequest request)
        {
            try
            {
                var bottlenecks = await _profilingService.DetectBottlenecksAsync(
                    request.Code,
                    request.LineTimings
                );

                return Ok(bottlenecks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error detecting bottlenecks");
                return StatusCode(500, new { error = "Failed to detect bottlenecks" });
            }
        }

        /// <summary>
        /// Generate optimization recommendations
        /// </summary>
        /// <param name="result">Profiling result to analyze</param>
        /// <returns>List of optimization recommendations</returns>
        [HttpPost("recommendations")]
        [ProducesResponseType(typeof(List<ProfilingOptimizationRecommendation>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRecommendations([FromBody] ProfilingResult result)
        {
            try
            {
                var recommendations = await _profilingService.GenerateRecommendationsAsync(result);

                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating recommendations");
                return StatusCode(500, new { error = "Failed to generate recommendations" });
            }
        }

        /// <summary>
        /// Calculate performance metrics
        /// </summary>
        /// <param name="request">Function profiles to analyze</param>
        /// <returns>Aggregated performance metrics</returns>
        [HttpPost("metrics")]
        [ProducesResponseType(typeof(Services.ProfilingPerformanceMetrics), StatusCodes.Status200OK)]
        public async Task<IActionResult> CalculateMetrics([FromBody] MetricsRequest request)
        {
            try
            {
                var metrics = await _profilingService.CalculateMetricsAsync(request.FunctionProfiles);

                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating metrics");
                return StatusCode(500, new { error = "Failed to calculate metrics" });
            }
        }
    }

    // ==================== REQUEST MODELS ====================

    public class BottleneckRequest
    {
        public string Code { get; set; } = string.Empty;
        public Dictionary<int, double> LineTimings { get; set; } = new();
    }

    public class MetricsRequest
    {
        public List<ExecutionProfile> FunctionProfiles { get; set; } = new();
    }
}
