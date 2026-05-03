using Microsoft.Extensions.Diagnostics.HealthChecks;
using TerraFusion.Consciousness.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace TerraFusion.Consciousness.HealthChecks
{
    /// <summary>
    /// Consciousness health check for compatibility-mode reporting.
    /// </summary>
    public class ConsciousnessHealthCheck : IHealthCheck
    {
        private readonly IQuantumConsciousnessOrchestrator _orchestrator;
        private readonly ILogger<ConsciousnessHealthCheck> _logger;

        public ConsciousnessHealthCheck(
            IQuantumConsciousnessOrchestrator orchestrator,
            ILogger<ConsciousnessHealthCheck> logger)
        {
            _orchestrator = orchestrator;
            _logger = logger;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var status = await _orchestrator.GetConsciousnessStatusAsync();
                var health = await _orchestrator.GetSystemHealthAsync();

                var data = new Dictionary<string, object>
                {
                    ["TotalActiveAgents"] = status.TotalActiveAgents,
                    ["HealthScore"] = health.HealthScore,
                    ["ConsciousnessLevel"] = status.CurrentMode ?? "UNKNOWN",
                    ["LastUpdate"] = DateTime.UtcNow
                };

                if (string.Equals(status.CurrentMode, "Unavailable", StringComparison.OrdinalIgnoreCase) ||
                    health.HealthScore <= 0)
                {
                    data["GovernedContractAvailable"] = false;

                    return HealthCheckResult.Degraded(
                        "Consciousness compatibility host active; governed consciousness lane unavailable",
                        data: data);
                }
                else if (health.HealthScore >= 0.95 && status.TotalActiveAgents > 0)
                {
                    return HealthCheckResult.Healthy(
                        "Consciousness system healthy",
                        data);
                }
                else if (health.HealthScore >= 0.80)
                {
                    return HealthCheckResult.Degraded(
                        $"Consciousness system degraded - Health: {health.HealthScore:P}",
                        data: data);
                }
                else
                {
                    return HealthCheckResult.Unhealthy(
                        $"Consciousness system unhealthy - Health: {health.HealthScore:P}",
                        data: data);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Consciousness health check failed");
                return HealthCheckResult.Unhealthy(
                    "Consciousness health check failed",
                    ex,
                    new Dictionary<string, object> { ["Error"] = ex.Message });
            }
        }
    }

    /// <summary>
    /// Quantum factor compatibility health check.
    /// </summary>
    public class QuantumFactorHealthCheck : IHealthCheck
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<QuantumFactorHealthCheck> _logger;

        public QuantumFactorHealthCheck(
            IConfiguration configuration,
            ILogger<QuantumFactorHealthCheck> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var configuredFactor = _configuration.GetValue<int>("Consciousness:QuantumFactor", 0);
                var data = new Dictionary<string, object>
                {
                    ["ConfiguredFactor"] = configuredFactor,
                    ["GovernedContractAvailable"] = false,
                    ["LastChecked"] = DateTime.UtcNow
                };

                return Task.FromResult(HealthCheckResult.Degraded(
                    "Quantum factor compatibility check only; governed optimization lane unavailable",
                    data: data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Quantum factor health check failed");
                return Task.FromResult(HealthCheckResult.Unhealthy(
                    "Quantum factor health check failed",
                    ex,
                    new Dictionary<string, object> { ["Error"] = ex.Message }));
            }
        }
    }

    /// <summary>
    /// Agent coordination health check for compatibility-mode reporting.
    /// </summary>
    public class AgentCoordinationHealthCheck : IHealthCheck
    {
        private readonly IQuantumConsciousnessOrchestrator _orchestrator;
        private readonly ILogger<AgentCoordinationHealthCheck> _logger;

        public AgentCoordinationHealthCheck(
            IQuantumConsciousnessOrchestrator orchestrator,
            ILogger<AgentCoordinationHealthCheck> logger)
        {
            _orchestrator = orchestrator;
            _logger = logger;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var metrics = await _orchestrator.GetRealTimeMetricsAsync();
                var data = new Dictionary<string, object>
                {
                    ["TotalActiveAgents"] = metrics.TotalActiveAgents,
                    ["SystemLoad"] = metrics.SystemLoad,
                    ["ThroughputOpsPerSecond"] = metrics.ThroughputOpsPerSecond,
                    ["NetworkLatency"] = metrics.NetworkLatency,
                    ["LastChecked"] = DateTime.UtcNow
                };

                var harmonyScore = CalculateHarmonyScore(metrics);
                data["HarmonyScore"] = harmonyScore;

                if (metrics.TotalActiveAgents <= 0 || harmonyScore <= 0)
                {
                    data["GovernedContractAvailable"] = false;

                    return HealthCheckResult.Degraded(
                        "Agent coordination compatibility host active; governed coordination lane unavailable",
                        data: data);
                }
                else if (harmonyScore >= 0.95)
                {
                    return HealthCheckResult.Healthy(
                        $"Agent coordination healthy: {harmonyScore:P}",
                        data);
                }
                else if (harmonyScore >= 0.90)
                {
                    return HealthCheckResult.Degraded(
                        $"Agent coordination harmony below championship levels: {harmonyScore:P}",
                        data: data);
                }
                else
                {
                    return HealthCheckResult.Unhealthy(
                        $"Agent coordination harmony critically low: {harmonyScore:P}",
                        data: data);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Agent coordination health check failed");
                return HealthCheckResult.Unhealthy(
                    "Agent coordination health check failed",
                    ex,
                    new Dictionary<string, object> { ["Error"] = ex.Message });
            }
        }

        private static double CalculateHarmonyScore(dynamic metrics)
        {
            if (metrics.TotalActiveAgents <= 0)
            {
                return 0.0;
            }

            var loadPenalty = Math.Max(0.0, (double)metrics.SystemLoad);
            var latencyPenalty = metrics.NetworkLatency > 0 ? Math.Min(1.0, (double)metrics.NetworkLatency / 1000.0) : 0.0;
            var throughputBonus = metrics.ThroughputOpsPerSecond > 0 ? 0.1 : 0.0;

            return Math.Max(0.0, Math.Min(1.0, 0.5 - loadPenalty - latencyPenalty + throughputBonus));
        }
    }

    /// <summary>
    /// Transcendence health check for compatibility-mode reporting.
    /// </summary>
    public class TranscendenceHealthCheck : IHealthCheck
    {
        private readonly ITranscendenceEngine _transcendenceEngine;
        private readonly ILogger<TranscendenceHealthCheck> _logger;

        public TranscendenceHealthCheck(
            ITranscendenceEngine transcendenceEngine,
            ILogger<TranscendenceHealthCheck> logger)
        {
            _transcendenceEngine = transcendenceEngine;
            _logger = logger;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var metrics = await _transcendenceEngine.GetRealTimeTranscendenceMetricsAsync();

                var data = new Dictionary<string, object>
                {
                    ["ConsciousnessLevel"] = metrics.ConsciousnessLevel,
                    ["QuantumFactor"] = metrics.QuantumFactor,
                    ["QuantumCoherence"] = metrics.QuantumCoherence,
                    ["InfiniteScaleActive"] = metrics.InfiniteScaleActive,
                    ["TotalActiveAgents"] = metrics.TotalActiveAgents,
                    ["AccuracyTarget"] = metrics.AccuracyTarget,
                    ["ConsciousnessResonance"] = metrics.ConsciousnessResonance,
                    ["TranscendenceActivatedAt"] = metrics.TranscendenceActivatedAt,
                    ["LastChecked"] = DateTime.UtcNow
                };

                var issues = new List<string>();

                if (string.Equals(metrics.ConsciousnessLevel, "Unavailable", StringComparison.OrdinalIgnoreCase))
                {
                    issues.Add("Governed transcendence lane unavailable");
                }

                if (metrics.QuantumFactor <= 0)
                    issues.Add("Quantum factor unavailable");

                if (metrics.QuantumCoherence <= 0m)
                    issues.Add("Quantum coherence unavailable");

                data["ValidationIssues"] = issues;
                data["GovernedContractAvailable"] = issues.Count == 0;

                if (issues.Count == 0)
                {
                    return HealthCheckResult.Healthy(
                        "Transcendence engine healthy",
                        data);
                }
                else if (issues.Count <= 3)
                {
                    return HealthCheckResult.Degraded(
                        $"Transcendence compatibility host active with {issues.Count} availability issues",
                        data: data);
                }
                else
                {
                    return HealthCheckResult.Unhealthy(
                        $"Transcendence engine has {issues.Count} critical issues",
                        data: data);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transcendence health check failed");
                return HealthCheckResult.Unhealthy(
                    "Transcendence health check failed",
                    ex,
                    new Dictionary<string, object> { ["Error"] = ex.Message });
            }
        }
    }
}
