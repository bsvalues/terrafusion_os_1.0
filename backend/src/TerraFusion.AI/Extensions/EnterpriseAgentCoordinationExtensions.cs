using Microsoft.Extensions.DependencyInjection;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Extensions;

/// <summary>
/// 🚀 Enterprise AI Agent Coordination Service Registration
/// Provides extension methods for registering AI agent coordination services
/// </summary>
public static class EnterpriseAgentCoordinationExtensions
{
    /// <summary>
    /// Register Enterprise AI Agent Coordination services
    /// </summary>
    public static IServiceCollection AddEnterpriseAgentCoordination(this IServiceCollection services)
    {
        // Register the Enterprise AI Agent Coordinator as both hosted service and interface
        services.AddSingleton<EnterpriseAIAgentCoordinator>();
        services.AddSingleton<IEnterpriseAIAgentCoordinator>(provider =>
            provider.GetRequiredService<EnterpriseAIAgentCoordinator>());
        services.AddHostedService<EnterpriseAIAgentCoordinator>(provider =>
            provider.GetRequiredService<EnterpriseAIAgentCoordinator>());

        // Register Development Pipeline Service (from API project)
        // Note: Other AI coordination services can be added here as needed

        return services;
    }
}
