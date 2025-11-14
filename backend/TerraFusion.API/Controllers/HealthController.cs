using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly TerraFusionContext _context;
    private readonly IAIEngineService _aiEngineService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        TerraFusionContext context,
        IAIEngineService aiEngineService,
        ILogger<HealthController> logger)
    {
        _context = context;
        _aiEngineService = aiEngineService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        var healthChecks = new List<HealthCheckResult>();

        // Database health check
        var dbHealth = await CheckDatabaseHealthAsync();
        healthChecks.Add(dbHealth);

        // AI Engine health check
        var aiHealth = await CheckAIEngineHealthAsync();
        healthChecks.Add(aiHealth);

        // Memory health check
        var memoryHealth = CheckMemoryHealth();
        healthChecks.Add(memoryHealth);

        // Disk space health check
        var diskHealth = CheckDiskHealth();
        healthChecks.Add(diskHealth);

        var overallStatus = healthChecks.All(h => h.Status == "Healthy") ? "Healthy" : "Degraded";
        if (healthChecks.Any(h => h.Status == "Unhealthy"))
            overallStatus = "Unhealthy";

        var response = new
        {
            Status = overallStatus,
            Timestamp = DateTime.UtcNow,
            Checks = healthChecks,
            Version = "1.0.0",
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        };

        var statusCode = overallStatus switch
        {
            "Healthy" => 200,
            "Degraded" => 200,
            "Unhealthy" => 503,
            _ => 200
        };

        return StatusCode(statusCode, response);
    }

    [HttpGet("detailed")]
    public async Task<IActionResult> GetDetailedHealth()
    {
        var startTime = DateTime.UtcNow;

        var health = new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            ResponseTime = $"{(DateTime.UtcNow - startTime).TotalMilliseconds:F2}ms",
            System = new
            {
                MachineName = Environment.MachineName,
                OSVersion = Environment.OSVersion.ToString(),
                ProcessorCount = Environment.ProcessorCount,
                WorkingSet = GC.GetTotalMemory(false),
                GCCollections = new
                {
                    Gen0 = GC.CollectionCount(0),
                    Gen1 = GC.CollectionCount(1),
                    Gen2 = GC.CollectionCount(2)
                }
            },
            Database = await GetDatabaseMetricsAsync(),
            AIEngine = await GetAIEngineMetricsAsync(),
            Performance = GetPerformanceMetrics()
        };

        return Ok(health);
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        var metrics = new
        {
            Timestamp = DateTime.UtcNow,
            Database = await GetDatabaseMetricsAsync(),
            AIEngine = await GetAIEngineMetricsAsync(),
            System = GetSystemMetrics(),
            Application = GetApplicationMetrics()
        };

        return Ok(metrics);
    }

    private async Task<HealthCheckResult> CheckDatabaseHealthAsync()
    {
        try
        {
            var startTime = DateTime.UtcNow;
            var canConnect = await _context.Database.CanConnectAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            if (!canConnect)
            {
                return new HealthCheckResult
                {
                    Name = "Database",
                    Status = "Unhealthy",
                    Description = "Cannot connect to database",
                    ResponseTime = responseTime
                };
            }

            var propertyCount = await _context.Properties.CountAsync();

            return new HealthCheckResult
            {
                Name = "Database",
                Status = "Healthy",
                Description = $"Connected successfully. {propertyCount} properties in database",
                ResponseTime = responseTime,
                Data = new Dictionary<string, object>
                {
                    ["PropertyCount"] = propertyCount,
                    ["ConnectionString"] = _context.Database.GetConnectionString()?.Split(';')[0] ?? "Unknown"
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return new HealthCheckResult
            {
                Name = "Database",
                Status = "Unhealthy",
                Description = $"Database error: {ex.Message}",
                ResponseTime = 0
            };
        }
    }

    private async Task<HealthCheckResult> CheckAIEngineHealthAsync()
    {
        try
        {
            var startTime = DateTime.UtcNow;
            var engineStatus = await _aiEngineService.GetEngineStatusAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            var status = engineStatus.Status == "Active" ? "Healthy" : "Degraded";

            return new HealthCheckResult
            {
                Name = "AI Engine",
                Status = status,
                Description = $"AI Engine is {engineStatus.Status}. {engineStatus.ActiveModels}/{engineStatus.TotalModels} models active",
                ResponseTime = responseTime,
                Data = new Dictionary<string, object>
                {
                    ["ActiveModels"] = engineStatus.ActiveModels,
                    ["TotalModels"] = engineStatus.TotalModels,
                    ["CpuUsage"] = engineStatus.CpuUsage,
                    ["MemoryUsage"] = engineStatus.MemoryUsage
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI Engine health check failed");
            return new HealthCheckResult
            {
                Name = "AI Engine",
                Status = "Unhealthy",
                Description = $"AI Engine error: {ex.Message}",
                ResponseTime = 0
            };
        }
    }

    private static HealthCheckResult CheckMemoryHealth()
    {
        var memoryUsed = GC.GetTotalMemory(false);
        var memoryUsedMB = memoryUsed / (1024 * 1024);

        var status = memoryUsedMB switch
        {
            < 500 => "Healthy",
            < 1000 => "Degraded",
            _ => "Unhealthy"
        };

        return new HealthCheckResult
        {
            Name = "Memory",
            Status = status,
            Description = $"Memory usage: {memoryUsedMB:F2} MB",
            ResponseTime = 0,
            Data = new Dictionary<string, object>
            {
                ["MemoryUsedBytes"] = memoryUsed,
                ["MemoryUsedMB"] = memoryUsedMB
            }
        };
    }

    private static HealthCheckResult CheckDiskHealth()
    {
        try
        {
            var drive = new DriveInfo(Path.GetPathRoot(Environment.CurrentDirectory) ?? "C:");
            var freeSpaceGB = drive.AvailableFreeSpace / (1024 * 1024 * 1024);
            var totalSpaceGB = drive.TotalSize / (1024 * 1024 * 1024);
            var usedPercentage = ((double)(drive.TotalSize - drive.AvailableFreeSpace) / drive.TotalSize) * 100;

            var status = usedPercentage switch
            {
                < 80 => "Healthy",
                < 90 => "Degraded",
                _ => "Unhealthy"
            };

            return new HealthCheckResult
            {
                Name = "Disk Space",
                Status = status,
                Description = $"Disk usage: {usedPercentage:F1}% ({freeSpaceGB:F1} GB free of {totalSpaceGB:F1} GB)",
                ResponseTime = 0,
                Data = new Dictionary<string, object>
                {
                    ["FreeSpaceGB"] = freeSpaceGB,
                    ["TotalSpaceGB"] = totalSpaceGB,
                    ["UsedPercentage"] = usedPercentage
                }
            };
        }
        catch (Exception ex)
        {
            return new HealthCheckResult
            {
                Name = "Disk Space",
                Status = "Unhealthy",
                Description = $"Disk check error: {ex.Message}",
                ResponseTime = 0
            };
        }
    }

    private async Task<object> GetDatabaseMetricsAsync()
    {
        try
        {
            var propertyCount = await _context.Properties.CountAsync();
            var modelCount = await _context.AIModels.CountAsync();
            var activeModels = await _context.AIModels.CountAsync(m => m.Status == Core.Enums.AIModelStatus.Active);

            return new
            {
                PropertyCount = propertyCount,
                ModelCount = modelCount,
                ActiveModels = activeModels,
                LastUpdate = DateTime.UtcNow
            };
        }
        catch
        {
            return new { Error = "Unable to retrieve database metrics" };
        }
    }

    private async Task<object> GetAIEngineMetricsAsync()
    {
        try
        {
            var metrics = await _aiEngineService.GetEngineMetricsAsync();
            return new
            {
                TotalInferences = metrics.TotalInferences,
                InferencesPerSecond = metrics.InferencesPerSecond,
                AverageInferenceTime = metrics.AverageInferenceTime,
                AverageAccuracy = metrics.AverageAccuracy,
                SystemLoad = metrics.SystemLoad
            };
        }
        catch
        {
            return new { Error = "Unable to retrieve AI engine metrics" };
        }
    }

    private static object GetSystemMetrics()
    {
        return new
        {
            ProcessorCount = Environment.ProcessorCount,
            WorkingSet = Environment.WorkingSet,
            PagedMemorySize = Environment.WorkingSet,
            Uptime = Environment.TickCount64 / 1000 // seconds
        };
    }

    private static object GetPerformanceMetrics()
    {
        return new
        {
            GCMemory = GC.GetTotalMemory(false),
            GCCollections = new
            {
                Gen0 = GC.CollectionCount(0),
                Gen1 = GC.CollectionCount(1),
                Gen2 = GC.CollectionCount(2)
            },
            ThreadCount = System.Diagnostics.Process.GetCurrentProcess().Threads.Count
        };
    }

    private static object GetApplicationMetrics()
    {
        var process = System.Diagnostics.Process.GetCurrentProcess();
        return new
        {
            ProcessId = process.Id,
            StartTime = process.StartTime,
            TotalProcessorTime = process.TotalProcessorTime,
            WorkingSet = process.WorkingSet64,
            PagedMemorySize = process.PagedMemorySize64,
            ThreadCount = process.Threads.Count
        };
    }
}

public class HealthCheckResult
{
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double ResponseTime { get; set; }
    public Dictionary<string, object> Data { get; set; } = new();
}
