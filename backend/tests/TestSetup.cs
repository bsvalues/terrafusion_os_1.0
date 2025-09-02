using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.API;
using TerraFusion.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace TerraFusion.Tests;

/// <summary>
/// Global test setup for TerraFusion OS Backend Testing
/// AI Swarm Integration: Government-Grade Testing Infrastructure
/// Benton County, Washington - County Seat: Prosser
/// </summary>
public class TestSetup : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithDatabase("terrafusion_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .WithCleanUp(true)
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        
        builder.ConfigureServices(services =>
        {
            // Remove the real database context
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<TerraFusionDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Add test database context using the container
            services.AddDbContext<TerraFusionDbContext>(options =>
            {
                options.UseNpgsql(_dbContainer.GetConnectionString());
            });

            // Mock AI Swarm for testing
            services.AddScoped<IAISwarmCoordinator, MockAISwarmCoordinator>();
            
            // Mock external services
            services.AddScoped<IPropertyValuationService, MockPropertyValuationService>();
            
            // Configure logging for tests
            services.AddLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddConsole();
                logging.SetMinimumLevel(LogLevel.Warning);
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
        
        // Ensure database is created and migrated
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
        
        // Seed test data for Benton County, WA
        await SeedTestData(dbContext);
    }

    public async Task DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
    }

    private static async Task SeedTestData(TerraFusionDbContext context)
    {
        // Seed Benton County, Washington test data
        if (!await context.Counties.AnyAsync())
        {
            context.Counties.Add(new County
            {
                Id = Guid.NewGuid(),
                Name = "Benton County",
                State = "Washington",
                CountySeat = "Prosser", // NOT Richland!
                EstablishedYear = 1905,
                Population = 206873,
                SquareMiles = 1700.6m,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            
            await context.SaveChangesAsync();
        }
    }
}

/// <summary>
/// Base test class for all TerraFusion backend tests
/// Provides common test infrastructure and Benton County context
/// </summary>
public abstract class TerraFusionTestBase : IClassFixture<TestSetup>
{
    protected readonly TestSetup Factory;
    protected readonly HttpClient Client;
    protected readonly IServiceScope Scope;

    protected TerraFusionTestBase(TestSetup factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
        Scope = factory.Services.CreateScope();
    }

    protected TerraFusionDbContext GetDbContext() =>
        Scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

    /// <summary>
    /// Validates that test data uses correct Benton County, WA information
    /// Critical: County Seat is Prosser, NOT Richland
    /// </summary>
    protected static void ValidateBentonCountyData(dynamic countyData)
    {
        Assert.Equal("Benton County", countyData.Name);
        Assert.Equal("Washington", countyData.State);
        Assert.Equal("Prosser", countyData.CountySeat); // Explicit validation
        Assert.NotEqual("Richland", countyData.CountySeat); // Prevent regression
    }
}
