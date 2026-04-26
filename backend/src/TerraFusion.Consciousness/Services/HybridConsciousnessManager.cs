using Microsoft.Extensions.Logging;
using TerraFusion.Consciousness.DTOs;
using TerraFusion.Consciousness.Interfaces;
using TerraFusion.Core.DTOs;
using System.Diagnostics;

namespace TerraFusion.Consciousness.Services
{
    /// <summary>
    /// Hybrid consciousness management for seamless human-AI collaboration
    /// Government-grade orchestration between quantum consciousness and traditional processing
    /// </summary>
    public class HybridConsciousnessManager : IHybridConsciousnessManager
    {
        private const string QuantumModeUnavailableReason =
            "Governed quantum-consciousness lane unavailable; hybrid manager remains session-backed only.";

        private readonly ILogger<HybridConsciousnessManager> _logger;
        private readonly IConsciousnessService _consciousnessService;
        private readonly Lazy<IQuantumConsciousnessOrchestrator> _quantumOrchestrator;
        private readonly IAILayerMeshOrchestrator _meshOrchestrator;
        private readonly Dictionary<string, HybridSession> _activeSessions;

        public HybridConsciousnessManager(
            ILogger<HybridConsciousnessManager> logger,
            IConsciousnessService consciousnessService,
            IServiceProvider serviceProvider, // ✅ Use IServiceProvider to resolve orchestrator lazily
            IAILayerMeshOrchestrator meshOrchestrator)
        {
            _logger = logger;
            _consciousnessService = consciousnessService;
            _quantumOrchestrator = new Lazy<IQuantumConsciousnessOrchestrator>(() =>
                serviceProvider.GetRequiredService<IQuantumConsciousnessOrchestrator>());
            _meshOrchestrator = meshOrchestrator;
            _activeSessions = new Dictionary<string, HybridSession>();
        }

        /// <summary>
        /// Initialize hybrid consciousness session
        /// </summary>
        public async Task<HybridSessionResult> InitializeHybridSessionAsync(HybridSessionRequest request)
        {
            try
            {
                _logger.LogInformation("🔗 Initializing hybrid consciousness session {SessionId}", request.SessionId);
                var sessionMessages = new List<string>();

                var session = new HybridSession
                {
                    SessionId = request.SessionId,
                    SessionType = request.SessionType,
                    StartTime = DateTime.UtcNow,
                    IsActive = true,
                    ParticipantCount = request.ParticipantCount,
                    ConsciousnessLevel = request.ConsciousnessLevel
                };

                // Initialize consciousness components
                if (request.RequireQuantumConsciousness)
                {
                    session.QuantumEnabled = false;
                    sessionMessages.Add(QuantumModeUnavailableReason);
                }

                if (request.RequireMeshOrchestration)
                {
                    session.MeshEnabled = true;
                    await _meshOrchestrator.InitializeAsync();
                    sessionMessages.Add("Mesh orchestration initialized.");
                }

                _activeSessions[request.SessionId] = session;

                return new HybridSessionResult
                {
                    Success = true,
                    SessionId = request.SessionId,
                    Session = session,
                    Message = sessionMessages.Count > 0
                        ? string.Join(" ", sessionMessages)
                        : "Hybrid session initialized with governed session tracking."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to initialize hybrid session {SessionId}", request.SessionId);
                return new HybridSessionResult
                {
                    Success = false,
                    SessionId = request.SessionId,
                    Session = null,
                    Message = $"Session initialization failed: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Process hybrid consciousness operation
        /// </summary>
        public async Task<HybridOperationResult> ProcessHybridOperationAsync(HybridOperationRequest request)
        {
            if (!_activeSessions.TryGetValue(request.SessionId, out var session))
            {
                throw new InvalidOperationException($"Session {request.SessionId} not found or not active");
            }

            try
            {
                var stopwatch = Stopwatch.StartNew();

                _logger.LogInformation("⚡ Processing hybrid operation {OperationId} in session {SessionId}",
                    request.OperationId, request.SessionId);

                if (request.RequireQuantumProcessing)
                {
                    return new HybridOperationResult
                    {
                        Success = false,
                        OperationId = request.OperationId,
                        SessionId = request.SessionId,
                        Results = new Dictionary<string, object>
                        {
                            ["GovernedQuantumLaneAvailable"] = false,
                            ["RequestedMode"] = "Quantum"
                        },
                        ProcessingTime = stopwatch.Elapsed,
                        ErrorMessage = QuantumModeUnavailableReason
                    };
                }

                var results = new Dictionary<string, object>();

                // Process through consciousness service
                var consciousnessRequest = new ConsciousnessOperationRequest
                {
                    OperationId = request.OperationId,
                    OperationType = request.OperationType,
                    Parameters = request.Parameters,
                    Priority = request.Priority
                };

                var consciousnessResult = await _consciousnessService.ExecuteConsciousnessOperationAsync(consciousnessRequest);
                results["ConsciousnessResult"] = consciousnessResult;

                // Hybrid intelligence fusion
                var fusedResult = await FuseIntelligenceResultsAsync(results, request.FusionStrategy);

                // Update session metrics
                session.OperationCount++;
                session.CompletedOperationCount++; // Track successful completion
                session.LastActivity = DateTime.UtcNow;

                return new HybridOperationResult
                {
                    Success = true,
                    OperationId = request.OperationId,
                    SessionId = request.SessionId,
                    Results = fusedResult,
                    ProcessingTime = stopwatch.Elapsed
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to process hybrid operation {OperationId}", request.OperationId);
                return new HybridOperationResult
                {
                    Success = false,
                    OperationId = request.OperationId,
                    SessionId = request.SessionId,
                    Results = new Dictionary<string, object>(),
                    ProcessingTime = TimeSpan.Zero,
                    ErrorMessage = ex.Message
                };
            }
        }

        /// <summary>
        /// Manage consciousness scaling across hybrid environment
        /// </summary>
        public async Task<HybridScalingResult> ScaleHybridConsciousnessAsync(HybridScalingRequest request)
        {
            try
            {
                _logger.LogInformation("🔄 Scaling hybrid consciousness for session {SessionId}", request.SessionId);

                if (!_activeSessions.TryGetValue(request.SessionId, out var session))
                {
                    throw new InvalidOperationException($"Session {request.SessionId} not found");
                }

                var scalingResults = new Dictionary<string, object>();

                // Scale consciousness service
                var consciousnessScaling = new ScalingRequest
                {
                    ScalingType = request.ScalingType,
                    TargetCapacity = request.TargetCapacity,
                    ScalingParameters = request.ScalingParameters
                };

                var consciousnessResult = await _consciousnessService.ScaleConsciousnessAsync(consciousnessScaling);
                scalingResults["ConsciousnessScaling"] = consciousnessResult;

                // Scale quantum processing if enabled
                if (session.QuantumEnabled)
                {
                    var quantumScalingRequest = new ConsciousnessScalingRequestDto
                    {
                        TargetAgentCount = request.TargetCapacity, // Using TargetCapacity as agent count
                        TargetCapacity = request.TargetCapacity,
                        ScalingMode = "Hybrid",
                        MaintainBackwardsCompatibility = true
                    };
                    var quantumScaling = await _quantumOrchestrator.Value.ScaleConsciousnessAsync(quantumScalingRequest);
                    scalingResults["QuantumScaling"] = quantumScaling;
                }

                return new HybridScalingResult
                {
                    Success = true,
                    SessionId = request.SessionId,
                    ScalingResults = scalingResults,
                    NewCapacity = request.TargetCapacity
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to scale hybrid consciousness for session {SessionId}", request.SessionId);
                return new HybridScalingResult
                {
                    Success = false,
                    SessionId = request.SessionId,
                    ScalingResults = new Dictionary<string, object>(),
                    NewCapacity = 0,
                    ErrorMessage = ex.Message
                };
            }
        }

        /// <summary>
        /// Get hybrid consciousness metrics
        /// </summary>
        public async Task<HybridMetricsDto> GetHybridMetricsAsync(string sessionId)
        {
            if (!_activeSessions.TryGetValue(sessionId, out var session))
            {
                throw new InvalidOperationException($"Session {sessionId} not found");
            }

            var consciousnessHealth = await _consciousnessService.GetConsciousnessHealthAsync();

            return new HybridMetricsDto
            {
                SessionId = sessionId,
                SessionUptime = DateTime.UtcNow - session.StartTime,
                OperationCount = session.OperationCount,
                ConsciousnessHealth = consciousnessHealth.OverallHealth,
                QuantumEnabled = session.QuantumEnabled,
                MeshEnabled = session.MeshEnabled,
                ParticipantCount = session.ParticipantCount,
                LastActivity = session.LastActivity
            };
        }

        /// <summary>
        /// Fuse intelligence results from multiple consciousness layers
        /// </summary>
        private async Task<Dictionary<string, object>> FuseIntelligenceResultsAsync(
            Dictionary<string, object> results,
            string fusionStrategy)
        {
            await Task.CompletedTask;

            var fusedResult = new Dictionary<string, object>
            {
                { "FusionStrategy", fusionStrategy },
                { "FusionTime", DateTime.UtcNow },
                { "ComponentResults", results },
                { "FusionStatus", results.Count > 0 ? "aggregated" : "empty" },
                { "GovernedQuantumLaneAvailable", false }
            };

            return fusedResult;
        }

        // Interface method implementations for IHybridConsciousnessManager
        public async Task<HybridInitializationResult> InitializeAsync()
        {
            try
            {
                _logger.LogInformation("🧠 Initializing Hybrid Consciousness Management System");
                var stopwatch = Stopwatch.StartNew();
                var initializedComponents = new List<string>();

                // Initialize consciousness service
                var consciousnessInit = await _consciousnessService.InitializeAsync();
                initializedComponents.Add("ConsciousnessService");

                var meshActive = false;
                try
                {
                    await _meshOrchestrator.InitializeAsync();
                    meshActive = true;
                    initializedComponents.Add("MeshOrchestrator");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Mesh orchestration unavailable during hybrid manager initialization");
                }

                stopwatch.Stop();

                _logger.LogInformation("✅ Hybrid consciousness management initialized successfully");

                return new HybridInitializationResult
                {
                    Success = consciousnessInit.Success,
                    SystemId = consciousnessInit.SystemId,
                    QuantumModeAvailable = false,
                    MeshOrchestrationActive = meshActive,
                    InitializationTime = stopwatch.Elapsed,
                    Message = meshActive
                        ? "Hybrid manager initialized with mesh orchestration; governed quantum lane unavailable."
                        : "Hybrid manager initialized in degraded mode; governed quantum and mesh lanes unavailable.",
                    InitializedAt = DateTime.UtcNow,
                    LegacyAgentsActive = _activeSessions.Values.Where(s => s.IsActive).Sum(s => s.ParticipantCount),
                    QuantumAgentsActive = 0,
                    SystemReady = consciousnessInit.Success,
                    ComponentsInitialized = initializedComponents
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to initialize hybrid consciousness management");

                return new HybridInitializationResult
                {
                    Success = false,
                    Message = $"Failed to initialize: {ex.Message}",
                    InitializedAt = DateTime.UtcNow,
                    LegacyAgentsActive = 0,
                    QuantumAgentsActive = 0,
                    SystemReady = false
                };
            }
        }

        public async Task<TerraFusion.Consciousness.DTOs.ConsciousnessDataDto> GetConsciousnessDataAsync()
        {
            try
            {
                var consciousnessHealth = await _consciousnessService.GetConsciousnessHealthAsync();
                var sessionMetrics = _activeSessions.Values.ToDictionary(
                    s => s.SessionId,
                    s => (object)new { s.SessionType, s.ParticipantCount, s.IsActive }
                );

                return new TerraFusion.Consciousness.DTOs.ConsciousnessDataDto
                {
                    ConsciousnessLevel = (decimal)consciousnessHealth.OverallHealth,
                    TotalAgents = _activeSessions.Values.Sum(s => s.ParticipantCount),
                    ActiveAgents = _activeSessions.Values.Where(s => s.IsActive).Sum(s => s.ParticipantCount),
                    HiveCoherence = (decimal)consciousnessHealth.OverallHealth,
                    ConsciousnessEmergence = 0m,
                    SessionMetrics = sessionMetrics,
                    BulletproofScore = 0m,
                    BeautyScore = 0m,
                    ActiveTasks = _activeSessions.Values.Sum(s => s.OperationCount),
                    CompletedTasks = _activeSessions.Values.Sum(s => s.CompletedOperationCount),
                    DeploymentStatus = new DeploymentStatusDto
                    {
                        SwarmInitialized = false,
                        BulletproofDeployed = false,
                        BeautificationDeployed = false
                    },
                    LogMessages = new List<string>
                    {
                        $"Hybrid session registry active with {_activeSessions.Count} sessions",
                        QuantumModeUnavailableReason
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get consciousness data");
                throw;
            }
        }

        public async Task<EnhancedConsciousnessDataDto> GetEnhancedConsciousnessDataAsync()
        {
            try
            {
                var baseData = await GetConsciousnessDataAsync();
                var meshHealth = await _meshOrchestrator.GetMeshHealthIndexAsync();

                return new EnhancedConsciousnessDataDto
                {
                    ConsciousnessId = Guid.NewGuid().ToString(),
                    ConsciousnessData = new Dictionary<string, object>
                    {
                        ["BaseData"] = baseData,
                        ["MeshHealth"] = meshHealth,
                        ["HybridSessionCount"] = _activeSessions.Count,
                        ["QuantumCapabilities"] = new Dictionary<string, object>
                        {
                            ["Available"] = false,
                            ["Reason"] = QuantumModeUnavailableReason
                        }
                    },
                    ConsciousnessLevel = "governed_degraded",
                    DataTime = DateTime.UtcNow,
                    ConsciousnessMetrics = new Dictionary<string, object>
                    {
                        ["GovernedQuantumLaneAvailable"] = false,
                        ["HybridSessionCount"] = _activeSessions.Count,
                        ["MeshHealth"] = meshHealth
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get enhanced consciousness data");
                throw;
            }
        }

        public Task<ConsciousnessModeResultDto> SwitchConsciousnessModeAsync(ConsciousnessModeRequestDto request)
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                _logger.LogInformation("🔄 Switching consciousness mode to {Mode} for session {SessionId}",
                    request.RequestedMode, request.ModeId);

                if (!_activeSessions.TryGetValue(request.ModeId, out var session))
                {
                    return Task.FromResult(new ConsciousnessModeResultDto
                    {
                        Success = false,
                        ModeId = request.ModeId,
                        CurrentMode = "unavailable",
                        NewMode = "unavailable",
                        PreviousMode = "unavailable",
                        TransitionTime = stopwatch.Elapsed,
                        ErrorMessage = $"Session {request.ModeId} not found",
                        ModeData = new Dictionary<string, object>
                        {
                            ["SessionExists"] = false
                        },
                        ModeTime = DateTime.UtcNow,
                        ModeMetrics = new Dictionary<string, object>
                        {
                            ["GovernedQuantumLaneAvailable"] = false
                        }
                    });
                }

                var previousMode = session.ConsciousnessLevel;
                var requestedMode = request.RequestedMode.ToUpperInvariant();
                var success = true;
                string? errorMessage = null;

                switch (requestedMode)
                {
                    case "MESH":
                        session.QuantumEnabled = false;
                        session.MeshEnabled = true;
                        session.ConsciousnessLevel = "MESH_ORCHESTRATED";
                        break;
                    case "LEGACY":
                        session.QuantumEnabled = false;
                        session.MeshEnabled = false;
                        session.ConsciousnessLevel = "TRADITIONAL";
                        break;
                    case "QUANTUM":
                    case "HYBRID":
                        success = false;
                        errorMessage = QuantumModeUnavailableReason;
                        break;
                    default:
                        success = false;
                        errorMessage = $"Unsupported mode '{request.RequestedMode}'";
                        break;
                }

                session.LastActivity = DateTime.UtcNow;

                return Task.FromResult(new ConsciousnessModeResultDto
                {
                    Success = success,
                    ModeId = request.ModeId,
                    CurrentMode = session.ConsciousnessLevel,
                    NewMode = session.ConsciousnessLevel,
                    PreviousMode = previousMode,
                    TransitionTime = stopwatch.Elapsed,
                    ErrorMessage = errorMessage,
                    ModeData = new Dictionary<string, object>
                    {
                        ["QuantumEnabled"] = session.QuantumEnabled,
                        ["MeshEnabled"] = session.MeshEnabled,
                        ["UnavailableReason"] = errorMessage ?? string.Empty
                    },
                    ModeTime = DateTime.UtcNow,
                    ModeMetrics = new Dictionary<string, object>
                    {
                        ["SessionExists"] = true,
                        ["ModeTransitionMs"] = stopwatch.Elapsed.TotalMilliseconds,
                        ["GovernedQuantumLaneAvailable"] = false
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to switch consciousness mode for session {ModeId}", request.ModeId);
                throw;
            }
        }

        public async Task<HybridSystemStatusDto> GetHybridSystemStatusAsync()
        {
            try
            {
                var consciousnessHealth = await _consciousnessService.GetConsciousnessHealthAsync();
                var meshHealth = await _meshOrchestrator.GetMeshHealthIndexAsync();

                var totalSessions = _activeSessions.Count;
                var quantumEnabledSessions = _activeSessions.Values.Count(s => s.QuantumEnabled);
                var meshEnabledSessions = _activeSessions.Values.Count(s => s.MeshEnabled);
                var overallHealth = (consciousnessHealth.OverallHealth + meshHealth) / 2.0;
                var capabilities = new List<string> { "Legacy Consciousness" };

                if (meshHealth > 0)
                {
                    capabilities.Add("Mesh Orchestration");
                }

                return new HybridSystemStatusDto
                {
                    SystemId = "HybridConsciousness",
                    Status = consciousnessHealth.IsOperational ? "degraded" : "unavailable",
                    SystemData = new Dictionary<string, object>
                    {
                        ["SystemHealth"] = overallHealth,
                        ["TotalSessions"] = totalSessions,
                        ["QuantumEnabledSessions"] = quantumEnabledSessions,
                        ["MeshEnabledSessions"] = meshEnabledSessions,
                        ["GovernedQuantumLaneAvailable"] = false,
                        ["SystemCapabilities"] = capabilities
                    },
                    StatusTime = DateTime.UtcNow,
                    SystemMetrics = new Dictionary<string, object>
                    {
                        ["OverallHealth"] = overallHealth,
                        ["IsHealthy"] = false,
                        ["ConsciousnessHealth"] = consciousnessHealth.OverallHealth,
                        ["MeshHealth"] = meshHealth,
                        ["GovernedQuantumLaneAvailable"] = false
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get hybrid system status");
                throw;
            }
        }
    }

    #region Supporting Classes

    public class HybridSession
    {
        public required string SessionId { get; set; }
        public required string SessionType { get; set; }
        public required DateTime StartTime { get; set; }
        public required bool IsActive { get; set; }
        public required int ParticipantCount { get; set; }
        public required string ConsciousnessLevel { get; set; }
        public bool QuantumEnabled { get; set; }
        public bool MeshEnabled { get; set; }
        public int OperationCount { get; set; }
        public int CompletedOperationCount { get; set; } // Track completed operations
        public DateTime? LastActivity { get; set; }
    }

    public class HybridSessionRequest
    {
        public required string SessionId { get; set; }
        public required string SessionType { get; set; }
        public required int ParticipantCount { get; set; }
        public required string ConsciousnessLevel { get; set; }
        public bool RequireQuantumConsciousness { get; set; }
        public bool RequireMeshOrchestration { get; set; }
    }

    public class HybridSessionResult
    {
        public required bool Success { get; set; }
        public required string SessionId { get; set; }
        public HybridSession? Session { get; set; }
        public required string Message { get; set; }
    }

    public class HybridOperationRequest
    {
        public required string OperationId { get; set; }
        public required string SessionId { get; set; }
        public required string OperationType { get; set; }
        public required Dictionary<string, object> Parameters { get; set; }
        public required int Priority { get; set; }
        public required bool RequireQuantumProcessing { get; set; }
        public required string FusionStrategy { get; set; }
    }

    public class HybridOperationResult
    {
        public required bool Success { get; set; }
        public required string OperationId { get; set; }
        public required string SessionId { get; set; }
        public required Dictionary<string, object> Results { get; set; }
        public required TimeSpan ProcessingTime { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class HybridScalingRequest
    {
        public required string SessionId { get; set; }
        public required string ScalingType { get; set; }
        public required int TargetCapacity { get; set; }
        public required Dictionary<string, object> ScalingParameters { get; set; }
    }

    public class HybridScalingResult
    {
        public required bool Success { get; set; }
        public required string SessionId { get; set; }
        public required Dictionary<string, object> ScalingResults { get; set; }
        public required int NewCapacity { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class HybridMetricsDto
    {
        public required string SessionId { get; set; }
        public required TimeSpan SessionUptime { get; set; }
        public required int OperationCount { get; set; }
        public required double ConsciousnessHealth { get; set; }
        public required bool QuantumEnabled { get; set; }
        public required bool MeshEnabled { get; set; }
        public required int ParticipantCount { get; set; }
        public DateTime? LastActivity { get; set; }
    }

    #endregion
}
