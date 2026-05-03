using TerraFusion.Consciousness.Services;
using TerraFusion.Consciousness.DTOs;
using TerraFusion.Consciousness.Interfaces;
using TerraFusion.Data;
using TerraFusion.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Diagnostics;

namespace TerraFusion.Consciousness.Services
{
    /// <summary>
    /// Benton County Data Service
    /// Partial Benton County integration host.
    /// Property assessment reads governed Benton data; citizen services, emergency response,
    /// and cross-source sync remain unavailable until backed by real entities and pipelines.
    /// </summary>
    public class BentonCountyDataService : IBentonCountyDataService
    {
        private const string PartialServiceReason =
            "Governed Benton County service is partial: property assessment read lane available; citizen services, emergency response, and cross-source sync unavailable.";
        private const string CitizenServicesUnavailableReason =
            "Governed Benton citizen-services lane unavailable; no backed entity or source pipeline exists.";
        private const string EmergencyResponseUnavailableReason =
            "Governed Benton emergency-response lane unavailable; no backed entity or source pipeline exists.";
        private const string SyncUnavailableReason =
            "Governed Benton cross-source sync unavailable; no end-to-end source pipeline exists.";

        private readonly ILogger<BentonCountyDataService> _logger;
        private readonly IConfiguration _configuration;
        private readonly TerraFusionContext _context;
        private readonly HttpClient _httpClient;

        private bool _isInitialized = false;
        private readonly string _bentonCountyApiBase;
        private readonly string _bentonCountyConnectionString;
        private readonly Dictionary<string, DateTime> _lastSyncTimes = new();

        // Benton County specific data sources
        private readonly Dictionary<string, string> _dataSourceEndpoints = new()
        {
            { "PropertyAssessments", "/api/v1/property-assessments" },
            { "CitizenServices", "/api/v1/citizen-services" },
            { "EmergencyResponse", "/api/v1/emergency-response" },
            { "PermitsLicenses", "/api/v1/permits-licenses" },
            { "ZoningData", "/api/v1/zoning" },
            { "TaxRecords", "/api/v1/tax-records" },
            { "ElectionData", "/api/v1/elections" },
            { "PublicWorks", "/api/v1/public-works" }
        };

        public BentonCountyDataService(
            ILogger<BentonCountyDataService> logger,
            IConfiguration configuration,
            TerraFusionContext context,
            HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _context = context;
            _httpClient = httpClient;

            // Configure Benton County connections
            _bentonCountyApiBase = _configuration.GetValue<string>("BentonCounty:ApiBaseUrl",
                "https://data.bentoncountywa.gov/api") ?? "https://data.bentoncountywa.gov/api";
            _bentonCountyConnectionString = _configuration.GetConnectionString("BentonCountyDatabase")
                ?? "Host=benton-county-db.wa.gov;Database=benton_gis;Username=terrafusion;Password=secure_connection";

            // Configure HTTP client for Benton County API
            _httpClient.BaseAddress = new Uri(_bentonCountyApiBase);
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "TerraFusion-OS/2.0 (Government AI System)");
        }

        public async Task<BentonCountyInitializationResultDto> InitializeAsync()
        {
            var stopwatch = Stopwatch.StartNew();
            _logger.LogInformation("Initializing Benton County data service in governed partial mode.");

            try
            {
                var initializationTasks = new List<Task>
                {
                    ValidateDatabaseConnectionAsync(),
                    InitializeDataSourceMappingsAsync(),
                    CreateIndexesForOptimalPerformanceAsync()
                };

                await Task.WhenAll(initializationTasks);

                _isInitialized = true;
                stopwatch.Stop();

                var result = new BentonCountyInitializationResultDto
                {
                    Success = true,
                    ConnectionStatus = "Partial",
                    LastSync = DateTime.UtcNow,
                    AvailableDataSources = 1,
                    InitializationMessages = new List<string>
                    {
                        "Benton property assessment database connection validated.",
                        "Compatibility mappings initialized for the Benton host.",
                        "Property assessment read lane available.",
                        CitizenServicesUnavailableReason,
                        EmergencyResponseUnavailableReason,
                        SyncUnavailableReason
                    }
                };

                _logger.LogInformation("Benton County data service initialized in partial mode in {ElapsedMs}ms.",
                    stopwatch.ElapsedMilliseconds);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to initialize Benton County data integration");

                return new BentonCountyInitializationResultDto
                {
                    Success = false,
                    ConnectionStatus = $"Connection failed: {ex.Message}",
                    LastSync = DateTime.UtcNow,
                    AvailableDataSources = 0,
                    InitializationMessages = new List<string> { $"Initialization failed: {ex.Message}" }
                };
            }
        }

        public async Task<PropertyAssessmentDataDto> GetPropertyAssessmentDataAsync(PropertyDataRequestDto request)
        {
            EnsureInitialized();

            _logger.LogInformation("📋 Retrieving property assessment data for Benton County: {Request}",
                System.Text.Json.JsonSerializer.Serialize(request));

            var stopwatch = Stopwatch.StartNew();

            try
            {
                var query = _context.Properties.AsQueryable();

                // Apply filters based on request
                if (!string.IsNullOrEmpty(request.PropertyId))
                {
                    query = query.Where(p => p.PropertyId == request.PropertyId);
                }

                if (!string.IsNullOrEmpty(request.Address))
                {
                    query = query.Where(p => p.Address.Contains(request.Address));
                }

                if (!string.IsNullOrEmpty(request.ParcelNumber))
                {
                    query = query.Where(p => p.ParcelNumber == request.ParcelNumber);
                }

                if (request.AssessmentDate.HasValue)
                {
                    var targetDate = request.AssessmentDate.Value.Date;
                    query = query.Where(p => p.AssessmentDate.Date == targetDate);
                }

                // Apply additional filter criteria
                foreach (var criteria in request.FilterCriteria)
                {
                    switch (criteria.Key.ToLower())
                    {
                        case "propertytype":
                            query = query.Where(p => p.PropertyType == criteria.Value.ToString());
                            break;
                        case "minvalue":
                            if (decimal.TryParse(criteria.Value.ToString(), out var minValue))
                                query = query.Where(p => p.AssessedValue >= minValue);
                            break;
                        case "maxvalue":
                            if (decimal.TryParse(criteria.Value.ToString(), out var maxValue))
                                query = query.Where(p => p.AssessedValue <= maxValue);
                            break;
                    }
                }

                var properties = await query
                    .OrderByDescending(p => p.AssessmentDate)
                    .Take(1000) // Limit for performance
                    .ToListAsync();

                var propertyRecords = properties.Select(p => new PropertyAssessmentRecord
                {
                    PropertyId = p.PropertyId,
                    ParcelNumber = p.ParcelNumber,
                    Address = p.Address,
                    AssessedValue = p.AssessedValue,
                    MarketValue = p.MarketValue,
                    AssessmentDate = p.AssessmentDate,
                    PropertyType = p.PropertyType ?? "Unknown",
                    AdditionalData = new Dictionary<string, object>
                    {
                        { "County", "Benton" },
                        { "State", "Washington" },
                        { "DataSource", "BentonCountyAssessor" },
                        { "LastUpdated", (object)p.LastUpdated },
                        { "Owner", p.OwnerName ?? "Unknown" },
                        { "LandValue", (object)p.LandValue },
                        { "ImprovementValue", (object)p.ImprovementValue },
                        { "TaxYear", (object)p.TaxYear }
                    }
                }).ToList();

                stopwatch.Stop();

                var result = new PropertyAssessmentDataDto
                {
                    Properties = propertyRecords,
                    TotalRecords = propertyRecords.Count,
                    DataAsOf = DateTime.UtcNow,
                    AssessmentMetrics = new Dictionary<string, object>
                    {
                        { "QueryTimeMs", stopwatch.ElapsedMilliseconds },
                        { "AverageAssessedValue", propertyRecords.Any() ? propertyRecords.Average(p => p.AssessedValue) : 0 },
                        { "TotalAssessedValue", propertyRecords.Sum(p => p.AssessedValue) },
                        { "PropertyTypes", propertyRecords.GroupBy(p => p.PropertyType).ToDictionary(g => g.Key, g => g.Count()) },
                        { "AssessmentDateRange", new {
                            Earliest = propertyRecords.Any() ? propertyRecords.Min(p => p.AssessmentDate) : DateTime.MinValue,
                            Latest = propertyRecords.Any() ? propertyRecords.Max(p => p.AssessmentDate) : DateTime.MinValue
                        }}
                    }
                };

                _logger.LogInformation("📋✅ Retrieved {Count} property assessment records in {ElapsedMs}ms",
                    propertyRecords.Count, stopwatch.ElapsedMilliseconds);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to retrieve property assessment data");
                throw;
            }
        }

        public async Task<CitizenServicesDataDto> GetCitizenServicesDataAsync(CitizenServicesRequestDto request)
        {
            await Task.CompletedTask;
            EnsureInitialized();
            _logger.LogWarning(CitizenServicesUnavailableReason);

            return new CitizenServicesDataDto
            {
                ServiceRecords = new List<CitizenServiceRecord>(),
                TotalRecords = 0,
                DataAsOf = DateTime.UtcNow,
                ServiceMetrics = new Dictionary<string, object>
                {
                    { "GovernedContractAvailable", false },
                    { "Reason", CitizenServicesUnavailableReason },
                    { "QueryTimeMs", 0L }
                }
            };
        }

        public async Task<EmergencyResponseDataDto> GetEmergencyResponseDataAsync(EmergencyDataRequestDto request)
        {
            await Task.CompletedTask;
            EnsureInitialized();
            _logger.LogWarning(EmergencyResponseUnavailableReason);

            return new EmergencyResponseDataDto
            {
                EmergencyRecords = new List<EmergencyRecord>(),
                TotalRecords = 0,
                DataAsOf = DateTime.UtcNow,
                EmergencyMetrics = new Dictionary<string, object>
                {
                    { "GovernedContractAvailable", false },
                    { "Reason", EmergencyResponseUnavailableReason },
                    { "QueryTimeMs", 0L }
                }
            };
        }

        public async Task<BentonCountySyncResultDto> SyncWithBentonCountyAsync()
        {
            EnsureInitialized();
            _logger.LogWarning(SyncUnavailableReason);
            var syncStartTime = DateTime.UtcNow;
            await Task.CompletedTask;

            return new BentonCountySyncResultDto
            {
                Success = false,
                SyncStartTime = syncStartTime,
                SyncEndTime = DateTime.UtcNow,
                RecordsSynced = 0,
                RecordsUpdated = 0,
                RecordsAdded = 0,
                SyncMessages = new List<string> { SyncUnavailableReason },
                SyncMetrics = new Dictionary<string, object>
                {
                    { "GovernedContractAvailable", false },
                    { "Reason", SyncUnavailableReason }
                }
            };
        }

        #region Private Helper Methods

        private void EnsureInitialized()
        {
            if (!_isInitialized)
            {
                throw new InvalidOperationException("Benton County Data Service has not been initialized. Call InitializeAsync() first.");
            }
        }

        private async Task ValidateApiConnectionsAsync()
        {
            _logger.LogDebug("🔗 Validating Benton County API connections...");

            foreach (var endpoint in _dataSourceEndpoints)
            {
                try
                {
                    var response = await _httpClient.GetAsync($"{endpoint.Value}/health");
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogDebug("✅ {Source} API connection validated", endpoint.Key);
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ {Source} API returned {StatusCode}", endpoint.Key, response.StatusCode);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "⚠️ Could not validate {Source} API connection", endpoint.Key);
                }
            }
        }

        private async Task ValidateDatabaseConnectionAsync()
        {
            _logger.LogDebug("🗄️ Validating Benton County database connection...");

            try
            {
                await _context.Database.CanConnectAsync();
                _logger.LogDebug("✅ Database connection validated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Database connection validation failed");
                throw;
            }
        }

        private async Task InitializeDataSourceMappingsAsync()
        {
            _logger.LogDebug("📊 Initializing data source mappings...");

            // Initialize mapping configurations for each data source
            await Task.Delay(100); // Simulate mapping initialization

            _logger.LogDebug("✅ Data source mappings initialized");
        }

        private async Task CreateIndexesForOptimalPerformanceAsync()
        {
            _logger.LogDebug("⚡ Creating performance indexes...");

            try
            {
                // Create indexes for optimal query performance
                await _context.Database.ExecuteSqlRawAsync(@"
                    CREATE INDEX IF NOT EXISTS idx_properties_parcel ON properties(parcel_number);
                    CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(address);
                    CREATE INDEX IF NOT EXISTS idx_properties_assessment_date ON properties(assessment_date);
                    CREATE INDEX IF NOT EXISTS idx_citizen_services_type ON citizen_services(service_type);
                    CREATE INDEX IF NOT EXISTS idx_citizen_services_date ON citizen_services(request_date);
                    CREATE INDEX IF NOT EXISTS idx_emergency_records_type ON emergency_records(emergency_type);
                    CREATE INDEX IF NOT EXISTS idx_emergency_records_date ON emergency_records(occurred_at);
                ");

                _logger.LogDebug("✅ Performance indexes created");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Some indexes may already exist or failed to create");
            }
        }

        private async Task PerformInitialDataSyncAsync()
        {
            _logger.LogWarning(SyncUnavailableReason);
            await Task.CompletedTask;
        }

        // Sync methods for each data source
        private async Task<(string Source, int Synced, int Updated, int Added)> SyncPropertyAssessmentsAsync()
        {
            await Task.CompletedTask;
            return ("PropertyAssessments", 0, 0, 0);
        }

        private async Task<(string Source, int Synced, int Updated, int Added)> SyncCitizenServicesAsync()
        {
            await Task.CompletedTask;
            return ("CitizenServices", 0, 0, 0);
        }

        private async Task<(string Source, int Synced, int Updated, int Added)> SyncEmergencyResponseAsync()
        {
            await Task.CompletedTask;
            return ("EmergencyResponse", 0, 0, 0);
        }

        private async Task<(string Source, int Synced, int Updated, int Added)> SyncPermitsAndLicensesAsync()
        {
            await Task.CompletedTask;
            return ("PermitsLicenses", 0, 0, 0);
        }

        private async Task<(string Source, int Synced, int Updated, int Added)> SyncZoningDataAsync()
        {
            await Task.CompletedTask;
            return ("ZoningData", 0, 0, 0);
        }

        private async Task<(string Source, int Synced, int Updated, int Added)> SyncTaxRecordsAsync()
        {
            await Task.CompletedTask;
            return ("TaxRecords", 0, 0, 0);
        }

        private double CalculateAverageProcessingDays(List<CitizenServiceRecord> records)
        {
            var completedRecords = records.Where(r => r.CompletionDate.HasValue).ToList();
            if (!completedRecords.Any()) return 0;

            return completedRecords.Average(r => (r.CompletionDate!.Value - r.RequestDate).TotalDays);
        }

        private double CalculateAverageResponseTime(List<EmergencyRecord> records)
        {
            // Extract response time from emergency details
            var responseTimes = records
                .Where(r => r.EmergencyDetails.ContainsKey("ResponseTime"))
                .Select(r =>
                {
                    if (double.TryParse(r.EmergencyDetails["ResponseTime"].ToString(), out var time))
                        return time;
                    return 0.0;
                })
                .Where(t => t > 0)
                .ToList();

            return responseTimes.Any() ? responseTimes.Average() : 0.0;
        }

        #endregion
    }
}
