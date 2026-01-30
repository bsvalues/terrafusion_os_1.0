using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services.AI;

/// <summary>
/// Extension methods for configuring AI services in dependency injection
/// </summary>
public static class AIServiceExtensions
{
    /// <summary>
    /// Adds comprehensive AI/ML services to the service collection
    /// </summary>
    public static IServiceCollection AddAIServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Core AI Services
        services.AddSingleton<IAIServiceInfrastructure, AIServiceInfrastructure>();
        services.AddSingleton<IMLModelManager, MLModelManager>();
        services.AddSingleton<IDataProcessingPipeline, DataProcessingPipeline>();

        // Azure OpenAI Service
        services.AddHttpClient<IAzureOpenAIService, AzureOpenAIService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(120);
        });

        // AI Configuration validation
        ValidateAIConfiguration(configuration);

        return services;
    }

    /// <summary>
    /// Adds AI services with custom HttpClient configuration
    /// </summary>
    public static IServiceCollection AddAIServices(this IServiceCollection services, IConfiguration configuration, Action<HttpClient> configureHttpClient)
    {
        services.AddAIServices(configuration);

        // Reconfigure HttpClient for Azure OpenAI
        services.AddHttpClient<IAzureOpenAIService, AzureOpenAIService>(configureHttpClient);

        return services;
    }

    private static void ValidateAIConfiguration(IConfiguration configuration)
    {
        var requiredSettings = new[]
        {
            "AzureOpenAI:ApiKey",
            "AzureOpenAI:Endpoint",
            "ML:ModelsPath"
        };

        foreach (var setting in requiredSettings)
        {
            if (string.IsNullOrEmpty(configuration[setting]))
            {
                throw new InvalidOperationException($"Required AI configuration setting '{setting}' is missing or empty.");
            }
        }
    }
}
