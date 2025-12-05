using System.Text.Json;

namespace TerraFusion.API.Services
{
    /// <summary>
    /// TerraSync HTTP Client Service
    /// Integrates with TerraSync API for dynamic county data instead of hardcoded values
    /// </summary>
    public interface ITerrasyncService
    {
        Task<TerrasyncGovernmentExcellence?> GetGovernmentExcellenceAsync();
        Task<TerrasyncCountyConfig?> GetCountyConfigAsync();
        Task<TerrasyncSystemStatus?> GetSystemStatusAsync();
        Task<TerrasyncCountyStatus?> GetBentonCountyStatusAsync();
        Task<bool> IsHealthyAsync();
    }

    public class TerrasyncService : ITerrasyncService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TerrasyncService> _logger;
        private readonly string _terrasyncBaseUrl;

        public TerrasyncService(HttpClient httpClient, ILogger<TerrasyncService> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _terrasyncBaseUrl = configuration.GetValue<string>("TerraSync:BaseUrl") ?? "http://localhost:3005";

            _httpClient.BaseAddress = new Uri(_terrasyncBaseUrl);
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
        }

        public async Task<TerrasyncGovernmentExcellence?> GetGovernmentExcellenceAsync()
        {
            try
            {
                _logger.LogInformation("🏛️ Calling TerraSync for government excellence data");

                var response = await _httpClient.GetAsync("/api/government/excellence");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<TerrasyncGovernmentExcellence>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    _logger.LogInformation("✅ Successfully retrieved government excellence from TerraSync");
                    return result;
                }
                else
                {
                    _logger.LogWarning("⚠️ TerraSync government excellence call failed: {StatusCode}", response.StatusCode);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get government excellence from TerraSync");
                return null;
            }
        }

        public async Task<TerrasyncCountyConfig?> GetCountyConfigAsync()
        {
            try
            {
                _logger.LogInformation("🗂️ Calling TerraSync for county configuration");

                var response = await _httpClient.GetAsync("/api/government/county-config");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<TerrasyncCountyConfig>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    _logger.LogInformation("✅ Successfully retrieved county config from TerraSync");
                    return result;
                }
                else
                {
                    _logger.LogWarning("⚠️ TerraSync county config call failed: {StatusCode}", response.StatusCode);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get county config from TerraSync");
                return null;
            }
        }

        public async Task<TerrasyncSystemStatus?> GetSystemStatusAsync()
        {
            try
            {
                _logger.LogInformation("📊 Calling TerraSync for system status");

                var response = await _httpClient.GetAsync("/api/terrafusion/status");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<TerrasyncSystemStatus>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    _logger.LogInformation("✅ Successfully retrieved system status from TerraSync");
                    return result;
                }
                else
                {
                    _logger.LogWarning("⚠️ TerraSync system status call failed: {StatusCode}", response.StatusCode);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get system status from TerraSync");
                return null;
            }
        }

        public async Task<TerrasyncCountyStatus?> GetBentonCountyStatusAsync()
        {
            try
            {
                _logger.LogInformation("🏛️ Calling TerraSync for Benton County status");

                var response = await _httpClient.GetAsync("/api/benton-county/status");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<TerrasyncCountyStatus>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    _logger.LogInformation("✅ Successfully retrieved Benton County status from TerraSync");
                    return result;
                }
                else
                {
                    _logger.LogWarning("⚠️ TerraSync Benton County status call failed: {StatusCode}", response.StatusCode);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get Benton County status from TerraSync");
                return null;
            }
        }

        public async Task<bool> IsHealthyAsync()
        {
            try
            {
                _logger.LogInformation("🏥 Checking TerraSync health");

                var response = await _httpClient.GetAsync("/api/health");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var healthCheck = JsonSerializer.Deserialize<TerrasyncHealthCheck>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    var isHealthy = healthCheck?.Status == "healthy";
                    _logger.LogInformation("✅ TerraSync health check: {Status}", healthCheck?.Status ?? "unknown");
                    return isHealthy;
                }
                else
                {
                    _logger.LogWarning("⚠️ TerraSync health check failed: {StatusCode}", response.StatusCode);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ TerraSync health check exception");
                return false;
            }
        }
    }

    #region DTOs for TerraSync API Integration

    public class TerrasyncGovernmentExcellence
    {
        public string Status { get; set; } = string.Empty;
        public TerrasyncCounty County { get; set; } = new();
        public TerrasyncExcellence Excellence { get; set; } = new();
        public TerrasyncServices Services { get; set; } = new();
        public TerrasyncMetrics Metrics { get; set; } = new();
        public TerrasyncTerrafusion Terrafusion { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class TerrasyncCounty
    {
        public string Name { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Fips { get; set; } = string.Empty;
        public int Parcels { get; set; }
        public string AssessmentSystem { get; set; } = string.Empty;
    }

    public class TerrasyncExcellence
    {
        public string OperationalStatus { get; set; } = string.Empty;
        public bool DemoMode { get; set; }
        public string Compliance { get; set; } = string.Empty;
        public string Availability { get; set; } = string.Empty;
        public string CitizenSatisfaction { get; set; } = string.Empty;
        public string TranscendenceLevel { get; set; } = string.Empty;
    }

    public class TerrasyncServices
    {
        public string PropertyAssessment { get; set; } = string.Empty;
        public string AiSwarm { get; set; } = string.Empty;
        public string QuantumOptimization { get; set; } = string.Empty;
        public string RealTimeSync { get; set; } = string.Empty;
    }

    public class TerrasyncMetrics
    {
        public string ResponseTime { get; set; } = string.Empty;
        public string Accuracy { get; set; } = string.Empty;
        public string SystemHealth { get; set; } = string.Empty;
        public string Uptime { get; set; } = string.Empty;
    }

    public class TerrasyncTerrafusion
    {
        public string SystemVersion { get; set; } = string.Empty;
        public int QuantumOptimization { get; set; }
        public int ModuleCount { get; set; }
        public string TranscendenceLevel { get; set; } = string.Empty;
    }

    public class TerrasyncCountyConfig
    {
        public TerrasyncCountyInfo County { get; set; } = new();
        public TerrasyncLegacySystem LegacySystem { get; set; } = new();
        public TerrasyncDeployment Deployment { get; set; } = new();
        public TerrasyncFeatures Features { get; set; } = new();
        public TerrasyncSla Sla { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class TerrasyncCountyInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Fips { get; set; } = string.Empty;
        public string Timezone { get; set; } = string.Empty;
        public int ParcelCount { get; set; }
    }

    public class TerrasyncLegacySystem
    {
        public string Name { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public bool Enabled { get; set; }
        public string Jurisdiction { get; set; } = string.Empty;
        public string SyncInterval { get; set; } = string.Empty;
        public DateTime LastSync { get; set; }
    }

    public class TerrasyncDeployment
    {
        public string Environment { get; set; } = string.Empty;
        public string Mode { get; set; } = string.Empty;
        public bool DemoMode { get; set; }
        public bool MultiCounty { get; set; }
    }

    public class TerrasyncFeatures
    {
        public bool AiSwarmEnabled { get; set; }
        public bool QuantumOptimization { get; set; }
        public bool RealTimeSync { get; set; }
        public bool AdvancedAnalytics { get; set; }
        public bool ComplianceMonitoring { get; set; }
    }

    public class TerrasyncSla
    {
        public double Availability { get; set; }
        public int P95Latency { get; set; }
        public double ErrorRate { get; set; }
        public double Accuracy { get; set; }
    }

    public class TerrasyncSystemStatus
    {
        public bool Success { get; set; }
        public DateTime Timestamp { get; set; }
        public object Terrafusion { get; set; } = new();
        public object CountySystems { get; set; } = new();
        public string IntegrationHealth { get; set; } = string.Empty;
        public string GovernmentCompliance { get; set; } = string.Empty;
    }

    public class TerrasyncCountyStatus
    {
        public bool Success { get; set; }
        public DateTime Timestamp { get; set; }
        public TerrasyncCountyInfo County { get; set; } = new();
        public object System { get; set; } = new();
        public string GovernmentCompliance { get; set; } = string.Empty;
    }

    public class TerrasyncHealthCheck
    {
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Service { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public object CountySystems { get; set; } = new();
        public object Terrafusion { get; set; } = new();
        public string GovernmentCompliance { get; set; } = string.Empty;
    }

    #endregion
}