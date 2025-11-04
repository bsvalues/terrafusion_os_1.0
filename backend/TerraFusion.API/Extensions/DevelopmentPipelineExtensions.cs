using Microsoft.Extensions.DependencyInjection;
using TerraFusion.API.Services;

namespace TerraFusion.API.Extensions;

/// <summary>
/// Development Pipeline Dependency Injection Extensions
/// Elite military-grade pipeline registration for TerraFusion OS
/// </summary>
public static class DevelopmentPipelineExtensions
{
    /// <summary>
    /// Register Development Pipeline services with military-grade configuration
    /// </summary>
    public static IServiceCollection AddDevelopmentPipeline(this IServiceCollection services)
    {
        // Register Development Pipeline Service as singleton for persistent state
        services.AddSingleton<DevelopmentPipelineService>();

        // Register as hosted service for background execution
        services.AddHostedService<DevelopmentPipelineService>(provider =>
            provider.GetRequiredService<DevelopmentPipelineService>());

        // Configure pipeline-specific options
        services.Configure<DevelopmentPipelineOptions>(options =>
        {
            options.WorkspaceCount = 38;
            options.QualityGateThreshold = 95.0; // 95% minimum for government operations
            options.BuildTimeoutMinutes = 30;
            options.IntegrationTestTimeoutMinutes = 15;
            options.PerformanceTestTimeoutMinutes = 10;
            options.GovernmentCompliance = true;
            options.MilitaryGrade = true;
            options.WashingtonStateStandards = true;
        });

        return services;
    }
}

/// <summary>
/// Development Pipeline Configuration Options
/// </summary>
public class DevelopmentPipelineOptions
{
    public int WorkspaceCount { get; set; } = 38;
    public double QualityGateThreshold { get; set; } = 95.0;
    public int BuildTimeoutMinutes { get; set; } = 30;
    public int IntegrationTestTimeoutMinutes { get; set; } = 15;
    public int PerformanceTestTimeoutMinutes { get; set; } = 10;
    public bool GovernmentCompliance { get; set; } = true;
    public bool MilitaryGrade { get; set; } = true;
    public bool WashingtonStateStandards { get; set; } = true;
    public string[] CriticalWorkspaces { get; set; } = new[]
    {
        "TerraFusion.Backend",
        "TerraFusion.API",
        "TerraFusion.AI",
        "TerraFusion.Data",
        "TerraFusion.Gateway"
    };
}
