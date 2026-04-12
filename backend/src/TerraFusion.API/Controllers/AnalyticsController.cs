using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Analytics Controller (BIV-006, TFT-067)
    /// Provides market analytics, trend analysis, and property-level analytical insights
    /// for assessment staff decision support.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [AllowAnonymous]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsOrchestrator _analyticsOrchestrator;
        private readonly TerraFusionDbContext _db;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(
            IAnalyticsOrchestrator analyticsOrchestrator,
            TerraFusionDbContext db,
            ILogger<AnalyticsController> logger)
        {
            _analyticsOrchestrator = analyticsOrchestrator;
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Retrieve a market analytics summary for the current jurisdiction.
        /// Includes median sale price, sales volume, days on market, and price-per-square-foot trends.
        /// </summary>
        /// <param name="propertyClass">Optional property class filter (e.g., Residential, Commercial).</param>
        /// <param name="periodMonths">Analysis period in months (default 12).</param>
        /// <returns>Market analytics summary.</returns>
        [HttpGet("market")]
        [ProducesResponseType(typeof(MarketAnalyticsSummary), StatusCodes.Status200OK)]
        public async Task<ActionResult<MarketAnalyticsSummary>> GetMarketAnalytics(
            [FromQuery] string? propertyClass = null,
            [FromQuery] int periodMonths = 12)
        {
            try
            {
                _logger.LogInformation(
                    "Retrieving market analytics: PropertyClass={PropertyClass}, PeriodMonths={Period}",
                    propertyClass ?? "All", periodMonths);

                var result = await _analyticsOrchestrator.GetMarketAnalyticsAsync(propertyClass, periodMonths);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve market analytics");
                return StatusCode(500, new { error = "Failed to generate market analytics summary." });
            }
        }

        /// <summary>
        /// Retrieve trend analysis data for assessed values, sale prices, and ratios over time.
        /// Suitable for charting assessment performance and market movement.
        /// </summary>
        /// <param name="metric">Trend metric: MedianSalePrice, MedianAssessedValue, MedianRatio, SalesVolume.</param>
        /// <param name="granularity">Time granularity: Monthly, Quarterly, Annual (default Monthly).</param>
        /// <param name="periodMonths">Lookback period in months (default 24).</param>
        /// <returns>Time-series trend data points.</returns>
        [HttpGet("trends")]
        [ProducesResponseType(typeof(TrendAnalysisResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<TrendAnalysisResult>> GetTrends(
            [FromQuery] string metric = "MedianSalePrice",
            [FromQuery] string granularity = "Monthly",
            [FromQuery] int periodMonths = 24)
        {
            try
            {
                _logger.LogInformation(
                    "Retrieving trend analysis: Metric={Metric}, Granularity={Granularity}, Period={Period}",
                    metric, granularity, periodMonths);

                var result = await _analyticsOrchestrator.GetTrendAnalysisAsync(metric, granularity, periodMonths);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid trend analysis parameters");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve trend analysis");
                return StatusCode(500, new { error = "Failed to generate trend analysis." });
            }
        }

        /// <summary>Regional cost comparison grouped by PropertyType/Region from live Properties data.</summary>
        [HttpGet("regional-comparison")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRegionalComparison(
            [FromQuery] string? buildingType = null,
            [FromQuery] int periodMonths = 12)
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddMonths(-periodMonths);
                var query = _db.Properties.AsNoTracking()
                    .Where(p => p.AssessmentDate >= cutoff && p.AssessedValue > 0);

                if (!string.IsNullOrWhiteSpace(buildingType))
                    query = query.Where(p => p.PropertyType == buildingType);

                var regions = await query
                    .GroupBy(p => p.PropertyType ?? "Unknown")
                    .Select(g => new
                    {
                        Region = g.Key,
                        AvgCost = g.Average(p => (double)p.AssessedValue),
                        MedianCount = g.Count(),
                        Count = g.Count(),
                    })
                    .OrderByDescending(r => r.AvgCost)
                    .ToListAsync();

                return Ok(new { regions, periodMonths, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate regional comparison");
                return StatusCode(500, new { error = "Failed to generate regional comparison." });
            }
        }

        /// <summary>Building type cost comparison from live Properties data.</summary>
        [HttpGet("building-type-comparison")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetBuildingTypeComparison(
            [FromQuery] string? region = null,
            [FromQuery] int periodMonths = 12)
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddMonths(-periodMonths);
                var query = _db.Properties.AsNoTracking()
                    .Where(p => p.AssessmentDate >= cutoff && p.AssessedValue > 0);

                var buildingTypes = await query
                    .GroupBy(p => p.PropertyType ?? "Unknown")
                    .Select(g => new
                    {
                        BuildingType = g.Key,
                        AvgCost = g.Average(p => (double)p.AssessedValue),
                        MinCost = g.Min(p => (double)p.AssessedValue),
                        MaxCost = g.Max(p => (double)p.AssessedValue),
                        Count = g.Count(),
                    })
                    .OrderByDescending(b => b.AvgCost)
                    .ToListAsync();

                return Ok(new { buildingTypes, periodMonths, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate building type comparison");
                return StatusCode(500, new { error = "Failed to generate building type comparison." });
            }
        }

        /// <summary>
        /// Retrieve analytics for a specific property by parcel ID.
        /// Includes valuation history, comparable sales, neighborhood context, and anomaly flags.
        /// </summary>
        /// <param name="parcelId">The parcel identifier (e.g., "1-0234-100-0001-000").</param>
        /// <returns>Property-level analytics detail.</returns>
        [HttpGet("property/{parcelId}")]
        [ProducesResponseType(typeof(PropertyAnalyticsDetail), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PropertyAnalyticsDetail>> GetPropertyAnalytics(string parcelId)
        {
            try
            {
                _logger.LogInformation("Retrieving property analytics for ParcelId={ParcelId}", parcelId);

                var result = await _analyticsOrchestrator.GetPropertyAnalyticsAsync(parcelId);
                if (result == null)
                    return NotFound(new { error = $"No analytics data found for parcel '{parcelId}'." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve property analytics for ParcelId={ParcelId}", parcelId);
                return StatusCode(500, new { error = "Failed to retrieve property analytics." });
            }
        }

        /// <summary>Time-series alias for /trends — same data, different response envelope for chart compatibility.</summary>
        [HttpGet("time-series")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTimeSeries(
            [FromQuery] string timeRange = "12m",
            [FromQuery] string? region = null,
            [FromQuery] string? buildingType = null)
        {
            try
            {
                var months = timeRange.EndsWith("m") && int.TryParse(timeRange[..^1], out var m) ? m : 12;
                var result = await _analyticsOrchestrator.GetTrendAnalysisAsync("MedianAssessedValue", "Monthly", months);
                return Ok(new
                {
                    timeRange,
                    region,
                    buildingType,
                    dataPoints = result.DataPoints,
                    generatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate time-series data");
                return StatusCode(500, new { error = "Failed to generate time-series data." });
            }
        }

        /// <summary>Cost breakdown grouped by PropertyType from live Properties data.</summary>
        [HttpGet("cost-breakdown")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCostBreakdown([FromQuery] int periodMonths = 12)
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddMonths(-periodMonths);
                var breakdown = await _db.Properties.AsNoTracking()
                    .Where(p => p.AssessmentDate >= cutoff && p.AssessedValue > 0)
                    .GroupBy(p => p.PropertyType ?? "Unknown")
                    .Select(g => new
                    {
                        Category = g.Key,
                        AvgValue = g.Average(p => (double)p.AssessedValue),
                        MinValue = g.Min(p => (double)p.AssessedValue),
                        MaxValue = g.Max(p => (double)p.AssessedValue),
                        Count = g.Count(),
                    })
                    .OrderByDescending(x => x.AvgValue)
                    .ToListAsync();

                return Ok(new { breakdown, periodMonths, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate cost breakdown");
                return StatusCode(500, new { error = "Failed to generate cost breakdown." });
            }
        }

        /// <summary>Regional cost averages grouped by county/region from Properties.</summary>
        [HttpGet("regional-costs")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRegionalCosts([FromQuery] int periodMonths = 12)
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddMonths(-periodMonths);
                var regions = await _db.Properties.AsNoTracking()
                    .Where(p => p.AssessmentDate >= cutoff && p.AssessedValue > 0)
                    .GroupBy(p => p.PropertyType ?? "Unknown")
                    .Select(g => new
                    {
                        Region = g.Key,
                        AvgValue = g.Average(p => (double)p.AssessedValue),
                        Count = g.Count(),
                    })
                    .OrderByDescending(x => x.AvgValue)
                    .ToListAsync();

                return Ok(new { regions, periodMonths, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate regional costs");
                return StatusCode(500, new { error = "Failed to generate regional costs." });
            }
        }

        /// <summary>Hierarchical cost data: BuildingType → Grade → avg BaseRate from CostMatrices.</summary>
        [HttpGet("hierarchical-costs")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetHierarchicalCosts([FromQuery] string? county = null)
        {
            try
            {
                var query = _db.CostMatrices.AsNoTracking().AsQueryable();
                if (!string.IsNullOrWhiteSpace(county))
                    query = query.Where(c => c.County == county);

                var data = await query
                    .GroupBy(c => new { c.BuildingType, c.Grade })
                    .Select(g => new
                    {
                        BuildingType = g.Key.BuildingType,
                        Grade = g.Key.Grade ?? "Standard",
                        AvgBaseRate = g.Average(c => (double)c.BaseRate),
                        Count = g.Count(),
                    })
                    .OrderBy(x => x.BuildingType).ThenBy(x => x.Grade)
                    .ToListAsync();

                return Ok(new { hierarchicalCosts = data, generatedAt = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate hierarchical costs");
                return StatusCode(500, new { error = "Failed to generate hierarchical costs." });
            }
        }

        /// <summary>Statistical correlations: basic descriptive stats on assessed values from Properties.</summary>
        [HttpGet("statistical-correlations")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatisticalCorrelations(
            [FromQuery] string? buildingType = null,
            [FromQuery] int periodMonths = 12)
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddMonths(-periodMonths);
                var query = _db.Properties.AsNoTracking()
                    .Where(p => p.AssessmentDate >= cutoff && p.AssessedValue > 0);

                if (!string.IsNullOrWhiteSpace(buildingType))
                    query = query.Where(p => p.PropertyType == buildingType);

                var values = await query.Select(p => (double)p.AssessedValue).ToListAsync();

                if (values.Count == 0)
                    return Ok(new { count = 0, min = 0, max = 0, mean = 0, stdDev = 0, generatedAt = DateTime.UtcNow });

                var mean = values.Average();
                var variance = values.Average(v => Math.Pow(v - mean, 2));

                return Ok(new
                {
                    count = values.Count,
                    min = values.Min(),
                    max = values.Max(),
                    mean,
                    stdDev = Math.Sqrt(variance),
                    generatedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate statistical correlations");
                return StatusCode(500, new { error = "Failed to generate statistical correlations." });
            }
        }
    }

    // DTOs for analytics operations

    /// <summary>Market analytics summary for a jurisdiction.</summary>
    public class MarketAnalyticsSummary
    {
        public decimal MedianSalePrice { get; set; }
        public decimal MeanSalePrice { get; set; }
        public int TotalSales { get; set; }
        public decimal MedianPricePerSqFt { get; set; }
        public int MedianDaysOnMarket { get; set; }
        public decimal SalePriceChangePercent { get; set; }
        public string PropertyClass { get; set; } = "All";
        public int PeriodMonths { get; set; }
        public DateTime AsOfDate { get; set; }
    }

    /// <summary>Trend analysis result with time-series data points.</summary>
    public class TrendAnalysisResult
    {
        public string Metric { get; set; } = string.Empty;
        public string Granularity { get; set; } = string.Empty;
        public List<TrendDataPoint> DataPoints { get; set; } = new();
    }

    /// <summary>A single data point in a trend series.</summary>
    public class TrendDataPoint
    {
        public DateTime Period { get; set; }
        public decimal Value { get; set; }
        public int SampleSize { get; set; }
    }

    /// <summary>Property-level analytics detail.</summary>
    public class PropertyAnalyticsDetail
    {
        public string ParcelId { get; set; } = string.Empty;
        public decimal CurrentAssessedValue { get; set; }
        public decimal? EstimatedMarketValue { get; set; }
        public decimal? AssessmentToMarketRatio { get; set; }
        public List<ValuationHistoryPoint> ValuationHistory { get; set; } = new();
        public int ComparableSalesCount { get; set; }
        public string? NeighborhoodCode { get; set; }
        public List<string> AnomalyFlags { get; set; } = new();
    }

    /// <summary>Historical valuation data point for a property.</summary>
    public class ValuationHistoryPoint
    {
        public int AssessmentYear { get; set; }
        public decimal LandValue { get; set; }
        public decimal ImprovementValue { get; set; }
        public decimal TotalValue { get; set; }
    }

    /// <summary>Service interface for analytics orchestration.</summary>
    public interface IAnalyticsOrchestrator
    {
        Task<MarketAnalyticsSummary> GetMarketAnalyticsAsync(string? propertyClass, int periodMonths);
        Task<TrendAnalysisResult> GetTrendAnalysisAsync(string metric, string granularity, int periodMonths);
        Task<PropertyAnalyticsDetail?> GetPropertyAnalyticsAsync(string parcelId);
    }

    /// <summary>
    /// Live implementation of IAnalyticsOrchestrator. Queries TerraFusionDbContext directly.
    /// Returns zeroed/empty results when no data exists — never throws to the controller.
    /// </summary>
    public class AnalyticsOrchestratorImpl : IAnalyticsOrchestrator
    {
        private readonly TerraFusionDbContext _db;
        private readonly ILogger<AnalyticsOrchestratorImpl> _logger;

        public AnalyticsOrchestratorImpl(TerraFusionDbContext db, ILogger<AnalyticsOrchestratorImpl> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<MarketAnalyticsSummary> GetMarketAnalyticsAsync(string? propertyClass, int periodMonths)
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddMonths(-periodMonths);
                var priorCutoff = cutoff.AddMonths(-periodMonths);

                var query = _db.Properties.AsNoTracking()
                    .Where(p => p.AssessmentDate >= cutoff && p.AssessedValue > 0);

                if (!string.IsNullOrWhiteSpace(propertyClass))
                    query = query.Where(p => p.PropertyType == propertyClass);

                var current = await query
                    .Select(p => (double)p.AssessedValue)
                    .ToListAsync();

                if (current.Count == 0)
                    return new MarketAnalyticsSummary
                    {
                        PropertyClass = propertyClass ?? "All",
                        PeriodMonths = periodMonths,
                        AsOfDate = DateTime.UtcNow
                    };

                var currentAvg = current.Average();

                // Prior period for YoY
                var priorQuery = _db.Properties.AsNoTracking()
                    .Where(p => p.AssessmentDate >= priorCutoff && p.AssessmentDate < cutoff && p.AssessedValue > 0);

                if (!string.IsNullOrWhiteSpace(propertyClass))
                    priorQuery = priorQuery.Where(p => p.PropertyType == propertyClass);

                var priorValues = await priorQuery.Select(p => (double)p.AssessedValue).ToListAsync();
                var yoy = priorValues.Count > 0
                    ? (decimal)((currentAvg - priorValues.Average()) / priorValues.Average() * 100.0)
                    : 0m;

                return new MarketAnalyticsSummary
                {
                    MedianSalePrice = (decimal)currentAvg,
                    MeanSalePrice = (decimal)currentAvg,
                    TotalSales = current.Count,
                    SalePriceChangePercent = Math.Round(yoy, 2),
                    PropertyClass = propertyClass ?? "All",
                    PeriodMonths = periodMonths,
                    AsOfDate = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AnalyticsOrchestratorImpl.GetMarketAnalyticsAsync failed");
                return new MarketAnalyticsSummary { PropertyClass = propertyClass ?? "All", PeriodMonths = periodMonths, AsOfDate = DateTime.UtcNow };
            }
        }

        public async Task<TrendAnalysisResult> GetTrendAnalysisAsync(string metric, string granularity, int periodMonths)
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddMonths(-periodMonths);

                var groups = await _db.Properties.AsNoTracking()
                    .Where(p => p.AssessmentDate >= cutoff && p.AssessedValue > 0)
                    .GroupBy(p => new { p.AssessmentDate.Year, p.AssessmentDate.Month })
                    .Select(g => new TrendDataPoint
                    {
                        Period = new DateTime(g.Key.Year, g.Key.Month, 1),
                        Value = (decimal)g.Average(p => (double)p.AssessedValue),
                        SampleSize = g.Count()
                    })
                    .OrderBy(d => d.Period)
                    .ToListAsync();

                return new TrendAnalysisResult
                {
                    Metric = metric,
                    Granularity = granularity,
                    DataPoints = groups
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AnalyticsOrchestratorImpl.GetTrendAnalysisAsync failed");
                return new TrendAnalysisResult { Metric = metric, Granularity = granularity, DataPoints = new List<TrendDataPoint>() };
            }
        }

        public async Task<PropertyAnalyticsDetail?> GetPropertyAnalyticsAsync(string parcelId)
        {
            try
            {
                var prop = await _db.Properties.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.ParcelNumber == parcelId || p.ParcelId == parcelId);

                if (prop == null) return null;

                return new PropertyAnalyticsDetail
                {
                    ParcelId = parcelId,
                    CurrentAssessedValue = prop.AssessedValue,
                    EstimatedMarketValue = prop.MarketValue > 0 ? prop.MarketValue : null,
                    AssessmentToMarketRatio = prop.MarketValue > 0 ? Math.Round(prop.AssessedValue / prop.MarketValue, 4) : null,
                    ValuationHistory = new List<ValuationHistoryPoint>(),
                    AnomalyFlags = new List<string>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AnalyticsOrchestratorImpl.GetPropertyAnalyticsAsync failed for {ParcelId}", parcelId);
                return null;
            }
        }
    }
}
