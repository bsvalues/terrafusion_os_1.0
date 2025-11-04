// TerraFusion Codex: SignalR Hub for Real-Time Updates
// Elite Government OS Engineering - Real-Time Communication

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Hubs
{
    /// <summary>
    /// SignalR Hub for broadcasting real-time Codex 3-6-9 Framework updates
    /// </summary>
    public class CodexHub : Hub
    {
        private readonly ILogger<CodexHub> _logger;

        public CodexHub(ILogger<CodexHub> logger)
        {
            _logger = logger;
        }

        #region Connection Management

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation(
                "Client connected to Codex Hub: {ConnectionId}",
                Context.ConnectionId
            );

            await Clients.Caller.SendAsync("Connected", new
            {
                connectionId = Context.ConnectionId,
                timestamp = DateTime.UtcNow,
                message = "Connected to Codex 3-6-9 Framework real-time updates"
            });

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation(
                "Client disconnected from Codex Hub: {ConnectionId}",
                Context.ConnectionId
            );

            await base.OnDisconnectedAsync(exception);
        }

        #endregion

        #region Client Methods (Callable from Frontend)

        /// <summary>
        /// Subscribe to county-specific updates
        /// </summary>
        public async Task SubscribeToCounty(string countyName)
        {
            var groupName = $"County_{countyName}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation(
                "Client {ConnectionId} subscribed to county: {County}",
                Context.ConnectionId, countyName
            );

            await Clients.Caller.SendAsync("SubscriptionConfirmed", new
            {
                county = countyName,
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Unsubscribe from county-specific updates
        /// </summary>
        public async Task UnsubscribeFromCounty(string countyName)
        {
            var groupName = $"County_{countyName}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation(
                "Client {ConnectionId} unsubscribed from county: {County}",
                Context.ConnectionId, countyName
            );
        }

        /// <summary>
        /// Subscribe to specific domain updates
        /// </summary>
        public async Task SubscribeToDomain(string domainName)
        {
            var groupName = $"Domain_{domainName}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation(
                "Client {ConnectionId} subscribed to domain: {Domain}",
                Context.ConnectionId, domainName
            );

            await Clients.Caller.SendAsync("DomainSubscriptionConfirmed", new
            {
                domain = domainName,
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Subscribe to alert notifications
        /// </summary>
        public async Task SubscribeToAlerts(string? alertLevel = null)
        {
            var groupName = string.IsNullOrEmpty(alertLevel)
                ? "Alerts_All"
                : $"Alerts_{alertLevel}";

            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation(
                "Client {ConnectionId} subscribed to alerts: {Level}",
                Context.ConnectionId, alertLevel ?? "All"
            );
        }

        #endregion

        #region Server Methods (Callable from Backend Services)

        /// <summary>
        /// Broadcast ultimate power update to all clients
        /// </summary>
        public async Task BroadcastUltimatePowerUpdate(
            double score,
            string alertLevel,
            Dictionary<string, double> domainScores,
            string? county = null)
        {
            var update = new
            {
                timestamp = DateTime.UtcNow,
                ultimatePowerScore = score,
                maxScore = CodexConstants.FOUNDATION_MAX,
                percentage = (score / CodexConstants.FOUNDATION_MAX) * 100,
                alertLevel = alertLevel,
                domainScores = domainScores,
                county = county,
                isChampionshipMode = score >= 10
            };

            // Broadcast to all clients
            await Clients.All.SendAsync("UltimatePowerUpdated", update);

            // If county-specific, also send to county group
            if (!string.IsNullOrEmpty(county))
            {
                await Clients.Group($"County_{county}").SendAsync("UltimatePowerUpdated", update);
            }

            _logger.LogInformation(
                "Broadcast ultimate power update: {Score}/12 [{AlertLevel}]",
                score.ToString("F2"), alertLevel
            );
        }

        /// <summary>
        /// Broadcast domain score update
        /// </summary>
        public async Task BroadcastDomainScoreUpdate(
            string domain,
            double score,
            string alertLevel,
            string? county = null)
        {
            var update = new
            {
                timestamp = DateTime.UtcNow,
                domain = domain,
                score = score,
                maxScore = CodexConstants.FOUNDATION_MAX,
                percentage = (score / CodexConstants.FOUNDATION_MAX) * 100,
                alertLevel = alertLevel,
                county = county
            };

            // Broadcast to all clients
            await Clients.All.SendAsync("DomainScoreUpdated", update);

            // Send to domain-specific subscribers
            await Clients.Group($"Domain_{domain}").SendAsync("DomainScoreUpdated", update);

            // If county-specific, also send to county group
            if (!string.IsNullOrEmpty(county))
            {
                await Clients.Group($"County_{county}").SendAsync("DomainScoreUpdated", update);
            }

            _logger.LogDebug(
                "Broadcast domain score update: {Domain} = {Score}/12 [{AlertLevel}]",
                domain, score.ToString("F2"), alertLevel
            );
        }

        /// <summary>
        /// Broadcast metric update
        /// </summary>
        public async Task BroadcastMetricUpdate(
            string domain,
            string metricName,
            double rawValue,
            double scaledValue,
            string? unit = null,
            string? county = null)
        {
            var update = new
            {
                timestamp = DateTime.UtcNow,
                domain = domain,
                metricName = metricName,
                rawValue = rawValue,
                scaledValue = scaledValue,
                maxScaledValue = CodexConstants.FOUNDATION_MAX,
                unit = unit,
                county = county
            };

            // Send to domain-specific subscribers
            await Clients.Group($"Domain_{domain}").SendAsync("MetricUpdated", update);

            // If county-specific, also send to county group
            if (!string.IsNullOrEmpty(county))
            {
                await Clients.Group($"County_{county}").SendAsync("MetricUpdated", update);
            }
        }

        /// <summary>
        /// Broadcast alert
        /// </summary>
        public async Task BroadcastAlert(
            string domain,
            string alertLevel,
            double score,
            double threshold,
            string message,
            string? recommendedAction = null,
            string? county = null)
        {
            var alert = new
            {
                timestamp = DateTime.UtcNow,
                domain = domain,
                alertLevel = alertLevel,
                score = score,
                threshold = threshold,
                message = message,
                recommendedAction = recommendedAction,
                county = county
            };

            // Broadcast to all alert subscribers
            await Clients.Group("Alerts_All").SendAsync("AlertTriggered", alert);

            // Send to level-specific alert subscribers
            await Clients.Group($"Alerts_{alertLevel}").SendAsync("AlertTriggered", alert);

            // Send to domain subscribers
            await Clients.Group($"Domain_{domain}").SendAsync("AlertTriggered", alert);

            // If county-specific, also send to county group
            if (!string.IsNullOrEmpty(county))
            {
                await Clients.Group($"County_{county}").SendAsync("AlertTriggered", alert);
            }

            _logger.LogWarning(
                "Broadcast alert: {Domain} - {AlertLevel} - {Message}",
                domain, alertLevel, message
            );
        }

        /// <summary>
        /// Broadcast trend update
        /// </summary>
        public async Task BroadcastTrendUpdate(
            string trend,
            double currentScore,
            double previousScore,
            string? county = null)
        {
            var update = new
            {
                timestamp = DateTime.UtcNow,
                trend = trend,
                currentScore = currentScore,
                previousScore = previousScore,
                change = currentScore - previousScore,
                changePercentage = previousScore != 0
                    ? ((currentScore - previousScore) / previousScore) * 100
                    : 0,
                county = county
            };

            // Broadcast to all clients
            await Clients.All.SendAsync("TrendUpdated", update);

            // If county-specific, also send to county group
            if (!string.IsNullOrEmpty(county))
            {
                await Clients.Group($"County_{county}").SendAsync("TrendUpdated", update);
            }

            _logger.LogInformation(
                "Broadcast trend update: {Trend} - Score {Current} (was {Previous})",
                trend, currentScore.ToString("F2"), previousScore.ToString("F2")
            );
        }

        /// <summary>
        /// Broadcast championship mode achievement
        /// </summary>
        public async Task BroadcastChampionshipAchieved(
            double score,
            Dictionary<string, double> domainScores,
            string? county = null)
        {
            var achievement = new
            {
                timestamp = DateTime.UtcNow,
                message = "🏆 Championship Excellence Achieved!",
                score = score,
                domainScores = domainScores,
                county = county
            };

            // Broadcast to all clients with celebration
            await Clients.All.SendAsync("ChampionshipAchieved", achievement);

            if (!string.IsNullOrEmpty(county))
            {
                await Clients.Group($"County_{county}").SendAsync("ChampionshipAchieved", achievement);
            }

            _logger.LogInformation(
                "🏆 Championship Mode Achieved! Score: {Score}/12",
                score.ToString("F2")
            );
        }

        /// <summary>
        /// Broadcast system health status
        /// </summary>
        public async Task BroadcastSystemHealth(
            bool isHealthy,
            string message,
            Dictionary<string, object>? details = null)
        {
            var status = new
            {
                timestamp = DateTime.UtcNow,
                isHealthy = isHealthy,
                message = message,
                details = details
            };

            await Clients.All.SendAsync("SystemHealthUpdated", status);
        }

        #endregion

        #region Heartbeat

        /// <summary>
        /// Client heartbeat to keep connection alive
        /// </summary>
        public async Task Heartbeat()
        {
            await Clients.Caller.SendAsync("HeartbeatAck", new
            {
                timestamp = DateTime.UtcNow
            });
        }

        #endregion
    }

    /// <summary>
    /// Extension methods for broadcasting from services
    /// </summary>
    public static class CodexHubExtensions
    {
        /// <summary>
        /// Broadcast ultimate power update from a service
        /// </summary>
        public static async Task BroadcastUltimatePowerAsync(
            this IHubContext<CodexHub> hubContext,
            double score,
            string alertLevel,
            Dictionary<string, double> domainScores,
            string? county = null)
        {
            await hubContext.Clients.All.SendAsync("UltimatePowerUpdated", new
            {
                timestamp = DateTime.UtcNow,
                ultimatePowerScore = score,
                maxScore = CodexConstants.FOUNDATION_MAX,
                percentage = (score / CodexConstants.FOUNDATION_MAX) * 100,
                alertLevel = alertLevel,
                domainScores = domainScores,
                county = county,
                isChampionshipMode = score >= 10
            });
        }

        /// <summary>
        /// Broadcast alert from a service
        /// </summary>
        public static async Task BroadcastAlertAsync(
            this IHubContext<CodexHub> hubContext,
            string domain,
            string alertLevel,
            string message,
            string? county = null)
        {
            await hubContext.Clients.All.SendAsync("AlertTriggered", new
            {
                timestamp = DateTime.UtcNow,
                domain = domain,
                alertLevel = alertLevel,
                message = message,
                county = county
            });
        }
    }
}
