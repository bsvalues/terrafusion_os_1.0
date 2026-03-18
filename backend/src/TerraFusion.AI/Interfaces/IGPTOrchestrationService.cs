// TerraFusionGPT Suite: GPT Orchestration Service Interface
// Elite Government OS Engineering - AI Platform

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.AI.Entities;
using TerraFusion.Core.Entities;
using TaskAsync = System.Threading.Tasks.Task;

namespace TerraFusion.AI.Interfaces
{
    /// <summary>
    /// Service interface for GPT orchestration - message routing, provider selection, cost tracking
    /// </summary>
    public interface IGPTOrchestrationService
    {
        /// <summary>
        /// Send a message to a GPT and get response
        /// </summary>
        System.Threading.Tasks.Task<GPTMessage> SendMessageAsync(
            int gptConfigId,
            int conversationId,
            string userMessage,
            string userId,
            int countyId);

        /// <summary>
        /// Create a new conversation
        /// </summary>
        System.Threading.Tasks.Task<GPTConversation> CreateConversationAsync(
            int gptConfigId,
            string userId,
            int countyId,
            string? title = null);

        /// <summary>
        /// Get conversation history
        /// </summary>
        System.Threading.Tasks.Task<List<GPTMessage>> GetConversationHistoryAsync(int conversationId, int limit = 50);

        /// <summary>
        /// Get conversation by ID
        /// </summary>
        System.Threading.Tasks.Task<GPTConversation?> GetConversationAsync(int conversationId);

        /// <summary>
        /// Get user's conversations for a GPT
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConversation>> GetUserConversationsAsync(
            string userId,
            int gptConfigId,
            int limit = 20);

        /// <summary>
        /// Update conversation title
        /// </summary>
        System.Threading.Tasks.Task UpdateConversationTitleAsync(int conversationId, string title);

        /// <summary>
        /// Archive a conversation
        /// </summary>
        System.Threading.Tasks.Task ArchiveConversationAsync(int conversationId);

        /// <summary>
        /// Delete a conversation (soft delete)
        /// </summary>
        System.Threading.Tasks.Task DeleteConversationAsync(int conversationId);

        /// <summary>
        /// Rate a conversation
        /// </summary>
        System.Threading.Tasks.Task RateConversationAsync(int conversationId, int rating, string? feedback = null);

        /// <summary>
        /// Calculate cost for a message based on token usage
        /// </summary>
        System.Threading.Tasks.Task<decimal> CalculateCostAsync(
            string provider,
            string modelName,
            int promptTokens,
            int completionTokens);

        /// <summary>
        /// Get conversation statistics
        /// </summary>
        System.Threading.Tasks.Task<ConversationStatistics> GetConversationStatisticsAsync(int conversationId);

        /// <summary>
        /// Get GPT usage statistics
        /// </summary>
        System.Threading.Tasks.Task<GPTUsageStatistics> GetGPTUsageStatisticsAsync(
            int gptConfigId,
            DateTime? startDate = null,
            DateTime? endDate = null);

        /// <summary>
        /// Get county usage statistics
        /// </summary>
        System.Threading.Tasks.Task<CountyUsageStatistics> GetCountyUsageStatisticsAsync(
            int countyId,
            DateTime? startDate = null,
            DateTime? endDate = null);

        /// <summary>
        /// Phase 11: Get audit record by message ID for RAG traceability
        /// </summary>
        System.Threading.Tasks.Task<GPTAudit?> GetAuditByMessageIdAsync(int messageId);

        /// <summary>
        /// Wave 2: Get all conversations for a user scoped to a county, with pagination.
        /// Returns an empty list when no conversations exist (acceptable — DbSets not yet activated in Wave 2).
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConversation>> GetAllConversationsAsync(
            string userId,
            int countyId,
            int skip = 0,
            int limit = 50,
            System.Threading.CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Conversation statistics
    /// </summary>
    public class ConversationStatistics
    {
        public int ConversationId { get; set; }
        public int TotalMessages { get; set; }
        public long TotalTokens { get; set; }
        public decimal TotalCost { get; set; }
        public int Duration { get; set; } // seconds
        public DateTime StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
    }

    /// <summary>
    /// GPT usage statistics
    /// </summary>
    public class GPTUsageStatistics
    {
        public int GPTConfigId { get; set; }
        public string GPTName { get; set; } = string.Empty;
        public int TotalConversations { get; set; }
        public int TotalMessages { get; set; }
        public long TotalTokens { get; set; }
        public decimal TotalCost { get; set; }
        public int UniqueUsers { get; set; }
        public decimal AverageRating { get; set; }
        public int RatingCount { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }

    /// <summary>
    /// County usage statistics
    /// </summary>
    public class CountyUsageStatistics
    {
        public int CountyId { get; set; }
        public string CountyName { get; set; } = string.Empty;
        public int TotalConversations { get; set; }
        public int TotalMessages { get; set; }
        public long TotalTokens { get; set; }
        public decimal TotalCost { get; set; }
        public int ActiveUsers { get; set; }
        public Dictionary<string, decimal> CostByGPT { get; set; } = new();
        public Dictionary<string, long> TokensByProvider { get; set; } = new();
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }
}
