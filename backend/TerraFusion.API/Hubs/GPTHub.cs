// TerraFusionGPT Suite: SignalR Hub for Real-Time GPT Operations
// Elite Government OS Engineering - AI Platform

using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Entities;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time GPT communication
    /// </summary>
    [Authorize]
    public class GPTHub : Hub
    {
        private readonly ILogger<GPTHub> _logger;

        public GPTHub(ILogger<GPTHub> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        #region Connection Management

        public override async System.Threading.Tasks.Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            var connectionId = Context.ConnectionId;

            _logger.LogInformation("GPT Hub: User {UserId} connected with connection {ConnectionId}",
                userId, connectionId);

            await base.OnConnectedAsync();
        }

        public override async System.Threading.Tasks.Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            var connectionId = Context.ConnectionId;

            if (exception != null)
            {
                _logger.LogError(exception, "GPT Hub: User {UserId} disconnected with error", userId);
            }
            else
            {
                _logger.LogInformation("GPT Hub: User {UserId} disconnected", userId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        #endregion

        #region Client Subscriptions

        /// <summary>
        /// Subscribe to updates for a specific conversation
        /// </summary>
        public async System.Threading.Tasks.Task SubscribeToConversation(int conversationId)
        {
            var groupName = $"conversation_{conversationId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("User {UserId} subscribed to conversation {ConversationId}",
                Context.UserIdentifier, conversationId);

            await Clients.Caller.SendAsync("SubscribedToConversation", conversationId);
        }

        /// <summary>
        /// Unsubscribe from conversation updates
        /// </summary>
        public async System.Threading.Tasks.Task UnsubscribeFromConversation(int conversationId)
        {
            var groupName = $"conversation_{conversationId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("User {UserId} unsubscribed from conversation {ConversationId}",
                Context.UserIdentifier, conversationId);

            await Clients.Caller.SendAsync("UnsubscribedFromConversation", conversationId);
        }

        /// <summary>
        /// Subscribe to GPT marketplace updates
        /// </summary>
        public async System.Threading.Tasks.Task SubscribeToMarketplace()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "marketplace");

            _logger.LogInformation("User {UserId} subscribed to marketplace",
                Context.UserIdentifier);

            await Clients.Caller.SendAsync("SubscribedToMarketplace");
        }

        /// <summary>
        /// Subscribe to county GPT updates
        /// </summary>
        public async System.Threading.Tasks.Task SubscribeToCountyGPTs(int countyId)
        {
            var groupName = $"county_{countyId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("User {UserId} subscribed to county {CountyId} GPTs",
                Context.UserIdentifier, countyId);

            await Clients.Caller.SendAsync("SubscribedToCountyGPTs", countyId);
        }

        #endregion

        #region Server Broadcast Methods

        /// <summary>
        /// Broadcast message streaming (for real-time response generation)
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastMessageChunk(int conversationId, string messageChunk, int chunkIndex)
        {
            var groupName = $"conversation_{conversationId}";

            await Clients.Group(groupName).SendAsync("ReceiveMessageChunk", new
            {
                ConversationId = conversationId,
                Chunk = messageChunk,
                ChunkIndex = chunkIndex,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Broadcasted message chunk {Index} to conversation {ConversationId}",
                chunkIndex, conversationId);
        }

        /// <summary>
        /// Broadcast complete message
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastMessage(int conversationId, GPTMessage message)
        {
            var groupName = $"conversation_{conversationId}";

            await Clients.Group(groupName).SendAsync("ReceiveMessage", new
            {
                ConversationId = conversationId,
                Message = message,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Broadcasted message to conversation {ConversationId}", conversationId);
        }

        /// <summary>
        /// Broadcast typing indicator
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastTyping(int conversationId, bool isTyping)
        {
            var groupName = $"conversation_{conversationId}";

            await Clients.Group(groupName).SendAsync("TypingIndicator", new
            {
                ConversationId = conversationId,
                IsTyping = isTyping,
                UserId = Context.UserIdentifier,
                Timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Broadcast conversation update
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastConversationUpdate(int conversationId, string updateType, object data)
        {
            var groupName = $"conversation_{conversationId}";

            await Clients.Group(groupName).SendAsync("ConversationUpdate", new
            {
                ConversationId = conversationId,
                UpdateType = updateType, // "title_changed", "archived", "rating_updated", etc.
                Data = data,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Broadcasted {UpdateType} update to conversation {ConversationId}",
                updateType, conversationId);
        }

        /// <summary>
        /// Broadcast new GPT in marketplace
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastNewGPT(GPTConfiguration gpt)
        {
            await Clients.Group("marketplace").SendAsync("NewGPTAvailable", new
            {
                GPT = gpt,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Broadcasted new GPT to marketplace: {GPTName}", gpt.DisplayName);
        }

        /// <summary>
        /// Broadcast GPT update
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastGPTUpdate(int gptId, string updateType, object data)
        {
            // Broadcast to marketplace
            await Clients.Group("marketplace").SendAsync("GPTUpdate", new
            {
                GPTId = gptId,
                UpdateType = updateType, // "rating_updated", "install_count_updated", "featured", etc.
                Data = data,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Broadcasted {UpdateType} update for GPT {GPTId}",
                updateType, gptId);
        }

        /// <summary>
        /// Broadcast county GPT update
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastCountyGPTUpdate(int countyId, int gptId, string updateType, object data)
        {
            var groupName = $"county_{countyId}";

            await Clients.Group(groupName).SendAsync("CountyGPTUpdate", new
            {
                CountyId = countyId,
                GPTId = gptId,
                UpdateType = updateType,
                Data = data,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Broadcasted {UpdateType} update for GPT {GPTId} in county {CountyId}",
                updateType, gptId, countyId);
        }

        /// <summary>
        /// Broadcast usage alert (approaching budget limit, etc.)
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastUsageAlert(int countyId, string alertType, object data)
        {
            var groupName = $"county_{countyId}";

            await Clients.Group(groupName).SendAsync("UsageAlert", new
            {
                CountyId = countyId,
                AlertType = alertType, // "budget_threshold", "quota_exceeded", etc.
                Data = data,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogWarning("Broadcasted {AlertType} usage alert for county {CountyId}",
                alertType, countyId);
        }

        /// <summary>
        /// Broadcast cost update (real-time cost tracking)
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastCostUpdate(int conversationId, decimal totalCost, long totalTokens)
        {
            var groupName = $"conversation_{conversationId}";

            await Clients.Group(groupName).SendAsync("CostUpdate", new
            {
                ConversationId = conversationId,
                TotalCost = totalCost,
                TotalTokens = totalTokens,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Broadcasted cost update to conversation {ConversationId}: ${Cost:F6}",
                conversationId, totalCost);
        }

        /// <summary>
        /// Broadcast RAG document processing status
        /// </summary>
        public async System.Threading.Tasks.Task BroadcastRAGProcessingStatus(int datasetId, string status, object data)
        {
            var groupName = $"rag_dataset_{datasetId}";

            await Clients.Group(groupName).SendAsync("RAGProcessingStatus", new
            {
                DatasetId = datasetId,
                Status = status, // "indexing", "completed", "failed"
                Data = data,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Broadcasted RAG processing status {Status} for dataset {DatasetId}",
                status, datasetId);
        }

        #endregion

        #region Client-to-Client Communication

        /// <summary>
        /// Send typing indicator to other participants in conversation
        /// </summary>
        public async System.Threading.Tasks.Task SendTypingIndicator(int conversationId)
        {
            await BroadcastTyping(conversationId, true);

            // Auto-clear typing indicator after 3 seconds
            _ = System.Threading.Tasks.Task.Delay(3000).ContinueWith(async _ =>
            {
                await BroadcastTyping(conversationId, false);
            });
        }

        /// <summary>
        /// Request conversation refresh
        /// </summary>
        public async System.Threading.Tasks.Task RequestConversationRefresh(int conversationId)
        {
            var groupName = $"conversation_{conversationId}";

            await Clients.Group(groupName).SendAsync("RefreshRequested", new
            {
                ConversationId = conversationId,
                RequestedBy = Context.UserIdentifier,
                Timestamp = DateTime.UtcNow
            });
        }

        #endregion

        #region Health Check

        /// <summary>
        /// Ping to check connection health
        /// </summary>
        public async System.Threading.Tasks.Task Ping()
        {
            await Clients.Caller.SendAsync("Pong", new
            {
                Timestamp = DateTime.UtcNow,
                ConnectionId = Context.ConnectionId
            });
        }

        #endregion
    }
}


