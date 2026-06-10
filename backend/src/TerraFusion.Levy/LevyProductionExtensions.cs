using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Levy.Health;
using TerraFusion.Levy.Middleware;
using TerraFusion.Levy.Services;
using TerraFusion.Levy.Validation;

namespace TerraFusion.Levy;

/// <summary>
/// Extension methods to register Levy production services:
/// - FluentValidation validators
/// - Health check
/// - Audit trail service
/// - Exception middleware
/// </summary>
public static class LevyProductionExtensions
{
    /// <summary>
    /// Registers Levy production services (validators, health check, audit).
    /// Call this after AddDbContext&lt;LevyDbContext&gt; in Program.cs.
    /// </summary>
    public static IServiceCollection AddLevyProductionServices(this IServiceCollection services)
    {
        // FluentValidation — register all validators from this assembly
        services.AddValidatorsFromAssemblyContaining<LevyCalculateRequestValidator>();

        // Audit trail
        services.AddScoped<ILevyAuditService, LevyAuditService>();

        // Health check
        services.AddHealthChecks()
            .AddCheck<LevyHealthCheck>("levy-database",
                tags: new[] { "db", "levy", "ready" });

        return services;
    }

    /// <summary>
    /// Adds the Levy exception middleware to the pipeline.
    /// Call this early in the middleware pipeline (before UseRouting).
    /// </summary>
    public static IApplicationBuilder UseLevyExceptionHandling(this IApplicationBuilder app)
    {
        app.UseMiddleware<LevyExceptionMiddleware>();
        return app;
    }
}
