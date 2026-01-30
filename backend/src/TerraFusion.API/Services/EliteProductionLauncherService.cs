/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ELITE PRODUCTION LAUNCHER SERVICE
 * Championship-Level Continuous Operation Management
 * Government-Grade Service Deployment and Monitoring
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using System.Diagnostics;
using System.ServiceProcess;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;

namespace TerraFusion.API.Services;

/// <summary>
/// Elite production launcher service that ensures continuous operation
/// of the TerraFusion API with automatic restart capabilities, health monitoring,
/// and government-grade reliability standards for 24/7 operation.
/// </summary>
public class EliteProductionLauncherService : BackgroundService
{
    private readonly ILogger<EliteProductionLauncherService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IHostApplicationLifetime _applicationLifetime;

    private readonly TimeSpan _healthCheckInterval = TimeSpan.FromMinutes(2);
    private readonly TimeSpan _restartDelay = TimeSpan.FromSeconds(10);

    private Process? _apiProcess;
    private DateTime _lastHealthCheck = DateTime.MinValue;
    private int _consecutiveFailures = 0;
    private bool _continuousOperationMode = false;

    public EliteProductionLauncherService(
        ILogger<EliteProductionLauncherService> logger,
        IServiceProvider serviceProvider,
        IHostApplicationLifetime applicationLifetime)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _applicationLifetime = applicationLifetime;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 Elite Production Launcher Service started - Continuous Operation Mode");

        // Check if running as Windows Service or console
        _continuousOperationMode = IsRunningAsService() || Environment.GetCommandLineArgs().Contains("--production");

        if (!_continuousOperationMode)
        {
            _logger.LogInformation("ℹ️ Running in development mode - Production Launcher inactive");
            return;
        }

        _logger.LogInformation("🏛️ Production Mode Activated - Ensuring 24/7 Government Service");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await EnsureApiIsRunningAsync(stoppingToken);
                await Task.Delay(_healthCheckInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("🛑 Production Launcher stopping - Graceful shutdown requested");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in Production Launcher Service");

                _consecutiveFailures++;
                var backoffDelay = TimeSpan.FromSeconds(Math.Min(30 * Math.Pow(2, _consecutiveFailures - 1), 300));

                try
                {
                    await Task.Delay(backoffDelay, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }

        // Cleanup on shutdown
        await StopApiProcessAsync();
    }

    /// <summary>
    /// Ensure the API process is running and healthy
    /// </summary>
    private async Task EnsureApiIsRunningAsync(CancellationToken cancellationToken)
    {
        // Check if process is still running
        if (_apiProcess != null && !_apiProcess.HasExited)
        {
            // Perform health check
            var isHealthy = await PerformHealthCheckAsync();
            if (isHealthy)
            {
                _consecutiveFailures = 0;
                _logger.LogDebug("✅ API health check passed - Service operational");
                return;
            }
            else
            {
                _logger.LogWarning("⚠️ API health check failed - Restarting service");
                await StopApiProcessAsync();
            }
        }

        // Start or restart the API process
        await StartApiProcessAsync(cancellationToken);
    }

    /// <summary>
    /// Start the API process with production configuration
    /// </summary>
    private async Task StartApiProcessAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("🚀 Starting TerraFusion API in production mode...");

            var processStartInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = "run --configuration Release --urls \"http://127.0.0.1:0\" --environment Production",
                WorkingDirectory = GetApiDirectory(),
                UseShellExecute = false,
                RedirectStandardOutput = false,
                RedirectStandardError = false,
                CreateNoWindow = true
            };

            // Set production environment variables
            processStartInfo.Environment["ASPNETCORE_ENVIRONMENT"] = "Production";
            processStartInfo.Environment["TF_PRODUCTION_MODE"] = "true";
            processStartInfo.Environment["TF_CONTINUOUS_OPERATION"] = "true";

            _apiProcess = Process.Start(processStartInfo);

            if (_apiProcess != null)
            {
                _logger.LogInformation("✅ API process started with PID: {ProcessId}", _apiProcess.Id);

                // Wait for API to initialize
                await Task.Delay(TimeSpan.FromSeconds(15), cancellationToken);

                // Verify startup was successful
                var isHealthy = await PerformHealthCheckAsync();
                if (isHealthy)
                {
                    _logger.LogInformation("🏆 API successfully started and healthy");
                    _consecutiveFailures = 0;
                }
                else
                {
                    _logger.LogWarning("⚠️ API started but health check failed");
                    _consecutiveFailures++;
                }
            }
            else
            {
                throw new InvalidOperationException("Failed to start API process");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to start API process");
            _consecutiveFailures++;
            throw;
        }
    }

    /// <summary>
    /// Stop the API process gracefully
    /// </summary>
    private async Task StopApiProcessAsync()
    {
        await Task.CompletedTask;
        await Task.CompletedTask;
        if (_apiProcess != null && !_apiProcess.HasExited)
        {
            try
            {
                _logger.LogInformation("🛑 Stopping API process gracefully...");

                // Send Ctrl+C signal for graceful shutdown
                _apiProcess.CloseMainWindow();

                // Wait for graceful shutdown
                var gracefulShutdown = _apiProcess.WaitForExit(30000); // 30 seconds

                if (!gracefulShutdown)
                {
                    _logger.LogWarning("⚠️ Graceful shutdown timeout - Force killing process");
                    _apiProcess.Kill();
                }

                _apiProcess.Dispose();
                _apiProcess = null;

                _logger.LogInformation("✅ API process stopped");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error stopping API process");
            }
        }
    }

    /// <summary>
    /// Perform health check on the running API
    /// </summary>
    private async Task<bool> PerformHealthCheckAsync()
    {
        try
        {
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };

            // Try to detect the API port from running processes
            var apiUrl = await DetectApiUrlFromProcessAsync();
            if (string.IsNullOrEmpty(apiUrl))
            {
                _logger.LogWarning("⚠️ Could not detect API URL for health check");
                return false;
            }

            var response = await httpClient.GetAsync($"{apiUrl}/health");
            var isHealthy = response.IsSuccessStatusCode;

            _lastHealthCheck = DateTime.UtcNow;

            if (isHealthy)
            {
                _logger.LogDebug("✅ Health check passed for {ApiUrl}", apiUrl);
            }
            else
            {
                _logger.LogWarning("❌ Health check failed for {ApiUrl} - Status: {StatusCode}",
                    apiUrl, response.StatusCode);
            }

            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Health check exception");
            return false;
        }
    }

    /// <summary>
    /// Detect API URL from running .NET processes
    /// </summary>
    private async Task<string?> DetectApiUrlFromProcessAsync()
    {
        try
        {
            // Look for TerraFusion API process listening ports
            var candidatePorts = new[] { 5000, 5001, 52213, 61544 };

            foreach (var port in candidatePorts)
            {
                var testUrl = $"http://127.0.0.1:{port}";
                try
                {
                    using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
                    var response = await client.GetAsync($"{testUrl}/health");
                    if (response.IsSuccessStatusCode)
                    {
                        return testUrl;
                    }
                }
                catch
                {
                    // Continue to next port
                }
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not detect API URL from process");
            return null;
        }
    }

    /// <summary>
    /// Get the API directory path
    /// </summary>
    private string GetApiDirectory()
    {
        // This should be the directory where TerraFusion.API.csproj is located
        var currentDirectory = Directory.GetCurrentDirectory();

        // If we're already in the API directory, use it
        if (File.Exists(Path.Combine(currentDirectory, "TerraFusion.API.csproj")))
        {
            return currentDirectory;
        }

        // Otherwise, try to find it relative to current directory
        var apiPath = Path.Combine(currentDirectory, "TerraFusion.API");
        if (Directory.Exists(apiPath) && File.Exists(Path.Combine(apiPath, "TerraFusion.API.csproj")))
        {
            return apiPath;
        }

        // Default fallback
        return @"C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API";
    }

    /// <summary>
    /// Check if running as a Windows Service
    /// </summary>
    private bool IsRunningAsService()
    {
        try
        {
            return !Environment.UserInteractive;
        }
        catch
        {
            return false;
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🛑 Elite Production Launcher Service stopping...");

        await StopApiProcessAsync();

        await base.StopAsync(stoppingToken);
        _logger.LogInformation("✅ Elite Production Launcher Service stopped gracefully");
    }
}
