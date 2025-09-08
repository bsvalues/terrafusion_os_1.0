using Microsoft.ApplicationInsights.AspNetCore.Extensions;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Services.Monitoring.HealthChecks;
using TerraFusion.Core.Services.Monitoring.BackgroundServices;

namespace TerraFusion.Core.Extensions;

/// <summary>
/// Extension methods for configuring Application Insights and monitoring services
/// </summary>
public static class MonitoringServiceExtensions
{
    public static IServiceCollection AddTerraFusionMonitoring(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        // Configure Application Insights
        services.AddApplicationInsightsTelemetry(options =>
        {
            options.ConnectionString = configuration["ApplicationInsights:ConnectionString"];
            options.DeveloperMode = environment.IsDevelopment();
            options.EnableAdaptiveSampling = !environment.IsDevelopment();
            options.EnableQuickPulseMetricStream = true;
            options.EnableHeartbeat = true;
            options.EnableDependencyTrackingTelemetryModule = true;
            options.EnableRequestTrackingTelemetryModule = true;
            options.EnableEventCounterCollectionModule = true;
        });

        // Configure telemetry processors
        services.AddSingleton<ITelemetryInitializer, TerraFusionTelemetryInitializer>();
        services.AddSingleton<ITelemetryProcessor, TerraFusionTelemetryProcessor>();

        // Register custom services
        services.AddScoped<ITelemetryService, ApplicationInsightsTelemetryService>();
        services.AddScoped<IObservabilityService, ObservabilityService>();
        services.AddScoped<IHealthCheckService, TerraFusionHealthCheckService>();
        services.AddScoped<IMetricsCollectionService, MetricsCollectionService>();

        // Configure health checks
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("database")
            .AddCheck<RedisHealthCheck>("redis")
            .AddCheck<ExternalApiHealthCheck>("external-apis")
            .AddCheck<ApplicationInsightsHealthCheck>("application-insights");

        // Configure custom metrics collection
        services.AddHostedService<MetricsCollectionBackgroundService>();
        services.AddHostedService<HealthCheckBackgroundService>();

        return services;
    }

    public static IServiceCollection AddCustomTelemetryProcessors(this IServiceCollection services)
    {
        services.AddSingleton<ITelemetryProcessor>(provider =>
        {
            var next = provider.GetService<ITelemetryProcessor>();
            return new TerraFusionTelemetryProcessor(next);
        });

        return services;
    }
}

/// <summary>
/// Custom telemetry initializer for TerraFusion-specific context
/// </summary>
public class TerraFusionTelemetryInitializer : ITelemetryInitializer
{
    private readonly IHostEnvironment _environment;

    public TerraFusionTelemetryInitializer(IHostEnvironment environment)
    {
        _environment = environment;
    }

    public void Initialize(Microsoft.ApplicationInsights.Channel.ITelemetry telemetry)
    {
        // Add global properties to all telemetry
        telemetry.Context.GlobalProperties["Application"] = "TerraFusion";
        telemetry.Context.GlobalProperties["Environment"] = _environment.EnvironmentName;
        telemetry.Context.GlobalProperties["Version"] = GetApplicationVersion();
        telemetry.Context.GlobalProperties["InstanceId"] = Environment.MachineName;
        
        // Add cloud role information
        telemetry.Context.Cloud.RoleName = "TerraFusion.API";
        telemetry.Context.Cloud.RoleInstance = Environment.MachineName;
        
        // Add component information
        telemetry.Context.Component.Version = GetApplicationVersion();
    }

    private static string GetApplicationVersion()
    {
        return System.Reflection.Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "Unknown";
    }
}

/// <summary>
/// Custom telemetry processor for filtering and enriching telemetry
/// </summary>
public class TerraFusionTelemetryProcessor : ITelemetryProcessor
{
    private readonly ITelemetryProcessor? _next;

    public TerraFusionTelemetryProcessor(ITelemetryProcessor? next)
    {
        _next = next;
    }

    public void Process(Microsoft.ApplicationInsights.Channel.ITelemetry item)
    {
        // Filter out health check requests from telemetry (they're too noisy)
        if (item is Microsoft.ApplicationInsights.DataContracts.RequestTelemetry request)
        {
            if (request.Name?.Contains("/health") == true || 
                request.Url?.AbsolutePath?.Contains("/health") == true)
            {
                return; // Don't send health check requests to Application Insights
            }

            // Enrich request telemetry
            request.Properties["ProcessedBy"] = "TerraFusionTelemetryProcessor";
            request.Properties["ProcessedAt"] = DateTimeOffset.UtcNow.ToString("O");
        }

        // Filter out dependency calls to Application Insights itself
        if (item is Microsoft.ApplicationInsights.DataContracts.DependencyTelemetry dependency)
        {
            if (dependency.Target?.Contains("applicationinsights") == true ||
                dependency.Target?.Contains("dc.services.visualstudio.com") == true)
            {
                return; // Don't track Application Insights calls
            }
        }

        // Process the telemetry item
        _next?.Process(item);
    }
}
