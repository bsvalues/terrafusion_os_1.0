using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Market Controller (BIV-035, TFT-068)
    /// Provides real-time market metrics, trend indicators, and market condition
    /// classification for assessment staff and automated valuation models.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class MarketController : ControllerBase
    {
        private readonly IMarketMetricsService _marketMetricsService;
        private readonly IMarketMonitor _marketMonitor;
        private readonly ILogger<MarketController> _logger;

        public MarketController(
            IMarketMetricsService marketMetricsService,
            IMarketMonitor marketMonitor,
            ILogger<MarketController> logger)
        {
            _marketMetricsService = marketMetricsService;
            _marketMonitor = marketMonitor;
            _logger = logger;
        }

        /// <summary>
        /// Retrieve current market metrics for the jurisdiction.
        /// Includes absorption rate, months of inventory, list-to-sale ratio, and turnover rate.
        /// </summary>
        /// <param name="propertyClass">Optional property class filter.</param>
        /// <returns>Current market metrics snapshot.</returns>
        [HttpGet("metrics")]
        [ProducesResponseType(typeof(MarketMetricsSnapshot), StatusCodes.Status200OK)]
        public async Task<ActionResult<MarketMetricsSnapshot>> GetMetrics([FromQuery] string? propertyClass = null)
        {
            try
            {
                _logger.LogInformation("Retrieving market metrics: PropertyClass={PropertyClass}", propertyClass ?? "All");

                var result = await _marketMetricsService.GetCurrentMetricsAsync(propertyClass);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve market metrics");
                return StatusCode(500, new { error = "Failed to retrieve market metrics." });
            }
        }

        /// <summary>
        /// Retrieve market trend indicators over a specified period.
        /// Returns directional indicators for sale prices, volume, and inventory.
        /// </summary>
        /// <param name="periodMonths">Lookback period in months (default 12).</param>
        /// <param name="propertyClass">Optional property class filter.</param>
        /// <returns>Market trend indicators with direction and magnitude.</returns>
        [HttpGet("trends")]
        [ProducesResponseType(typeof(MarketTrendIndicators), StatusCodes.Status200OK)]
        public async Task<ActionResult<MarketTrendIndicators>> GetTrends(
            [FromQuery] int periodMonths = 12,
            [FromQuery] string? propertyClass = null)
        {
            try
            {
                _logger.LogInformation(
                    "Retrieving market trends: Period={Period}, PropertyClass={PropertyClass}",
                    periodMonths, propertyClass ?? "All");

                var result = await _marketMetricsService.GetTrendIndicatorsAsync(periodMonths, propertyClass);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve market trends");
                return StatusCode(500, new { error = "Failed to retrieve market trend indicators." });
            }
        }

        /// <summary>
        /// Retrieve the current market condition classification.
        /// Classifies the market as Hot, Warm, Normal, Cool, or Cold based on
        /// absorption rate, price momentum, and inventory levels.
        /// </summary>
        /// <param name="neighborhoodCode">Optional neighborhood code for localized conditions.</param>
        /// <returns>Market condition classification with supporting evidence.</returns>
        [HttpGet("conditions")]
        [ProducesResponseType(typeof(MarketConditionAssessment), StatusCodes.Status200OK)]
        public async Task<ActionResult<MarketConditionAssessment>> GetConditions(
            [FromQuery] string? neighborhoodCode = null)
        {
            try
            {
                _logger.LogInformation(
                    "Assessing market conditions: Neighborhood={Neighborhood}",
                    neighborhoodCode ?? "Countywide");

                var result = await _marketMonitor.AssessMarketConditionsAsync(neighborhoodCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to assess market conditions");
                return StatusCode(500, new { error = "Failed to assess market conditions." });
            }
        }
    }

    // DTOs for market operations

    /// <summary>Snapshot of current market metrics for the jurisdiction.</summary>
    public class MarketMetricsSnapshot
    {
        /// <summary>Rate at which available properties are being sold per month.</summary>
        public decimal AbsorptionRate { get; set; }
        /// <summary>Months of available inventory at current sale pace.</summary>
        public decimal MonthsOfInventory { get; set; }
        /// <summary>Average ratio of final sale price to original list price.</summary>
        public decimal ListToSaleRatio { get; set; }
        /// <summary>Percentage of total parcels that sold in the period.</summary>
        public decimal TurnoverRate { get; set; }
        /// <summary>Median sale price for the period.</summary>
        public decimal MedianSalePrice { get; set; }
        /// <summary>Total number of arm's-length sales in the period.</summary>
        public int SalesCount { get; set; }
        public string PropertyClass { get; set; } = "All";
        public DateTime AsOfDate { get; set; }
    }

    /// <summary>Market trend indicators with direction and magnitude.</summary>
    public class MarketTrendIndicators
    {
        /// <summary>Price trend direction: Rising, Stable, Declining.</summary>
        public string PriceTrend { get; set; } = string.Empty;
        /// <summary>Annualized price change percentage.</summary>
        public decimal PriceChangePercent { get; set; }
        /// <summary>Volume trend direction: Increasing, Stable, Decreasing.</summary>
        public string VolumeTrend { get; set; } = string.Empty;
        /// <summary>Change in sales volume versus prior period.</summary>
        public decimal VolumeChangePercent { get; set; }
        /// <summary>Inventory trend direction.</summary>
        public string InventoryTrend { get; set; } = string.Empty;
        public int PeriodMonths { get; set; }
        public string PropertyClass { get; set; } = "All";
        public DateTime AsOfDate { get; set; }
    }

    /// <summary>Market condition classification with supporting evidence.</summary>
    public class MarketConditionAssessment
    {
        /// <summary>Overall market condition: Hot, Warm, Normal, Cool, Cold.</summary>
        public string Condition { get; set; } = string.Empty;
        /// <summary>Confidence level of the classification (0-1).</summary>
        public decimal Confidence { get; set; }
        /// <summary>Key factors supporting the classification.</summary>
        public List<string> SupportingFactors { get; set; } = new();
        /// <summary>Recommended time adjustment factor for appraisals.</summary>
        public decimal? RecommendedTimeAdjustment { get; set; }
        public string? NeighborhoodCode { get; set; }
        public DateTime AsOfDate { get; set; }
    }

    /// <summary>Service interface for market metrics retrieval.</summary>
    public interface IMarketMetricsService
    {
        Task<MarketMetricsSnapshot> GetCurrentMetricsAsync(string? propertyClass);
        Task<MarketTrendIndicators> GetTrendIndicatorsAsync(int periodMonths, string? propertyClass);
        Task<MarketTimeseriesResult> GetMarketTimeseriesAsync(string metric, int periodMonths, string? propertyClass);
        Task<PropertyTimeseriesResult?> GetPropertyTimeseriesAsync(string parcelId, int yearsBack);
    }

    /// <summary>Service interface for market condition monitoring and classification.</summary>
    public interface IMarketMonitor
    {
        Task<MarketConditionAssessment> AssessMarketConditionsAsync(string? neighborhoodCode);
    }
}
