using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Benchmarking Controller — Benton County cost matrix statistical analysis.
    /// All data served from the in-memory BentonCostData.CostMatrix — no DB queries.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [AllowAnonymous]
    public class BenchmarkingController : ControllerBase
    {
        private readonly ILogger<BenchmarkingController> _logger;

        public BenchmarkingController(ILogger<BenchmarkingController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// GET /api/benchmarking/counties
        /// Returns counties served by TerraFusion (Benton County only for v1.0).
        /// </summary>
        [HttpGet("counties")]
        public IActionResult GetCounties()
        {
            return Ok(new { counties = new[] { "Benton County" } });
        }

        /// <summary>
        /// GET /api/benchmarking/statistical-data?county=Benton
        /// Statistical summary (min, max, mean) of base cost rates by building type.
        /// Uses in-memory BentonCostData.CostMatrix — no database required.
        /// </summary>
        [HttpGet("statistical-data")]
        public IActionResult GetStatisticalData([FromQuery] string county = "Benton")
        {
            var statistics = CostForgeController.BentonCostData.CostMatrix
                .GroupBy(e => new { e.BuildingType, e.BuildingTypeLabel })
                .Select(g => new
                {
                    BuildingType = g.Key.BuildingType,
                    BuildingTypeLabel = g.Key.BuildingTypeLabel,
                    Count = g.Count(),
                    MinRate = (double)g.Min(e => e.BaseCostPerSqft),
                    MaxRate = (double)g.Max(e => e.BaseCostPerSqft),
                    MeanRate = (double)g.Average(e => e.BaseCostPerSqft),
                })
                .OrderBy(g => g.BuildingType)
                .ToList();

            return Ok(new { county, statistics, generatedAt = DateTime.UtcNow });
        }

        /// <summary>
        /// GET /api/benchmarking/regional-costs?county=Benton
        /// Average base cost per sqft by region from the Benton cost matrix.
        /// </summary>
        [HttpGet("regional-costs")]
        public IActionResult GetRegionalCosts([FromQuery] string county = "Benton")
        {
            var regionalCosts = CostForgeController.BentonCostData.CostMatrix
                .GroupBy(e => e.Region)
                .Select(g => new
                {
                    Region = g.Key,
                    Count = g.Count(),
                    AvgRate = (double)g.Average(e => e.BaseCostPerSqft),
                    MinRate = (double)g.Min(e => e.BaseCostPerSqft),
                    MaxRate = (double)g.Max(e => e.BaseCostPerSqft),
                })
                .OrderBy(g => g.Region)
                .ToList();

            return Ok(new { county, regionalCosts, generatedAt = DateTime.UtcNow });
        }

        /// <summary>
        /// GET /api/benchmarking/hierarchical-costs?county=Benton
        /// Hierarchical cost breakdown: BuildingType → Region → BaseCostPerSqft.
        /// </summary>
        [HttpGet("hierarchical-costs")]
        public IActionResult GetHierarchicalCosts([FromQuery] string county = "Benton")
        {
            var hierarchical = CostForgeController.BentonCostData.CostMatrix
                .GroupBy(e => new { e.BuildingType, e.BuildingTypeLabel })
                .Select(typeGroup => new
                {
                    BuildingType = typeGroup.Key.BuildingType,
                    BuildingTypeLabel = typeGroup.Key.BuildingTypeLabel,
                    Regions = typeGroup
                        .OrderBy(e => e.Region)
                        .Select(e => new
                        {
                            e.Region,
                            BaseCostPerSqft = (double)e.BaseCostPerSqft,
                        })
                        .ToList(),
                    AvgRate = (double)typeGroup.Average(e => e.BaseCostPerSqft),
                    MinRate = (double)typeGroup.Min(e => e.BaseCostPerSqft),
                    MaxRate = (double)typeGroup.Max(e => e.BaseCostPerSqft),
                })
                .OrderBy(t => t.BuildingType)
                .ToList();

            return Ok(new { county, hierarchical, generatedAt = DateTime.UtcNow });
        }
    }
}
