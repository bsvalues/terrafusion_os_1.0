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
        /// GET /api/benchmarking/statistical-data?county=Benton[&amp;buildingType=R1][&amp;revalArea=Reval+1]
        /// Statistical summary (min, max, mean) of base cost rates by building type.
        /// Optional: filter by buildingType code and/or revalArea (PACS Cycle).
        /// Uses in-memory BentonCostData.CostMatrix — no database required.
        /// </summary>
        [HttpGet("statistical-data")]
        public IActionResult GetStatisticalData(
            [FromQuery] string county = "Benton",
            [FromQuery] string? buildingType = null,
            [FromQuery] string? revalArea = null)
        {
            var entries = CostForgeController.BentonCostData.CostMatrix.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(buildingType))
                entries = entries.Where(e => e.BuildingType.Equals(buildingType, StringComparison.OrdinalIgnoreCase)
                                          || e.BuildingTypeLabel.Contains(buildingType, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(revalArea))
                entries = entries.Where(e => e.Region.Equals(revalArea, StringComparison.OrdinalIgnoreCase));

            var statistics = entries
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
        /// GET /api/benchmarking/regional-costs?county=Benton[&amp;buildingType=R1]
        /// Average base cost per sqft by Reval Area (PACS Cycle field) from the Benton cost matrix.
        /// Optional: filter by buildingType to see how that type's cost varies across Reval Areas.
        /// </summary>
        [HttpGet("regional-costs")]
        public IActionResult GetRegionalCosts(
            [FromQuery] string county = "Benton",
            [FromQuery] string? buildingType = null)
        {
            var entries = CostForgeController.BentonCostData.CostMatrix.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(buildingType))
                entries = entries.Where(e => e.BuildingType.Equals(buildingType, StringComparison.OrdinalIgnoreCase)
                                          || e.BuildingTypeLabel.Contains(buildingType, StringComparison.OrdinalIgnoreCase));

            var regionalCosts = entries
                .GroupBy(e => e.Region)
                .Select(g => new
                {
                    RevalArea = g.Key,
                    Count = g.Count(),
                    AvgRate = (double)g.Average(e => e.BaseCostPerSqft),
                    MinRate = (double)g.Min(e => e.BaseCostPerSqft),
                    MaxRate = (double)g.Max(e => e.BaseCostPerSqft),
                })
                .OrderBy(g => g.RevalArea)
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

        /// <summary>
        /// GET /api/benchmarking/ratio-study — query params: buildingType, revalArea.
        /// Returns simulated ratio study data (PRD/PRB/COD) per type×area.
        /// </summary>
        [HttpGet("ratio-study")]
        public IActionResult GetRatioStudy(
            [FromQuery] string? buildingType = null,
            [FromQuery] string? revalArea = null)
        {
            var entries = CostForgeController.BentonCostData.CostMatrix.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(buildingType))
                entries = entries.Where(e => e.BuildingType.Equals(buildingType, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(revalArea))
                entries = entries.Where(e => e.Region.Equals(revalArea, StringComparison.OrdinalIgnoreCase));

            var areaOffsets = new Dictionary<string, double>
            {
                ["Reval 1"] = -0.04, ["Reval 2"] = 0.01, ["Reval 3"] = -0.08,
                ["Reval 4"] = 0.02,  ["Reval 5"] = 0.00, ["Reval 6"] = 0.03,
            };

            var results = entries
                .GroupBy(e => new { e.BuildingType, e.BuildingTypeLabel, e.Region })
                .Select(g =>
                {
                    double drift = areaOffsets.TryGetValue(g.Key.Region, out var d) ? d : 0;
                    var rng = new Random(g.Key.BuildingType.GetHashCode() ^ g.Key.Region.GetHashCode());
                    var ratios = Enumerable.Range(0, 30)
                        .Select(_ => 1.0 + drift + (rng.NextDouble() * 0.12 - 0.06))
                        .ToList();
                    double mean = ratios.Average();
                    double avgRate = (double)g.Average(e => e.BaseCostPerSqft);
                    var values = Enumerable.Range(0, 30).Select(i => avgRate * (0.8 + i * 0.02)).ToList();
                    double totalVal = values.Sum();
                    double weightedMean = totalVal > 0
                        ? ratios.Zip(values, (r, v) => r * v).Sum() / totalVal : 1.0;
                    double prd = weightedMean > 0 ? mean / weightedMean : 1.0;
                    var sorted = ratios.OrderBy(x => x).ToList();
                    double median = sorted.Count % 2 == 1
                        ? sorted[sorted.Count / 2]
                        : (sorted[sorted.Count / 2 - 1] + sorted[sorted.Count / 2]) / 2.0;
                    double mad = ratios.Average(r => Math.Abs(r - median));
                    double cod = median > 0 ? (mad / median) * 100 : 0;
                    return new
                    {
                        BuildingType = g.Key.BuildingType,
                        BuildingTypeLabel = g.Key.BuildingTypeLabel,
                        RevalArea = g.Key.Region,
                        SaleCount = 30,
                        MeanRatio = Math.Round(mean, 4),
                        MedianRatio = Math.Round(median, 4),
                        Prd = Math.Round(prd, 4),
                        Cod = Math.Round(cod, 2),
                    };
                })
                .OrderBy(r => r.RevalArea).ThenBy(r => r.BuildingType)
                .ToList();

            return Ok(new { results, generatedAt = DateTime.UtcNow });
        }
    }
}
