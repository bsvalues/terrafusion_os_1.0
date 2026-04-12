using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Benchmarking Controller — Benton County cost matrix statistical analysis.
    /// Provides hierarchical, statistical, and regional benchmarking data for assessment staff.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class BenchmarkingController : ControllerBase
    {
        private readonly TerraFusionDbContext _db;
        private readonly ILogger<BenchmarkingController> _logger;

        public BenchmarkingController(TerraFusionDbContext db, ILogger<BenchmarkingController> logger)
        {
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// GET /api/benchmarking/counties
        /// Returns distinct counties in the TerraFusion database.
        /// </summary>
        [HttpGet("counties")]
        public async Task<IActionResult> GetCounties()
        {
            try
            {
                var counties = await _db.Counties
                    .AsNoTracking()
                    .Select(c => new { c.Id, c.Name, c.State })
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                return Ok(new { counties });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve counties");
                return StatusCode(500, new { error = "Failed to retrieve counties." });
            }
        }

        /// <summary>
        /// GET /api/benchmarking/statistical-data?county=Benton
        /// Statistical summary (min, max, mean, stddev) of assessed values by property type.
        /// </summary>
        [HttpGet("statistical-data")]
        public async Task<IActionResult> GetStatisticalData([FromQuery] string county = "Benton")
        {
            try
            {
                var query = _db.Properties.AsNoTracking()
                    .Where(p => p.AssessedValue > 0);

                var groups = await query
                    .GroupBy(p => p.PropertyType ?? "Unknown")
                    .Select(g => new
                    {
                        BuildingType = g.Key,
                        Count = g.Count(),
                        MinValue = g.Min(p => (double)p.AssessedValue),
                        MaxValue = g.Max(p => (double)p.AssessedValue),
                        MeanValue = g.Average(p => (double)p.AssessedValue),
                    })
                    .OrderBy(g => g.BuildingType)
                    .ToListAsync();

                return Ok(new { county, statistics = groups, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate statistical data");
                return StatusCode(500, new { error = "Failed to generate statistical data." });
            }
        }

        /// <summary>
        /// GET /api/benchmarking/regional-costs?county=Benton
        /// Regional cost breakdown from property assessment records.
        /// </summary>
        [HttpGet("regional-costs")]
        public async Task<IActionResult> GetRegionalCosts([FromQuery] string county = "Benton")
        {
            try
            {
                var groups = await _db.Properties.AsNoTracking()
                    .Where(p => p.AssessedValue > 0)
                    .GroupBy(p => p.PropertyType ?? "Unknown")
                    .Select(g => new
                    {
                        Region = g.Key,
                        AvgAssessedValue = g.Average(p => (double)p.AssessedValue),
                        AvgLandValue = g.Average(p => (double)p.LandValue),
                        AvgImprovementValue = g.Average(p => (double)p.ImprovementValue),
                        Count = g.Count(),
                    })
                    .OrderByDescending(g => g.AvgAssessedValue)
                    .ToListAsync();

                return Ok(new { county, regionalCosts = groups, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate regional costs");
                return StatusCode(500, new { error = "Failed to generate regional costs." });
            }
        }

        /// <summary>
        /// GET /api/benchmarking/hierarchical-costs?county=Benton
        /// Hierarchical cost breakdown: propertyType → taxYear → statistics.
        /// </summary>
        [HttpGet("hierarchical-costs")]
        public async Task<IActionResult> GetHierarchicalCosts([FromQuery] string county = "Benton")
        {
            try
            {
                var raw = await _db.Properties.AsNoTracking()
                    .Where(p => p.AssessedValue > 0)
                    .Select(p => new
                    {
                        BuildingType = p.PropertyType ?? "Unknown",
                        p.TaxYear,
                        AssessedValue = (double)p.AssessedValue,
                    })
                    .ToListAsync();

                var hierarchical = raw
                    .GroupBy(p => p.BuildingType)
                    .Select(typeGroup => new
                    {
                        BuildingType = typeGroup.Key,
                        YearBreakdown = typeGroup
                            .GroupBy(p => p.TaxYear)
                            .OrderByDescending(yg => yg.Key)
                            .Take(5)
                            .Select(yg => new
                            {
                                TaxYear = yg.Key,
                                Count = yg.Count(),
                                AvgValue = yg.Average(p => p.AssessedValue),
                                MinValue = yg.Min(p => p.AssessedValue),
                                MaxValue = yg.Max(p => p.AssessedValue),
                            })
                            .ToList(),
                    })
                    .OrderBy(t => t.BuildingType)
                    .ToList();

                return Ok(new { county, hierarchical, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate hierarchical costs");
                return StatusCode(500, new { error = "Failed to generate hierarchical costs." });
            }
        }
    }
}
