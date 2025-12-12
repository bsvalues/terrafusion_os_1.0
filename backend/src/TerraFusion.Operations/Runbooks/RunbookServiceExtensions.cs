// =============================================================================
// Phase 40A/40B: AI-Driven Incident Runbook Engine - Service Extensions
// =============================================================================
// RUNBOOK SPEC LOCK v1.0.0 + EXPLAINER SPEC LOCK v1.0.0
// Dependency injection registration for runbook services.
// =============================================================================

using Microsoft.Extensions.Configuration;
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
    /// Adds the Azure OpenAI runbook explanation service.
    /// Phase 40B: LLM-as-Explainer layer.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The configuration for binding options.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddAzureOpenAiRunbookExplanation(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Bind options from configuration
        services.Configure<RunbookExplanationOptions>(
            configuration.GetSection(RunbookExplanationOptions.SectionName));

        // Also check environment variables as fallback
        services.PostConfigure<RunbookExplanationOptions>(options =>
        {
            // Override with environment variables if present
            var endpoint = Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT");
            if (!string.IsNullOrWhiteSpace(endpoint))
                options = options with { AzureOpenAiEndpoint = endpoint };

            var deployment = Environment.GetEnvironmentVariable("AZURE_OPENAI_DEPLOYMENT");
            if (!string.IsNullOrWhiteSpace(deployment))
                options = options with { AzureOpenAiDeploymentName = deployment };

            var apiKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY");
            if (!string.IsNullOrWhiteSpace(apiKey))
                options = options with { AzureOpenAiApiKey = apiKey };

            var enabled = Environment.GetEnvironmentVariable("RUNBOOK_EXPLANATION_ENABLED");
            if (!string.IsNullOrWhiteSpace(enabled) && bool.TryParse(enabled, out var enabledValue))
                options = options with { Enabled = enabledValue };
        });

        // Register HTTP client for Azure OpenAI
        services.AddHttpClient<AzureOpenAiRunbookExplanationService>();

        // Replace default service with Azure OpenAI implementation
        services.AddSingleton<IRunbookExplanationService, AzureOpenAiRunbookExplanationService>();

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

    /// <summary>
    /// Adds the runbook execution engine and related services.
    /// Phase 41: EXECUTION SPEC LOCK v1.0.0
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddRunbookExecutor(this IServiceCollection services)
    {
        // Register the in-memory execution store
        services.AddSingleton<Execution.IRunbookExecutionStore, Execution.InMemoryRunbookExecutionStore>();

        // Register the no-op action provider (safe for Phase 41)
        services.AddSingleton<Execution.IRunbookActionProvider, Execution.NoOpRunbookActionProvider>();

        // Register the executor
        services.AddSingleton<Execution.IRunbookExecutor, Execution.RunbookExecutor>();

        return services;
    }

    /// <summary>
    /// Adds the runbook execution engine with a custom action provider.
    /// Phase 41: EXECUTION SPEC LOCK v1.0.0
    /// </summary>
    /// <typeparam name="TActionProvider">The action provider implementation type.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddRunbookExecutor<TActionProvider>(this IServiceCollection services)
        where TActionProvider : class, Execution.IRunbookActionProvider
    {
        // Register the in-memory execution store
        services.AddSingleton<Execution.IRunbookExecutionStore, Execution.InMemoryRunbookExecutionStore>();

        // Register the custom action provider
        services.AddSingleton<Execution.IRunbookActionProvider, TActionProvider>();

        // Register the executor
        services.AddSingleton<Execution.IRunbookExecutor, Execution.RunbookExecutor>();

        return services;
    }
}
