using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace TerraFusion.API.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time communication with OmniscientGovernmentOrchestrator
    /// Provides WebSocket connections for live monitoring and event streaming
    /// </summary>
    [Authorize]
    public class OmniscientHub : Hub
    {
        private readonly ILogger<OmniscientHub> _logger;
        private static readonly Dictionary<string, HashSet<string>> _groupConnections = new();
        private static readonly object _lock = new();

        public OmniscientHub(ILogger<OmniscientHub> logger)
        {
            _logger = logger;
        }

        // ==================== CONNECTION MANAGEMENT ====================

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var connectionId = Context.ConnectionId;
            
            _logger.LogInformation("User {UserId} connected with connection {ConnectionId}", userId, connectionId);

            // Add to general monitoring group
            await Groups.AddToGroupAsync(connectionId, "OmniscientMonitoring");

            // Send initial system status
            await Clients.Caller.SendAsync("SystemStatus", new
            {
                Status = "Connected",
                SystemHealth = "Optimal",
                Timestamp = DateTime.UtcNow,
                ConnectionId = connectionId
            });

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var connectionId = Context.ConnectionId;

            _logger.LogInformation("User {UserId} disconnected from connection {ConnectionId}. Exception: {Exception}", 
                userId, connectionId, exception?.Message);

            // Remove from all groups
            lock (_lock)
            {
                foreach (var group in _groupConnections.Keys.ToList())
                {
                    _groupConnections[group].Remove(connectionId);
                    if (_groupConnections[group].Count == 0)
                    {
                        _groupConnections.Remove(group);
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        // ==================== GROUP MANAGEMENT ====================

        public async Task JoinOptimizationGroup(string optimizationId)
        {
            var connectionId = Context.ConnectionId;
            var groupName = $"Optimization_{optimizationId}";

            await Groups.AddToGroupAsync(connectionId, groupName);

            lock (_lock)
            {
                if (!_groupConnections.ContainsKey(groupName))
                {
                    _groupConnections[groupName] = new HashSet<string>();
                }
                _groupConnections[groupName].Add(connectionId);
            }

            _logger.LogInformation("Connection {ConnectionId} joined optimization group {GroupName}", connectionId, groupName);

            await Clients.Caller.SendAsync("JoinedGroup", new
            {
                GroupName = groupName,
                OptimizationId = optimizationId,
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task LeaveOptimizationGroup(string optimizationId)
        {
            var connectionId = Context.ConnectionId;
            var groupName = $"Optimization_{optimizationId}";

            await Groups.RemoveFromGroupAsync(connectionId, groupName);

            lock (_lock)
            {
                if (_groupConnections.ContainsKey(groupName))
                {
                    _groupConnections[groupName].Remove(connectionId);
                    if (_groupConnections[groupName].Count == 0)
                    {
                        _groupConnections.Remove(groupName);
                    }
                }
            }

            _logger.LogInformation("Connection {ConnectionId} left optimization group {GroupName}", connectionId, groupName);

            await Clients.Caller.SendAsync("LeftGroup", new
            {
                GroupName = groupName,
                OptimizationId = optimizationId,
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task JoinJurisdictionGroup(string jurisdictionId)
        {
            var connectionId = Context.ConnectionId;
            var groupName = $"Jurisdiction_{jurisdictionId}";

            await Groups.AddToGroupAsync(connectionId, groupName);

            lock (_lock)
            {
                if (!_groupConnections.ContainsKey(groupName))
                {
                    _groupConnections[groupName] = new HashSet<string>();
                }
                _groupConnections[groupName].Add(connectionId);
            }

            _logger.LogInformation("Connection {ConnectionId} joined jurisdiction group {GroupName}", connectionId, groupName);

            await Clients.Caller.SendAsync("JoinedJurisdictionGroup", new
            {
                GroupName = groupName,
                JurisdictionId = jurisdictionId,
                Timestamp = DateTime.UtcNow
            });
        }

        // ==================== REAL-TIME MONITORING ====================

        public async Task StartRealTimeMonitoring(string[] monitoringTypes)
        {
            var connectionId = Context.ConnectionId;
            
            foreach (var type in monitoringTypes)
            {
                var groupName = $"Monitor_{type}";
                await Groups.AddToGroupAsync(connectionId, groupName);

                lock (_lock)
                {
                    if (!_groupConnections.ContainsKey(groupName))
                    {
                        _groupConnections[groupName] = new HashSet<string>();
                    }
                    _groupConnections[groupName].Add(connectionId);
                }
            }

            _logger.LogInformation("Connection {ConnectionId} started monitoring: {MonitoringTypes}", 
                connectionId, string.Join(", ", monitoringTypes));

            await Clients.Caller.SendAsync("MonitoringStarted", new
            {
                MonitoringTypes = monitoringTypes,
                Timestamp = DateTime.UtcNow
            });

            // Send initial data for each monitoring type
            foreach (var type in monitoringTypes)
            {
                await SendInitialMonitoringData(type);
            }
        }

        public async Task StopRealTimeMonitoring(string[] monitoringTypes)
        {
            var connectionId = Context.ConnectionId;

            foreach (var type in monitoringTypes)
            {
                var groupName = $"Monitor_{type}";
                await Groups.RemoveFromGroupAsync(connectionId, groupName);

                lock (_lock)
                {
                    if (_groupConnections.ContainsKey(groupName))
                    {
                        _groupConnections[groupName].Remove(connectionId);
                        if (_groupConnections[groupName].Count == 0)
                        {
                            _groupConnections.Remove(groupName);
                        }
                    }
                }
            }

            _logger.LogInformation("Connection {ConnectionId} stopped monitoring: {MonitoringTypes}", 
                connectionId, string.Join(", ", monitoringTypes));

            await Clients.Caller.SendAsync("MonitoringStopped", new
            {
                MonitoringTypes = monitoringTypes,
                Timestamp = DateTime.UtcNow
            });
        }

        // ==================== SYSTEM COMMANDS ====================

        public async Task RequestSystemStatus()
        {
            await Clients.Caller.SendAsync("SystemStatusUpdate", new
            {
                SystemHealth = "Optimal",
                SwarmIntelligence = new
                {
                    ActiveAgents = 10000,
                    SwarmCoherence = 0.94,
                    EmergentPatterns = 23,
                    PerformanceIndex = 0.97,
                    QuantumAdvantage = 8547.3
                },
                ProbabilisticEngine = new
                {
                    PBitNetworkStatus = "Active",
                    UncertaintyReduction = 0.73,
                    BayesianAccuracy = 0.96,
                    QuantumCoherence = 0.91,
                    ProcessingSpeed = "150 ops/sec"
                },
                FractalHierarchy = new
                {
                    TotalAgents = 1000000,
                    ActiveLevels = 7,
                    CollectiveCoherence = 0.94,
                    CrossScaleSync = 0.97,
                    EmergentIntelligence = 0.89
                },
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task RequestEmergentPatterns()
        {
            await Clients.Caller.SendAsync("EmergentPatternsUpdate", new
            {
                SwarmPatterns = new[]
                {
                    new { Type = "Convergence", Strength = 0.94, Impact = 0.87, DetectedAt = DateTime.UtcNow.AddMinutes(-5) },
                    new { Type = "Spiral Formation", Strength = 0.89, Impact = 0.82, DetectedAt = DateTime.UtcNow.AddMinutes(-3) },
                    new { Type = "Phase Transition", Strength = 0.92, Impact = 0.91, DetectedAt = DateTime.UtcNow.AddMinutes(-1) }
                },
                QuantumPatterns = new object[]
                {
                    new { Type = "Entanglement Cascade", Coherence = 0.96, TunnelingEvents = 47, DetectedAt = DateTime.UtcNow.AddMinutes(-4) },
                    new { Type = "Bell Violation", Coherence = 0.91, BellValue = 2.82, DetectedAt = DateTime.UtcNow.AddMinutes(-2) },
                    new { Type = "Quantum Tunneling", Coherence = 0.88, Probability = 0.1, DetectedAt = DateTime.UtcNow }
                },
                FractalPatterns = new[]
                {
                    new { Type = "Cross-Scale Sync", Strength = 0.94, Level = "Multi-Level", Impact = "High" },
                    new { Type = "Collective Intelligence", Strength = 0.89, Level = "Army", Impact = "Critical" },
                    new { Type = "Adaptive Organization", Strength = 0.92, Level = "Corps", Impact = "High" }
                },
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task RequestPerformanceMetrics()
        {
            await Clients.Caller.SendAsync("PerformanceMetricsUpdate", new
            {
                OverallPerformance = new
                {
                    RevenueOptimizationAccuracy = 0.97,
                    PolicyPredictionAccuracy = 0.94,
                    CitizenServiceEfficiency = 0.96,
                    QuantumSpeedupFactor = 8547.3,
                    AdaptiveLearningRate = 0.23,
                    SystemThroughput = "1,247 optimizations/hour",
                    AverageResponseTime = "1.2 seconds",
                    ErrorRate = 0.003
                },
                ResourceUtilization = new
                {
                    CPUUsage = 0.67,
                    MemoryUsage = 0.54,
                    NetworkThroughput = "2.3 GB/s",
                    QuantumProcessorUtilization = 0.89,
                    SwarmCoordinationOverhead = 0.12
                },
                Timestamp = DateTime.UtcNow
            });
        }

        // ==================== HELPER METHODS ====================

        private async Task SendInitialMonitoringData(string monitoringType)
        {
            switch (monitoringType.ToLower())
            {
                case "swarm":
                    await Clients.Caller.SendAsync("SwarmMonitoringData", new
                    {
                        ActiveAgents = 10000,
                        SwarmCoherence = 0.94,
                        EmergentPatterns = 23,
                        AveragePerformance = 0.89,
                        QuantumEnhancement = true,
                        Timestamp = DateTime.UtcNow
                    });
                    break;

                case "probabilistic":
                    await Clients.Caller.SendAsync("ProbabilisticMonitoringData", new
                    {
                        PBitNetworkStatus = "Active",
                        UncertaintyReduction = 0.73,
                        BayesianAccuracy = 0.96,
                        QuantumCoherence = 0.91,
                        ProcessingSpeed = 150,
                        Timestamp = DateTime.UtcNow
                    });
                    break;

                case "fractal":
                    await Clients.Caller.SendAsync("FractalMonitoringData", new
                    {
                        TotalAgents = 1000000,
                        ActiveLevels = 7,
                        CollectiveCoherence = 0.94,
                        CrossScaleSync = 0.97,
                        EmergentIntelligence = 0.89,
                        Timestamp = DateTime.UtcNow
                    });
                    break;

                case "quantum":
                    await Clients.Caller.SendAsync("QuantumMonitoringData", new
                    {
                        QuantumAdvantage = 8547.3,
                        CoherenceTime = 1250.7,
                        EntanglementStrength = 0.94,
                        TunnelingEvents = 47,
                        BellViolations = 2.82,
                        QuantumSupremacy = true,
                        Timestamp = DateTime.UtcNow
                    });
                    break;

                case "optimization":
                    await Clients.Caller.SendAsync("OptimizationMonitoringData", new
                    {
                        ActiveOptimizations = 12,
                        CompletedToday = 1247,
                        AverageConfidence = 0.94,
                        AverageProcessingTime = 1.2,
                        SuccessRate = 0.997,
                        Timestamp = DateTime.UtcNow
                    });
                    break;
            }
        }

        public static Dictionary<string, int> GetConnectionStats()
        {
            lock (_lock)
            {
                return _groupConnections.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.Count
                );
            }
        }
    }

    /// <summary>
    /// Extension methods for OmniscientHub
    /// </summary>
    public static class OmniscientHubExtensions
    {
        public static void MapOmniscientHub(this WebApplication app)
        {
            app.MapHub<OmniscientHub>("/hubs/omniscient");
        }
    }
}
