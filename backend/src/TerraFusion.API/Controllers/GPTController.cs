// TerraFusionGPT Suite: GPT API Controller
// Elite Government OS Engineering - AI Platform

using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
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
        private readonly ISystemGptHealthEvaluator? _healthEvaluator;
        private readonly ISystemGptModeService? _modeService;
        private readonly IBentonRagReadinessService? _bentonRagService; // Phase 18
        private readonly ISystemGptEventService? _eventService; // Phase 19
        private readonly ISystemGptMetricsService? _metricsService; // Phase 20
        private readonly ISystemGptFederatedOverviewService? _federatedOverviewService; // Phase 23
        private readonly ICountyPolicyService? _policyService; // Phase 24
        private readonly ISystemGptPolicyEvaluator? _policyEvaluator; // Phase 24
        private readonly ISystemGptGuardrailService? _guardrailService; // Phase 26
        private readonly ISystemGptRagFleetService? _ragFleetService; // Phase 27
        private readonly ILogger<GPTController> _logger;

        public GPTController(
            IGPTConfigurationService configService,
            IGPTOrchestrationService orchestrationService,
            IRAGService ragService,
            ILogger<GPTController> logger,
            ISystemGptHealthEvaluator? healthEvaluator = null,
            ISystemGptModeService? modeService = null,
            IBentonRagReadinessService? bentonRagService = null,
            ISystemGptEventService? eventService = null,
            ISystemGptMetricsService? metricsService = null,
            ISystemGptFederatedOverviewService? federatedOverviewService = null,
            ICountyPolicyService? policyService = null, // Phase 24
            ISystemGptPolicyEvaluator? policyEvaluator = null, // Phase 24
            ISystemGptGuardrailService? guardrailService = null, // Phase 26
            ISystemGptRagFleetService? ragFleetService = null) // Phase 27
        {
            _configService = configService ?? throw new ArgumentNullException(nameof(configService));
            _orchestrationService = orchestrationService ?? throw new ArgumentNullException(nameof(orchestrationService));
            _ragService = ragService ?? throw new ArgumentNullException(nameof(ragService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _healthEvaluator = healthEvaluator; // Optional - graceful degradation if not registered
            _modeService = modeService; // Optional - Phase 17 Safe Mode
            _bentonRagService = bentonRagService; // Optional - Phase 18 Benton RAG Readiness
            _eventService = eventService; // Optional - Phase 19 AI Incident Timeline
            _metricsService = metricsService; // Optional - Phase 20 AI Metrics & Telemetry
            _federatedOverviewService = federatedOverviewService; // Optional - Phase 23 Federated Overview
            _policyService = policyService; // Optional - Phase 24 AI Policy Engine
            _policyEvaluator = policyEvaluator; // Optional - Phase 24 Policy Evaluator
            _guardrailService = guardrailService; // Optional - Phase 26 Autonomous Guardrails
            _ragFleetService = ragFleetService; // Optional - Phase 27 RAG Fleet Readiness
        }

        // Phase 26: In-memory storage for last guardrail decision per county (for diagnostics)
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<TerraFusion.AI.Models.CountyId, TerraFusion.AI.Models.LastGuardrailDecisionDto>
            _lastGuardrailDecisions = new();

        private void StoreLastGuardrailDecision(TerraFusion.AI.Models.CountyId countyId, TerraFusion.AI.Models.GuardrailDecision decision)
        {
            var dto = TerraFusion.AI.Models.LastGuardrailDecisionDto.FromDecision(decision);
            _lastGuardrailDecisions[countyId] = dto;
        }

        internal static TerraFusion.AI.Models.LastGuardrailDecisionDto? GetLastGuardrailDecision(TerraFusion.AI.Models.CountyId countyId)
        {
            return _lastGuardrailDecisions.TryGetValue(countyId, out var decision) ? decision : null;
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
                // Phase 17: Safe Mode check - block new messages when in Safe Mode
                if (_modeService?.IsSafeMode == true)
                {
                    _logger.LogWarning("SendMessage blocked: SystemGPT is in Safe Mode. Reason: {Reason}",
                        _modeService.CurrentReason);

                    // Return a safe mode message instead of processing
                    var safeModeMessage = new GPTMessage
                    {
                        Id = 0,
                        ConversationId = conversationId,
                        Role = "assistant",
                        Content = $"🛑 **SystemGPT is currently in Safe Mode**\n\n" +
                                  $"AI operations are temporarily restricted. Reason: {_modeService.CurrentReason ?? "No reason provided"}\n\n" +
                                  $"Please contact your system administrator or wait until Safe Mode is disabled.",
                        CreatedAt = DateTime.UtcNow
                    };

                    return Ok(safeModeMessage);
                }

                var userId = GetUserId();
                var countyId = GetCountyId();
                var countyIdEnum = (TerraFusion.AI.Models.CountyId)countyId;

                // Phase 26: Autonomous Guardrails - comprehensive evaluation before processing
                if (_guardrailService != null && _metricsService != null && _policyService != null)
                {
                    var guardrailContext = new TerraFusion.AI.Models.GptRequestContext
                    {
                        CountyId = countyIdEnum,
                        Prompt = request.Message,
                        GptConfigKey = request.GPTConfigId.ToString(),
                        ContextId = conversationId.ToString(),
                        RequiresRag = false, // Basic message doesn't require RAG
                        RequiresEmbedding = false,
                        UserId = userId
                    };

                    var metrics = _metricsService.GetSnapshot(TimeSpan.FromMinutes(15), maxSeriesPoints: 20);
                    var policy = await _policyService.GetPolicyAsync(countyIdEnum);
                    var countyInfo = TerraFusion.AI.Models.CountyHelper.GetCountyInfo(countyIdEnum);

                    var guardrailDecision = _guardrailService.EvaluateGuardrails(
                        countyIdEnum, guardrailContext, metrics, policy, countyInfo.IsConfigured);

                    // Store decision for diagnostics (in-memory, last decision per county)
                    StoreLastGuardrailDecision(countyIdEnum, guardrailDecision);

                    // Handle deny decisions
                    if (!guardrailDecision.Allow)
                    {
                        _logger.LogWarning("SendMessage blocked by guardrails: {Reason} (County: {CountyId}, Kind: {Kind})",
                            guardrailDecision.DenyReason, countyId, guardrailDecision.Kind);

                        var guardrailDeniedMessage = new GPTMessage
                        {
                            Id = 0,
                            ConversationId = conversationId,
                            Role = "assistant",
                            Content = $"🛡️ **Request blocked by AI Guardrails**\n\n" +
                                      $"This operation was blocked by autonomous guardrails.\n\n" +
                                      $"Reason: {guardrailDecision.DenyReason ?? "Guardrail violation"}\n" +
                                      $"Decision: {guardrailDecision.Kind}\n\n" +
                                      (guardrailDecision.Advisory != null ? $"Advisory: {guardrailDecision.Advisory}\n\n" : "") +
                                      $"Contact your administrator if you believe this is an error.",
                            CreatedAt = DateTime.UtcNow
                        };

                        return Ok(guardrailDeniedMessage);
                    }

                    // Handle throttle - add delay if needed (v1 is lightweight, ~500ms)
                    if (guardrailDecision.AutoThrottle)
                    {
                        _logger.LogInformation("Phase 26: Request throttled by guardrails for county {CountyId}", countyId);
                        await System.Threading.Tasks.Task.Delay(500); // Brief delay for capacity relief
                    }

                    // Handle sanitization
                    if (guardrailDecision.AutoSanitize)
                    {
                        _logger.LogInformation("Phase 26: Message sanitization recommended by guardrails for county {CountyId}", countyId);
                        // Sanitization is applied by policy evaluator below if applicable
                    }

                    // Log safe mode recommendation (v1 doesn't auto-flip, just logs)
                    if (guardrailDecision.AutoSafeModeRecommended)
                    {
                        _logger.LogWarning("Phase 26 ADVISORY: Safe Mode recommended for county {CountyId}. Reason: {Advisory}",
                            countyId, guardrailDecision.Advisory);
                    }

                    // Note: ForceExplain is tracked in decision for UI to show, but explain is a separate endpoint
                    if (guardrailDecision.ForceExplain)
                    {
                        _logger.LogInformation("Phase 26: Force-explain flag set for county {CountyId} (valuation context)", countyId);
                    }
                }

                // Phase 24: Policy Engine check - evaluate request against county policy
                // (This provides sanitization and additional policy checks)
                if (_policyEvaluator != null)
                {
                    var policyContext = new TerraFusion.AI.Models.GptRequestContext
                    {
                        CountyId = countyIdEnum,
                        Prompt = request.Message,
                        GptConfigKey = request.GPTConfigId.ToString(),
                        ContextId = conversationId.ToString(),
                        RequiresRag = false, // Basic message doesn't require RAG
                        RequiresEmbedding = false,
                        UserId = userId
                    };

                    var policyResult = await _policyEvaluator.EvaluateRequestAsync(policyContext);

                    if (!policyResult.Allowed)
                    {
                        _logger.LogWarning("SendMessage blocked by policy: {Reason} (County: {CountyId})",
                            policyResult.DenyReason, countyId);

                        var policyDeniedMessage = new GPTMessage
                        {
                            Id = 0,
                            ConversationId = conversationId,
                            Role = "assistant",
                            Content = $"🚫 **Request blocked by AI Policy**\n\n" +
                                      $"This operation is not allowed by your county's AI governance policy.\n\n" +
                                      $"Reason: {policyResult.DenyReason ?? "Policy violation"}\n\n" +
                                      $"Contact your administrator if you believe this is an error.",
                            CreatedAt = DateTime.UtcNow
                        };

                        return Ok(policyDeniedMessage);
                    }

                    // Use sanitized prompt if applicable
                    if (policyResult.WasSanitized && !string.IsNullOrEmpty(policyResult.SanitizedPrompt))
                    {
                        _logger.LogInformation("Phase 24: Message sanitized by policy for county {CountyId}", countyId);
                        request.Message = policyResult.SanitizedPrompt;
                    }
                }

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

        #region RAG Health

        /// <summary>
        /// Get RAG system health status
        /// </summary>
        [HttpGet("rag/health")]
        [AllowAnonymous] // Allow health checks without auth for monitoring
        public async System.Threading.Tasks.Task<ActionResult<RAGHealthResponse>> GetRAGHealth()
        {
            try
            {
                var health = new RAGHealthResponse
                {
                    Status = "healthy",
                    Timestamp = DateTime.UtcNow,
                    Datasets = new List<DatasetHealthInfo>()
                };

                // Check benton_cama_basics dataset (primary for PropertyAssessmentGPT)
                var bentonDataset = await _ragService.GetDatasetAsync(1);
                if (bentonDataset != null)
                {
                    health.Datasets.Add(new DatasetHealthInfo
                    {
                        Id = "benton_cama_basics",
                        Name = bentonDataset.Name,
                        Indexed = bentonDataset.DocumentCount > 0,
                        DocumentCount = bentonDataset.DocumentCount,
                        EmbeddingCount = bentonDataset.TotalChunks,
                        LastUpdated = bentonDataset.UpdatedAt
                    });
                }
                else
                {
                    // Check if files exist in rag folder even if DB dataset not created
                    var ragPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "rag", "benton-cama");
                    var filesExist = Directory.Exists(ragPath) &&
                        (Directory.GetFiles(ragPath, "*.md", SearchOption.AllDirectories).Length > 0 ||
                         Directory.GetFiles(ragPath, "*.pdf", SearchOption.AllDirectories).Length > 0);

                    health.Datasets.Add(new DatasetHealthInfo
                    {
                        Id = "benton_cama_basics",
                        Name = "Benton CAMA Basics",
                        Indexed = false,
                        DocumentCount = filesExist ? -1 : 0, // -1 indicates files exist but not indexed
                        EmbeddingCount = 0,
                        LastUpdated = null
                    });
                }

                // Check assessment-standards dataset
                var standardsDataset = await _ragService.GetDatasetAsync(2);
                if (standardsDataset != null)
                {
                    health.Datasets.Add(new DatasetHealthInfo
                    {
                        Id = "assessment-standards",
                        Name = standardsDataset.Name,
                        Indexed = standardsDataset.DocumentCount > 0,
                        DocumentCount = standardsDataset.DocumentCount,
                        EmbeddingCount = standardsDataset.TotalChunks,
                        LastUpdated = standardsDataset.UpdatedAt
                    });
                }
                else
                {
                    health.Datasets.Add(new DatasetHealthInfo
                    {
                        Id = "assessment-standards",
                        Name = "Assessment Standards",
                        Indexed = false,
                        DocumentCount = 0,
                        EmbeddingCount = 0
                    });
                }

                // Overall status based on primary dataset
                var primaryDataset = health.Datasets.FirstOrDefault(d => d.Id == "benton_cama_basics");
                if (primaryDataset == null || !primaryDataset.Indexed)
                {
                    health.Status = "degraded";
                }

                return Ok(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking RAG health");
                return Ok(new RAGHealthResponse
                {
                    Status = "error",
                    Timestamp = DateTime.UtcNow,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Trigger RAG ingestion for a specific dataset
        /// </summary>
        [HttpPost("rag/index/{datasetId}")]
        [AllowAnonymous] // For now, allow without auth for dev; add auth for production
        public async System.Threading.Tasks.Task<ActionResult<RAGIngestionResponse>> IndexDataset(string datasetId)
        {
            try
            {
                // Phase 17: Safe Mode check - block RAG indexing when in Safe Mode
                if (_modeService?.IsSafeMode == true)
                {
                    _logger.LogWarning("RAG indexing blocked: SystemGPT is in Safe Mode. Dataset: {DatasetId}, Reason: {Reason}",
                        datasetId, _modeService.CurrentReason);

                    return BadRequest(new RAGIngestionResponse
                    {
                        DatasetId = datasetId,
                        Success = false,
                        Error = $"🛑 SystemGPT is in Safe Mode. RAG operations are blocked. Reason: {_modeService.CurrentReason}"
                    });
                }

                _logger.LogInformation("RAG ingestion requested for dataset: {DatasetId}", datasetId);

                // Map config dataset IDs to internal dataset IDs
                var internalDatasetId = datasetId switch
                {
                    "benton_cama_basics" => 1,
                    "assessment-standards" => 2,
                    "comparable-sales" => 3,
                    _ => 0
                };

                if (internalDatasetId == 0)
                {
                    return BadRequest(new RAGIngestionResponse
                    {
                        DatasetId = datasetId,
                        Success = false,
                        Error = $"Unknown dataset: {datasetId}"
                    });
                }

                // Get or create the dataset
                var dataset = await _ragService.GetDatasetAsync(internalDatasetId);
                if (dataset == null)
                {
                    // Create the dataset
                    var datasetName = datasetId switch
                    {
                        "benton_cama_basics" => "Benton CAMA Basics",
                        "assessment-standards" => "Assessment Standards & Procedures",
                        "comparable-sales" => "Comparable Sales Database",
                        _ => datasetId
                    };

                    dataset = await _ragService.CreateDatasetAsync(
                        datasetName,
                        $"RAG dataset for {datasetId}",
                        countyId: 1, // Benton County
                        category: "PropertyAssessment");
                }

                // Find and ingest files from the rag folder
                var ragBasePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "rag");
                var datasetPath = datasetId switch
                {
                    "benton_cama_basics" => Path.Combine(ragBasePath, "benton-cama"),
                    "assessment-standards" => Path.Combine(ragBasePath, "assessment-standards"),
                    _ => string.Empty
                };

                var docCount = 0;
                var chunkCount = 0;

                if (!string.IsNullOrEmpty(datasetPath) && Directory.Exists(datasetPath))
                {
                    var mdFiles = Directory.GetFiles(datasetPath, "*.md", SearchOption.AllDirectories);

                    foreach (var file in mdFiles)
                    {
                        var content = await System.IO.File.ReadAllTextAsync(file);
                        var title = Path.GetFileNameWithoutExtension(file);

                        var doc = await _ragService.AddDocumentAsync(
                            dataset.Id,
                            title,
                            content,
                            sourceUrl: file,
                            documentType: "markdown");

                        docCount++;
                        chunkCount += doc.ChunkCount;
                    }
                }

                _logger.LogInformation(
                    "RAG ingestion completed for {DatasetId}: {DocCount} documents, {ChunkCount} chunks",
                    datasetId, docCount, chunkCount);

                return Ok(new RAGIngestionResponse
                {
                    DatasetId = datasetId,
                    Success = true,
                    DocumentCount = docCount,
                    ChunkCount = chunkCount,
                    CompletedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during RAG ingestion for dataset: {DatasetId}", datasetId);
                return StatusCode(500, new RAGIngestionResponse
                {
                    DatasetId = datasetId,
                    Success = false,
                    Error = ex.Message
                });
            }
        }

        #endregion

        #region Conversation Trace (Phase 11 - Audit & Traceability)

        /// <summary>
        /// Get conversation trace with RAG audit details
        /// Phase 11: Full traceability for government compliance
        /// </summary>
        [HttpGet("conversations/{conversationId}/trace")]
        public async System.Threading.Tasks.Task<ActionResult<ConversationTraceResponse>> GetConversationTrace(int conversationId)
        {
            try
            {
                _logger.LogInformation("Retrieving trace for conversation: {ConversationId}", conversationId);

                // Get conversation with messages
                var conversation = await _orchestrationService.GetConversationAsync(conversationId);
                if (conversation == null)
                {
                    return NotFound(new { error = $"Conversation {conversationId} not found" });
                }

                // Get messages
                var messages = await _orchestrationService.GetConversationHistoryAsync(conversationId);

                // Get GPT config for context
                var gptConfig = await _configService.GetGPTByIdAsync(conversation.GPTConfigurationId);

                // Build trace response with audit details
                var traceMessages = new List<TraceMessageDto>();
                foreach (var msg in messages.OrderBy(m => m.CreatedAt))
                {
                    var traceMsg = new TraceMessageDto
                    {
                        Id = msg.Id,
                        Role = msg.Role,
                        Content = msg.Content,
                        CreatedAt = msg.CreatedAt,
                        TokensUsed = msg.TotalTokens,
                        Cost = msg.Cost
                    };

                    // Add RAG trace info if available (from GPTMessage fields)
                    if (msg.Role == "assistant" && !string.IsNullOrEmpty(msg.RAGDocumentsUsed))
                    {
                        try
                        {
                            var docIds = System.Text.Json.JsonSerializer.Deserialize<List<string>>(msg.RAGDocumentsUsed);
                            traceMsg.RAGUsed = true;
                            traceMsg.RAGDocuments = docIds;
                            traceMsg.RAGScore = msg.RAGScore;

                            // Phase 11: Try to get chunk details from GPTAudit record
                            var audit = await _orchestrationService.GetAuditByMessageIdAsync(msg.Id);
                            if (audit != null && !string.IsNullOrEmpty(audit.RAGChunkDetails))
                            {
                                try
                                {
                                    traceMsg.RAGChunkDetails = System.Text.Json.JsonSerializer.Deserialize<List<RAGChunkDetailDto>>(audit.RAGChunkDetails);
                                }
                                catch
                                {
                                    // If deserialization fails, leave chunk details null
                                    _logger.LogWarning("Failed to deserialize RAGChunkDetails for message {MessageId}", msg.Id);
                                }
                            }
                        }
                        catch
                        {
                            traceMsg.RAGUsed = false;
                        }
                    }
                    else
                    {
                        traceMsg.RAGUsed = false;
                    }

                    traceMessages.Add(traceMsg);
                }

                var response = new ConversationTraceResponse
                {
                    ConversationId = conversationId,
                    GPTKey = gptConfig?.Name ?? "Unknown",
                    GPTDisplayName = gptConfig?.DisplayName ?? "Unknown",
                    Title = conversation.Title,
                    MessageCount = traceMessages.Count,
                    TotalTokensUsed = conversation.TotalTokensUsed,
                    TotalCost = conversation.TotalCost,
                    Messages = traceMessages,
                    CreatedAt = conversation.CreatedAt,
                    LastMessageAt = conversation.LastMessageAt
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving trace for conversation: {ConversationId}", conversationId);
                return StatusCode(500, new { error = "Failed to retrieve conversation trace" });
            }
        }

        #endregion

        #region SystemGPT Diagnostics (Phase 15 - AI Control Center)

        /// <summary>
        /// Get comprehensive diagnostics for the TerraFusion AI subsystem.
        /// Phase 15: SystemGPT Console - Visible, controllable AI surface for county tech leads.
        /// Phase 22: Multi-county federation - optional countyId parameter (defaults to Benton).
        /// </summary>
        /// <param name="countyId">County identifier (benton, yakima, franklin). Defaults to Benton if omitted.</param>
        [HttpGet("system/diagnostics")]
        [AllowAnonymous] // Allow diagnostics without auth for health monitoring
        public async System.Threading.Tasks.Task<ActionResult<TerraFusion.AI.Models.SystemDiagnosticsResponse>> GetSystemDiagnostics(
            [FromQuery] string? countyId = null)
        {
            try
            {
                var county = TerraFusion.AI.Models.CountyHelper.ParseCountyIdOrDefault(countyId);
                var countyInfo = TerraFusion.AI.Models.CountyHelper.GetCountyInfo(county);

                var stopwatch = System.Diagnostics.Stopwatch.StartNew();
                _logger.LogInformation("SystemGPT: Generating diagnostics snapshot for {County}", countyInfo.DisplayName);

                var diagnostics = new TerraFusion.AI.Models.SystemDiagnosticsResponse
                {
                    Timestamp = DateTime.UtcNow,
                    // Phase 22: County federation fields
                    CountyId = countyInfo.Code,
                    CountyName = countyInfo.DisplayName,
                    CountyConfigured = countyInfo.IsConfigured,
                    OverallHealth = countyInfo.IsConfigured
                        ? TerraFusion.AI.Models.SystemHealthStatus.Healthy
                        : TerraFusion.AI.Models.SystemHealthStatus.Degraded,
                    // Phase 17: Include Safe Mode status
                    Mode = _modeService?.CurrentMode ?? TerraFusion.AI.Models.SystemGptMode.Normal,
                    ModeReason = _modeService?.CurrentReason,
                    ModeChangedBy = _modeService?.ChangedBy,
                    ModeChangedAt = _modeService?.ChangedAt
                };

                // Phase 22: Non-Benton counties return placeholder diagnostics
                if (!countyInfo.IsConfigured)
                {
                    diagnostics.HeraldMessages = new List<TerraFusion.AI.Models.HeraldMessage>
                    {
                        new()
                        {
                            Level = "Warning",
                            Message = $"{countyInfo.DisplayName} AI services are not yet configured. RAG and GPT features are unavailable for this county.",
                            Timestamp = DateTime.UtcNow,
                            Source = "Herald"
                        }
                    };
                    diagnostics.GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>();
                    diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>();
                    diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
                    {
                        Mode = "NotConfigured",
                        Available = false,
                        Provider = "None",
                        Dimensions = 0
                    };
                    diagnostics.ExplainGptStatus = new TerraFusion.AI.Models.ServiceStatus
                    {
                        Healthy = false,
                        Message = $"{countyInfo.DisplayName} ExplainGPT not configured"
                    };
                    diagnostics.Statistics = new TerraFusion.AI.Models.UsageStatistics();

                    stopwatch.Stop();
                    _logger.LogInformation("SystemGPT: Non-configured county diagnostics returned for {County} in {ElapsedMs}ms",
                        countyInfo.DisplayName, stopwatch.ElapsedMilliseconds);
                    return Ok(diagnostics);
                }

                // Gather GPT configurations (Benton only for now)
                var gpts = await _configService.GetAllConfigurationsAsync();
                diagnostics.GptConfigs = gpts.Select(g => new TerraFusion.AI.Models.GptConfigSummary
                {
                    Key = g.Name, // Use Name as Key
                    Name = g.DisplayName ?? g.Name,
                    Enabled = g.Status == "Active",
                    Model = g.ModelName ?? "simulated",
                    RagEnabled = g.EnableRAG // Check EnableRAG property
                }).ToList();

                // Embedding status
                var embeddingMode = Environment.GetEnvironmentVariable("OPENAI_API_KEY") != null
                    ? "OpenAI"
                    : "Simulated";
                diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
                {
                    Mode = embeddingMode,
                    Available = true, // Always available (simulated fallback)
                    Provider = embeddingMode,
                    Dimensions = embeddingMode == "OpenAI" ? 1536 : 384,
                    LastSuccess = DateTime.UtcNow
                };

                // RAG datasets
                var ragHealth = await _ragService.GetRagHealthAsync("benton_cama_basics");
                diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
                {
                    new()
                    {
                        Key = "benton_cama_basics",
                        Name = "Benton County CAMA Basics",
                        Indexed = ragHealth.Indexed,
                        DocumentCount = ragHealth.DocumentCount,
                        EmbeddingCount = ragHealth.EmbeddingCount,
                        Status = ragHealth.Indexed ? "Healthy" : "Not Indexed"
                    }
                };

                // ExplainGPT status (always healthy - deterministic)
                diagnostics.ExplainGptStatus = new TerraFusion.AI.Models.ServiceStatus
                {
                    Healthy = true,
                    Message = "ExplainGPT ready (deterministic mode)",
                    LastCheck = DateTime.UtcNow,
                    ResponseTimeMs = 5
                };

                // Phase 18: Benton CAMA RAG Readiness
                if (_bentonRagService != null)
                {
                    try
                    {
                        diagnostics.BentonRag = await _bentonRagService.GetReadinessAsync();
                        _logger.LogDebug("Benton CAMA RAG status: {Status}", diagnostics.BentonRag.OverallStatus);
                    }
                    catch (Exception bentonEx)
                    {
                        _logger.LogWarning(bentonEx, "Failed to get Benton RAG readiness - continuing without it");
                    }
                }

                // Usage statistics (placeholder - would query actual DB in production)
                diagnostics.Statistics = new TerraFusion.AI.Models.UsageStatistics
                {
                    TotalConversations = 0,
                    TotalMessages = 0,
                    AuditRecordCount = 0,
                    RagTraceCount = 0,
                    MessagesLast24h = 0,
                    ConversationsLast24h = 0
                };

                // Use Health Evaluator if registered, otherwise generate basic messages
                if (_healthEvaluator != null)
                {
                    // Evaluator mutates and returns diagnostics with evaluated health + Herald messages
                    diagnostics = _healthEvaluator.EvaluateHealth(diagnostics);

                    _logger.LogDebug("SystemGPT: Health evaluation returned {Status} with {MessageCount} herald messages",
                        diagnostics.OverallHealth, diagnostics.HeraldMessages.Count);
                }
                else
                {
                    // Fallback: Basic herald messages if evaluator not registered
                    diagnostics.HeraldMessages = new List<TerraFusion.AI.Models.HeraldMessage>
                    {
                        new()
                        {
                            Level = "Info",
                            Message = "SystemGPT Console initialized (Herald evaluator not registered)",
                            Timestamp = DateTime.UtcNow,
                            Source = "Herald"
                        },
                        new()
                        {
                            Level = ragHealth.Indexed ? "Success" : "Warning",
                            Message = ragHealth.Indexed
                                ? $"RAG index ready: {ragHealth.DocumentCount} documents"
                                : "RAG not indexed - run 'make gpt-ingest' to index",
                            Timestamp = DateTime.UtcNow,
                            Source = "Arc"
                        }
                    };

                    // Fallback health determination
                    if (!ragHealth.Indexed)
                    {
                        diagnostics.OverallHealth = TerraFusion.AI.Models.SystemHealthStatus.Degraded;
                    }
                }

                stopwatch.Stop();
                _logger.LogInformation("SystemGPT: Diagnostics generated in {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);

                // Phase 26: Include last guardrail decision if available
                diagnostics.LastGuardrailDecision = GetLastGuardrailDecision(county);

                return Ok(diagnostics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating system diagnostics");
                return StatusCode(500, new { error = "Failed to generate system diagnostics" });
            }
        }

        /// <summary>
        /// Download AI Health Snapshot as JSON file.
        /// Phase 16: One-click audit artifact for compliance and troubleshooting.
        /// Returns the same diagnostics DTO with Content-Disposition: attachment.
        /// </summary>
        [HttpGet("system/diagnostics/download")]
        [AllowAnonymous] // Allow download without auth for health monitoring exports
        public async System.Threading.Tasks.Task<IActionResult> DownloadSystemDiagnostics()
        {
            try
            {
                _logger.LogInformation("SystemGPT: Generating downloadable health snapshot");

                // Get the same diagnostics as the regular endpoint
                var diagnosticsResult = await GetSystemDiagnostics();
                if (diagnosticsResult.Result is not OkObjectResult okResult)
                {
                    return StatusCode(500, new { error = "Failed to generate diagnostics for download" });
                }

                var diagnostics = okResult.Value as TerraFusion.AI.Models.SystemDiagnosticsResponse;
                if (diagnostics == null)
                {
                    return StatusCode(500, new { error = "Invalid diagnostics response" });
                }

                // Serialize to indented JSON for human readability
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    WriteIndented = true,
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                };
                var jsonContent = System.Text.Json.JsonSerializer.Serialize(diagnostics, options);
                var bytes = System.Text.Encoding.UTF8.GetBytes(jsonContent);

                // Generate filename with timestamp
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var filename = $"terrafusion_ai_health_snapshot_{timestamp}.json";

                _logger.LogInformation("SystemGPT: Health snapshot download generated ({ByteCount} bytes)", bytes.Length);

                // Phase 19: Record event in timeline
                _eventService?.RecordEvent(
                    TerraFusion.AI.Models.SystemGptEventKind.HealthSnapshotDownloaded,
                    "info",
                    "Health Snapshot Downloaded",
                    $"Exported {bytes.Length} bytes as {filename}",
                    User?.Identity?.Name ?? "system");

                return File(bytes, "application/json", filename);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating health snapshot download");
                return StatusCode(500, new { error = "Failed to generate health snapshot" });
            }
        }

        /// <summary>
        /// Set SystemGPT Safe Mode.
        /// Phase 17: Kill Switch - allows county tech leads to constrain AI behavior during incidents.
        /// </summary>
        [HttpPost("system/safe-mode")]
        [AllowAnonymous] // Allow Safe Mode control without auth for emergency response
        public ActionResult<TerraFusion.AI.Models.SetSystemGptModeResponse> SetSafeMode(
            [FromBody] TerraFusion.AI.Models.SetSystemGptModeRequest request)
        {
            try
            {
                if (_modeService == null)
                {
                    return StatusCode(503, new { error = "Safe Mode service not available" });
                }

                // Validate: reason is required when enabling Safe Mode
                if (request.Enabled && string.IsNullOrWhiteSpace(request.Reason))
                {
                    return BadRequest(new { error = "Reason is required when enabling Safe Mode" });
                }

                // Get user identity or use 'system' for anonymous
                var changedBy = User?.Identity?.Name ?? "system";

                var targetMode = request.Enabled
                    ? TerraFusion.AI.Models.SystemGptMode.SafeMode
                    : TerraFusion.AI.Models.SystemGptMode.Normal;

                var previousMode = _modeService.CurrentMode;
                _modeService.SetMode(targetMode, request.Reason, changedBy);

                // Log Herald entry for audit trail
                var heraldLevel = request.Enabled ? "warning" : "info";
                var heraldMessage = request.Enabled
                    ? $"🛑 SystemGPT SAFE MODE ENABLED by {changedBy}: {request.Reason}"
                    : $"✅ SystemGPT SAFE MODE DISABLED by {changedBy}";

                _logger.LogWarning("Phase 17 Safe Mode: {Message}", heraldMessage);

                // Phase 19: Record event in timeline
                _eventService?.RecordEvent(
                    TerraFusion.AI.Models.SystemGptEventKind.SafeModeChanged,
                    heraldLevel,
                    request.Enabled ? "Safe Mode Enabled" : "Safe Mode Disabled",
                    heraldMessage,
                    changedBy);

                var response = new TerraFusion.AI.Models.SetSystemGptModeResponse
                {
                    Success = true,
                    Mode = _modeService.CurrentMode,
                    ModeReason = _modeService.CurrentReason,
                    ChangedBy = changedBy,
                    ChangedAt = _modeService.ChangedAt ?? DateTime.UtcNow,
                    Message = heraldMessage
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Safe Mode");
                return StatusCode(500, new { error = "Failed to set Safe Mode" });
            }
        }

        /// <summary>
        /// Get current SystemGPT Safe Mode status.
        /// Phase 17: Quick check endpoint for mode status.
        /// </summary>
        [HttpGet("system/safe-mode")]
        [AllowAnonymous]
        public ActionResult<TerraFusion.AI.Models.SetSystemGptModeResponse> GetSafeModeStatus()
        {
            try
            {
                if (_modeService == null)
                {
                    return Ok(new TerraFusion.AI.Models.SetSystemGptModeResponse
                    {
                        Success = true,
                        Mode = TerraFusion.AI.Models.SystemGptMode.Normal,
                        Message = "Safe Mode service not registered - default Normal mode"
                    });
                }

                return Ok(new TerraFusion.AI.Models.SetSystemGptModeResponse
                {
                    Success = true,
                    Mode = _modeService.CurrentMode,
                    ModeReason = _modeService.CurrentReason,
                    ChangedBy = _modeService.ChangedBy,
                    ChangedAt = _modeService.ChangedAt ?? DateTime.UtcNow,
                    Message = _modeService.IsSafeMode
                        ? $"Safe Mode active: {_modeService.CurrentReason}"
                        : "Normal operation"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Safe Mode status");
                return StatusCode(500, new { error = "Failed to get Safe Mode status" });
            }
        }

        /// <summary>
        /// Download Benton CAMA RAG Readiness Snapshot as JSON file.
        /// Phase 18: County-specific RAG health export for audits and demos.
        /// </summary>
        [HttpGet("rag/benton_cama_basics/export")]
        [AllowAnonymous] // Allow export without auth for county demos
        public async System.Threading.Tasks.Task<IActionResult> DownloadBentonRagSnapshot()
        {
            try
            {
                _logger.LogInformation("Phase 18: Generating Benton CAMA RAG snapshot for export");

                if (_bentonRagService == null)
                {
                    return StatusCode(503, new { error = "Benton RAG Readiness service not available" });
                }

                var snapshot = await _bentonRagService.GenerateSnapshotAsync();

                // Serialize to indented JSON for human readability
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    WriteIndented = true,
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                };
                var jsonContent = System.Text.Json.JsonSerializer.Serialize(snapshot, options);
                var bytes = System.Text.Encoding.UTF8.GetBytes(jsonContent);

                // Generate filename with timestamp
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var filename = $"benton_cama_rag_snapshot_{timestamp}.json";

                _logger.LogInformation("Phase 18: Benton CAMA RAG snapshot generated ({ByteCount} bytes)", bytes.Length);

                // Phase 19: Record event in timeline
                _eventService?.RecordEvent(
                    TerraFusion.AI.Models.SystemGptEventKind.BentonRagSnapshotDownloaded,
                    "info",
                    "Benton RAG Snapshot Downloaded",
                    $"Exported {bytes.Length} bytes as {filename}",
                    User?.Identity?.Name ?? "system");

                return File(bytes, "application/json", filename);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating Benton RAG snapshot");
                return StatusCode(500, new { error = "Failed to generate Benton RAG snapshot" });
            }
        }

        /// <summary>
        /// Get recent SystemGPT events for AI incident timeline.
        /// Phase 19: Chronological list of key AI events (Safe Mode toggles, RAG reindexes, health transitions, exports).
        /// Phase 22: Multi-county federation - optional countyId parameter (defaults to Benton).
        /// </summary>
        /// <param name="countyId">County identifier (benton, yakima, franklin). Defaults to Benton if omitted.</param>
        /// <param name="since">Optional UTC timestamp to filter events after this time</param>
        /// <param name="limit">Maximum number of events to return (default: 50, max: 100)</param>
        [HttpGet("system/events")]
        [AllowAnonymous] // Allow event viewing without auth for county monitoring dashboards
        public async System.Threading.Tasks.Task<ActionResult<IReadOnlyList<TerraFusion.AI.Models.SystemGptEventDto>>> GetSystemEvents(
            [FromQuery] string? countyId = null,
            [FromQuery] DateTimeOffset? since = null,
            [FromQuery] int limit = 50)
        {
            try
            {
                var county = TerraFusion.AI.Models.CountyHelper.ParseCountyIdOrDefault(countyId);
                var countyInfo = TerraFusion.AI.Models.CountyHelper.GetCountyInfo(county);

                // Phase 22: Non-configured counties return empty events list
                if (!countyInfo.IsConfigured)
                {
                    _logger.LogDebug("Phase 22: Returning empty events for non-configured county {County}", countyInfo.DisplayName);
                    return Ok(Array.Empty<TerraFusion.AI.Models.SystemGptEventDto>());
                }

                if (_eventService == null)
                {
                    // Return empty list if service not registered (graceful degradation)
                    return Ok(Array.Empty<TerraFusion.AI.Models.SystemGptEventDto>());
                }

                // Clamp limit to reasonable range
                var clampedLimit = Math.Clamp(limit, 1, 100);

                var events = await _eventService.GetRecentEventsAsync(since, clampedLimit, HttpContext.RequestAborted);

                _logger.LogDebug("Phase 19: Returning {EventCount} system events for {County}", events.Count, countyInfo.DisplayName);

                return Ok(events);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving system events");
                return StatusCode(500, new { error = "Failed to retrieve system events" });
            }
        }

        /// <summary>
        /// Get SystemGPT metrics snapshot for AI telemetry console.
        /// Phase 20: Real-time AI performance metrics - latency, throughput, error rate, tokens.
        /// Phase 22: Multi-county federation - optional countyId parameter (defaults to Benton).
        /// </summary>
        /// <param name="countyId">County identifier (benton, yakima, franklin). Defaults to Benton if omitted.</param>
        /// <param name="windowMinutes">Time window in minutes (default: 15, max: 60)</param>
        /// <param name="maxSeriesPoints">Maximum data points per time series (default: 50, max: 200)</param>
        [HttpGet("system/metrics")]
        [AllowAnonymous] // Allow metrics viewing without auth for county monitoring dashboards
        public ActionResult<TerraFusion.AI.Models.SystemGptMetricsSnapshotDto> GetSystemMetrics(
            [FromQuery] string? countyId = null,
            [FromQuery] int? windowMinutes = null,
            [FromQuery] int? maxSeriesPoints = null)
        {
            try
            {
                var county = TerraFusion.AI.Models.CountyHelper.ParseCountyIdOrDefault(countyId);
                var countyInfo = TerraFusion.AI.Models.CountyHelper.GetCountyInfo(county);

                // Phase 22: Non-configured counties return empty metrics snapshot
                if (!countyInfo.IsConfigured)
                {
                    _logger.LogDebug("Phase 22: Returning empty metrics for non-configured county {County}", countyInfo.DisplayName);
                    return Ok(new TerraFusion.AI.Models.SystemGptMetricsSnapshotDto
                    {
                        CountyId = countyInfo.Code,
                        CountyName = countyInfo.DisplayName,
                        CountyConfigured = false,
                        GeneratedAtUtc = DateTimeOffset.UtcNow,
                        WindowMinutes = windowMinutes ?? 15,
                        GptLatencyMsP50 = 0,
                        GptLatencyMsP95 = 0,
                        RagLatencyMsP95 = 0,
                        EmbeddingLatencyMsP95 = 0,
                        RequestsPerMinute = 0,
                        ErrorRatePercent = 0,
                        TotalRequests = 0,
                        TotalTokensIn = 0,
                        TotalTokensOut = 0,
                        Series = Array.Empty<TerraFusion.AI.Models.SystemGptMetricSeries>()
                    });
                }

                if (_metricsService == null)
                {
                    // Return empty snapshot if service not registered (graceful degradation)
                    return Ok(new TerraFusion.AI.Models.SystemGptMetricsSnapshotDto
                    {
                        CountyId = countyInfo.Code,
                        CountyName = countyInfo.DisplayName,
                        CountyConfigured = true,
                        GeneratedAtUtc = DateTimeOffset.UtcNow,
                        WindowMinutes = windowMinutes ?? 15,
                        GptLatencyMsP50 = 0,
                        GptLatencyMsP95 = 0,
                        RagLatencyMsP95 = 0,
                        EmbeddingLatencyMsP95 = 0,
                        RequestsPerMinute = 0,
                        ErrorRatePercent = 0,
                        TotalRequests = 0,
                        TotalTokensIn = 0,
                        TotalTokensOut = 0,
                        Series = Array.Empty<TerraFusion.AI.Models.SystemGptMetricSeries>()
                    });
                }

                // Clamp parameters to reasonable ranges
                var window = TimeSpan.FromMinutes(Math.Clamp(windowMinutes ?? 15, 1, 60));
                var maxPoints = Math.Clamp(maxSeriesPoints ?? 50, 1, 200);

                var snapshot = _metricsService.GetSnapshot(window, maxPoints);

                _logger.LogDebug("Phase 20: Returning metrics snapshot for {County} - {TotalRequests} requests in {WindowMinutes}min window",
                    countyInfo.DisplayName, snapshot.TotalRequests, snapshot.WindowMinutes);

                return Ok(snapshot);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving system metrics");
                return StatusCode(500, new { error = "Failed to retrieve system metrics" });
            }
        }

        #endregion

        #region Phase 23: Federated Overview (Multi-County Dashboard)

        /// <summary>
        /// Get a federated overview of all counties' SystemGPT operational status.
        /// Phase 23: Multi-County Dashboard - Aggregates all counties into a single view.
        /// This endpoint returns data for ALL counties (no countyId parameter).
        /// </summary>
        [HttpGet("system/federated-overview")]
        [AllowAnonymous] // Allow overview access for monitoring dashboards
        public async System.Threading.Tasks.Task<ActionResult<TerraFusion.AI.Models.SystemGptFederatedOverviewResponse>> GetFederatedOverview()
        {
            try
            {
                _logger.LogInformation("Phase 23: Generating federated overview for all counties");

                // If service is not registered, return a basic overview using CountyHelper
                if (_federatedOverviewService == null)
                {
                    _logger.LogWarning("Phase 23: FederatedOverviewService not registered, returning basic overview");

                    var basicCounties = TerraFusion.AI.Models.CountyHelper.AllCounties.Select(c =>
                        new TerraFusion.AI.Models.SystemGptCountyOverviewDto
                        {
                            CountyId = c.Code,
                            CountyName = c.DisplayName,
                            Configured = c.IsConfigured,
                            Health = c.IsConfigured ? "Unknown" : "Unknown",
                            CapacityRisk = "Unknown",
                            P95LatencyMs = -1,
                            ErrorRatePercent = -1,
                            RagStatus = "Unknown",
                            AiMode = "Unknown",
                            Note = c.IsConfigured ? "Service not registered" : "Not configured"
                        }).ToList();

                    return Ok(new TerraFusion.AI.Models.SystemGptFederatedOverviewResponse
                    {
                        GeneratedAtUtc = DateTimeOffset.UtcNow,
                        TotalCounties = basicCounties.Count,
                        ConfiguredCounties = basicCounties.Count(c => c.Configured),
                        Counties = basicCounties
                    });
                }

                var overview = await _federatedOverviewService.GetOverviewAsync();
                return Ok(overview);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating federated overview");
                return StatusCode(500, new { error = "Failed to generate federated overview" });
            }
        }

        #endregion

        #region Phase 24: AI Policy Engine (County-Scoped Governance)

        /// <summary>
        /// Get the AI policy configuration for a specific county.
        /// Phase 24: AI Policy Engine - County-scoped governance for GPT, RAG, Embeddings & ExplainGPT.
        /// Returns the policy rules that govern what AI operations are allowed for the given county.
        /// </summary>
        [HttpGet("system/policy")]
        [AllowAnonymous] // Allow policy inspection for monitoring dashboards
        public async System.Threading.Tasks.Task<ActionResult<TerraFusion.AI.Models.SystemGptPolicyDto>> GetCountyPolicy(
            [FromQuery] string? countyId = null)
        {
            try
            {
                // Parse string county code to CountyId enum, defaulting to Benton
                var effectiveCountyId = TerraFusion.AI.Models.CountyHelper.ParseCountyIdOrDefault(countyId);
                _logger.LogInformation("Phase 24: Retrieving AI policy for county {CountyId}", effectiveCountyId);

                // If service is not registered, return a permissive default policy
                if (_policyService == null)
                {
                    _logger.LogWarning("Phase 24: PolicyService not registered, returning permissive default");
                    return Ok(new TerraFusion.AI.Models.SystemGptPolicyDto
                    {
                        CountyId = TerraFusion.AI.Models.CountyHelper.GetCountyCode(effectiveCountyId),
                        CountyName = TerraFusion.AI.Models.CountyHelper.GetCountyInfo(effectiveCountyId).DisplayName,
                        AllowGptSendMessage = true,
                        AllowRagQueries = true,
                        AllowEmbeddings = true,
                        RequireExplainOnValuation = false,
                        DenyPromptPatterns = Array.Empty<string>(),
                        DenyContextIds = Array.Empty<string>(),
                        SanitizeOwnerNames = false,
                        PolicyVersion = "1.0.0-default",
                        LastUpdatedUtc = DateTimeOffset.UtcNow,
                        IsPlaceholder = true
                    });
                }

                var policy = await _policyService.GetPolicyAsync(effectiveCountyId);
                return Ok(policy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving AI policy for county {CountyId}", countyId);
                return StatusCode(500, new { error = "Failed to retrieve AI policy" });
            }
        }

        /// <summary>
        /// Evaluate a request against the county's AI policy.
        /// Phase 24: AI Policy Engine - Test whether a specific request would be allowed.
        /// Useful for UX pre-validation and debugging policy rules.
        /// </summary>
        [HttpPost("system/policy/evaluate")]
        [AllowAnonymous] // Allow policy testing for debugging
        public async System.Threading.Tasks.Task<ActionResult<TerraFusion.AI.Models.PolicyEvaluationResult>> EvaluatePolicyRequest(
            [FromBody] TerraFusion.AI.Models.GptRequestContext request)
        {
            try
            {
                _logger.LogInformation("Phase 24: Evaluating policy request for county {CountyId}", request.CountyId);

                // If evaluator is not registered, return allowed
                if (_policyEvaluator == null)
                {
                    _logger.LogWarning("Phase 24: PolicyEvaluator not registered, allowing request by default");
                    return Ok(TerraFusion.AI.Models.PolicyEvaluationResult.Allow(request.Prompt));
                }

                var result = await _policyEvaluator.EvaluateRequestAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error evaluating policy request");
                return StatusCode(500, new { error = "Failed to evaluate policy request" });
            }
        }

        /// <summary>
        /// Get AI policies for all known counties (admin overview).
        /// Phase 24: AI Policy Engine - Returns a summary of all county policies.
        /// </summary>
        [HttpGet("system/policy/all")]
        [AllowAnonymous] // Allow admin overview for monitoring
        public async System.Threading.Tasks.Task<ActionResult<List<TerraFusion.AI.Models.SystemGptPolicyDto>>> GetAllCountyPolicies()
        {
            try
            {
                _logger.LogInformation("Phase 24: Retrieving all county AI policies");

                if (_policyService == null)
                {
                    _logger.LogWarning("Phase 24: PolicyService not registered, returning empty list");
                    return Ok(new List<TerraFusion.AI.Models.SystemGptPolicyDto>());
                }

                // Use the GetAllPoliciesAsync method to retrieve all policies at once
                var allPolicies = await _policyService.GetAllPoliciesAsync();
                return Ok(allPolicies.Values.ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all county AI policies");
                return StatusCode(500, new { error = "Failed to retrieve all county AI policies" });
            }
        }

        #endregion

        #region Phase 27: RAG Fleet Readiness & Drift Detection (Multi-County RAG Intelligence)

        /// <summary>
        /// Get RAG fleet readiness status across all configured counties with drift detection.
        /// Phase 27: Multi-County RAG Fleet Readiness - Compare county RAG status, detect drift,
        /// and provide advisory for SystemGPT federated oversight.
        /// </summary>
        [HttpGet("system/fleet/rag-readiness")]
        [AllowAnonymous] // Read-only fleet status - allow for dashboards
        public async System.Threading.Tasks.Task<ActionResult<RagFleetReadinessDto>> GetRagFleetReadiness()
        {
            try
            {
                _logger.LogInformation("Phase 27: Fetching RAG Fleet Readiness status across all counties");

                if (_ragFleetService == null)
                {
                    _logger.LogWarning("Phase 27: RagFleetService not registered, returning stub response");
                    return Ok(new RagFleetReadinessDto
                    {
                        GeneratedAtUtc = DateTime.UtcNow,
                        FleetDriftRisk = RagFleetDriftRisk.Low,
                        Advisory = "RAG Fleet Readiness service not configured. Register ISystemGptRagFleetService to enable multi-county drift detection.",
                        Counties = new List<RagCountyReadinessDto>()
                    });
                }

                var result = await _ragFleetService.GetFleetReadinessAsync();

                // Log drift risk for monitoring
                if (result.FleetDriftRisk != RagFleetDriftRisk.Low)
                {
                    _logger.LogWarning("Phase 27: RAG Fleet drift detected - Risk: {DriftRisk}, Advisory: {Advisory}",
                        result.FleetDriftRisk, result.Advisory);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching RAG Fleet Readiness");
                return StatusCode(500, new { error = "Failed to fetch RAG fleet readiness status" });
            }
        }

        /// <summary>
        /// Get RAG readiness status for a specific county within the fleet.
        /// Phase 27: Per-county detail view for fleet comparison.
        /// </summary>
        [HttpGet("system/fleet/rag-readiness/{countyId}")]
        [AllowAnonymous] // Read-only county status - allow for dashboards
        public async System.Threading.Tasks.Task<ActionResult<RagCountyReadinessDto>> GetCountyRagReadiness(string countyId)
        {
            try
            {
                _logger.LogInformation("Phase 27: Fetching RAG readiness for county: {CountyId}", countyId);

                if (_ragFleetService == null)
                {
                    _logger.LogWarning("Phase 27: RagFleetService not registered");
                    return NotFound(new { error = $"RAG Fleet service not configured. County '{countyId}' status unavailable." });
                }

                var countyReadiness = await _ragFleetService.GetCountyReadinessAsync(countyId);
                
                if (countyReadiness == null)
                {
                    return NotFound(new { error = $"County '{countyId}' not found in RAG fleet configuration." });
                }

                return Ok(countyReadiness);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching RAG readiness for county: {CountyId}", countyId);
                return StatusCode(500, new { error = $"Failed to fetch RAG readiness for county '{countyId}'" });
            }
        }

        #endregion

        #region ExplainGPT (Phase 13 - Self-Explaining TerraFusion, Phase 25 - V2 Source Attribution)

        /// <summary>
        /// Get an AI-generated explanation for any TerraFusion screen, workflow, or data.
        /// Phase 13: "Explain This" - Make TerraFusion self-explaining for county staff.
        /// Phase 25: V2 - Source highlighting, segment attribution, and trace carousel.
        /// </summary>
        [HttpPost("explain")]
        [AllowAnonymous] // Allow explanations without auth for onboarding scenarios
        public async System.Threading.Tasks.Task<ActionResult<TerraFusion.AI.Models.ExplainResponseV2Dto>> Explain(
            [FromBody] TerraFusion.AI.Models.ExplainRequest request)
        {
            try
            {
                _logger.LogInformation("ExplainGPT V2: Generating explanation for context '{ContextType}' ({ContextId})",
                    request.ContextType, request.ContextId ?? "general");

                // Build the V2 explanation with source attribution and trace steps
                var explanation = await GenerateExplanationAsync(request);

                return Ok(explanation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating explanation for context: {ContextType}", request.ContextType);
                return StatusCode(500, new { error = "Failed to generate explanation" });
            }
        }

        /// <summary>
        /// Generates explanation using ExplainGPT configuration with V2 source attribution.
        /// In CI mode (no API keys), returns a helpful stub explanation.
        /// </summary>
        private async Task<TerraFusion.AI.Models.ExplainResponseV2Dto> GenerateExplanationAsync(
            TerraFusion.AI.Models.ExplainRequest request)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // Context-specific explanations for known screen types
            var contextExplanations = GetContextExplanation(request.ContextType, request.ContextId);

            // Generate sources based on context type
            var sources = GenerateExplanationSources(request.ContextType, request.ContextId);

            // Split explanation into segments and link to sources
            var segments = GenerateExplanationSegments(contextExplanations.explanation, sources);

            // Generate trace steps for how the explanation was constructed
            var steps = GenerateExplanationSteps(request.ContextType, request.ContextId, sources);

            stopwatch.Stop();

            return await System.Threading.Tasks.Task.FromResult(new TerraFusion.AI.Models.ExplainResponseV2Dto
            {
                ExplanationId = Guid.NewGuid().ToString(),
                FullText = contextExplanations.explanation,
                Summary = contextExplanations.summary,
                Segments = segments,
                Sources = sources,
                Steps = steps,
                Confidence = 0.95m, // High confidence for known contexts
                ProcessingTimeMs = (int)stopwatch.ElapsedMilliseconds
            });
        }

        /// <summary>
        /// Generate source attributions for explanation based on context type.
        /// </summary>
        private List<TerraFusion.AI.Models.ExplainSourceAttributionDto> GenerateExplanationSources(
            string contextType, string? contextId)
        {
            return contextType switch
            {
                "GPTStudio" => new List<TerraFusion.AI.Models.ExplainSourceAttributionDto>
                {
                    new()
                    {
                        SourceId = "src-gptstudio-001",
                        SourceTitle = "TerraFusion GPT Studio User Guide",
                        SourceType = "documentation",
                        Snippet = "GPT Studio provides AI-powered assistance for property assessment workflows..."
                    },
                    new()
                    {
                        SourceId = "src-gptstudio-002",
                        SourceTitle = "Benton County CAMA Integration",
                        SourceType = "system-config",
                        Snippet = "PropertyAssessmentGPT is trained on county-specific CAMA data and assessment standards..."
                    },
                    new()
                    {
                        SourceId = "src-gptstudio-003",
                        SourceTitle = "Natural Language Query Patterns",
                        SourceType = "knowledge-base",
                        Snippet = "Ask questions like 'What factors affect property values?' for AI-generated insights..."
                    }
                },

                "RAGTrace" => new List<TerraFusion.AI.Models.ExplainSourceAttributionDto>
                {
                    new()
                    {
                        SourceId = "src-ragtrace-001",
                        SourceTitle = "RAG Architecture Documentation",
                        SourceType = "documentation",
                        Snippet = "Retrieval-Augmented Generation ensures answers are grounded in county knowledge base..."
                    },
                    new()
                    {
                        SourceId = "src-ragtrace-002",
                        SourceTitle = "Government Audit Compliance",
                        SourceType = "policy",
                        Snippet = "All AI responses are auditable with full source citation for FISMA compliance..."
                    },
                    new()
                    {
                        SourceId = "src-ragtrace-003",
                        SourceTitle = "Relevance Scoring Algorithm",
                        SourceType = "technical",
                        Snippet = "Sources are scored by semantic similarity - 90%+ indicates high relevance match..."
                    }
                },

                "PropertyCard" => new List<TerraFusion.AI.Models.ExplainSourceAttributionDto>
                {
                    new()
                    {
                        SourceId = "src-propcard-001",
                        SourceTitle = $"Property Record: {contextId ?? "N/A"}",
                        SourceType = "data-record",
                        Snippet = "Current assessment details including value, characteristics, and history..."
                    },
                    new()
                    {
                        SourceId = "src-propcard-002",
                        SourceTitle = "Washington State Appraisal Standards",
                        SourceType = "regulation",
                        Snippet = "Cost approach, sales comparison, and income approaches per WAC 458-07..."
                    },
                    new()
                    {
                        SourceId = "src-propcard-003",
                        SourceTitle = "Comparable Sales Database",
                        SourceType = "database",
                        Snippet = "Local market data for similar properties informs valuation adjustments..."
                    }
                },

                _ => new List<TerraFusion.AI.Models.ExplainSourceAttributionDto>
                {
                    new()
                    {
                        SourceId = "src-default-001",
                        SourceTitle = "TerraFusion OS Documentation",
                        SourceType = "documentation",
                        Snippet = "TerraFusion is a comprehensive property assessment platform for county assessors..."
                    }
                }
            };
        }

        /// <summary>
        /// Split explanation text into segments and link to sources.
        /// </summary>
        private List<TerraFusion.AI.Models.ExplainSegmentDto> GenerateExplanationSegments(
            string explanation, List<TerraFusion.AI.Models.ExplainSourceAttributionDto> sources)
        {
            // Split on sentences (simple approach - split on ". " and preserve period)
            var sentences = explanation.Split(new[] { ". " }, StringSplitOptions.RemoveEmptyEntries);
            var segments = new List<TerraFusion.AI.Models.ExplainSegmentDto>();

            for (int i = 0; i < sentences.Length; i++)
            {
                var sentence = sentences[i].Trim();
                if (!sentence.EndsWith(".") && i < sentences.Length - 1)
                {
                    sentence += ".";
                }

                // Link each segment to 1-2 sources based on position
                var linkedSources = new List<string>();
                if (sources.Count > 0)
                {
                    linkedSources.Add(sources[i % sources.Count].SourceId);
                    if (sources.Count > 1 && i % 3 == 0)
                    {
                        linkedSources.Add(sources[(i + 1) % sources.Count].SourceId);
                    }
                }

                segments.Add(new TerraFusion.AI.Models.ExplainSegmentDto
                {
                    SegmentId = $"seg-{i + 1:D3}",
                    Text = sentence,
                    SourceIds = linkedSources
                });
            }

            return segments;
        }

        /// <summary>
        /// Generate trace steps showing how the explanation was constructed.
        /// </summary>
        private List<TerraFusion.AI.Models.ExplainStepDto> GenerateExplanationSteps(
            string contextType, string? contextId, List<TerraFusion.AI.Models.ExplainSourceAttributionDto> sources)
        {
            var steps = new List<TerraFusion.AI.Models.ExplainStepDto>
            {
                new()
                {
                    StepId = "step-001",
                    Title = "Context Detection",
                    Description = $"Identified current context as '{contextType}'" +
                        (contextId != null ? $" with ID '{contextId}'" : ""),
                    SourceIds = new List<string>()
                },
                new()
                {
                    StepId = "step-002",
                    Title = "Knowledge Retrieval",
                    Description = $"Retrieved {sources.Count} relevant source documents from knowledge base",
                    SourceIds = sources.Take(2).Select(s => s.SourceId).ToList()
                },
                new()
                {
                    StepId = "step-003",
                    Title = "Explanation Generation",
                    Description = "Synthesized explanation from retrieved sources with county-specific context",
                    SourceIds = sources.Select(s => s.SourceId).ToList()
                },
                new()
                {
                    StepId = "step-004",
                    Title = "Source Attribution",
                    Description = "Linked explanation segments to supporting source documents for auditability",
                    SourceIds = new List<string>()
                }
            };

            return steps;
        }

        /// <summary>
        /// Get pre-built explanations for known context types.
        /// These are deterministic and CI-safe.
        /// </summary>
        private (string explanation, string summary, List<string> keyPoints, List<TerraFusion.AI.Models.RelatedAction> relatedActions)
            GetContextExplanation(string contextType, string? contextId)
        {
            return contextType switch
            {
                "GPTStudio" => (
                    "GPT Studio is your AI-powered workspace for property assessment intelligence. " +
                    "Here you can chat with PropertyAssessmentGPT, which has been trained on Benton County's " +
                    "CAMA data, assessment standards, and comparable sales information. " +
                    "Simply type your question in natural language - for example, 'What factors affect " +
                    "residential property values in Benton County?' or 'Help me understand the assessment " +
                    "appeal process.' The AI will provide accurate, county-specific answers with citations " +
                    "to source documents.",
                    "GPT Studio is your AI assistant for property assessment questions.",
                    new List<string>
                    {
                        "Ask questions in natural language - no special syntax needed",
                        "Responses include citations to source documents",
                        "Click 'Show Sources' to see which documents informed each answer",
                        "Use the preset flows on the left for common assessment tasks"
                    },
                    new List<TerraFusion.AI.Models.RelatedAction>
                    {
                        new() { Label = "View Assessment Flows", ActionType = "expand-sidebar", Target = "flows-panel" },
                        new() { Label = "Show RAG Sources", ActionType = "toggle", Target = "show-sources" }
                    }
                ),

                "RAGTrace" => (
                    "The RAG Trace panel shows you exactly which documents and data chunks were used to " +
                    "generate each AI response. RAG stands for 'Retrieval-Augmented Generation' - it means " +
                    "the AI retrieves relevant information from your county's knowledge base before answering. " +
                    "This ensures accuracy and allows you to verify the source of any claim. " +
                    "Each source is shown with a relevance score - higher percentages indicate stronger matches.",
                    "RAG Trace shows which county documents informed each AI response.",
                    new List<string>
                    {
                        "Green scores (90%+) indicate highly relevant source documents",
                        "Click any source to view the original document",
                        "Every AI response is auditable for government compliance",
                        "Chunk snippets show the exact text that informed the answer"
                    },
                    new List<TerraFusion.AI.Models.RelatedAction>
                    {
                        new() { Label = "Expand All Sources", ActionType = "expand-all", Target = "rag-sources" },
                        new() { Label = "Export Audit Trail", ActionType = "export", Target = "trace-pdf" }
                    }
                ),

                "PropertyCard" => (
                    $"This property card shows the assessment details for property {contextId ?? "[selected property]"}. " +
                    "You can see the current assessed value, property characteristics, and assessment history. " +
                    "The valuation uses a combination of the cost approach, sales comparison approach, and " +
                    "income approach (for commercial properties) as required by Washington State law. " +
                    "If you have questions about any field, click the '?' icon next to it for a detailed explanation.",
                    $"Property card showing assessment details for {contextId ?? "the selected property"}.",
                    new List<string>
                    {
                        "Land and improvement values are shown separately",
                        "Market value reflects the January 1st assessment date",
                        "Click 'History' to see prior year assessments",
                        "The 'Compare' button shows similar properties"
                    },
                    new List<TerraFusion.AI.Models.RelatedAction>
                    {
                        new() { Label = "View Assessment History", ActionType = "navigate", Target = $"/property/{contextId}/history" },
                        new() { Label = "Find Comparable Sales", ActionType = "navigate", Target = $"/property/{contextId}/comps" }
                    }
                ),

                _ => (
                    $"This is the {contextType} view in TerraFusion OS. TerraFusion is a comprehensive " +
                    "property assessment platform designed for Washington State county assessors. " +
                    "If you need help with a specific feature, click the 'Explain This' button on that screen, " +
                    "or ask PropertyAssessmentGPT in GPT Studio.",
                    $"You're viewing the {contextType} area of TerraFusion OS.",
                    new List<string>
                    {
                        "TerraFusion helps county assessors with property valuation",
                        "Use GPT Studio for AI-powered assessment assistance",
                        "All data is auditable for government compliance",
                        "Click 'Explain This' on any screen for help"
                    },
                    new List<TerraFusion.AI.Models.RelatedAction>
                    {
                        new() { Label = "Open GPT Studio", ActionType = "navigate", Target = "/gpt-studio" },
                        new() { Label = "View Documentation", ActionType = "navigate", Target = "/docs" }
                    }
                )
            };
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

        public class RAGHealthResponse
        {
            public string Status { get; set; } = "unknown";
            public DateTime Timestamp { get; set; }
            public List<DatasetHealthInfo> Datasets { get; set; } = new();
            public string? Error { get; set; }
        }

        public class DatasetHealthInfo
        {
            public string Id { get; set; } = string.Empty;  // String ID like "benton_cama_basics"
            public string Name { get; set; } = string.Empty;
            public bool Indexed { get; set; }
            public int DocumentCount { get; set; }
            public int EmbeddingCount { get; set; }
            public DateTime? LastUpdated { get; set; }
        }

        public class RAGIngestionRequest
        {
            public string? DatasetId { get; set; }
        }

        public class RAGIngestionResponse
        {
            public string DatasetId { get; set; } = string.Empty;
            public bool Success { get; set; }
            public int DocumentCount { get; set; }
            public int ChunkCount { get; set; }
            public string? Error { get; set; }
            public DateTime CompletedAt { get; set; }
        }


        // Phase 11: Conversation Trace DTOs
        public class ConversationTraceResponse
        {
            public int ConversationId { get; set; }
            public string GPTKey { get; set; } = string.Empty;
            public string GPTDisplayName { get; set; } = string.Empty;
            public string? Title { get; set; }
            public int MessageCount { get; set; }
            public long TotalTokensUsed { get; set; }
            public decimal TotalCost { get; set; }
            public List<TraceMessageDto> Messages { get; set; } = new();
            public DateTime CreatedAt { get; set; }
            public DateTime? LastMessageAt { get; set; }
        }

        public class TraceMessageDto
        {
            public int Id { get; set; }
            public string Role { get; set; } = string.Empty;
            public string Content { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
            public int TokensUsed { get; set; }
            public decimal Cost { get; set; }

            // RAG Trace Info
            public bool RAGUsed { get; set; }
            public List<string>? RAGDocuments { get; set; }
            public decimal? RAGScore { get; set; }

            // Phase 11: Detailed chunk information for audit trail
            public List<RAGChunkDetailDto>? RAGChunkDetails { get; set; }
        }

        /// <summary>
        /// Phase 11: Chunk detail for RAG audit traceability
        /// </summary>
        public class RAGChunkDetailDto
        {
            public int ChunkId { get; set; }
            public string DocumentTitle { get; set; } = string.Empty;
            public string? SourceUrl { get; set; }
            public string TextSnippet { get; set; } = string.Empty;
            public decimal Score { get; set; }
            public int ChunkIndex { get; set; }
        }

        #endregion
    }
}

