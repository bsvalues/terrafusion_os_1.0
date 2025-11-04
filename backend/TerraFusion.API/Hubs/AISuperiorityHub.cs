using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace TerraFusion.API.Services
{
    /// <summary>
    /// SignalR Hub for real-time AI Superiority Demonstration broadcasting
    /// Provides live championship-level performance comparisons between TerraFusion AI and Harris PACS
    /// </summary>
    public class AISuperiorityHub : Hub
    {
        private readonly ILogger<AISuperiorityHub> _logger;
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();

        public AISuperiorityHub(ILogger<AISuperiorityHub> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Handle client connection to AI superiority demonstration
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var connectionId = Context.ConnectionId;
            var userId = Context.UserIdentifier ?? "anonymous";

            _userConnections[connectionId] = userId;

            _logger.LogInformation($"🔗 Client connected to AI Superiority Hub: {connectionId} (User: {userId})");

            // Send welcome message with current system status
            await Clients.Caller.SendAsync("SystemStatus", new
            {
                message = "🚀 Connected to TerraFusion AI Superiority Demonstration Hub",
                timestamp = DateTime.UtcNow,
                connectionId = connectionId,
                features = new[]
                {
                    "Real-time performance comparison",
                    "Live AI agent deployment tracking",
                    "Championship-level metrics",
                    "Competitive advantage analysis",
                    "Harris PACS baseline comparison"
                }
            });

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Handle client disconnection
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;
            _userConnections.TryRemove(connectionId, out var userId);

            _logger.LogInformation($"🔌 Client disconnected from AI Superiority Hub: {connectionId} (User: {userId})");

            if (exception != null)
            {
                _logger.LogWarning(exception, $"Client disconnected with error: {connectionId}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Subscribe to specific demonstration updates
        /// </summary>
        public async Task SubscribeToDemo(string demoId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Demo_{demoId}");

            _logger.LogInformation($"🎯 Client {Context.ConnectionId} subscribed to demo: {demoId}");

            await Clients.Caller.SendAsync("SubscriptionConfirmed", new
            {
                demoId = demoId,
                message = $"Subscribed to AI Superiority Demo: {demoId}",
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Unsubscribe from demonstration updates
        /// </summary>
        public async Task UnsubscribeFromDemo(string demoId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Demo_{demoId}");

            _logger.LogInformation($"🚫 Client {Context.ConnectionId} unsubscribed from demo: {demoId}");

            await Clients.Caller.SendAsync("UnsubscriptionConfirmed", new
            {
                demoId = demoId,
                message = $"Unsubscribed from AI Superiority Demo: {demoId}",
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Request current demonstration status
        /// </summary>
        public async Task RequestDemoStatus(string demoId)
        {
            _logger.LogInformation($"📊 Client {Context.ConnectionId} requested status for demo: {demoId}");

            // This would typically call the demonstration service to get current status
            // For now, send acknowledgment
            await Clients.Caller.SendAsync("StatusRequested", new
            {
                demoId = demoId,
                message = "Demo status request acknowledged",
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Broadcast supremacy update to all connected clients
        /// </summary>
        public static class SupremacyBroadcaster
        {
            public static async Task BroadcastSupremacyUpdate(IHubContext<AISuperiorityHub> hubContext, object supremacyData)
            {
                await hubContext.Clients.All.SendAsync("SupremacyUpdate", supremacyData);
            }

            public static async Task BroadcastToDemoGroup(IHubContext<AISuperiorityHub> hubContext, string demoId, object data)
            {
                await hubContext.Clients.Group($"Demo_{demoId}").SendAsync("DemoUpdate", data);
            }
        }
    }
}
