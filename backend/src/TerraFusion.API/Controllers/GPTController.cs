// TerraFusionGPT Suite: GPT API Controller
// Elite Government OS Engineering - AI Platform

using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// API Controller for GPT operations - chat, management, statistics
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires authentication
    public class GPTController : ControllerBase
    {
        private readonly IGPTConfigurationService _configService;
        private readonly IGPTOrchestrationService _orchestrationService;
        private readonly IRAGService _ragService;
        private readonly ILogger<GPTController> _logger;

        public GPTController(
            IGPTConfigurationService configService,
            IGPTOrchestrationService orchestrationService,
            IRAGService ragService,
            ILogger<GPTController> logger)
        {
            _configService = configService ?? throw new ArgumentNullException(nameof(configService));
            _orchestrationService = orchestrationService ?? throw new ArgumentNullException(nameof(orchestrationService));
            _ragService = ragService ?? throw new ArgumentNullException(nameof(ragService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        #region GPT Configuration Management

        /// <summary>
        /// Get all available GPTs for current user
        /// </summary>
        [HttpGet]
        public async System.Threading.Tasks.Task<ActionResult<List<GPTConfiguration>>> GetAvailableGPTs()
        {
            try
            {
                var userId = GetUserId();
                var countyId = GetCountyId();
                var role = GetUserRole();

                var gpts = await _configService.GetAvailableGPTsAsync(userId, countyId, role);
                return Ok(gpts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available GPTs");
                return StatusCode(500, new { error = "Failed to retrieve GPTs" });
            }
        }

        /// <summary>
        /// Get system-provided GPTs
        /// </summary>
        [HttpGet("system")]
        public async System.Threading.Tasks.Task<ActionResult<List<GPTConfiguration>>> GetSystemGPTs()
        {
            try
            {
                var gpts = await _configService.GetSystemGPTsAsync();
                return Ok(gpts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system GPTs");
                return StatusCode(500, new { error = "Failed to retrieve system GPTs" });
            }
        }

        /// <summary>
        /// Get featured GPTs
        /// </summary>
        [HttpGet("featured")]
        public async System.Threading.Tasks.Task<ActionResult<List<GPTConfiguration>>> GetFeaturedGPTs()
        {
            try
            {
                var gpts = await _configService.GetFeaturedGPTsAsync();
                return Ok(gpts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting featured GPTs");
                return StatusCode(500, new { error = "Failed to retrieve featured GPTs" });
            }
        }

        /// <summary>
        /// Get popular GPTs
        /// </summary>
        [HttpGet("popular")]
        public async System.Threading.Tasks.Task<ActionResult<List<GPTConfiguration>>> GetPopularGPTs([FromQuery] int count = 10)
        {
            try
            {
                var gpts = await _configService.GetPopularGPTsAsync(count);
                return Ok(gpts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting popular GPTs");
                return StatusCode(500, new { error = "Failed to retrieve popular GPTs" });
            }
        }

        /// <summary>
        /// Search GPTs
        /// </summary>
        [HttpGet("search")]
        public async System.Threading.Tasks.Task<ActionResult<List<GPTConfiguration>>> SearchGPTs([FromQuery] string query)
        {
            try
            {
                var countyId = GetCountyId();
                var gpts = await _configService.SearchGPTsAsync(query, countyId);
                return Ok(gpts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching GPTs: {Query}", query);
                return StatusCode(500, new { error = "Failed to search GPTs" });
            }
        }

        /// <summary>
        /// Get GPT by ID
        /// </summary>
        [HttpGet("{id}")]
        public async System.Threading.Tasks.Task<ActionResult<GPTConfiguration>> GetGPT(int id)
        {
            try
            {
                var gpt = await _configService.GetGPTByIdAsync(id);
                if (gpt == null)
                {
                    return NotFound(new { error = $"GPT {id} not found" });
                }

                return Ok(gpt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting GPT {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve GPT" });
            }
        }

        /// <summary>
        /// Create a new GPT
        /// </summary>
        [HttpPost]
        public async System.Threading.Tasks.Task<ActionResult<GPTConfiguration>> CreateGPT([FromBody] GPTConfiguration config)
        {
            try
            {
                var userId = GetUserId();
                var countyId = GetCountyId();

                config.CreatedByUserId = userId;
                config.CountyId = countyId;
                config.CreatedBy = User.Identity?.Name ?? "Unknown";
                config.UpdatedBy = config.CreatedBy;

                var gpt = await _configService.CreateGPTAsync(config);
                return CreatedAtAction(nameof(GetGPT), new { id = gpt.Id }, gpt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating GPT: {Name}", config.Name);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Update a GPT
        /// </summary>
        [HttpPut("{id}")]
        public async System.Threading.Tasks.Task<ActionResult<GPTConfiguration>> UpdateGPT(int id, [FromBody] GPTConfiguration config)
        {
            try
            {
                config.UpdatedBy = User.Identity?.Name ?? "Unknown";
                var gpt = await _configService.UpdateGPTAsync(id, config);
                return Ok(gpt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating GPT {Id}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a GPT (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async System.Threading.Tasks.Task<ActionResult> DeleteGPT(int id)
        {
            try
            {
                var result = await _configService.DeleteGPTAsync(id);
                if (!result)
                {
                    return NotFound(new { error = $"GPT {id} not found" });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting GPT {Id}", id);
                return StatusCode(500, new { error = "Failed to delete GPT" });
            }
        }

        #endregion

        #region Conversation Management

        /// <summary>
        /// Create a new conversation
        /// </summary>
        [HttpPost("conversations")]
        public async System.Threading.Tasks.Task<ActionResult<GPTConversation>> CreateConversation(
            [FromBody] CreateConversationRequest request)
        {
            try
            {
                var userId = GetUserId();
                var countyId = GetCountyId();

                var conversation = await _orchestrationService.CreateConversationAsync(
                    request.GPTConfigId,
                    userId,
                    countyId,
                    request.Title);

                return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id }, conversation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating conversation for GPT {GPTId}", request.GPTConfigId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get conversation by ID
        /// </summary>
        [HttpGet("conversations/{id}")]
        public async System.Threading.Tasks.Task<ActionResult<GPTConversation>> GetConversation(int id)
        {
            try
            {
                var conversation = await _orchestrationService.GetConversationAsync(id);
                if (conversation == null)
                {
                    return NotFound(new { error = $"Conversation {id} not found" });
                }

                return Ok(conversation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversation {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve conversation" });
            }
        }

        /// <summary>
        /// Get user's conversations for a GPT
        /// </summary>
        [HttpGet("{gptId}/conversations")]
        public async System.Threading.Tasks.Task<ActionResult<List<GPTConversation>>> GetUserConversations(
            int gptId, [FromQuery] int limit = 20)
        {
            try
            {
                var userId = GetUserId();
                var conversations = await _orchestrationService.GetUserConversationsAsync(userId, gptId, limit);
                return Ok(conversations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user conversations for GPT {GPTId}", gptId);
                return StatusCode(500, new { error = "Failed to retrieve conversations" });
            }
        }

        /// <summary>
        /// Get conversation history
        /// </summary>
        [HttpGet("conversations/{id}/history")]
        public async System.Threading.Tasks.Task<ActionResult<List<GPTMessage>>> GetConversationHistory(
            int id, [FromQuery] int limit = 50)
        {
            try
            {
                var messages = await _orchestrationService.GetConversationHistoryAsync(id, limit);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversation history {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve history" });
            }
        }

        /// <summary>
        /// Send a message to a GPT
        /// </summary>
        [HttpPost("conversations/{conversationId}/messages")]
        public async System.Threading.Tasks.Task<ActionResult<GPTMessage>> SendMessage(
            int conversationId,
            [FromBody] SendMessageRequest request)
        {
            try
            {
                var userId = GetUserId();
                var countyId = GetCountyId();

                var response = await _orchestrationService.SendMessageAsync(
                    request.GPTConfigId,
                    conversationId,
                    request.Message,
                    userId,
                    countyId);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message to conversation {ConversationId}", conversationId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Archive a conversation
        /// </summary>
        [HttpPost("conversations/{id}/archive")]
        public async System.Threading.Tasks.Task<ActionResult> ArchiveConversation(int id)
        {
            try
            {
                await _orchestrationService.ArchiveConversationAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error archiving conversation {Id}", id);
                return StatusCode(500, new { error = "Failed to archive conversation" });
            }
        }

        /// <summary>
        /// Delete a conversation
        /// </summary>
        [HttpDelete("conversations/{id}")]
        public async System.Threading.Tasks.Task<ActionResult> DeleteConversation(int id)
        {
            try
            {
                await _orchestrationService.DeleteConversationAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting conversation {Id}", id);
                return StatusCode(500, new { error = "Failed to delete conversation" });
            }
        }

        /// <summary>
        /// Rate a conversation
        /// </summary>
        [HttpPost("conversations/{id}/rate")]
        public async System.Threading.Tasks.Task<ActionResult> RateConversation(
            int id, [FromBody] RateConversationRequest request)
        {
            try
            {
                await _orchestrationService.RateConversationAsync(id, request.Rating, request.Feedback);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rating conversation {Id}", id);
                return StatusCode(500, new { error = "Failed to rate conversation" });
            }
        }

        #endregion

        #region Statistics

        /// <summary>
        /// Get GPT usage statistics
        /// </summary>
        [HttpGet("{id}/statistics")]
        public async System.Threading.Tasks.Task<ActionResult<GPTUsageStatistics>> GetGPTStatistics(
            int id,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var stats = await _orchestrationService.GetGPTUsageStatisticsAsync(id, startDate, endDate);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting GPT statistics {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve statistics" });
            }
        }

        /// <summary>
        /// Get county usage statistics
        /// </summary>
        [HttpGet("statistics/county")]
        [Authorize(Roles = "CountyAdmin,SystemAdmin")]
        public async System.Threading.Tasks.Task<ActionResult<CountyUsageStatistics>> GetCountyStatistics(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var countyId = GetCountyId();
                var stats = await _orchestrationService.GetCountyUsageStatisticsAsync(countyId, startDate, endDate);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting county statistics");
                return StatusCode(500, new { error = "Failed to retrieve statistics" });
            }
        }

        #endregion

        #region Helper Methods

        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new InvalidOperationException("User ID not found in claims");
        }

        private int GetCountyId()
        {
            var countyIdClaim = User.FindFirst("CountyId")?.Value;
            if (string.IsNullOrEmpty(countyIdClaim) || !int.TryParse(countyIdClaim, out var countyId))
            {
                throw new InvalidOperationException("County ID not found in claims");
            }
            return countyId;
        }

        private string GetUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "User";
        }

        #endregion

        #region Request/Response Models

        public class CreateConversationRequest
        {
            public int GPTConfigId { get; set; }
            public string? Title { get; set; }
        }

        public class SendMessageRequest
        {
            public int GPTConfigId { get; set; }
            public string Message { get; set; } = string.Empty;
        }

        public class RateConversationRequest
        {
            public int Rating { get; set; } // 1-5
            public string? Feedback { get; set; }
        }

        #endregion
    }
}

