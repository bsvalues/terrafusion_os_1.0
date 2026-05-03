using System.Diagnostics;
using Microsoft.Extensions.Logging;
using TerraFusion.Consciousness.Interfaces;

namespace TerraFusion.Consciousness.Services
{
    /// <summary>
    /// Minimal compatibility implementation used to satisfy DI during API host
    /// startup and tests. It must remain explicit that this is a legacy fallback,
    /// not a governed operational consciousness runtime.
    /// </summary>
    public class LegacyConsciousnessService : IConsciousnessService
    {
        private readonly ILogger<LegacyConsciousnessService> _logger;
        private volatile bool _initialized;
        private readonly string _systemId = $"legacy-{Guid.NewGuid():N}";

        public LegacyConsciousnessService(ILogger<LegacyConsciousnessService> logger)
        {
            _logger = logger;
        }

        public async Task<ConsciousnessInitializationResult> InitializeAsync(CancellationToken cancellationToken = default)
        {
            _initialized = true;
            _logger.LogWarning("LegacyConsciousnessService initialized in compatibility mode (SystemId: {SystemId})", _systemId);

            return await Task.FromResult(new ConsciousnessInitializationResult
            {
                Success = true,
                SystemId = _systemId,
                InitializationTime = DateTime.UtcNow,
                SystemMetrics = new Dictionary<string, object>
                {
                    ["mode"] = "legacy_fallback",
                    ["governed_contract_available"] = false,
                    ["uptime_seconds"] = 0,
                    ["runtime_status"] = "unavailable"
                }
            });
        }

        public async Task<ConsciousnessOperationResult> ExecuteConsciousnessOperationAsync(
            ConsciousnessOperationRequest request,
            CancellationToken cancellationToken = default)
        {
            var sw = Stopwatch.StartNew();
            if (!_initialized)
            {
                await InitializeAsync(cancellationToken);
            }

            _logger.LogWarning("Blocking legacy consciousness operation {OperationId} of type {OperationType}",
                request.OperationId, request.OperationType);

            sw.Stop();
            return new ConsciousnessOperationResult
            {
                Success = false,
                OperationId = request.OperationId,
                Results = new Dictionary<string, object>(),
                ProcessingTime = sw.Elapsed,
                ErrorMessage = "Legacy fallback does not execute governed consciousness operations."
            };
        }

        public async Task<ConsciousnessHealthDto> GetConsciousnessHealthAsync(CancellationToken cancellationToken = default)
        {
            var health = new ConsciousnessHealthDto
            {
                OverallHealth = 0.0,
                ComponentHealth = new Dictionary<string, double>
                {
                    ["core"] = 0.0,
                    ["io"] = 0.0,
                    ["mesh"] = 0.0
                },
                SystemAlerts = new List<string> { "Legacy fallback only; governed consciousness runtime unavailable." },
                LastHealthCheck = DateTime.UtcNow,
                IsOperational = false
            };

            return await Task.FromResult(health);
        }

        public async Task<LayerOrchestrationResult> OrchestrateLayers(
            LayerOrchestrationRequest request,
            CancellationToken cancellationToken = default)
        {
            if (!_initialized)
            {
                await InitializeAsync(cancellationToken);
            }

            return new LayerOrchestrationResult
            {
                Success = false,
                RequestId = request.RequestId,
                LayerResults = request.TargetLayers.ToDictionary(
                    l => l,
                    l => (object)new { status = "unavailable", mode = "legacy_fallback" }
                ),
                ConsensusAchieved = false
            };
        }

        public async Task<ScalingResult> ScaleConsciousnessAsync(
            ScalingRequest request,
            CancellationToken cancellationToken = default)
        {
            // No-op scaling with acknowledgement
            return await Task.FromResult(new ScalingResult
            {
                Success = false,
                ScalingType = request.ScalingType,
                CurrentCapacity = 0,
                ScalingTime = TimeSpan.Zero
            });
        }

        public async Task<ConsciousnessValidationResult> ValidateSystemIntegrityAsync(CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new ConsciousnessValidationResult
            {
                IsValid = false,
                ComponentValidations = new Dictionary<string, bool>
                {
                    ["core"] = false,
                    ["mesh"] = false,
                    ["security"] = false
                },
                ValidationMessages = new List<string> { "Legacy fallback only; no governed consciousness integrity evidence available." },
                ComplianceScore = 0.0
            });
        }
    }
}
