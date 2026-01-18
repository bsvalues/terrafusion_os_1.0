/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 HEALTH CHECK
 * Production Health Monitoring for Divine Balance System
 * Integrates with ASP.NET Core Health Checks
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;
using MsHealthCheckResult = Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult;

namespace TerraFusion.AI.HealthChecks;

/// <summary>
/// Health check for Codex 3-6-9 Framework
/// Monitors divine balance status and system health
/// </summary>
public class Codex369HealthCheck : IHealthCheck
{
    private readonly ICodex369FrameworkService _codexService;
    private readonly ILogger<Codex369HealthCheck> _logger;

    public Codex369HealthCheck(
        ICodex369FrameworkService codexService,
        ILogger<Codex369HealthCheck> logger)
    {
        _codexService = codexService;
        _logger = logger;
    }

    public async Task<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("🏥 Executing Codex 3-6-9 health check...");

            // Get current framework status
            var status = await _codexService.GetRealtimeFrameworkStatusAsync();

            // Build health data
            var data = new Dictionary<string, object>
            {
                { "ultimatePowerScore", status.CurrentPowerScore },
                { "targetScore", 12.0 },
                { "balanceProximity", status.UltimatePower.BalanceProximity },
                { "divineBalance", status.UltimatePower.InDivineBalance },
                { "healthStatus", status.UltimatePower.HealthStatus.ToString() },
                { "totalFoundationMetrics", status.TotalFoundationMetrics },
                { "totalAmplifications", status.TotalAmplifications },
                { "metricsWithinBaseline", status.FoundationMetrics.Count(m => m.WithinBaseline) },
                { "safeAmplifications", status.AmplificationMetrics.Count(a => a.SafeFromImbalance) },
                { "complianceAligned", status.ComplianceAligned },
                { "balanceDeficit", status.BalanceDeficit },
                { "lastUpdated", status.StatusTimestamp }
            };

            // Add top recommendations
            if (status.SystemRecommendations.Any())
            {
                data["topRecommendation"] = status.SystemRecommendations.First();
                data["totalRecommendations"] = status.SystemRecommendations.Count;
            }

            // Check for 666 safeguard violations
            var unsafeAmplifications = status.AmplificationMetrics
                .Where(a => !a.SafeFromImbalance)
                .ToList();

            if (unsafeAmplifications.Any())
            {
                data["safeguardWarning"] = $"{unsafeAmplifications.Count} amplifications approaching 666";
                data["unsafeAmplifications"] = unsafeAmplifications.Select(a => new
                {
                    a.Name,
                    a.RawCombinedValue,
                    a.SafetyMargin
                }).ToArray();
            }

            // Determine health status based on ultimate power score
            if (status.UltimatePower.InDivineBalance)
            {
                _logger.LogInformation("🌟 Health Check: DIVINE BALANCE - Score: {Score:F2}/12",
                    status.CurrentPowerScore);

                return MsHealthCheckResult.Healthy(
                    $"🌟 Codex 3-6-9 in DIVINE BALANCE: {status.CurrentPowerScore:F2}/12 " +
                    $"(Proximity: {status.UltimatePower.BalanceProximity:P1})",
                    data
                );
            }
            else if (status.CurrentPowerScore >= 10.0)
            {
                _logger.LogInformation("✅ Health Check: HEALTHY - Score: {Score:F2}/12",
                    status.CurrentPowerScore);

                return MsHealthCheckResult.Healthy(
                    $"✅ Codex 3-6-9 Framework healthy: {status.CurrentPowerScore:F2}/12 " +
                    $"({status.BalanceDeficit:F2} points from divine balance)",
                    data
                );
            }
            else if (status.CurrentPowerScore >= 7.0)
            {
                _logger.LogWarning("⚠️ Health Check: DEGRADED - Score: {Score:F2}/12",
                    status.CurrentPowerScore);

                return MsHealthCheckResult.Degraded(
                    $"⚠️ Codex 3-6-9 Framework needs attention: {status.CurrentPowerScore:F2}/12 " +
                    $"({status.BalanceDeficit:F2} point deficit)",
                    data: data
                );
            }
            else
            {
                _logger.LogError("🚨 Health Check: UNHEALTHY - Score: {Score:F2}/12",
                    status.CurrentPowerScore);

                return MsHealthCheckResult.Unhealthy(
                    $"🚨 Codex 3-6-9 Framework CRITICAL: {status.CurrentPowerScore:F2}/12 " +
                    $"({status.BalanceDeficit:F2} point deficit - IMMEDIATE ACTION REQUIRED)",
                    data: data
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Codex 3-6-9 health check failed");

            return MsHealthCheckResult.Unhealthy(
                "Codex 3-6-9 Framework health check failed",
                ex,
                new Dictionary<string, object>
                {
                    { "error", ex.Message },
                    { "errorType", ex.GetType().Name }
                }
            );
        }
    }
}

/// <summary>
/// Comprehensive health check that includes AI agent swarm status
/// </summary>
public class Codex369ComprehensiveHealthCheck : IHealthCheck
{
    private readonly ICodex369FrameworkService _codexService;
    private readonly ICodex369AgentIntegrationService _agentIntegration;
    private readonly ILogger<Codex369ComprehensiveHealthCheck> _logger;

    public Codex369ComprehensiveHealthCheck(
        ICodex369FrameworkService codexService,
        ICodex369AgentIntegrationService agentIntegration,
        ILogger<Codex369ComprehensiveHealthCheck> logger)
    {
        _codexService = codexService;
        _agentIntegration = agentIntegration;
        _logger = logger;
    }

    public async Task<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("🏥 Executing COMPREHENSIVE Codex 3-6-9 health check (Framework + Agents)...");

            // Get framework status
            var frameworkStatus = await _codexService.GetRealtimeFrameworkStatusAsync();

            // Get agent swarm status
            var agentSwarmBalance = await _agentIntegration.MonitorAgentSwarmBalanceAsync();

            // Build comprehensive health data
            var data = new Dictionary<string, object>
            {
                // Framework metrics
                { "framework.ultimatePowerScore", frameworkStatus.CurrentPowerScore },
                { "framework.divineBalance", frameworkStatus.UltimatePower.InDivineBalance },
                { "framework.healthStatus", frameworkStatus.UltimatePower.HealthStatus.ToString() },
                { "framework.balanceProximity", frameworkStatus.UltimatePower.BalanceProximity },
                { "framework.complianceAligned", frameworkStatus.ComplianceAligned },

                // Agent swarm metrics
                { "agents.total", agentSwarmBalance.TotalAgents },
                { "agents.inDivineBalance", agentSwarmBalance.AgentsInDivineBalance },
                { "agents.needingAttention", agentSwarmBalance.AgentsNeedingAttention },
                { "agents.averageHealthScore", agentSwarmBalance.AverageHealthScore },
                { "agents.swarmInDivineBalance", agentSwarmBalance.SwarmInDivineBalance },

                // Combined metrics
                { "overall.timestamp", DateTime.UtcNow }
            };

            // Calculate overall health percentage
            var frameworkHealthPercent = frameworkStatus.CurrentPowerScore / 12.0;
            var agentHealthPercent = agentSwarmBalance.AverageHealthScore / 12.0;
            var overallHealthPercent = (frameworkHealthPercent + agentHealthPercent) / 2.0;

            data["overall.healthPercentage"] = overallHealthPercent;

            // Determine overall health
            var frameworkHealthy = frameworkStatus.CurrentPowerScore >= 10.0;
            var agentsHealthy = agentSwarmBalance.AverageHealthScore >= 10.0;
            var frameworkDivine = frameworkStatus.UltimatePower.InDivineBalance;
            var agentsDivine = agentSwarmBalance.SwarmInDivineBalance;

            if (frameworkDivine && agentsDivine)
            {
                _logger.LogInformation("🌟 COMPREHENSIVE: Framework AND Agents in DIVINE BALANCE!");

                return MsHealthCheckResult.Healthy(
                    $"🌟 DIVINE BALANCE ACHIEVED: Framework {frameworkStatus.CurrentPowerScore:F2}/12 + " +
                    $"Agents {agentSwarmBalance.AverageHealthScore:F2}/12 " +
                    $"(Overall: {overallHealthPercent:P1})",
                    data
                );
            }
            else if (frameworkHealthy && agentsHealthy)
            {
                _logger.LogInformation("✅ COMPREHENSIVE: Framework and Agents both healthy");

                return MsHealthCheckResult.Healthy(
                    $"✅ System Healthy: Framework {frameworkStatus.CurrentPowerScore:F2}/12 + " +
                    $"Agents {agentSwarmBalance.AverageHealthScore:F2}/12 " +
                    $"({agentSwarmBalance.AgentsNeedingAttention} agents need attention)",
                    data
                );
            }
            else if (!frameworkHealthy || !agentsHealthy)
            {
                _logger.LogWarning("⚠️ COMPREHENSIVE: System degraded - " +
                    "Framework: {Framework}, Agents: {Agents}",
                    frameworkHealthy ? "Healthy" : "Degraded",
                    agentsHealthy ? "Healthy" : "Degraded");

                var issues = new List<string>();
                if (!frameworkHealthy)
                    issues.Add($"Framework: {frameworkStatus.CurrentPowerScore:F2}/12");
                if (!agentsHealthy)
                    issues.Add($"Agents: {agentSwarmBalance.AgentsNeedingAttention} need attention");

                return MsHealthCheckResult.Degraded(
                    $"⚠️ System Degraded: {string.Join(", ", issues)}",
                    data: data
                );
            }
            else
            {
                _logger.LogError("🚨 COMPREHENSIVE: System CRITICAL");

                return MsHealthCheckResult.Unhealthy(
                    $"🚨 System CRITICAL: Framework {frameworkStatus.CurrentPowerScore:F2}/12, " +
                    $"Agents {agentSwarmBalance.AgentsNeedingAttention}/{agentSwarmBalance.TotalAgents} need attention",
                    data: data
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Comprehensive health check failed");

            return MsHealthCheckResult.Unhealthy(
                "Comprehensive Codex 3-6-9 health check failed",
                ex
            );
        }
    }
}

