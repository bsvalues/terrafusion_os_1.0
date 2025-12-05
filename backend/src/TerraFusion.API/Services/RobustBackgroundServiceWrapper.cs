/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ROBUST BACKGROUND SERVICE WRAPPER
 * Prevents hosted service cancellation from triggering host shutdown
 * Championship-Level Error Handling and Graceful Degradation
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace TerraFusion.API.Services;

/// <summary>
/// Wraps any BackgroundService to provide robust error handling and prevent
/// unhandled cancellation exceptions from triggering application shutdown.
/// Implements the "Circuit Breaker" pattern for resilient government operations.
/// </summary>
public class RobustBackgroundServiceWrapper : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RobustBackgroundServiceWrapper> _logger;
    private readonly string _serviceName;
    private readonly Type _wrappedServiceType;
    private readonly TimeSpan _retryDelay = TimeSpan.FromSeconds(30);
    private readonly TimeSpan _maxRetryDelay = TimeSpan.FromMinutes(10);

    private int _consecutiveFailures = 0;
    private DateTime _lastFailure = DateTime.MinValue;
    private bool _circuitBreakerOpen = false;

    public RobustBackgroundServiceWrapper(
        IServiceProvider serviceProvider,
        ILogger<RobustBackgroundServiceWrapper> logger,
        Type wrappedServiceType,
        string serviceName)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _wrappedServiceType = wrappedServiceType;
        _serviceName = serviceName;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🛡️ Robust Background Service Wrapper started for {ServiceName}", _serviceName);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Check circuit breaker
                if (_circuitBreakerOpen && DateTime.UtcNow - _lastFailure < _maxRetryDelay)
                {
                    var remainingCooldown = _maxRetryDelay - (DateTime.UtcNow - _lastFailure);
                    _logger.LogWarning("⚡ Circuit breaker OPEN for {ServiceName}. Cooldown: {Cooldown}ms",
                        _serviceName, remainingCooldown.TotalMilliseconds);

                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                    continue;
                }

                // Reset circuit breaker if cooldown expired
                if (_circuitBreakerOpen)
                {
                    _logger.LogInformation("🔄 Circuit breaker RESET for {ServiceName}, attempting restart", _serviceName);
                    _circuitBreakerOpen = false;
                    _consecutiveFailures = 0;
                }

                // Execute the wrapped service
                await ExecuteWrappedServiceAsync(stoppingToken);

                // If we reach here, the service completed successfully (or was cancelled gracefully)
                _logger.LogInformation("✅ {ServiceName} completed execution gracefully", _serviceName);
                break;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // This is expected - the application is shutting down
                _logger.LogInformation("🛑 {ServiceName} stopping gracefully due to cancellation request", _serviceName);
                break;
            }
            catch (Exception ex)
            {
                _consecutiveFailures++;
                _lastFailure = DateTime.UtcNow;

                _logger.LogError(ex,
                    "❌ Error in wrapped background service {ServiceName} (failure #{FailureCount})",
                    _serviceName, _consecutiveFailures);

                // Implement exponential backoff with circuit breaker
                if (_consecutiveFailures >= 5)
                {
                    _circuitBreakerOpen = true;
                    _logger.LogWarning("⚡ Circuit breaker OPENED for {ServiceName} after {FailureCount} consecutive failures",
                        _serviceName, _consecutiveFailures);
                }

                // Calculate backoff delay (exponential backoff capped at max retry delay)
                var backoffMultiplier = Math.Min(Math.Pow(2, _consecutiveFailures - 1), 32);
                var backoffDelay = TimeSpan.FromSeconds(Math.Min(_retryDelay.TotalSeconds * backoffMultiplier, _maxRetryDelay.TotalSeconds));

                _logger.LogInformation("⏳ {ServiceName} will retry in {DelaySeconds}s", _serviceName, backoffDelay.TotalSeconds);

                try
                {
                    await Task.Delay(backoffDelay, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    _logger.LogInformation("🛑 {ServiceName} cancellation requested during backoff", _serviceName);
                    break;
                }
            }
        }
    }

    /// <summary>
    /// Execute the wrapped service using dependency injection
    /// </summary>
    private async Task ExecuteWrappedServiceAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();

        // Try to get the service from DI
        var wrappedService = scope.ServiceProvider.GetService(_wrappedServiceType);
        if (wrappedService == null)
        {
            throw new InvalidOperationException($"Could not resolve service of type {_wrappedServiceType.Name} from DI container");
        }

        // Check if it's a BackgroundService
        if (wrappedService is BackgroundService backgroundService)
        {
            _logger.LogDebug("🔄 Starting BackgroundService {ServiceName}", _serviceName);

            // Use reflection to call ExecuteAsync (it's protected)
            var executeMethod = typeof(BackgroundService).GetMethod("ExecuteAsync",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            if (executeMethod != null)
            {
                var task = (Task?)executeMethod.Invoke(backgroundService, new object[] { stoppingToken });
                if (task != null)
                {
                    await task;
                    _consecutiveFailures = 0; // Reset failure count on successful execution
                }
            }
            else
            {
                throw new InvalidOperationException($"Could not find ExecuteAsync method on {_wrappedServiceType.Name}");
            }
        }
        else
        {
            throw new InvalidOperationException($"Service {_wrappedServiceType.Name} is not a BackgroundService");
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🛑 Robust Background Service Wrapper stopping for {ServiceName}", _serviceName);

        try
        {
            await base.StopAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Warning during {ServiceName} shutdown", _serviceName);
        }

        _logger.LogInformation("✅ Robust Background Service Wrapper stopped for {ServiceName}", _serviceName);
    }
}

/// <summary>
/// Extension methods for registering robust background services
/// </summary>
public static class RobustBackgroundServiceExtensions
{
    /// <summary>
    /// Add a background service with robust error handling that prevents host shutdown
    /// </summary>
    public static IServiceCollection AddRobustHostedService<TService>(
        this IServiceCollection services,
        string? serviceName = null)
        where TService : class, IHostedService
    {
        var name = serviceName ?? typeof(TService).Name;

        // Register the actual service as scoped (not as hosted service)
        services.AddScoped<TService>();

        // Register the robust wrapper as the hosted service
        services.AddHostedService(provider =>
            new RobustBackgroundServiceWrapper(
                provider,
                provider.GetRequiredService<ILogger<RobustBackgroundServiceWrapper>>(),
                typeof(TService),
                name));

        return services;
    }
}
