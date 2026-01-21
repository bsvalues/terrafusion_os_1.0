/*
 * ═══════════════════════════════════════════════════════════════
 * AI ASSISTANT CONTROLLER - API Endpoints for County Employees
 * TerraFusion.API - Elite Government AI Integration
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using TerraFusion.AI.Services;
using TerraFusion.AI.Models;

namespace TerraFusion.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AIAssistantController : ControllerBase
    {
        private readonly ILogger<AIAssistantController> _logger;
        private readonly IAIAssistantService _aiAssistantService;

        public AIAssistantController(
            ILogger<AIAssistantController> logger,
            IAIAssistantService aiAssistantService)
        {
            _logger = logger;
            _aiAssistantService = aiAssistantService;
        }

        /// <summary>
        /// Process AI assistant message from county employee
        /// </summary>
        /// <param name="request">AI assistant request</param>
        /// <returns>AI-generated response with suggestions</returns>
        [HttpPost("message")]
        // [AllowAnonymous] // REMOVED: Restore security after smoke testing
        [ProducesResponseType(typeof(AIAssistantResponse), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<AIAssistantResponse>> ProcessMessage(
            [FromBody] AIAssistantRequest request)
        {
            try
            {
                _logger.LogInformation(
                    "AI message request from {CountyId} employee {Role}",
                    request.CountyId,
                    request.EmployeeRole);

                var response = await _aiAssistantService.ProcessMessageAsync(request);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI message");
                return StatusCode(500, new { error = "AI processing error", details = ex.Message });
            }
        }

        /// <summary>
        /// Get AI swarm status for county
        /// </summary>
        /// <param name="countyId">County identifier</param>
        /// <returns>AI swarm status and metrics</returns>
        [HttpGet("swarm-status/{countyId}")]
        [ProducesResponseType(typeof(AISwarmStatus), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<AISwarmStatus>> GetSwarmStatus(string countyId)
        {
            try
            {
                var status = await _aiAssistantService.GetSwarmStatusAsync(countyId);
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving swarm status for {CountyId}", countyId);
                return NotFound(new { error = "Swarm status not found", countyId });
            }
        }

        /// <summary>
        /// Get AI recommendations for county employee
        /// </summary>
        /// <param name="countyId">County identifier</param>
        /// <param name="context">Current context (optional)</param>
        /// <returns>List of AI recommendations</returns>
        [HttpGet("recommendations/{countyId}")]
        [ProducesResponseType(typeof(System.Collections.Generic.List<TerraFusion.AI.Models.AIRecommendation>), 200)]
        public async Task<ActionResult> GetRecommendations(
            string countyId,
            [FromQuery] string context = null)
        {
            try
            {
                var recommendations = await _aiAssistantService
                    .GetRecommendationsAsync(countyId, context);

                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating recommendations for {CountyId}", countyId);
                return StatusCode(500, new { error = "Recommendation generation error" });
            }
        }

        /// <summary>
        /// Analyze property with AI swarm
        /// </summary>
        /// <param name="parcelId">Parcel identifier</param>
        /// <param name="countyId">County identifier</param>
        /// <returns>Comprehensive AI property analysis</returns>
        [HttpPost("analyze-property")]
        [ProducesResponseType(typeof(PropertyAnalysisResult), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<PropertyAnalysisResult>> AnalyzeProperty(
            [FromQuery] string parcelId,
            [FromQuery] string countyId)
        {
            try
            {
                _logger.LogInformation(
                    "AI property analysis requested: {ParcelId} in {CountyId}",
                    parcelId,
                    countyId);

                var analysis = await _aiAssistantService
                    .AnalyzePropertyAsync(parcelId, countyId);

                return Ok(analysis);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error analyzing property {ParcelId} in {CountyId}",
                    parcelId,
                    countyId);

                return StatusCode(500, new { error = "Property analysis error" });
            }
        }

        /// <summary>
        /// Get AI assistant health status
        /// </summary>
        /// <returns>AI system health metrics</returns>
        [HttpGet("health")]
        [AllowAnonymous]
        [ProducesResponseType(200)]
        public ActionResult GetHealth()
        {
            return Ok(new
            {
                status = "healthy",
                service = "AI Assistant",
                timestamp = DateTime.UtcNow,
                version = "1.0.0",
                consciousness_engine_port = 3004,
                quantum_optimization_factor = 949
            });
        }
    }
}
