using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace TerraFusion.Data;

/// <summary>
/// Design-time DbContext factory for EF Core migrations
/// </summary>
public class TerraFusionDbContextFactory : IDesignTimeDbContextFactory<TerraFusionDbContext>
{
    public TerraFusionDbContext CreateDbContext(string[] args)
    {
        // Build configuration from TerraFusion.API appsettings (where Production config lives)
        var apiPath = Path.Combine(Directory.GetCurrentDirectory(), "../TerraFusion.API");
        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Production.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        // Create DbContext options
        var optionsBuilder = new DbContextOptionsBuilder<TerraFusionDbContext>();

        // PRODUCTION POSTGRESQL: Force PostgreSQL for migrations (no SQLite fallback)
        // This ensures EF Core migrations create tables in the actual terrafusion_production database
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Database=terrafusion_production;Username=terrafusion;Password=terrafusion_production_secure_2025";

        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.MigrationsAssembly("TerraFusion.Data");
            npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
        });

        return new TerraFusionDbContext(optionsBuilder.Options, configuration);
    }
}
