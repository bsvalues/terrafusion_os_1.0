// TerraFusion.Operations/Configuration/DependencyInjection.cs
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using TerraFusion.Operations.Interfaces;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.Operations.Configuration;

/// <summary>
/// Elite Operational Excellence Dependency Injection Configuration
/// Registers championship-level operational services
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Add Elite Operational Excellence services to dependency injection container
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Application configuration</param>
    /// <returns>Service collection for method chaining</returns>
    public static IServiceCollection AddEliteOperationalExcellence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register Core Operational Services - Mock implementations for now
        services.AddScoped<IEliteOperationalService, Services.EliteOperationalService>();

        // Future implementation: Remaining service implementations
        // services.AddScoped<IHealthMonitoringService, HealthMonitoringService>();
        // services.AddScoped<IIncidentResponseService, IncidentResponseService>();
        // services.AddScoped<ISelfHealingService, SelfHealingService>();
        // services.AddScoped<IPerformanceOptimizationService, PerformanceOptimizationService>();
        // services.AddScoped<IAutonomousRecoveryService, AutonomousRecoveryService>();

        // Future implementation: Elite Monitoring Services
        // services.AddScoped<ISystemMetricsCollector, SystemMetricsCollector>();
        // services.AddScoped<IPerformanceAnalyzer, PerformanceAnalyzer>();
        // services.AddScoped<ISecurityMonitor, SecurityMonitor>();
        // services.AddScoped<IComplianceValidator, ComplianceValidator>();

        // Future implementation: AI Agent Coordination Services
        // services.AddScoped<IAIAgentCoordinator, AIAgentCoordinator>();
        // services.AddScoped<IAgentHealthMonitor, AgentHealthMonitor>();
        // services.AddScoped<ISwarmOptimizer, SwarmOptimizer>();

        // Future implementation: County Services
        // services.AddScoped<ICountyServiceMonitor, CountyServiceMonitor>();
        // services.AddScoped<ICitizenServiceAnalyzer, CitizenServiceAnalyzer>();
        // services.AddScoped<IGovernmentComplianceService, GovernmentComplianceService>();

        // Future implementation: Emergency Response Services
        // services.AddScoped<IEmergencyResponseCoordinator, EmergencyResponseCoordinator>();
        // services.AddScoped<IDisasterRecoveryService, DisasterRecoveryService>();
        // services.AddScoped<ICrisisManagementService, CrisisManagementService>();

        // Future implementation: Advanced Analytics Services
        // services.AddScoped<IPredictiveAnalyticsService, PredictiveAnalyticsService>();
        // services.AddScoped<IOperationalIntelligenceService, OperationalIntelligenceService>();
        // services.AddScoped<IThreatDetectionService, ThreatDetectionService>();

        // Future implementation: Background Services for Continuous Monitoring
        // services.AddHostedService<EliteOperationalBackgroundService>();
        // services.AddHostedService<HealthMonitoringBackgroundService>();
        // services.AddHostedService<PerformanceOptimizationBackgroundService>();
        // services.AddHostedService<SecurityMonitoringBackgroundService>();

        // Configure Elite Operational Options
        services.Configure<EliteOperationalOptions>(
            configuration.GetSection("EliteOperational"));

        services.Configure<HealthMonitoringOptions>(
            configuration.GetSection("HealthMonitoring"));

        services.Configure<PerformanceOptimizationOptions>(
            configuration.GetSection("PerformanceOptimization"));

        services.Configure<SecurityMonitoringOptions>(
            configuration.GetSection("SecurityMonitoring"));

        services.Configure<ComplianceOptions>(
            configuration.GetSection("Compliance"));

        services.Configure<AIAgentCoordinationOptions>(
            configuration.GetSection("AIAgentCoordination"));

        services.Configure<EmergencyResponseOptions>(
            configuration.GetSection("EmergencyResponse"));

        return services;
    }

    /// <summary>
    /// Add Elite Operational Authentication and Authorization
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Application configuration</param>
    /// <returns>Service collection for method chaining</returns>
    public static IServiceCollection AddEliteOperationalSecurity(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Add Authorization Policies for Elite Operations
        services.AddAuthorization(options =>
        {
            options.AddPolicy("EliteOperational", policy =>
                policy.RequireRole("EliteOperator", "SystemAdministrator", "CountyManager")
                      .RequireClaim("OperationalLevel", "Elite", "Championship")
                      .RequireAuthenticatedUser());

            options.AddPolicy("EmergencyResponse", policy =>
                policy.RequireRole("EmergencyCoordinator", "SystemAdministrator")
                      .RequireClaim("EmergencyAccess", "Authorized")
                      .RequireAuthenticatedUser());

            options.AddPolicy("ComplianceAudit", policy =>
                policy.RequireRole("ComplianceOfficer", "SystemAdministrator")
                      .RequireClaim("ComplianceLevel", "Elite", "Government")
                      .RequireAuthenticatedUser());

            options.AddPolicy("AIAgentManagement", policy =>
                policy.RequireRole("AICoordinator", "SystemAdministrator")
                      .RequireClaim("AIManagement", "Authorized")
                      .RequireAuthenticatedUser());

            options.AddPolicy("PerformanceOptimization", policy =>
                policy.RequireRole("PerformanceAnalyst", "SystemAdministrator")
                      .RequireClaim("OptimizationAccess", "Authorized")
                      .RequireAuthenticatedUser());
        });

        return services;
    }

    /// <summary>
    /// Add Elite Operational Health Checks
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Application configuration</param>
    /// <returns>Service collection for method chaining</returns>
    public static IServiceCollection AddEliteOperationalHealthChecks(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHealthChecks()
            .AddCheck<HealthChecks.EliteOperationalHealthCheck>("elite-operational-excellence");
        // Future implementation: Additional health checks when service implementations are complete
        // .AddCheck<AIAgentCoordinationHealthCheck>("ai-agent-coordination")
        // .AddCheck<CountyServicesHealthCheck>("county-services")
        // .AddCheck<PerformanceMetricsHealthCheck>("performance-metrics")
        // .AddCheck<SecurityComplianceHealthCheck>("security-compliance")
        // .AddCheck<EmergencyResponseHealthCheck>("emergency-response")
        // .AddCheck<CitizenServicesHealthCheck>("citizen-services");

        return services;
    }

    /// <summary>
    /// Add Elite Operational Caching
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Application configuration</param>
    /// <returns>Service collection for method chaining</returns>
    public static IServiceCollection AddEliteOperationalCaching(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Add Memory Cache for operational metrics
        services.AddMemoryCache();

        // Add Distributed Cache for cross-instance metrics sharing
        var redisConnectionString = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrEmpty(redisConnectionString))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnectionString;
                options.InstanceName = "TerraFusion-EliteOperational";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        // Future implementation: Caching services when implementations are complete
        // services.AddScoped<IOperationalMetricsCache, OperationalMetricsCache>();
        // services.AddScoped<IPerformanceDataCache, PerformanceDataCache>();
        // services.AddScoped<IHealthStatusCache, HealthStatusCache>();

        return services;
    }

    /// <summary>
    /// Add Elite Operational Logging and Monitoring
    /// </summary>
    /// <param name="services">Service collection</param>
    /// <param name="configuration">Application configuration</param>
    /// <returns>Service collection for method chaining</returns>
    public static IServiceCollection AddEliteOperationalLogging(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IAuditLogger, Services.NoopAuditLogger>();

        // Future implementation: Structured logging services when implementations are complete
        // services.AddScoped<IOperationalLogger, OperationalLogger>();
        // services.AddScoped<IPerformanceLogger, PerformanceLogger>();
        // services.AddScoped<ISecurityEventLogger, SecurityEventLogger>();
        // services.AddScoped<IComplianceLogger, ComplianceLogger>();

        // Future implementation: Metrics collection when implementations are complete
        // services.AddScoped<IMetricsCollector, MetricsCollector>();
        // services.AddScoped<IOperationalTelemetry, OperationalTelemetry>();

        return services;
    }
}

/// <summary>
/// Elite Operational Configuration Options
/// </summary>
public class EliteOperationalOptions
{
    public bool EnableAutonomousSelfHealing { get; set; } = true;
    public bool EnablePredictiveMaintenance { get; set; } = true;
    public bool EnableAdvancedAnalytics { get; set; } = true;
    public int OperationalCycleDurationMinutes { get; set; } = 15;
    public double TargetOperationalExcellenceScore { get; set; } = 97.0;
    public int MaxConcurrentOperations { get; set; } = 100;
    public bool EnableRealTimeMonitoring { get; set; } = true;
    public bool EnableEmergencyResponseProtocols { get; set; } = true;
}

/// <summary>
/// Health Monitoring Configuration Options
/// </summary>
public class HealthMonitoringOptions
{
    public int MonitoringIntervalSeconds { get; set; } = 30;
    public double HealthThresholdWarning { get; set; } = 85.0;
    public double HealthThresholdCritical { get; set; } = 70.0;
    public bool EnablePredictiveHealthAnalysis { get; set; } = true;
    public int HealthHistoryRetentionDays { get; set; } = 30;
}

/// <summary>
/// Performance Optimization Configuration Options
/// </summary>
public class PerformanceOptimizationOptions
{
    public int OptimizationIntervalMinutes { get; set; } = 5;
    public double PerformanceThresholdOptimization { get; set; } = 90.0;
    public bool EnableAutomaticOptimization { get; set; } = true;
    public bool EnableResourceScaling { get; set; } = true;
    public int MaxOptimizationThreads { get; set; } = 10;
}

/// <summary>
/// Security Monitoring Configuration Options
/// </summary>
public class SecurityMonitoringOptions
{
    public int SecurityScanIntervalMinutes { get; set; } = 10;
    public bool EnableThreatDetection { get; set; } = true;
    public bool EnableIntrusionPrevention { get; set; } = true;
    public bool EnableComplianceValidation { get; set; } = true;
    public int SecurityEventRetentionDays { get; set; } = 90;
}

/// <summary>
/// Compliance Configuration Options
/// </summary>
public class ComplianceOptions
{
    public bool EnableFISMACompliance { get; set; } = true;
    public bool EnableFedRAMPCompliance { get; set; } = true;
    public bool EnableHIPAACompliance { get; set; } = true;
    public bool EnableSOX404Compliance { get; set; } = true;
    public int ComplianceAuditIntervalHours { get; set; } = 24;
    public string ComplianceLevel { get; set; } = "Championship";
}

/// <summary>
/// AI Agent Coordination Configuration Options
/// </summary>
public class AIAgentCoordinationOptions
{
    public int MaxActiveAgents { get; set; } = 50000;
    public int AgentHealthCheckIntervalSeconds { get; set; } = 60;
    public bool EnableSwarmOptimization { get; set; } = true;
    public bool EnableAgentLoadBalancing { get; set; } = true;
    public int AgentCoordinationTimeoutSeconds { get; set; } = 30;
}

/// <summary>
/// Emergency Response Configuration Options
/// </summary>
public class EmergencyResponseOptions
{
    public bool EnableAutomaticEmergencyResponse { get; set; } = true;
    public int EmergencyResponseTimeoutSeconds { get; set; } = 300;
    public string[] EmergencyNotificationChannels { get; set; } = Array.Empty<string>();
    public bool EnableDisasterRecovery { get; set; } = true;
    public int DisasterRecoveryTimeoutMinutes { get; set; } = 30;
}
