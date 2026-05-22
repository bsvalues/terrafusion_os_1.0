using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.Health;
using TerraFusion.CurrentUse.Middleware;
using TerraFusion.CurrentUse.Services;
using TerraFusion.CurrentUse.Validation;

namespace TerraFusion.CurrentUse;

public static class CurrentUseServiceExtensions
{
    /// <summary>
    /// Registers CurrentUse services, DbContext, validators, health checks, and controllers.
    /// Call from the host API's Program.cs or DI setup.
    /// </summary>
    public static IServiceCollection AddCurrentUseServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register DbContext — uses same connection string as the host or a dedicated one
        var connectionString = configuration.GetConnectionString("CurrentUse")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Database=terrafusion;Username=postgres;Password=postgres";

        if (connectionString.Contains("InMemory", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<CurrentUseDbContext>(options =>
                options.UseInMemoryDatabase("CurrentUse"));
        }
        else
        {
            services.AddDbContext<CurrentUseDbContext>(options =>
                options.UseNpgsql(connectionString, npgsql =>
                    npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "currentuse")));
        }

        // Register domain services
        services.AddScoped<IClassificationService, ClassificationService>();
        services.AddScoped<IRollbackCalculationService, RollbackCalculationService>();
        services.AddScoped<IInterestService, InterestService>();
        services.AddScoped<IRemovalService, RemovalService>();
        services.AddScoped<IPenaltyExceptionService, PenaltyExceptionService>();
        services.AddScoped<IAuditService, AuditService>();

        // Register FluentValidation validators
        services.AddScoped<IValidator<DTOs.RollbackCalculationRequest>, RollbackCalculationRequestValidator>();
        services.AddScoped<IValidator<DTOs.ClassificationCreateRequest>, ClassificationCreateRequestValidator>();
        services.AddScoped<IValidator<DTOs.RemovalInitiateRequest>, RemovalInitiateRequestValidator>();

        // Register health check
        services.AddHealthChecks()
            .AddCheck<CurrentUseHealthCheck>(
                "currentuse-database",
                HealthStatus.Degraded,
                tags: new[] { "currentuse", "database", "ready" });

        return services;
    }

    /// <summary>
    /// Adds CurrentUse exception handling middleware.
    /// Call in the middleware pipeline before MapControllers.
    /// </summary>
    public static IApplicationBuilder UseCurrentUseMiddleware(this IApplicationBuilder app)
    {
        app.UseMiddleware<CurrentUseExceptionMiddleware>();
        return app;
    }

    /// <summary>
    /// Ensures the CurrentUse database is created and seeded.
    /// Call during application startup.
    /// </summary>
    public static async Task InitializeCurrentUseDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CurrentUseDbContext>();

        // Apply migrations if using a real database
        if (db.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
        {
            await db.Database.MigrateAsync();
        }
        else
        {
            await db.Database.EnsureCreatedAsync();
        }
    }
}
