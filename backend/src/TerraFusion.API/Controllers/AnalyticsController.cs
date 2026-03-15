using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

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
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsOrchestrator _analyticsOrchestrator;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(
            IAnalyticsOrchestrator analyticsOrchestrator,
            ILogger<AnalyticsController> logger)
        {
            _analyticsOrchestrator = analyticsOrchestrator;
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
}
