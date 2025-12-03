using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace TerraFusion.Data;

/// <summary>
/// Design-time DbContext factory for EF Core migrations
/// Respects DOTNET_ENVIRONMENT / ASPNETCORE_ENVIRONMENT for proper config loading
/// </summary>
public class TerraFusionDbContextFactory : IDesignTimeDbContextFactory<TerraFusionDbContext>
{
    public TerraFusionDbContext CreateDbContext(string[] args)
    {
        // Determine environment (default to Development for local dev)
        var environment = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? "Development";

        Console.WriteLine($"[TerraFusionDbContextFactory] Environment: {environment}");

        // Build configuration from TerraFusion.API appsettings
        var apiPath = Path.Combine(Directory.GetCurrentDirectory(), "../TerraFusion.API");
        if (!Directory.Exists(apiPath))
        {
            apiPath = Path.Combine(Directory.GetCurrentDirectory(), "TerraFusion.API");
        }
        if (!Directory.Exists(apiPath))
        {
            apiPath = Directory.GetCurrentDirectory();
        }

        Console.WriteLine($"[TerraFusionDbContextFactory] Config path: {apiPath}");

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiPath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=terrafusion_dev.db";

        Console.WriteLine($"[TerraFusionDbContextFactory] Connection: {connectionString}");

        // Create DbContext options
        var optionsBuilder = new DbContextOptionsBuilder<TerraFusionDbContext>();

        if (connectionString.Contains("Host="))
        {
            // PostgreSQL for production
            Console.WriteLine($"[TerraFusionDbContextFactory] Using PostgreSQL");
            optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly("TerraFusion.Data");
                npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
            });
        }
        else
        {
            // SQLite for development
            Console.WriteLine($"[TerraFusionDbContextFactory] Using SQLite");
            optionsBuilder.UseSqlite(connectionString, sqliteOptions =>
            {
                sqliteOptions.MigrationsAssembly("TerraFusion.Data");
            });
        }

        return new TerraFusionDbContext(optionsBuilder.Options, configuration);
    }
}
