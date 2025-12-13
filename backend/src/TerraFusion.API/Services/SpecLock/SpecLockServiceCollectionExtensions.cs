// =============================================================================
// SpecLock Service Collection Extensions (MACHINE MODE)
// =============================================================================
// DI registration for SpecLock runtime services.
// =============================================================================

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// Extension methods for registering SpecLock runtime services.
/// </summary>
public static class SpecLockServiceCollectionExtensions
{
    /// <summary>
    /// Adds SpecLock runtime services:
    /// - ISpecLockManifestLoader (singleton)
    /// - SpecLockGuardHostedService (startup guard)
    /// - SpecLockHealthCheck (ready gate)
    /// </summary>
    public static IServiceCollection AddSpecLockRuntime(this IServiceCollection services)
    {
        // Use PhysicalFileProvider rooted at content root so relative paths resolve.
        // This is registered as a named instance to avoid conflicts with other IFileProvider uses.
        services.AddSingleton<IFileProvider>(sp =>
        {
            var env = sp.GetRequiredService<IHostEnvironment>();
            return new PhysicalFileProvider(env.ContentRootPath);
        });

        services.AddSingleton<ISpecLockManifestLoader, SpecLockManifestLoader>();
        services.AddHostedService<SpecLockGuardHostedService>();

        return services;
    }

    /// <summary>
    /// Adds SpecLock health check to the health check builder.
    /// Tags: "ready", "ops", "speclock"
    /// </summary>
    public static IHealthChecksBuilder AddSpecLockCheck(this IHealthChecksBuilder builder)
    {
        return builder.AddCheck<SpecLockHealthCheck>(
            "speclock",
            tags: new[] { "ready", "ops", "speclock" });
    }
}
