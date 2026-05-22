using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.Services;

namespace TerraFusion.CurrentUse;

public static class CurrentUseServiceExtensions
{
    /// <summary>
    /// Registers CurrentUse services, DbContext, and controllers.
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

        // Register services
        services.AddScoped<IClassificationService, ClassificationService>();
        services.AddScoped<IRollbackCalculationService, RollbackCalculationService>();
        services.AddScoped<IInterestService, InterestService>();
        services.AddScoped<IRemovalService, RemovalService>();
        services.AddScoped<IPenaltyExceptionService, PenaltyExceptionService>();

        return services;
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
