using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TerraFusion.Consciousness.DTOs;
using TerraFusion.Consciousness.Interfaces;
using TerraFusion.Consciousness.Services;
using System.Collections.Concurrent;

namespace TerraFusion.Consciousness.Hubs
{
    /// <summary>
    /// Real-time consciousness operations hub
    /// Government-grade real-time communication for consciousness system monitoring
    /// </summary>
    public class ConsciousnessHub : Hub
    {
        private readonly ILogger<ConsciousnessHub> _logger;
        private readonly IConsciousnessService _consciousnessService;
        private readonly IAuditLogger _auditLogger;
        private static readonly ConcurrentDictionary<string, UserConnection> ConnectedUsers = new();

        public ConsciousnessHub(
            ILogger<ConsciousnessHub> logger,
            IConsciousnessService consciousnessService,
            IAuditLogger auditLogger)
        {
            _logger = logger;
            _consciousnessService = consciousnessService;
            _auditLogger = auditLogger;
        }

        /// <summary>
        /// Handle client connection
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var connectionId = Context.ConnectionId;
            var userId = GetUserId();

            _logger.LogInformation("🔗 Consciousness hub connection established: {ConnectionId} for user {UserId}",
                connectionId, userId);

            ConnectedUsers[connectionId] = new UserConnection
            {
                ConnectionId = connectionId,
                UserId = userId,
                ConnectedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            };

            // Send welcome message with system status
            await Clients.Caller.SendAsync("SystemStatus", await GetSystemStatusAsync());

            // Log audit event
            await LogHubEventAsync("CONNECTION_ESTABLISHED", userId, new Dictionary<string, object>
            {
                { "ConnectionId", connectionId },
                { "UserAgent", (object)(Context.GetHttpContext()?.Request.Headers["User-Agent"].ToString() ?? "unknown") }
            });

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Handle client disconnection
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;
            var userId = GetUserId();

            _logger.LogInformation("🔌 Consciousness hub connection terminated: {ConnectionId}", connectionId);

            ConnectedUsers.TryRemove(connectionId, out _);

            // Log audit event
            await LogHubEventAsync("CONNECTION_TERMINATED", userId, new Dictionary<string, object>
            {
                { "ConnectionId", connectionId },
                { "DisconnectReason", exception?.Message ?? "Normal disconnect" }
            });

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join consciousness monitoring group
        /// </summary>
        public async Task JoinMonitoringGroup(string groupName)
        {
            var userId = GetUserId();
            var connectionId = Context.ConnectionId;

            await Groups.AddToGroupAsync(connectionId, groupName);

            _logger.LogInformation("👥 User {UserId} joined monitoring group {GroupName}", userId, groupName);

            await LogHubEventAsync("JOINED_MONITORING_GROUP", userId, new Dictionary<string, object>
            {
                { "GroupName", groupName },
                { "ConnectionId", connectionId }
            });

            await Clients.Group(groupName).SendAsync("UserJoined", userId, groupName);
        }

        /// <summary>
        /// Leave consciousness monitoring group
        /// </summary>
        public async Task LeaveMonitoringGroup(string groupName)
        {
            var userId = GetUserId();
            var connectionId = Context.ConnectionId;

            await Groups.RemoveFromGroupAsync(connectionId, groupName);

            await LogHubEventAsync("LEFT_MONITORING_GROUP", userId, new Dictionary<string, object>
            {
                { "GroupName", groupName },
                { "ConnectionId", connectionId }
            });

            await Clients.Group(groupName).SendAsync("UserLeft", userId, groupName);
        }

        /// <summary>
        /// Subscribe to real-time consciousness metrics
        /// </summary>
        public async Task SubscribeToMetrics()
        {
            var userId = GetUserId();
            await Groups.AddToGroupAsync(Context.ConnectionId, "MetricsSubscribers");

            await LogHubEventAsync("SUBSCRIBED_TO_METRICS", userId, new Dictionary<string, object>
            {
                { "SubscriptionType", "ConsciousnessMetrics" }
            });

            // Send initial metrics
            var health = await _consciousnessService.GetConsciousnessHealthAsync();
            await Clients.Caller.SendAsync("ConsciousnessMetrics", health);
        }

        /// <summary>
        /// Execute consciousness operation through hub
        /// </summary>
        public async Task ExecuteConsciousnessOperation(ConsciousnessOperationRequest request)
        {
            var userId = GetUserId();

            try
            {
                _logger.LogInformation("⚡ Executing consciousness operation {OperationId} via hub for user {UserId}",
                    request.OperationId, userId);

                var result = await _consciousnessService.ExecuteConsciousnessOperationAsync(request);

                await Clients.Caller.SendAsync("OperationResult", result);

                // Broadcast operation status to monitoring groups
                await Clients.Group("MetricsSubscribers").SendAsync("OperationExecuted", new
                {
                    OperationId = request.OperationId,
                    Success = result.Success,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow
                });

                await LogHubEventAsync("OPERATION_EXECUTED", userId, new Dictionary<string, object>
                {
                    { "OperationId", request.OperationId },
                    { "OperationType", request.OperationType },
                    { "Success", result.Success }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to execute consciousness operation via hub");
                await Clients.Caller.SendAsync("OperationError", new { OperationId = request.OperationId, Error = ex.Message });
            }
        }

        /// <summary>
        /// Broadcast system alert to all connected clients
        /// </summary>
        public async Task BroadcastSystemAlert(SystemAlert alert)
        {
            await Clients.All.SendAsync("SystemAlert", alert);

            await LogHubEventAsync("SYSTEM_ALERT_BROADCASTED", "SYSTEM", new Dictionary<string, object>
            {
                { "AlertType", alert.AlertType },
                { "Severity", alert.Severity },
                { "Message", alert.Message }
            });
        }

        /// <summary>
        /// Get current system status
        /// </summary>
        private async Task<SystemStatusDto> GetSystemStatusAsync()
        {
            var health = await _consciousnessService.GetConsciousnessHealthAsync();

            return new SystemStatusDto
            {
                SystemHealth = health.OverallHealth,
                IsOperational = health.IsOperational,
                ConnectedUsers = ConnectedUsers.Count,
                LastUpdate = DateTime.UtcNow,
                SystemAlerts = health.SystemAlerts
            };
        }

        /// <summary>
        /// Get user ID from context
        /// </summary>
        private string GetUserId()
        {
            return Context.User?.FindFirst("sub")?.Value ??
                   Context.User?.FindFirst("id")?.Value ??
                   Context.ConnectionId;
        }

        /// <summary>
        /// Log hub audit event
        /// </summary>
        private async Task LogHubEventAsync(string eventType, string userId, Dictionary<string, object> details)
        {
            try
            {
                await _auditLogger.LogAuditEventAsync(new AuditEvent
                {
                    EventType = eventType,
                    UserId = userId,
                    Description = $"Consciousness Hub: {eventType}",
                    Details = details,
                    ResourceId = Context.ConnectionId,
                    ComplianceLevel = "REAL_TIME_MONITORING"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to log hub audit event");
            }
        }
    }

    /// <summary>
    /// Quantum operations real-time hub
    /// Specialized hub for quantum consciousness operations
    /// </summary>
    public class QuantumHub : Hub
    {
        private readonly ILogger<QuantumHub> _logger;
        private readonly QuantumConsciousnessOrchestrator _quantumOrchestrator;
        private readonly IAuditLogger _auditLogger;
        private static readonly ConcurrentDictionary<string, QuantumConnection> QuantumConnections = new();

        public QuantumHub(
            ILogger<QuantumHub> logger,
            QuantumConsciousnessOrchestrator quantumOrchestrator,
            IAuditLogger auditLogger)
        {
            _logger = logger;
            _quantumOrchestrator = quantumOrchestrator;
            _auditLogger = auditLogger;
        }

        /// <summary>
        /// Handle quantum hub connection
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var connectionId = Context.ConnectionId;
            var userId = GetUserId();

            _logger.LogInformation("⚛️ Quantum hub connection established: {ConnectionId} for user {UserId}",
                connectionId, userId);

            QuantumConnections[connectionId] = new QuantumConnection
            {
                ConnectionId = connectionId,
                UserId = userId,
                ConnectedAt = DateTime.UtcNow,
                QuantumEnabled = true
            };

            await Clients.Caller.SendAsync("QuantumSystemStatus", await GetQuantumStatusAsync());

            await LogQuantumEventAsync("QUANTUM_CONNECTION_ESTABLISHED", userId, new Dictionary<string, object>
            {
                { "ConnectionId", connectionId }
            });

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Handle quantum hub disconnection
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;
            var userId = GetUserId();

            QuantumConnections.TryRemove(connectionId, out _);

            await LogQuantumEventAsync("QUANTUM_CONNECTION_TERMINATED", userId, new Dictionary<string, object>
            {
                { "ConnectionId", connectionId },
                { "Exception", (object)(exception?.Message ?? "none") }
            });

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Execute quantum consciousness operation
        /// </summary>
        public async Task ExecuteQuantumOperation(Dictionary<string, object> parameters)
        {
            var userId = GetUserId();
            var operationId = Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("⚛️ Executing quantum operation {OperationId} for user {UserId}",
                    operationId, userId);

                var result = await _quantumOrchestrator.ExecuteQuantumConsciousnessAsync(parameters);

                await Clients.Caller.SendAsync("QuantumOperationResult", result);

                await Clients.Group("QuantumMonitors").SendAsync("QuantumOperationExecuted", new
                {
                    OperationId = operationId,
                    UserId = userId,
                    Success = result.Success,
                    Timestamp = DateTime.UtcNow
                });

                await LogQuantumEventAsync("QUANTUM_OPERATION_EXECUTED", userId, new Dictionary<string, object>
                {
                    { "OperationId", operationId },
                    { "Success", result.Success }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to execute quantum operation");
                await Clients.Caller.SendAsync("QuantumOperationError", new { OperationId = operationId, Error = ex.Message });
            }
        }

        /// <summary>
        /// Subscribe to quantum metrics
        /// </summary>
        public async Task SubscribeToQuantumMetrics()
        {
            var userId = GetUserId();
            await Groups.AddToGroupAsync(Context.ConnectionId, "QuantumMonitors");

            await LogQuantumEventAsync("SUBSCRIBED_TO_QUANTUM_METRICS", userId, new Dictionary<string, object>
            {
                { "SubscriptionType", "QuantumMetrics" }
            });

            var status = await GetQuantumStatusAsync();
            await Clients.Caller.SendAsync("QuantumMetrics", status);
        }

        /// <summary>
        /// Get quantum system status
        /// </summary>
        private async Task<QuantumStatusDto> GetQuantumStatusAsync()
        {
            var health = await _quantumOrchestrator.GetSystemHealthAsync();

            return new QuantumStatusDto
            {
                QuantumHealth = health.HealthScore,
                IsQuantumOperational = health.HealthScore > 0.8,
                ConnectedQuantumClients = QuantumConnections.Count,
                LastUpdate = DateTime.UtcNow,
                QuantumCoherence = 0.95 // Simulated quantum coherence level
            };
        }

        /// <summary>
        /// Get user ID from context
        /// </summary>
        private string GetUserId()
        {
            return Context.User?.FindFirst("sub")?.Value ??
                   Context.User?.FindFirst("id")?.Value ??
                   Context.ConnectionId;
        }

        /// <summary>
        /// Log quantum hub event
        /// </summary>
        private async Task LogQuantumEventAsync(string eventType, string userId, Dictionary<string, object> details)
        {
            try
            {
                await _auditLogger.LogAuditEventAsync(new AuditEvent
                {
                    EventType = eventType,
                    UserId = userId,
                    Description = $"Quantum Hub: {eventType}",
                    Details = details,
                    ResourceId = Context.ConnectionId,
                    ComplianceLevel = "QUANTUM_OPERATIONS"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to log quantum hub event");
            }
        }
    }

    #region Supporting Classes

    public class UserConnection
    {
        public required string ConnectionId { get; set; }
        public required string UserId { get; set; }
        public required DateTime ConnectedAt { get; set; }
        public required DateTime LastActivity { get; set; }
    }

    public class QuantumConnection
    {
        public required string ConnectionId { get; set; }
        public required string UserId { get; set; }
        public required DateTime ConnectedAt { get; set; }
        public required bool QuantumEnabled { get; set; }
    }

    public class SystemAlert
    {
        public required string AlertType { get; set; }
        public required string Severity { get; set; }
        public required string Message { get; set; }
        public required DateTime Timestamp { get; set; }
    }

    public class SystemStatusDto
    {
        public required double SystemHealth { get; set; }
        public required bool IsOperational { get; set; }
        public required int ConnectedUsers { get; set; }
        public required DateTime LastUpdate { get; set; }
        public required List<string> SystemAlerts { get; set; }
    }

    public class QuantumStatusDto
    {
        public required double QuantumHealth { get; set; }
        public required bool IsQuantumOperational { get; set; }
        public required int ConnectedQuantumClients { get; set; }
        public required DateTime LastUpdate { get; set; }
        public required double QuantumCoherence { get; set; }
    }

    #endregion
}
