// =============================================================================
// ⚠️ DEPRECATED: Use TerraFusion.Core.PACS.IPacsAdapter instead
// =============================================================================
// This service is DEPRECATED as of pacscontract.v1 SpecLock.
// All PACS access should go through IPacsAdapter.
//
// Migration: Replace IHarrisPACSIntegrationService with IPacsAdapter
// See: docs/spec-lock/locks/pacscontract/pacscontract.v1/
//
// This file will be removed in a future release.
// =============================================================================

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json;
using System.Text;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// [DEPRECATED] Use <see cref="TerraFusion.Core.PACS.IPacsAdapter"/> instead.
    /// This interface is deprecated as of pacscontract.v1 SpecLock.
    /// </summary>
    [Obsolete("Use TerraFusion.Core.PACS.IPacsAdapter instead. This service will be removed in a future release.")]
    public interface IHarrisPACSIntegrationService
    {
        Task<List<PACSProperty>> GetPropertiesAsync(string jurisdiction, int page = 1, int pageSize = 100);
        Task<PACSProperty?> GetPropertyByParcelAsync(string jurisdiction, string parcelId);
        Task<List<PACSAssessment>> GetAssessmentsAsync(string jurisdiction, string parcelId);
        Task<PACSOwner?> GetPropertyOwnerAsync(string jurisdiction, string parcelId);
        Task<List<PACSTaxRecord>> GetTaxRecordsAsync(string jurisdiction, string parcelId);
        Task<List<PACSPermit>> GetPermitsAsync(string jurisdiction, string parcelId);
        Task<bool> SyncPropertyDataAsync(string jurisdiction);
        Task<PACSSyncStatus?> GetSyncStatusAsync(string jurisdiction);
        Task<List<PACSJurisdiction>> GetAvailableJurisdictionsAsync();
        Task<PACSSystemStatus> GetSystemStatusAsync();
        Task<List<PACSTransaction>> GetRecentTransactionsAsync(string jurisdiction, DateTime? since = null);
    }

    public class PACSProperty
    {
        public string? ParcelId { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? ZipCode { get; set; }
        public double? LandValue { get; set; }
        public double? ImprovementValue { get; set; }
        public double? TotalValue { get; set; }
        public string? PropertyType { get; set; }
        public double? Acreage { get; set; }
        public int? YearBuilt { get; set; }
        public string? LegalDescription { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class PACSAssessment
    {
        public string? Id { get; set; }
        public string? ParcelId { get; set; }
        public int AssessmentYear { get; set; }
        public double LandValue { get; set; }
        public double ImprovementValue { get; set; }
        public double TotalValue { get; set; }
        public PACSExemptionAmount? ExemptionAmount { get; set; }
        public double TaxableValue { get; set; }
        public DateTime AssessmentDate { get; set; }
    }

    public class PACSExemptionAmount
    {
        public double Amount { get; set; }
    }

    public class PACSOwner
    {
        public string? Id { get; set; }
        public string? ParcelId { get; set; }
        public string? Name { get; set; }
        public string? MailingAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? ZipCode { get; set; }
        public string? OwnershipType { get; set; }
        public double OwnershipPercentage { get; set; }
    }

    public class PACSTaxRecord
    {
        public string? Id { get; set; }
        public string? ParcelId { get; set; }
        public int TaxYear { get; set; }
        public double TaxAmount { get; set; }
        public double AmountPaid { get; set; }
        public double Balance { get; set; }
        public DateTime DueDate { get; set; }
        public string? Status { get; set; }
        public List<PACSExemption> Exemptions { get; set; } = new();
        public List<PACSTaxPayment> Payments { get; set; } = new();
    }

    public class PACSExemption
    {
        public string? Id { get; set; }
        public string? Type { get; set; }
        public double Amount { get; set; }
    }

    public class PACSTaxPayment
    {
        public string? Id { get; set; }
        public DateTime PaymentDate { get; set; }
        public double Amount { get; set; }
        public string? PaymentMethod { get; set; }
        public string? ReceiptNumber { get; set; }
    }

    public class PACSSyncStatus
    {
        public string Jurisdiction { get; set; } = string.Empty;
        public DateTime LastSync { get; set; }
        public DateTime NextScheduledSync { get; set; }
        public string Status { get; set; } = string.Empty;
        public int RecordsProcessed { get; set; }
        public int RecordsUpdated { get; set; }
        public int RecordsAdded { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    public class PACSJurisdiction
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? State { get; set; }
        public string? County { get; set; }
        public bool IsActive { get; set; }
        public string? ApiEndpoint { get; set; }
        public DateTime LastSync { get; set; }
    }

    public class PACSSystemStatus
    {
        public bool IsOnline { get; set; }
        public string? PACSVersion { get; set; }
        public DateTime LastHealthCheck { get; set; }
        public Dictionary<string, bool> ServiceStatus { get; set; } = new();
        public int ActiveConnections { get; set; }
        public double ResponseTime { get; set; }
    }

    public class PACSPermit
    {
        public string? Id { get; set; }
        public string? ParcelId { get; set; }
        public string? PermitNumber { get; set; }
        public string? PermitType { get; set; }
        public string? Description { get; set; }
        public DateTime ApplicationDate { get; set; }
        public DateTime? IssuedDate { get; set; }
        public string? Status { get; set; }
        public double? EstimatedValue { get; set; }
        public string? ContractorName { get; set; }
    }

    public class PACSTransaction
    {
        public string? Id { get; set; }
        public string? ParcelId { get; set; }
        public string? TransactionType { get; set; }
        public DateTime TransactionDate { get; set; }
        public double Amount { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public string? ReferenceNumber { get; set; }
    }

    /// <summary>
    /// [DEPRECATED] Use <see cref="TerraFusion.Core.PACS.PacsSqlAdapter"/> instead.
    /// This service is deprecated as of pacscontract.v1 SpecLock.
    /// </summary>
    [Obsolete("Use TerraFusion.Core.PACS.IPacsAdapter instead. This service will be removed in a future release.")]
    public class HarrisPACSIntegrationService : IHarrisPACSIntegrationService
    {
        private readonly ILogger<HarrisPACSIntegrationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly IRedisCacheService _cacheService;

        private readonly string _pacsEndpoint;
        private readonly string _username;
        private readonly string _password;
        private readonly string _clientId;
        private readonly TimeSpan _cacheExpiration;
        private readonly bool _useDirectDatabaseAccess;

        public HarrisPACSIntegrationService(
            ILogger<HarrisPACSIntegrationService> logger,
            IConfiguration configuration,
            HttpClient httpClient,
            IRedisCacheService cacheService)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _cacheService = cacheService;

            _pacsEndpoint = configuration["HarrisPACS:Endpoint"] ?? throw new ArgumentException("Harris PACS endpoint not configured");
            _username = configuration["HarrisPACS:Username"] ?? throw new ArgumentException("Harris PACS username not configured");
            _password = configuration["HarrisPACS:Password"] ?? throw new ArgumentException("Harris PACS password not configured");
            _clientId = configuration["HarrisPACS:ClientId"] ?? "TerraFusion-OS";
            _cacheExpiration = TimeSpan.FromMinutes(configuration.GetValue<int>("HarrisPACS:CacheExpirationMinutes", 15));
            _useDirectDatabaseAccess = configuration.GetValue<bool>("HarrisPACS:UseDirectDatabaseAccess", false);

            ConfigureHttpClient();
        }

        private void ConfigureHttpClient()
        {
            _httpClient.BaseAddress = new Uri(_pacsEndpoint);

            // Harris PACS typically uses basic authentication
            var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_password}"));
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Basic {authToken}");
            _httpClient.DefaultRequestHeaders.Add("X-Client-Id", _clientId);
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "TerraFusion-OS/1.0");
            _httpClient.Timeout = TimeSpan.FromMinutes(10); // Harris PACS can be slow
        }

        public async Task<List<PACSProperty>> GetPropertiesAsync(string jurisdiction, int page = 1, int pageSize = 100)
        {
            try
            {
                var cacheKey = $"harris:pacs:properties:{jurisdiction}:{page}:{pageSize}";
                var cachedProperties = await _cacheService.GetAsync<List<PACSProperty>>(cacheKey);

                if (cachedProperties != null)
                {
                    return cachedProperties;
                }

                var url = $"/api/v1/jurisdictions/{jurisdiction}/properties?page={page}&pageSize={pageSize}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var properties = JsonSerializer.Deserialize<List<PACSProperty>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (properties != null)
                {
                    await _cacheService.SetAsync(cacheKey, properties, _cacheExpiration);
                }

                _logger.LogInformation("Retrieved {Count} properties for jurisdiction {Jurisdiction} from Harris PACS",
                    properties?.Count ?? 0, jurisdiction);

                return properties ?? new List<PACSProperty>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving properties for jurisdiction {Jurisdiction} from Harris PACS", jurisdiction);
                return new List<PACSProperty>();
            }
        }

        public async Task<PACSProperty?> GetPropertyByParcelAsync(string jurisdiction, string parcelId)
        {
            try
            {
                var cacheKey = $"pacs:property:{jurisdiction}:{parcelId}";
                var cachedProperty = await _cacheService.GetAsync<PACSProperty>(cacheKey);

                if (cachedProperty != null)
                {
                    return cachedProperty;
                }

                var url = $"/api/v1/jurisdictions/{jurisdiction}/properties/{parcelId}";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var property = JsonSerializer.Deserialize<PACSProperty>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (property != null)
                {
                    await _cacheService.SetAsync(cacheKey, property, _cacheExpiration);
                }

                return property;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property {ParcelId} for jurisdiction {Jurisdiction}",
                    parcelId, jurisdiction);
                return null;
            }
        }

        public async Task<List<PACSAssessment>> GetAssessmentsAsync(string jurisdiction, string parcelId)
        {
            try
            {
                var cacheKey = $"pacs:assessments:{jurisdiction}:{parcelId}";
                var cachedAssessments = await _cacheService.GetAsync<List<PACSAssessment>>(cacheKey);

                if (cachedAssessments != null)
                {
                    return cachedAssessments;
                }

                var url = $"/api/v1/jurisdictions/{jurisdiction}/properties/{parcelId}/assessments";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var assessments = JsonSerializer.Deserialize<List<PACSAssessment>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (assessments != null)
                {
                    await _cacheService.SetAsync(cacheKey, assessments, _cacheExpiration);
                }

                return assessments ?? new List<PACSAssessment>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assessments for parcel {ParcelId}", parcelId);
                return new List<PACSAssessment>();
            }
        }

        public async Task<PACSOwner?> GetPropertyOwnerAsync(string jurisdiction, string parcelId)
        {
            try
            {
                var cacheKey = $"pacs:owner:{jurisdiction}:{parcelId}";
                var cachedOwner = await _cacheService.GetAsync<PACSOwner>(cacheKey);

                if (cachedOwner != null)
                {
                    return cachedOwner;
                }

                var url = $"/api/v1/jurisdictions/{jurisdiction}/properties/{parcelId}/owner";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var owner = JsonSerializer.Deserialize<PACSOwner>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (owner != null)
                {
                    await _cacheService.SetAsync(cacheKey, owner, _cacheExpiration);
                }

                return owner;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving owner for parcel {ParcelId}", parcelId);
                return null;
            }
        }

        public async Task<List<PACSTaxRecord>> GetTaxRecordsAsync(string jurisdiction, string parcelId)
        {
            try
            {
                var cacheKey = $"pacs:taxes:{jurisdiction}:{parcelId}";
                var cachedTaxRecords = await _cacheService.GetAsync<List<PACSTaxRecord>>(cacheKey);

                if (cachedTaxRecords != null)
                {
                    return cachedTaxRecords;
                }

                var url = $"/api/v1/jurisdictions/{jurisdiction}/properties/{parcelId}/taxes";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var taxRecords = JsonSerializer.Deserialize<List<PACSTaxRecord>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (taxRecords != null)
                {
                    await _cacheService.SetAsync(cacheKey, taxRecords, _cacheExpiration);
                }

                return taxRecords ?? new List<PACSTaxRecord>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tax records for parcel {ParcelId}", parcelId);
                return new List<PACSTaxRecord>();
            }
        }

        public async Task<bool> SyncPropertyDataAsync(string jurisdiction)
        {
            try
            {
                var url = $"/api/v1/jurisdictions/{jurisdiction}/sync";
                var payload = new { clientId = _clientId, timestamp = DateTime.UtcNow };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);
                response.EnsureSuccessStatusCode();

                // Clear cache for this jurisdiction
                await _cacheService.RemoveByPatternAsync($"pacs:*:{jurisdiction}:*");

                _logger.LogInformation("Property data sync initiated for jurisdiction {Jurisdiction}", jurisdiction);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing property data for jurisdiction {Jurisdiction}", jurisdiction);
                return false;
            }
        }

        public async Task<PACSSyncStatus?> GetSyncStatusAsync(string jurisdiction)
        {
            try
            {
                var url = $"/api/v1/jurisdictions/{jurisdiction}/sync/status";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var syncStatus = JsonSerializer.Deserialize<PACSSyncStatus>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return syncStatus;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sync status for jurisdiction {Jurisdiction}", jurisdiction);
                return new PACSSyncStatus
                {
                    Jurisdiction = jurisdiction,
                    Status = "Error",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<List<PACSJurisdiction>> GetAvailableJurisdictionsAsync()
        {
            try
            {
                var cacheKey = "pacs:jurisdictions";
                var cachedJurisdictions = await _cacheService.GetAsync<List<PACSJurisdiction>>(cacheKey);

                if (cachedJurisdictions != null)
                {
                    return cachedJurisdictions;
                }

                var url = "/api/v1/jurisdictions";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var jurisdictions = JsonSerializer.Deserialize<List<PACSJurisdiction>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (jurisdictions != null)
                {
                    await _cacheService.SetAsync(cacheKey, jurisdictions, TimeSpan.FromHours(1));
                }

                return jurisdictions ?? new List<PACSJurisdiction>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available jurisdictions");
                return new List<PACSJurisdiction>();
            }
        }

        public async Task<PACSSystemStatus> GetSystemStatusAsync()
        {
            try
            {
                var url = "/api/v1/system/status";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var systemStatus = JsonSerializer.Deserialize<PACSSystemStatus>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return systemStatus ?? new PACSSystemStatus { IsOnline = false, LastHealthCheck = DateTime.UtcNow };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving PACS system status");
                return new PACSSystemStatus
                {
                    IsOnline = false,
                    LastHealthCheck = DateTime.UtcNow,
                    ServiceStatus = new Dictionary<string, bool> { { "API", false } }
                };
            }
        }

        public async Task<List<PACSPermit>> GetPermitsAsync(string jurisdiction, string parcelId)
        {
            try
            {
                var cacheKey = $"pacs:permits:{jurisdiction}:{parcelId}";
                var cachedPermits = await _cacheService.GetAsync<List<PACSPermit>>(cacheKey);

                if (cachedPermits != null)
                {
                    return cachedPermits;
                }

                var url = $"/api/v1/jurisdictions/{jurisdiction}/properties/{parcelId}/permits";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var permits = JsonSerializer.Deserialize<List<PACSPermit>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (permits != null)
                {
                    await _cacheService.SetAsync(cacheKey, permits, _cacheExpiration);
                }

                return permits ?? new List<PACSPermit>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving permits for parcel {ParcelId}", parcelId);
                return new List<PACSPermit>();
            }
        }

        public async Task<List<PACSTransaction>> GetRecentTransactionsAsync(string jurisdiction, DateTime? since = null)
        {
            try
            {
                var sinceParam = since?.ToString("yyyy-MM-ddTHH:mm:ssZ") ?? DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-ddTHH:mm:ssZ");
                var cacheKey = $"pacs:transactions:{jurisdiction}:{sinceParam}";
                var cachedTransactions = await _cacheService.GetAsync<List<PACSTransaction>>(cacheKey);

                if (cachedTransactions != null)
                {
                    return cachedTransactions;
                }

                var url = $"/api/v1/jurisdictions/{jurisdiction}/transactions?since={sinceParam}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var transactions = JsonSerializer.Deserialize<List<PACSTransaction>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (transactions != null)
                {
                    await _cacheService.SetAsync(cacheKey, transactions, TimeSpan.FromMinutes(5)); // Shorter cache for transactions
                }

                return transactions ?? new List<PACSTransaction>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent transactions for jurisdiction {Jurisdiction}", jurisdiction);
                return new List<PACSTransaction>();
            }
        }
    }
}
