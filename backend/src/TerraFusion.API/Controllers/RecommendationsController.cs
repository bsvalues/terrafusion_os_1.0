using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Recommendations Controller (BIV-037, BIV-199, TFT-080)
    /// Provides AI-driven comparable selection and valuation recommendations
    /// to support appraiser decision-making and quality assurance.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class RecommendationsController : ControllerBase
    {
        private readonly ICompAnalysisService _compAnalysisService;
        private readonly ILogger<RecommendationsController> _logger;

        public RecommendationsController(
            ICompAnalysisService compAnalysisService,
            ILogger<RecommendationsController> logger)
        {
            _compAnalysisService = compAnalysisService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieve recommended comparable sales for a subject property.
        /// Uses location, physical characteristics, and sale recency to rank candidates.
        /// Adjustments are calculated per USPAP and IAAO standards.
        /// </summary>
        /// <param name="parcelId">The subject parcel identifier.</param>
        /// <param name="maxComps">Maximum number of comparables to return (default 5).</param>
        /// <param name="maxDistanceMiles">Maximum search radius in miles (default 2.0).</param>
        /// <returns>Ranked list of recommended comparable sales with adjustments.</returns>
        [HttpGet("comps/{parcelId}")]
        [ProducesResponseType(typeof(CompRecommendationResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CompRecommendationResult>> GetRecommendedComps(
            string parcelId,
            [FromQuery] int maxComps = 5,
            [FromQuery] double maxDistanceMiles = 2.0)
        {
            try
            {
                _logger.LogInformation(
                    "Retrieving comp recommendations for ParcelId={ParcelId}, MaxComps={MaxComps}, Radius={Radius}mi",
                    parcelId, maxComps, maxDistanceMiles);

                var result = await _compAnalysisService.GetRecommendedCompsAsync(parcelId, maxComps, maxDistanceMiles);
                if (result == null)
                    return NotFound(new { error = $"Subject parcel '{parcelId}' not found." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve comp recommendations for ParcelId={ParcelId}", parcelId);
                return StatusCode(500, new { error = "Failed to generate comparable recommendations." });
            }
        }

        /// <summary>
        /// Retrieve valuation recommendations for a property.
        /// Synthesizes cost, sales comparison, and income approach indicators
        /// into a reconciled value recommendation with confidence scoring.
        /// </summary>
        /// <param name="parcelId">The subject parcel identifier.</param>
        /// <returns>Reconciled valuation recommendation with approach breakdowns.</returns>
        [HttpGet("valuation/{parcelId}")]
        [ProducesResponseType(typeof(ValuationRecommendation), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ValuationRecommendation>> GetValuationRecommendation(string parcelId)
        {
            try
            {
                _logger.LogInformation("Generating valuation recommendation for ParcelId={ParcelId}", parcelId);

                var result = await _compAnalysisService.GetValuationRecommendationAsync(parcelId);
                if (result == null)
                    return NotFound(new { error = $"Unable to generate recommendation for parcel '{parcelId}'." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate valuation recommendation for ParcelId={ParcelId}", parcelId);
                return StatusCode(500, new { error = "Failed to generate valuation recommendation." });
            }
        }
    }

    // DTOs for recommendation operations

    /// <summary>Result of comparable sales recommendation analysis.</summary>
    public class CompRecommendationResult
    {
        public string SubjectParcelId { get; set; } = string.Empty;
        public List<RecommendedComp> Comparables { get; set; } = new();
        /// <summary>Indicated value from the sales comparison approach.</summary>
        public decimal? IndicatedValue { get; set; }
        public DateTime GeneratedAt { get; set; }
    }

    /// <summary>A single recommended comparable sale with adjustments.</summary>
    public class RecommendedComp
    {
        public string ParcelId { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal SalePrice { get; set; }
        public DateTime SaleDate { get; set; }
        /// <summary>Distance from subject property in miles.</summary>
        public double DistanceMiles { get; set; }
        /// <summary>Overall similarity score (0-100).</summary>
        public decimal SimilarityScore { get; set; }
        /// <summary>Net adjustment amount applied to sale price.</summary>
        public decimal NetAdjustment { get; set; }
        /// <summary>Adjusted sale price after all adjustments.</summary>
        public decimal AdjustedSalePrice { get; set; }
        /// <summary>Breakdown of individual adjustments applied.</summary>
        public List<CompAdjustment> Adjustments { get; set; } = new();
    }

    /// <summary>Individual adjustment applied to a comparable sale.</summary>
    public class CompAdjustment
    {
        /// <summary>Adjustment category (e.g., Time, Location, Size, Quality, Condition).</summary>
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal Percentage { get; set; }
        public string Rationale { get; set; } = string.Empty;
    }

    /// <summary>Reconciled valuation recommendation across approaches.</summary>
    public class ValuationRecommendation
    {
        public string ParcelId { get; set; } = string.Empty;
        /// <summary>Final reconciled value recommendation.</summary>
        public decimal ReconciledValue { get; set; }
        /// <summary>Confidence in the recommendation (0-1).</summary>
        public decimal Confidence { get; set; }
        /// <summary>Cost approach indicated value.</summary>
        public decimal? CostApproachValue { get; set; }
        /// <summary>Sales comparison approach indicated value.</summary>
        public decimal? SalesComparisonValue { get; set; }
        /// <summary>Income approach indicated value (if applicable).</summary>
        public decimal? IncomeApproachValue { get; set; }
        /// <summary>Current assessed value for comparison.</summary>
        public decimal CurrentAssessedValue { get; set; }
        /// <summary>Recommended action: Maintain, Increase, Decrease, Review.</summary>
        public string RecommendedAction { get; set; } = string.Empty;
        public List<string> SupportingNotes { get; set; } = new();
        public DateTime GeneratedAt { get; set; }
    }

    /// <summary>Service interface for comparable analysis and valuation recommendations.</summary>
    public interface ICompAnalysisService
    {
        Task<CompRecommendationResult?> GetRecommendedCompsAsync(string parcelId, int maxComps, double maxDistanceMiles);
        Task<ValuationRecommendation?> GetValuationRecommendationAsync(string parcelId);
    }
}
