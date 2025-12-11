// ============================================================================
// PHASE 36: Tracing Service Extensions
// ============================================================================
// DI registration for TerraFusion distributed tracing
// Integrates with existing OpenTelemetry configuration
// ============================================================================

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace TerraFusion.AI.Tracing;

/// <summary>
/// Extension methods for registering TerraFusion tracing services.
/// </summary>
public static class TracingServiceExtensions
{
    /// <summary>
    /// Adds TerraFusion distributed tracing services to the DI container.
    /// Registers ITerraFusionTracer as a singleton with proper ActivitySource management.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddTerraFusionTracing(this IServiceCollection services)
    {
        // Register the tracer as singleton (ActivitySources should be long-lived)
        services.TryAddSingleton<ITerraFusionTracer, TerraFusionTracer>();

        return services;
    }

    /// <summary>
    /// Adds a null/no-op tracer for testing scenarios.
    /// Use this in unit tests where tracing is not needed.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddNullTracing(this IServiceCollection services)
    {
        // Replace any existing tracer with the null implementation
        services.RemoveAll<ITerraFusionTracer>();
        services.AddSingleton<ITerraFusionTracer>(NullTerraFusionTracer.Instance);

        return services;
    }

    /// <summary>
    /// Adds TerraFusion tracing with custom configuration.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configure">Configuration action for tracing options.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddTerraFusionTracing(
        this IServiceCollection services,
        Action<TracingOptions> configure)
    {
        var options = new TracingOptions();
        configure(options);

        if (!options.Enabled)
        {
            return services.AddNullTracing();
        }

        return services.AddTerraFusionTracing();
    }
}

/// <summary>
/// Options for configuring TerraFusion tracing.
/// </summary>
public class TracingOptions
{
    /// <summary>
    /// Gets or sets whether tracing is enabled. Default is true.
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Gets or sets the service name for resource attributes.
    /// </summary>
    public string ServiceName { get; set; } = "TerraFusion.AI";

    /// <summary>
    /// Gets or sets the service version for resource attributes.
    /// </summary>
    public string ServiceVersion { get; set; } = TracingConstants.Version;
}
