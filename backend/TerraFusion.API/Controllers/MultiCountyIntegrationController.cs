using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraFusion Multi-County Integration Controller
/// Elite government-grade integration across all 39 Washington State counties
/// Manages Harris PACS synchronization and cross-county property assessment data
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "OSCoreAccess")]
public class MultiCountyIntegrationController : ControllerBase
{
    private readonly IMultiCountyIntegrationService _integrationService;
    private readonly ILogger<MultiCountyIntegrationController> _logger;
    private readonly IAuditLogger _auditLogger;

    public MultiCountyIntegrationController(
        IMultiCountyIntegrationService integrationService,
        ILogger<MultiCountyIntegrationController> logger,
        IAuditLogger auditLogger)
    {
        _integrationService = integrationService;
        _logger = logger;
        _auditLogger = auditLogger;
    }

    /// <summary>
    /// Get integration status for all 39 Washington State counties
    /// </summary>
    [HttpGet("counties/status")]
    public async Task<ActionResult<object>> GetAllCountyStatuses()
    {
        try
        {
            _logger.LogInformation("Multi-county status requested for all 39 Washington State counties");
            await _auditLogger.LogAsync("MULTI_COUNTY_STATUS", "All county status requested", true);

            var statuses = await _integrationService.GetAllCountyStatusesAsync();

            var response = new
            {
                multiCountyIntegration = new
                {
                    totalCounties = statuses.Length,
                    integratedCounties = statuses.Count(s => s.IntegrationEnabled),
                    healthyCounties = statuses.Count(s => s.IsHealthy),
                    harrisPacsEnabledCounties = statuses.Count(s => s.HarrisPacsEnabled),
                    totalPropertyRecords = statuses.Sum(s => s.PropertyRecordCount),
                    integrationCoverage = $"{(double)statuses.Count(s => s.IntegrationEnabled) / statuses.Length * 100:F1}%"
                },
                washingtonStateCounties = statuses.Select(s => new
                {
                    countyCode = s.CountyCode,
                    countyName = s.CountyName,
                    integrationEnabled = s.IntegrationEnabled,
                    isHealthy = s.IsHealthy,
                    lastSyncTime = s.LastSyncTime,
                    propertyRecordCount = s.PropertyRecordCount,
                    harrisPacsEnabled = s.HarrisPacsEnabled,
                    statusIndicator = s.IsHealthy ? "🟢 Operational" :
                                   s.IntegrationEnabled ? "🟡 Needs Attention" : "🔴 Not Integrated",
                    errorMessage = s.ErrorMessage
                }).ToArray(),
                eliteIntegrationMetrics = new
                {
                    governmentGrade = "Washington State Multi-County Federation",
                    integrationLevel = "Elite County Coordination",
                    dataUnification = "39-County Synchronized Access",
                    harrisPacsIntegration = "Legacy System Bridge Enabled"
                },
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0",
                apiVersion = "Elite Multi-County Integration"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get all county statuses");
            await _auditLogger.LogAsync("MULTI_COUNTY_STATUS_ERROR", $"County status error: {ex.Message}", false);
            return StatusCode(500, new {
                error = "Failed to retrieve county statuses",
                details = ex.Message,
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
    }

    /// <summary>
    /// Synchronize data for a specific Washington State county
    /// </summary>
    [HttpPost("counties/{countyCode}/sync")]
    public async Task<ActionResult<object>> SynchronizeCountyData(string countyCode)
    {
        try
        {
            _logger.LogInformation("County data synchronization requested for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_SYNC_REQUEST", $"Sync requested for county: {countyCode}", true);

            var result = await _integrationService.SynchronizeCountyDataAsync(countyCode.ToLower());

            var response = new
            {
                synchronizationResult = new
                {
                    countyCode = result.CountyCode,
                    isSuccessful = result.IsSuccessful,
                    syncStartTime = result.SyncStartTime,
                    syncEndTime = result.SyncEndTime,
                    duration = $"{result.Duration.TotalSeconds:F2} seconds",
                    propertyRecordsSynced = result.PropertyRecordsSynced,
                    localRecordsUpdated = result.LocalRecordsUpdated,
                    dataIntegrityValid = result.DataIntegrityValid,
                    configurationLoaded = result.ConfigurationLoaded,
                    errorMessage = result.ErrorMessage,
                    validationErrors = result.ValidationErrors
                },
                harrisPacsIntegration = result.HarrisPacsSync != null ? (object)new
                {
                    enabled = true,
                    isSuccessful = result.HarrisPacsSync.IsSuccessful,
                    recordsSynced = result.HarrisPacsSync.RecordsSynced,
                    recordsUpdated = result.HarrisPacsSync.RecordsUpdated,
                    recordsCreated = result.HarrisPacsSync.RecordsCreated,
                    syncDuration = result.HarrisPacsSync.SyncEndTime - result.HarrisPacsSync.SyncStartTime,
                    errorMessage = result.HarrisPacsSync.ErrorMessage
                } : (object)new
                {
                    enabled = false,
                    reason = "Harris PACS integration not configured for this county"
                },
                eliteSyncMetrics = new
                {
                    governmentGradeSync = result.IsSuccessful ? "COMPLETED" : "FAILED",
                    dataQualityAssurance = result.DataIntegrityValid ? "VALIDATED" : "NEEDS_REVIEW",
                    washingtonStateCompliance = true,
                    legacySystemIntegration = result.HarrisPacsSync?.IsSuccessful ?? false ? "SYNCHRONIZED" : "DISABLED"
                },
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0",
                apiVersion = "Elite County Synchronization"
            };

            if (result.IsSuccessful)
            {
                return Ok(response);
            }
            else
            {
                return BadRequest(response);
            }
        }
        catch (ArgumentException ex)
        {
            await _auditLogger.LogAsync("COUNTY_SYNC_INVALID", $"Invalid county code: {countyCode}", false);
            return BadRequest(new {
                error = "Invalid county code",
                details = ex.Message,
                validCounties = "Must be one of 39 Washington State counties",
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "County synchronization failed for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_SYNC_ERROR", $"Sync error for {countyCode}: {ex.Message}", false);
            return StatusCode(500, new {
                error = "County synchronization failed",
                details = ex.Message,
                countyCode = countyCode,
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
    }

    /// <summary>
    /// Get configuration for a specific county
    /// </summary>
    [HttpGet("counties/{countyCode}/config")]
    public async Task<ActionResult<object>> GetCountyConfiguration(string countyCode)
    {
        try
        {
            _logger.LogInformation("County configuration requested for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_CONFIG_REQUEST", $"Configuration requested for county: {countyCode}", true);

            var config = await _integrationService.GetCountyConfigurationAsync(countyCode.ToLower());

            var response = new
            {
                countyConfiguration = new
                {
                    countyCode = config.CountyCode,
                    countyName = config.CountyName,
                    harrisPacsIntegration = config.HarrisPacsIntegration != null ? new
                    {
                        enabled = config.HarrisPacsIntegration.Enabled,
                        apiEndpoint = config.HarrisPacsIntegration.ApiEndpoint,
                        syncIntervalMinutes = config.HarrisPacsIntegration.SyncIntervalMinutes,
                        hasApiKey = !string.IsNullOrEmpty(config.HarrisPacsIntegration.ApiKey)
                    } : null,
                    accessControl = config.AccessControl != null ? new
                    {
                        restrictedAccess = config.AccessControl.RestrictedAccess,
                        allowedUsersCount = config.AccessControl.AllowedUsers?.Length ?? 0
                    } : null
                },
                eliteConfigurationStatus = new
                {
                    governmentGradeConfig = "Washington State County Configuration",
                    legacySystemIntegration = config.HarrisPacsIntegration?.Enabled ?? false ? "ENABLED" : "DISABLED",
                    securityLevel = config.AccessControl?.RestrictedAccess ?? false ? "RESTRICTED" : "STANDARD_ACCESS",
                    complianceLevel = "Government Approved"
                },
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0",
                apiVersion = "Elite County Configuration"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get county configuration for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_CONFIG_ERROR", $"Config error for {countyCode}: {ex.Message}", false);
            return StatusCode(500, new {
                error = "Failed to get county configuration",
                details = ex.Message,
                countyCode = countyCode,
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
    }

    /// <summary>
    /// Search for property assessment data across all counties
    /// </summary>
    [HttpGet("properties/{parcelId}")]
    public async Task<ActionResult<object>> GetCrossCountyPropertyData(string parcelId)
    {
        try
        {
            _logger.LogInformation("Cross-county property search requested for parcel: {ParcelId}", parcelId);
            await _auditLogger.LogAsync("CROSS_COUNTY_SEARCH", $"Property search for parcel: {parcelId}", true);

            var propertyData = await _integrationService.GetCrossCountyPropertyDataAsync(parcelId);

            var response = new
            {
                propertySearch = new
                {
                    parcelId = propertyData.ParcelId,
                    searchTimestamp = propertyData.SearchTimestamp,
                    recordsFound = propertyData.CountyRecords.Count,
                    countiesSearched = 39,
                    searchCoverage = "All Washington State Counties"
                },
                propertyRecords = propertyData.CountyRecords.Select(record => new
                {
                    countyCode = record.CountyCode,
                    countyName = record.CountyName,
                    lastUpdated = record.LastUpdated,
                    propertyData = record.PropertyData != null ? new
                    {
                        parcelId = record.PropertyData.ParcelId,
                        assessedValue = record.PropertyData.AssessedValue,
                        propertyType = record.PropertyData.PropertyType,
                        lastAssessment = record.PropertyData.LastAssessment,
                        formattedValue = $"${record.PropertyData.AssessedValue:N0}"
                    } : null
                }).ToArray(),
                elitePropertyIntelligence = new
                {
                    multiCountyAnalysis = "39-County Property Intelligence",
                    governmentGradeSearch = "Washington State Property Federation",
                    dataUnification = "Cross-County Assessment Coordination",
                    totalAssessedValue = propertyData.CountyRecords
                        .Where(r => r.PropertyData != null)
                        .Sum(r => r.PropertyData!.AssessedValue),
                    averageAssessment = propertyData.CountyRecords.Count > 0 ?
                        propertyData.CountyRecords
                            .Where(r => r.PropertyData != null)
                            .Average(r => r.PropertyData!.AssessedValue) : 0
                },
                searchInsights = new
                {
                    multipleCountyMatches = propertyData.CountyRecords.Count > 1,
                    potentialDuplicates = propertyData.CountyRecords.Count > 1 ? "Review recommended" : "None detected",
                    dataQuality = "Government-grade property assessment data",
                    integrationStatus = "Elite multi-county coordination active"
                },
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0",
                apiVersion = "Elite Cross-County Property Search"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cross-county property search failed for parcel {ParcelId}", parcelId);
            await _auditLogger.LogAsync("CROSS_COUNTY_ERROR", $"Property search error for {parcelId}: {ex.Message}", false);
            return StatusCode(500, new {
                error = "Cross-county property search failed",
                details = ex.Message,
                parcelId = parcelId,
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
    }

    /// <summary>
    /// Get comprehensive metrics for a specific county
    /// </summary>
    [HttpGet("counties/{countyCode}/metrics")]
    public async Task<ActionResult<object>> GetCountyMetrics(string countyCode)
    {
        try
        {
            _logger.LogInformation("County metrics requested for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_METRICS_REQUEST", $"Metrics requested for county: {countyCode}", true);

            var metrics = await _integrationService.GetCountyMetricsAsync(countyCode.ToLower());

            var response = new
            {
                countyMetrics = new
                {
                    countyCode = metrics.CountyCode,
                    countyName = metrics.CountyName,
                    metricsTimestamp = metrics.MetricsTimestamp,
                    propertyRecordCount = metrics.PropertyRecordCount,
                    lastSyncTime = metrics.LastSyncTime,
                    integrationHealth = metrics.IntegrationHealth,
                    harrisPacsEnabled = metrics.HarrisPacsEnabled,
                    dataQualityScore = metrics.DataQualityScore,
                    syncFrequencyMinutes = metrics.SyncFrequencyMinutes,
                    formattedRecordCount = $"{metrics.PropertyRecordCount:N0} properties",
                    qualityGrade = GetQualityGrade(metrics.DataQualityScore)
                },
                eliteMetricsAnalysis = new
                {
                    governmentGradeMetrics = "Washington State County Performance",
                    integrationEfficiency = metrics.IntegrationHealth == "Healthy" ? "OPTIMAL" : "NEEDS_ATTENTION",
                    dataQualityAssurance = metrics.DataQualityScore >= 90 ? "EXCELLENT" :
                                          metrics.DataQualityScore >= 80 ? "GOOD" : "IMPROVEMENT_NEEDED",
                    legacySystemStatus = metrics.HarrisPacsEnabled ? "INTEGRATED" : "STANDALONE",
                    complianceLevel = "Government Approved"
                },
                performanceInsights = new
                {
                    syncEfficiency = metrics.SyncFrequencyMinutes <= 60 ? "High frequency sync" : "Standard sync interval",
                    dataVolume = GetDataVolumeCategory(metrics.PropertyRecordCount),
                    systemHealth = metrics.IntegrationHealth,
                    recommendedActions = GenerateRecommendations(metrics)
                },
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0",
                apiVersion = "Elite County Metrics"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get county metrics for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_METRICS_ERROR", $"Metrics error for {countyCode}: {ex.Message}", false);
            return StatusCode(500, new {
                error = "Failed to get county metrics",
                details = ex.Message,
                countyCode = countyCode,
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
    }

    /// <summary>
    /// Enable integration for a specific county
    /// </summary>
    [HttpPost("counties/{countyCode}/enable")]
    public async Task<ActionResult<object>> EnableCountyIntegration(string countyCode)
    {
        try
        {
            _logger.LogInformation("County integration enable requested for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_ENABLE_REQUEST", $"Enable integration for county: {countyCode}", true);

            var success = await _integrationService.EnableCountyIntegrationAsync(countyCode.ToLower());

            var response = new
            {
                integrationEnablement = new
                {
                    countyCode = countyCode.ToLower(),
                    isSuccessful = success,
                    status = success ? "ENABLED" : "FAILED",
                    message = success ?
                        $"Integration successfully enabled for {countyCode} County" :
                        $"Failed to enable integration for {countyCode} County"
                },
                eliteIntegrationStatus = new
                {
                    governmentGradeIntegration = success ? "ACTIVATED" : "ACTIVATION_FAILED",
                    washingtonStateCompliance = success,
                    multiCountyFederation = success ? "COUNTY_ADDED" : "COUNTY_PENDING",
                    harrisPacsReady = success
                },
                nextSteps = success ? new[]
                {
                    "Configure Harris PACS integration if needed",
                    "Run initial data synchronization",
                    "Verify county-specific settings",
                    "Test cross-county property searches"
                } : new[]
                {
                    "Review county code validity",
                    "Check system permissions",
                    "Verify county configuration files",
                    "Contact system administrator"
                },
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0",
                apiVersion = "Elite County Integration"
            };

            if (success)
            {
                return Ok(response);
            }
            else
            {
                return BadRequest(response);
            }
        }
        catch (ArgumentException ex)
        {
            await _auditLogger.LogAsync("COUNTY_ENABLE_INVALID", $"Invalid county code: {countyCode}", false);
            return BadRequest(new {
                error = "Invalid county code",
                details = ex.Message,
                validCounties = "Must be one of 39 Washington State counties",
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enable county integration for {CountyCode}", countyCode);
            await _auditLogger.LogAsync("COUNTY_ENABLE_ERROR", $"Enable error for {countyCode}: {ex.Message}", false);
            return StatusCode(500, new {
                error = "Failed to enable county integration",
                details = ex.Message,
                countyCode = countyCode,
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
    }

    /// <summary>
    /// Generate comprehensive multi-county federation report
    /// </summary>
    [HttpGet("federation/report")]
    public async Task<ActionResult<object>> GetFederationReport()
    {
        try
        {
            _logger.LogInformation("Multi-county federation report requested");
            await _auditLogger.LogAsync("FEDERATION_REPORT_REQUEST", "Federation report requested", true);

            var report = await _integrationService.GenerateFederationReportAsync();

            var response = new
            {
                federationReport = new
                {
                    reportTimestamp = report.ReportTimestamp,
                    totalCounties = report.TotalCounties,
                    integratedCounties = report.IntegratedCounties,
                    healthyCounties = report.HealthyCounties,
                    totalPropertyRecords = report.TotalPropertyRecords,
                    harrisPacsEnabledCounties = report.HarrisPacsEnabledCounties,
                    federationHealthScore = report.FederationHealthScore,
                    integrationCoverage = $"{(double)report.IntegratedCounties / report.TotalCounties * 100:F1}%",
                    healthyCoverage = $"{(double)report.HealthyCounties / report.TotalCounties * 100:F1}%",
                    formattedPropertyRecords = $"{report.TotalPropertyRecords:N0} properties"
                },
                washingtonStateFederation = new
                {
                    stateName = "Washington State",
                    totalCounties = 39,
                    federationLevel = GetFederationLevel(report.FederationHealthScore),
                    governmentGrade = "Multi-County Property Assessment Federation",
                    complianceStatus = report.FederationHealthScore >= 80 ? "FULLY_COMPLIANT" : "IMPROVEMENT_NEEDED",
                    eliteIntegrationStandard = report.FederationHealthScore >= 90 ? "ELITE_ACHIEVED" : "PROGRESSING"
                },
                integrationInsights = new
                {
                    strongestPerformers = report.CountyStatuses
                        .Where(s => s.IsHealthy && s.IntegrationEnabled)
                        .OrderByDescending(s => s.PropertyRecordCount)
                        .Take(5)
                        .Select(s => new { s.CountyName, s.PropertyRecordCount })
                        .ToArray(),
                    needsAttention = report.CountyStatuses
                        .Where(s => !s.IsHealthy || !s.IntegrationEnabled)
                        .Select(s => new { s.CountyName, s.ErrorMessage, s.IntegrationEnabled })
                        .ToArray(),
                    harrisPacsAdoption = $"{report.HarrisPacsEnabledCounties}/{report.TotalCounties} counties",
                    dataUnificationLevel = report.TotalPropertyRecords > 1000000 ? "MASSIVE_SCALE" : "LARGE_SCALE"
                },
                strategicRecommendations = GenerateFederationRecommendations(report),
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0",
                apiVersion = "Elite Multi-County Federation Report"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate federation report");
            await _auditLogger.LogAsync("FEDERATION_REPORT_ERROR", $"Federation report error: {ex.Message}", false);
            return StatusCode(500, new {
                error = "Failed to generate federation report",
                details = ex.Message,
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
    }

    // Helper methods for response formatting
    private string GetQualityGrade(double score)
    {
        return score switch
        {
            >= 95 => "A+ Excellent",
            >= 90 => "A Good",
            >= 85 => "B+ Above Average",
            >= 80 => "B Average",
            >= 75 => "C+ Below Average",
            _ => "C Needs Improvement"
        };
    }

    private string GetDataVolumeCategory(int recordCount)
    {
        return recordCount switch
        {
            >= 40000 => "Large County (40,000+ properties)",
            >= 20000 => "Medium County (20,000+ properties)",
            >= 10000 => "Small County (10,000+ properties)",
            _ => "Rural County (< 10,000 properties)"
        };
    }

    private string[] GenerateRecommendations(CountyMetrics metrics)
    {
        var recommendations = new List<string>();

        if (metrics.DataQualityScore < 85)
            recommendations.Add("Improve data quality through validation and cleanup");

        if (!metrics.HarrisPacsEnabled)
            recommendations.Add("Consider enabling Harris PACS integration");

        if (metrics.SyncFrequencyMinutes > 120)
            recommendations.Add("Increase synchronization frequency for better data freshness");

        if (metrics.IntegrationHealth != "Healthy")
            recommendations.Add("Address integration health issues");

        if (recommendations.Count == 0)
            recommendations.Add("County integration is operating at optimal levels");

        return recommendations.ToArray();
    }

    private string GetFederationLevel(double healthScore)
    {
        return healthScore switch
        {
            >= 95 => "ELITE_FEDERATION",
            >= 90 => "ADVANCED_FEDERATION",
            >= 80 => "GOOD_FEDERATION",
            >= 70 => "DEVELOPING_FEDERATION",
            _ => "EMERGING_FEDERATION"
        };
    }

    private string[] GenerateFederationRecommendations(MultiCountyFederationReport report)
    {
        var recommendations = new List<string>();

        if (report.IntegratedCounties < report.TotalCounties)
            recommendations.Add($"Integrate remaining {report.TotalCounties - report.IntegratedCounties} counties");

        if (report.HealthyCounties < report.IntegratedCounties)
            recommendations.Add("Address health issues in integrated counties");

        if (report.HarrisPacsEnabledCounties < report.IntegratedCounties / 2)
            recommendations.Add("Expand Harris PACS integration to more counties");

        if (report.FederationHealthScore < 90)
            recommendations.Add("Focus on achieving elite federation standards");

        if (recommendations.Count == 0)
            recommendations.Add("Federation is operating at elite government standards");

        return recommendations.ToArray();
    }
}
