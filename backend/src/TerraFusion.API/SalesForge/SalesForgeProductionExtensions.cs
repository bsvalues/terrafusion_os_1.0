using FluentValidation;

namespace TerraFusion.API.SalesForge;

/// <summary>
/// Extension methods to register SalesForge production services.
/// Call AddSalesForgeProductionServices() in Program.cs to wire up:
/// - FluentValidation validators
/// - Health check
/// - Audit service
/// </summary>
public static class SalesForgeProductionExtensions
{
    /// <summary>
    /// Registers SalesForge validators, audit service, and health check.
    /// </summary>
    public static IServiceCollection AddSalesForgeProductionServices(this IServiceCollection services)
    {
        // Validators
        services.AddScoped<IValidator<SalesForgeQueryRequest>, SalesForgeQueryValidator>();
        services.AddScoped<IValidator<ComputeQualificationsRequest>, ComputeQualificationsValidator>();
        services.AddScoped<IValidator<ApplyRecommendationsRequest>, ApplyRecommendationsValidator>();

        // Audit service (singleton — maintains hash chain in memory)
        services.AddSingleton<SalesForgeAuditService>();

        // Health check
        services.AddHealthChecks()
            .AddCheck<SalesForgeHealthCheck>("salesforge-database", tags: new[] { "salesforge", "database" });

        return services;
    }

    /// <summary>
    /// Adds SalesForge exception handling middleware to the pipeline.
    /// Should be called early in the middleware pipeline.
    /// </summary>
    public static IApplicationBuilder UseSalesForgeExceptionHandling(this IApplicationBuilder app)
    {
        app.UseMiddleware<SalesForgeExceptionMiddleware>();
        return app;
    }
}
