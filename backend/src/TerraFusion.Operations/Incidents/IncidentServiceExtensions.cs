// =============================================================================
// Phase 39: Incident Triage Engine - Service Extensions
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// Dependency injection registration for incident triage services.
// =============================================================================

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Extension methods for registering incident triage services.
/// </summary>
public static class IncidentServiceExtensions
{
    /// <summary>
    /// Adds incident triage services to the dependency injection container.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">Application configuration.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddIncidentTriageServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register configuration options
        services.Configure<IncidentTriageOptions>(
            configuration.GetSection(IncidentTriageOptions.SectionName));

        services.Configure<IncidentExplanationConfiguration>(
            configuration.GetSection(IncidentExplanationConfiguration.SectionName));

        // Register core triage engine
        // TODO: Phase 39 implementation - replace with concrete IncidentTriageEngine
        // services.AddScoped<IIncidentTriageEngine, IncidentTriageEngine>();

        // Register explanation service based on configuration
        var explanationConfig = configuration
            .GetSection(IncidentExplanationConfiguration.SectionName)
            .Get<IncidentExplanationConfiguration>();

        if (explanationConfig?.EnableGlobally == true)
        {
            // TODO: Phase 39 implementation - register SystemGptIncidentExplanationService
            // services.AddScoped<IIncidentExplanationService, SystemGptIncidentExplanationService>();
        }
        else
        {
            // Default to no-op explanation service
            services.AddSingleton<IIncidentExplanationService, NullIncidentExplanationService>();
        }

        return services;
    }

    /// <summary>
    /// Adds incident triage services with custom implementations.
    /// Used for testing and custom configurations.
    /// </summary>
    /// <typeparam name="TTriageEngine">The triage engine implementation type.</typeparam>
    /// <typeparam name="TExplanationService">The explanation service implementation type.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddIncidentTriageServices<TTriageEngine, TExplanationService>(
        this IServiceCollection services)
        where TTriageEngine : class, IIncidentTriageEngine
        where TExplanationService : class, IIncidentExplanationService
    {
        services.AddScoped<IIncidentTriageEngine, TTriageEngine>();
        services.AddScoped<IIncidentExplanationService, TExplanationService>();
        return services;
    }

    /// <summary>
    /// Adds incident triage health checks.
    /// </summary>
    /// <param name="builder">The health checks builder.</param>
    /// <returns>The health checks builder for chaining.</returns>
    public static IHealthChecksBuilder AddIncidentTriageHealthChecks(
        this IHealthChecksBuilder builder)
    {
        // TODO: Phase 39 implementation - add health checks for:
        // - Triage engine responsiveness
        // - LLM explanation service availability (if enabled)
        // - Recommendation template loading

        return builder;
    }
}
