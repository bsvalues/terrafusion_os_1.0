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
        // Build configuration
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        // Create DbContext options
        var optionsBuilder = new DbContextOptionsBuilder<TerraFusionDbContext>();
        
        // Use SQLite for migrations (fallback default)
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=terrafusion.db";
        
        if (connectionString.Contains("Host="))
        {
            // PostgreSQL for production
            optionsBuilder.UseNpgsql(connectionString);
        }
        else
        {
            // SQLite for development
            optionsBuilder.UseSqlite(connectionString);
        }

        return new TerraFusionDbContext(optionsBuilder.Options, configuration);
    }
}