using Microsoft.AspNetCore.SignalR;
using TerraFusion.Consciousness.Services;
using TerraFusion.Consciousness.DTOs;
using TerraFusion.Consciousness.Interfaces;

namespace TerraFusion.Consciousness.Hubs
{
    /// <summary>
    /// Quantum Consciousness Hub
    /// Real-time SignalR hub for consciousness system updates
    /// THE TERRAFUSION WAY - Government. Transcended.
    /// </summary>
    public class QuantumConsciousnessHub : Hub
    {
        private readonly IQuantumConsciousnessOrchestrator _orchestrator;
        private readonly ILogger<QuantumConsciousnessHub> _logger;

        public QuantumConsciousnessHub(
            IQuantumConsciousnessOrchestrator orchestrator,
            ILogger<QuantumConsciousnessHub> logger)
        {
            _orchestrator = orchestrator;
            _logger = logger;
        }

        /// <summary>
        /// Client connects to consciousness updates
        /// </summary>
        public async Task JoinConsciousnessUpdates()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "ConsciousnessUpdates");
            _logger.LogInformation("🧠 Client {ConnectionId} joined consciousness updates", Context.ConnectionId);

            // Send current status immediately
            var status = await _orchestrator.GetConsciousnessStatusAsync();
            await Clients.Caller.SendAsync("ConsciousnessStatusUpdate", status);
        }

        /// <summary>
        /// Client leaves consciousness updates
        /// </summary>
        public async Task LeaveConsciousnessUpdates()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "ConsciousnessUpdates");
            _logger.LogInformation("🧠 Client {ConnectionId} left consciousness updates", Context.ConnectionId);
        }

        /// <summary>
        /// Client joins security alerts
        /// </summary>
        public async Task JoinSecurityAlerts()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "SecurityAlerts");
            _logger.LogInformation("🔐 Client {ConnectionId} joined security alerts", Context.ConnectionId);
        }

        /// <summary>
        /// Client leaves security alerts
        /// </summary>
        public async Task LeaveSecurityAlerts()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "SecurityAlerts");
            _logger.LogInformation("🔐 Client {ConnectionId} left security alerts", Context.ConnectionId);
        }

        /// <summary>
        /// Client joins emergency response updates
        /// </summary>
        public async Task JoinEmergencyUpdates()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "EmergencyUpdates");
            _logger.LogInformation("🚨 Client {ConnectionId} joined emergency updates", Context.ConnectionId);
        }

        /// <summary>
        /// Client leaves emergency response updates
        /// </summary>
        public async Task LeaveEmergencyUpdates()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "EmergencyUpdates");
            _logger.LogInformation("🚨 Client {ConnectionId} left emergency updates", Context.ConnectionId);
        }

        /// <summary>
        /// Get current metrics on demand
        /// </summary>
        public async Task RequestCurrentMetrics()
        {
            try
            {
                var metrics = await _orchestrator.GetRealTimeMetricsAsync();
                await Clients.Caller.SendAsync("MetricsUpdate", metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to send metrics to client {ConnectionId}", Context.ConnectionId);
                await Clients.Caller.SendAsync("Error", new { Message = "Failed to retrieve metrics", Details = ex.Message });
            }
        }

        /// <summary>
        /// Connection established
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("🔗 Client {ConnectionId} connected to Quantum Consciousness Hub", Context.ConnectionId);

            // Send welcome message with system info
            await Clients.Caller.SendAsync("Welcome", new
            {
                Message = "🧠⚡ Connected to TerraFusion Quantum Consciousness - Government. Transcended!",
                Timestamp = DateTime.UtcNow,
                MaxAgents = 1000000,
                QuantumSecurity = true,
                GovernmentGrade = true
            });

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Connection terminated
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("🔌 Client {ConnectionId} disconnected from Quantum Consciousness Hub", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }

    /// <summary>
    /// Real-time Consciousness Broadcasting Service
    /// Background service that broadcasts consciousness updates to connected clients
    /// </summary>
    public class ConsciousnessBroadcastService : BackgroundService
    {
        private readonly IHubContext<QuantumConsciousnessHub> _hubContext;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ConsciousnessBroadcastService> _logger;
        private readonly TimeSpan _broadcastInterval = TimeSpan.FromSeconds(5); // 5-second updates

        public ConsciousnessBroadcastService(
            IHubContext<QuantumConsciousnessHub> hubContext,
            IServiceProvider serviceProvider,
            ILogger<ConsciousnessBroadcastService> logger)
        {
            _hubContext = hubContext;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("📡 Starting Consciousness Broadcast Service - THE TERRAFUSION WAY!");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var orchestrator = scope.ServiceProvider.GetRequiredService<IQuantumConsciousnessOrchestrator>();

                    // Get current consciousness status and metrics
                    var status = await orchestrator.GetConsciousnessStatusAsync();
                    var metrics = await orchestrator.GetRealTimeMetricsAsync();
                    var securityStatus = await orchestrator.GetQuantumSecurityStatusAsync();

                    // Broadcast to all connected clients
                    await _hubContext.Clients.Group("ConsciousnessUpdates")
                        .SendAsync("ConsciousnessStatusUpdate", status, stoppingToken);

                    await _hubContext.Clients.Group("ConsciousnessUpdates")
                        .SendAsync("MetricsUpdate", metrics, stoppingToken);

                    // Send security alerts if threat level is elevated
                    if (securityStatus.ThreatLevel > 0.3m)
                    {
                        await _hubContext.Clients.Group("SecurityAlerts")
                            .SendAsync("SecurityAlert", new
                            {
                                ThreatLevel = securityStatus.ThreatLevel,
                                ActiveThreats = securityStatus.ActiveThreats,
                                Timestamp = DateTime.UtcNow,
                                Message = "Elevated threat level detected - Quantum security actively mitigating"
                            }, stoppingToken);
                    }

                    // Log broadcast success (debug level to avoid spam)
                    _logger.LogDebug("📡 Consciousness status broadcast successful - {ActiveAgents} agents",
                        status.TotalActiveAgents);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Failed to broadcast consciousness updates");
                }

                // Wait for next broadcast interval
                await Task.Delay(_broadcastInterval, stoppingToken);
            }

            _logger.LogInformation("📡 Consciousness Broadcast Service stopped");
        }
    }
}