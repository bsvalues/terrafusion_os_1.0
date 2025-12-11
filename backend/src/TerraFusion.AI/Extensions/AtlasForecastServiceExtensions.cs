// ─────────────────────────────────────────────────────────────────────────────
// TerraFusion OS — Phase 34/35: Atlas Forecast DI Extensions
// ─────────────────────────────────────────────────────────────────────────────
// Provides service collection extensions for registering the Atlas Forecast
// Orchestrator, Engine, Store, and Metrics services with the DI container.
// Phase 35: Added metrics collector registration
// ─────────────────────────────────────────────────────────────────────────────

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Metrics;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Extensions;

/// <summary>
/// Phase 34/35: Service collection extensions for Atlas Forecast services.
/// Provides methods to register the forecast orchestrator, engine, store, and metrics.
/// </summary>
public static class AtlasForecastServiceExtensions
{
    /// <summary>
    /// Adds all Atlas Forecast services to the service collection.
    /// This includes the ForecastEngine, ForecastStore, MetricsCollector, and background Orchestrator.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">Optional configuration for binding options.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddAtlasForecastServices(
        this IServiceCollection services,
        IConfiguration? configuration = null)
    {
        // Phase 35: Register the Metrics Collector (singleton - shared across all services)
        services.AddAtlasMetrics();

        // Register the Forecast Engine (singleton - stateless computation)
        services.AddSingleton<ISystemGptAtlasForecastEngine, SystemGptAtlasForecastEngine>();

        // Register the Forecast Store (singleton - shared state)
        services.AddSingleton<ISystemGptAtlasForecastStore, SystemGptAtlasForecastStore>();

        // Configure options from configuration if provided
        if (configuration != null)
        {
            services.Configure<AtlasForecastOrchestratorOptions>(
                configuration.GetSection("TerraFusion:Atlas:Forecast"));
        }
        else
        {
            // Use default options
            services.Configure<AtlasForecastOrchestratorOptions>(_ => { });
        }

        // Register the orchestrator as a hosted background service
        services.AddHostedService<SystemGptAtlasForecastOrchestrator>();

        return services;
    }

    /// <summary>
    /// Adds Atlas Forecast services with custom options.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configureOptions">Action to configure orchestrator options.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddAtlasForecastServices(
        this IServiceCollection services,
        Action<AtlasForecastOrchestratorOptions> configureOptions)
    {
        // Phase 35: Register the Metrics Collector (singleton - shared across all services)
        services.AddAtlasMetrics();

        // Register the Forecast Engine (singleton - stateless computation)
        services.AddSingleton<ISystemGptAtlasForecastEngine, SystemGptAtlasForecastEngine>();

        // Register the Forecast Store (singleton - shared state)
        services.AddSingleton<ISystemGptAtlasForecastStore, SystemGptAtlasForecastStore>();

        // Configure options with provided action
        services.Configure(configureOptions);

        // Register the orchestrator as a hosted background service
        services.AddHostedService<SystemGptAtlasForecastOrchestrator>();

        return services;
    }

    /// <summary>
    /// Adds only the Atlas Forecast computation services (Engine + Store) without the orchestrator.
    /// Useful when you want to compute forecasts on-demand rather than periodically.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddAtlasForecastCore(this IServiceCollection services)
    {
        // Phase 35: Register the Metrics Collector (singleton - shared across all services)
        services.AddAtlasMetrics();

        // Register the Forecast Engine (singleton - stateless computation)
        services.AddSingleton<ISystemGptAtlasForecastEngine, SystemGptAtlasForecastEngine>();

        // Register the Forecast Store (singleton - shared state)
        services.AddSingleton<ISystemGptAtlasForecastStore, SystemGptAtlasForecastStore>();

        return services;
    }

    /// <summary>
    /// Phase 35: Adds the Atlas Metrics Collector to the service collection.
    /// This is a singleton service that tracks all Atlas observability metrics.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddAtlasMetrics(this IServiceCollection services)
    {
        // Only register if not already present
        services.TryAddSingleton<IAtlasMetricsCollector, AtlasMetricsCollector>();
        return services;
    }

    /// <summary>
    /// Phase 35: Adds a null metrics collector for testing without Prometheus.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddAtlasNullMetrics(this IServiceCollection services)
    {
        services.AddSingleton<IAtlasMetricsCollector, NullAtlasMetricsCollector>();
        return services;
    }
}
