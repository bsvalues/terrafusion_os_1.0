// ─────────────────────────────────────────────────────────────────────────────
// TerraFusion OS — Phase 34: Atlas Forecast DI Extensions
// ─────────────────────────────────────────────────────────────────────────────
// Provides service collection extensions for registering the Atlas Forecast
// Orchestrator, Engine, and Store services with the DI container.
// ─────────────────────────────────────────────────────────────────────────────

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Extensions;

/// <summary>
/// Phase 34: Service collection extensions for Atlas Forecast services.
/// Provides methods to register the forecast orchestrator, engine, and store.
/// </summary>
public static class AtlasForecastServiceExtensions
{
    /// <summary>
    /// Adds all Atlas Forecast services to the service collection.
    /// This includes the ForecastEngine, ForecastStore, and background Orchestrator.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">Optional configuration for binding options.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddAtlasForecastServices(
        this IServiceCollection services,
        IConfiguration? configuration = null)
    {
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
        // Register the Forecast Engine (singleton - stateless computation)
        services.AddSingleton<ISystemGptAtlasForecastEngine, SystemGptAtlasForecastEngine>();

        // Register the Forecast Store (singleton - shared state)
        services.AddSingleton<ISystemGptAtlasForecastStore, SystemGptAtlasForecastStore>();

        return services;
    }
}
