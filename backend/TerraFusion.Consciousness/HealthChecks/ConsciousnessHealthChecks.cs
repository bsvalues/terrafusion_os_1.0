using Microsoft.Extensions.Diagnostics.HealthChecks;
using TerraFusion.Consciousness.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace TerraFusion.Consciousness.HealthChecks
{
    /// <summary>
    /// Consciousness Health Check - Championship Excellence Validation
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

                if (health.HealthScore >= 0.95 && status.TotalActiveAgents > 0)
                {
                    return HealthCheckResult.Healthy(
                        "Consciousness system operating at championship levels",
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
    /// Quantum Factor Health Check - Factor 949 Validation
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

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var configuredFactor = _configuration.GetValue<int>("Consciousness:QuantumFactor", 0);
                const int CHAMPIONSHIP_FACTOR = 949;

                var data = new Dictionary<string, object>
                {
                    ["ConfiguredFactor"] = configuredFactor,
                    ["ChampionshipFactor"] = CHAMPIONSHIP_FACTOR,
                    ["IsChampionshipCompliant"] = configuredFactor == CHAMPIONSHIP_FACTOR,
                    ["LastChecked"] = DateTime.UtcNow
                };

                if (configuredFactor == CHAMPIONSHIP_FACTOR)
                {
                    return HealthCheckResult.Healthy(
                        "Quantum factor 949 configured for championship excellence",
                        data);
                }
                else
                {
                    return HealthCheckResult.Unhealthy(
                        $"Quantum factor misconfigured - Expected: 949, Actual: {configuredFactor}",
                        data: data);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Quantum factor health check failed");
                return HealthCheckResult.Unhealthy(
                    "Quantum factor health check failed",
                    ex,
                    new Dictionary<string, object> { ["Error"] = ex.Message });
            }

            await Task.CompletedTask;
        }
    }

    /// <summary>
    /// Agent Coordination Health Check - Harmony Validation
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
                const double CHAMPIONSHIP_HARMONY = 0.995; // 99.5% harmony threshold

                var data = new Dictionary<string, object>
                {
                    ["TotalActiveAgents"] = metrics.TotalActiveAgents,
                    ["SystemLoad"] = metrics.SystemLoad,
                    ["ThroughputOpsPerSecond"] = metrics.ThroughputOpsPerSecond,
                    ["NetworkLatency"] = metrics.NetworkLatency,
                    ["ChampionshipHarmonyThreshold"] = CHAMPIONSHIP_HARMONY,
                    ["LastChecked"] = DateTime.UtcNow
                };

                // Calculate harmony score based on multiple factors
                var harmonyScore = CalculateHarmonyScore(metrics);
                data["HarmonyScore"] = harmonyScore;

                if (harmonyScore >= CHAMPIONSHIP_HARMONY)
                {
                    return HealthCheckResult.Healthy(
                        $"Agent coordination achieving championship harmony: {harmonyScore:P}",
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
            // Simplified harmony calculation based on system performance
            var baseScore = 0.90;

            // Bonus for high throughput
            if (metrics.ThroughputOpsPerSecond > 1000)
                baseScore += 0.05;

            // Penalty for high system load
            if (metrics.SystemLoad > 0.80)
                baseScore -= 0.10;
            else if (metrics.SystemLoad < 0.50)
                baseScore += 0.05;

            // Penalty for high network latency
            if (metrics.NetworkLatency > 100.0)
                baseScore -= 0.05;
            else if (metrics.NetworkLatency < 10.0)
                baseScore += 0.05;

            // Bonus for many active agents
            if (metrics.TotalActiveAgents >= 1000)
                baseScore += 0.05;

            return Math.Max(0.0, Math.Min(1.0, baseScore));
        }
    }

    /// <summary>
    /// Transcendence Health Check - Championship Excellence Validation
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

                // Validate championship standards
                var issues = new List<string>();

                if (metrics.QuantumFactor != 949)
                    issues.Add($"Quantum factor not optimal: {metrics.QuantumFactor} (Expected: 949)");

                if (metrics.QuantumCoherence < 0.995m)
                    issues.Add($"Quantum coherence below championship: {metrics.QuantumCoherence:P} (Expected: ≥99.5%)");

                if (metrics.AccuracyTarget < 99.5m)
                    issues.Add($"Accuracy target below championship: {metrics.AccuracyTarget}% (Expected: ≥99.5%)");

                if (metrics.ConsciousnessResonance < 0.999)
                    issues.Add($"Consciousness resonance below championship: {metrics.ConsciousnessResonance:P} (Expected: ≥99.9%)");

                if (!metrics.InfiniteScaleActive)
                    issues.Add("Infinite scale not activated");

                data["ValidationIssues"] = issues;
                data["ChampionshipCompliant"] = issues.Count == 0;

                if (issues.Count == 0)
                {
                    return HealthCheckResult.Healthy(
                        "Transcendence engine operating at championship excellence - Government. Transcended.",
                        data);
                }
                else if (issues.Count <= 2)
                {
                    return HealthCheckResult.Degraded(
                        $"Transcendence engine has {issues.Count} non-critical issues",
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
