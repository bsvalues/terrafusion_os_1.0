using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Extensions;

/// <summary>
/// Service collection extensions for AI model registration and configuration
/// </summary>
public static class AIServiceExtensions
{
    /// <summary>
    /// Register all TerraFusion AI models and services with dependency injection
    /// </summary>
    public static IServiceCollection AddTerraFusionAI(this IServiceCollection services, IConfiguration configuration)
    {
        // Register AI Models - Temporarily disabled until interface implementation fixed
        // services.AddSingleton<PropertyAssessmentAIModel>();
        // Temporarily disabled until dependencies resolved
        // services.AddSingleton<CitizenSentimentAIModel>();
        // services.AddSingleton<PredictiveAnalyticsAIModel>();

        // Register AI Services
        services.AddSingleton<AIModelOrchestrationService>();
        services.AddHostedService<AIModelOrchestrationService>(provider =>
            provider.GetRequiredService<AIModelOrchestrationService>());

        // Register SignalR for real-time AI communication
        services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = true;
            options.MaximumReceiveMessageSize = 1024 * 1024; // 1MB for large AI model responses
        });

        // Configure AI settings
        services.Configure<AIConfiguration>(configuration.GetSection("AI"));

        return services;
    }
}

/// <summary>
/// AI configuration settings
/// </summary>
public class AIConfiguration
{
    public string ModelsPath { get; set; } = "models";
    public string TrainingDataPath { get; set; } = "data";
    public bool QuantumOptimizationEnabled { get; set; } = true;
    public float GovernmentAccuracyThreshold { get; set; } = 0.95f;
    public int ModelCacheSize { get; set; } = 1000;
    public TimeSpan HealthCheckInterval { get; set; } = TimeSpan.FromMinutes(5);
    public TimeSpan DriftMonitoringInterval { get; set; } = TimeSpan.FromHours(6);
    public bool AutoRetrainingEnabled { get; set; } = true;
    public string ComplianceLevel { get; set; } = "FISMA-HIGH";
}
