// TerraFusionGPT Suite: GPT Orchestration Service Implementation
// Elite Government OS Engineering - AI Platform

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Data; // Extension methods for DbContext
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TaskAsync = System.Threading.Tasks.Task;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Service for orchestrating GPT operations - message routing, cost tracking, conversation management
    /// </summary>
    public class GPTOrchestrationService : IGPTOrchestrationService
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<GPTOrchestrationService> _logger;
        private readonly IRAGService _ragService;

        // Token pricing per 1M tokens (in dollars)
        private static readonly Dictionary<string, (decimal Prompt, decimal Completion)> TokenPricing = new()
        {
            // OpenAI
            { "OpenAI:gpt-4o", (5.00m, 15.00m) },
            { "OpenAI:gpt-4-turbo", (10.00m, 30.00m) },
            { "OpenAI:gpt-4", (30.00m, 60.00m) },
            { "OpenAI:gpt-3.5-turbo", (0.50m, 1.50m) },

            // Anthropic
            { "Anthropic:claude-sonnet-3.5", (3.00m, 15.00m) },
            { "Anthropic:claude-opus-3", (15.00m, 75.00m) },
            { "Anthropic:claude-haiku-3", (0.25m, 1.25m) },

            // Azure (same as OpenAI)
            { "Azure:gpt-4o", (5.00m, 15.00m) },
            { "Azure:gpt-4-turbo", (10.00m, 30.00m) },
            { "Azure:gpt-3.5-turbo", (0.50m, 1.50m) },

            // Local (free)
            { "Local:llama-3", (0m, 0m) },
            { "Local:mistral", (0m, 0m) }
        };

        private readonly IEmbeddingService _embeddingService;

        public GPTOrchestrationService(
            TerraFusionDbContext context,
            ILogger<GPTOrchestrationService> logger,
            IRAGService ragService,
            IEmbeddingService embeddingService)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _ragService = ragService ?? throw new ArgumentNullException(nameof(ragService));
            _embeddingService = embeddingService ?? throw new ArgumentNullException(nameof(embeddingService));
        }

        public async System.Threading.Tasks.Task<GPTMessage> SendMessageAsync(
            int gptConfigId,
            int conversationId,
            string userMessage,
            string userId,
            int countyId)
        {
            try
            {
                _logger.LogInformation("Sending message to GPT {GPTId} in conversation {ConversationId}",
                    gptConfigId, conversationId);

                // Get GPT configuration
                var gptConfig = await _context.GPTConfigurations().FindAsync(gptConfigId);
                if (gptConfig == null)
                {
                    throw new InvalidOperationException($"GPT configuration {gptConfigId} not found");
                }

                // Get conversation
                var conversation = await _context.GPTConversations().FindAsync(conversationId);
                if (conversation == null)
                {
                    throw new InvalidOperationException($"Conversation {conversationId} not found");
                }

                // Create user message
                var userMessageEntity = new GPTMessage
                {
                    ConversationId = conversationId,
                    Role = "user",
                    Content = userMessage,
                    CreatedAt = DateTime.UtcNow
                };

                _context.GPTMessages().Add(userMessageEntity);
                await _context.SaveChangesAsync();

                // Get conversation history for context
                var history = await GetConversationHistoryAsync(conversationId, limit: 10);

                // Augment with RAG if enabled (with timing for audit)
                string? ragContext = null;
                List<string>? ragDocuments = null;
                decimal? ragScore = null;
                int? ragRetrievalTimeMs = null;
                int ragChunksRetrieved = 0;
                List<RAGChunkDetail>? ragChunkDetails = null; // Phase 11: Chunk details for audit

                if (gptConfig.EnableRAG && gptConfig.RAGDatasetId.HasValue)
                {
                    var ragStartTime = System.Diagnostics.Stopwatch.StartNew();

                    var ragResult = await _ragService.GetRelevantContextAsync(
                        gptConfig.RAGDatasetId.Value,
                        userMessage,
                        gptConfig.RAGTopK);

                    ragStartTime.Stop();
                    ragRetrievalTimeMs = (int)ragStartTime.ElapsedMilliseconds;

                    ragContext = ragResult.Context;
                    ragDocuments = ragResult.DocumentIds;
                    ragScore = ragResult.AverageScore;
                    ragChunksRetrieved = ragResult.ChunksRetrieved;
                    ragChunkDetails = ragResult.ChunkDetails; // Phase 11: Capture chunk details

                    _logger.LogInformation("RAG context retrieved: {DocumentCount} documents, {ChunkCount} chunks, score: {Score}, time: {TimeMs}ms",
                        ragDocuments.Count, ragChunkDetails?.Count ?? 0, ragScore, ragRetrievalTimeMs);
                }

                // Call LLM provider (with timing for audit)
                var llmStartTime = System.Diagnostics.Stopwatch.StartNew();
                var (assistantMessage, promptTokens, completionTokens, responseTime) =
                    await CallLLMProviderAsync(
                        gptConfig,
                        history,
                        userMessage,
                        ragContext);
                llmStartTime.Stop();
                var llmGenerationTimeMs = (int)llmStartTime.ElapsedMilliseconds;

                // Calculate cost
                var totalTokens = promptTokens + completionTokens;
                var cost = await CalculateCostAsync(
                    gptConfig.ModelProvider,
                    gptConfig.ModelName,
                    promptTokens,
                    completionTokens);

                // Create assistant message
                var assistantMessageEntity = new GPTMessage
                {
                    ConversationId = conversationId,
                    Role = "assistant",
                    Content = assistantMessage,
                    PromptTokens = promptTokens,
                    CompletionTokens = completionTokens,
                    TotalTokens = totalTokens,
                    Cost = cost,
                    ModelUsed = gptConfig.ModelName,
                    Provider = gptConfig.ModelProvider,
                    ResponseTime = responseTime,
                    RAGDocumentsUsed = ragDocuments != null ? JsonSerializer.Serialize(ragDocuments) : null,
                    RAGScore = ragScore,
                    FinishReason = "stop",
                    CreatedAt = DateTime.UtcNow
                };

                _context.GPTMessages().Add(assistantMessageEntity);

                // Update conversation statistics
                conversation.TotalMessages += 2; // user + assistant
                conversation.TotalTokensUsed += totalTokens;
                conversation.TotalCost += cost;
                conversation.LastMessageAt = DateTime.UtcNow;
                conversation.UpdatedAt = DateTime.UtcNow;

                // Record usage metric
                var usageMetric = new GPTUsageMetric
                {
                    GPTConfigurationId = gptConfigId,
                    ConversationId = conversationId,
                    MessageId = assistantMessageEntity.Id,
                    UserId = userId,
                    CountyId = countyId,
                    Provider = gptConfig.ModelProvider,
                    ModelName = gptConfig.ModelName,
                    PromptTokens = promptTokens,
                    CompletionTokens = completionTokens,
                    TotalTokens = totalTokens,
                    PromptTokenCost = await CalculateCostAsync(gptConfig.ModelProvider, gptConfig.ModelName, promptTokens, 0),
                    CompletionTokenCost = await CalculateCostAsync(gptConfig.ModelProvider, gptConfig.ModelName, 0, completionTokens),
                    TotalCost = cost,
                    ResponseTime = responseTime,
                    Success = true,
                    Timestamp = DateTime.UtcNow
                };

                _context.GPTUsageMetrics().Add(usageMetric);

                // Phase 11: Create GPTAudit record for RAG traceability
                var auditRecord = new GPTAudit
                {
                    MessageId = assistantMessageEntity.Id,
                    ConversationId = conversationId,
                    GPTConfigurationId = gptConfigId,
                    UserId = userId,
                    CountyId = countyId,
                    RAGUsed = gptConfig.EnableRAG && ragDocuments != null && ragDocuments.Count > 0,
                    RAGDatasetId = gptConfig.RAGDatasetId,
                    RAGDocumentIds = ragDocuments != null ? JsonSerializer.Serialize(ragDocuments) : null,
                    RAGChunkDetails = ragChunkDetails != null && ragChunkDetails.Count > 0
                        ? JsonSerializer.Serialize(ragChunkDetails.Select(c => new
                        {
                            chunkId = c.ChunkId,
                            documentTitle = c.DocumentTitle,
                            sourceUrl = c.SourceUrl,
                            textSnippet = c.TextSnippet,
                            score = c.Score,
                            chunkIndex = c.ChunkIndex
                        }))
                        : null, // Phase 11: Serialize chunk details for audit trail
                    RAGChunksRetrieved = ragChunksRetrieved,
                    RAGAverageScore = ragScore,
                    EmbeddingProvider = gptConfig.EnableRAG ? _embeddingService.ProviderName : null,
                    EmbeddingModel = gptConfig.EnableRAG ? "text-embedding-3-small" : null,
                    LLMProvider = gptConfig.ModelProvider,
                    LLMModel = gptConfig.ModelName,
                    RAGRetrievalTimeMs = ragRetrievalTimeMs,
                    LLMGenerationTimeMs = llmGenerationTimeMs,
                    TotalResponseTimeMs = (ragRetrievalTimeMs ?? 0) + llmGenerationTimeMs,
                    CreatedAt = DateTime.UtcNow
                };

                _context.GPTAudits().Add(auditRecord);

                _logger.LogInformation("Audit record created for message {MessageId}: RAG={RAGUsed}, EmbeddingProvider={Provider}",
                    assistantMessageEntity.Id, auditRecord.RAGUsed, auditRecord.EmbeddingProvider);

                await _context.SaveChangesAsync();

                _logger.LogInformation("Message sent successfully. Tokens: {Tokens}, Cost: ${Cost:F6}",
                    totalTokens, cost);

                return assistantMessageEntity;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message to GPT {GPTId}", gptConfigId);

                // Record failed usage metric
                var failedMetric = new GPTUsageMetric
                {
                    GPTConfigurationId = gptConfigId,
                    ConversationId = conversationId,
                    UserId = userId,
                    CountyId = countyId,
                    Provider = "Unknown",
                    ModelName = "Unknown",
                    Success = false,
                    ErrorMessage = ex.Message,
                    Timestamp = DateTime.UtcNow
                };

                _context.GPTUsageMetrics().Add(failedMetric);
                await _context.SaveChangesAsync();

                throw;
            }
        }

        /// <summary>
        /// Call LLM provider (simulated - in production, integrate with actual APIs)
        /// </summary>
        private async System.Threading.Tasks.Task<(string Message, int PromptTokens, int CompletionTokens, int ResponseTime)>
            CallLLMProviderAsync(
                GPTConfiguration config,
                List<GPTMessage> history,
                string userMessage,
                string? ragContext)
        {
            // PRODUCTION NOTE: This is a simulation
            // In production, implement actual API clients for:
            // - OpenAI: using OpenAI .NET SDK
            // - Anthropic: using Anthropic .NET SDK
            // - Azure: using Azure OpenAI SDK
            // - Local: using local model inference

            await System.Threading.Tasks.Task.Delay(500); // Simulate API call

            var responseTime = 500; // milliseconds

            // Simulate token counting (in production, use actual tokenizer)
            var promptTokens = (history.Count * 50) + (userMessage.Length / 4);
            if (ragContext != null)
            {
                promptTokens += ragContext.Length / 4;
            }

            var completionTokens = 150; // Simulated response length

            // Build simulated response based on GPT type and RAG context
            string response;

            if (config.Name == "PropertyAssessmentGPT" && ragContext != null)
            {
                // PropertyAssessmentGPT with RAG context - provide grounded response
                response = BuildPropertyAssessmentResponse(userMessage, ragContext);
            }
            else if (ragContext != null)
            {
                // Generic GPT with RAG context
                response = $"Based on the official Benton County documentation:\n\n{ragContext.Substring(0, Math.Min(500, ragContext.Length))}...\n\n[Response grounded in RAG context]";
            }
            else
            {
                // No RAG context - general response
                response = $"[Simulated {config.ModelProvider} {config.ModelName} response]\n\nI can help you with questions about {config.Name}. However, I'm currently operating without access to the Benton County CAMA knowledge base. For the most accurate information, please ensure the RAG dataset has been indexed.";
            }

            return (response, promptTokens, completionTokens, responseTime);
        }

        /// <summary>
        /// Build a PropertyAssessmentGPT response using RAG context
        /// </summary>
        private string BuildPropertyAssessmentResponse(string userMessage, string ragContext)
        {
            var lowerMessage = userMessage.ToLowerInvariant();

            // Detect question type and provide relevant response based on RAG context
            if (lowerMessage.Contains("quality grade") || lowerMessage.Contains("grade scale"))
            {
                return @"Based on Benton County's Residential Valuation Policy, the Quality Grade Scale is as follows:

| Grade | Description | Base $/SF |
|-------|-------------|-----------|
| A | Luxury/Custom | $200+ |
| B+ | High Quality | $160-200 |
| B | Good Quality | $130-160 |
| C+ | Above Average | $110-130 |
| C | Average | $90-110 |
| D | Fair/Below Average | $70-90 |
| E | Poor | $50-70 |

This grading system is used in the Sales Comparison Approach for residential valuation.

*Source: Benton County Residential Valuation Policy*";
            }

            if (lowerMessage.Contains("assessment calendar") || lowerMessage.Contains("timeline") || lowerMessage.Contains("when"))
            {
                return @"According to the Benton County CAMA Overview, the Assessment Calendar is:

| Month | Activity |
|-------|----------|
| January | Assessment roll opens |
| April 30 | Value change notices mailed |
| May-June | Informal review period |
| July 1 | Board of Equalization appeals deadline |
| October | Final values certified |

For the detailed annual revaluation timeline, model calibration begins in September with residential models completed by October.

*Source: Benton County CAMA Overview & Workflow Overview*";
            }

            if (lowerMessage.Contains("appeal") || lowerMessage.Contains("boe") || lowerMessage.Contains("board of equalization"))
            {
                return @"Based on Benton County's Assessment Workflow, the Appeals Process includes:

**Informal Review Process:**
- Timeline: 30 days from notice date
- Method: Phone, email, or in-person meeting
- Authority: Appraiser can adjust up to 10% without supervisor approval

**Board of Equalization (BOE):**
- Filing Deadline: July 1 or 30 days from notice
- Hearing Format: 15-minute presentation
- Evidence Required:
  - Recent comparable sales
  - Independent appraisal (optional)
  - Photos of condition issues
  - Cost documentation for improvements
- Decision Timeline: 30 days from hearing

*Source: Benton County Workflow Overview*";
            }

            if (lowerMessage.Contains("sales validation") || lowerMessage.Contains("valid sale"))
            {
                return @"According to Benton County's Workflow Overview, Sales Validation Status Codes are:

| Status Code | Description | Action Required |
|-------------|-------------|-----------------|
| U | Unvalidated | Needs review |
| V | Valid Arms-Length | Use for valuation |
| I | Invalid | Exclude from analysis |
| P | Partial Interest | Adjust or exclude |
| F | Family Transfer | Exclude |
| B | Bank/REO Sale | Review for market |
| A | Auction Sale | Review for market |

Validation steps include: reviewing deed type, verifying buyer/seller relationship, checking financing terms, and comparing to market trends.

*Source: Benton County Workflow Overview*";
            }

            // Default response with RAG context excerpt
            return $@"Based on the official Benton County CAMA documentation:

{ragContext.Substring(0, Math.Min(800, ragContext.Length))}

This information comes from the Benton County property assessment knowledge base. For specific questions about your property assessment, please contact the Benton County Assessor's Office at (509) 736-3080.

*Grounded in Benton County CAMA documentation*";
        }

        public async System.Threading.Tasks.Task<GPTConversation> CreateConversationAsync(
            int gptConfigId,
            string userId,
            int countyId,
            string? title = null)
        {
            try
            {
                _logger.LogInformation("Creating conversation for GPT {GPTId}, user {UserId}",
                    gptConfigId, userId);

                var conversation = new GPTConversation
                {
                    GPTConfigurationId = gptConfigId,
                    UserId = userId,
                    CountyId = countyId,
                    Title = title ?? "New Conversation",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.GPTConversations().Add(conversation);
                await _context.SaveChangesAsync();

                // Increment conversation count on GPT config
                var gpt = await _context.GPTConfigurations().FindAsync(gptConfigId);
                if (gpt != null)
                {
                    gpt.TotalConversations++;
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("Conversation created: ID {ConversationId}", conversation.Id);

                return conversation;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating conversation for GPT {GPTId}", gptConfigId);
                throw;
            }
        }

        public async System.Threading.Tasks.Task<List<GPTMessage>> GetConversationHistoryAsync(
            int conversationId, int limit = 50)
        {
            return await _context.GPTMessages()
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .OrderBy(m => m.CreatedAt) // Re-order chronologically
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<GPTConversation?> GetConversationAsync(int conversationId)
        {
            return await _context.GPTConversations()
                .Include(c => c.GPTConfiguration)
                .FirstOrDefaultAsync(c => c.Id == conversationId);
        }

        public async System.Threading.Tasks.Task<List<GPTConversation>> GetUserConversationsAsync(
            string userId,
            int gptConfigId,
            int limit = 20)
        {
            return await _context.GPTConversations()
                .Where(c => c.UserId == userId &&
                           c.GPTConfigurationId == gptConfigId &&
                           c.Status != "Deleted")
                .OrderByDescending(c => c.UpdatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task UpdateConversationTitleAsync(int conversationId, string title)
        {
            var conversation = await _context.GPTConversations().FindAsync(conversationId);
            if (conversation != null)
            {
                conversation.Title = title;
                conversation.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async System.Threading.Tasks.Task ArchiveConversationAsync(int conversationId)
        {
            var conversation = await _context.GPTConversations().FindAsync(conversationId);
            if (conversation != null)
            {
                conversation.Status = "Archived";
                conversation.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async System.Threading.Tasks.Task DeleteConversationAsync(int conversationId)
        {
            var conversation = await _context.GPTConversations().FindAsync(conversationId);
            if (conversation != null)
            {
                conversation.Status = "Deleted";
                conversation.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async System.Threading.Tasks.Task RateConversationAsync(int conversationId, int rating, string? feedback = null)
        {
            var conversation = await _context.GPTConversations()
                .Include(c => c.GPTConfiguration)
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation != null)
            {
                conversation.Rating = rating;
                conversation.Feedback = feedback;
                conversation.UpdatedAt = DateTime.UtcNow;

                // Update GPT average rating
                if (conversation.GPTConfiguration != null)
                {
                    var gpt = conversation.GPTConfiguration;
                    var totalRating = (gpt.AverageRating ?? 0) * gpt.RatingCount + rating;
                    gpt.RatingCount++;
                    gpt.AverageRating = totalRating / gpt.RatingCount;
                }

                await _context.SaveChangesAsync();
            }
        }

        public async System.Threading.Tasks.Task<decimal> CalculateCostAsync(
            string provider,
            string modelName,
            int promptTokens,
            int completionTokens)
        {
            var key = $"{provider}:{modelName}";

            if (!TokenPricing.TryGetValue(key, out var pricing))
            {
                _logger.LogWarning("No pricing found for {Provider}:{Model}, using default",
                    provider, modelName);
                pricing = (5.00m, 15.00m); // Default to GPT-4o pricing
            }

            var promptCost = (promptTokens / 1_000_000m) * pricing.Prompt;
            var completionCost = (completionTokens / 1_000_000m) * pricing.Completion;

            return promptCost + completionCost;
        }

        public async System.Threading.Tasks.Task<ConversationStatistics> GetConversationStatisticsAsync(int conversationId)
        {
            var conversation = await _context.GPTConversations().FindAsync(conversationId);
            if (conversation == null)
            {
                throw new InvalidOperationException($"Conversation {conversationId} not found");
            }

            var duration = conversation.LastMessageAt.HasValue
                ? (int)(conversation.LastMessageAt.Value - conversation.CreatedAt).TotalSeconds
                : 0;

            return new ConversationStatistics
            {
                ConversationId = conversationId,
                TotalMessages = conversation.TotalMessages,
                TotalTokens = conversation.TotalTokensUsed,
                TotalCost = conversation.TotalCost,
                Duration = duration,
                StartedAt = conversation.CreatedAt,
                EndedAt = conversation.LastMessageAt
            };
        }

        public async System.Threading.Tasks.Task<GPTUsageStatistics> GetGPTUsageStatisticsAsync(
            int gptConfigId,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var end = endDate ?? DateTime.UtcNow;

            var gpt = await _context.GPTConfigurations().FindAsync(gptConfigId);
            if (gpt == null)
            {
                throw new InvalidOperationException($"GPT {gptConfigId} not found");
            }

            var metrics = await _context.GPTUsageMetrics()
                .Where(m => m.GPTConfigurationId == gptConfigId &&
                           m.Timestamp >= start &&
                           m.Timestamp <= end)
                .ToListAsync();

            var conversations = await _context.GPTConversations()
                .Where(c => c.GPTConfigurationId == gptConfigId &&
                           c.CreatedAt >= start &&
                           c.CreatedAt <= end)
                .ToListAsync();

            return new GPTUsageStatistics
            {
                GPTConfigId = gptConfigId,
                GPTName = gpt.DisplayName,
                TotalConversations = conversations.Count,
                TotalMessages = metrics.Count,
                TotalTokens = metrics.Sum(m => m.TotalTokens),
                TotalCost = metrics.Sum(m => m.TotalCost),
                UniqueUsers = conversations.Select(c => c.UserId).Distinct().Count(),
                AverageRating = gpt.AverageRating ?? 0,
                RatingCount = gpt.RatingCount,
                PeriodStart = start,
                PeriodEnd = end
            };
        }

        public async System.Threading.Tasks.Task<CountyUsageStatistics> GetCountyUsageStatisticsAsync(
            int countyId,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var end = endDate ?? DateTime.UtcNow;

            var metrics = await _context.GPTUsageMetrics()
                .Include(m => m.GPTConfiguration)
                .Where(m => m.CountyId == countyId &&
                           m.Timestamp >= start &&
                           m.Timestamp <= end)
                .ToListAsync();

            var conversations = await _context.GPTConversations()
                .Where(c => c.CountyId == countyId &&
                           c.CreatedAt >= start &&
                           c.CreatedAt <= end)
                .ToListAsync();

            var costByGPT = metrics
                .GroupBy(m => m.GPTConfiguration?.DisplayName ?? "Unknown")
                .ToDictionary(g => g.Key, g => g.Sum(m => m.TotalCost));

            var tokensByProvider = metrics
                .GroupBy(m => m.Provider)
                .ToDictionary(g => g.Key, g => g.Sum(m => (long)m.TotalTokens));

            return new CountyUsageStatistics
            {
                CountyId = countyId,
                CountyName = "County", // TODO: Get from County table
                TotalConversations = conversations.Count,
                TotalMessages = metrics.Count,
                TotalTokens = metrics.Sum(m => m.TotalTokens),
                TotalCost = metrics.Sum(m => m.TotalCost),
                ActiveUsers = conversations.Select(c => c.UserId).Distinct().Count(),
                CostByGPT = costByGPT,
                TokensByProvider = tokensByProvider,
                PeriodStart = start,
                PeriodEnd = end
            };
        }

        /// <summary>
        /// Phase 11: Get audit record by message ID for RAG traceability
        /// </summary>
        public async Task<GPTAudit?> GetAuditByMessageIdAsync(int messageId)
        {
            try
            {
                return await _context.GPTAudits()
                    .FirstOrDefaultAsync(a => a.MessageId == messageId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit for message {MessageId}", messageId);
                return null;
            }
        }
    }
}
