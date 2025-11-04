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

        public GPTOrchestrationService(
            TerraFusionDbContext context,
            ILogger<GPTOrchestrationService> logger,
            IRAGService ragService)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _ragService = ragService ?? throw new ArgumentNullException(nameof(ragService));
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

                // Augment with RAG if enabled
                string? ragContext = null;
                List<string>? ragDocuments = null;
                decimal? ragScore = null;

                if (gptConfig.EnableRAG && gptConfig.RAGDatasetId.HasValue)
                {
                    var ragResult = await _ragService.GetRelevantContextAsync(
                        gptConfig.RAGDatasetId.Value,
                        userMessage,
                        gptConfig.RAGTopK);

                    ragContext = ragResult.Context;
                    ragDocuments = ragResult.DocumentIds;
                    ragScore = ragResult.AverageScore;

                    _logger.LogInformation("RAG context retrieved: {DocumentCount} documents, score: {Score}",
                        ragDocuments.Count, ragScore);
                }

                // Call LLM provider (simulated - in production, use actual API clients)
                var (assistantMessage, promptTokens, completionTokens, responseTime) =
                    await CallLLMProviderAsync(
                        gptConfig,
                        history,
                        userMessage,
                        ragContext);

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

            // Simulate response
            var response = $"[Simulated {config.ModelProvider} {config.ModelName} response to: {userMessage}]";

            if (ragContext != null)
            {
                response += " [Using RAG context from government documents]";
            }

            return (response, promptTokens, completionTokens, responseTime);
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
    }
}
