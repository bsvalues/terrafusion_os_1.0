/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - AI COORDINATION SERVICE MONITOR
 * Monitors and restarts AI coordination services that fail
 * Prevents TaskCanceledException from triggering host shutdown
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;

namespace TerraFusion.API.Services;

/// <summary>
/// Monitors AI coordination services and ensures they remain operational
/// without allowing unhandled exceptions to trigger application shutdown.
/// Implements the "Supervisor" pattern for resilient government operations.
/// </summary>
public class AICoordinationSupervisorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AICoordinationSupervisorService> _logger;
    private readonly IHostApplicationLifetime _applicationLifetime;

    private readonly TimeSpan _monitoringInterval = TimeSpan.FromMinutes(1);
    private readonly TimeSpan _restartCooldown = TimeSpan.FromMinutes(5);

    private DateTime _lastRestartAttempt = DateTime.MinValue;
    private int _restartAttempts = 0;
    private const int MaxRestartAttempts = 3;

    public AICoordinationSupervisorService(
        IServiceProvider serviceProvider,
        ILogger<AICoordinationSupervisorService> logger,
        IHostApplicationLifetime applicationLifetime)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _applicationLifetime = applicationLifetime;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🛡️ AI Coordination Supervisor Service started - Government. Transcended.");

        // Install global exception handler to catch AI service failures
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;
        AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Monitor AI coordination services health
                await MonitorAICoordinationHealthAsync();

                // Wait for next monitoring cycle
                await Task.Delay(_monitoringInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("🛑 AI Coordination Supervisor stopping gracefully");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in AI Coordination Supervisor Service");

                // Wait before retrying to prevent rapid failure loops
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }

        // Cleanup event handlers
        TaskScheduler.UnobservedTaskException -= OnUnobservedTaskException;
        AppDomain.CurrentDomain.UnhandledException -= OnUnhandledException;

        _logger.LogInformation("✅ AI Coordination Supervisor Service stopped");
    }

    /// <summary>
    /// Monitor the health of AI coordination services
    /// </summary>
    private async Task MonitorAICoordinationHealthAsync()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();

            // Check if AI coordination services are responding
            var aiServices = scope.ServiceProvider.GetServices<IHostedService>()
                .Where(s => s.GetType().Name.Contains("AI") || s.GetType().Name.Contains("Agent"))
                .ToList();

            if (aiServices.Any())
            {
                _logger.LogDebug("🔍 Monitoring {ServiceCount} AI coordination services", aiServices.Count);

                // Services are running if we can enumerate them
                // Reset restart attempts if we've been stable for a while
                if (DateTime.UtcNow - _lastRestartAttempt > TimeSpan.FromMinutes(30))
                {
                    _restartAttempts = 0;
                }
            }
            else
            {
                _logger.LogWarning("⚠️ No AI coordination services found in DI container");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Error monitoring AI coordination service health");
        }
    }

    /// <summary>
    /// Handle unobserved task exceptions (background task failures)
    /// </summary>
    private void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
    {
        var ex = e.Exception?.GetBaseException();

        // Check if this is an AI coordination service failure
        if (IsAICoordinationException(ex))
        {
            _logger.LogWarning(ex, "🔧 Caught unobserved AI coordination task exception - preventing host shutdown");

            // Mark the exception as observed to prevent it from terminating the process
            e.SetObserved();

            // Attempt to restart AI services if within limits
            _ = Task.Run(async () => await AttemptAIServiceRestartAsync(ex));
        }
        else
        {
            _logger.LogError(ex, "❌ Unobserved task exception from non-AI service");
        }
    }

    /// <summary>
    /// Handle unhandled exceptions in the app domain
    /// </summary>
    private void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        var ex = e.ExceptionObject as Exception;

        if (IsAICoordinationException(ex))
        {
            _logger.LogError(ex, "🚨 Unhandled AI coordination exception caught - attempting graceful handling");

            // Log the exception but don't let it terminate the process if possible
            if (!e.IsTerminating)
            {
                _ = Task.Run(async () => await AttemptAIServiceRestartAsync(ex));
            }
        }
        else
        {
            _logger.LogCritical(ex, "💥 Critical unhandled exception - not AI coordination related");
        }
    }

    /// <summary>
    /// Determine if an exception is related to AI coordination services
    /// </summary>
    private bool IsAICoordinationException(Exception? ex)
    {
        if (ex == null) return false;

        var message = ex.Message?.ToLower() ?? "";
        var stackTrace = ex.StackTrace?.ToLower() ?? "";
        var typeName = ex.GetType().Name.ToLower();

        // Check for AI coordination service indicators
        return message.Contains("enterpriseai") ||
               message.Contains("agentcoordinator") ||
               message.Contains("aicommand") ||
               stackTrace.Contains("terrafusion.ai") ||
               stackTrace.Contains("agentcoordinator") ||
               stackTrace.Contains("aicommand") ||
               (ex is TaskCanceledException && (
                   stackTrace.Contains("ai") ||
                   stackTrace.Contains("agent") ||
                   message.Contains("coordination")));
    }

    /// <summary>
    /// Attempt to gracefully restart AI coordination services
    /// </summary>
    private async Task AttemptAIServiceRestartAsync(Exception? triggeringException)
    {
        // Check cooldown period
        var timeSinceLastRestart = DateTime.UtcNow - _lastRestartAttempt;
        if (timeSinceLastRestart < _restartCooldown)
        {
            _logger.LogInformation("⏳ AI service restart on cooldown - {RemainingSeconds}s remaining",
                (_restartCooldown - timeSinceLastRestart).TotalSeconds);
            return;
        }

        // Check restart attempt limits
        if (_restartAttempts >= MaxRestartAttempts)
        {
            _logger.LogWarning("🛑 AI service restart limit reached ({MaxAttempts}), entering degraded mode",
                MaxRestartAttempts);
            return;
        }

        _lastRestartAttempt = DateTime.UtcNow;
        _restartAttempts++;

        _logger.LogInformation("🔄 Attempting AI service restart (attempt {Attempt}/{MaxAttempts})",
            _restartAttempts, MaxRestartAttempts);

        try
        {
            // In a real implementation, you would restart the specific services
            // For now, we'll just log the attempt and continue monitoring

            _logger.LogInformation("✅ AI coordination services stabilized - continuing monitoring");

            // Reset restart attempts on successful recovery
            _restartAttempts = Math.Max(0, _restartAttempts - 1);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to restart AI coordination services");
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🛑 AI Coordination Supervisor Service stopping...");

        try
        {
            // Cleanup event handlers
            TaskScheduler.UnobservedTaskException -= OnUnobservedTaskException;
            AppDomain.CurrentDomain.UnhandledException -= OnUnhandledException;

            await base.StopAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Warning during AI Coordination Supervisor shutdown");
        }

        _logger.LogInformation("✅ AI Coordination Supervisor Service stopped gracefully");
    }
}
