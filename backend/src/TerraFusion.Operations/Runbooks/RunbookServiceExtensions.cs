// =============================================================================
// Phase 40A: AI-Driven Incident Runbook Engine - Service Extensions
// =============================================================================
// RUNBOOK SPEC LOCK v1.0.0
// Dependency injection registration for runbook services.
// =============================================================================

using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Operations.Runbooks;

/// <summary>
/// Extension methods for registering runbook services.
/// </summary>
public static class RunbookServiceExtensions
{
    /// <summary>
    /// Adds the runbook engine and related services to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configure">Optional configuration action.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddRunbookEngine(
        this IServiceCollection services,
        Action<RunbookEngineOptions>? configure = null)
    {
        // Configure options
        services.Configure<RunbookEngineOptions>(options =>
        {
            configure?.Invoke(options);
        });

        // Register the null explanation service by default
        // Can be replaced with a real LLM service when needed
        services.AddSingleton<IRunbookExplanationService, NullRunbookExplanationService>();

        // Register the core engine
        services.AddSingleton<IRunbookEngine, RunbookEngine>();

        return services;
    }

    /// <summary>
    /// Adds a custom runbook explanation service implementation.
    /// </summary>
    /// <typeparam name="TService">The explanation service implementation type.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddRunbookExplanationService<TService>(
        this IServiceCollection services)
        where TService : class, IRunbookExplanationService
    {
        // Replace the default null service
        services.AddSingleton<IRunbookExplanationService, TService>();
        return services;
    }
}
