// TFT-089 — Connector Health Service
// Background health checker for all registered data connectors.

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Data.Connectors;

namespace TerraFusion.API.Services;

/// <summary>
/// Contract for querying connector health state.
/// </summary>
public interface IConnectorHealthService
{
    /// <summary>Gets the most recent health snapshot for all connectors.</summary>
    IReadOnlyList<ConnectorHealthDto> GetAllHealth();

    /// <summary>Gets the most recent health snapshot for a specific connector.</summary>
    ConnectorHealthDto? GetHealth(string connectorName);
}

/// <summary>
/// TFT-089: Background health checker for data connectors.
/// Periodically pings each registered connector, tracks latency,
/// and maintains uptime percentages over a trailing window.
/// </summary>
public sealed class ConnectorHealthService : BackgroundService, IConnectorHealthService
{
    private readonly ILogger<ConnectorHealthService> _logger;
    private readonly IEnumerable<IDataConnector> _connectors;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);
    private readonly int _historySize = 288; // 24 hours at 5-min intervals

    private readonly Dictionary<string, ConnectorHealthDto> _current = new();
    private readonly Dictionary<string, Queue<bool>> _history = new();
    private readonly object _lock = new();

    /// <summary>Initializes a new ConnectorHealthService.</summary>
    public ConnectorHealthService(
        ILogger<ConnectorHealthService> logger,
        IEnumerable<IDataConnector> connectors)
    {
        _logger = logger;
        _connectors = connectors;
    }

    /// <inheritdoc />
    public IReadOnlyList<ConnectorHealthDto> GetAllHealth()
    {
        lock (_lock)
        {
            return _current.Values.ToList();
        }
    }

    /// <inheritdoc />
    public ConnectorHealthDto? GetHealth(string connectorName)
    {
        lock (_lock)
        {
            _current.TryGetValue(connectorName, out var dto);
            return dto;
        }
    }

    /// <summary>Runs the periodic health check loop.</summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "ConnectorHealthService started, checking every {Interval}", _checkInterval);

        // Initial check on startup
        await CheckAllAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_checkInterval, stoppingToken);
                await CheckAllAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during connector health check cycle");
            }
        }

        _logger.LogInformation("ConnectorHealthService stopped");
    }

    /// <summary>Pings every registered connector and updates state.</summary>
    private async Task CheckAllAsync(CancellationToken ct)
    {
        foreach (var connector in _connectors)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            bool healthy;
            string? error = null;

            try
            {
                healthy = await connector.TestConnectionAsync(ct);
            }
            catch (Exception ex)
            {
                healthy = false;
                error = ex.Message;
            }

            sw.Stop();

            lock (_lock)
            {
                if (!_history.TryGetValue(connector.Name, out var queue))
                {
                    queue = new Queue<bool>();
                    _history[connector.Name] = queue;
                }

                queue.Enqueue(healthy);
                while (queue.Count > _historySize)
                    queue.Dequeue();

                var uptime = queue.Count > 0
                    ? queue.Count(h => h) / (double)queue.Count * 100.0
                    : 0.0;

                _current[connector.Name] = new ConnectorHealthDto
                {
                    Name = connector.Name,
                    IsHealthy = healthy,
                    Latency = sw.Elapsed,
                    UptimePercent = Math.Round(uptime, 2),
                    CheckedAt = DateTime.UtcNow,
                    ErrorDetail = error,
                };
            }

            if (!healthy)
            {
                _logger.LogWarning(
                    "Connector {Name} unhealthy: {Error}", connector.Name, error);
            }
        }

        _logger.LogDebug("Health check cycle complete for {Count} connectors",
            _connectors.Count());
    }
}
