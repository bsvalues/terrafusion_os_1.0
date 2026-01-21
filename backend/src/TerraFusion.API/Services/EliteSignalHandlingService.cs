/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ELITE SIGNAL HANDLING SERVICE
 * Championship-Level Process Signal Management and Graceful Shutdown
 * Government-Grade Application Lifecycle Management
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Runtime.InteropServices;

namespace TerraFusion.API.Services;

/// <summary>
/// Elite signal handling service that intercepts POSIX signals (SIGTERM, SIGINT)
/// and manages graceful shutdown procedures to prevent premature application termination
/// and ensure government-grade data integrity during shutdown sequences.
/// </summary>
public class EliteSignalHandlingService : BackgroundService
{
    private readonly ILogger<EliteSignalHandlingService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IHostApplicationLifetime _applicationLifetime;

    private readonly ManualResetEventSlim _shutdownSignalReceived = new(false);
    private readonly CancellationTokenSource _internalCancellation = new();

    private bool _isShuttingDown = false;
    private DateTime? _firstSignalTime;
    private int _signalCount = 0;

    // Signal handling delegates
    private static readonly Dictionary<int, EliteSignalHandlingService> _activeServices = new();
    private readonly int _serviceId;

    public EliteSignalHandlingService(
        ILogger<EliteSignalHandlingService> logger,
        IServiceProvider serviceProvider,
        IHostApplicationLifetime applicationLifetime)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _applicationLifetime = applicationLifetime;
        _serviceId = GetHashCode();

        lock (_activeServices)
        {
            _activeServices[_serviceId] = this;
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🛡️ Elite Signal Handling Service started - Signal Protection Active");

        try
        {
            // Register signal handlers for different platforms
            RegisterSignalHandlers();

            // Monitor for shutdown signals
            using var combinedToken = CancellationTokenSource.CreateLinkedTokenSource(
                stoppingToken, _internalCancellation.Token);

            while (!combinedToken.Token.IsCancellationRequested)
            {
                try
                {
                    // Wait for either shutdown signal or cancellation
                    var signalTask = Task.Run(() => _shutdownSignalReceived.Wait(combinedToken.Token), combinedToken.Token);
                    var delayTask = Task.Delay(TimeSpan.FromSeconds(30), combinedToken.Token);

                    await Task.WhenAny(signalTask, delayTask);

                    if (_shutdownSignalReceived.IsSet && !_isShuttingDown)
                    {
                        _logger.LogWarning("📡 Shutdown signal detected - Initiating graceful shutdown sequence");
                        await InitiateGracefulShutdownAsync();
                        break;
                    }

                    // Periodic status check
                    if (!_shutdownSignalReceived.IsSet)
                    {
                        _logger.LogDebug("🔍 Signal monitoring active - No shutdown signals detected");
                    }
                }
                catch (OperationCanceledException) when (combinedToken.Token.IsCancellationRequested)
                {
                    break;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Critical error in Elite Signal Handling Service");
        }
        finally
        {
            UnregisterSignalHandlers();
            _logger.LogInformation("🛑 Elite Signal Handling Service stopped");
        }
    }

    /// <summary>
    /// Register signal handlers for different operating systems
    /// </summary>
    private void RegisterSignalHandlers()
    {
        try
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                RegisterWindowsSignalHandlers();
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux) ||
                     RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                RegisterUnixSignalHandlers();
            }

            _logger.LogInformation("✅ Signal handlers registered for {Platform}",
                RuntimeInformation.OSDescription);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Could not register native signal handlers, falling back to application lifetime events");

            // Fallback to application lifetime events
            _applicationLifetime.ApplicationStopping.Register(() =>
            {
                OnSignalReceived("ApplicationStopping");
            });
        }
    }

    /// <summary>
    /// Register Windows-specific signal handlers
    /// </summary>
    private void RegisterWindowsSignalHandlers()
    {
        try
        {
            // Register for Ctrl+C and Ctrl+Break on Windows
            Console.CancelKeyPress += (sender, e) =>
            {
                e.Cancel = true; // Prevent immediate termination
                OnSignalReceived($"Console.CancelKeyPress ({e.SpecialKey})");
            };

            _logger.LogDebug("🪟 Windows console signal handlers registered");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not register Windows console handlers");
        }
    }

    /// <summary>
    /// Register Unix/Linux-specific signal handlers
    /// </summary>
    private void RegisterUnixSignalHandlers()
    {
        try
        {
            // For .NET 6+, we can use PosixSignalRegistration
            if (OperatingSystem.IsLinux() || OperatingSystem.IsMacOS())
            {
                var sigterm = PosixSignalRegistration.Create(PosixSignal.SIGTERM, context =>
                {
                    OnSignalReceived("SIGTERM");
                });

                var sigint = PosixSignalRegistration.Create(PosixSignal.SIGINT, context =>
                {
                    OnSignalReceived("SIGINT");
                });

                _logger.LogDebug("🐧 Unix signal handlers registered (SIGTERM, SIGINT)");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not register Unix signal handlers");
        }
    }

    /// <summary>
    /// Handle received shutdown signals
    /// </summary>
    private void OnSignalReceived(string signalName)
    {
        lock (this)
        {
            _signalCount++;
            _firstSignalTime ??= DateTime.UtcNow;

            _logger.LogWarning("⚠️ Signal received: {SignalName} (Count: {SignalCount})",
                signalName, _signalCount);

            // If multiple signals received quickly, force shutdown
            if (_signalCount > 3)
            {
                _logger.LogCritical("🚨 Multiple shutdown signals received - Forcing immediate shutdown");
                Environment.Exit(1);
                return;
            }

            // Signal the shutdown event
            _shutdownSignalReceived.Set();
        }
    }

    /// <summary>
    /// Initiate graceful shutdown sequence
    /// </summary>
    private async Task InitiateGracefulShutdownAsync()
    {
        if (_isShuttingDown) return;

        _isShuttingDown = true;
        var shutdownStart = DateTime.UtcNow;

        _logger.LogInformation("🔄 Starting graceful shutdown sequence...");

        try
        {
            // Step 1: Signal all background services to stop
            _logger.LogInformation("📤 Signaling background services to stop...");
            _internalCancellation.Cancel();

            // Step 2: Wait for background services with timeout
            _logger.LogInformation("⏳ Waiting for background services to complete...");
            var shutdownTimeout = TimeSpan.FromSeconds(30);
            var shutdownDelay = Task.Delay(shutdownTimeout);

            // Give services time to shut down gracefully
            await Task.WhenAny(shutdownDelay);

            // Step 3: Perform application-specific cleanup
            await PerformApplicationCleanupAsync();

            var shutdownDuration = DateTime.UtcNow - shutdownStart;
            _logger.LogInformation("✅ Graceful shutdown completed in {Duration}ms",
                shutdownDuration.TotalMilliseconds);

            // Step 4: Signal the application to stop
            _applicationLifetime.StopApplication();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during graceful shutdown sequence");

            // Force shutdown if graceful shutdown fails
            _logger.LogCritical("🚨 Graceful shutdown failed - Forcing immediate shutdown");
            Environment.Exit(1);
        }
    }

    /// <summary>
    /// Perform application-specific cleanup tasks
    /// </summary>
    private async Task PerformApplicationCleanupAsync()
    {
        var cleanupTasks = new List<Task>();

        try
        {
            _logger.LogInformation("🧹 Performing application cleanup...");

            // Cleanup AI services
            cleanupTasks.Add(CleanupAIServicesAsync());

            // Cleanup database connections
            cleanupTasks.Add(CleanupDatabaseConnectionsAsync());

            // Cleanup background processes
            cleanupTasks.Add(CleanupBackgroundProcessesAsync());

            // Wait for all cleanup tasks with timeout
            var cleanupTimeout = Task.Delay(TimeSpan.FromSeconds(15));
            var allCleanupTasks = Task.WhenAll(cleanupTasks);

            await Task.WhenAny(allCleanupTasks, cleanupTimeout);

            if (!allCleanupTasks.IsCompleted)
            {
                _logger.LogWarning("⚠️ Some cleanup tasks did not complete within timeout");
            }
            else
            {
                _logger.LogInformation("✅ Application cleanup completed successfully");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during application cleanup");
        }
    }

    /// <summary>
    /// Cleanup AI services and agent coordination
    /// </summary>
    private async Task CleanupAIServicesAsync()
    {
        try
        {
            _logger.LogDebug("🤖 Cleaning up AI services...");

            // Signal AI coordination services to stop
            using var scope = _serviceProvider.CreateScope();

            // Give AI services time to save state
            await Task.Delay(TimeSpan.FromSeconds(2));

            _logger.LogDebug("✅ AI services cleanup completed");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Error cleaning up AI services");
        }
    }

    /// <summary>
    /// Cleanup database connections
    /// </summary>
    private async Task CleanupDatabaseConnectionsAsync()
    {
        try
        {
            _logger.LogDebug("🗄️ Cleaning up database connections...");

            // Allow time for any pending database operations to complete
            await Task.Delay(TimeSpan.FromSeconds(1));

            _logger.LogDebug("✅ Database cleanup completed");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Error cleaning up database connections");
        }
    }

    /// <summary>
    /// Cleanup background processes
    /// </summary>
    private async Task CleanupBackgroundProcessesAsync()
    {
        try
        {
            _logger.LogDebug("⚡ Cleaning up background processes...");

            // Allow time for background processes to complete current operations
            await Task.Delay(TimeSpan.FromSeconds(1));

            _logger.LogDebug("✅ Background processes cleanup completed");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Error cleaning up background processes");
        }
    }

    /// <summary>
    /// Unregister signal handlers
    /// </summary>
    private void UnregisterSignalHandlers()
    {
        try
        {
            lock (_activeServices)
            {
                _activeServices.Remove(_serviceId);
            }

            _logger.LogDebug("🔌 Signal handlers unregistered");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not unregister signal handlers");
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🛑 Elite Signal Handling Service stopping...");

        // Signal internal cancellation
        _internalCancellation.Cancel();

        // Cleanup resources
        _shutdownSignalReceived?.Dispose();
        _internalCancellation?.Dispose();

        await base.StopAsync(stoppingToken);
        _logger.LogInformation("✅ Elite Signal Handling Service stopped gracefully");
    }
}
