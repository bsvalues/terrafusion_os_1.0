/*
 * PerformanceController - REST API for Performance Optimization
 *
 * Provides endpoints for performance status, cache statistics, optimization recommendations,
 * query performance, resource utilization, and cache invalidation.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 3 Day 2
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/performance")]
    [Produces("application/json")]
    public class PerformanceController : ControllerBase
    {
        private readonly IPerformanceOptimizationService _performanceService;
        private readonly ILogger<PerformanceController> _logger;

        public PerformanceController(
            IPerformanceOptimizationService performanceService,
            ILogger<PerformanceController> logger)
        {
            _performanceService = performanceService;
            _logger = logger;
        }

        /// <summary>
        /// Get performance status
        /// </summary>
        /// <returns>Complete performance status with cache, query, and resource metrics</returns>
        [HttpGet("status")]
        [ProducesResponseType(typeof(PerformanceStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                var status = await _performanceService.GetPerformanceStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting performance status");
                return StatusCode(500, new { error = "Failed to get performance status" });
            }
        }

        /// <summary>
        /// Get cache statistics
        /// </summary>
        /// <returns>Detailed cache statistics with tier distribution and hot keys</returns>
        [HttpGet("cache/statistics")]
        [ProducesResponseType(typeof(CacheStatistics), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCacheStatistics()
        {
            try
            {
                var stats = await _performanceService.GetCacheStatisticsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cache statistics");
                return StatusCode(500, new { error = "Failed to get cache statistics" });
            }
        }

        /// <summary>
        /// Get optimization recommendations
        /// </summary>
        /// <returns>List of prioritized optimization recommendations</returns>
        [HttpGet("recommendations")]
        [ProducesResponseType(typeof(List<PerfOptimizationRecommendation>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRecommendations()
        {
            try
            {
                var recommendations = await _performanceService.GetOptimizationRecommendationsAsync();
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting optimization recommendations");
                return StatusCode(500, new { error = "Failed to get optimization recommendations" });
            }
        }

        /// <summary>
        /// Get query performance report
        /// </summary>
        /// <returns>Query performance analysis with execution metrics</returns>
        [HttpGet("queries")]
        [ProducesResponseType(typeof(QueryPerformanceReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetQueryPerformance()
        {
            try
            {
                var report = await _performanceService.GetQueryPerformanceAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting query performance");
                return StatusCode(500, new { error = "Failed to get query performance" });
            }
        }

        /// <summary>
        /// Get resource utilization report
        /// </summary>
        /// <returns>Resource utilization metrics for memory, CPU, disk, and network</returns>
        [HttpGet("resources")]
        [ProducesResponseType(typeof(ResourceUtilizationReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetResourceUtilization()
        {
            try
            {
                var report = await _performanceService.GetResourceUtilizationAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting resource utilization");
                return StatusCode(500, new { error = "Failed to get resource utilization" });
            }
        }

        /// <summary>
        /// Optimize resources
        /// </summary>
        /// <param name="config">Optimization configuration with strategy</param>
        /// <returns>Optimization result with changes and metrics</returns>
        [HttpPost("optimize")]
        [ProducesResponseType(typeof(PerfOptimizationResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> OptimizeResources([FromBody] PerfOptimizationConfig config)
        {
            try
            {
                _logger.LogInformation("Running resource optimization: {Strategy}", config.Strategy);
                var result = await _performanceService.OptimizeResourcesAsync(config);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing resources");
                return StatusCode(500, new { error = "Failed to optimize resources" });
            }
        }

        /// <summary>
        /// Invalidate cache
        /// </summary>
        /// <param name="request">Cache invalidation request with strategy and keys</param>
        /// <returns>Invalidation result with entries affected</returns>
        [HttpPost("cache/invalidate")]
        [ProducesResponseType(typeof(CacheInvalidationResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> InvalidateCache([FromBody] CacheInvalidationRequest request)
        {
            try
            {
                _logger.LogInformation("Invalidating cache: {Strategy}", request.Strategy);
                var result = await _performanceService.InvalidateCacheAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating cache");
                return StatusCode(500, new { error = "Failed to invalidate cache" });
            }
        }
    }
}
