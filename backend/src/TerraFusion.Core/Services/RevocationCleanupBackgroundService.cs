using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Services;

/// <summary>
/// Periodically removes expired token revocation entries.
/// Disabled by default and enabled via configuration:
/// Authentication:RevocationCleanup:Enabled=true
/// Authentication:RevocationCleanup:IntervalMinutes=60
/// </summary>
public sealed class RevocationCleanupBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RevocationCleanupBackgroundService> _logger;
    private readonly bool _enabled;
    private readonly TimeSpan _interval;

    public RevocationCleanupBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<RevocationCleanupBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _enabled = configuration.GetValue<bool>("Authentication:RevocationCleanup:Enabled");

        var intervalMinutes = configuration.GetValue<int?>("Authentication:RevocationCleanup:IntervalMinutes") ?? 60;
        if (intervalMinutes <= 0)
        {
            intervalMinutes = 60;
        }

        _interval = TimeSpan.FromMinutes(intervalMinutes);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_enabled)
        {
            _logger.LogInformation("Revocation cleanup background service is disabled by configuration.");
            return;
        }

        _logger.LogInformation("Revocation cleanup background service enabled. Interval: {Interval}.", _interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var authService = scope.ServiceProvider.GetRequiredService<IAuthenticationService>();

                var removed = await authService.CleanupExpiredBlacklistedTokensAsync(DateTime.UtcNow, stoppingToken);
                _logger.LogInformation("Revocation cleanup run complete. Removed {RemovedCount} expired entries.", removed);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Revocation cleanup run failed.");
            }

            try
            {
                await Task.Delay(_interval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
