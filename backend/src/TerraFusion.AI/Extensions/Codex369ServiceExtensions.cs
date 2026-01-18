/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 FRAMEWORK SERVICE EXTENSIONS
 * Championship-Level Service Registration for Divine Balance
 * Seamless Integration with TerraFusion.API Startup Pipeline
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;
using TerraFusion.AI.Hubs;
using TerraFusion.AI.HealthChecks;
using TerraFusion.AI.Middleware;

namespace TerraFusion.AI.Extensions;

/// <summary>
/// Extension methods for registering Codex 3-6-9 Framework services
/// Follows TerraFusion championship-level service registration patterns
/// </summary>
public static class Codex369ServiceExtensions
{
    /// <summary>
    /// Add complete Codex 3-6-9 Framework to the service collection
    /// Registers all 9 core services, background workers, and health checks
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <returns>Service collection for fluent chaining</returns>
    public static IServiceCollection AddCodex369Framework(this IServiceCollection services)
    {
        Console.WriteLine("🌟 Registering Codex 3-6-9 Divine Balance Framework");

        // ═══════════════════════════════════════════════════════════════
        // CORE FRAMEWORK SERVICES
        // ═══════════════════════════════════════════════════════════════

        // 1. Core Framework Service (Scoped - per-request calculations)
        services.AddScoped<ICodex369FrameworkService, Codex369FrameworkService>();
        Console.WriteLine("   ✅ Codex369FrameworkService (Core calculation engine)");

        // 2. AI Agent Integration Service (Scoped - monitors 1,008 agents)
        services.AddScoped<ICodex369AgentIntegrationService, Codex369AgentIntegrationService>();
        Console.WriteLine("   ✅ Codex369AgentIntegrationService (1,008 AI agents)");

        // 3. Alert Service (Singleton - shared alert state)
        services.AddSingleton<ICodex369AlertService, Codex369AlertService>();
        Console.WriteLine("   ✅ Codex369AlertService (Automated notifications)");

        // 4. Trend Analysis Service (Singleton - 10,000 point history buffer)
        services.AddSingleton<ICodex369TrendAnalysisService, Codex369TrendAnalysisService>();
        Console.WriteLine("   ✅ Codex369TrendAnalysisService (Historical tracking & forecasting)");

        // 5. Metrics Collector (Singleton - aggregates middleware metrics)
        services.AddSingleton<ICodex369MetricsCollector, Codex369MetricsCollector>();
        Console.WriteLine("   ✅ Codex369MetricsCollector (Middleware integration)");

        // ═══════════════════════════════════════════════════════════════
        // BACKGROUND SERVICES (Hosted Services)
        // ═══════════════════════════════════════════════════════════════

        // 6. SignalR Broadcast Service (every 30 seconds)
        services.AddHostedService<Codex369BroadcastService>();
        Console.WriteLine("   ✅ Codex369BroadcastService (Real-time broadcasting, 30s interval)");

        // 7. Alert Monitoring Service (every 60 seconds)
        services.AddHostedService<Codex369AlertMonitoringService>();
        Console.WriteLine("   ✅ Codex369AlertMonitoringService (Alert checks, 60s interval)");

        // 8. Historical Recording Service (every 5 minutes)
        services.AddHostedService<Codex369HistoricalRecordingService>();
        Console.WriteLine("   ✅ Codex369HistoricalRecordingService (Data recording, 5min interval)");

        // ═══════════════════════════════════════════════════════════════
        // HEALTH CHECKS
        // ═══════════════════════════════════════════════════════════════

        // Standard health check (framework status only)
        services.AddHealthChecks()
            .AddCheck<Codex369HealthCheck>("codex-369-framework");
        Console.WriteLine("   ✅ Codex369HealthCheck (Standard framework health)");

        // Comprehensive health check (framework + AI swarm)
        services.AddHealthChecks()
            .AddCheck<Codex369ComprehensiveHealthCheck>("codex-369-comprehensive");
        Console.WriteLine("   ✅ Codex369ComprehensiveHealthCheck (Framework + AI swarm)");

        Console.WriteLine("🌟 Codex 3-6-9 Framework registration complete!");
        Console.WriteLine("   • 5 Core Services registered");
        Console.WriteLine("   • 3 Background Services configured");
        Console.WriteLine("   • 2 Health Checks enabled");
        Console.WriteLine("   • Ready for divine balance monitoring");

        return services;
    }

    /// <summary>
    /// Add Codex 3-6-9 Monitoring Middleware to the application pipeline
    /// Must be called after UseRouting() but before MapControllers()
    /// </summary>
    /// <param name="app">Application builder</param>
    /// <returns>Application builder for fluent chaining</returns>
    public static IApplicationBuilder UseCodex369Monitoring(this IApplicationBuilder app)
    {
        Console.WriteLine("🔍 Configuring Codex 3-6-9 Monitoring Middleware");

        app.UseMiddleware<Codex369MonitoringMiddleware>();

        Console.WriteLine("   ✅ Middleware configured - HTTP metrics feeding into 3-6-9 framework");

        return app;
    }

    /// <summary>
    /// Map Codex 3-6-9 SignalR Hub for real-time updates
    /// Must be called after MapControllers()
    /// </summary>
    /// <param name="app">Endpoint route builder</param>
    /// <returns>Hub endpoint convention builder</returns>
    public static HubEndpointConventionBuilder MapCodex369Hub(this IEndpointRouteBuilder app)
    {
        Console.WriteLine("📡 Mapping Codex 3-6-9 SignalR Hub");

        var hubBuilder = app.MapHub<Codex369Hub>("/hubs/codex369");

        Console.WriteLine("   ✅ Hub mapped at /hubs/codex369");
        Console.WriteLine("   • Real-time framework status updates (30s broadcast)");
        Console.WriteLine("   • Divine balance achievement notifications");
        Console.WriteLine("   • 666 safeguard warnings");
        Console.WriteLine("   • Health summary updates");

        return hubBuilder;
    }

    /// <summary>
    /// Map Codex 3-6-9 Health Check endpoints
    /// Creates /health/codex369 endpoint for framework-specific health checks
    /// </summary>
    /// <param name="app">Endpoint route builder</param>
    public static void MapCodex369HealthChecks(this IEndpointRouteBuilder app)
    {
        Console.WriteLine("🏥 Mapping Codex 3-6-9 Health Check Endpoints");

        app.MapHealthChecks("/health/codex369", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
        {
            Predicate = (check) => check.Name.Contains("codex-369")
        });

        Console.WriteLine("   ✅ Health endpoint: GET /health/codex369");
        Console.WriteLine("   • Returns framework health status");
        Console.WriteLine("   • Includes divine balance proximity");
        Console.WriteLine("   • Kubernetes-ready liveness/readiness probe");
    }
}

/// <summary>
/// Metrics collector interface for middleware integration
/// </summary>
public interface ICodex369MetricsCollector
{
    Task RecordRequestMetricAsync(RequestMetric metric);
    Task<RequestMetrics> GetAggregatedMetricsAsync();
}

/// <summary>
/// Metrics collector implementation
/// </summary>
public class Codex369MetricsCollector : ICodex369MetricsCollector
{
    private readonly List<RequestMetric> _metrics = new();
    private readonly object _lock = new();

    public Task RecordRequestMetricAsync(RequestMetric metric)
    {
        lock (_lock)
        {
            _metrics.Add(metric);

            // Keep only last 1,000 metrics to prevent memory issues
            if (_metrics.Count > 1000)
            {
                _metrics.RemoveRange(0, _metrics.Count - 1000);
            }
        }

        return Task.CompletedTask;
    }

    public Task<RequestMetrics> GetAggregatedMetricsAsync()
    {
        lock (_lock)
        {
            if (!_metrics.Any())
            {
                return Task.FromResult(new RequestMetrics
                {
                    AverageResponseTime = 0,
                    ThroughputPerSecond = 0,
                    SuccessRate = 1.0
                });
            }

            var now = DateTime.UtcNow;
            var recentMetrics = _metrics.Where(m => m.Timestamp > now.AddMinutes(-5)).ToList();

            if (!recentMetrics.Any())
            {
                return Task.FromResult(new RequestMetrics
                {
                    AverageResponseTime = 0,
                    ThroughputPerSecond = 0,
                    SuccessRate = 1.0
                });
            }

            var avgResponseTime = recentMetrics.Average(m => m.DurationMs);
            var successRate = (double)recentMetrics.Count(m => m.Success) / recentMetrics.Count;
            var throughput = recentMetrics.Count / 300.0; // 5 minutes = 300 seconds

            return Task.FromResult(new RequestMetrics
            {
                AverageResponseTime = avgResponseTime,
                ThroughputPerSecond = throughput,
                SuccessRate = successRate
            });
        }
    }
}

/// <summary>
/// Individual request metric
/// </summary>
public class RequestMetric
{
    public string Path { get; set; } = string.Empty;
    public double DurationMs { get; set; }
    public bool Success { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Aggregated metrics
/// </summary>
public class RequestMetrics
{
    public double AverageResponseTime { get; set; }
    public double ThroughputPerSecond { get; set; }
    public double SuccessRate { get; set; }
}
