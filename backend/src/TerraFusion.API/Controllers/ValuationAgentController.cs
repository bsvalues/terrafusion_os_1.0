using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Valuation Agent Controller (TFT-078, BIV-160, BIV-161)
    /// Exposes AI-powered valuation analysis endpoints that leverage the
    /// property valuation service for automated assessment recommendations.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class ValuationAgentController : ControllerBase
    {
        private readonly IPropertyValuationService _valuationService;
        private readonly ILogger<ValuationAgentController> _logger;

        public ValuationAgentController(
            IPropertyValuationService valuationService,
            ILogger<ValuationAgentController> logger)
        {
            _valuationService = valuationService;
            _logger = logger;
        }

        /// <summary>
        /// Execute an AI-driven valuation analysis for a property or batch of properties.
        /// The agent evaluates cost, sales comparison, and income approaches, applies
        /// market adjustments, and produces a reconciled value with confidence scoring.
        /// </summary>
        /// <param name="request">Analysis request with subject parcel(s) and parameters.</param>
        /// <returns>AI valuation analysis result with approach breakdowns and recommendations.</returns>
        [HttpPost("analyze")]
        [ProducesResponseType(typeof(ValuationAgentResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ValuationAgentResult>> Analyze([FromBody] ValuationAgentRequest request)
        {
            try
            {
                if (request.ParcelIds == null || request.ParcelIds.Count == 0)
                    return BadRequest(new { error = "At least one parcel ID is required." });

                _logger.LogInformation(
                    "AI valuation analysis requested: ParcelCount={Count}, AnalysisType={Type}",
                    request.ParcelIds.Count, request.AnalysisType);

                var result = await _valuationService.AnalyzeAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid valuation agent request");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI valuation analysis failed");
                return StatusCode(500, new { error = "AI valuation analysis failed. Contact system administrator." });
            }
        }

        /// <summary>
        /// Retrieve the current status and health of the valuation agent.
        /// Returns agent readiness, model versions, and processing capacity.
        /// </summary>
        /// <returns>Valuation agent operational status.</returns>
        [HttpGet("status")]
        [ProducesResponseType(typeof(ValuationAgentStatus), StatusCodes.Status200OK)]
        public async Task<ActionResult<ValuationAgentStatus>> GetStatus()
        {
            try
            {
                _logger.LogInformation("Retrieving valuation agent status");

                var status = await _valuationService.GetAgentStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve valuation agent status");
                return StatusCode(500, new { error = "Failed to retrieve agent status." });
            }
        }
    }

    // DTOs for valuation agent operations

    /// <summary>Request for AI-driven valuation analysis.</summary>
    public class ValuationAgentRequest
    {
        /// <summary>List of parcel IDs to analyze.</summary>
        public List<string> ParcelIds { get; set; } = new();
        /// <summary>Analysis type: Full, CostOnly, SalesCompOnly, IncomeOnly, QuickEstimate.</summary>
        public string AnalysisType { get; set; } = "Full";
        /// <summary>Assessment year context.</summary>
        public int? AssessmentYear { get; set; }
        /// <summary>Whether to include comparable sales analysis.</summary>
        public bool IncludeComps { get; set; } = true;
        /// <summary>Whether to include market condition adjustments.</summary>
        public bool ApplyMarketConditions { get; set; } = true;
    }

    /// <summary>Result of AI valuation analysis.</summary>
    public class ValuationAgentResult
    {
        public string AnalysisId { get; set; } = string.Empty;
        public List<ParcelValuationResult> Results { get; set; } = new();
        public int ParcelsAnalyzed { get; set; }
        public TimeSpan ProcessingTime { get; set; }
        public DateTime CompletedAt { get; set; }
    }

    /// <summary>Valuation result for a single parcel.</summary>
    public class ParcelValuationResult
    {
        public string ParcelId { get; set; } = string.Empty;
        /// <summary>AI-recommended value.</summary>
        public decimal RecommendedValue { get; set; }
        /// <summary>Confidence score (0-1).</summary>
        public decimal Confidence { get; set; }
        /// <summary>Cost approach indicated value.</summary>
        public decimal? CostApproachValue { get; set; }
        /// <summary>Sales comparison approach indicated value.</summary>
        public decimal? SalesComparisonValue { get; set; }
        /// <summary>Income approach indicated value.</summary>
        public decimal? IncomeApproachValue { get; set; }
        /// <summary>Current assessed value.</summary>
        public decimal CurrentAssessedValue { get; set; }
        /// <summary>Percentage change from current assessment.</summary>
        public decimal ChangePercent { get; set; }
        /// <summary>Agent's recommended action.</summary>
        public string RecommendedAction { get; set; } = string.Empty;
        /// <summary>Key factors influencing the recommendation.</summary>
        public List<string> KeyFactors { get; set; } = new();
    }

    /// <summary>Operational status of the valuation agent.</summary>
    public class ValuationAgentStatus
    {
        /// <summary>Whether the agent is ready to process requests.</summary>
        public bool IsReady { get; set; }
        /// <summary>Current agent state: Ready, Processing, Calibrating, Offline.</summary>
        public string State { get; set; } = string.Empty;
        /// <summary>Version of the active valuation model.</summary>
        public string ModelVersion { get; set; } = string.Empty;
        /// <summary>Number of requests currently in queue.</summary>
        public int QueueDepth { get; set; }
        /// <summary>Total analyses completed since last restart.</summary>
        public long TotalAnalysesCompleted { get; set; }
        /// <summary>Average processing time per parcel.</summary>
        public TimeSpan AverageProcessingTime { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    /// <summary>Service interface for AI property valuation operations.</summary>
    public interface IPropertyValuationService
    {
        Task<ValuationAgentResult> AnalyzeAsync(ValuationAgentRequest request);
        Task<ValuationAgentStatus> GetAgentStatusAsync();
    }
}
