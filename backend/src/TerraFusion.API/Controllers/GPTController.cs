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

