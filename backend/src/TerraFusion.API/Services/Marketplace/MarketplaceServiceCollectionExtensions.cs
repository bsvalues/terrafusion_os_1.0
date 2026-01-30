// =============================================================================
// MarketplaceServiceCollectionExtensions.cs (PHASE B: MARKETPLACE)
// =============================================================================
// DI registration for Marketplace runtime security services.
// =============================================================================

using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.API.Services.Marketplace;

/// <summary>
/// Extension methods for registering Marketplace runtime services.
/// </summary>
public static class MarketplaceServiceCollectionExtensions
{
    /// <summary>
    /// Adds Marketplace security services:
    /// - IPolicyEvaluator (OPA sandbox hook)
    /// - IPluginAdmissionService (runtime enforcement)
    /// </summary>
    public static IServiceCollection AddMarketplaceSecurity(this IServiceCollection services)
    {
        services.AddSingleton<IPolicyEvaluator, OpaPolicyEvaluator>();
        services.AddSingleton<IPluginAdmissionService, PluginAdmissionService>();
        return services;
    }
}
