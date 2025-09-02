using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Npgsql;
using System.Data;

namespace TerraFusion.Core.Configuration;

/// <summary>
/// Advanced database configuration with optimized connection pooling
/// Implements high-performance connection management for government-scale operations
/// </summary>
public static class DatabaseConfiguration
{
    public static void ConfigureDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Database connection string not configured");

        // Configure PostgreSQL with optimized connection pooling
        services.AddDbContext<TerraFusionDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                // Connection resilience
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: new[] { "57P01" } // Connection failure
                );

                // Command timeout for government operations
                npgsqlOptions.CommandTimeout(30);

                // Enable sensitive data logging in development only
                if (configuration.GetValue<bool>("Logging:EnableSensitiveDataLogging", false))
                {
                    options.EnableSensitiveDataLogging();
                }
            });

            // Performance optimizations
            options.EnableServiceProviderCaching();
            options.EnableSensitiveDataLogging(false); // Security: disable in production
            options.ConfigureWarnings(warnings =>
            {
                warnings.Log(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.MultipleCollectionIncludeWarning);
            });
        });

        // Configure advanced connection pooling
        ConfigureConnectionPooling(services, configuration, connectionString);

        // Register database health checks
        services.AddHealthChecks()
            .AddNpgSql(connectionString, name: "database")
            .AddDbContextCheck<TerraFusionDbContext>();

        // Register database services
        services.AddScoped<IDatabaseConnectionService, DatabaseConnectionService>();
        services.AddScoped<IConnectionPoolMonitor, ConnectionPoolMonitor>();
    }

    private static void ConfigureConnectionPooling(IServiceCollection services, IConfiguration configuration, string baseConnectionString)
    {
        // Parse and enhance connection string with optimized pooling parameters
        var builder = new NpgsqlConnectionStringBuilder(baseConnectionString);

        // Connection pool optimization for government-scale operations
        var poolConfig = configuration.GetSection("Database:ConnectionPool");
        
        builder.MinPoolSize = poolConfig.GetValue("MinSize", 5);
        builder.MaxPoolSize = poolConfig.GetValue("MaxSize", 100);
        builder.ConnectionLifetime = poolConfig.GetValue("LifetimeSeconds", 300); // 5 minutes
        builder.ConnectionIdleLifetime = poolConfig.GetValue("IdleLifetimeSeconds", 180); // 3 minutes
        builder.ConnectionPruningInterval = poolConfig.GetValue("PruningIntervalSeconds", 10);

        // Performance optimizations
        builder.NoResetOnClose = true; // Avoid expensive connection reset
        builder.Multiplexing = poolConfig.GetValue("EnableMultiplexing", true);
        builder.MaxAutoPrepare = poolConfig.GetValue("MaxAutoPrepare", 20);
        builder.AutoPrepareMinUsages = poolConfig.GetValue("AutoPrepareMinUsages", 5);

        // Timeout configurations
        builder.Timeout = poolConfig.GetValue("TimeoutSeconds", 30);
        builder.CommandTimeout = poolConfig.GetValue("CommandTimeoutSeconds", 30);
        builder.CancellationTimeout = poolConfig.GetValue("CancellationTimeoutSeconds", 2);

        // Security and reliability
        builder.TrustServerCertificate = false; // Enforce SSL certificate validation
        builder.SslMode = Enum.Parse<SslMode>(poolConfig.GetValue("SslMode", "Require"));
        builder.KeepAlive = poolConfig.GetValue("KeepAliveSeconds", 30);

        // Government compliance
        builder.ApplicationName = "TerraFusion-OS";
        builder.ClientEncoding = "UTF8";

        var optimizedConnectionString = builder.ToString();

        // Register the optimized connection string
        services.AddSingleton<DatabaseConnectionManager>(provider =>
            new DatabaseConnectionManager(optimizedConnectionString, provider.GetRequiredService<ILogger<DatabaseConnectionManager>>()));

        // Register connection pool monitoring
        services.AddHostedService<ConnectionPoolMonitoringService>();
    }
}

/// <summary>
/// Service for managing database connections with advanced pooling
/// </summary>
public interface IDatabaseConnectionService
{
    Task<IDbConnection> GetConnectionAsync();
    Task<IDbConnection> GetConnectionAsync(string connectionName);
    Task<T> ExecuteWithConnectionAsync<T>(Func<IDbConnection, Task<T>> operation);
    Task ExecuteWithConnectionAsync(Func<IDbConnection, Task> operation);
    Task<ConnectionPoolStats> GetPoolStatsAsync();
}

public class DatabaseConnectionService : IDatabaseConnectionService
{
    private readonly DatabaseConnectionManager _connectionManager;
    private readonly ILogger<DatabaseConnectionService> _logger;

    public DatabaseConnectionService(
        DatabaseConnectionManager connectionManager,
        ILogger<DatabaseConnectionService> logger)
    {
        _connectionManager = connectionManager;
        _logger = logger;
    }

    public async Task<IDbConnection> GetConnectionAsync()
    {
        return await _connectionManager.GetConnectionAsync();
    }

    public async Task<IDbConnection> GetConnectionAsync(string connectionName)
    {
        return await _connectionManager.GetConnectionAsync(connectionName);
    }

    public async Task<T> ExecuteWithConnectionAsync<T>(Func<IDbConnection, Task<T>> operation)
    {
        using var connection = await GetConnectionAsync();
        return await operation(connection);
    }

    public async Task ExecuteWithConnectionAsync(Func<IDbConnection, Task> operation)
    {
        using var connection = await GetConnectionAsync();
        await operation(connection);
    }

    public async Task<ConnectionPoolStats> GetPoolStatsAsync()
    {
        return await _connectionManager.GetPoolStatsAsync();
    }
}

/// <summary>
/// Advanced connection manager with monitoring and optimization
/// </summary>
public class DatabaseConnectionManager
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseConnectionManager> _logger;
    private readonly ConnectionPoolStats _stats;
    private readonly object _statsLock = new();

    public DatabaseConnectionManager(string connectionString, ILogger<DatabaseConnectionManager> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
        _stats = new ConnectionPoolStats();
    }

    public async Task<IDbConnection> GetConnectionAsync(string? connectionName = null)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            
            stopwatch.Stop();
            
            lock (_statsLock)
            {
                _stats.TotalConnectionsCreated++;
                _stats.AverageConnectionTimeMs = 
                    (_stats.AverageConnectionTimeMs + stopwatch.ElapsedMilliseconds) / 2;
                _stats.ActiveConnections++;
            }

            _logger.LogDebug("Database connection opened in {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);

            // Wrap connection to track disposal
            return new TrackedConnection(connection, this);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            
            lock (_statsLock)
            {
                _stats.FailedConnections++;
            }

            _logger.LogError(ex, "Failed to open database connection after {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    public async Task<ConnectionPoolStats> GetPoolStatsAsync()
    {
        lock (_statsLock)
        {
            return new ConnectionPoolStats
            {
                TotalConnectionsCreated = _stats.TotalConnectionsCreated,
                ActiveConnections = _stats.ActiveConnections,
                FailedConnections = _stats.FailedConnections,
                AverageConnectionTimeMs = _stats.AverageConnectionTimeMs,
                LastUpdated = DateTime.UtcNow
            };
        }
    }

    internal void OnConnectionDisposed()
    {
        lock (_statsLock)
        {
            _stats.ActiveConnections = Math.Max(0, _stats.ActiveConnections - 1);
        }
    }
}

/// <summary>
/// Connection wrapper to track usage statistics
/// </summary>
internal class TrackedConnection : IDbConnection
{
    private readonly NpgsqlConnection _connection;
    private readonly DatabaseConnectionManager _manager;
    private bool _disposed;

    public TrackedConnection(NpgsqlConnection connection, DatabaseConnectionManager manager)
    {
        _connection = connection;
        _manager = manager;
    }

    public string ConnectionString 
    { 
        get => _connection.ConnectionString; 
        set => _connection.ConnectionString = value; 
    }

    public int ConnectionTimeout => _connection.ConnectionTimeout;
    public string Database => _connection.Database;
    public ConnectionState State => _connection.State;

    public IDbTransaction BeginTransaction() => _connection.BeginTransaction();
    public IDbTransaction BeginTransaction(IsolationLevel il) => _connection.BeginTransaction(il);
    public void ChangeDatabase(string databaseName) => _connection.ChangeDatabase(databaseName);
    public void Close() => _connection.Close();
    public IDbCommand CreateCommand() => _connection.CreateCommand();
    public void Open() => _connection.Open();

    public void Dispose()
    {
        if (!_disposed)
        {
            _connection?.Dispose();
            _manager.OnConnectionDisposed();
            _disposed = true;
        }
    }
}

/// <summary>
/// Connection pool monitoring interface
/// </summary>
public interface IConnectionPoolMonitor
{
    Task<ConnectionPoolReport> GenerateReportAsync();
    Task LogPoolMetricsAsync();
}

public class ConnectionPoolMonitor : IConnectionPoolMonitor
{
    private readonly IDatabaseConnectionService _connectionService;
    private readonly ILogger<ConnectionPoolMonitor> _logger;

    public ConnectionPoolMonitor(
        IDatabaseConnectionService connectionService,
        ILogger<ConnectionPoolMonitor> logger)
    {
        _connectionService = connectionService;
        _logger = logger;
    }

    public async Task<ConnectionPoolReport> GenerateReportAsync()
    {
        var stats = await _connectionService.GetPoolStatsAsync();
        
        return new ConnectionPoolReport
        {
            Timestamp = DateTime.UtcNow,
            Stats = stats,
            HealthStatus = DetermineHealthStatus(stats),
            Recommendations = GenerateRecommendations(stats)
        };
    }

    public async Task LogPoolMetricsAsync()
    {
        var stats = await _connectionService.GetPoolStatsAsync();
        
        _logger.LogInformation(
            "Connection Pool Metrics: Active={Active}, Total={Total}, Failed={Failed}, AvgTime={AvgTime}ms",
            stats.ActiveConnections,
            stats.TotalConnectionsCreated,
            stats.FailedConnections,
            stats.AverageConnectionTimeMs);
    }

    private string DetermineHealthStatus(ConnectionPoolStats stats)
    {
        if (stats.FailedConnections > stats.TotalConnectionsCreated * 0.1) // >10% failure rate
            return "Unhealthy";
        
        if (stats.AverageConnectionTimeMs > 1000) // >1 second average
            return "Degraded";
        
        if (stats.ActiveConnections > 80) // Near pool limit
            return "Warning";
        
        return "Healthy";
    }

    private List<string> GenerateRecommendations(ConnectionPoolStats stats)
    {
        var recommendations = new List<string>();

        if (stats.FailedConnections > 0)
            recommendations.Add("Investigate connection failures");

        if (stats.AverageConnectionTimeMs > 500)
            recommendations.Add("Consider increasing connection pool size");

        if (stats.ActiveConnections > 70)
            recommendations.Add("Monitor for connection leaks");

        return recommendations;
    }
}

/// <summary>
/// Background service to monitor connection pool performance
/// </summary>
public class ConnectionPoolMonitoringService : BackgroundService
{
    private readonly IConnectionPoolMonitor _monitor;
    private readonly ILogger<ConnectionPoolMonitoringService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

    public ConnectionPoolMonitoringService(
        IConnectionPoolMonitor monitor,
        ILogger<ConnectionPoolMonitoringService> logger)
    {
        _monitor = monitor;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Connection pool monitoring service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await _monitor.LogPoolMetricsAsync();
                await Task.Delay(_interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in connection pool monitoring");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        _logger.LogInformation("Connection pool monitoring service stopped");
    }
}

// Data models
public class ConnectionPoolStats
{
    public int TotalConnectionsCreated { get; set; }
    public int ActiveConnections { get; set; }
    public int FailedConnections { get; set; }
    public double AverageConnectionTimeMs { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class ConnectionPoolReport
{
    public DateTime Timestamp { get; set; }
    public ConnectionPoolStats Stats { get; set; } = null!;
    public string HealthStatus { get; set; } = string.Empty;
    public List<string> Recommendations { get; set; } = new();
}

// Placeholder DbContext for the configuration
public class TerraFusionDbContext : DbContext
{
    public TerraFusionDbContext(DbContextOptions<TerraFusionDbContext> options) : base(options)
    {
    }

    // DbSets would be defined here in the actual implementation
}