using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Timeseries Controller (BIV-038)
    /// Provides historical value timeseries data for individual properties
    /// and market-wide aggregates to support trend analysis and forecasting.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class TimeseriesController : ControllerBase
    {
        private readonly IMarketMetricsService _marketMetricsService;
        private readonly ILogger<TimeseriesController> _logger;

        public TimeseriesController(
            IMarketMetricsService marketMetricsService,
            ILogger<TimeseriesController> logger)
        {
            _marketMetricsService = marketMetricsService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieve assessed and market value history for a specific property.
        /// Returns annual assessed values (land, improvement, total) and any recorded sales.
        /// </summary>
        /// <param name="parcelId">The parcel identifier.</param>
        /// <param name="yearsBack">Number of years of history to return (default 10).</param>
        /// <returns>Property value timeseries with assessment and sale history.</returns>
        [HttpGet("property/{parcelId}")]
        [ProducesResponseType(typeof(PropertyTimeseriesResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PropertyTimeseriesResult>> GetPropertyTimeseries(
            string parcelId,
            [FromQuery] int yearsBack = 10)
        {
            try
            {
                _logger.LogInformation(
                    "Retrieving property timeseries: ParcelId={ParcelId}, YearsBack={Years}",
                    parcelId, yearsBack);

                var result = await _marketMetricsService.GetPropertyTimeseriesAsync(parcelId, yearsBack);
                if (result == null)
                    return NotFound(new { error = $"No timeseries data found for parcel '{parcelId}'." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve timeseries for ParcelId={ParcelId}", parcelId);
                return StatusCode(500, new { error = "Failed to retrieve property timeseries data." });
            }
        }

        /// <summary>
        /// Retrieve market-wide timeseries data for aggregate metrics.
        /// Supports median sale price, total assessed value, sales volume, and ratio trends.
        /// </summary>
        /// <param name="metric">Metric to chart: MedianSalePrice, TotalAssessedValue, SalesVolume, MedianRatio.</param>
        /// <param name="periodMonths">Lookback period in months (default 36).</param>
        /// <param name="propertyClass">Optional property class filter.</param>
        /// <returns>Market-level timeseries data points.</returns>
        [HttpGet("market")]
        [ProducesResponseType(typeof(MarketTimeseriesResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<MarketTimeseriesResult>> GetMarketTimeseries(
            [FromQuery] string metric = "MedianSalePrice",
            [FromQuery] int periodMonths = 36,
            [FromQuery] string? propertyClass = null)
        {
            try
            {
                _logger.LogInformation(
                    "Retrieving market timeseries: Metric={Metric}, Period={Period}, PropertyClass={PropertyClass}",
                    metric, periodMonths, propertyClass ?? "All");

                var result = await _marketMetricsService.GetMarketTimeseriesAsync(metric, periodMonths, propertyClass);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid market timeseries parameters");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve market timeseries");
                return StatusCode(500, new { error = "Failed to retrieve market timeseries data." });
            }
        }
    }

    // DTOs for timeseries operations

    /// <summary>Property value timeseries with assessment and sale history.</summary>
    public class PropertyTimeseriesResult
    {
        public string ParcelId { get; set; } = string.Empty;
        public List<AnnualAssessmentPoint> AssessmentHistory { get; set; } = new();
        public List<SaleEvent> SaleHistory { get; set; } = new();
    }

    /// <summary>Annual assessment values for a property.</summary>
    public class AnnualAssessmentPoint
    {
        public int AssessmentYear { get; set; }
        public decimal LandValue { get; set; }
        public decimal ImprovementValue { get; set; }
        public decimal TotalAssessedValue { get; set; }
        /// <summary>Year-over-year change percentage.</summary>
        public decimal? ChangePercent { get; set; }
    }

    /// <summary>A recorded property sale event.</summary>
    public class SaleEvent
    {
        public DateTime SaleDate { get; set; }
        public decimal SalePrice { get; set; }
        /// <summary>Instrument type (e.g., Warranty Deed, Quit Claim).</summary>
        public string InstrumentType { get; set; } = string.Empty;
        /// <summary>Whether the sale qualifies as arm's-length.</summary>
        public bool IsArmsLength { get; set; }
        /// <summary>Assessment-to-sale ratio at time of sale.</summary>
        public decimal? Ratio { get; set; }
    }

    /// <summary>Market-level timeseries data.</summary>
    public class MarketTimeseriesResult
    {
        public string Metric { get; set; } = string.Empty;
        public string PropertyClass { get; set; } = "All";
        public List<TimeseriesDataPoint> DataPoints { get; set; } = new();
    }

    /// <summary>A single timeseries data point.</summary>
    public class TimeseriesDataPoint
    {
        public DateTime Period { get; set; }
        public decimal Value { get; set; }
        public int SampleSize { get; set; }
    }
}

