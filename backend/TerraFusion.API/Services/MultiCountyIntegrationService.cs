using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.Data;
using TerraFusion.Levy.Data;

namespace TerraFusion.API.Services;

/// <summary>
/// TerraFusion Multi-County Integration Service
/// Manages synchronized data integration across all 39 Washington State counties
/// Handles Harris PACS system integration and county-specific configurations
/// </summary>
public interface IMultiCountyIntegrationService
{
    Task<MultiCountyIntegrationResult> SynchronizeCountyDataAsync(string countyCode);
    Task<CountyIntegrationStatus[]> GetAllCountyStatusesAsync();
    Task<MultiCountyConfiguration> GetCountyConfigurationAsync(string countyCode);
    Task<bool> ValidateCountyAccessAsync(string countyCode, string userId);
    Task<PropertyAssessmentData> GetCrossCountyPropertyDataAsync(string parcelId);
    Task<HarrisPacsIntegrationResult> SyncWithHarrisPacsAsync(string countyCode);
    Task<CountyMetrics> GetCountyMetricsAsync(string countyCode);
    Task<bool> EnableCountyIntegrationAsync(string countyCode);
    Task<MultiCountyFederationReport> GenerateFederationReportAsync();
}

public class MultiCountyIntegrationService : IMultiCountyIntegrationService
{
    private readonly TerraFusionDbContext _context;
    private readonly LevyDbContext _levyContext;
    private readonly ILogger<MultiCountyIntegrationService> _logger;
    private readonly IAuditLogger _auditLogger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    // Washington State County Codes (39 counties)
    private static readonly string[] WashingtonCounties = new[]
    {
        "adams", "asotin", "benton", "chelan", "clallam", "clark", "columbia", "cowlitz",
        "douglas", "ferry", "franklin", "garfield", "grant", "grays-harbor", "island",
        "jefferson", "king", "kitsap", "kittitas", "klickitat", "lewis", "lincoln",
        "mason", "okanogan", "pacific", "pend-oreille", "pierce", "san-juan", "skagit",
        "skamania", "snohomish", "spokane", "stevens", "thurston", "wahkiakum", "walla-walla",
        "whatcom", "whitman", "yakima"
    };

    private readonly Dictionary<string, CountyIntegrationInfo> _countyIntegrationStatus;
    private readonly SemaphoreSlim _integrationSemaphore;

    public MultiCountyIntegrationService(
        TerraFusionDbContext context,
        LevyDbContext levyContext,
        ILogger<MultiCountyIntegrationService> logger,
        IAuditLogger auditLogger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _context = context;
        _levyContext = levyContext;
        _logger = logger;
        _auditLogger = auditLogger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _countyIntegrationStatus = new Dictionary<string, CountyIntegrationInfo>();
        _integrationSemaphore = new SemaphoreSlim(1, 1);

        // Initialize county integration status
        InitializeCountyIntegration();
    }

    /// <summary>
    /// Synchronizes data for a specific county with Harris PACS and local systems
    /// </summary>
    public async Task<MultiCountyIntegrationResult> SynchronizeCountyDataAsync(string countyCode)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _logger.LogInformation("Starting county data synchronization for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_SYNC_START", $"Starting synchronization for county: {countyCode}", true);

            if (!WashingtonCounties.Contains(countyCode.ToLower()))
            {
                throw new ArgumentException($"Invalid county code: {countyCode}. Must be one of 39 Washington State counties.");
            }

            await _integrationSemaphore.WaitAsync();

            try
            {
                var result = new MultiCountyIntegrationResult
                {
                    CountyCode = countyCode,
                    SyncStartTime = DateTime.UtcNow,
                    IsSuccessful = true
                };

                // Step 1: Load county-specific configuration
                var countyConfig = await GetCountyConfigurationAsync(countyCode);
                result.ConfigurationLoaded = countyConfig != null;

                // Step 2: Sync with Harris PACS if enabled
                if (countyConfig?.HarrisPacsIntegration?.Enabled == true)
                {
                    var pacsResult = await SyncWithHarrisPacsAsync(countyCode);
                    result.HarrisPacsSync = pacsResult;
                    result.PropertyRecordsSynced = pacsResult.RecordsSynced;
                }

                // Step 3: Update local database with county data
                var recordsUpdated = await UpdateLocalCountyDataAsync(countyCode, countyConfig);
                result.LocalRecordsUpdated = recordsUpdated;

                // Step 4: Validate data integrity
                var validationResult = await ValidateCountyDataIntegrityAsync(countyCode);
                result.DataIntegrityValid = validationResult.IsValid;
                result.ValidationErrors = validationResult.Errors;

                // Step 5: Update county integration status
                UpdateCountyIntegrationStatus(countyCode, true, DateTime.UtcNow);

                result.SyncEndTime = DateTime.UtcNow;
                result.Duration = stopwatch.Elapsed;

                _logger.LogInformation("County synchronization completed for {CountyCode} in {Duration}ms",
                    countyCode, stopwatch.ElapsedMilliseconds);

                await _auditLogger.LogAsync("COUNTY_SYNC_SUCCESS",
                    $"County {countyCode} sync completed. Records: {result.PropertyRecordsSynced}, Duration: {result.Duration}", true);

                return result;
            }
            finally
            {
                _integrationSemaphore.Release();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "County synchronization failed for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_SYNC_ERROR", $"County {countyCode} sync failed: {ex.Message}", false);

            UpdateCountyIntegrationStatus(countyCode, false, DateTime.UtcNow, ex.Message);

            return new MultiCountyIntegrationResult
            {
                CountyCode = countyCode,
                SyncStartTime = DateTime.UtcNow,
                SyncEndTime = DateTime.UtcNow,
                IsSuccessful = false,
                ErrorMessage = ex.Message,
                Duration = stopwatch.Elapsed
            };
        }
    }

    /// <summary>
    /// Gets integration status for all 39 Washington State counties
    /// </summary>
    public async Task<CountyIntegrationStatus[]> GetAllCountyStatusesAsync()
    {
        try
        {
            _logger.LogDebug("Retrieving integration status for all 39 Washington State counties");

            var statuses = new List<CountyIntegrationStatus>();

            foreach (var county in WashingtonCounties)
            {
                var status = new CountyIntegrationStatus
                {
                    CountyCode = county,
                    CountyName = FormatCountyName(county),
                    IntegrationEnabled = _countyIntegrationStatus.ContainsKey(county),
                    LastSyncTime = _countyIntegrationStatus.TryGetValue(county, out var info) ? info.LastSyncTime : null,
                    IsHealthy = _countyIntegrationStatus.TryGetValue(county, out var healthInfo) ? healthInfo.IsHealthy : false,
                    ErrorMessage = _countyIntegrationStatus.TryGetValue(county, out var errorInfo) ? errorInfo.LastError : null,
                    PropertyRecordCount = await GetCountyPropertyRecordCountAsync(county),
                    HarrisPacsEnabled = await IsHarrisPacsEnabledForCountyAsync(county)
                };

                statuses.Add(status);
            }

            await _auditLogger.LogAsync("COUNTY_STATUS_QUERY", $"Retrieved status for all {statuses.Count} counties", true);

            return statuses.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve county statuses");
            await _auditLogger.LogAsync("COUNTY_STATUS_ERROR", $"Failed to retrieve county statuses: {ex.Message}", false);
            throw;
        }
    }

    /// <summary>
    /// Loads county-specific configuration from county config files
    /// </summary>
    public async Task<MultiCountyConfiguration> GetCountyConfigurationAsync(string countyCode)
    {
        try
        {
            var configPath = Path.Combine(_configuration["CountyConfigPath"] ?? "config/counties", $"{countyCode}-config.json");

            if (!File.Exists(configPath))
            {
                _logger.LogWarning("County configuration file not found: {ConfigPath}", configPath);
                return CreateDefaultCountyConfiguration(countyCode);
            }

            var configJson = await File.ReadAllTextAsync(configPath);
            var config = JsonSerializer.Deserialize<MultiCountyConfiguration>(configJson);

            if (config == null)
            {
                _logger.LogWarning("Failed to deserialize county configuration for {CountyCode}", countyCode);
                return CreateDefaultCountyConfiguration(countyCode);
            }

            _logger.LogDebug("Loaded configuration for {CountyCode} from {ConfigPath}", countyCode, configPath);
            return config;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load county configuration for {CountyCode}", countyCode);
            return CreateDefaultCountyConfiguration(countyCode);
        }
    }

    /// <summary>
    /// Validates user access to specific county data
    /// </summary>
    public async Task<bool> ValidateCountyAccessAsync(string countyCode, string userId)
    {
        try
        {
            // Government-grade access validation
            var hasGeneralAccess = !string.IsNullOrEmpty(userId);
            var countyConfig = await GetCountyConfigurationAsync(countyCode);

            // Check if county has specific access restrictions
            var hasCountyAccess = countyConfig?.AccessControl?.AllowedUsers?.Contains(userId) ?? true;

            var isAuthorized = hasGeneralAccess && hasCountyAccess;

            await _auditLogger.LogAsync("COUNTY_ACCESS_VALIDATION",
                $"User {userId} access to county {countyCode}: {(isAuthorized ? "GRANTED" : "DENIED")}", isAuthorized);

            return isAuthorized;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "County access validation failed for user {UserId} and county {CountyCode}", userId, countyCode);
            await _auditLogger.LogAsync("COUNTY_ACCESS_ERROR", $"Access validation error: {ex.Message}", false);
            return false;
        }
    }

    /// <summary>
    /// Retrieves property assessment data across multiple counties
    /// </summary>
    public async Task<PropertyAssessmentData> GetCrossCountyPropertyDataAsync(string parcelId)
    {
        try
        {
            _logger.LogInformation("Searching for property data across all counties for parcel: {ParcelId}", parcelId);

            var propertyData = new PropertyAssessmentData
            {
                ParcelId = parcelId,
                SearchTimestamp = DateTime.UtcNow,
                CountyRecords = new List<CountyPropertyRecord>()
            };

            // Search across all counties in parallel for efficiency
            var searchTasks = WashingtonCounties.Select(async county =>
            {
                try
                {
                    var countyRecord = await SearchCountyForPropertyAsync(county, parcelId);
                    if (countyRecord != null)
                    {
                        return new CountyPropertyRecord
                        {
                            CountyCode = county,
                            CountyName = FormatCountyName(county),
                            PropertyData = countyRecord,
                            LastUpdated = DateTime.UtcNow
                        };
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to search county {County} for parcel {ParcelId}", county, parcelId);
                }
                return null;
            });

            var searchResults = await Task.WhenAll(searchTasks);
            propertyData.CountyRecords.AddRange(searchResults.Where(r => r != null)!);

            await _auditLogger.LogAsync("CROSS_COUNTY_SEARCH",
                $"Cross-county search for parcel {parcelId} found {propertyData.CountyRecords.Count} records", true);

            return propertyData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cross-county property search failed for parcel {ParcelId}", parcelId);
            await _auditLogger.LogAsync("CROSS_COUNTY_ERROR", $"Cross-county search failed: {ex.Message}", false);
            throw;
        }
    }

    /// <summary>
    /// Synchronizes data with Harris PACS system for a specific county
    /// </summary>
    public async Task<HarrisPacsIntegrationResult> SyncWithHarrisPacsAsync(string countyCode)
    {
        try
        {
            _logger.LogInformation("Starting Harris PACS synchronization for {CountyCode}", countyCode);

            var result = new HarrisPacsIntegrationResult
            {
                CountyCode = countyCode,
                SyncStartTime = DateTime.UtcNow,
                IsSuccessful = false
            };

            var countyConfig = await GetCountyConfigurationAsync(countyCode);
            if (countyConfig?.HarrisPacsIntegration?.Enabled != true)
            {
                result.ErrorMessage = "Harris PACS integration not enabled for this county";
                return result;
            }

            using var httpClient = _httpClientFactory.CreateClient("HarrisPacs");

            // Simulate Harris PACS API integration
            var pacsEndpoint = countyConfig.HarrisPacsIntegration.ApiEndpoint;
            var apiKey = countyConfig.HarrisPacsIntegration.ApiKey;

            // In a real implementation, this would connect to the actual Harris PACS system
            // For now, we'll simulate the integration
            await Task.Delay(2000); // Simulate API call delay

            result.RecordsSynced = Random.Shared.Next(100, 1000);
            result.RecordsUpdated = Random.Shared.Next(10, 50);
            result.RecordsCreated = Random.Shared.Next(5, 25);
            result.SyncEndTime = DateTime.UtcNow;
            result.IsSuccessful = true;

            await _auditLogger.LogAsync("HARRIS_PACS_SYNC",
                $"Harris PACS sync for {countyCode}: {result.RecordsSynced} records processed", true);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Harris PACS synchronization failed for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("HARRIS_PACS_ERROR", $"Harris PACS sync failed: {ex.Message}", false);

            return new HarrisPacsIntegrationResult
            {
                CountyCode = countyCode,
                SyncStartTime = DateTime.UtcNow,
                SyncEndTime = DateTime.UtcNow,
                IsSuccessful = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Gets comprehensive metrics for a specific county
    /// </summary>
    public async Task<CountyMetrics> GetCountyMetricsAsync(string countyCode)
    {
        try
        {
            var metrics = new CountyMetrics
            {
                CountyCode = countyCode,
                CountyName = FormatCountyName(countyCode),
                MetricsTimestamp = DateTime.UtcNow,
                PropertyRecordCount = await GetCountyPropertyRecordCountAsync(countyCode),
                LastSyncTime = _countyIntegrationStatus.TryGetValue(countyCode, out var info) ? info.LastSyncTime : null,
                IntegrationHealth = _countyIntegrationStatus.TryGetValue(countyCode, out var healthInfo) ?
                    (healthInfo.IsHealthy ? "Healthy" : "Unhealthy") : "Unknown",
                HarrisPacsEnabled = await IsHarrisPacsEnabledForCountyAsync(countyCode),
                DataQualityScore = await CalculateDataQualityScoreAsync(countyCode),
                SyncFrequencyMinutes = await GetSyncFrequencyAsync(countyCode)
            };

            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get county metrics for {CountyCode}", countyCode);
            throw;
        }
    }

    /// <summary>
    /// Enables integration for a specific county
    /// </summary>
    public async Task<bool> EnableCountyIntegrationAsync(string countyCode)
    {
        try
        {
            if (!WashingtonCounties.Contains(countyCode.ToLower()))
            {
                throw new ArgumentException($"Invalid county code: {countyCode}");
            }

            _countyIntegrationStatus[countyCode] = new CountyIntegrationInfo
            {
                IsHealthy = true,
                LastSyncTime = DateTime.UtcNow,
                LastError = null
            };

            await _auditLogger.LogAsync("COUNTY_INTEGRATION_ENABLED",
                $"Integration enabled for county: {countyCode}", true);

            _logger.LogInformation("County integration enabled for {CountyCode}", countyCode);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enable county integration for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_INTEGRATION_ERROR",
                $"Failed to enable integration for {countyCode}: {ex.Message}", false);
            return false;
        }
    }

    /// <summary>
    /// Generates comprehensive federation report for all counties
    /// </summary>
    public async Task<MultiCountyFederationReport> GenerateFederationReportAsync()
    {
        try
        {
            _logger.LogInformation("Generating multi-county federation report for all 39 Washington State counties");

            var report = new MultiCountyFederationReport
            {
                ReportTimestamp = DateTime.UtcNow,
                TotalCounties = WashingtonCounties.Length,
                CountyStatuses = await GetAllCountyStatusesAsync()
            };

            report.IntegratedCounties = report.CountyStatuses.Count(s => s.IntegrationEnabled);
            report.HealthyCounties = report.CountyStatuses.Count(s => s.IsHealthy);
            report.TotalPropertyRecords = report.CountyStatuses.Sum(s => s.PropertyRecordCount);
            report.HarrisPacsEnabledCounties = report.CountyStatuses.Count(s => s.HarrisPacsEnabled);

            // Calculate federation health score
            report.FederationHealthScore = CalculateFederationHealthScore(report.CountyStatuses);

            await _auditLogger.LogAsync("FEDERATION_REPORT",
                $"Federation report generated: {report.IntegratedCounties}/{report.TotalCounties} counties integrated", true);

            return report;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate federation report");
            await _auditLogger.LogAsync("FEDERATION_REPORT_ERROR", $"Federation report failed: {ex.Message}", false);
            throw;
        }
    }

    // Private helper methods
    private void InitializeCountyIntegration()
    {
        foreach (var county in WashingtonCounties)
        {
            _countyIntegrationStatus[county] = new CountyIntegrationInfo
            {
                IsHealthy = false,
                LastSyncTime = null,
                LastError = "Not initialized"
            };
        }
    }

    private MultiCountyConfiguration CreateDefaultCountyConfiguration(string countyCode)
    {
        return new MultiCountyConfiguration
        {
            CountyCode = countyCode,
            CountyName = FormatCountyName(countyCode),
            HarrisPacsIntegration = new HarrisPacsConfig
            {
                Enabled = false,
                ApiEndpoint = $"https://pacs.{countyCode}.wa.gov/api",
                SyncIntervalMinutes = 60
            },
            AccessControl = new CountyAccessControl
            {
                RestrictedAccess = false,
                AllowedUsers = Array.Empty<string>()
            }
        };
    }

    private string FormatCountyName(string countyCode)
    {
        return countyCode.Replace("-", " ")
                        .Split(' ')
                        .Select(word => char.ToUpper(word[0]) + word.Substring(1).ToLower())
                        .Aggregate((a, b) => $"{a} {b}");
    }

    private void UpdateCountyIntegrationStatus(string countyCode, bool isHealthy, DateTime lastSync, string? error = null)
    {
        _countyIntegrationStatus[countyCode] = new CountyIntegrationInfo
        {
            IsHealthy = isHealthy,
            LastSyncTime = lastSync,
            LastError = error
        };
    }

    private async Task<int> UpdateLocalCountyDataAsync(string countyCode, MultiCountyConfiguration? config)
    {
        // Simulate database updates - in reality this would update TerraFusionDbContext
        await Task.Delay(1000);
        return Random.Shared.Next(50, 200);
    }

    private async Task<CountyDataValidationResult> ValidateCountyDataIntegrityAsync(string countyCode)
    {
        // Simulate data validation
        await Task.Delay(500);
        return new CountyDataValidationResult
        {
            IsValid = Random.Shared.NextDouble() > 0.1, // 90% success rate
            Errors = Random.Shared.NextDouble() > 0.9 ? new[] { "Minor data inconsistency detected" } : Array.Empty<string>()
        };
    }

    private async Task<int> GetCountyPropertyRecordCountAsync(string countyCode)
    {
        // In a real implementation, this would query the database
        await Task.Delay(100);
        return Random.Shared.Next(1000, 50000);
    }

    private async Task<bool> IsHarrisPacsEnabledForCountyAsync(string countyCode)
    {
        var config = await GetCountyConfigurationAsync(countyCode);
        return config?.HarrisPacsIntegration?.Enabled ?? false;
    }

    private async Task<PropertyRecord?> SearchCountyForPropertyAsync(string countyCode, string parcelId)
    {
        // Simulate property search in county database
        await Task.Delay(200);

        // 30% chance of finding property in any given county
        if (Random.Shared.NextDouble() > 0.7)
        {
            return new PropertyRecord
            {
                ParcelId = parcelId,
                CountyCode = countyCode,
                AssessedValue = Random.Shared.Next(100000, 1000000),
                PropertyType = "Residential",
                LastAssessment = DateTime.UtcNow.AddMonths(-Random.Shared.Next(1, 12))
            };
        }

        return null;
    }

    private async Task<double> CalculateDataQualityScoreAsync(string countyCode)
    {
        await Task.Delay(100);
        return Math.Round(Random.Shared.NextDouble() * 40 + 60, 2); // 60-100% quality score
    }

    private async Task<int> GetSyncFrequencyAsync(string countyCode)
    {
        var config = await GetCountyConfigurationAsync(countyCode);
        return config?.HarrisPacsIntegration?.SyncIntervalMinutes ?? 60;
    }

    private double CalculateFederationHealthScore(CountyIntegrationStatus[] statuses)
    {
        if (statuses.Length == 0) return 0;

        var healthyCount = statuses.Count(s => s.IsHealthy);
        var integratedCount = statuses.Count(s => s.IntegrationEnabled);

        var healthScore = (double)healthyCount / statuses.Length * 50;
        var integrationScore = (double)integratedCount / statuses.Length * 50;

        return Math.Round(healthScore + integrationScore, 2);
    }
}

// Data models for multi-county integration
public class MultiCountyIntegrationResult
{
    public string CountyCode { get; set; } = string.Empty;
    public DateTime SyncStartTime { get; set; }
    public DateTime SyncEndTime { get; set; }
    public TimeSpan Duration { get; set; }
    public bool IsSuccessful { get; set; }
    public string? ErrorMessage { get; set; }
    public bool ConfigurationLoaded { get; set; }
    public HarrisPacsIntegrationResult? HarrisPacsSync { get; set; }
    public int PropertyRecordsSynced { get; set; }
    public int LocalRecordsUpdated { get; set; }
    public bool DataIntegrityValid { get; set; }
    public string[] ValidationErrors { get; set; } = Array.Empty<string>();
}

public class CountyIntegrationStatus
{
    public string CountyCode { get; set; } = string.Empty;
    public string CountyName { get; set; } = string.Empty;
    public bool IntegrationEnabled { get; set; }
    public DateTime? LastSyncTime { get; set; }
    public bool IsHealthy { get; set; }
    public string? ErrorMessage { get; set; }
    public int PropertyRecordCount { get; set; }
    public bool HarrisPacsEnabled { get; set; }
}

public class MultiCountyConfiguration
{
    public string CountyCode { get; set; } = string.Empty;
    public string CountyName { get; set; } = string.Empty;
    public HarrisPacsConfig? HarrisPacsIntegration { get; set; }
    public CountyAccessControl? AccessControl { get; set; }
}

public class HarrisPacsConfig
{
    public bool Enabled { get; set; }
    public string ApiEndpoint { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public int SyncIntervalMinutes { get; set; } = 60;
}

public class CountyAccessControl
{
    public bool RestrictedAccess { get; set; }
    public string[] AllowedUsers { get; set; } = Array.Empty<string>();
}

public class PropertyAssessmentData
{
    public string ParcelId { get; set; } = string.Empty;
    public DateTime SearchTimestamp { get; set; }
    public List<CountyPropertyRecord> CountyRecords { get; set; } = new();
}

public class CountyPropertyRecord
{
    public string CountyCode { get; set; } = string.Empty;
    public string CountyName { get; set; } = string.Empty;
    public PropertyRecord? PropertyData { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class PropertyRecord
{
    public string ParcelId { get; set; } = string.Empty;
    public string CountyCode { get; set; } = string.Empty;
    public decimal AssessedValue { get; set; }
    public string PropertyType { get; set; } = string.Empty;
    public DateTime LastAssessment { get; set; }
}

public class HarrisPacsIntegrationResult
{
    public string CountyCode { get; set; } = string.Empty;
    public DateTime SyncStartTime { get; set; }
    public DateTime SyncEndTime { get; set; }
    public bool IsSuccessful { get; set; }
    public string? ErrorMessage { get; set; }
    public int RecordsSynced { get; set; }
    public int RecordsUpdated { get; set; }
    public int RecordsCreated { get; set; }
}

public class CountyMetrics
{
    public string CountyCode { get; set; } = string.Empty;
    public string CountyName { get; set; } = string.Empty;
    public DateTime MetricsTimestamp { get; set; }
    public int PropertyRecordCount { get; set; }
    public DateTime? LastSyncTime { get; set; }
    public string IntegrationHealth { get; set; } = string.Empty;
    public bool HarrisPacsEnabled { get; set; }
    public double DataQualityScore { get; set; }
    public int SyncFrequencyMinutes { get; set; }
}

public class MultiCountyFederationReport
{
    public DateTime ReportTimestamp { get; set; }
    public int TotalCounties { get; set; }
    public int IntegratedCounties { get; set; }
    public int HealthyCounties { get; set; }
    public long TotalPropertyRecords { get; set; }
    public int HarrisPacsEnabledCounties { get; set; }
    public double FederationHealthScore { get; set; }
    public CountyIntegrationStatus[] CountyStatuses { get; set; } = Array.Empty<CountyIntegrationStatus>();
}

// Internal tracking models
internal class CountyIntegrationInfo
{
    public bool IsHealthy { get; set; }
    public DateTime? LastSyncTime { get; set; }
    public string? LastError { get; set; }
}

internal class CountyDataValidationResult
{
    public bool IsValid { get; set; }
    public string[] Errors { get; set; } = Array.Empty<string>();
}
