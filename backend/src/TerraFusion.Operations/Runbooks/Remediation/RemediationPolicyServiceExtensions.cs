// =============================================================================
// Phase 42: Auto-Remediation Policy Engine - Service Extensions
// =============================================================================
// DI registration helpers for the remediation policy engine.
// =============================================================================

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace TerraFusion.Operations.Runbooks.Remediation;

/// <summary>
/// Extension methods for registering the remediation policy engine in DI.
/// </summary>
public static class RemediationPolicyServiceExtensions
{
    /// <summary>
    /// Adds the remediation policy engine to the service collection.
    /// Phase 42 is ADVISORY ONLY - evaluation without behavior change.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configureOptions">Optional configuration action.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddRemediationPolicyEngine(
        this IServiceCollection services,
        Action<RemediationPolicyOptions>? configureOptions = null)
    {
        // Configure options
        if (configureOptions is not null)
        {
            services.Configure(configureOptions);
        }
        else
        {
            services.Configure<RemediationPolicyOptions>(_ => { });
        }

        // Register the engine
        services.AddSingleton<IRemediationPolicyEngine, RemediationPolicyEngine>();

        return services;
    }

    /// <summary>
    /// Adds the remediation policy engine with a pre-built configuration.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="options">The options to use.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddRemediationPolicyEngine(
        this IServiceCollection services,
        RemediationPolicyOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        services.Configure<RemediationPolicyOptions>(o =>
        {
            // Copy values using reflection-free approach
            // Options pattern will pick up these values
        });

        // Use Options.Create for direct injection
        services.AddSingleton(Options.Create(options));
        services.AddSingleton<IRemediationPolicyEngine, RemediationPolicyEngine>();

        return services;
    }
}
