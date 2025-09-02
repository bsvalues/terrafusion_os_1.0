using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

public class DatabaseInitializationHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<DatabaseInitializationHostedService> _logger;

    public DatabaseInitializationHostedService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<DatabaseInitializationHostedService> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait a short time for server to start up before initializing database
        await Task.Delay(2000, stoppingToken);
        
        try
        {
            _logger.LogInformation("Background database initialization starting...");
            
            using var scope = _serviceScopeFactory.CreateScope();
            var databaseService = scope.ServiceProvider.GetRequiredService<IDatabaseInitializationService>();
            
            await databaseService.InitializeAsync();
            
            _logger.LogInformation("Background database initialization completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Background database initialization failed: {Error}", ex.Message);
            // Don't throw - let the server continue running even if DB init fails
        }
    }
}