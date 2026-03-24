using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace TerraFusion.Data;

/// <summary>
/// Design-time DbContext factory for EF Core migrations.
/// Targets the local dev Postgres container (terrafusion-postgres-dev).
/// </summary>
public class TerraFusionDbContextFactory : IDesignTimeDbContextFactory<TerraFusionDbContext>
{
    public TerraFusionDbContext CreateDbContext(string[] args)
    {
        var apiPath = Path.Combine(Directory.GetCurrentDirectory(), "../TerraFusion.API");
        if (!Directory.Exists(apiPath))
            apiPath = Directory.GetCurrentDirectory();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddJsonFile("appsettings.Development.local.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<TerraFusionDbContext>();

        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrEmpty(connectionString) || !connectionString.Contains("Host="))
            connectionString = "Host=localhost;Port=5432;Database=terrafusion;Username=postgres;Password=devpassword123";

        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.MigrationsAssembly("TerraFusion.Data");
            npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
            npgsqlOptions.UseVector();
        });

        return new TerraFusionDbContext(optionsBuilder.Options, configuration);
    }
}
