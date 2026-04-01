/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ELITE ENDPOINT VALIDATION SUITE
 * Championship-Level API Endpoint Testing and Validation
 * Government-Grade Quality Assurance and Performance Monitoring
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using System.Diagnostics;
using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace TerraFusion.API.Services;

/// <summary>
/// Elite endpoint validation service that performs comprehensive testing
/// of all TerraFusion API endpoints with dynamic port detection and
/// detailed response validation for government-grade quality assurance.
/// </summary>
public class EliteEndpointValidationService : BackgroundService
{
    private readonly ILogger<EliteEndpointValidationService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly HttpClient _httpClient;

    private readonly TimeSpan _validationInterval = TimeSpan.FromMinutes(5);
    private readonly TimeSpan _startupDelay = TimeSpan.FromSeconds(10);
    private readonly List<EndpointTestResult> _testHistory = new();

    private string? _detectedApiUrl;
    private DateTime _lastValidation = DateTime.MinValue;
    private int _consecutiveFailures = 0;

    public EliteEndpointValidationService(
        ILogger<EliteEndpointValidationService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _httpClient = new HttpClient()
        {
            Timeout = TimeSpan.FromSeconds(10)
        };
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🎯 Elite Endpoint Validation Service started - Government. Transcended.");

        // Wait for application startup to complete
        await Task.Delay(_startupDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Detect API URL if not already detected
                if (string.IsNullOrEmpty(_detectedApiUrl))
                {
                    _detectedApiUrl = await DetectApiUrlAsync();
                    if (!string.IsNullOrEmpty(_detectedApiUrl))
                    {
                        _logger.LogInformation("🔍 Detected API URL: {ApiUrl}", _detectedApiUrl);
                    }
                }

                // Perform endpoint validation if URL is detected
                if (!string.IsNullOrEmpty(_detectedApiUrl))
                {
                    await PerformEliteEndpointValidationAsync(_detectedApiUrl);
                    _lastValidation = DateTime.UtcNow;
                }

                // Wait for next validation cycle
                await Task.Delay(_validationInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("🛑 Elite Endpoint Validation Service stopping gracefully");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in Elite Endpoint Validation Service");

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
    }

    /// <summary>
    /// Auto-detect the API URL by checking common ports and configurations
    /// </summary>
    private async Task<string?> DetectApiUrlAsync()
    {
        var candidateUrls = new[]
        {
            "http://localhost:5000",
            "http://localhost:5001",
            "http://localhost:8080",
            "https://localhost:5001",
            "https://localhost:7000"
        };

        // Also check for dynamically allocated ports (49152-65535 range)
        var dynamicPorts = new[] { 49685, 61048, 64687 }; // Common dynamic ports from recent runs
        var dynamicUrls = dynamicPorts.Select(port => $"http://localhost:{port}").ToArray();

        var allUrls = candidateUrls.Concat(dynamicUrls).ToArray();

        foreach (var url in allUrls)
        {
            try
            {
                using var response = await _httpClient.GetAsync($"{url}/health", CancellationToken.None);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ API detected at: {Url}", url);
                    return url;
                }
            }
            catch
            {
                // Continue to next URL
            }
        }

        // Try to detect from netstat if available
        return await DetectFromNetstatAsync();
    }

    /// <summary>
    /// Attempt to detect API URL from active network connections
    /// </summary>
    private async Task<string?> DetectFromNetstatAsync()
    {
        try
        {
            var processStartInfo = new ProcessStartInfo
            {
                FileName = "netstat",
                Arguments = "-an",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(processStartInfo);
            if (process != null)
            {
                var output = await process.StandardOutput.ReadToEndAsync();
                await process.WaitForExitAsync();

                // Look for listening ports that might be our API
                var lines = output.Split('\n');
                foreach (var line in lines)
                {
                    if (line.Contains("LISTENING") && line.Contains("127.0.0.1:"))
                    {
                        var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        foreach (var part in parts)
                        {
                            if (part.StartsWith("127.0.0.1:") || part.StartsWith("localhost:"))
                            {
                                var portStr = part.Split(':').LastOrDefault();
                                if (int.TryParse(portStr, out var port) && port > 5000 && port < 65536)
                                {
                                    var testUrl = $"http://localhost:{port}";
                                    try
                                    {
                                        using var response = await _httpClient.GetAsync($"{testUrl}/health", CancellationToken.None);
                                        if (response.IsSuccessStatusCode)
                                        {
                                            return testUrl;
                                        }
                                    }
                                    catch
                                    {
                                        // Continue searching
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug("Could not detect port from netstat: {Error}", ex.Message);
        }

        return null;
    }

    /// <summary>
    /// Perform comprehensive validation of all elite system endpoints
    /// </summary>
    private async Task PerformEliteEndpointValidationAsync(string baseUrl)
    {
        _logger.LogInformation("🏆 Starting Elite Endpoint Validation Suite");

        var validationResults = new List<EndpointTestResult>();
        var stopwatch = Stopwatch.StartNew();

        // Test all critical endpoints.
        // AuthRequired=true: anonymous probes that return 401/403 are classified as
        // ExpectedAuth, not RealFailure — protecting the honest degradation signal.
        var endpoints = new[]
        {
            new EndpointTest("/health", "System Health Check", HttpMethod.Get, Critical: true),
            new EndpointTest("/api/test", "API Test Endpoint", HttpMethod.Get, Critical: true),
            new EndpointTest("/api/modules", "Module Listing", HttpMethod.Get, Critical: false, AuthRequired: true),
            new EndpointTest("/api/database/status", "Database Status", HttpMethod.Get, Critical: false),
            new EndpointTest("/api/swarm/status", "AI Swarm Status", HttpMethod.Get, Critical: false),
            new EndpointTest("/api/swarm/modules", "AI Modules", HttpMethod.Get, Critical: false),
            new EndpointTest("/api/aimodules/status", "AI Modules Status", HttpMethod.Get, Critical: false, AuthRequired: true),
            new EndpointTest("/api/elitesystemreport/mission-completion", "Elite Mission Report", HttpMethod.Get, Critical: false),
            new EndpointTest("/levy/health", "Levy System Health", HttpMethod.Get, Critical: false)
        };

        foreach (var endpoint in endpoints)
        {
            var result = await TestEndpointAsync(baseUrl, endpoint);
            validationResults.Add(result);

            // Log result with outcome-aware icon
            var statusIcon = result.OutcomeKind switch
            {
                EndpointOutcomeKind.Passed => "✅",
                EndpointOutcomeKind.ExpectedAuth => "🔒",
                _ => "❌"
            };
            var responseTimeInfo = result.ResponseTimeMs > 0 ? $" ({result.ResponseTimeMs}ms)" : "";
            _logger.LogInformation("{Status} {Name}: {StatusCode}{ResponseTime}",
                statusIcon, endpoint.Name, result.StatusCode, responseTimeInfo);

            if (result.OutcomeKind == EndpointOutcomeKind.RealFailure && endpoint.Critical)
            {
                _logger.LogWarning("⚠️ Critical endpoint {Endpoint} has a real failure: {Error}",
                    endpoint.Path, result.ErrorMessage);
            }
        }

        stopwatch.Stop();

        // Generate comprehensive report
        await GenerateValidationReportAsync(validationResults, stopwatch.ElapsedMilliseconds);

        // Reset consecutive failures based on real failures only.
        // Expected-auth outcomes on protected endpoints are not degradation signals.
        var realFailureCount = validationResults.Count(r => r.OutcomeKind == EndpointOutcomeKind.RealFailure);
        if (realFailureCount == 0)
        {
            _consecutiveFailures = 0;
        }
        else
        {
            _consecutiveFailures++;
        }
    }

    /// <summary>
    /// Test a specific endpoint and return detailed results
    /// </summary>
    private async Task<EndpointTestResult> TestEndpointAsync(string baseUrl, EndpointTest endpoint)
    {
        var stopwatch = Stopwatch.StartNew();
        var result = new EndpointTestResult
        {
            Endpoint = endpoint.Path,
            Name = endpoint.Name,
            TestTime = DateTime.UtcNow,
            IsCritical = endpoint.Critical
        };

        try
        {
            using var request = new HttpRequestMessage(endpoint.Method, $"{baseUrl}{endpoint.Path}");
            using var response = await _httpClient.SendAsync(request);

            stopwatch.Stop();

            result.StatusCode = response.StatusCode;
            result.ResponseTimeMs = stopwatch.ElapsedMilliseconds;

            // Classify outcome: protected endpoints returning 401/403 when probed
            // anonymously are ExpectedAuth, not RealFailure.
            var isAuthFailure = (response.StatusCode == HttpStatusCode.Unauthorized ||
                                 response.StatusCode == HttpStatusCode.Forbidden)
                                && endpoint.AuthRequired;
            result.Success = response.IsSuccessStatusCode;
            result.OutcomeKind = response.IsSuccessStatusCode ? EndpointOutcomeKind.Passed
                : isAuthFailure ? EndpointOutcomeKind.ExpectedAuth
                : EndpointOutcomeKind.RealFailure;

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                result.ResponseSize = content.Length;

                // Validate JSON response if applicable
                if (response.Content.Headers.ContentType?.MediaType == "application/json")
                {
                    try
                    {
                        using var jsonDoc = JsonDocument.Parse(content);
                        result.ValidJson = true;
                        result.ResponsePreview = GetJsonPreview(jsonDoc);
                    }
                    catch
                    {
                        result.ValidJson = false;
                        result.ResponsePreview = content.Length > 100 ? content[..100] + "..." : content;
                    }
                }
                else
                {
                    result.ResponsePreview = content.Length > 100 ? content[..100] + "..." : content;
                }
            }
            else if (isAuthFailure)
            {
                result.ErrorMessage = $"HTTP {(int)response.StatusCode} {response.ReasonPhrase} (expected — endpoint requires authentication)";
            }
            else
            {
                result.ErrorMessage = $"HTTP {(int)response.StatusCode} {response.ReasonPhrase}";
            }
        }
        catch (TaskCanceledException)
        {
            result.ErrorMessage = "Request timeout";
            result.ResponseTimeMs = stopwatch.ElapsedMilliseconds;
        }
        catch (HttpRequestException ex)
        {
            result.ErrorMessage = $"Connection error: {ex.Message}";
        }
        catch (Exception ex)
        {
            result.ErrorMessage = $"Unexpected error: {ex.Message}";
        }

        return result;
    }

    /// <summary>
    /// Generate a comprehensive validation report
    /// </summary>
    private async Task GenerateValidationReportAsync(List<EndpointTestResult> results, long totalTimeMs)
    {
        await Task.CompletedTask;
        var passedCount = results.Count(r => r.OutcomeKind == EndpointOutcomeKind.Passed);
        var expectedAuthCount = results.Count(r => r.OutcomeKind == EndpointOutcomeKind.ExpectedAuth);
        var realFailureCount = results.Count(r => r.OutcomeKind == EndpointOutcomeKind.RealFailure);
        var totalCount = results.Count;

        var report = new
        {
            Timestamp = DateTime.UtcNow,
            ApiUrl = _detectedApiUrl,
            TotalEndpoints = totalCount,
            Passed = passedCount,
            ExpectedAuth = expectedAuthCount,
            RealFailures = realFailureCount,
            TotalValidationTime = totalTimeMs,
            AverageResponseTime = results.Where(r => r.ResponseTimeMs > 0).DefaultIfEmpty()
                .Average(r => r?.ResponseTimeMs ?? 0),
            Results = results.Select(r => new
            {
                r.Endpoint,
                r.Name,
                Outcome = r.OutcomeKind.ToString(),
                StatusCode = r.StatusCode.ToString(),
                r.ResponseTimeMs,
                r.ResponseSize,
                r.ValidJson,
                r.ErrorMessage,
                Preview = r.ResponsePreview?.Length > 50 ? r.ResponsePreview[..50] + "..." : r.ResponsePreview
            }).ToList()
        };

        var reportJson = JsonSerializer.Serialize(report, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        _logger.LogInformation("📊 Endpoint Validation Report:\n{Report}", reportJson);

        // Store in test history (keep last 10 results)
        _testHistory.Add(new EndpointTestResult
        {
            TestTime = DateTime.UtcNow,
            Success = realFailureCount == 0,
            OutcomeKind = realFailureCount == 0 ? EndpointOutcomeKind.Passed : EndpointOutcomeKind.RealFailure,
            ResponseTimeMs = totalTimeMs,
            ResponsePreview = $"{passedCount} passed, {expectedAuthCount} expected-auth, {realFailureCount} real-failures / {totalCount} total"
        });

        if (_testHistory.Count > 10)
        {
            _testHistory.RemoveAt(0);
        }

        // Verdict is based on real failures only.
        // Expected-auth outcomes (anonymous probes of protected endpoints) are not degradation.
        var criticalRealFailures = results.Count(r => r.IsCritical && r.OutcomeKind == EndpointOutcomeKind.RealFailure);
        if (criticalRealFailures > 0)
        {
            _logger.LogWarning("⚠️ SYSTEM STATUS: DEGRADED — {Count} critical endpoint(s) have real failures", criticalRealFailures);
        }
        else if (realFailureCount > 0)
        {
            _logger.LogWarning("⚠️ SYSTEM STATUS: DEGRADED — {Count} non-critical real failure(s), critical path intact", realFailureCount);
        }
        else if (passedCount == totalCount)
        {
            _logger.LogInformation("🏆 SYSTEM STATUS: TRANSCENDENT — {Passed}/{Total} passed, 0 real failures", passedCount, totalCount);
        }
        else
        {
            _logger.LogInformation("⚡ SYSTEM STATUS: OPERATIONAL — {Passed} passed, {Auth} expected-auth (protected endpoints probed anonymously), 0 real failures",
                passedCount, expectedAuthCount);
        }
    }

    /// <summary>
    /// Get a preview of JSON response content
    /// </summary>
    private string GetJsonPreview(JsonDocument jsonDoc)
    {
        try
        {
            var preview = new Dictionary<string, object>();
            var rootElement = jsonDoc.RootElement;

            if (rootElement.ValueKind == JsonValueKind.Object)
            {
                var propertyCount = 0;
                foreach (var property in rootElement.EnumerateObject())
                {
                    if (propertyCount >= 3) break; // Limit to first 3 properties

                    preview[property.Name] = property.Value.ValueKind switch
                    {
                        JsonValueKind.String => (object)(property.Value.GetString() ?? ""),
                        JsonValueKind.Number => (object)property.Value.GetDecimal(),
                        JsonValueKind.True => (object)true,
                        JsonValueKind.False => (object)false,
                        _ => (object)$"[{property.Value.ValueKind}]"
                    };
                    propertyCount++;
                }
            }

            return JsonSerializer.Serialize(preview);
        }
        catch
        {
            return "[JSON Preview Error]";
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🛑 Elite Endpoint Validation Service stopping...");

        _httpClient?.Dispose();

        await base.StopAsync(stoppingToken);
        _logger.LogInformation("✅ Elite Endpoint Validation Service stopped gracefully");
    }
}

/// <summary>
/// Represents an endpoint test configuration.
/// AuthRequired=true means a 401/403 returned on an anonymous probe is classified
/// as ExpectedAuth rather than a real failure.
/// </summary>
public record EndpointTest(string Path, string Name, HttpMethod Method, bool Critical, bool AuthRequired = false);

/// <summary>
/// Classifies the outcome of an endpoint probe.
/// </summary>
public enum EndpointOutcomeKind
{
    /// <summary>Endpoint returned a 2xx response.</summary>
    Passed,
    /// <summary>Auth-required endpoint returned 401/403 on an anonymous probe — expected, not a fault.</summary>
    ExpectedAuth,
    /// <summary>Unexpected failure: non-auth error, unexpected status code, or connection problem.</summary>
    RealFailure
}

/// <summary>
/// Represents the result of an endpoint test.
/// </summary>
public class EndpointTestResult
{
    public string Endpoint { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime TestTime { get; set; }
    public bool Success { get; set; }
    public EndpointOutcomeKind OutcomeKind { get; set; } = EndpointOutcomeKind.RealFailure;
    public bool IsCritical { get; set; }
    public HttpStatusCode StatusCode { get; set; }
    public long ResponseTimeMs { get; set; }
    public int ResponseSize { get; set; }
    public bool ValidJson { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ResponsePreview { get; set; }
}
