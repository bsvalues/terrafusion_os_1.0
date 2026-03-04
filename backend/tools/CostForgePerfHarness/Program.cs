using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.Core.Services;
using TerraFusion.Data;
using CoreDtos = TerraFusion.Core.DTOs;
using ApiProgram = TerraFusion.API.Program;
using AbstractionsAuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using CountyEntity = TerraFusion.Core.Entities.County;
using PropertyEntity = TerraFusion.Core.Entities.Property;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.Tools.CostForgePerfHarness;

internal static class Program
{
    private const string AuthScheme = "PerfTest";
    private const int WarmupRuns = 10;
    private const int MeasuredRuns = 100;
    private const double P95TargetMs = 150.0;

    public static async Task<int> Main()
    {
        var repoRoot = FindRepositoryRoot();
        var apiContentRoot = Path.Combine(repoRoot, "backend", "src", "TerraFusion.API");

        var countyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var propertyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var databaseName = $"costforge-perf-{Guid.NewGuid():N}";
        var requestBody = new
        {
            propertyId,
            countyCode = "BENTON",
            region = "BENTON",
            buildingType = "SFR"
        };

        using var factory = new WebApplicationFactory<ApiProgram>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting(WebHostDefaults.ContentRootKey, apiContentRoot);
                builder.ConfigureTestServices(services =>
                {
                    // Bypass dynamic plugin-permission policies for perf harness runs.
                    services.RemoveAll<IAuthorizationPolicyProvider>();
                    services.AddSingleton<IAuthorizationPolicyProvider>(sp =>
                    {
                        var options = sp.GetRequiredService<IOptions<AuthorizationOptions>>();
                        return new PerfPolicyProvider(options);
                    });

                    services.AddAuthentication(options =>
                    {
                        options.DefaultAuthenticateScheme = AuthScheme;
                        options.DefaultChallengeScheme = AuthScheme;
                        options.DefaultScheme = AuthScheme;
                    }).AddScheme<AuthenticationSchemeOptions, PerfAuthHandler>(AuthScheme, _ => { });

                    services.PostConfigure<AuthorizationOptions>(options =>
                    {
                        var defaultPolicy = new AuthorizationPolicyBuilder(AuthScheme)
                            .RequireAuthenticatedUser()
                            .Build();
                        options.DefaultPolicy = defaultPolicy;
                        options.FallbackPolicy = defaultPolicy;
                    });

                    services.RemoveAll<DbContextOptions<DataDbContext>>();
                    services.RemoveAll<DataDbContext>();
                    services.AddDbContext<DataDbContext>(options =>
                        options.UseInMemoryDatabase(databaseName));

                    services.RemoveAll<ICostForgeService>();
                    services.AddSingleton<ICostForgeService, FastCostForgeService>();
                    services.RemoveAll<ICostForgeAIService>();
                    services.AddSingleton<ICostForgeAIService, FastCostForgeAIService>();

                    services.RemoveAll<AbstractionsAuditLogger>();
                    services.AddSingleton<AbstractionsAuditLogger, NoOpAuditLogger>();
                });
            });

        await SeedAsync(factory.Services, countyId, propertyId);

        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        for (var i = 0; i < WarmupRuns; i++)
        {
            var response = await client.PostAsJsonAsync("/api/costforge/calculate", requestBody);
            if (response.StatusCode != HttpStatusCode.OK)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new InvalidOperationException(
                    $"Warmup request failed with {(int)response.StatusCode} {response.StatusCode}: {body}");
            }
        }

        var latenciesMs = new List<double>(MeasuredRuns);
        var statusCounts = new Dictionary<string, int>(StringComparer.Ordinal);
        var baselineStartedUtc = DateTime.UtcNow;

        for (var i = 0; i < MeasuredRuns; i++)
        {
            var stopwatch = Stopwatch.StartNew();
            using var response = await client.PostAsJsonAsync("/api/costforge/calculate", requestBody);
            stopwatch.Stop();

            latenciesMs.Add(stopwatch.Elapsed.TotalMilliseconds);
            var statusKey = ((int)response.StatusCode).ToString();
            statusCounts[statusKey] = statusCounts.GetValueOrDefault(statusKey) + 1;
        }

        var baselineCompletedUtc = DateTime.UtcNow;
        var ordered = latenciesMs.OrderBy(x => x).ToArray();
        var p50 = Percentile(ordered, 0.50);
        var p95 = Percentile(ordered, 0.95);
        var p99 = Percentile(ordered, 0.99);
        var avg = ordered.Average();
        var min = ordered.FirstOrDefault();
        var max = ordered.LastOrDefault();

        var shortSha = TryGetShortSha(repoRoot);
        var timestamp = baselineCompletedUtc.ToString("yyyyMMddTHHmmssZ");
        var outputDir = Path.Combine(repoRoot, "backend", "artifacts", "perf");
        Directory.CreateDirectory(outputDir);
        var outputPath = Path.Combine(outputDir, $"costforge-calculate-{timestamp}-{shortSha}.json");

        var result = new CostForgePerfBaselineResult(
            BaselineStartedUtc: baselineStartedUtc,
            BaselineCompletedUtc: baselineCompletedUtc,
            Endpoint: "/api/costforge/calculate",
            WarmupRuns: WarmupRuns,
            MeasuredRuns: MeasuredRuns,
            StatusCodeCounts: statusCounts,
            Summary: new PerfSummary(
                MinMs: min,
                MaxMs: max,
                AverageMs: avg,
                P50Ms: p50,
                P95Ms: p95,
                P99Ms: p99,
                P95TargetMs: P95TargetMs,
                P95UnderTarget: p95 < P95TargetMs),
            SamplesMs: latenciesMs.ToArray());

        var jsonOptions = new JsonSerializerOptions { WriteIndented = true };
        await File.WriteAllTextAsync(outputPath, JsonSerializer.Serialize(result, jsonOptions));

        Console.WriteLine($"Artifact: {outputPath}");
        Console.WriteLine($"p50={p50:F2}ms p95={p95:F2}ms p99={p99:F2}ms (target p95<{P95TargetMs:F0}ms)");
        Console.WriteLine($"Status counts: {string.Join(", ", statusCounts.Select(kvp => $"{kvp.Key}={kvp.Value}"))}");
        return 0;
    }

    private static async Task SeedAsync(IServiceProvider services, Guid countyId, Guid propertyId)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DataDbContext>();
        await db.Database.EnsureCreatedAsync();

        if (!await db.Counties.AnyAsync(c => c.Id == countyId))
        {
            db.Counties.Add(new CountyEntity
            {
                Id = countyId,
                Name = "Benton",
                State = "WA",
                FipsCode = "003"
            });
        }

        if (!await db.Properties.AnyAsync(p => p.Id == propertyId))
        {
            db.Properties.Add(new PropertyEntity
            {
                Id = propertyId,
                PropertyId = "PERF-PROP-1",
                ParcelId = "PERF-PARCEL-1",
                ParcelNumber = "PERF-PARCEL-1",
                Address = "123 Benchmark Ave",
                PropertyType = "SFR",
                AssessedValue = 100000m,
                LandValue = 50000m,
                ImprovementValue = 50000m,
                MarketValue = 120000m,
                AssessmentDate = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow,
                TaxYear = DateTime.UtcNow.Year,
                CountyId = countyId
            });
        }

        await db.SaveChangesAsync();
    }

    private static double Percentile(IReadOnlyList<double> sortedValues, double percentile)
    {
        if (sortedValues.Count == 0)
        {
            return 0;
        }

        if (sortedValues.Count == 1)
        {
            return sortedValues[0];
        }

        var rank = percentile * (sortedValues.Count - 1);
        var lower = (int)Math.Floor(rank);
        var upper = (int)Math.Ceiling(rank);
        if (lower == upper)
        {
            return sortedValues[lower];
        }

        var weight = rank - lower;
        return sortedValues[lower] + ((sortedValues[upper] - sortedValues[lower]) * weight);
    }

    private static string FindRepositoryRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            if (Directory.Exists(Path.Combine(current.FullName, ".git")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate repository root (.git directory not found).");
    }

    private static string TryGetShortSha(string workingDirectory)
    {
        try
        {
            var psi = new ProcessStartInfo("git", "rev-parse --short HEAD")
            {
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process is null)
            {
                return "unknown";
            }

            process.WaitForExit(5000);
            if (process.ExitCode != 0)
            {
                return "unknown";
            }

            var output = process.StandardOutput.ReadToEnd().Trim();
            return string.IsNullOrWhiteSpace(output) ? "unknown" : output;
        }
        catch
        {
            return "unknown";
        }
    }
}

internal sealed record CostForgePerfBaselineResult(
    DateTime BaselineStartedUtc,
    DateTime BaselineCompletedUtc,
    string Endpoint,
    int WarmupRuns,
    int MeasuredRuns,
    Dictionary<string, int> StatusCodeCounts,
    PerfSummary Summary,
    double[] SamplesMs);

internal sealed record PerfSummary(
    double MinMs,
    double MaxMs,
    double AverageMs,
    double P50Ms,
    double P95Ms,
    double P99Ms,
    double P95TargetMs,
    bool P95UnderTarget);

internal sealed class PerfPolicyProvider : IAuthorizationPolicyProvider
{
    private readonly DefaultAuthorizationPolicyProvider _fallback;

    public PerfPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        _fallback = new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => _fallback.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => _fallback.GetFallbackPolicyAsync();

    public async Task<AuthorizationPolicy?> GetPolicyAsync(string? policyName)
    {
        if (!string.IsNullOrWhiteSpace(policyName) &&
            policyName.StartsWith(TerraFusion.API.Security.RequiresPermissionAttribute.PolicyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var builder = new AuthorizationPolicyBuilder("PerfTest");
            builder.RequireAuthenticatedUser();
            return builder.Build();
        }

        if (string.IsNullOrWhiteSpace(policyName))
        {
            return await _fallback.GetPolicyAsync(string.Empty);
        }

        return await _fallback.GetPolicyAsync(policyName);
    }
}

internal sealed class PerfAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private static readonly Guid CountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public PerfAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim("sub", "perf-user"),
            new Claim(ClaimTypes.NameIdentifier, "perf-user"),
            new Claim(ClaimTypes.Name, "Performance Harness User"),
            new Claim("countyId", CountyId.ToString()),
            new Claim("countyCode", "BENTON")
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

internal sealed class NoOpAuditLogger : AbstractionsAuditLogger
{
    public SystemTask LogAsync(string action, string details, bool success = true) => SystemTask.CompletedTask;
    public SystemTask LogAsync(string type, object data) => SystemTask.CompletedTask;
    public SystemTask LogSecurityEventAsync(string eventType, string details, string? userId = null) => SystemTask.CompletedTask;
    public SystemTask LogDataAccessAsync(string resourceType, string resourceId, string action, string? userId = null) => SystemTask.CompletedTask;
    public SystemTask LogSystemEventAsync(string eventType, string details) => SystemTask.CompletedTask;
    public SystemTask LogUserActionAsync(string action, string userId, string? details = null) => SystemTask.CompletedTask;
    public SystemTask LogErrorAsync(string action, Exception exception, string? userId = null) => SystemTask.CompletedTask;
    public SystemTask LogApiCallAsync(string method, string path, int statusCode, double duration, string? userId = null) => SystemTask.CompletedTask;
    public SystemTask LogAuthenticationAsync(string userId, bool success, string? reason = null) => SystemTask.CompletedTask;
    public SystemTask LogAuthorizationAsync(string userId, string resource, bool granted) => SystemTask.CompletedTask;
    public SystemTask LogConfigurationChangeAsync(string setting, string oldValue, string newValue, string? userId = null) => SystemTask.CompletedTask;
}

internal sealed class FastCostForgeService : ICostForgeService
{
    public Task<CostAnalysisDto> AnalyzeCostAsync(Guid propertyId)
    {
        return Task.FromResult(new CostAnalysisDto
        {
            PropertyId = propertyId,
            TotalCost = 100000m,
            LandValue = 50000m,
            ImprovementValue = 50000m,
            MarketAdjustment = 0,
            ConfidenceScore = 0.99,
            AnalysisDate = DateTime.UtcNow,
            AnalysisMethod = "PerfHarnessFastPath"
        });
    }

    public Task<CostAnalysisDto> AnalyzeCostAsync(TerraFusion.Core.DTOs.PropertyDto property) => AnalyzeCostAsync(Guid.Empty);
    public Task<CostComparisonDto> CompareCostsAsync(Guid propertyId1, Guid propertyId2) => Task.FromResult(new CostComparisonDto());
    public Task<CostForecastDto> ForecastCostAsync(Guid propertyId, int years) => Task.FromResult(new CostForecastDto());
    public Task<CostBreakdownDto> GetCostBreakdownAsync(Guid propertyId) => Task.FromResult(new CostBreakdownDto());
    public Task<decimal> CalculateAssessmentValueAsync(Guid propertyId) => Task.FromResult(100000m);
    public Task<IEnumerable<CostFactorDto>> GetCostFactorsAsync(string region) => Task.FromResult<IEnumerable<CostFactorDto>>(Array.Empty<CostFactorDto>());
    public Task<CostMatrixDto> GetCostMatrixAsync(string buildingType, string region) => Task.FromResult(new CostMatrixDto());
}

internal sealed class FastCostForgeAIService : ICostForgeAIService
{
    public Task<CoreDtos.CostForgeStatusDto> GetSystemStatusAsync()
    {
        return Task.FromResult(new CoreDtos.CostForgeStatusDto
        {
            AgentsActive = 1,
            CalculationsPerSecond = 1000,
            AccuracyRate = 99.9m,
            SystemStatus = "operational",
            LastCalculation = DateTime.UtcNow,
            TotalCalculations = 1,
            ModuleVersion = "perf-harness",
            StartTime = DateTime.UtcNow,
            Uptime = TimeSpan.Zero
        });
    }

    public Task<CoreDtos.PropertyValuationDto> CalculatePropertyValuationAsync(CoreDtos.PropertyValuationRequestDto request)
    {
        return Task.FromResult(new CoreDtos.PropertyValuationDto
        {
            ParcelId = request.ParcelId,
            EstimatedValue = 100000m,
            LandValue = 50000m,
            ImprovementValue = 50000m,
            ConfidenceScore = 99.0m,
            CalculationDate = DateTime.UtcNow,
            CalculationMethod = "PerfHarnessFastPath",
            FactorsConsidered = new List<string>(),
            ComparableProperties = new Dictionary<string, decimal>()
        });
    }

    public Task<CoreDtos.BatchValuationResultDto> BatchCalculateValuationsAsync(CoreDtos.BatchValuationRequestDto request)
    {
        return Task.FromResult(new CoreDtos.BatchValuationResultDto
        {
            Valuations = new List<CoreDtos.PropertyValuationDto>(),
            TotalProcessed = request.ParcelIds?.Count ?? 0,
            SuccessfulCalculations = request.ParcelIds?.Count ?? 0,
            FailedCalculations = 0,
            ProcessingTime = TimeSpan.Zero,
            Errors = new List<string>()
        });
    }

    public Task<CoreDtos.AIAgentStatusDto> GetAIAgentStatusAsync()
    {
        return Task.FromResult(new CoreDtos.AIAgentStatusDto
        {
            AgentId = Guid.NewGuid(),
            AgentName = "Perf Harness Agent",
            AgentType = "CostForge",
            Status = TerraFusion.Core.Enums.AgentStatus.Active,
            LastHeartbeat = DateTime.UtcNow,
            LastTaskExecution = DateTime.UtcNow,
            TasksCompleted = 1,
            TasksFailed = 0,
            AverageResponseTimeMs = 1.0,
            CpuUsage = 1.0,
            MemoryUsage = 1.0,
            Metrics = new Dictionary<string, object>(),
            ActiveCapabilities = new List<string>(),
            CurrentTask = "benchmark",
            IsHealthy = true,
            CreatedAt = DateTime.UtcNow,
            LastMaintenance = DateTime.UtcNow,
            TotalAgents = 1,
            ActiveAgents = 1,
            IdleAgents = 0,
            BusyAgents = 0,
            AverageUtilization = 1.0,
            Agents = new List<object>()
        });
    }

    public Task ScaleAIAgentsAsync(int targetCount) => Task.CompletedTask;

    public Task<CoreDtos.PerformanceMetricsDto> GetPerformanceMetricsAsync()
    {
        return Task.FromResult(new CoreDtos.PerformanceMetricsDto
        {
            AverageResponseTime = 1m,
            ThroughputPerSecond = 1000m,
            ErrorRate = 0m,
            MemoryUsage = 1m,
            CpuUsage = 1m,
            CustomMetrics = new Dictionary<string, decimal>(),
            HistoricalData = new List<CoreDtos.PerformanceDataPointDto>()
        });
    }

    public Task<CoreDtos.HarrisSyncResultDto> SyncWithHarrisPACSAsync(CoreDtos.HarrisSyncRequestDto request)
    {
        var now = DateTime.UtcNow;
        return Task.FromResult(new CoreDtos.HarrisSyncResultDto
        {
            RecordsProcessed = 0,
            RecordsUpdated = 0,
            RecordsAdded = 0,
            RecordsSkipped = 0,
            SyncStartTime = now,
            SyncEndTime = now,
            Duration = TimeSpan.Zero,
            Success = true,
            Errors = new List<string>(),
            SyncMetadata = new Dictionary<string, object>()
        });
    }

    public Task<CoreDtos.ModuleHealthDto> GetModuleHealthAsync()
    {
        return Task.FromResult(new CoreDtos.ModuleHealthDto
        {
            ModuleId = Guid.NewGuid(),
            ModuleName = "CostForge",
            Status = TerraFusion.Core.Enums.HealthStatus.Healthy,
            CpuUsage = 1.0,
            MemoryUsage = 1,
            Uptime = TimeSpan.Zero,
            Version = "perf-harness",
            ActiveConnections = 1,
            ErrorCount = 0,
            WarningCount = 0,
            LastHealthCheck = DateTime.UtcNow,
            IsResponding = true,
            HealthMetrics = new Dictionary<string, object>()
        });
    }

    public Task StartModuleAsync() => Task.CompletedTask;
    public Task StopModuleAsync() => Task.CompletedTask;

    public Task<CoreDtos.AnalyticsDto> GetAnalyticsAsync(DateTime? startDate, DateTime? endDate)
    {
        return Task.FromResult(new CoreDtos.AnalyticsDto
        {
            StartDate = startDate ?? DateTime.UtcNow,
            EndDate = endDate ?? DateTime.UtcNow,
            TotalCalculations = 0,
            AverageAccuracy = 0,
            TotalValueCalculated = 0,
            CalculationsByType = new Dictionary<string, int>(),
            PerformanceTrends = new Dictionary<string, decimal>(),
            TopPerformingAgents = new List<CoreDtos.TopPerformingAgentDto>()
        });
    }
}
