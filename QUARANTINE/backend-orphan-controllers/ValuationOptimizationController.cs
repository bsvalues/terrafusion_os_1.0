using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.API.Services;
using TerraFusion.API.Models;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "RequireGovernmentAccess")]
    public class ValuationOptimizationController : ControllerBase
    {
        private readonly IValuationOptimizationService _valuationService;
        private readonly ILogger<ValuationOptimizationController> _logger;

        public ValuationOptimizationController(
            IValuationOptimizationService valuationService,
            ILogger<ValuationOptimizationController> logger)
        {
            _valuationService = valuationService;
            _logger = logger;
        }

        /// <summary>
        /// Get optimized property valuation with multi-layer caching
        /// Target: <50ms response time with 85%+ cache hit ratio
        /// </summary>
        [HttpGet("{propertyId}")]
        public async Task<ActionResult<PropertyValuationResult>> GetOptimizedValuation(string propertyId)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            try
            {
                var result = await _valuationService.GetOptimizedValuationAsync(propertyId);
                result.ProcessingTimeMs = stopwatch.ElapsedMilliseconds;
                
                _logger.LogInformation("Valuation completed for {PropertyId} in {ElapsedMs}ms", 
                    propertyId, stopwatch.ElapsedMilliseconds);
                
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Property not found: {PropertyId}", propertyId);
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing valuation for {PropertyId}", propertyId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get cache performance statistics
        /// </summary>
        [HttpGet("cache/statistics")]
        public async Task<ActionResult<CacheStatistics>> GetCacheStatistics()
        {
            try
            {
                var stats = await _valuationService.GetCacheStatisticsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cache statistics");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Invalidate cache for specific property
        /// </summary>
        [HttpDelete("{propertyId}/cache")]
        [Authorize(Policy = "RequireAdminAccess")]
        public async Task<ActionResult> InvalidateCache(string propertyId)
        {
            try
            {
                await _valuationService.InvalidateCacheAsync(propertyId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating cache for {PropertyId}", propertyId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
